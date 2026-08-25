import type { ProductStatus } from "@/lib/catalog/constants"

export const productStatusLabels: Record<ProductStatus, string> = {
  draft: "Draf",
  published: "Diterbitkan",
  archived: "Diarsipkan",
}

export const productStatusVariants: Record<
  ProductStatus,
  "default" | "secondary" | "outline"
> = {
  draft: "secondary",
  published: "default",
  archived: "outline",
}
