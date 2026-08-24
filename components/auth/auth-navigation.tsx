import Link from "next/link"

import { cn } from "@/lib/utils"

type AuthMode = "sign-in" | "sign-up"

const items = [
  { href: "/masuk", label: "Masuk", mode: "sign-in" },
  { href: "/daftar", label: "Daftar", mode: "sign-up" },
] as const

export function AuthNavigation({ mode }: { mode: AuthMode }) {
  return (
    <nav
      aria-label="Pilihan autentikasi"
      className="grid h-10 grid-cols-2 border bg-muted p-1"
    >
      {items.map((item) => {
        const active = item.mode === mode

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-center px-3 text-center text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              active && "bg-background text-foreground shadow-xs"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
