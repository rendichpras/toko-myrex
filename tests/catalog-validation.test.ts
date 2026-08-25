import { describe, expect, test } from "bun:test"

import {
  getProductPublicationIssues,
  productListQuerySchema,
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
