"use client"

import Link from "next/link"
import { useState } from "react"

import { AuthFormMessage } from "@/components/auth/auth-form-message"
import { AuthPanel } from "@/components/auth/auth-panel"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth/client"
import {
  authConnectionErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth/errors"

export function EmailVerificationCard({ token }: { token: string }) {
  const [verificationError, setVerificationError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)

  async function verifyEmail() {
    setVerificationError("")
    setIsVerifying(true)

    try {
      const { error } = await authClient.verifyEmail({
        query: { token },
      })

      if (error) {
        setVerificationError(
          getAuthErrorMessage(
            error,
            "Email belum diverifikasi. Buka tautan terbaru, lalu coba lagi."
          )
        )
        return
      }

      setEmailVerified(true)
    } catch {
      setVerificationError(authConnectionErrorMessage)
    } finally {
      setIsVerifying(false)
    }
  }

  if (!token) {
    return (
      <AuthPanel
        title="Buka tautan verifikasi"
        description="Gunakan tautan verifikasi terbaru yang kami kirim melalui email."
      >
        <Button
          variant="outline"
          size="lg"
          render={<Link href="/masuk" />}
          nativeButton={false}
        >
          Kembali ke halaman masuk
        </Button>
      </AuthPanel>
    )
  }

  if (emailVerified) {
    return (
      <AuthPanel
        title="Email terverifikasi"
        description="Akun Toko Myrex Anda siap digunakan."
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
      title="Verifikasi email"
      description="Konfirmasi alamat email untuk mengaktifkan akun Anda."
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
      <div className="grid gap-4" aria-busy={isVerifying}>
        {verificationError ? (
          <AuthFormMessage message={verificationError} />
        ) : null}
        <Button
          type="button"
          size="lg"
          disabled={isVerifying}
          onClick={verifyEmail}
        >
          {isVerifying ? (
            <>
              <Spinner aria-hidden="true" />
              Memverifikasi email
            </>
          ) : (
            "Verifikasi email"
          )}
        </Button>
      </div>
    </AuthPanel>
  )
}
