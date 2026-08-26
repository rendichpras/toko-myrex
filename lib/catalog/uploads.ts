import "server-only"

import { randomUUID } from "node:crypto"

import { and, desc, eq } from "drizzle-orm"

import {
  CatalogUploadError,
  verifyAssetContent,
  verifyCoverUpload,
  verifyStagedObjectMetadata,
} from "@/lib/catalog/upload-verification"
import { db } from "@/lib/db"
import {
  product,
  productAsset,
  productMedia,
} from "@/lib/db/schema/index"
import {
  copyPrivateObject,
  createPresignedUpload,
  deleteObject,
  putObject,
  type StorageBucket,
} from "@/lib/storage"
import {
  validateUploadRequest,
  type CompleteUpload,
  type CreateUploadIntent,
} from "@/lib/storage/validation"

export { CatalogUploadError } from "@/lib/catalog/upload-verification"

type UploadIntentDTO = {
  uploadId: string
  uploadUrl: string
  contentType: string
}

type CompletedUploadDTO = {
  uploadId: string
  status: "ready"
}

function createStorageKey({
  productId,
  kind,
  extension,
}: {
  productId: string
  kind: "cover" | "asset"
  extension: string
}) {
  const folder = kind === "cover" ? "covers" : "assets"
  return `staging/products/${productId}/${folder}/${randomUUID()}.${extension}`
}

async function deleteObjectBestEffort(
  bucket: StorageBucket,
  storageKey: string,
  operation: string
) {
  try {
    await deleteObject(bucket, storageKey)
  } catch (error) {
    console.error(operation, { bucket, storageKey, error })
  }
}

async function ensureMutableProduct(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  productId: string
) {
  const [currentProduct] = await transaction
    .select({ id: product.id, status: product.status })
    .from(product)
    .where(eq(product.id, productId))
    .for("update")
    .limit(1)

  if (!currentProduct) {
    throw new CatalogUploadError("Produk tidak ditemukan.")
  }

  if (currentProduct.status === "archived") {
    throw new CatalogUploadError(
      "Kembalikan produk ke draf sebelum mengelola file."
    )
  }

  return currentProduct
}

async function markRejected(
  kind: "cover" | "asset",
  uploadId: string,
  storageKey: string,
  reason: string
) {
  const table = kind === "cover" ? productMedia : productAsset

  await db
    .update(table)
    .set({
      status: "rejected",
      rejectionReason: reason.slice(0, 500),
      updatedAt: new Date(),
    })
    .where(eq(table.id, uploadId))

  await deleteObjectBestEffort(
    "private",
    storageKey,
    "Objek staging yang ditolak gagal dihapus."
  )
}

