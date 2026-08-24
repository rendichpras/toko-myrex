import { CircleAlert, CircleCheck } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"

type AuthFormMessageProps = {
  message: string
  title?: string
  variant?: "error" | "success"
}

export function AuthFormMessage({
  message,
  title,
  variant = "error",
}: AuthFormMessageProps) {
  const success = variant === "success"
  const Icon = success ? CircleCheck : CircleAlert

  return (
    <Alert
      role={success ? "status" : "alert"}
      variant={success ? "default" : "destructive"}
      aria-label={title ?? (success ? "Berhasil" : "Terjadi kesalahan")}
    >
      <Icon aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
