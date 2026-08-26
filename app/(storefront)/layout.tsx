import Link from "next/link"
import type { ReactNode } from "react"
import { Store } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col [--radius:0.625rem]">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <span
              className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"
              aria-hidden="true"
            >
              <Store className="size-4" />
            </span>
            <span className="font-semibold tracking-tight">Toko Myrex</span>
          </Link>

          <nav className="ml-auto hidden md:block" aria-label="Utama">
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href="/#produk" />}
            >
              Katalog
            </Button>
          </nav>

          <nav className="flex items-center gap-1" aria-label="Akun">
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href="/masuk" />}
            >
              Masuk
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/daftar" />}
            >
              <span className="sm:hidden">Daftar</span>
              <span className="hidden sm:inline">Buat akun</span>
            </Button>
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-auto border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span className="font-medium text-foreground">Toko Myrex</span>
          <span>Katalog produk digital</span>
        </div>
      </footer>
    </div>
  )
}
