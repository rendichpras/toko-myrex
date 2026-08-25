import Link from "next/link"

import { cn } from "@/lib/utils"

type AuthenticationPage = "sign-in" | "sign-up"

const authenticationLinks = [
  { href: "/masuk", label: "Masuk", page: "sign-in" },
  { href: "/daftar", label: "Buat akun", page: "sign-up" },
] as const

export function AuthNavigation({
  activePage,
}: {
  activePage: AuthenticationPage
}) {
  return (
    <nav
      aria-label="Akses akun"
      className="grid h-10 grid-cols-2 border bg-muted p-1"
    >
      {authenticationLinks.map((link) => {
        const active = link.page === activePage

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-center px-3 text-center text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              active && "bg-background text-foreground shadow-xs"
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
