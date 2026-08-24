"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { AuthFormMessage } from "@/components/auth/auth-form-message"
import { AuthInput } from "@/components/auth/auth-input"
import { AuthSubmitButton } from "@/components/auth/auth-submit-button"
import { focusFirstInvalidField } from "@/components/auth/form-errors"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { authClient } from "@/lib/auth-client"
import {
  authConnectionErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth-error"
import {
  backupCodeSchema,
  totpCodeSchema,
} from "@/lib/validations/two-factor"

export function TwoFactorChallengeForm({
  redirectTo,
}: {
  redirectTo: string
}) {
  const router = useRouter()
  const [backupMode, setBackupMode] = useState(false)
  const [code, setCode] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    const result = (backupMode ? backupCodeSchema : totpCodeSchema).safeParse(
      code
    )

    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? "Kode tidak cocok.")
      focusFirstInvalidField(event.currentTarget)
      return
    }

    setFieldError("")
    setPending(true)

    try {
      const response = backupMode
        ? await authClient.twoFactor.verifyBackupCode({
            code: result.data,
            disableSession: false,
            trustDevice: false,
          })
        : await authClient.twoFactor.verifyTotp({
            code: result.data,
            trustDevice: false,
          })

      if (response.error) {
        const errorMessage = getAuthErrorMessage(
          response.error,
          backupMode
            ? "Tidak dapat memverifikasi kode cadangan. Coba lagi."
            : "Tidak dapat memverifikasi kode. Coba lagi."
        )

        if (
          response.error.code === "INVALID_CODE" ||
          response.error.code === "INVALID_BACKUP_CODE"
        ) {
          setFieldError(errorMessage)
          focusFirstInvalidField(event.currentTarget)
        } else {
          setMessage(errorMessage)
        }
        return
      }

      router.replace(redirectTo)
      router.refresh()
    } catch {
      setMessage(authConnectionErrorMessage)
    } finally {
      setPending(false)
    }
  }

  function switchMode() {
    setBackupMode((current) => !current)
    setCode("")
    setFieldError("")
    setMessage("")
  }

  return (
    <form
      noValidate
      aria-busy={pending}
      onSubmit={handleSubmit}
      className="grid gap-5"
    >
      <Field data-invalid={Boolean(fieldError)}>
        <FieldLabel htmlFor="two-factor-code">
          {backupMode ? "Kode cadangan" : "Kode verifikasi"}
        </FieldLabel>
        <AuthInput
          id="two-factor-code"
          name="code"
          type="text"
          value={code}
          placeholder={backupMode ? "Masukkan kode cadangan" : "000000"}
          autoComplete="one-time-code"
          autoCapitalize="none"
          spellCheck={false}
          inputMode={backupMode ? "text" : "numeric"}
          maxLength={backupMode ? 64 : 6}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={
            fieldError
              ? "two-factor-code-description two-factor-code-error"
              : "two-factor-code-description"
          }
          onChange={(event) => {
            setCode(
              backupMode
                ? event.target.value
                : event.target.value.replace(/\D/g, "").slice(0, 6)
            )
            setFieldError("")
            setMessage("")
          }}
          autoFocus
          required
        />
        <FieldDescription id="two-factor-code-description">
          {backupMode
            ? "Gunakan kode cadangan yang belum pernah dipakai."
            : "Buka aplikasi autentikator yang terhubung ke akun."}
        </FieldDescription>
        <FieldError id="two-factor-code-error">{fieldError}</FieldError>
      </Field>

      {message ? <AuthFormMessage message={message} /> : null}

      <AuthSubmitButton
        pending={pending}
        pendingLabel="Memverifikasi..."
      >
        Verifikasi dan masuk
      </AuthSubmitButton>

      <Button
        type="button"
        variant="link"
        disabled={pending}
        onClick={switchMode}
      >
        {backupMode
          ? "Gunakan aplikasi autentikator"
          : "Gunakan kode cadangan"}
      </Button>
    </form>
  )
}
