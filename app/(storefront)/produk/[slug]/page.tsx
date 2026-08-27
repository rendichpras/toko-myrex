import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { cache } from "react"
import { CalendarDays, ImageIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { getPublicProductBySlug } from "@/lib/catalog/public-data"
import { getCanonicalPublicProductSlug } from "@/lib/catalog/validation"
import { formatIdr } from "@/lib/currency"

const publishedDateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "Asia/Jakarta",
})

const productImageSizes =
  "(min-width: 1280px) 720px, (min-width: 1024px) 58vw, (min-width: 640px) calc(100vw - 3rem), calc(100vw - 2rem)"

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
      <article className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/#produk" />}>
                Produk
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-8 grid gap-8 lg:grid-cols-5 lg:items-start lg:gap-12">
          <figure className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-3xl border bg-muted text-muted-foreground lg:col-span-3">
            {product.cover.publicUrl ? (
              <Image
                src={product.cover.publicUrl}
                alt={product.cover.altText ?? product.name}
                width={product.cover.width}
                height={product.cover.height}
                sizes={productImageSizes}
                className="size-full object-contain"
                priority
              />
            ) : (
              <ImageIcon className="size-12" aria-hidden="true" />
            )}
          </figure>

          <div className="lg:col-span-2 lg:py-2">
            <header>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">Produk digital</Badge>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  <time dateTime={product.publishedAt}>
                    {publishedDateFormatter.format(
                      new Date(product.publishedAt)
                    )}
                  </time>
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {product.name}
              </h1>
              {product.summary ? (
                <p className="mt-4 text-base/7 text-muted-foreground sm:text-lg/8">
                  {product.summary}
                </p>
              ) : null}
              <div className="mt-6">
                <p className="text-sm text-muted-foreground">Harga</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  {formatIdr(product.price.amount)}
                </p>
              </div>
            </header>

            <Separator className="my-8" />

            <section aria-labelledby="product-description-title">
              <h2
                id="product-description-title"
                className="text-xl font-semibold tracking-tight"
              >
                Tentang produk
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-base/7">
                {product.description}
              </p>
            </section>
          </div>
        </div>
      </article>
    </main>
  )
}
