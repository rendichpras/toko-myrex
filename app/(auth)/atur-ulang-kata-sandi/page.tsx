import type { Metadata } from "next"

import { AuthPage } from "@/components/auth/auth-page"
import { ResetPasswordCard } from "@/components/auth/reset-password-card"

export const metadata: Metadata = {
  title: "Atur ulang kata sandi | Toko Myrex",
  description: "Buat kata sandi baru untuk akun Toko Myrex.",
}

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams
  const resetToken = Array.isArray(token) ? token[0] : token

  return (
    <AuthPage>
      <ResetPasswordCard token={resetToken ?? ""} />
    </AuthPage>
  )
}
