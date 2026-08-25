import type { Metadata } from "next"

import { PasswordResetRequestCard } from "@/components/auth/password-reset-request-card"

export const metadata: Metadata = {
  title: "Atur ulang kata sandi | Toko Myrex",
  description: "Minta tautan untuk mengatur ulang kata sandi Toko Myrex.",
}

export default function ForgotPasswordPage() {
  return <PasswordResetRequestCard />
}
