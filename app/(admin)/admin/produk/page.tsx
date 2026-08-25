import type { Metadata } from "next"
import { Package } from "lucide-react"

import { AdminPage } from "@/components/admin/admin-page"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { requireAdmin } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Produk",
}

export default async function AdminProductsPage() {
  await requireAdmin("/admin/produk")

  return (
    <AdminPage
      title="Produk"
      description="Kelola katalog, harga, dan akses produk digital."
    >
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle role="heading" aria-level={2}>
            Belum ada produk
          </EmptyTitle>
          <EmptyDescription>
            Produk yang ditambahkan akan muncul di sini dan dapat dipublikasikan
            ke toko.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </AdminPage>
  )
}
