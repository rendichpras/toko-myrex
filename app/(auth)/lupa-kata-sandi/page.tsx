import type { Metadata } from "next"

import { AuthPage } from "@/components/auth/auth-page"
import { ForgotPasswordCard } from "@/components/auth/forgot-password-card"

export const metadata: Metadata = {
  title: "Atur ulang kata sandi | Toko Myrex",
  description: "Minta tautan untuk mengatur ulang kata sandi Toko Myrex.",
}

export default function ForgotPasswordPage() {
  return (
    <AuthPage>
      <ForgotPasswordCard />
    </AuthPage>
  )
}
