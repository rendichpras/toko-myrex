import type { Metadata } from "next"

import { NewPasswordCard } from "@/components/auth/new-password-card"

export const metadata: Metadata = {
  title: "Atur ulang kata sandi",
  description: "Buat kata sandi baru untuk akun Anda.",
}

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams
  const resetToken = Array.isArray(token) ? token[0] : token

  return <NewPasswordCard token={resetToken ?? ""} />
}
