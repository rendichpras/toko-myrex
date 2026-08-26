import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, ImageIcon } from "lucide-react"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { PublicProductListItemDTO } from "@/lib/catalog/dto"
import { formatIdr } from "@/lib/currency"

const productImageSizes =
  "(min-width: 1024px) 368px, (min-width: 640px) calc(50vw - 2.5rem), calc(100vw - 2rem)"

export function ProductCard({
  product,
}: {
  product: PublicProductListItemDTO
}) {
  return (
    <article className="h-full">
      <Link
        href={`/produk/${product.slug}`}
        className="group block h-full outline-none"
        aria-label={`Lihat ${product.name}`}
      >
        <Card
          size="sm"
          className="h-full pt-0 group-focus-visible:ring-2 group-focus-visible:ring-ring"
        >
          {product.cover.publicUrl ? (
            <Image
              src={product.cover.publicUrl}
              alt={product.cover.altText ?? product.name}
              width={product.cover.width}
              height={product.cover.height}
              sizes={productImageSizes}
              className="aspect-4/3 w-full object-cover"
            />
          ) : (
            <div className="flex aspect-4/3 items-center justify-center bg-muted text-muted-foreground">
              <ImageIcon className="size-10" aria-hidden="true" />
            </div>
          )}

          <CardHeader>
            <CardTitle
              role="heading"
              aria-level={2}
              className="leading-snug group-hover:text-primary"
            >
              {product.name}
            </CardTitle>
            {product.summary ? (
              <CardDescription className="line-clamp-2">
                {product.summary}
              </CardDescription>
            ) : null}
          </CardHeader>

          <CardFooter className="mt-auto justify-between">
            <span className="font-semibold tabular-nums">
              {formatIdr(product.price.amount)}
            </span>
            <ArrowUpRight
              className="size-4 text-muted-foreground group-hover:text-foreground"
              aria-hidden="true"
            />
          </CardFooter>
        </Card>
      </Link>
    </article>
  )
}
