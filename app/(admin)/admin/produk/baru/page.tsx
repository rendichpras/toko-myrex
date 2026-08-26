import type { Metadata } from "next"

import { createProduct } from "@/app/(admin)/admin/produk/actions"
import { AdminPage } from "@/components/admin/admin-page"
import { ProductForm } from "@/components/admin/products/product-form"
import {
  productStatusLabels,
  productStatusVariants,
} from "@/components/admin/products/product-status"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Tambah produk",
}

export default function NewProductPage() {
  return (
    <AdminPage
      title="Tambah produk"
      description="Tambahkan informasi dasar dan harga. Produk disimpan sebagai draf hingga diterbitkan."
      actions={
        <Badge variant={productStatusVariants.draft}>
          {productStatusLabels.draft}
        </Badge>
      }
    >
      <ProductForm action={createProduct} submitLabel="Simpan sebagai draf" />
    </AdminPage>
  )
}
