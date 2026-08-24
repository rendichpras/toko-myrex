"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"

import { AuthFormMessage } from "@/components/auth/auth-form-message"
import { AuthInput } from "@/components/auth/auth-input"
import { AuthPanel } from "@/components/auth/auth-panel"
import { AuthSubmitButton } from "@/components/auth/auth-submit-button"
import {
  clearFieldError,
  focusFirstInvalidField,
  hasFieldError,
} from "@/components/auth/form-errors"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { authClient } from "@/lib/auth-client"
import {
  authConnectionErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth-error"
import {
  forgotPasswordSchema,
  type AuthFormState,
} from "@/lib/validations/auth"

export function ForgotPasswordCard() {
  const [errors, setErrors] = useState<AuthFormState["errors"]>({})
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    const result = forgotPasswordSchema.safeParse(
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
      const redirectTo = new URL(
        "/atur-ulang-kata-sandi",
        window.location.origin
      ).toString()
      const { error } = await authClient.requestPasswordReset({
        email: result.data.email,
        redirectTo,
      })

      if (error) {
        setMessage(
          getAuthErrorMessage(
            error,
            "Tidak dapat mengirim tautan. Coba lagi."
          )
        )
        return
      }

      setSuccess(true)
    } catch {
      setMessage(authConnectionErrorMessage)
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthPanel
      title={success ? "Periksa email" : "Atur ulang kata sandi"}
      description={
        success
          ? "Buka tautan dalam email untuk membuat kata sandi baru."
          : "Masukkan email untuk menerima tautan pengaturan ulang kata sandi."
      }
      footer={
        <Button
          variant="link"
          render={<Link href="/masuk" />}
          nativeButton={false}
        >
          Kembali ke halaman masuk
        </Button>
      }
    >
      {success ? (
        <AuthFormMessage
          variant="success"
          message="Jika email terhubung ke akun, tautan telah dikirim. Periksa kotak masuk dan folder spam."
        />
      ) : (
        <form
          noValidate
          aria-busy={pending}
          onSubmit={handleSubmit}
          className="grid gap-5"
        >
          <Field data-invalid={hasFieldError(errors, "email")}>
            <FieldLabel htmlFor="forgot-password-email">
              Email
            </FieldLabel>
            <AuthInput
              id="forgot-password-email"
              name="email"
              type="email"
              placeholder="nama@contoh.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="email"
              aria-invalid={hasFieldError(errors, "email")}
              aria-describedby={
                hasFieldError(errors, "email")
                  ? "forgot-password-email-error"
                  : undefined
              }
              onChange={() => {
                setMessage("")
                setErrors((current) => clearFieldError(current, "email"))
              }}
              required
            />
            <FieldError id="forgot-password-email-error">
              {errors?.email?.[0]}
            </FieldError>
          </Field>

          {message ? <AuthFormMessage message={message} /> : null}

          <AuthSubmitButton pending={pending} pendingLabel="Mengirim tautan...">
            Kirim tautan pengaturan ulang
          </AuthSubmitButton>
        </form>
      )}
    </AuthPanel>
  )
}
