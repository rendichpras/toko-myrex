"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { AuthFormMessage } from "@/components/auth/auth-form-message"
import { AuthSubmitButton } from "@/components/auth/auth-submit-button"
import {
  clearFieldError,
  focusFirstInvalidField,
  hasFieldError,
} from "@/components/auth/form-errors"
import { PasswordInput } from "@/components/auth/password-input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth/client"
import {
  authConnectionErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth/errors"
import { hasUserRole } from "@/lib/auth/roles"
import {
  ADMIN_HOME_PATH,
  resolvePostSignInPath,
} from "@/lib/auth/safe-redirect"
import {
  signInSchema,
  type AuthFormState,
} from "@/lib/auth/validation/credentials"

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter()
  const [errors, setErrors] = useState<AuthFormState["errors"]>({})
  const [formError, setFormError] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")

    const parsedCredentials = signInSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget))
    )

    if (!parsedCredentials.success) {
      setErrors(parsedCredentials.error.flatten().fieldErrors)
      focusFirstInvalidField(event.currentTarget)
      return
    }

    setErrors({})
    setIsSigningIn(true)

    try {
      const { data: signInResult, error } = await authClient.signIn.email(
        parsedCredentials.data
      )

      if (error) {
        setFormError(
          getAuthErrorMessage(error, "Anda belum masuk. Coba lagi.")
        )
        return
      }

      if (
        signInResult &&
        "twoFactorRedirect" in signInResult &&
        signInResult.twoFactorRedirect === true
      ) {
        const twoFactorDestination = redirectTo ?? ADMIN_HOME_PATH

        router.push(
          `/verifikasi-dua-langkah?next=${encodeURIComponent(
            twoFactorDestination
          )}`
        )
        return
      }

      const userIsAdmin = hasUserRole(signInResult?.user.role, "admin")

      if (userIsAdmin && !signInResult?.user.twoFactorEnabled) {
        router.replace(
          `/aktifkan-verifikasi-dua-langkah?next=${encodeURIComponent(
            redirectTo?.startsWith("/admin") ? redirectTo : ADMIN_HOME_PATH
          )}`
        )
        router.refresh()
        return
      }

      router.replace(resolvePostSignInPath(redirectTo, userIsAdmin))
      router.refresh()
    } catch {
      setFormError(authConnectionErrorMessage)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <form
      noValidate
      aria-busy={isSigningIn}
      onSubmit={signIn}
      className="grid gap-5"
    >
      <Field data-invalid={hasFieldError(errors, "email")}>
        <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
        <Input
          id="sign-in-email"
          name="email"
          type="email"
          placeholder="nama@contoh.com"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="email"
          aria-invalid={hasFieldError(errors, "email")}
          aria-describedby={
            hasFieldError(errors, "email") ? "sign-in-email-error" : undefined
          }
          onChange={() => {
            setFormError("")
            setErrors((current) => clearFieldError(current, "email"))
          }}
          required
        />
        <FieldError id="sign-in-email-error">{errors?.email?.[0]}</FieldError>
      </Field>

      <Field data-invalid={hasFieldError(errors, "password")}>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="sign-in-password">Kata sandi</FieldLabel>
          <Link
            href="/lupa-kata-sandi"
            className="text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Lupa kata sandi?
          </Link>
        </div>
        <PasswordInput
          id="sign-in-password"
          name="password"
          placeholder="Masukkan kata sandi"
          autoComplete="current-password"
          aria-invalid={hasFieldError(errors, "password")}
          aria-describedby={
            hasFieldError(errors, "password")
              ? "sign-in-password-error"
              : undefined
          }
          onChange={() => {
            setFormError("")
            setErrors((current) => clearFieldError(current, "password"))
          }}
          required
        />
        <FieldError id="sign-in-password-error">
          {errors?.password?.[0]}
        </FieldError>
      </Field>

      {formError ? <AuthFormMessage message={formError} /> : null}

      <AuthSubmitButton pending={isSigningIn} pendingLabel="Sedang masuk">
        Masuk
      </AuthSubmitButton>
    </form>
  )
}
