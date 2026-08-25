import type { ReactNode } from "react"

export default function AuthenticationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      {children}
    </main>
  )
}
