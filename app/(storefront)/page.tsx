import type { Metadata } from "next"
import { connection } from "next/server"
import { PackageSearch } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"
import { Badge } from "@/components/ui/badge"
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
      <section
        id="produk"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
      >
        {products.length > 0 ? (
          <div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <Empty className="border">
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
