"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { Check, Circle } from "lucide-react"

import { AuthFormMessage } from "@/components/auth/auth-form-message"
import { AuthPanel } from "@/components/auth/auth-panel"
import { AuthSubmitButton } from "@/components/auth/auth-submit-button"
import {
  clearFieldError,
  focusFirstInvalidField,
  hasFieldError,
} from "@/components/auth/form-errors"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { authClient } from "@/lib/auth/client"
import {
  authConnectionErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth/errors"
import { cn } from "@/lib/utils"
import {
  resetPasswordSchema,
  type AuthFormState,
} from "@/lib/auth/validation/credentials"

function PasswordRule({ valid, children }: { valid: boolean; children: string }) {
  const Icon = valid ? Check : Circle

  return (
    <li
      className={cn(
        "flex items-center gap-2 text-xs leading-5",
        !valid && "text-muted-foreground"
      )}
    >
      <Icon
        className={cn("size-3.5 shrink-0", valid && "text-primary")}
        aria-hidden="true"
      />
      {children}
    </li>
  )
}

export function NewPasswordCard({ token }: { token: string }) {
  const [errors, setErrors] = useState<AuthFormState["errors"]>({})
  const [formError, setFormError] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordUpdated, setPasswordUpdated] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")

  const hasValidLength = password.length >= 8 && password.length <= 128
  const matches =
    passwordConfirmation.length > 0 && password === passwordConfirmation

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")

    const parsedPassword = resetPasswordSchema.safeParse({
      token,
      password,
      passwordConfirmation,
    })

    if (!parsedPassword.success) {
      setErrors(parsedPassword.error.flatten().fieldErrors)
      focusFirstInvalidField(event.currentTarget)
      return
    }

    setErrors({})
    setIsUpdatingPassword(true)

    try {
      const { error } = await authClient.resetPassword({
        newPassword: parsedPassword.data.password,
        token: parsedPassword.data.token,
      })

      if (error) {
        setFormError(
          getAuthErrorMessage(
            error,
            "Tidak dapat memperbarui kata sandi. Minta tautan baru, lalu coba lagi."
          )
        )
        return
      }

      setPasswordUpdated(true)
    } catch {
      setFormError(authConnectionErrorMessage)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (!token) {
    return (
      <AuthPanel
        title="Tautan tidak dapat digunakan"
        description="Tautan ini tidak valid atau sudah kedaluwarsa. Minta tautan baru."
      >
        <Button
          size="lg"
          render={<Link href="/lupa-kata-sandi" />}
          nativeButton={false}
        >
          Minta tautan baru
        </Button>
      </AuthPanel>
    )
  }

  if (passwordUpdated) {
    return (
      <AuthPanel
        title="Kata sandi diperbarui"
        description="Masuk menggunakan kata sandi baru."
      >
        <Button
          size="lg"
          render={<Link href="/masuk" />}
          nativeButton={false}
        >
          Masuk
        </Button>
      </AuthPanel>
    )
  }

  return (
    <AuthPanel
      title="Atur ulang kata sandi"
      description="Buat kata sandi baru untuk akun Toko Myrex."
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
      <form
        noValidate
        aria-busy={isUpdatingPassword}
        onSubmit={updatePassword}
        className="grid gap-5"
      >
        <Field data-invalid={hasFieldError(errors, "password")}>
          <FieldLabel htmlFor="reset-password">
            Kata sandi baru
          </FieldLabel>
          <PasswordInput
            id="reset-password"
            name="password"
            placeholder="Masukkan kata sandi baru"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => {
              setFormError("")
              setPassword(event.target.value)
              setErrors((current) =>
                clearFieldError(
                  clearFieldError(current, "password"),
                  "passwordConfirmation"
                )
              )
            }}
            aria-invalid={hasFieldError(errors, "password")}
            aria-describedby="reset-password-rules reset-password-error"
            required
          />
          <FieldError id="reset-password-error">
            {errors?.password?.[0]}
          </FieldError>
        </Field>

        <Field data-invalid={hasFieldError(errors, "passwordConfirmation")}>
          <FieldLabel htmlFor="reset-password-confirmation">
            Konfirmasi kata sandi
          </FieldLabel>
          <PasswordInput
            id="reset-password-confirmation"
            name="passwordConfirmation"
            placeholder="Ulangi kata sandi baru"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={passwordConfirmation}
            onChange={(event) => {
              setFormError("")
              setPasswordConfirmation(event.target.value)
              setErrors((current) =>
                clearFieldError(current, "passwordConfirmation")
              )
            }}
            aria-invalid={hasFieldError(errors, "passwordConfirmation")}
            aria-describedby="reset-password-rules reset-password-confirmation-error"
            required
          />
          <FieldError id="reset-password-confirmation-error">
            {errors?.passwordConfirmation?.[0]}
          </FieldError>
        </Field>

        <ul id="reset-password-rules" className="grid gap-1">
          <PasswordRule valid={hasValidLength}>
            Berisi 8–128 karakter
          </PasswordRule>
          <PasswordRule valid={matches}>
            Kata sandi cocok
          </PasswordRule>
        </ul>

        {formError ? <AuthFormMessage message={formError} /> : null}

        <AuthSubmitButton
          pending={isUpdatingPassword}
          pendingLabel="Memperbarui..."
        >
          Perbarui kata sandi
        </AuthSubmitButton>
      </form>
    </AuthPanel>
  )
}
