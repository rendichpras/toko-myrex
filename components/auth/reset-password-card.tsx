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
import { authClient } from "@/lib/auth-client"
import { getAuthErrorMessage } from "@/lib/auth-error"
import { cn } from "@/lib/utils"
import {
  resetPasswordSchema,
  type AuthFormState,
} from "@/lib/validations/auth"

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

export function ResetPasswordCard({ token }: { token: string }) {
  const [errors, setErrors] = useState<AuthFormState["errors"]>({})
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")

  const hasValidLength = password.length >= 8 && password.length <= 128
  const matches =
    passwordConfirmation.length > 0 && password === passwordConfirmation

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    const result = resetPasswordSchema.safeParse({
      token,
      password,
      passwordConfirmation,
    })

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors)
      focusFirstInvalidField(event.currentTarget)
      return
    }

    setErrors({})
    setPending(true)

    try {
      const { error } = await authClient.resetPassword({
        newPassword: result.data.password,
        token: result.data.token,
      })

      if (error) {
        setMessage(
          getAuthErrorMessage(
            error,
            "Kata sandi tidak dapat diubah. Minta tautan baru, lalu coba lagi."
          )
        )
        return
      }

      setSuccess(true)
    } catch {
      setMessage("Koneksi bermasalah. Periksa koneksi internet, lalu coba lagi.")
    } finally {
      setPending(false)
    }
  }

  if (!token) {
    return (
      <AuthPanel
        title="Tautan tidak valid"
        description="Tautan atur ulang kata sandi tidak valid atau sudah kedaluwarsa."
      >
        <Button
          size="lg"
          render={<Link href="/lupa-kata-sandi" />}
          nativeButton={false}
        >
          Kirim tautan baru
        </Button>
      </AuthPanel>
    )
  }

  if (success) {
    return (
      <AuthPanel
        title="Kata sandi berhasil diubah"
        description="Gunakan kata sandi baru untuk masuk ke akun."
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
      description="Buat kata sandi baru yang tidak digunakan di akun lain."
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
        aria-busy={pending}
        onSubmit={handleSubmit}
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
              setMessage("")
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
              setMessage("")
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

        {message ? <AuthFormMessage message={message} /> : null}

        <AuthSubmitButton pending={pending} pendingLabel="Menyimpan...">
          Simpan kata sandi
        </AuthSubmitButton>
      </form>
    </AuthPanel>
  )
}
