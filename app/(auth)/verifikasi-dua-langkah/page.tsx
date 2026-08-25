import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthPanel } from "@/components/auth/auth-panel"
import { TwoFactorChallengeForm } from "@/components/auth/two-factor-challenge-form"
import { hasUserRole } from "@/lib/auth/roles"
import {
  getSafeRedirectPath,
  resolvePostSignInPath,
} from "@/lib/auth/safe-redirect"
import { getSession } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Verifikasi dua langkah | Toko Myrex",
  description: "Selesaikan proses masuk dengan verifikasi dua langkah.",
}

export default async function TwoFactorVerificationPage({
  searchParams,
}: PageProps<"/verifikasi-dua-langkah">) {
  const requestedPath = getSafeRedirectPath((await searchParams).next, "")
  const session = await getSession()

  if (session) {
    const userIsAdmin = hasUserRole(session.user.role, "admin")
    const redirectTo = resolvePostSignInPath(requestedPath, userIsAdmin)

    if (
      userIsAdmin && !session.user.twoFactorEnabled
    ) {
      redirect(
        `/aktifkan-verifikasi-dua-langkah?next=${encodeURIComponent(
          redirectTo.startsWith("/admin") ? redirectTo : "/admin"
        )}`
      )
    }

    redirect(redirectTo)
  }

  const redirectTo = requestedPath || "/admin"

  return (
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
  )
}
