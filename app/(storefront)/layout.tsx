import type { ReactNode } from "react"

import { StorefrontHeader } from "@/components/blocks/storefront-header"

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <StorefrontHeader />
      {children}
      <footer className="mt-auto border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-medium text-foreground">Toko Myrex</span>
          <span>Produk digital</span>
        </div>
      </footer>
    </div>
  )
}
