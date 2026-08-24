import type { Metadata } from "next"
import { ReceiptText } from "lucide-react"

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
  title: "Pesanan",
}

export default async function AdminOrdersPage() {
  await requireAdmin("/admin/pesanan")

  return (
    <AdminPage
      title="Pesanan"
      description="Pantau pembayaran dan status pemenuhan setiap pesanan."
    >
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptText aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle role="heading" aria-level={2}>
            Belum ada pesanan
          </EmptyTitle>
          <EmptyDescription>
            Pesanan baru akan ditampilkan di sini setelah pelanggan
            menyelesaikan checkout.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </AdminPage>
  )
}
