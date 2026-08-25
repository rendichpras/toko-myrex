import "server-only"

import { createHash, randomUUID } from "node:crypto"

import { fileTypeFromBuffer } from "file-type"
import sharp from "sharp"
import { and, desc, eq } from "drizzle-orm"

import { requireAdmin } from "@/lib/auth/session"
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
  getObject,
  headObject,
  isAssetScannerConfigured,
  putObject,
  scanChunksForMalware,
} from "@/lib/storage"
import {
  COVER_MAX_BYTES,
  completeUploadSchema,
  createUploadIntentSchema,
  mimeTypesMatch,
  normalizeMimeType,
  removeUploadSchema,
  validateUploadRequest,
  type CompleteUploadInput,
  type CreateUploadIntentInput,
} from "@/lib/storage/validation"

export class CatalogUploadError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid_file"
      | "invalid_state"
      | "not_ready"
      | "temporary_failure" = "invalid_state",
    public readonly retryable = false
  ) {
    super(message)
    this.name = "CatalogUploadError"
  }
}

type UploadIntentDTO = {
  uploadId: string
  uploadUrl: string
  contentType: string
}

type CompletedUploadDTO = {
  uploadId: string
  status: "ready"
}

const maximumCoverDimension = 12_000
const maximumCoverPixels = 40_000_000

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

  await deleteObject("private", storageKey).catch(() => undefined)
}

function verificationError(message: string) {
  return new CatalogUploadError(
    `${message} Pilih file lain, lalu coba lagi.`,
    "invalid_file"
  )
}

async function sanitizeCoverImage(bytes: Uint8Array, mimeType: string) {
  try {
    const image = await sharp(bytes).metadata()

    if (!image.width || !image.height) {
      throw verificationError("Dimensi gambar tidak dapat dibaca.")
    }

    if (
      image.width > maximumCoverDimension ||
      image.height > maximumCoverDimension ||
      image.width * image.height > maximumCoverPixels
    ) {
      throw verificationError("Dimensi gambar terlalu besar.")
    }

    if ((image.pages ?? 1) > 1) {
      throw verificationError("Gambar animasi tidak didukung.")
    }

    const pipeline = sharp(bytes).autoOrient()
    let extension: "jpg" | "png" | "webp"

    switch (mimeType) {
      case "image/jpeg":
        pipeline.jpeg({ quality: 90, progressive: true })
        extension = "jpg"
        break
      case "image/png":
        pipeline.png({ compressionLevel: 9 })
        extension = "png"
        break
      case "image/webp":
        pipeline.webp({ quality: 90 })
        extension = "webp"
        break
      default:
        throw verificationError("Jenis gambar tidak didukung.")
    }

    const sanitized = await pipeline.toBuffer({ resolveWithObject: true })

    if (sanitized.data.byteLength > COVER_MAX_BYTES) {
      throw verificationError("Ukuran gambar setelah diproses terlalu besar.")
    }

    return { ...sanitized, extension }
  } catch (error) {
    if (error instanceof CatalogUploadError) {
      throw error
    }

    throw verificationError("Data gambar tidak dapat diproses.")
  }
}

