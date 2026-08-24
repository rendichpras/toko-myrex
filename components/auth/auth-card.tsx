import { AuthNavigation } from "@/components/auth/auth-navigation"
import { AuthPanel } from "@/components/auth/auth-panel"
import { SignInForm } from "@/components/auth/sign-in-form"
import { SignUpForm } from "@/components/auth/sign-up-form"

type AuthMode = "sign-in" | "sign-up"

export function AuthCard({
  mode,
  redirectTo,
}: {
  mode: AuthMode
  redirectTo?: string
}) {
  const signIn = mode === "sign-in"

  return (
    <AuthPanel
      title={signIn ? "Masuk ke Toko Myrex" : "Buat akun Toko Myrex"}
      description={
        signIn
          ? "Masukkan email dan kata sandi untuk melanjutkan."
          : "Masukkan data untuk membuat akun."
      }
      navigation={<AuthNavigation mode={mode} />}
    >
      {signIn ? <SignInForm redirectTo={redirectTo} /> : <SignUpForm />}
    </AuthPanel>
  )
}
