import "server-only"

import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"

import { requireAdmin } from "@/lib/auth/session"
import type {
  ProductDetailDTO,
  ProductListDTO,
} from "@/lib/catalog/dto"
import {
  getProductPublicationIssues,
  productIdSchema,
  productListQuerySchema,
  type ProductListQuery,
  type ProductListQueryInput,
} from "@/lib/catalog/validation"
import { db } from "@/lib/db"
import {
  product,
  productAsset,
  productMedia,
  productVariant,
} from "@/lib/db/schema/index"
import { getPublicMediaUrl } from "@/lib/storage"

const defaultVariant = alias(productVariant, "default_variant")
const coverMedia = alias(productMedia, "cover_media")
const searchVariant = alias(productVariant, "search_variant")

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}

function buildProductListCondition(input: ProductListQuery) {
  const conditions: SQL[] = []

  if (input.status) {
    conditions.push(eq(product.status, input.status))
  }

  if (input.query) {
    const pattern = `%${escapeLikePattern(input.query)}%`

    conditions.push(
      or(
        ilike(product.name, pattern),
        ilike(product.slug, pattern),
        exists(
          db
            .select({ id: searchVariant.id })
            .from(searchVariant)
            .where(
              and(
                eq(searchVariant.productId, product.id),
                ilike(searchVariant.sku, pattern)
              )
            )
        )
      )!
    )
  }

  return and(...conditions)
}

function getProductListOrder(input: ProductListQuery): SQL[] {
  switch (input.sort) {
    case "updated-asc":
      return [asc(product.updatedAt), asc(product.id)]
    case "name-asc":
      return [asc(product.name), asc(product.id)]
    case "name-desc":
      return [desc(product.name), asc(product.id)]
    case "price-asc":
      return [
        sql`${defaultVariant.priceAmount} asc nulls last`,
        asc(product.id),
      ]
    case "price-desc":
      return [
        sql`${defaultVariant.priceAmount} desc nulls last`,
        asc(product.id),
      ]
    case "updated-desc":
      return [desc(product.updatedAt), asc(product.id)]
  }
}

function serializeDate(value: Date) {
  return value.toISOString()
}

function serializeNullableDate(value: Date | null) {
  return value?.toISOString() ?? null
}

export async function listAdminProducts(
  input: ProductListQueryInput = {}
): Promise<ProductListDTO> {
  await requireAdmin("/admin/produk")

  const query = productListQuerySchema.parse(input)
  const condition = buildProductListCondition(query)
  const offset = (query.page - 1) * query.pageSize

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: product.id,
        name: product.name,
        slug: product.slug,
        summary: product.summary,
        status: product.status,
        updatedAt: product.updatedAt,
        variantId: defaultVariant.id,
        sku: defaultVariant.sku,
        priceAmount: defaultVariant.priceAmount,
        currency: defaultVariant.currency,
        coverStorageKey: coverMedia.storageKey,
        coverAltText: coverMedia.altText,
      })
      .from(product)
      .leftJoin(
        defaultVariant,
        and(
          eq(defaultVariant.productId, product.id),
          eq(defaultVariant.isDefault, true)
        )
      )
      .leftJoin(
        coverMedia,
        and(
          eq(coverMedia.productId, product.id),
          eq(coverMedia.role, "cover"),
          eq(coverMedia.status, "ready")
        )
      )
      .where(condition)
      .orderBy(...getProductListOrder(query))
      .limit(query.pageSize)
      .offset(offset),
    db.select({ value: count() }).from(product).where(condition),
  ])

  const totalItems = totalRow?.value ?? 0

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      summary: row.summary,
      status: row.status,
      updatedAt: serializeDate(row.updatedAt),
      defaultVariant:
        row.variantId === null ||
        row.priceAmount === null ||
        row.currency === null
          ? null
          : {
              id: row.variantId,
              sku: row.sku,
              priceAmount: row.priceAmount,
              currency: row.currency,
            },
      cover: row.coverStorageKey
        ? {
            publicUrl: getPublicMediaUrl(row.coverStorageKey),
            altText: row.coverAltText,
          }
        : null,
    })),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize)),
    },
  }
}

