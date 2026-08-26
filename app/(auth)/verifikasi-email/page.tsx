import type { Metadata } from "next"

import { EmailVerificationCard } from "@/components/auth/email-verification-card"

export const metadata: Metadata = {
  title: "Verifikasi email",
  description: "Konfirmasi alamat email untuk mengaktifkan akun Anda.",
}

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verifikasi-email">) {
  const { token } = await searchParams
  const verificationToken = Array.isArray(token) ? token[0] : token

  return <EmailVerificationCard token={verificationToken ?? ""} />
}
