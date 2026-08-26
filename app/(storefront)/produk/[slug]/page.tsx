import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { cache } from "react"
import { ArrowLeft, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getPublicProductBySlug } from "@/lib/catalog/public-data"
import { getCanonicalPublicProductSlug } from "@/lib/catalog/validation"
import { formatIdr } from "@/lib/currency"

const loadPublicProduct = cache(async (rawSlug: string) => {
  await connection()

  const slug = getCanonicalPublicProductSlug(rawSlug)

  if (!slug) {
    return null
  }

  return getPublicProductBySlug(slug)
})

function getMetadataDescription(summary: string | null, description: string) {
  return (summary ?? description).replace(/\s+/g, " ").trim().slice(0, 160)
}

export async function generateMetadata({
  params,
}: PageProps<"/produk/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const product = await loadPublicProduct(slug)

  if (!product) {
    notFound()
  }

  const description = getMetadataDescription(
    product.summary,
    product.description
  )
  const images = product.cover.publicUrl
    ? [
        {
          url: product.cover.publicUrl,
          width: product.cover.width,
          height: product.cover.height,
          alt: product.cover.altText ?? product.name,
        },
      ]
    : undefined

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/produk/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: `/produk/${product.slug}`,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: product.name,
      description,
      images: product.cover.publicUrl ? [product.cover.publicUrl] : undefined,
    },
  }
}

export default async function PublicProductPage({
  params,
}: PageProps<"/produk/[slug]">) {
  const { slug } = await params
  const product = await loadPublicProduct(slug)

  if (!product) {
    notFound()
  }

  return (
    <main className="flex-1">
      <article className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/#produk" />}
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Kembali ke katalog
        </Button>

        <div className="mt-6 grid gap-8 lg:grid-cols-5 lg:items-start lg:gap-12">
          <div className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-3xl bg-muted/60 text-muted-foreground ring-1 ring-foreground/10 lg:col-span-3">
            {product.cover.publicUrl ? (
              <Image
                src={product.cover.publicUrl}
                alt={product.cover.altText ?? product.name}
                width={product.cover.width}
                height={product.cover.height}
                className="size-full object-cover"
                priority
              />
            ) : (
              <ImageIcon className="size-14" aria-hidden="true" />
            )}
          </div>

          <div className="grid gap-8 lg:sticky lg:top-8 lg:col-span-2">
            <header className="grid gap-5">
              <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                Produk digital
              </p>
              <div className="grid gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  {product.name}
                </h1>
                {product.summary ? (
                  <p className="text-base/7 text-muted-foreground sm:text-lg/8">
                    {product.summary}
                  </p>
                ) : null}
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {formatIdr(product.price.amount)}
              </p>
            </header>

            <section
              className="border-t pt-6"
              aria-labelledby="product-description-title"
            >
              <h2
                id="product-description-title"
                className="text-lg font-semibold tracking-tight"
              >
                Tentang produk
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-base/7 text-foreground/80">
                {product.description}
              </p>
            </section>
          </div>
        </div>
      </article>
    </main>
  )
}