async function verifyCover(
  upload: {
    id: string
    storageKey: string
    mimeType: string
    fileSize: number
  },
  productId: string,
  userId: string
): Promise<CompletedUploadDTO> {
  try {
    const verified = await verifyCoverUpload({
      storageKey: upload.storageKey,
      expectedSize: upload.fileSize,
      expectedMimeType: upload.mimeType,
    })
    const readyStorageKey = `products/${productId}/covers/${randomUUID()}.${verified.extension}`

    await putObject(
      "media",
      readyStorageKey,
      verified.data,
      verified.mimeType
    )

    let previousCoverKeys: string[] = []

    try {
      previousCoverKeys = await db.transaction(async (transaction) => {
        await ensureMutableProduct(transaction, productId)

        const previousCovers = await transaction
          .select({ storageKey: productMedia.storageKey })
          .from(productMedia)
          .where(
            and(
              eq(productMedia.productId, productId),
              eq(productMedia.role, "cover"),
              eq(productMedia.status, "ready")
            )
          )

        await transaction
          .update(productMedia)
          .set({ status: "archived", updatedAt: new Date() })
          .where(
            and(
              eq(productMedia.productId, productId),
              eq(productMedia.role, "cover"),
              eq(productMedia.status, "ready")
            )
          )

        const [readyCover] = await transaction
          .update(productMedia)
          .set({
            storageKey: readyStorageKey,
            fileSize: verified.data.byteLength,
            width: verified.width,
            height: verified.height,
            rejectionReason: null,
            status: "ready",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productMedia.id, upload.id),
              eq(productMedia.productId, productId),
              eq(productMedia.status, "pending")
            )
          )
          .returning({ id: productMedia.id })

        if (!readyCover) {
          throw new CatalogUploadError(
            "Unggahan sampul sudah diproses. Muat ulang halaman."
          )
        }

        await transaction
          .update(product)
          .set({ updatedBy: userId, updatedAt: new Date() })
          .where(eq(product.id, productId))

        return previousCovers.map((cover) => cover.storageKey)
      })
    } catch (error) {
      await deleteObjectBestEffort(
        "media",
        readyStorageKey,
        "Sampul terverifikasi gagal dibersihkan setelah transaksi gagal."
      )
      throw error
    }

    await Promise.all([
      deleteObjectBestEffort(
        "private",
        upload.storageKey,
        "Objek staging sampul gagal dihapus setelah verifikasi."
      ),
      ...previousCoverKeys.map((storageKey) =>
        deleteObjectBestEffort(
          "media",
          storageKey,
          "Sampul lama gagal dihapus setelah penggantian."
        )
      ),
    ])

    return { uploadId: upload.id, status: "ready" }
  } catch (error) {
    if (
      error instanceof CatalogUploadError && error.code === "invalid_file"
    ) {
      await markRejected("cover", upload.id, upload.storageKey, error.message)
    }

    throw error
  }
}

async function verifyAsset(
  upload: {
    id: string
    storageKey: string
    mimeType: string
    fileSize: number
  },
  productId: string,
  userId: string
): Promise<CompletedUploadDTO> {
  let readyStorageKey: string | null = null

  try {
    const metadata = await verifyStagedObjectMetadata({
      storageKey: upload.storageKey,
      expectedSize: upload.fileSize,
      expectedMimeType: upload.mimeType,
    })

    const extension = upload.storageKey.split(".").at(-1) ?? "bin"
    const readyKey = `products/${productId}/assets/${randomUUID()}.${extension}`
    readyStorageKey = readyKey

    try {
      await copyPrivateObject(
        upload.storageKey,
        "private",
        readyKey,
        metadata.ETag!
      )
    } catch (error) {
      const statusCode =
        typeof error === "object" && error !== null && "$metadata" in error
          ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata
              ?.httpStatusCode
          : undefined

      if (statusCode === 412) {
        throw new CatalogUploadError(
          "File berubah selama verifikasi. Pilih file lain, lalu coba lagi.",
          "invalid_file"
        )
      }

      throw error
    }

    const { checksum } = await verifyAssetContent({
      storageKey: readyKey,
      expectedSize: upload.fileSize,
      expectedMimeType: upload.mimeType,
    })

    try {
      await db.transaction(async (transaction) => {
        await ensureMutableProduct(transaction, productId)

        const [readyAsset] = await transaction
          .update(productAsset)
          .set({
            storageKey: readyKey,
            checksumSha256: checksum,
            rejectionReason: null,
            status: "ready",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productAsset.id, upload.id),
              eq(productAsset.productId, productId),
              eq(productAsset.status, "pending")
            )
          )
          .returning({ id: productAsset.id })

        if (!readyAsset) {
          throw new CatalogUploadError(
            "Unggahan file sudah diproses. Muat ulang halaman."
          )
        }

        await transaction
          .update(product)
          .set({ updatedBy: userId, updatedAt: new Date() })
          .where(eq(product.id, productId))
      })
    } catch (error) {
      await deleteObjectBestEffort(
        "private",
        readyKey,
        "Salinan file produk gagal dibersihkan setelah transaksi gagal."
      )
      throw error
    }

    await deleteObjectBestEffort(
      "private",
      upload.storageKey,
      "Objek staging file produk gagal dihapus setelah verifikasi."
    )

    return { uploadId: upload.id, status: "ready" }
  } catch (error) {
    if (readyStorageKey) {
      await deleteObjectBestEffort(
        "private",
        readyStorageKey,
        "Salinan file produk gagal dibersihkan setelah verifikasi gagal."
      )
    }

    if (error instanceof CatalogUploadError && error.code === "invalid_file") {
      await markRejected("asset", upload.id, upload.storageKey, error.message)
      throw error
    }

    if (error instanceof CatalogUploadError) {
      throw error
    }

    console.error("Verifikasi atau pemindahan file produk gagal.", error)
    throw new CatalogUploadError(
      "File belum dapat diverifikasi. Coba lagi.",
      "temporary_failure",
      true
    )
  }
}

