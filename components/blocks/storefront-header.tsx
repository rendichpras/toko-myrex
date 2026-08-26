import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export function StorefrontHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
        <Link
          href="/"
          className="justify-self-start font-semibold tracking-tight outline-none focus-visible:underline focus-visible:underline-offset-4"
        >
          Toko Myrex
        </Link>

        <nav className="hidden md:flex" aria-label="Utama">
          <Link
            href="/#produk"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Produk
          </Link>
        </nav>

        <nav
          className="flex items-center gap-1 justify-self-end"
          aria-label="Akun"
        >
          <Link
            href="/masuk"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Masuk
          </Link>
          <Link href="/daftar" className={buttonVariants({ size: "sm" })}>
            Daftar
          </Link>
        </nav>
      </div>
    </header>
  )
}
