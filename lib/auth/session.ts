import "server-only"

import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { hasUserRole } from "@/lib/auth/roles"

export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
})

export async function requireSession() {
  const session = await getSession()

  if (!session) {
    redirect("/masuk")
  }

  return session
}

export async function requireAdmin(redirectTo = "/admin") {
  const session = await requireAdminIdentity(redirectTo)

  if (!session.user.twoFactorEnabled) {
    redirect(
      `/aktifkan-verifikasi-dua-langkah?next=${encodeURIComponent(redirectTo)}`
    )
  }

  return session
}

export async function requireAdminIdentity(redirectTo = "/admin") {
  const session = await getSession()

  if (!session) {
    redirect(`/masuk?next=${encodeURIComponent(redirectTo)}`)
  }

  if (!hasUserRole(session.user.role, "admin")) {
    redirect("/")
  }

  return session
}
