import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthPage } from "@/components/auth/auth-page"
import { AuthPanel } from "@/components/auth/auth-panel"
import { TwoFactorChallengeForm } from "@/components/auth/two-factor-challenge-form"
import { getSafeRedirectPath } from "@/lib/safe-redirect"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Verifikasi dua langkah | Toko Myrex",
  description: "Selesaikan proses masuk dengan verifikasi dua langkah.",
}

export default async function TwoFactorVerificationPage({
  searchParams,
}: PageProps<"/verifikasi-dua-langkah">) {
  const redirectTo = getSafeRedirectPath((await searchParams).next)
  const session = await getSession()

  if (session) {
    const roles = session.user.role?.split(",").map((role) => role.trim()) ?? []

    if (roles.includes("admin") && !session.user.twoFactorEnabled) {
      redirect(
        `/aktifkan-verifikasi-dua-langkah?next=${encodeURIComponent(
          redirectTo.startsWith("/admin") ? redirectTo : "/admin"
        )}`
      )
    }

    redirect(redirectTo)
  }

  return (
    <AuthPage>
      <AuthPanel
        title="Verifikasi identitas"
        description="Masukkan kode dari aplikasi autentikator untuk masuk."
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
    </AuthPage>
  )
}
