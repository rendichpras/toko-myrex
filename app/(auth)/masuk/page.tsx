import type { Metadata } from "next"

import { AuthCard } from "@/components/auth/auth-card"
import { AuthPage } from "@/components/auth/auth-page"

export const metadata: Metadata = {
  title: "Masuk | Toko Myrex",
  description: "Masuk ke akun Toko Myrex.",
}

function getSafeRedirectPath(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value

  if (!path?.startsWith("/") || path.startsWith("//")) {
    return "/"
  }

  try {
    const baseUrl = new URL("https://toko-myrex.local")
    const targetUrl = new URL(path, baseUrl)

    if (targetUrl.origin !== baseUrl.origin) {
      return "/"
    }

    return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
  } catch {
    return "/"
  }
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
