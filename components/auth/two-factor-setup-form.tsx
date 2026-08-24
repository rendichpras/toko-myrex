"use client"

import { Copy } from "lucide-react"
import { useRouter } from "next/navigation"
import QRCode from "react-qr-code"
import { useState, type FormEvent } from "react"

import { AuthFormMessage } from "@/components/auth/auth-form-message"
import { AuthInput } from "@/components/auth/auth-input"
import { AuthSubmitButton } from "@/components/auth/auth-submit-button"
import { focusFirstInvalidField } from "@/components/auth/form-errors"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { authClient } from "@/lib/auth-client"
import {
  authConnectionErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth-error"
import { totpCodeSchema } from "@/lib/validations/two-factor"

type Enrollment = {
  backupCodes: string[]
  totpURI: string
}

function getSetupKey(totpURI: string) {
  try {
    return new URL(totpURI).searchParams.get("secret") ?? ""
  } catch {
    return ""
  }
}

export function TwoFactorSetupForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [verified, setVerified] = useState(false)
  const [code, setCode] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [copyMessage, setCopyMessage] = useState("")

  async function startEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    const password = new FormData(event.currentTarget).get("password")

    if (typeof password !== "string" || !password) {
      setFieldError("Masukkan kata sandi.")
      focusFirstInvalidField(event.currentTarget)
      return
    }

    setFieldError("")
    setPending(true)

    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
        method: "totp",
      })

      if (error) {
        if (error.code === "INVALID_PASSWORD") {
          setFieldError("Kata sandi tidak cocok.")
          focusFirstInvalidField(event.currentTarget)
        } else {
          setMessage(
            getAuthErrorMessage(
              error,
              "Tidak dapat menyiapkan verifikasi dua langkah. Coba lagi."
            )
          )
        }
        return
      }

      if (!data || data.method !== "totp") {
        setMessage("Tidak dapat menyiapkan aplikasi autentikator. Coba lagi.")
        return
      }

      setEnrollment({
        backupCodes: data.backupCodes,
        totpURI: data.totpURI,
      })
    } catch {
      setMessage(authConnectionErrorMessage)
    } finally {
      setPending(false)
    }
  }

  async function verifyEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    const result = totpCodeSchema.safeParse(code)

    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? "Kode tidak cocok.")
      focusFirstInvalidField(event.currentTarget)
      return
    }

    setFieldError("")
    setPending(true)

    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: result.data,
        trustDevice: false,
      })

      if (error) {
        const errorMessage = getAuthErrorMessage(
          error,
          "Tidak dapat memverifikasi kode. Coba lagi."
        )

        if (error.code === "INVALID_CODE") {
          setFieldError(errorMessage)
          focusFirstInvalidField(event.currentTarget)
        } else {
          setMessage(errorMessage)
        }
        return
      }

      setVerified(true)
    } catch {
      setMessage(authConnectionErrorMessage)
    } finally {
      setPending(false)
    }
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage(successMessage)
    } catch {
      setCopyMessage("Tidak dapat menyalin. Pilih dan salin teks secara manual.")
    }
  }

  if (!enrollment) {
    return (
      <form
        noValidate
        aria-busy={pending}
        onSubmit={startEnrollment}
        className="grid gap-5"
      >
        <Field data-invalid={Boolean(fieldError)}>
          <FieldLabel htmlFor="two-factor-password">Kata sandi</FieldLabel>
          <PasswordInput
            id="two-factor-password"
            name="password"
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            aria-invalid={Boolean(fieldError)}
            aria-describedby={
              fieldError
                ? "two-factor-password-description two-factor-password-error"
                : "two-factor-password-description"
            }
            onChange={() => {
              setFieldError("")
              setMessage("")
            }}
            required
          />
          <FieldDescription id="two-factor-password-description">
            Masukkan kata sandi untuk melanjutkan.
          </FieldDescription>
          <FieldError id="two-factor-password-error">{fieldError}</FieldError>
        </Field>

        {message ? <AuthFormMessage message={message} /> : null}

        <AuthSubmitButton pending={pending} pendingLabel="Menyiapkan...">
          Siapkan aplikasi autentikator
        </AuthSubmitButton>
      </form>
    )
  }

  if (!verified) {
    const setupKey = getSetupKey(enrollment.totpURI)

    return (
      <form
        noValidate
        aria-busy={pending}
        onSubmit={verifyEnrollment}
        className="grid gap-5"
      >
        <div className="grid gap-3 text-center">
          <p className="text-sm font-medium">Pindai kode QR</p>
          <p className="text-xs text-muted-foreground">
            Pindai dengan aplikasi autentikator, seperti Microsoft Authenticator
            atau Google Authenticator.
          </p>
          <div className="mx-auto w-48 bg-background p-3 ring-1 ring-border">
            <QRCode
              value={enrollment.totpURI}
              bgColor="var(--background)"
              fgColor="var(--foreground)"
              className="h-auto w-full"
              role="img"
              aria-label="Kode QR untuk menghubungkan aplikasi autentikator"
            />
          </div>
        </div>

        {setupKey ? (
          <div className="grid gap-2">
            <p className="text-xs text-muted-foreground">
              Tidak bisa memindai? Masukkan kunci penyiapan secara manual.
            </p>
            <code className="break-all border bg-muted p-2 text-center font-mono text-xs">
              {setupKey}
            </code>
            <Button
              type="button"
              variant="outline"
              onClick={() => copyText(setupKey, "Kunci penyiapan disalin.")}
            >
              <Copy data-icon="inline-start" aria-hidden="true" />
              Salin kunci penyiapan
            </Button>
          </div>
        ) : null}

        <Field data-invalid={Boolean(fieldError)}>
          <FieldLabel htmlFor="two-factor-enrollment-code">
            Kode verifikasi
          </FieldLabel>
          <AuthInput
            id="two-factor-enrollment-code"
            name="code"
            type="text"
            value={code}
            placeholder="000000"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={
              fieldError
                ? "two-factor-enrollment-code-description two-factor-enrollment-code-error"
                : "two-factor-enrollment-code-description"
            }
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              setFieldError("")
              setMessage("")
            }}
            required
          />
          <FieldDescription id="two-factor-enrollment-code-description">
            Masukkan 6 digit dari aplikasi untuk menyelesaikan aktivasi.
          </FieldDescription>
          <FieldError id="two-factor-enrollment-code-error">
            {fieldError}
          </FieldError>
        </Field>

        {copyMessage ? (
          <p role="status" className="text-xs text-muted-foreground">
            {copyMessage}
          </p>
        ) : null}
        {message ? <AuthFormMessage message={message} /> : null}

        <AuthSubmitButton pending={pending} pendingLabel="Memverifikasi...">
          Aktifkan verifikasi dua langkah
        </AuthSubmitButton>
      </form>
    )
  }

  return (
    <div className="grid gap-5">
      <AuthFormMessage
        variant="success"
        message="Verifikasi dua langkah aktif."
      />

      <div className="grid gap-3">
        <div>
          <p className="text-sm font-medium">Simpan kode cadangan</p>
          <p className="text-xs text-muted-foreground">
            Simpan di tempat aman. Gunakan satu kode jika aplikasi autentikator
            tidak tersedia. Setiap kode hanya berlaku sekali.
          </p>
        </div>
        <ul
          className="grid grid-cols-2 gap-2 border bg-muted p-3"
          aria-label="Kode cadangan verifikasi dua langkah"
        >
          {enrollment.backupCodes.map((backupCode) => (
            <li key={backupCode} className="text-center">
              <code className="font-mono text-xs">{backupCode}</code>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            copyText(
              enrollment.backupCodes.join("\n"),
              "Kode cadangan disalin."
            )
          }
        >
          <Copy data-icon="inline-start" aria-hidden="true" />
          Salin semua kode
        </Button>
        {copyMessage ? (
          <p role="status" className="text-xs text-muted-foreground">
            {copyMessage}
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        size="lg"
        onClick={() => {
          router.replace(redirectTo)
          router.refresh()
        }}
      >
        Masuk ke panel admin
      </Button>
    </div>
  )
}
