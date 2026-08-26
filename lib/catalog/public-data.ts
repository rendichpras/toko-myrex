import "server-only"

import { and, asc, desc, eq, exists, isNotNull, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"

import { PRODUCT_CURRENCY } from "@/lib/catalog/constants"
import type {
  PublicProductDetailDTO,
  PublicProductListItemDTO,
} from "@/lib/catalog/dto"
import { getCanonicalPublicProductSlug } from "@/lib/catalog/validation"
import { db } from "@/lib/db"
import {
  product,
  productAsset,
  productMedia,
  productVariant,
} from "@/lib/db/schema/index"
import { getPublicMediaUrl } from "@/lib/storage"

const publicDefaultVariant = alias(
  productVariant,
  "public_default_variant"
)
const publicCover = alias(productMedia, "public_cover")
const activeDefaultVariantCondition = and(
  eq(publicDefaultVariant.productId, product.id),
  eq(publicDefaultVariant.isDefault, true),
  eq(publicDefaultVariant.isActive, true),
  eq(publicDefaultVariant.currency, PRODUCT_CURRENCY)
)
const readyCoverCondition = and(
  eq(publicCover.productId, product.id),
  eq(publicCover.role, "cover"),
  eq(publicCover.status, "ready"),
  isNotNull(publicCover.width),
  isNotNull(publicCover.height)
)

type PublicProductListRow = {
  name: string
  slug: string
  summary: string | null
  priceAmount: number
  currency: string
  coverStorageKey: string
  coverWidth: number | null
  coverHeight: number | null
  coverAltText: string | null
}

type PublicProductDetailRow = PublicProductListRow & {
  description: string | null
  publishedAt: Date | null
}

function getPublishedProductCondition(slug?: string) {
  const conditions = [
    eq(product.status, "published"),
    isNotNull(product.publishedAt),
    isNotNull(product.description),
    sql`length(btrim(${product.name})) > 0`,
    sql`length(btrim(${product.description})) > 0`,
    exists(
      db
        .select({ id: productAsset.id })
        .from(productAsset)
        .where(
          and(
            eq(productAsset.productId, product.id),
            eq(productAsset.status, "ready")
          )
        )
    ),
  ]

  if (slug !== undefined) {
    conditions.push(eq(product.slug, slug))
  }

  return and(...conditions)
}

export function buildPublicProductListQuery() {
  return db
    .select({
      name: product.name,
      slug: product.slug,
      summary: product.summary,
      priceAmount: publicDefaultVariant.priceAmount,
      currency: publicDefaultVariant.currency,
      coverStorageKey: publicCover.storageKey,
      coverWidth: publicCover.width,
      coverHeight: publicCover.height,
      coverAltText: publicCover.altText,
    })
    .from(product)
    .innerJoin(publicDefaultVariant, activeDefaultVariantCondition)
    .innerJoin(publicCover, readyCoverCondition)
    .where(getPublishedProductCondition())
    .orderBy(desc(product.publishedAt), asc(product.id))
}

export function buildPublicProductDetailQuery(slug: string) {
  return db
    .select({
      name: product.name,
      slug: product.slug,
      summary: product.summary,
      description: product.description,
      publishedAt: product.publishedAt,
      priceAmount: publicDefaultVariant.priceAmount,
      currency: publicDefaultVariant.currency,
      coverStorageKey: publicCover.storageKey,
      coverWidth: publicCover.width,
      coverHeight: publicCover.height,
      coverAltText: publicCover.altText,
    })
    .from(product)
    .innerJoin(publicDefaultVariant, activeDefaultVariantCondition)
    .innerJoin(publicCover, readyCoverCondition)
    .where(getPublishedProductCondition(slug))
    .limit(1)
}

export function toPublicProductListItemDTO(
  row: PublicProductListRow
): PublicProductListItemDTO | null {
  if (
    getCanonicalPublicProductSlug(row.slug) === null ||
    !row.name.trim() ||
    row.coverWidth === null ||
    row.coverHeight === null
  ) {
    return null
  }

  return {
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    price: {
      amount: row.priceAmount,
      currency: row.currency,
    },
    cover: {
      publicUrl: getPublicMediaUrl(row.coverStorageKey),
      width: row.coverWidth,
      height: row.coverHeight,
      altText: row.coverAltText,
    },
  }
}

export function toPublicProductDetailDTO(
  row: PublicProductDetailRow
): PublicProductDetailDTO | null {
  const listItem = toPublicProductListItemDTO(row)

  if (!listItem || !row.description?.trim() || !row.publishedAt) {
    return null
  }

  return {
    ...listItem,
    description: row.description,
    publishedAt: row.publishedAt.toISOString(),
  }
}

export async function listPublicProducts(): Promise<
  PublicProductListItemDTO[]
> {
  const rows = await buildPublicProductListQuery()

  return rows.flatMap((row) => {
    const productItem = toPublicProductListItemDTO(row)
    return productItem ? [productItem] : []
  })
}

export async function getPublicProductBySlug(
  slug: string
): Promise<PublicProductDetailDTO | null> {
  const [row] = await buildPublicProductDetailQuery(slug)
  return row ? toPublicProductDetailDTO(row) : null
}

export function buildPublicProductSitemapQuery() {
  return db
    .select({
      slug: product.slug,
      updatedAt: product.updatedAt,
    })
    .from(product)
    .innerJoin(publicDefaultVariant, activeDefaultVariantCondition)
    .innerJoin(publicCover, readyCoverCondition)
    .where(getPublishedProductCondition())
    .orderBy(asc(product.slug))
}

export async function listPublicProductSitemapEntries() {
  const rows = await buildPublicProductSitemapQuery()

  return rows.filter(
    (row) => getCanonicalPublicProductSlug(row.slug) !== null
  )
}
