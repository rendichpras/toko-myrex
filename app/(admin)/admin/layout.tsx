import type { Metadata } from "next"

import { AdminShell } from "@/components/admin/admin-shell"
import { requireAdmin } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
  description: "Kelola operasional toko melalui panel admin.",
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
