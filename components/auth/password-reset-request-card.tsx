"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"

import { AuthFormMessage } from "@/components/auth/auth-form-message"
import { AuthPanel } from "@/components/auth/auth-panel"
import { AuthSubmitButton } from "@/components/auth/auth-submit-button"
import {
  clearFieldError,
  focusFirstInvalidField,
  hasFieldError,
} from "@/components/auth/form-errors"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth/client"
import {
  authConnectionErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth/errors"
import {
  forgotPasswordSchema,
  type AuthFormState,
} from "@/lib/auth/validation/credentials"

export function PasswordResetRequestCard() {
  const [errors, setErrors] = useState<AuthFormState["errors"]>({})
  const [formError, setFormError] = useState("")
  const [isSendingResetLink, setIsSendingResetLink] = useState(false)
  const [resetLinkSent, setResetLinkSent] = useState(false)

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")

    const parsedRequest = forgotPasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget))
    )

    if (!parsedRequest.success) {
      setErrors(parsedRequest.error.flatten().fieldErrors)
      focusFirstInvalidField(event.currentTarget)
      return
    }

    setErrors({})
    setIsSendingResetLink(true)

    try {
      const redirectTo = new URL(
        "/atur-ulang-kata-sandi",
        window.location.origin
      ).toString()
      const { error } = await authClient.requestPasswordReset({
        email: parsedRequest.data.email,
        redirectTo,
      })

      if (error) {
        setFormError(
          getAuthErrorMessage(
            error,
            "Tidak dapat mengirim tautan. Coba lagi."
          )
        )
        return
      }

      setResetLinkSent(true)
    } catch {
      setFormError(authConnectionErrorMessage)
    } finally {
      setIsSendingResetLink(false)
    }
  }

  return (
    <AuthPanel
      title={resetLinkSent ? "Periksa email" : "Atur ulang kata sandi"}
      description={
        resetLinkSent
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
      {resetLinkSent ? (
        <AuthFormMessage
          variant="success"
          message="Jika email terhubung ke akun, tautan telah dikirim. Periksa kotak masuk dan folder spam."
        />
      ) : (
        <form
          noValidate
          aria-busy={isSendingResetLink}
          onSubmit={requestPasswordReset}
          className="grid gap-5"
        >
          <Field data-invalid={hasFieldError(errors, "email")}>
            <FieldLabel htmlFor="forgot-password-email">
              Email
            </FieldLabel>
            <Input
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
                setFormError("")
                setErrors((current) => clearFieldError(current, "email"))
              }}
              required
            />
            <FieldError id="forgot-password-email-error">
              {errors?.email?.[0]}
            </FieldError>
          </Field>

          {formError ? <AuthFormMessage message={formError} /> : null}

          <AuthSubmitButton
            pending={isSendingResetLink}
            pendingLabel="Mengirim tautan..."
          >
            Kirim tautan pengaturan ulang
          </AuthSubmitButton>
        </form>
      )}
    </AuthPanel>
  )
}
