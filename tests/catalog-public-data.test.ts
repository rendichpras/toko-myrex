import { describe, expect, mock, test } from "bun:test"

mock.module("server-only", () => ({}))
process.env.DATABASE_URL ??= "postgresql://user:password@localhost:5432/test"

const {
  buildPublicProductDetailQuery,
  buildPublicProductListQuery,
  buildPublicProductSitemapQuery,
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
