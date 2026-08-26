import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, ImageIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import type { PublicProductListItemDTO } from "@/lib/catalog/dto"
import { formatIdr } from "@/lib/currency"

export function ProductCard({
  product,
}: {
  product: PublicProductListItemDTO
}) {
  return (
    <article className="h-full">
      <Card className="h-full gap-0 py-0">
        <Link
          href={`/produk/${product.slug}`}
          className="group flex h-full flex-col rounded-[inherit] outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
          aria-labelledby={`product-${product.slug}`}
        >
          <div className="flex aspect-4/3 items-center justify-center overflow-hidden bg-muted/60 text-muted-foreground">
            {product.cover.publicUrl ? (
              <Image
                src={product.cover.publicUrl}
                alt={product.cover.altText ?? product.name}
                width={product.cover.width}
                height={product.cover.height}
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
              />
            ) : (
              <ImageIcon className="size-10" aria-hidden="true" />
            )}
          </div>
          <CardContent className="flex flex-1 flex-col gap-4 p-5">
            <div className="grid gap-2">
              <div className="flex items-start justify-between gap-3">
                <CardTitle
                  id={`product-${product.slug}`}
                  role="heading"
                  aria-level={3}
                  className="text-lg leading-snug group-hover:text-primary"
                >
                  {product.name}
                </CardTitle>
                <ArrowUpRight
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
              {product.summary ? (
                <CardDescription className="line-clamp-2 leading-6">
                  {product.summary}
                </CardDescription>
              ) : null}
            </div>
            <p className="mt-auto text-lg font-semibold tabular-nums">
              {formatIdr(product.price.amount)}
            </p>
          </CardContent>
        </Link>
      </Card>
    </article>
  )
}
