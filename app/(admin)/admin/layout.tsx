import type { Metadata } from "next"

import { AdminShell } from "@/components/admin/admin-shell"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: {
    default: "Admin | Toko Myrex",
    template: "%s | Admin Toko Myrex",
  },
  description: "Kelola operasional Toko Myrex melalui panel admin.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAdmin()

  return (
    <AdminShell
      user={{
        email: session.user.email,
        name: session.user.name,
      }}
    >
      {children}
    </AdminShell>
  )
}
