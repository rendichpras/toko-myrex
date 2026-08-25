import type { ProductListQuery } from "@/lib/catalog/validation"

export function buildAdminProductsUrl(
  query: ProductListQuery,
  overrides: Partial<Pick<ProductListQuery, "page">> = {}
) {
  const nextQuery = { ...query, ...overrides }
  const params = new URLSearchParams()

  if (nextQuery.query) params.set("query", nextQuery.query)
  if (nextQuery.status) params.set("status", nextQuery.status)
  if (nextQuery.sort !== "updated-desc") params.set("sort", nextQuery.sort)
  if (nextQuery.page > 1) params.set("page", String(nextQuery.page))
  if (nextQuery.pageSize !== 10) {
    params.set("pageSize", String(nextQuery.pageSize))
  }

  const search = params.toString()

  return search ? `/admin/produk?${search}` : "/admin/produk"
}
