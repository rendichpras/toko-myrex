import type { Metadata } from "next"
import Link from "next/link"
import { Clock3, Package, ReceiptText, Users } from "lucide-react"

import { AdminPage } from "@/components/admin/admin-page"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Dashboard",
}

const sections = [
  {
    title: "Produk",
    description: "Kelola katalog, harga, dan akses produk digital.",
    href: "/admin/produk",
    icon: Package,
  },
  {
    title: "Pesanan",
    description: "Pantau pembayaran dan status pemenuhan pesanan.",
    href: "/admin/pesanan",
    icon: ReceiptText,
  },
  {
    title: "Pelanggan",
    description: "Lihat akun pelanggan dan riwayat pembelian.",
    href: "/admin/pelanggan",
    icon: Users,
  },
] as const

export default async function AdminDashboardPage() {
  const session = await requireAdmin("/admin")
  const firstName = session.user.name.trim().split(/\s+/)[0] || "Admin"

  return (
    <AdminPage
      title="Dashboard"
      description={`Selamat datang, ${firstName}. Kelola operasional Toko Myrex dari satu tempat.`}
    >
      <section aria-labelledby="akses-cepat" className="space-y-3">
        <div className="space-y-1">
          <h2 id="akses-cepat" className="text-sm font-medium">
            Akses cepat
          </h2>
          <p className="text-sm text-muted-foreground">
            Buka bagian yang ingin kamu kelola.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="group grid outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center border bg-muted text-muted-foreground transition-colors group-hover:text-foreground">
                      <section.icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <CardTitle>
                        <h3 className="text-base">{section.title}</h3>
                      </CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="aktivitas-terbaru" className="space-y-3">
        <div className="space-y-1">
          <h2 id="aktivitas-terbaru" className="text-sm font-medium">
            Aktivitas terbaru
          </h2>
          <p className="text-sm text-muted-foreground">
            Pantau aktivitas penting di tokomu.
          </p>
        </div>

        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Clock3 aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle role="heading" aria-level={3}>
              Belum ada aktivitas
            </EmptyTitle>
            <EmptyDescription>
              Pesanan baru dan perubahan penting akan ditampilkan di sini.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </section>
    </AdminPage>
  )
}
