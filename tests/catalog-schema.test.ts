import { describe, expect, test } from "bun:test"
import { getTableConfig } from "drizzle-orm/pg-core"

import { productAsset, productMedia, productVariant } from "@/lib/db/schema/catalog"

function indexConfig(table: Parameters<typeof getTableConfig>[0], name: string) {
  return getTableConfig(table).indexes.find((index) => index.config.name === name)
}

describe("constraint schema katalog", () => {
  test("menjamin satu varian utama per produk", () => {
    expect(
      indexConfig(productVariant, "product_variant_default_uidx")?.config.unique
    ).toBe(true)
  })

  test("menjamin satu sampul siap per produk", () => {
    expect(
      indexConfig(productMedia, "product_media_current_cover_uidx")?.config
        .unique
    ).toBe(true)
  })

  test("menjamin nomor versi aset unik per produk", () => {
    const index = indexConfig(
      productAsset,
      "product_asset_product_version_uidx"
    )

    expect(index?.config.unique).toBe(true)
    expect(index?.config.columns).toHaveLength(2)
  })
})
