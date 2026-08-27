import Link from "next/link"
import { Store } from "lucide-react"

import { Button } from "@/components/ui/button"

export function StorefrontHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto grid h-18 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 justify-self-start rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Toko Myrex
        </Link>

        <nav className="hidden md:block" aria-label="Utama">
          <Button
            variant="ghost"
            size="default"
            nativeButton={false}
            render={<Link href="/#produk" />}
          >
            Katalog
          </Button>
        </nav>

        <nav
          className="flex items-center gap-1 justify-self-end"
          aria-label="Akun"
        >
          <Button
            variant="ghost"
            size="default"
            nativeButton={false}
            render={<Link href="/masuk" />}
          >
            Masuk
          </Button>
          <Button
            size="default"
            nativeButton={false}
            render={<Link href="/daftar" />}
          >
            Daftar
          </Button>
        </nav>
      </div>
    </header>
  )
}
