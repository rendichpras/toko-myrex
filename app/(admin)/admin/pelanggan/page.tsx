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

export const metadata: Metadata = {
  title: "Pelanggan",
}

export default function AdminCustomersPage() {
  return (
    <AdminPage
      title="Pelanggan"
      description="Kelola akun pelanggan dan lihat riwayat pembelian."
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
            Pelanggan akan muncul setelah membuat akun atau menyelesaikan
            pembelian.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </AdminPage>
  )
}
