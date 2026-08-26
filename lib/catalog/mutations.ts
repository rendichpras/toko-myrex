import "server-only"

import { and, eq } from "drizzle-orm"

import { PRODUCT_CURRENCY } from "@/lib/catalog/constants"
import type { ProductMutationResultDTO } from "@/lib/catalog/dto"
import {
  getProductPublicationIssues,
  type CreateProductValues,
  type ProductPublicationIssue,
  type UpdateProductValues,
} from "@/lib/catalog/validation"
import { db } from "@/lib/db"
import {
  product,
  productAsset,
  productMedia,
  productVariant,
} from "@/lib/db/schema/index"

export type CatalogMutationErrorCode =
  | "not_found"
  | "invalid_state"
  | "publication_incomplete"
  | "slug_conflict"
  | "sku_conflict"
  | "data_integrity"

export class CatalogMutationError extends Error {
  constructor(
    public readonly code: CatalogMutationErrorCode,
    message: string,
    public readonly publicationIssues: ProductPublicationIssue[] = []
  ) {
    super(message)
    this.name = "CatalogMutationError"
  }
}

function readDatabaseError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return null
  }

  const candidate = error as { code?: unknown; constraint?: unknown }

  return {
    code: typeof candidate.code === "string" ? candidate.code : null,
    constraint:
      typeof candidate.constraint === "string" ? candidate.constraint : null,
  }
}

async function withCatalogDatabaseErrors<T>(operation: () => Promise<T>) {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof CatalogMutationError) {
      throw error
    }

    const databaseError = readDatabaseError(error)

    if (databaseError?.code === "23505") {
      if (databaseError.constraint === "product_slug_uidx") {
        throw new CatalogMutationError(
          "slug_conflict",
          "Slug sudah digunakan oleh produk lain. Gunakan slug lain."
        )
      }

      if (databaseError.constraint === "product_variant_sku_uidx") {
        throw new CatalogMutationError(
          "sku_conflict",
          "SKU sudah digunakan oleh varian lain. Gunakan SKU lain."
        )
      }
    }

    throw error
  }
}

export async function createCatalogProduct(
  values: CreateProductValues,
  actorId: string
): Promise<ProductMutationResultDTO> {
  return withCatalogDatabaseErrors(() =>
    db.transaction(async (transaction) => {
      const [createdProduct] = await transaction
        .insert(product)
        .values({
          name: values.name,
          slug: values.slug,
          summary: values.summary,
          description: values.description,
          status: "draft",
          createdBy: actorId,
          updatedBy: actorId,
        })
        .returning({ id: product.id, status: product.status })

      if (!createdProduct) {
        throw new CatalogMutationError(
          "data_integrity",
          "Produk belum dibuat. Coba lagi."
        )
      }

      await transaction.insert(productVariant).values({
        productId: createdProduct.id,
        name: null,
        sku: values.sku,
        priceAmount: values.priceAmount,
        currency: PRODUCT_CURRENCY,
        isDefault: true,
        isActive: true,
        position: 0,
      })

      return createdProduct
    })
  )
}

export async function updateCatalogProduct(
  values: UpdateProductValues,
  actorId: string
): Promise<ProductMutationResultDTO> {
  return withCatalogDatabaseErrors(() =>
    db.transaction(async (transaction) => {
      const [currentProduct] = await transaction
        .select({ id: product.id, status: product.status })
        .from(product)
        .where(eq(product.id, values.productId))
        .for("update")
        .limit(1)

      if (!currentProduct) {
        throw new CatalogMutationError(
          "not_found",
          "Produk tidak ditemukan."
        )
      }

      if (currentProduct.status === "archived") {
        throw new CatalogMutationError(
          "invalid_state",
          "Kembalikan produk ke draf sebelum mengubahnya."
        )
      }

      if (currentProduct.status === "published") {
        const metadataIssues = getProductPublicationIssues({
          name: values.name,
          slug: values.slug,
          description: values.description,
          defaultVariant: {
            isActive: true,
            priceAmount: values.priceAmount,
          },
          hasReadyCover: true,
          hasReadyAsset: true,
        })

        if (metadataIssues.length > 0) {
          throw new CatalogMutationError(
            "publication_incomplete",
            "Perubahan belum dapat disimpan karena produk yang diterbitkan harus tetap lengkap.",
            metadataIssues
          )
        }
      }

      await transaction
        .update(product)
        .set({
          name: values.name,
          slug: values.slug,
          summary: values.summary,
          description: values.description,
          updatedBy: actorId,
        })
        .where(eq(product.id, values.productId))

      const [updatedVariant] = await transaction
        .update(productVariant)
        .set({
          sku: values.sku,
          priceAmount: values.priceAmount,
          currency: PRODUCT_CURRENCY,
          isActive: true,
        })
        .where(
          and(
            eq(productVariant.productId, values.productId),
            eq(productVariant.isDefault, true)
          )
        )
        .returning({ id: productVariant.id })

      if (!updatedVariant) {
        throw new CatalogMutationError(
          "data_integrity",
          "Harga produk belum diperbarui. Muat ulang halaman, lalu coba lagi."
        )
      }

      return {
        id: currentProduct.id,
        status: currentProduct.status,
      }
    })
  )
}

