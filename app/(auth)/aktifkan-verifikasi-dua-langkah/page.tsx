import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthPanel } from "@/components/auth/auth-panel"
import { TwoFactorSetupForm } from "@/components/auth/two-factor-setup-form"
import {
  ADMIN_HOME_PATH,
  getSafeRedirectPath,
} from "@/lib/auth/safe-redirect"
import { requireAdminIdentity } from "@/lib/auth/session"

const setupPath = "/aktifkan-verifikasi-dua-langkah"

export const metadata: Metadata = {
  title: "Aktifkan verifikasi dua langkah",
  description: "Tambahkan perlindungan untuk akun admin Anda.",
}

export default async function TwoFactorSetupPage({
  searchParams,
}: PageProps<"/aktifkan-verifikasi-dua-langkah">) {
  const requestedPath = getSafeRedirectPath(
    (await searchParams).next,
    ADMIN_HOME_PATH
  )
  const redirectTo = requestedPath.startsWith(setupPath)
    ? ADMIN_HOME_PATH
    : requestedPath
  const currentPath = `${setupPath}?next=${encodeURIComponent(redirectTo)}`
  const session = await requireAdminIdentity(currentPath)

  if (session.user.twoFactorEnabled) {
    redirect(redirectTo)
  }

  return (
    <AuthPanel
      title="Aktifkan verifikasi dua langkah"
      description="Hubungkan aplikasi autentikator untuk melindungi akun Anda."
    >
      <TwoFactorSetupForm redirectTo={redirectTo} />
    </AuthPanel>
  )
}
