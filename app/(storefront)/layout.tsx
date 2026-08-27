import type { ReactNode } from "react"

import { StorefrontFooter } from "@/components/storefront/storefront-footer"
import { StorefrontHeader } from "@/components/storefront/storefront-header"

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <StorefrontHeader />
      {children}
      <StorefrontFooter />
    </div>
  )
}