export async function createCatalogUploadIntent(
  values: CreateUploadIntent
): Promise<UploadIntentDTO> {
  const validation = validateUploadRequest(values)

  if (!validation.success) {
    throw new CatalogUploadError(validation.message)
  }

  const storageKey = createStorageKey({
    productId: values.productId,
    kind: values.kind,
    extension: validation.extension,
  })

  const pendingUpload = await db.transaction(async (transaction) => {
    await ensureMutableProduct(transaction, values.productId)

    if (values.kind === "cover") {
      const [createdMedia] = await transaction
        .insert(productMedia)
        .values({
          productId: values.productId,
          role: "cover",
          storageKey,
          mimeType: values.mimeType,
          fileSize: values.fileSize,
          altText: values.altText,
          position: 0,
          status: "pending",
        })
        .returning({ id: productMedia.id })

      return createdMedia
    }

    const [latestAsset] = await transaction
      .select({ version: productAsset.version })
      .from(productAsset)
      .where(eq(productAsset.productId, values.productId))
      .orderBy(desc(productAsset.version))
      .limit(1)

    const [createdAsset] = await transaction
      .insert(productAsset)
      .values({
        productId: values.productId,
        storageKey,
        downloadName: values.downloadName,
        originalName: values.originalName,
        mimeType: values.mimeType,
        fileSize: values.fileSize,
        version: (latestAsset?.version ?? 0) + 1,
        status: "pending",
      })
      .returning({ id: productAsset.id })

    return createdAsset
  })

  if (!pendingUpload) {
    throw new CatalogUploadError("Unggahan belum disiapkan. Coba lagi.")
  }

  try {
    const uploadUrl = await createPresignedUpload({
      key: storageKey,
      contentType: values.mimeType,
    })

    return {
      uploadId: pendingUpload.id,
      uploadUrl,
      contentType: values.mimeType,
    }
  } catch (error) {
    await markRejected(
      values.kind,
      pendingUpload.id,
      storageKey,
      "URL unggahan tidak dapat dibuat."
    )
    console.error("URL upload R2 gagal dibuat.", error)
    throw new CatalogUploadError("Unggahan belum dapat dimulai. Coba lagi.")
  }
}

