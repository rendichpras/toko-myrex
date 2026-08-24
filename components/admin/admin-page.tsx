import type { ReactNode } from "react"

type AdminPageProps = {
  children?: ReactNode
  description: string
  title: string
}

export function AdminPage({ children, description, title }: AdminPageProps) {
  return (
    <div className="mx-auto grid w-full max-w-[90rem] gap-6">
      <div className="max-w-3xl space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {children}
    </div>
  )
}
