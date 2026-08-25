"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { CircleAlert, LogOut } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth/client"
import { authConnectionErrorMessage } from "@/lib/auth/errors"

type AdminUserMenuProps = {
  user: {
    email: string
    name: string
  }
}

function getUserInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "TM"
  )
}

export function AdminUserMenu({ user }: AdminUserMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function signOut() {
    if (isSigningOut) return

    setIsSigningOut(true)
    setErrorMessage(null)

    try {
      const { error } = await authClient.signOut()

      if (error) {
        setErrorMessage("Tidak dapat keluar. Coba lagi.")
        setIsSigningOut(false)
        return
      }

      router.replace("/masuk")
      router.refresh()
    } catch {
      setErrorMessage(authConnectionErrorMessage)
      setIsSigningOut(false)
    }
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen && !isSigningOut) setErrorMessage(null)
      }}
    >
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            aria-label={`Buka menu akun ${user.name}`}
          >
            <Avatar>
              <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </span>
          </SidebarMenuButton>
        }
      />
      <DropdownMenuContent side="top" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-foreground">{user.name}</span>
              <span>{user.email}</span>
              <span>Admin</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            closeOnClick={false}
            disabled={isSigningOut}
            onClick={signOut}
          >
            <LogOut aria-hidden="true" />
            {isSigningOut ? "Keluar..." : "Keluar"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {errorMessage ? (
          <DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel role="alert">
              <span className="flex items-start gap-2 text-destructive">
                <CircleAlert
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <span className="leading-5">{errorMessage}</span>
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
