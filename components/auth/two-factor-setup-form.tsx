"use client"

import { Copy } from "lucide-react"
import { useRouter } from "next/navigation"
import QRCode from "react-qr-code"
import { useState, type FormEvent } from "react"

import { AuthFormMessage } from "@/components/auth/auth-form-message"
import { AuthSubmitButton } from "@/components/auth/auth-submit-button"
import { focusFirstInvalidField } from "@/components/auth/form-errors"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth/client"
import {
  authConnectionErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth/errors"
import { totpCodeSchema } from "@/lib/auth/validation/two-factor"

type TotpEnrollment = {
  backupCodes: string[]
  totpURI: string
}

function extractTotpSecret(totpURI: string) {
  try {
    return new URL(totpURI).searchParams.get("secret") ?? ""
  } catch {
    return ""
  }
}

export function TwoFactorSetupForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [code, setCode] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clipboardStatus, setClipboardStatus] = useState("")

  async function startTwoFactorSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")

    const password = new FormData(event.currentTarget).get("password")

    if (typeof password !== "string" || !password) {
      setFieldError("Masukkan kata sandi.")
      focusFirstInvalidField(event.currentTarget)
      return
    }

    setFieldError("")
    setIsSubmitting(true)

    try {
      const { data: enrollmentData, error } = await authClient.twoFactor.enable({
        password,
        method: "totp",
      })

      if (error) {
        if (error.code === "INVALID_PASSWORD") {
          setFieldError("Kata sandi salah. Masukkan kembali kata sandi akun.")
          focusFirstInvalidField(event.currentTarget)
        } else {
          setFormError(
            getAuthErrorMessage(
              error,
              "Verifikasi dua langkah belum disiapkan. Coba lagi."
            )
          )
        }
        return
      }

      if (!enrollmentData || enrollmentData.method !== "totp") {
        setFormError("Aplikasi autentikator belum terhubung. Coba lagi.")
        return
      }

      setEnrollment({
        backupCodes: enrollmentData.backupCodes,
        totpURI: enrollmentData.totpURI,
      })
    } catch {
      setFormError(authConnectionErrorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function confirmTwoFactorSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")

    const parsedCode = totpCodeSchema.safeParse(code)

    if (!parsedCode.success) {
      setFieldError(parsedCode.error.issues[0]?.message ?? "Kode tidak cocok.")
      focusFirstInvalidField(event.currentTarget)
      return
    }

    setFieldError("")
    setIsSubmitting(true)

    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: parsedCode.data,
        trustDevice: false,
      })

      if (error) {
        const errorMessage = getAuthErrorMessage(
          error,
          "Kode belum diverifikasi. Coba lagi."
        )

        if (error.code === "INVALID_CODE") {
          setFieldError(errorMessage)
          focusFirstInvalidField(event.currentTarget)
        } else {
          setFormError(errorMessage)
        }
        return
      }

      setTwoFactorEnabled(true)
    } catch {
      setFormError(authConnectionErrorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function copyToClipboard(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value)
      setClipboardStatus(successMessage)
    } catch {
      setClipboardStatus(
        "Teks belum disalin. Pilih teks, lalu salin secara manual."
      )
    }
  }

  if (!enrollment) {
    return (
      <form
        noValidate
        aria-busy={isSubmitting}
        onSubmit={startTwoFactorSetup}
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
              setFormError("")
            }}
            required
          />
          <FieldDescription id="two-factor-password-description">
            Konfirmasi kata sandi akun Anda.
          </FieldDescription>
          <FieldError id="two-factor-password-error">{fieldError}</FieldError>
        </Field>

        {formError ? <AuthFormMessage message={formError} /> : null}

        <AuthSubmitButton pending={isSubmitting} pendingLabel="Menyiapkan">
          Siapkan aplikasi autentikator
        </AuthSubmitButton>
      </form>
    )
  }

  if (!twoFactorEnabled) {
    const setupKey = extractTotpSecret(enrollment.totpURI)

    return (
      <form
        noValidate
        aria-busy={isSubmitting}
        onSubmit={confirmTwoFactorSetup}
        className="grid gap-5"
      >
        <div className="grid gap-3 text-center">
          <p className="text-sm font-medium">Pindai kode QR</p>
          <p className="text-xs text-muted-foreground">
            Pindai dengan Microsoft Authenticator, Google Authenticator, atau
            aplikasi autentikator lainnya.
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
              Tidak dapat memindai? Masukkan kunci penyiapan.
            </p>
            <code className="break-all border bg-muted p-2 text-center font-mono text-xs">
              {setupKey}
            </code>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                copyToClipboard(setupKey, "Kunci penyiapan disalin.")
              }
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
          <Input
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
              setFormError("")
            }}
            required
          />
          <FieldDescription id="two-factor-enrollment-code-description">
            Masukkan kode 6 digit terbaru dari aplikasi autentikator.
          </FieldDescription>
          <FieldError id="two-factor-enrollment-code-error">
            {fieldError}
          </FieldError>
        </Field>

        {clipboardStatus ? (
          <p role="status" className="text-xs text-muted-foreground">
            {clipboardStatus}
          </p>
        ) : null}
        {formError ? <AuthFormMessage message={formError} /> : null}

        <AuthSubmitButton pending={isSubmitting} pendingLabel="Memverifikasi">
          Aktifkan verifikasi dua langkah
        </AuthSubmitButton>
      </form>
    )
  }

  return (
    <div className="grid gap-5">
      <AuthFormMessage
        variant="success"
        message="Verifikasi dua langkah sudah aktif."
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
            copyToClipboard(
              enrollment.backupCodes.join("\n"),
              "Kode cadangan disalin."
            )
          }
        >
          <Copy data-icon="inline-start" aria-hidden="true" />
          Salin semua kode
        </Button>
        {clipboardStatus ? (
          <p role="status" className="text-xs text-muted-foreground">
            {clipboardStatus}
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
