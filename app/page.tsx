import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function StorefrontPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="grid max-w-xl gap-8 text-center">
        <div className="grid gap-3">
          <p className="text-sm font-medium text-primary">Toko Myrex</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Produk digital, siap digunakan
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Beli dan akses produk digital dengan mudah dari satu akun.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/masuk" />}
          >
            Masuk
          </Button>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<Link href="/daftar" />}
          >
            Buat akun
          </Button>
        </div>
      </div>
    </main>
  )
}
