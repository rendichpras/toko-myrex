import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { cache } from "react"
import { ArrowLeft, ImageIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { getPublicProductBySlug } from "@/lib/catalog/public-data"
import { getCanonicalPublicProductSlug } from "@/lib/catalog/validation"
import { formatIdr } from "@/lib/currency"

const publishedDateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "Asia/Jakarta",
})

const productImageSizes =
  "(min-width: 1280px) 672px, (min-width: 1024px) 58vw, calc(100vw - 2rem)"

const loadPublicProduct = cache(async (rawSlug: string) => {
  await connection()

  const slug = getCanonicalPublicProductSlug(rawSlug)

  if (!slug) {
    return null
  }

  return getPublicProductBySlug(slug)
})

function getMetadataDescription(summary: string | null, description: string) {
  const source = summary?.trim() || description
  return source.replace(/\s+/g, " ").trim().slice(0, 160)
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
      <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/#produk"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Kembali ke produk
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-5 lg:items-start lg:gap-12">
          <div className="flex aspect-4/3 items-center justify-center overflow-hidden border bg-muted text-muted-foreground lg:col-span-3">
            {product.cover.publicUrl ? (
              <Image
                src={product.cover.publicUrl}
                alt={product.cover.altText ?? product.name}
                width={product.cover.width}
                height={product.cover.height}
                sizes={productImageSizes}
                className="size-full object-cover"
                priority
              />
            ) : (
              <ImageIcon className="size-12" aria-hidden="true" />
            )}
          </div>

          <header className="lg:col-span-2 lg:pt-3">
            <p className="text-sm font-medium text-muted-foreground">
              Produk digital
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {product.name}
            </h1>
            {product.summary ? (
              <p className="mt-4 text-base/7 text-muted-foreground sm:text-lg/8">
                {product.summary}
              </p>
            ) : null}
            <p className="mt-6 text-2xl font-semibold tabular-nums">
              {formatIdr(product.price.amount)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Diterbitkan{" "}
              <time dateTime={product.publishedAt}>
                {publishedDateFormatter.format(new Date(product.publishedAt))}
              </time>
            </p>
          </header>
        </div>

        <section
          className="mt-12 max-w-3xl border-t pt-8"
          aria-labelledby="product-description-title"
        >
          <h2
            id="product-description-title"
            className="text-xl font-semibold tracking-tight"
          >
            Tentang produk
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-base/7 text-muted-foreground">
            {product.description}
          </p>
        </section>
      </article>
    </main>
  )
}
