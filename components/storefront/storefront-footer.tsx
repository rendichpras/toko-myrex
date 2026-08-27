import Link from "next/link"
import { Store } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function StorefrontFooter() {
  return (
    <footer className="mt-auto">
      <Separator />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 justify-self-start rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Toko Myrex
        </Link>

        <nav className="flex items-center gap-1" aria-label="Footer">
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/#produk" />}
          >
            Produk
          </Button>
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/masuk" />}
          >
            Masuk
          </Button>
        </nav>

        <p className="text-sm text-muted-foreground sm:justify-self-end">
          © Toko Myrex
        </p>
      </div>
    </footer>
  )
}