export async function publishCatalogProduct(
  productId: string,
  actorId: string
): Promise<ProductMutationResultDTO> {
  return withCatalogDatabaseErrors(() =>
    db.transaction(async (transaction) => {
      const [currentProduct] = await transaction
        .select({
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          status: product.status,
          publishedAt: product.publishedAt,
        })
        .from(product)
        .where(eq(product.id, productId))
        .for("update")
        .limit(1)

      if (!currentProduct) {
        throw new CatalogMutationError(
          "not_found",
          "Produk tidak ditemukan."
        )
      }

      if (currentProduct.status === "archived") {
        throw new CatalogMutationError(
          "invalid_state",
          "Kembalikan produk ke draf sebelum menerbitkannya."
        )
      }

      const [primaryVariant] = await transaction
        .select({
          isActive: productVariant.isActive,
          priceAmount: productVariant.priceAmount,
        })
        .from(productVariant)
        .where(
          and(
            eq(productVariant.productId, productId),
            eq(productVariant.isDefault, true)
          )
        )
        .limit(1)

      const [readyCover] = await transaction
        .select({ id: productMedia.id })
        .from(productMedia)
        .where(
          and(
            eq(productMedia.productId, productId),
            eq(productMedia.role, "cover"),
            eq(productMedia.status, "ready")
          )
        )
        .limit(1)

      const [readyAsset] = await transaction
        .select({ id: productAsset.id })
        .from(productAsset)
        .where(
          and(
            eq(productAsset.productId, productId),
            eq(productAsset.status, "ready")
          )
        )
        .limit(1)

      const publicationIssues = getProductPublicationIssues({
        name: currentProduct.name,
        slug: currentProduct.slug,
        description: currentProduct.description,
        defaultVariant: primaryVariant ?? null,
        hasReadyCover: Boolean(readyCover),
        hasReadyAsset: Boolean(readyAsset),
      })

      if (publicationIssues.length > 0) {
        throw new CatalogMutationError(
          "publication_incomplete",
          "Lengkapi persyaratan penerbitan sebelum menerbitkan produk.",
          publicationIssues
        )
      }

      if (currentProduct.status === "published") {
        return { id: currentProduct.id, status: currentProduct.status }
      }

      const [publishedProduct] = await transaction
        .update(product)
        .set({
          status: "published",
          publishedAt: currentProduct.publishedAt ?? new Date(),
          archivedAt: null,
          updatedBy: actorId,
        })
        .where(eq(product.id, productId))
        .returning({ id: product.id, status: product.status })

      if (!publishedProduct) {
        throw new CatalogMutationError(
          "not_found",
          "Produk tidak ditemukan."
        )
      }

      return publishedProduct
    })
  )
}

export async function archiveCatalogProduct(
  productId: string,
  actorId: string
): Promise<ProductMutationResultDTO> {
  return db.transaction(async (transaction) => {
    const [currentProduct] = await transaction
      .select({ id: product.id, status: product.status })
      .from(product)
      .where(eq(product.id, productId))
      .for("update")
      .limit(1)

    if (!currentProduct) {
      throw new CatalogMutationError("not_found", "Produk tidak ditemukan.")
    }

    if (currentProduct.status === "archived") {
      return currentProduct
    }

    const [archivedProduct] = await transaction
      .update(product)
      .set({
        status: "archived",
        archivedAt: new Date(),
        updatedBy: actorId,
      })
      .where(eq(product.id, productId))
      .returning({ id: product.id, status: product.status })

    return archivedProduct ?? currentProduct
  })
}

export async function restoreCatalogProduct(
  productId: string,
  actorId: string
): Promise<ProductMutationResultDTO> {
  return db.transaction(async (transaction) => {
    const [currentProduct] = await transaction
      .select({ id: product.id, status: product.status })
      .from(product)
      .where(eq(product.id, productId))
      .for("update")
      .limit(1)

    if (!currentProduct) {
      throw new CatalogMutationError("not_found", "Produk tidak ditemukan.")
    }

    if (currentProduct.status === "draft") {
      return currentProduct
    }

    if (currentProduct.status === "published") {
      throw new CatalogMutationError(
        "invalid_state",
        "Produk sudah diterbitkan. Arsipkan produk sebelum mengembalikannya ke draf."
      )
    }

    const [restoredProduct] = await transaction
      .update(product)
      .set({
        status: "draft",
        archivedAt: null,
        updatedBy: actorId,
      })
      .where(eq(product.id, productId))
      .returning({ id: product.id, status: product.status })

    return restoredProduct ?? currentProduct
  })
}