async function verifyObjectMetadata({
  storageKey,
  expectedSize,
  expectedMimeType,
}: {
  storageKey: string
  expectedSize: number
  expectedMimeType: string
}) {
  let metadata

  try {
    metadata = await headObject("private", storageKey)
  } catch {
    throw new CatalogUploadError(
      "Unggahan belum ditemukan. Unggah file lagi, lalu coba verifikasi.",
      "not_ready",
      true
    )
  }

  if (metadata.ContentLength !== expectedSize) {
    throw verificationError("Ukuran file yang diterima tidak sesuai.")
  }

  const storedMimeType = normalizeMimeType(metadata.ContentType)

  if (storedMimeType !== expectedMimeType) {
    throw verificationError("Jenis file yang diterima tidak sesuai.")
  }

  if (!metadata.ETag) {
    throw new CatalogUploadError(
      "Identitas file belum tersedia. Coba verifikasi lagi.",
      "not_ready",
      true
    )
  }

  return metadata
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
    await verifyObjectMetadata({
      storageKey: upload.storageKey,
      expectedSize: upload.fileSize,
      expectedMimeType: upload.mimeType,
    })

    const object = await getObject("private", upload.storageKey)

    if (!object.Body) {
      throw verificationError("Isi gambar tidak dapat dibaca.")
    }

    const bytes = await object.Body.transformToByteArray()

    if (bytes.byteLength !== upload.fileSize) {
      throw verificationError("Ukuran gambar yang dibaca tidak sesuai.")
    }
    const detected = await fileTypeFromBuffer(bytes)

    if (!detected || !mimeTypesMatch(upload.mimeType, detected.mime)) {
      throw verificationError("Signature gambar tidak sesuai.")
    }

    const sanitized = await sanitizeCoverImage(bytes, detected.mime)
    const readyStorageKey = `products/${productId}/covers/${randomUUID()}.${sanitized.extension}`

    await putObject(
      "media",
      readyStorageKey,
      sanitized.data,
      detected.mime
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
            fileSize: sanitized.data.byteLength,
            width: sanitized.info.width,
            height: sanitized.info.height,
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
      await deleteObject("media", readyStorageKey).catch(() => undefined)
      throw error
    }

    await Promise.allSettled([
      deleteObject("private", upload.storageKey),
      ...previousCoverKeys.map((key) => deleteObject("media", key)),
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

async function readAssetSignatureChecksumAndScan(storageKey: string) {
  const object = await getObject("private", storageKey)

  if (!object.Body) {
    throw verificationError("Isi file tidak dapat dibaca.")
  }

  const hash = createHash("sha256")
  const signatureChunks: Uint8Array[] = []
  let signatureLength = 0
  let bytesRead = 0

  const malwareScan = await scanChunksForMalware(
    object.Body as AsyncIterable<Uint8Array>,
    (chunk) => {
      hash.update(chunk)
      bytesRead += chunk.byteLength

      if (signatureLength < 8192) {
        const remaining = 8192 - signatureLength
        const part = chunk.subarray(0, remaining)
        signatureChunks.push(part)
        signatureLength += part.byteLength
      }
    }
  )

  const signature = new Uint8Array(signatureLength)
  let offset = 0

  for (const chunk of signatureChunks) {
    signature.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return {
      detected: await fileTypeFromBuffer(signature),
      checksum: hash.digest("hex"),
      bytesRead,
      malwareScan,
    }
  } catch {
    throw verificationError("Signature file tidak dapat dibaca.")
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
    if (!isAssetScannerConfigured()) {
      throw new CatalogUploadError(
        "Pemindai malware belum tersedia. Hubungi pengelola sistem.",
        "temporary_failure",
        true
      )
    }

    const metadata = await verifyObjectMetadata({
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
        throw verificationError("File berubah selama verifikasi.")
      }

      throw error
    }

    const { detected, checksum, bytesRead, malwareScan } =
      await readAssetSignatureChecksumAndScan(readyKey)

    if (bytesRead !== upload.fileSize) {
      throw verificationError("Ukuran file yang dibaca tidak sesuai.")
    }

    if (!detected || !mimeTypesMatch(upload.mimeType, detected.mime)) {
      throw verificationError("Signature file tidak sesuai.")
    }

    if (malwareScan.status === "infected") {
      throw verificationError("Pemindai malware menolak file.")
    }

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
      await deleteObject("private", readyKey).catch(() => undefined)
      throw error
    }

    await deleteObject("private", upload.storageKey).catch(() => undefined)

    return { uploadId: upload.id, status: "ready" }
  } catch (error) {
    if (readyStorageKey) {
      await deleteObject("private", readyStorageKey).catch(() => undefined)
    }

    if (error instanceof CatalogUploadError && error.code === "invalid_file") {
      await markRejected("asset", upload.id, upload.storageKey, error.message)
      throw error
    }

    if (error instanceof CatalogUploadError) {
      throw error
    }

    console.error("Pemindaian atau pemindahan file produk gagal.", error)
    throw new CatalogUploadError(
      "File belum dapat diverifikasi. Coba lagi.",
      "temporary_failure",
      true
    )
  }
}

export async function createCatalogUploadIntent(
  input: CreateUploadIntentInput
): Promise<UploadIntentDTO> {
  await requireAdmin("/admin/produk")
  const values = createUploadIntentSchema.parse(input)
  const validation = validateUploadRequest(values)

  if (!validation.success) {
    throw new CatalogUploadError(validation.message)
  }

  if (values.kind === "asset" && !isAssetScannerConfigured()) {
    throw new CatalogUploadError(
      "Pemindai malware belum dikonfigurasi.",
      "invalid_state"
    )
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
  input: CompleteUploadInput
): Promise<CompletedUploadDTO> {
  const session = await requireAdmin("/admin/produk")
  const values = completeUploadSchema.parse(input)

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

    return verifyCover(upload, values.productId, session.user.id)
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

  return verifyAsset(upload, values.productId, session.user.id)
}

export async function removeCatalogUpload(input: CompleteUploadInput) {
  const session = await requireAdmin("/admin/produk")
  const values = removeUploadSchema.parse(input)

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
        .set({ updatedBy: session.user.id, updatedAt: new Date() })
        .where(eq(product.id, values.productId))

      return {
        bucket: upload.status === "ready" ? ("media" as const) : ("private" as const),
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
      .set({ updatedBy: session.user.id, updatedAt: new Date() })
      .where(eq(product.id, values.productId))

    return {
      bucket: "private" as const,
      storageKey: upload.storageKey,
      deleteObject: upload.status !== "ready",
    }
  })

  if (removal.deleteObject) {
    await deleteObject(removal.bucket, removal.storageKey).catch((error) => {
      console.error("Objek R2 yang diarsipkan gagal dihapus.", error)
    })
  }

  return { uploadId: values.uploadId, status: "archived" as const }
}
