import type { Metadata } from "next"
import { connection } from "next/server"
import { PackageSearch } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { listPublicProducts } from "@/lib/catalog/public-data"

export const metadata: Metadata = {
  title: { absolute: "Toko Myrex" },
  description: "Temukan produk digital yang tersedia di Toko Myrex.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Toko Myrex",
    description: "Temukan produk digital yang tersedia di Toko Myrex.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Toko Myrex",
    description: "Temukan produk digital yang tersedia di Toko Myrex.",
  },
}

export default async function StorefrontPage() {
  await connection()
  const products = await listPublicProducts()

  return (
    <main className="flex-1">
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Produk digital
            </h1>
            <p className="mt-3 text-base/7 text-muted-foreground sm:text-lg/8">
              Jelajahi produk yang tersedia dan pelajari detailnya sebelum Anda
              memilih.
            </p>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {products.length} produk tersedia
          </p>
        </div>
      </section>

      <section
        id="produk"
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
        aria-label="Daftar produk"
      >
        {products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageSearch aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle role="heading" aria-level={2}>
                Belum ada produk
              </EmptyTitle>
              <EmptyDescription>
                Produk yang sudah diterbitkan akan tampil di sini.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </main>
  )
}
