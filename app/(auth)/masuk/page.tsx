import type { Metadata } from "next"

import { AuthNavigation } from "@/components/auth/auth-navigation"
import { AuthPanel } from "@/components/auth/auth-panel"
import { SignInForm } from "@/components/auth/sign-in-form"
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect"

export const metadata: Metadata = {
  title: "Masuk | Toko Myrex",
  description: "Masuk untuk mengakses akun Toko Myrex.",
}

export default async function SignInPage({
  searchParams,
}: PageProps<"/masuk">) {
  const requestedPath = getSafeRedirectPath((await searchParams).next, "")

  return (
    <AuthPanel
      title="Masuk ke Toko Myrex"
      description="Masukkan email dan kata sandi Anda."
      navigation={<AuthNavigation activePage="sign-in" />}
    >
      <SignInForm redirectTo={requestedPath || undefined} />
    </AuthPanel>
  )
}
