import { describe, expect, mock, test } from "bun:test"

mock.module("server-only", () => ({}))
process.env.DATABASE_URL ??= "postgresql://user:password@localhost:5432/test"

const {
  buildPublicProductDetailQuery,
  buildPublicProductListQuery,
  buildPublicProductSitemapQuery,
  toPublicProductDetailDTO,
  toPublicProductListItemDTO,
} = await import("@/lib/catalog/public-data")

function normalizeSql(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function expectCompletePublicProjection(query: {
  toSQL(): { sql: string; params: unknown[] }
}) {
  const compiled = query.toSQL()
  const sql = normalizeSql(compiled.sql)

  expect(sql).toContain(
    'inner join "product_variant" "public_default_variant"'
  )
  expect(sql).toContain('inner join "product_media" "public_cover"')
  expect(sql).toContain('exists (select "id" from "product_asset"')
  expect(sql).toContain('"product"."description" is not null')
  expect(sql).toContain('btrim("product"."description")')
  expect(compiled.params).toContain("published")
  expect(compiled.params).toContain("IDR")
  expect(compiled.params).toContain("cover")
  expect(compiled.params).toContain("ready")
  expect(compiled.params).toContain(true)
}

const completePublicRow = {
  name: "Template Laporan",
  slug: "template-laporan",
  summary: "Ringkasan produk",
  priceAmount: 125_000,
  currency: "IDR",
  coverStorageKey: "products/demo/covers/cover.webp",
  coverWidth: 1200,
  coverHeight: 900,
  coverAltText: "Sampul Template Laporan",
}

describe("query katalog publik", () => {
  test("daftar hanya menggunakan proyeksi produk publik yang lengkap", () => {
    const query = buildPublicProductListQuery()
    const compiled = query.toSQL()

    expectCompletePublicProjection(query)
    expect(normalizeSql(compiled.sql)).toContain(
      'order by "product"."published_at" desc, "product"."id" asc'
    )
  })

  test("detail mengikat slug kanonis bersama aturan visibilitas", () => {
    const query = buildPublicProductDetailQuery("template-laporan")
    const compiled = query.toSQL()

    expectCompletePublicProjection(query)
    expect(compiled.params).toContain("template-laporan")
    expect(normalizeSql(compiled.sql)).toMatch(/limit \$\d+$/)
  })

  test("sitemap menggunakan aturan visibilitas publik yang sama", () => {
    expectCompletePublicProjection(buildPublicProductSitemapQuery())
  })
})

describe("DTO katalog publik", () => {
  test("hanya memetakan field storefront yang diizinkan", () => {
    const item = toPublicProductListItemDTO(completePublicRow)

    expect(item).not.toBeNull()

    if (!item) {
      throw new Error("DTO katalog publik tidak terbentuk.")
    }

    expect(Object.keys(item)).toEqual([
      "name",
      "slug",
      "summary",
      "price",
      "cover",
    ])
    expect(Object.keys(item.price)).toEqual(["amount", "currency"])
    expect(Object.keys(item.cover)).toEqual([
      "publicUrl",
      "width",
      "height",
      "altText",
    ])
  })

  test("gagal tertutup untuk row publik yang tidak lengkap", () => {
    expect(
      toPublicProductListItemDTO({
        ...completePublicRow,
        slug: " Template-Laporan ",
      })
    ).toBeNull()
    expect(
      toPublicProductDetailDTO({
        ...completePublicRow,
        description: "   ",
        publishedAt: new Date("2026-08-26T00:00:00Z"),
      })
    ).toBeNull()
  })

  test("media publik yang belum dikonfigurasi menghasilkan fallback URL null", () => {
    const previousPublicMediaUrl = process.env.R2_MEDIA_PUBLIC_URL
    delete process.env.R2_MEDIA_PUBLIC_URL

    try {
      expect(toPublicProductListItemDTO(completePublicRow)?.cover.publicUrl).toBeNull()
    } finally {
      if (previousPublicMediaUrl === undefined) {
        delete process.env.R2_MEDIA_PUBLIC_URL
      } else {
        process.env.R2_MEDIA_PUBLIC_URL = previousPublicMediaUrl
      }
    }
  })
})
