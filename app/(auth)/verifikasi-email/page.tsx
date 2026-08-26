import type { Metadata } from "next"

import { EmailVerificationCard } from "@/components/auth/email-verification-card"

export const metadata: Metadata = {
  title: "Verifikasi email",
  description: "Konfirmasi alamat email untuk mengaktifkan akun Anda.",
}

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = await searchParams
  const verificationToken = Array.isArray(token) ? token[0] : token

  return <EmailVerificationCard token={verificationToken ?? ""} />
}
