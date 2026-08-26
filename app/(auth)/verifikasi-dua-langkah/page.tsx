import type { Metadata } from "next"
import Link from "next/link"

import { AuthPanel } from "@/components/auth/auth-panel"
import { TwoFactorChallengeForm } from "@/components/auth/two-factor-challenge-form"
import {
  ADMIN_HOME_PATH,
  getSafeRedirectPath,
} from "@/lib/auth/safe-redirect"
import { redirectAuthenticatedUser } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Verifikasi dua langkah",
  description: "Konfirmasi identitas Anda untuk melanjutkan.",
}

export default async function TwoFactorVerificationPage({
  searchParams,
}: PageProps<"/verifikasi-dua-langkah">) {
  const requestedPath = getSafeRedirectPath((await searchParams).next, "")

  await redirectAuthenticatedUser(requestedPath || undefined)

  const redirectTo = requestedPath || ADMIN_HOME_PATH

  return (
    <AuthPanel
      title="Verifikasi identitas"
      description="Masukkan kode dari aplikasi autentikator Anda."
      footer={
        <Link
          href={`/masuk?next=${encodeURIComponent(redirectTo)}`}
          className="text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Kembali ke halaman masuk
        </Link>
      }
    >
      <TwoFactorChallengeForm redirectTo={redirectTo} />
    </AuthPanel>
  )
}
