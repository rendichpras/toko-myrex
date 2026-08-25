import type {
  ProductFileStatus,
  ProductMediaRole,
  ProductStatus,
} from "@/lib/catalog/constants"
import type { ProductPublicationIssue } from "@/lib/catalog/validation"

export type ProductVariantDTO = {
  id: string
  name: string | null
  sku: string | null
  priceAmount: number
  currency: string
  isDefault: boolean
  isActive: boolean
  position: number
  createdAt: string
  updatedAt: string
}

export type ProductMediaDTO = {
  id: string
  role: ProductMediaRole
  storageKey: string
  publicUrl: string | null
  mimeType: string
  fileSize: number
  width: number | null
  height: number | null
  altText: string | null
  position: number
  status: ProductFileStatus
  createdAt: string
  updatedAt: string
}

export type ProductAssetDTO = {
  id: string
  storageKey: string
  downloadName: string
  originalName: string
  mimeType: string
  fileSize: number
  version: number
  status: ProductFileStatus
  createdAt: string
  updatedAt: string
}

export type ProductCategoryDTO = {
  id: string
  name: string
  slug: string
}

export type ProductListItemDTO = {
  id: string
  name: string
  slug: string
  summary: string | null
  status: ProductStatus
  updatedAt: string
  defaultVariant: {
    id: string
    sku: string | null
    priceAmount: number
    currency: string
  } | null
  cover: {
    storageKey: string
    publicUrl: string | null
    altText: string | null
  } | null
}

export type ProductListDTO = {
  items: ProductListItemDTO[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export type ProductDetailDTO = {
  id: string
  name: string
  slug: string
  summary: string | null
  description: string | null
  status: ProductStatus
  publishedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  variants: ProductVariantDTO[]
  media: ProductMediaDTO[]
  assets: ProductAssetDTO[]
  categories: ProductCategoryDTO[]
  publicationIssues: ProductPublicationIssue[]
}

export type ProductMutationResultDTO = {
  id: string
  status: ProductStatus
}
