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

export const metadata: Metadata = {
  title: "Pesanan",
}

export default function AdminOrdersPage() {
  return (
    <AdminPage
      title="Pesanan"
      description="Pantau pembayaran dan proses setiap pesanan."
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
            Pesanan baru akan muncul setelah pelanggan menyelesaikan pembayaran.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </AdminPage>
  )
}
