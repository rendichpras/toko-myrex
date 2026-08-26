import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function StorefrontPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="grid max-w-xl gap-8 text-center">
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
