"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"

import { AuthFormMessage } from "@/components/auth/auth-form-message"
import { AuthSubmitButton } from "@/components/auth/auth-submit-button"
import {
  clearFieldError,
  focusFirstInvalidField,
  hasFieldError,
} from "@/components/auth/form-errors"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth/client"
import {
  authConnectionErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth/errors"
import {
  signUpSchema,
  type AuthFormState,
} from "@/lib/auth/validation/credentials"

export function SignUpForm() {
  const [errors, setErrors] = useState<AuthFormState["errors"]>({})
  const [formError, setFormError] = useState("")
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [verificationEmailSent, setVerificationEmailSent] = useState(false)

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")

    const parsedAccount = signUpSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget))
    )

    if (!parsedAccount.success) {
      setErrors(parsedAccount.error.flatten().fieldErrors)
      focusFirstInvalidField(event.currentTarget)
      return
    }

    setErrors({})
    setIsCreatingAccount(true)

    try {
      const { name, email, password } = parsedAccount.data
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/masuk",
      })

      if (error) {
        setFormError(
          getAuthErrorMessage(
            error,
            "Tidak dapat membuat akun. Coba lagi."
          )
        )
        return
      }

      setVerificationEmailSent(true)
    } catch {
      setFormError(authConnectionErrorMessage)
    } finally {
      setIsCreatingAccount(false)
    }
  }

  if (verificationEmailSent) {
    return (
      <div className="grid gap-4">
        <AuthFormMessage
          variant="success"
          message="Buka tautan verifikasi yang dikirim melalui email. Periksa folder spam jika pesan tidak terlihat."
        />
        <Button
          variant="outline"
          size="lg"
          render={<Link href="/masuk" />}
          nativeButton={false}
        >
          Kembali ke halaman masuk
        </Button>
      </div>
    )
  }

  return (
    <form
      noValidate
      aria-busy={isCreatingAccount}
      onSubmit={createAccount}
      className="grid gap-5"
    >
      <Field data-invalid={hasFieldError(errors, "name")}>
        <FieldLabel htmlFor="sign-up-name">
          Nama lengkap
        </FieldLabel>
        <Input
          id="sign-up-name"
          name="name"
          type="text"
          placeholder="Nama lengkap"
          autoComplete="name"
          minLength={2}
          maxLength={100}
          aria-invalid={hasFieldError(errors, "name")}
          aria-describedby={
            hasFieldError(errors, "name") ? "sign-up-name-error" : undefined
          }
          onChange={() => {
            setFormError("")
            setErrors((current) => clearFieldError(current, "name"))
          }}
          required
        />
        <FieldError id="sign-up-name-error">{errors?.name?.[0]}</FieldError>
      </Field>

      <Field data-invalid={hasFieldError(errors, "email")}>
        <FieldLabel htmlFor="sign-up-email">
          Email
        </FieldLabel>
        <Input
          id="sign-up-email"
          name="email"
          type="email"
          placeholder="nama@contoh.com"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="email"
          aria-invalid={hasFieldError(errors, "email")}
          aria-describedby={
            hasFieldError(errors, "email") ? "sign-up-email-error" : undefined
          }
          onChange={() => {
            setFormError("")
            setErrors((current) => clearFieldError(current, "email"))
          }}
          required
        />
        <FieldError id="sign-up-email-error">{errors?.email?.[0]}</FieldError>
      </Field>

      <Field data-invalid={hasFieldError(errors, "password")}>
        <FieldLabel htmlFor="sign-up-password">
          Kata sandi
        </FieldLabel>
        <PasswordInput
          id="sign-up-password"
          name="password"
          placeholder="Buat kata sandi"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          aria-invalid={hasFieldError(errors, "password")}
          aria-describedby="sign-up-password-description sign-up-password-error"
          onChange={() => {
            setFormError("")
            setErrors((current) =>
              clearFieldError(
                clearFieldError(current, "password"),
                "passwordConfirmation"
              )
            )
          }}
          required
        />
        <FieldDescription id="sign-up-password-description">
          Gunakan 8–128 karakter.
        </FieldDescription>
        <FieldError id="sign-up-password-error">
          {errors?.password?.[0]}
        </FieldError>
      </Field>

      <Field data-invalid={hasFieldError(errors, "passwordConfirmation")}>
        <FieldLabel htmlFor="sign-up-password-confirmation">
          Konfirmasi kata sandi
        </FieldLabel>
        <PasswordInput
          id="sign-up-password-confirmation"
          name="passwordConfirmation"
          placeholder="Ulangi kata sandi"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          aria-invalid={hasFieldError(errors, "passwordConfirmation")}
          aria-describedby={
            hasFieldError(errors, "passwordConfirmation")
              ? "sign-up-password-confirmation-error"
              : undefined
          }
          onChange={() => {
            setFormError("")
            setErrors((current) =>
              clearFieldError(current, "passwordConfirmation")
            )
          }}
          required
        />
        <FieldError id="sign-up-password-confirmation-error">
          {errors?.passwordConfirmation?.[0]}
        </FieldError>
      </Field>

      {formError ? <AuthFormMessage message={formError} /> : null}

      <AuthSubmitButton
        pending={isCreatingAccount}
        pendingLabel="Membuat akun..."
      >
        Buat akun
      </AuthSubmitButton>
    </form>
  )
}
