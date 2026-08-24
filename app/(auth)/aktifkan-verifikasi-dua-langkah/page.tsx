import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthPage } from "@/components/auth/auth-page"
import { AuthPanel } from "@/components/auth/auth-panel"
import { TwoFactorSetupForm } from "@/components/auth/two-factor-setup-form"
import { getSafeRedirectPath } from "@/lib/safe-redirect"
import { requireAdminIdentity } from "@/lib/session"

const setupPath = "/aktifkan-verifikasi-dua-langkah"

export const metadata: Metadata = {
  title: "Aktifkan verifikasi dua langkah | Toko Myrex",
  description: "Lindungi panel admin Toko Myrex dengan aplikasi autentikator.",
}

export default async function TwoFactorSetupPage({
  searchParams,
}: PageProps<"/aktifkan-verifikasi-dua-langkah">) {
  const requestedPath = getSafeRedirectPath((await searchParams).next, "/admin")
  const redirectTo = requestedPath.startsWith(setupPath)
    ? "/admin"
    : requestedPath
  const currentPath = `${setupPath}?next=${encodeURIComponent(redirectTo)}`
  const session = await requireAdminIdentity(currentPath)

  if (session.user.twoFactorEnabled) {
    redirect(redirectTo)
  }

  return (
    <AuthPage>
      <AuthPanel
        title="Aktifkan verifikasi dua langkah"
        description="Hubungkan aplikasi autentikator untuk melindungi panel admin."
      >
        <TwoFactorSetupForm redirectTo={redirectTo} />
      </AuthPanel>
    </AuthPage>
  )
}
