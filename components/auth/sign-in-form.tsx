"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { AuthFormMessage } from "@/components/auth/auth-form-message"
import { AuthInput } from "@/components/auth/auth-input"
import { AuthSubmitButton } from "@/components/auth/auth-submit-button"
import {
  clearFieldError,
  focusFirstInvalidField,
  hasFieldError,
} from "@/components/auth/form-errors"
import { PasswordInput } from "@/components/auth/password-input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { authClient } from "@/lib/auth-client"
import { getAuthErrorMessage } from "@/lib/auth-error"
import {
  signInSchema,
  type AuthFormState,
} from "@/lib/validations/auth"

export function SignInForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter()
  const [errors, setErrors] = useState<AuthFormState["errors"]>({})
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    const result = signInSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget))
    )

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors)
      focusFirstInvalidField(event.currentTarget)
      return
    }

    setErrors({})
    setPending(true)

    try {
      const { error } = await authClient.signIn.email(result.data)

      if (error) {
        setMessage(
          getAuthErrorMessage(error, "Tidak dapat masuk. Coba lagi.")
        )
        return
      }

      router.replace(redirectTo)
      router.refresh()
    } catch {
      setMessage("Koneksi bermasalah. Periksa koneksi internet, lalu coba lagi.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      noValidate
      aria-busy={pending}
      onSubmit={handleSubmit}
      className="grid gap-5"
    >
      <Field data-invalid={hasFieldError(errors, "email")}>
        <FieldLabel htmlFor="sign-in-email">
          Email
        </FieldLabel>
        <AuthInput
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
            setMessage("")
            setErrors((current) => clearFieldError(current, "email"))
          }}
          required
        />
        <FieldError id="sign-in-email-error">{errors?.email?.[0]}</FieldError>
      </Field>

      <Field data-invalid={hasFieldError(errors, "password")}>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="sign-in-password">
            Kata sandi
          </FieldLabel>
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
            setMessage("")
            setErrors((current) => clearFieldError(current, "password"))
          }}
          required
        />
        <FieldError id="sign-in-password-error">
          {errors?.password?.[0]}
        </FieldError>
      </Field>

      {message ? <AuthFormMessage message={message} /> : null}

      <AuthSubmitButton pending={pending} pendingLabel="Sedang masuk...">
        Masuk
      </AuthSubmitButton>
    </form>
  )
}
