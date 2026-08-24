import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type AuthSubmitButtonProps = ComponentProps<typeof Button> & {
  pending: boolean
  pendingLabel?: string
}

export function AuthSubmitButton({
  children,
  disabled,
  pending,
  pendingLabel = "Memproses...",
  ...props
}: AuthSubmitButtonProps) {
  return (
    <Button
      {...props}
      type="submit"
      size="lg"
      disabled={pending || disabled}
    >
      {pending ? (
        <>
          <Spinner aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
