import type { ComponentProps } from "react"

import { Input } from "@/components/ui/input"

export function AuthInput(props: ComponentProps<"input">) {
  return <Input {...props} />
}
