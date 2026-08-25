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
  const isSuccess = variant === "success"
  const Icon = isSuccess ? CircleCheck : CircleAlert

  return (
    <Alert
      role={isSuccess ? "status" : "alert"}
      variant={isSuccess ? "default" : "destructive"}
      aria-label={title ?? (isSuccess ? "Berhasil" : "Terjadi kesalahan")}
    >
      <Icon aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
