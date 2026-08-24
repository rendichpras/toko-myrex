import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AuthPanelProps = {
  children: ReactNode
  description: ReactNode
  footer?: ReactNode
  navigation?: ReactNode
  title: ReactNode
}

export function AuthPanel({
  children,
  description,
  footer,
  navigation,
  title,
}: AuthPanelProps) {
  return (
    <div className="w-full max-w-[26rem]">
      <Card>
        <CardHeader>
          <div className="space-y-2 text-center">
            <CardTitle>
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {navigation}
          <div className={navigation ? "grid pt-6" : "grid"}>{children}</div>
        </CardContent>

        {footer ? (
          <CardFooter>
            <div className="flex w-full justify-center">{footer}</div>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  )
}
