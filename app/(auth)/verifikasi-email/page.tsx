import type { Metadata } from "next"

import { AuthPage } from "@/components/auth/auth-page"
import { VerifyEmailCard } from "@/components/auth/verify-email-card"

export const metadata: Metadata = {
  title: "Verifikasi email | Toko Myrex",
  description: "Verifikasi email akun Toko Myrex.",
}

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = await searchParams
  const verificationToken = Array.isArray(token) ? token[0] : token

  return (
    <AuthPage>
      <VerifyEmailCard token={verificationToken ?? ""} />
    </AuthPage>
  )
}
