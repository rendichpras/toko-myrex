"use client"

import Link from "next/link"
import { useState } from "react"

import { AuthFormMessage } from "@/components/auth/auth-form-message"
import { AuthPanel } from "@/components/auth/auth-panel"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import {
  authConnectionErrorMessage,
  getAuthErrorMessage,
} from "@/lib/auth-error"

export function VerifyEmailCard({ token }: { token: string }) {
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleVerification() {
    setMessage("")
    setPending(true)

    try {
      const { error } = await authClient.verifyEmail({
        query: { token },
      })

      if (error) {
        setMessage(
          getAuthErrorMessage(
            error,
            "Tidak dapat memverifikasi email. Buka tautan terbaru, lalu coba lagi."
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

  if (!token) {
    return (
      <AuthPanel
        title="Buka tautan verifikasi"
        description="Buka tautan verifikasi terbaru yang dikirim melalui email."
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

  if (success) {
    return (
      <AuthPanel
        title="Email terverifikasi"
        description="Akun Toko Myrex siap digunakan."
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
      description="Verifikasi email untuk mengaktifkan akun."
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
      <div className="grid gap-4" aria-busy={pending}>
        {message ? <AuthFormMessage message={message} /> : null}
        <Button
          type="button"
          size="lg"
          disabled={pending}
          onClick={handleVerification}
        >
          {pending ? (
            <>
              <Spinner aria-hidden="true" />
              Memverifikasi...
            </>
          ) : (
            "Verifikasi email"
          )}
        </Button>
      </div>
    </AuthPanel>
  )
}