export async function getAdminProduct(
  productId: string
): Promise<ProductDetailDTO | null> {
  await requireAdmin("/admin/produk")

  const id = productIdSchema.parse(productId)
  const [productRow] = await db
    .select({
      id: product.id,
      name: product.name,
      slug: product.slug,
      summary: product.summary,
      description: product.description,
      status: product.status,
      publishedAt: product.publishedAt,
      archivedAt: product.archivedAt,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })
    .from(product)
    .where(eq(product.id, id))
    .limit(1)

  if (!productRow) {
    return null
  }

  const [variantRows, coverRows, assetRows] = await Promise.all([
    db
      .select({
        id: productVariant.id,
        name: productVariant.name,
        sku: productVariant.sku,
        priceAmount: productVariant.priceAmount,
        currency: productVariant.currency,
        isDefault: productVariant.isDefault,
        isActive: productVariant.isActive,
        position: productVariant.position,
        createdAt: productVariant.createdAt,
        updatedAt: productVariant.updatedAt,
      })
      .from(productVariant)
      .where(
        and(
          eq(productVariant.productId, id),
          eq(productVariant.isDefault, true)
        )
      )
      .limit(1),
    db
      .select({
        id: productMedia.id,
        role: productMedia.role,
        storageKey: productMedia.storageKey,
        mimeType: productMedia.mimeType,
        fileSize: productMedia.fileSize,
        width: productMedia.width,
        height: productMedia.height,
        altText: productMedia.altText,
        rejectionReason: productMedia.rejectionReason,
        position: productMedia.position,
        status: productMedia.status,
        createdAt: productMedia.createdAt,
        updatedAt: productMedia.updatedAt,
      })
      .from(productMedia)
      .where(
        and(eq(productMedia.productId, id), eq(productMedia.role, "cover"))
      )
      .orderBy(desc(productMedia.createdAt)),
    db
      .select({
        id: productAsset.id,
        storageKey: productAsset.storageKey,
        downloadName: productAsset.downloadName,
        originalName: productAsset.originalName,
        mimeType: productAsset.mimeType,
        fileSize: productAsset.fileSize,
        rejectionReason: productAsset.rejectionReason,
        version: productAsset.version,
        status: productAsset.status,
        createdAt: productAsset.createdAt,
        updatedAt: productAsset.updatedAt,
      })
      .from(productAsset)
      .where(eq(productAsset.productId, id))
      .orderBy(desc(productAsset.version), asc(productAsset.createdAt)),
  ])

  const primaryVariant = variantRows[0] ?? null
  const publicationIssues = getProductPublicationIssues({
    name: productRow.name,
    slug: productRow.slug,
    description: productRow.description,
    defaultVariant: primaryVariant
      ? {
          isActive: primaryVariant.isActive,
          priceAmount: primaryVariant.priceAmount,
        }
      : null,
    hasReadyCover: coverRows.some((media) => media.status === "ready"),
    hasReadyAsset: assetRows.some((asset) => asset.status === "ready"),
  })

  return {
    ...productRow,
    publishedAt: serializeNullableDate(productRow.publishedAt),
    archivedAt: serializeNullableDate(productRow.archivedAt),
    createdAt: serializeDate(productRow.createdAt),
    updatedAt: serializeDate(productRow.updatedAt),
    defaultVariant: primaryVariant
      ? {
          ...primaryVariant,
          createdAt: serializeDate(primaryVariant.createdAt),
          updatedAt: serializeDate(primaryVariant.updatedAt),
        }
      : null,
    covers: coverRows.map((media) => ({
      ...media,
      publicUrl:
        media.status === "ready"
          ? getPublicMediaUrl(media.storageKey)
          : null,
      createdAt: serializeDate(media.createdAt),
      updatedAt: serializeDate(media.updatedAt),
    })),
    assets: assetRows.map((asset) => ({
      ...asset,
      createdAt: serializeDate(asset.createdAt),
      updatedAt: serializeDate(asset.updatedAt),
    })),
    publicationIssues,
  }
}
