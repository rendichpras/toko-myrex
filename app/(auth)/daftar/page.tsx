import type { Metadata } from "next"

import { AuthNavigation } from "@/components/auth/auth-navigation"
import { AuthPanel } from "@/components/auth/auth-panel"
import { SignUpForm } from "@/components/auth/sign-up-form"

export const metadata: Metadata = {
  title: "Buat akun | Toko Myrex",
  description: "Buat akun untuk membeli dan mengakses produk digital.",
}

export default function SignUpPage() {
  return (
    <AuthPanel
      title="Buat akun Toko Myrex"
      description="Lengkapi nama, email, dan kata sandi untuk membuat akun."
      navigation={<AuthNavigation activePage="sign-up" />}
    >
      <SignUpForm />
    </AuthPanel>
  )
}
