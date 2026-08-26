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
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Katalog Toko Myrex
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Produk digital, siap Anda jelajahi.
          </h1>
          <p className="mt-4 max-w-xl text-base/7 text-muted-foreground sm:text-lg/8">
            Temukan produk yang membantu pekerjaan dan proyek Anda, lengkap
            dengan informasi yang jelas sebelum Anda memilih.
          </p>
        </div>
      </section>

      <section
        id="produk"
        className="mx-auto grid max-w-7xl gap-8 border-t px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
        aria-labelledby="product-list-title"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="product-list-title"
              className="text-2xl font-semibold tracking-tight"
            >
              Jelajahi produk
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Produk terbaru ditampilkan lebih dahulu.
            </p>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {products.length} produk tersedia
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <Empty className="border bg-muted/20 py-20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageSearch aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle role="heading" aria-level={3}>
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
