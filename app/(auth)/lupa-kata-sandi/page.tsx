import type { Metadata } from "next"

import { PasswordResetRequestCard } from "@/components/auth/password-reset-request-card"

export const metadata: Metadata = {
  title: "Atur ulang kata sandi",
  description: "Dapatkan tautan untuk membuat kata sandi baru.",
}

export default function ForgotPasswordPage() {
  return <PasswordResetRequestCard />
}
