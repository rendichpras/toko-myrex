import type { Metadata } from "next"

import { AuthCard } from "@/components/auth/auth-card"
import { AuthPage } from "@/components/auth/auth-page"
import { getSafeRedirectPath } from "@/lib/safe-redirect"

export const metadata: Metadata = {
  title: "Masuk | Toko Myrex",
  description: "Masuk untuk mengakses akun Toko Myrex.",
}

export default async function SignInPage({
  searchParams,
}: PageProps<"/masuk">) {
  const redirectTo = getSafeRedirectPath((await searchParams).next)

  return (
    <AuthPage>
      <AuthCard mode="sign-in" redirectTo={redirectTo} />
    </AuthPage>
  )
}
