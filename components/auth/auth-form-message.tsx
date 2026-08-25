import { CircleAlert, CircleCheck } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
    >
      <Icon aria-hidden="true" />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
