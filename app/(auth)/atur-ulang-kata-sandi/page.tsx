import type { Metadata } from "next"

import { NewPasswordCard } from "@/components/auth/new-password-card"

export const metadata: Metadata = {
  title: "Atur ulang kata sandi",
  description: "Buat kata sandi baru untuk akun Anda.",
}

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/atur-ulang-kata-sandi">) {
  const { token } = await searchParams
  const resetToken = Array.isArray(token) ? token[0] : token

  return <NewPasswordCard token={resetToken ?? ""} />
}
