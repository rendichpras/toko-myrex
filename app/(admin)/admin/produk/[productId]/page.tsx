import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CircleAlert } from "lucide-react"

import {
  changeProductStatus,
  updateProduct,
} from "@/app/(admin)/admin/produk/actions"
import { AdminPage } from "@/components/admin/admin-page"
import { ProductForm } from "@/components/admin/products/product-form"
import { ProductFiles } from "@/components/admin/products/product-files"
import { ProductLifecycleActions } from "@/components/admin/products/product-lifecycle-actions"
import {
  productStatusLabels,
  productStatusVariants,
} from "@/components/admin/products/product-status"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { requireAdmin } from "@/lib/auth/session"
import { getAdminProduct } from "@/lib/catalog/data"
import { productIdSchema } from "@/lib/catalog/validation"
import {
  getProductAssetMaxBytes,
  isStorageConfigured,
} from "@/lib/storage"

export const metadata: Metadata = {
  title: "Edit produk",
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await params
  await requireAdmin(`/admin/produk/${encodeURIComponent(productId)}`)

  const parsedProductId = productIdSchema.safeParse(productId)

  if (!parsedProductId.success) {
    notFound()
  }

  const product = await getAdminProduct(parsedProductId.data)

  if (!product) {
    notFound()
  }

  const updateProductAction = updateProduct.bind(null, product.id)
  const changeProductStatusAction = changeProductStatus.bind(null, product.id)
  const isArchived = product.status === "archived"
  const publicationRequirementsId = "publication-requirements"

  return (
    <AdminPage
      title={product.name}
      description="Perbarui informasi produk dan periksa kesiapan penerbitannya."
      actions={
        <Badge variant={productStatusVariants[product.status]}>
          {productStatusLabels[product.status]}
        </Badge>
      }
    >
      {isArchived ? (
        <Alert>
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Produk diarsipkan</AlertTitle>
          <AlertDescription>
            Kembalikan produk ke draf sebelum mengubah informasinya.
          </AlertDescription>
        </Alert>
      ) : product.publicationIssues.length > 0 ? (
        <Alert id={publicationRequirementsId}>
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Produk belum siap diterbitkan</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {product.publicationIssues.map((issue) => (
                <li key={issue.field}>{issue.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <ProductLifecycleActions
        action={changeProductStatusAction}
        status={product.status}
        productName={product.name}
        canPublish={product.publicationIssues.length === 0}
        publicationRequirementsId={
          product.publicationIssues.length > 0
            ? publicationRequirementsId
            : undefined
        }
      />

      <ProductForm
        key={product.id}
        action={updateProductAction}
        submitLabel="Simpan perubahan"
        disabled={isArchived}
        defaultValues={{
          name: product.name,
          slug: product.slug,
          summary: product.summary,
          description: product.description,
          priceAmount:
            product.variants.find((variant) => variant.isDefault)
              ?.priceAmount ?? 0,
          sku:
            product.variants.find((variant) => variant.isDefault)?.sku ?? null,
        }}
      />

      <ProductFiles
        assetMaxBytes={getProductAssetMaxBytes()}
        assets={product.assets}
        disabled={isArchived}
        media={product.media}
        productId={product.id}
        productName={product.name}
        storageConfigured={isStorageConfigured()}
      />
    </AdminPage>
  )
}
