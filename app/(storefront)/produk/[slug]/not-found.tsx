import Link from "next/link"
import { ArrowLeft, PackageX } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex max-w-7xl flex-1 px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
      <Empty className="border bg-muted/20 py-20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageX aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle role="heading" aria-level={1}>
            Produk tidak tersedia
          </EmptyTitle>
          <EmptyDescription>
            Produk ini tidak ditemukan atau belum tersedia untuk publik.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/#produk" />}>
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Kembali ke katalog
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
