"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { Package } from "lucide-react"

import { AdminUserMenu } from "@/components/admin/admin-user-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const adminNavigationItems = [
  { href: "/admin/produk", label: "Produk", icon: Package },
] as const

type AdminShellProps = {
  children: ReactNode
  user: {
    email: string
    name: string
  }
}

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function AdminNavigation({ pathname }: { pathname: string }) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <nav aria-label="Menu admin">
      <SidebarMenu>
        {adminNavigationItems.map((destination) => {
          const active = isRouteActive(pathname, destination.href)

          return (
            <SidebarMenuItem key={destination.href}>
              <SidebarMenuButton
                render={
                  <Link
                    href={destination.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false)
                    }}
                  />
                }
                isActive={active}
                tooltip={destination.label}
              >
                <destination.icon aria-hidden="true" />
                <span>{destination.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </nav>
  )
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname()
  const currentSection = adminNavigationItems[0]
  const currentSubpage =
    pathname === "/admin/produk/baru"
      ? "Produk baru"
      : /^\/admin\/produk\/[^/]+$/.test(pathname)
        ? "Edit produk"
        : null

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Link
              href="/admin/produk"
              aria-label="Buka daftar produk"
              className="flex h-11 items-center gap-2 px-2 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            >
              <span className="hidden size-7 shrink-0 items-center justify-center bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground group-data-[collapsible=icon]:flex">
                PA
              </span>
              <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold">Administrasi</span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  Panel admin
                </span>
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu utama</SidebarGroupLabel>
              <SidebarGroupContent>
                <AdminNavigation pathname={pathname} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <AdminUserMenu user={user} />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail
            aria-label="Tampilkan atau sembunyikan menu admin"
            title="Tampilkan atau sembunyikan menu admin"
          />
        </Sidebar>

        <SidebarInset className="min-w-0">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sm:px-6">
            <SidebarTrigger
              aria-label="Tampilkan atau sembunyikan menu admin"
              title="Tampilkan atau sembunyikan menu admin"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href="/admin/produk" />}>
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                {currentSubpage ? (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        render={<Link href={currentSection.href} />}
                      >
                        {currentSection.label}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{currentSubpage}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentSection.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="min-w-0 flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
