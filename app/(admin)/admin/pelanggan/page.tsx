import type { Metadata } from "next"
import { Users } from "lucide-react"

import { AdminPage } from "@/components/admin/admin-page"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Pelanggan",
}

export default async function AdminCustomersPage() {
  await requireAdmin("/admin/pelanggan")

  return (
    <AdminPage
      title="Pelanggan"
      description="Kelola akun pelanggan dan lihat riwayat pembelian mereka."
    >
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle role="heading" aria-level={2}>
            Belum ada pelanggan
          </EmptyTitle>
          <EmptyDescription>
            Pelanggan akan ditampilkan di sini setelah mereka membuat akun atau
            melakukan pembelian.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </AdminPage>
  )
}
