import "server-only"

import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { hasUserRole } from "@/lib/auth/roles"
import {
  ADMIN_HOME_PATH,
  isAdminPath,
  resolvePostSignInPath,
} from "@/lib/auth/safe-redirect"

export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
})

export async function redirectAuthenticatedUser(requestedPath?: string) {
  const session = await getSession()

  if (!session) {
    return
  }

  const userIsAdmin = hasUserRole(session.user.role, "admin")
  const destination = resolvePostSignInPath(requestedPath, userIsAdmin)

  if (userIsAdmin && !session.user.twoFactorEnabled) {
    const adminDestination = isAdminPath(destination)
      ? destination
      : ADMIN_HOME_PATH

    redirect(
      `/aktifkan-verifikasi-dua-langkah?next=${encodeURIComponent(
        adminDestination
      )}`
    )
  }

  redirect(destination)
}

export async function requireSession() {
  const session = await getSession()

  if (!session) {
    redirect("/masuk")
  }

  return session
}

export async function requireAdmin(redirectTo = ADMIN_HOME_PATH) {
  const session = await requireAdminIdentity(redirectTo)

  if (!session.user.twoFactorEnabled) {
    redirect(
      `/aktifkan-verifikasi-dua-langkah?next=${encodeURIComponent(redirectTo)}`
    )
  }

  return session
}

export async function requireAdminIdentity(redirectTo = ADMIN_HOME_PATH) {
  const session = await getSession()

  if (!session) {
    redirect(`/masuk?next=${encodeURIComponent(redirectTo)}`)
  }

  if (!hasUserRole(session.user.role, "admin")) {
    redirect("/")
  }

  return session
}
