import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Package, Plus, SearchX } from "lucide-react"

import { changeProductStatus } from "@/app/(admin)/admin/produk/actions"
import { AdminPage } from "@/components/admin/admin-page"
import { ProductListToolbar } from "@/components/admin/products/product-list-toolbar"
import { ProductTable } from "@/components/admin/products/product-table"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { requireAdmin } from "@/lib/auth/session"
import { listAdminProducts } from "@/lib/catalog/data"
import { buildAdminProductsUrl } from "@/lib/catalog/url"
import { productListQuerySchema } from "@/lib/catalog/validation"

export const metadata: Metadata = {
  title: "Produk",
}

type AdminProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  await requireAdmin("/admin/produk")

  const params = await searchParams
  const parsedQuery = productListQuerySchema.safeParse({
    query: readSearchParam(params.query),
    status: readSearchParam(params.status),
    sort: readSearchParam(params.sort),
    page: readSearchParam(params.page),
    pageSize: readSearchParam(params.pageSize),
  })

  if (!parsedQuery.success) {
    redirect("/admin/produk")
  }

  const query = parsedQuery.data
  const data = await listAdminProducts(query)

  if (
    data.items.length === 0 &&
    data.pagination.totalItems > 0 &&
    query.page > data.pagination.totalPages
  ) {
    redirect(
      buildAdminProductsUrl(query, { page: data.pagination.totalPages })
    )
  }

  const hasFilters = Boolean(query.query || query.status)
  const hasCustomView = hasFilters || query.sort !== "updated-desc"

  return (
    <AdminPage
      title="Produk"
      description="Kelola katalog, harga, dan akses produk digital."
      actions={
        <Button
          nativeButton={false}
          render={<Link href="/admin/produk/baru" />}
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          Tambah produk
        </Button>
      }
    >
      {data.pagination.totalItems > 0 || hasCustomView ? (
        <ProductListToolbar query={query} />
      ) : null}

      {data.items.length > 0 ? (
        <ProductTable
          data={data}
          query={query}
          lifecycleAction={changeProductStatus}
        />
      ) : hasFilters ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle role="heading" aria-level={2}>
              Produk tidak ditemukan
            </EmptyTitle>
            <EmptyDescription>
              Coba kata kunci lain atau hapus filter untuk melihat semua
              produk.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/admin/produk" />}
            >
              Hapus filter
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle role="heading" aria-level={2}>
              Belum ada produk
            </EmptyTitle>
            <EmptyDescription>
              Tambahkan produk pertama ke katalog toko.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              nativeButton={false}
              render={<Link href="/admin/produk/baru" />}
            >
              <Plus data-icon="inline-start" aria-hidden="true" />
              Tambah produk
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </AdminPage>
  )
}