export async function completeCatalogUpload(
  values: CompleteUpload,
  actorId: string
): Promise<CompletedUploadDTO> {
  if (values.kind === "cover") {
    const [upload] = await db
      .select({
        id: productMedia.id,
        storageKey: productMedia.storageKey,
        mimeType: productMedia.mimeType,
        fileSize: productMedia.fileSize,
        status: productMedia.status,
      })
      .from(productMedia)
      .where(
        and(
          eq(productMedia.id, values.uploadId),
          eq(productMedia.productId, values.productId),
          eq(productMedia.role, "cover")
        )
      )
      .limit(1)

    if (!upload) {
      throw new CatalogUploadError("Unggahan sampul tidak ditemukan.")
    }

    if (upload.status === "ready") {
      return { uploadId: upload.id, status: "ready" }
    }

    if (upload.status !== "pending") {
      throw new CatalogUploadError("Unggahan sampul tidak dapat diproses lagi.")
    }

    return verifyCover(upload, values.productId, actorId)
  }

  const [upload] = await db
    .select({
      id: productAsset.id,
      storageKey: productAsset.storageKey,
      mimeType: productAsset.mimeType,
      fileSize: productAsset.fileSize,
      status: productAsset.status,
    })
    .from(productAsset)
    .where(
      and(
        eq(productAsset.id, values.uploadId),
        eq(productAsset.productId, values.productId)
      )
    )
    .limit(1)

  if (!upload) {
    throw new CatalogUploadError("Unggahan file tidak ditemukan.")
  }

  if (upload.status === "ready") {
    return { uploadId: upload.id, status: "ready" }
  }

  if (upload.status !== "pending") {
    throw new CatalogUploadError("Unggahan file tidak dapat diproses lagi.")
  }

  return verifyAsset(upload, values.productId, actorId)
}

export async function removeCatalogUpload(
  values: CompleteUpload,
  actorId: string
) {
  const removal = await db.transaction(async (transaction) => {
    const currentProduct = await ensureMutableProduct(
      transaction,
      values.productId
    )

    if (values.kind === "cover") {
      const [upload] = await transaction
        .select({
          storageKey: productMedia.storageKey,
          status: productMedia.status,
        })
        .from(productMedia)
        .where(
          and(
            eq(productMedia.id, values.uploadId),
            eq(productMedia.productId, values.productId),
            eq(productMedia.role, "cover")
          )
        )
        .limit(1)

      if (!upload) {
        throw new CatalogUploadError("Sampul tidak ditemukan.")
      }

      if (currentProduct.status === "published" && upload.status === "ready") {
        throw new CatalogUploadError(
          "Ganti sampul sebelum menghapus sampul produk yang diterbitkan."
        )
      }

      await transaction
        .update(productMedia)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(productMedia.id, values.uploadId))

      await transaction
        .update(product)
        .set({ updatedBy: actorId, updatedAt: new Date() })
        .where(eq(product.id, values.productId))

      return {
        bucket:
          upload.status === "ready" ? ("media" as const) : ("private" as const),
        storageKey: upload.storageKey,
        deleteObject: true,
      }
    }

    const [upload] = await transaction
      .select({
        storageKey: productAsset.storageKey,
        status: productAsset.status,
      })
      .from(productAsset)
      .where(
        and(
          eq(productAsset.id, values.uploadId),
          eq(productAsset.productId, values.productId)
        )
      )
      .limit(1)

    if (!upload) {
      throw new CatalogUploadError("File produk tidak ditemukan.")
    }

    if (currentProduct.status === "published" && upload.status === "ready") {
      const readyAssets = await transaction
        .select({ id: productAsset.id })
        .from(productAsset)
        .where(
          and(
            eq(productAsset.productId, values.productId),
            eq(productAsset.status, "ready")
          )
        )

      if (readyAssets.length <= 1) {
        throw new CatalogUploadError(
          "Tambahkan file pengganti sebelum menghapus file produk yang diterbitkan."
        )
      }
    }

    await transaction
      .update(productAsset)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(productAsset.id, values.uploadId))

    await transaction
      .update(product)
      .set({ updatedBy: actorId, updatedAt: new Date() })
      .where(eq(product.id, values.productId))

    return {
      bucket: "private" as const,
      storageKey: upload.storageKey,
      deleteObject: upload.status !== "ready",
    }
  })

  if (removal.deleteObject) {
    await deleteObjectBestEffort(
      removal.bucket,
      removal.storageKey,
      "Objek R2 yang diarsipkan gagal dihapus."
    )
  }

  return { uploadId: values.uploadId, status: "archived" as const }
}
