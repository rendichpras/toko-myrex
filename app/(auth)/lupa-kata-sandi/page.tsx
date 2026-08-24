import type { Metadata } from "next"

import { AuthPage } from "@/components/auth/auth-page"
import { ForgotPasswordCard } from "@/components/auth/forgot-password-card"

export const metadata: Metadata = {
  title: "Lupa kata sandi | Toko Myrex",
  description: "Atur ulang kata sandi akun Toko Myrex.",
}

export default function ForgotPasswordPage() {
  return (
    <AuthPage>
      <ForgotPasswordCard />
    </AuthPage>
  )
}
