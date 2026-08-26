import { z } from "zod"

import {
  MAX_PRODUCT_PRICE_AMOUNT,
  PRODUCT_LIST_SORTS,
  PRODUCT_STATUSES,
} from "@/lib/catalog/constants"

function optionalTrimmedText(maximum: number, message: string) {
  return z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        return null
      }

      return value
    },
    z.string().trim().max(maximum, message).nullable()
  )
}

function positiveIntegerInput(defaultValue: number, maximum: number) {
  return z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().min(1).max(maximum).default(defaultValue)
  )
}

export const productIdSchema = z.uuid("ID produk tidak valid.")

export const productNameSchema = z
  .string()
  .trim()
  .min(1, "Masukkan nama produk.")
  .max(160, "Batasi nama produk hingga 160 karakter.")

export const productSlugSchema = z.preprocess(
  (value) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  z
    .string()
    .min(1, "Masukkan slug produk.")
    .max(200, "Batasi slug hingga 200 karakter.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung."
    )
)

export function getCanonicalPublicProductSlug(value: string) {
  const parsed = productSlugSchema.safeParse(value)

  return parsed.success && parsed.data === value ? parsed.data : null
}

export const productSummarySchema = optionalTrimmedText(
  320,
  "Batasi ringkasan hingga 320 karakter."
)

export const productDescriptionSchema = optionalTrimmedText(
  100_000,
  "Batasi deskripsi hingga 100.000 karakter."
)

export const productSkuSchema = z.preprocess(
  (value) => {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return null
    }

    return typeof value === "string" ? value.trim().toUpperCase() : value
  },
  z
    .string()
    .max(100, "Batasi SKU hingga 100 karakter.")
    .regex(
      /^[A-Z0-9][A-Z0-9._-]*$/,
      "SKU hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung."
    )
    .nullable()
)

export const productPriceAmountSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce
    .number({ error: "Masukkan harga produk." })
    .int("Harga harus berupa bilangan bulat.")
    .min(0, "Harga tidak boleh negatif.")
    .max(MAX_PRODUCT_PRICE_AMOUNT, "Masukkan harga yang lebih rendah.")
)

const productDraftFieldsSchema = z.object({
  name: productNameSchema,
  slug: productSlugSchema,
  summary: productSummarySchema,
  description: productDescriptionSchema,
  priceAmount: productPriceAmountSchema,
  sku: productSkuSchema,
})

export const createProductInputSchema = productDraftFieldsSchema

export const updateProductInputSchema = productDraftFieldsSchema.extend({
  productId: productIdSchema,
})

export const productMutationIdSchema = z.object({
  productId: productIdSchema,
})

export const productLifecycleActionSchema = productMutationIdSchema.extend({
  intent: z.enum(["publish", "archive", "restore"]),
})

export const productListQuerySchema = z.object({
  query: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(100).optional().default("")
  ),
  status: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.enum(PRODUCT_STATUSES).optional()
  ),
  sort: z.enum(PRODUCT_LIST_SORTS).default("updated-desc"),
  page: positiveIntegerInput(1, 1_000_000),
  pageSize: positiveIntegerInput(10, 100),
})

export type CreateProductInput = z.input<typeof createProductInputSchema>
export type CreateProductValues = z.output<typeof createProductInputSchema>
export type UpdateProductInput = z.input<typeof updateProductInputSchema>
export type UpdateProductValues = z.output<typeof updateProductInputSchema>
export type ProductListQueryInput = z.input<typeof productListQuerySchema>
export type ProductListQuery = z.output<typeof productListQuerySchema>
export type ProductLifecycleIntent = z.output<
  typeof productLifecycleActionSchema
>["intent"]

export type ProductFormField =
  | "name"
  | "slug"
  | "summary"
  | "description"
  | "priceAmount"
  | "sku"

export type ProductFormState = {
  errors?: Partial<Record<ProductFormField, string[]>>
  message?: string
  success?: string
}

export type ProductLifecycleState = {
  intent?: ProductLifecycleIntent
  message?: string
  success?: string
}

export type ProductPublicationIssueField =
  | "name"
  | "slug"
  | "description"
  | "priceAmount"
  | "cover"
  | "asset"

export type ProductPublicationIssue = {
  field: ProductPublicationIssueField
  message: string
}

type ProductPublicationState = {
  name: string
  slug: string
  description: string | null
  defaultVariant: {
    isActive: boolean
    priceAmount: number
  } | null
  hasReadyCover: boolean
  hasReadyAsset: boolean
}

export function getProductPublicationIssues({
  name,
  slug,
  description,
  defaultVariant,
  hasReadyCover,
  hasReadyAsset,
}: ProductPublicationState): ProductPublicationIssue[] {
  const issues: ProductPublicationIssue[] = []

  if (!productNameSchema.safeParse(name).success) {
    issues.push({ field: "name", message: "Tambahkan nama produk." })
  }

  if (!productSlugSchema.safeParse(slug).success) {
    issues.push({ field: "slug", message: "Perbaiki slug produk." })
  }

  if (!description?.trim()) {
    issues.push({
      field: "description",
      message: "Tambahkan deskripsi produk.",
    })
  }

  if (
    !defaultVariant?.isActive ||
    !productPriceAmountSchema.safeParse(defaultVariant.priceAmount).success
  ) {
    issues.push({
      field: "priceAmount",
      message: "Tambahkan harga produk yang valid.",
    })
  }

  if (!hasReadyCover) {
    issues.push({
      field: "cover",
      message: "Tambahkan gambar sampul yang siap digunakan.",
    })
  }

  if (!hasReadyAsset) {
    issues.push({
      field: "asset",
      message: "Tambahkan minimal satu file produk yang siap diunduh.",
    })
  }

  return issues
}
