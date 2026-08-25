import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  ImageOff,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  productStatusLabels,
  productStatusVariants,
} from "@/components/admin/products/product-status"
import { ProductTableActions } from "@/components/admin/products/product-table-actions"
import type { ProductListDTO } from "@/lib/catalog/dto"
import { buildAdminProductsUrl } from "@/lib/catalog/url"
import type {
  ProductLifecycleState,
  ProductListQuery,
} from "@/lib/catalog/validation"

const priceFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})

type ProductTableProps = {
  data: ProductListDTO
  lifecycleAction: (
    productId: string,
    previousState: ProductLifecycleState,
    formData: FormData
  ) => Promise<ProductLifecycleState>
  query: ProductListQuery
}

export function ProductTable({
  data,
  lifecycleAction,
  query,
}: ProductTableProps) {
  const { page, totalPages, totalItems } = data.pagination
  const previousPage = Math.max(1, page - 1)
  const nextPage = Math.min(totalPages, page + 1)
  const firstItem = (page - 1) * data.pagination.pageSize + 1
  const lastItem = firstItem + data.items.length - 1
  const visibleRange =
    firstItem === lastItem ? String(firstItem) : `${firstItem}–${lastItem}`

  return (
    <div className="min-w-0 border">
      <Table>
        <TableCaption className="sr-only">Daftar produk digital</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="hidden w-14 sm:table-cell">
              Sampul
            </TableHead>
            <TableHead scope="col">Produk</TableHead>
            <TableHead scope="col" className="hidden md:table-cell">
              SKU
            </TableHead>
            <TableHead scope="col" className="text-right">
              Harga
            </TableHead>
            <TableHead scope="col" className="hidden sm:table-cell">
              Status
            </TableHead>
            <TableHead scope="col" className="hidden lg:table-cell">
              Terakhir diperbarui
            </TableHead>
            <TableHead scope="col" className="w-12">
              <span className="sr-only">Tindakan produk</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="hidden sm:table-cell">
                <span
                  role="img"
                  aria-label={
                    item.cover ? "Gambar sampul tersedia" : "Belum ada gambar sampul"
                  }
                  title={
                    item.cover ? "Gambar sampul tersedia" : "Belum ada gambar sampul"
                  }
                  className="flex size-9 items-center justify-center border bg-muted text-muted-foreground"
                >
                  {item.cover ? (
                    <ImageIcon aria-hidden="true" />
                  ) : (
                    <ImageOff aria-hidden="true" />
                  )}
                </span>
              </TableCell>
              <TableCell>
                <div className="max-w-44 space-y-1 sm:max-w-xs">
                  <Link
                    href={`/admin/produk/${item.id}`}
                    className="block truncate font-medium outline-none hover:underline focus-visible:underline"
                  >
                    {item.name}
                  </Link>
                  <span className="block truncate text-muted-foreground">
                    /{item.slug}
                  </span>
                  {item.defaultVariant?.sku ? (
                    <span className="block truncate text-muted-foreground md:hidden">
                      SKU {item.defaultVariant.sku}
                    </span>
                  ) : null}
                  <Badge
                    variant={productStatusVariants[item.status]}
                    className="sm:hidden"
                  >
                    {productStatusLabels[item.status]}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {item.defaultVariant?.sku ?? "—"}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {item.defaultVariant
                  ? priceFormatter.format(item.defaultVariant.priceAmount)
                  : "—"}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant={productStatusVariants[item.status]}>
                  {productStatusLabels[item.status]}
                </Badge>
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                <time dateTime={item.updatedAt}>
                  {dateFormatter.format(new Date(item.updatedAt))}
                </time>
              </TableCell>
              <TableCell>
                <ProductTableActions
                  action={lifecycleAction.bind(null, item.id)}
                  productId={item.id}
                  productName={item.name}
                  status={item.status}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-col items-center justify-between gap-3 border-t p-3 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          Menampilkan {visibleRange} dari {totalItems} produk
        </p>
        <Pagination aria-label="Halaman daftar produk" className="sm:w-auto">
          <PaginationContent>
            <PaginationItem>
              {page <= 1 ? (
                <Button
                  variant="ghost"
                  disabled
                  aria-label="Tidak ada halaman sebelumnya"
                >
                  <ChevronLeft data-icon="inline-start" aria-hidden="true" />
                  <span className="hidden sm:block">Sebelumnya</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  nativeButton={false}
                  render={
                    <Link
                      href={buildAdminProductsUrl(query, {
                        page: previousPage,
                      })}
                      aria-label="Buka halaman sebelumnya"
                    />
                  }
                >
                  <ChevronLeft data-icon="inline-start" aria-hidden="true" />
                  <span className="hidden sm:block">Sebelumnya</span>
                </Button>
              )}
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-xs tabular-nums text-muted-foreground">
                Halaman {page} dari {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              {page >= totalPages ? (
                <Button
                  variant="ghost"
                  disabled
                  aria-label="Tidak ada halaman berikutnya"
                >
                  <span className="hidden sm:block">Berikutnya</span>
                  <ChevronRight data-icon="inline-end" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  nativeButton={false}
                  render={
                    <Link
                      href={buildAdminProductsUrl(query, { page: nextPage })}
                      aria-label="Buka halaman berikutnya"
                    />
                  }
                >
                  <span className="hidden sm:block">Berikutnya</span>
                  <ChevronRight data-icon="inline-end" aria-hidden="true" />
                </Button>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
