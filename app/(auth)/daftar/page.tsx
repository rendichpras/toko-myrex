import type { Metadata } from "next"

import { AuthCard } from "@/components/auth/auth-card"
import { AuthPage } from "@/components/auth/auth-page"

export const metadata: Metadata = {
  title: "Buat akun | Toko Myrex",
  description: "Buat akun untuk membeli dan mengakses produk digital.",
}

export default function SignUpPage() {
  return (
    <AuthPage>
      <AuthCard mode="sign-up" />
    </AuthPage>
  )
}
