"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { AuthFormMessage } from "@/components/auth/auth-form-message"
import { AuthSubmitButton } from "@/components/auth/auth-submit-button"
import { focusFirstInvalidField } from "@/components/auth/form-errors"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth/client"
import {
  authConnectionErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth/errors"
import {
  backupCodeSchema,
  totpCodeSchema,
} from "@/lib/auth/validation/two-factor"

export function TwoFactorChallengeForm({
  redirectTo,
}: {
  redirectTo: string
}) {
  const router = useRouter()
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [code, setCode] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [formError, setFormError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  async function verifySecondFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")

    const parsedCode = (
      useBackupCode ? backupCodeSchema : totpCodeSchema
    ).safeParse(code)

    if (!parsedCode.success) {
      setFieldError(parsedCode.error.issues[0]?.message ?? "Kode tidak cocok.")
      focusFirstInvalidField(event.currentTarget)
      return
    }

    setFieldError("")
    setIsVerifying(true)

    try {
      const verification = useBackupCode
        ? await authClient.twoFactor.verifyBackupCode({
            code: parsedCode.data,
            disableSession: false,
            trustDevice: false,
          })
        : await authClient.twoFactor.verifyTotp({
            code: parsedCode.data,
            trustDevice: false,
          })

      if (verification.error) {
        const errorMessage = getAuthErrorMessage(
          verification.error,
          useBackupCode
            ? "Tidak dapat memverifikasi kode cadangan. Coba lagi."
            : "Tidak dapat memverifikasi kode. Coba lagi."
        )

        if (
          verification.error.code === "INVALID_CODE" ||
          verification.error.code === "INVALID_BACKUP_CODE"
        ) {
          setFieldError(errorMessage)
          focusFirstInvalidField(event.currentTarget)
        } else {
          setFormError(errorMessage)
        }
        return
      }

      router.replace(redirectTo)
      router.refresh()
    } catch {
      setFormError(authConnectionErrorMessage)
    } finally {
      setIsVerifying(false)
    }
  }

  function switchVerificationMethod() {
    setUseBackupCode((current) => !current)
    setCode("")
    setFieldError("")
    setFormError("")
  }

  return (
    <form
      noValidate
      aria-busy={isVerifying}
      onSubmit={verifySecondFactor}
      className="grid gap-5"
    >
      <Field data-invalid={Boolean(fieldError)}>
        <FieldLabel htmlFor="two-factor-code">
          {useBackupCode ? "Kode cadangan" : "Kode verifikasi"}
        </FieldLabel>
        <Input
          id="two-factor-code"
          name="code"
          type="text"
          value={code}
          placeholder={useBackupCode ? "Masukkan kode cadangan" : "000000"}
          autoComplete="one-time-code"
          autoCapitalize="none"
          spellCheck={false}
          inputMode={useBackupCode ? "text" : "numeric"}
          maxLength={useBackupCode ? 64 : 6}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={
            fieldError
              ? "two-factor-code-description two-factor-code-error"
              : "two-factor-code-description"
          }
          onChange={(event) => {
            setCode(
              useBackupCode
                ? event.target.value
                : event.target.value.replace(/\D/g, "").slice(0, 6)
            )
            setFieldError("")
            setFormError("")
          }}
          autoFocus
          required
        />
        <FieldDescription id="two-factor-code-description">
          {useBackupCode
            ? "Gunakan kode cadangan yang belum pernah dipakai."
            : "Buka aplikasi autentikator yang terhubung ke akun."}
        </FieldDescription>
        <FieldError id="two-factor-code-error">{fieldError}</FieldError>
      </Field>

      {formError ? <AuthFormMessage message={formError} /> : null}

      <AuthSubmitButton
        pending={isVerifying}
        pendingLabel="Memverifikasi..."
      >
        Verifikasi dan masuk
      </AuthSubmitButton>

      <Button
        type="button"
        variant="link"
        disabled={isVerifying}
        onClick={switchVerificationMethod}
      >
        {useBackupCode
          ? "Gunakan aplikasi autentikator"
          : "Gunakan kode cadangan"}
      </Button>
    </form>
  )
}
