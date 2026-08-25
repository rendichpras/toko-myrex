import Link from "next/link"
import { Search, SlidersHorizontal, X } from "lucide-react"

import { productStatusLabels } from "@/components/admin/products/product-status"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { PRODUCT_STATUSES } from "@/lib/catalog/constants"
import type { ProductListQuery } from "@/lib/catalog/validation"

type ProductListToolbarProps = {
  query: ProductListQuery
}

export function ProductListToolbar({ query }: ProductListToolbarProps) {
  const hasCustomQuery =
    Boolean(query.query || query.status) || query.sort !== "updated-desc"

  return (
    <Card size="sm">
      <CardContent>
        <form
          action="/admin/produk"
          role="search"
          aria-label="Cari dan filter produk"
          className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_10rem_12rem_auto] xl:items-center"
        >
          <InputGroup className="sm:col-span-2 xl:col-span-1">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              name="query"
              defaultValue={query.query}
              placeholder="Cari nama, slug, atau SKU"
              aria-label="Cari produk"
            />
          </InputGroup>

          <NativeSelect
            name="status"
            defaultValue={query.status ?? ""}
            aria-label="Filter status produk"
            className="w-full"
          >
            <NativeSelectOption value="">Semua status</NativeSelectOption>
            {PRODUCT_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {productStatusLabels[status]}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <NativeSelect
            name="sort"
            defaultValue={query.sort}
            aria-label="Urutkan produk"
            className="w-full"
          >
            <NativeSelectOption value="updated-desc">
              Pembaruan terbaru
            </NativeSelectOption>
            <NativeSelectOption value="updated-asc">
              Pembaruan terlama
            </NativeSelectOption>
            <NativeSelectOption value="name-asc">Nama A–Z</NativeSelectOption>
            <NativeSelectOption value="name-desc">Nama Z–A</NativeSelectOption>
            <NativeSelectOption value="price-asc">
              Harga terendah
            </NativeSelectOption>
            <NativeSelectOption value="price-desc">
              Harga tertinggi
            </NativeSelectOption>
          </NativeSelect>

          <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-1 xl:justify-end">
            <Button type="submit" variant="outline">
              <SlidersHorizontal data-icon="inline-start" aria-hidden="true" />
              Terapkan filter
            </Button>
            {hasCustomQuery ? (
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/admin/produk" />}
              >
                <X data-icon="inline-start" aria-hidden="true" />
                Hapus filter
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
