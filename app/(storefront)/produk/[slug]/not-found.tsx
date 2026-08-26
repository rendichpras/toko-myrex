import Link from "next/link"
import { ArrowLeft, PackageX } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-20">
      <Empty className="border py-16">
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
          <Link href="/#produk" className={buttonVariants()}>
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Kembali ke produk
          </Link>
        </EmptyContent>
      </Empty>
    </main>
  )
}
