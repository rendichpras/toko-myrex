import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, ImageIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { PublicProductListItemDTO } from "@/lib/catalog/dto"
import { formatIdr } from "@/lib/currency"

const productImageSizes =
  "(min-width: 1280px) 405px, (min-width: 1024px) calc(33vw - 2rem), (min-width: 640px) calc(50vw - 2.5rem), calc(100vw - 2rem)"

export function ProductCard({
  product,
}: {
  product: PublicProductListItemDTO
}) {
  const titleId = `product-${product.slug}`

  return (
    <article className="h-full">
      <Link
        href={`/produk/${product.slug}`}
        className="group block h-full outline-none"
        aria-labelledby={titleId}
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
            <CardAction>
              <ArrowUpRight
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </CardAction>
            <CardTitle
              id={titleId}
              role="heading"
              aria-level={3}
              className="text-lg leading-snug group-hover:text-primary"
            >
              {product.name}
            </CardTitle>
            {product.summary ? (
              <CardDescription className="line-clamp-2">
                {product.summary}
              </CardDescription>
            ) : null}
          </CardHeader>

          <CardFooter className="mt-auto">
            <span className="font-semibold tabular-nums">
              {formatIdr(product.price.amount)}
            </span>
          </CardFooter>
        </Card>
      </Link>
    </article>
  )
}
