export const PRODUCT_STATUSES = [
  "draft",
  "published",
  "archived",
] as const

export const PRODUCT_MEDIA_ROLES = ["cover", "gallery"] as const

export const PRODUCT_FILE_STATUSES = [
  "pending",
  "ready",
  "rejected",
  "archived",
] as const

export const PRODUCT_LIST_SORTS = [
  "updated-desc",
  "updated-asc",
  "name-asc",
  "name-desc",
  "price-asc",
  "price-desc",
] as const

export const PRODUCT_CURRENCY = "IDR" as const

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]
export type ProductFileStatus = (typeof PRODUCT_FILE_STATUSES)[number]
export type ProductMediaRole = (typeof PRODUCT_MEDIA_ROLES)[number]
export type ProductListSort = (typeof PRODUCT_LIST_SORTS)[number]
