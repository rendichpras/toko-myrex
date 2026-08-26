import { describe, expect, test } from "bun:test"

import { MAX_PRODUCT_PRICE_AMOUNT } from "@/lib/catalog/constants"
import {
  getProductPublicationIssues,
  productListQuerySchema,
  productPriceAmountSchema,
} from "@/lib/catalog/validation"

describe("aturan publikasi produk", () => {
  test("menjelaskan seluruh persyaratan yang belum lengkap", () => {
    const issues = getProductPublicationIssues({
      name: "Produk",
      slug: "produk",
      description: null,
      defaultVariant: { isActive: true, priceAmount: 0 },
      hasReadyCover: false,
      hasReadyAsset: false,
    })

    expect(issues.map((issue) => issue.field)).toEqual([
      "description",
      "cover",
      "asset",
    ])
  })

  test("menerima produk gratis yang lengkap", () => {
    expect(
      getProductPublicationIssues({
        name: "Produk",
        slug: "produk",
        description: "Deskripsi",
        defaultVariant: { isActive: true, priceAmount: 0 },
        hasReadyCover: true,
        hasReadyAsset: true,
      })
    ).toEqual([])
  })
})

describe("harga produk", () => {
  test("menggunakan batas integer database yang sama", () => {
    expect(productPriceAmountSchema.safeParse(MAX_PRODUCT_PRICE_AMOUNT).success).toBe(
      true
    )
    expect(
      productPriceAmountSchema.safeParse(MAX_PRODUCT_PRICE_AMOUNT + 1).success
    ).toBe(false)
  })
})

describe("query daftar produk", () => {
  test("menerapkan default yang aman", () => {
    expect(productListQuerySchema.parse({})).toEqual({
      query: "",
      sort: "updated-desc",
      page: 1,
      pageSize: 10,
    })
  })

  test("menolak page size yang terlalu besar", () => {
    expect(productListQuerySchema.safeParse({ pageSize: 101 }).success).toBe(
      false
    )
  })
})
