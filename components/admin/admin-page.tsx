import type { ReactNode } from "react"

type AdminPageProps = {
  actions?: ReactNode
  children?: ReactNode
  description: string
  title: string
}

export function AdminPage({
  actions,
  children,
  description,
  title,
}: AdminPageProps) {
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[90rem] gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-3xl space-y-1.5">
          <h1 className="break-words text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}
