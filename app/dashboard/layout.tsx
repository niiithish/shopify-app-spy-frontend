"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ThemeSwitcherControl } from "@/components/theme-switcher-control"
import {
  Gear,
  MagnifyingGlass,
  SquaresFour,
  TrendUp,
} from "@phosphor-icons/react"
import type { PhosphorIcon } from "@/lib/icons"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems: { title: string; href: string; icon: PhosphorIcon }[] = [
  {
    title: "Intelligence",
    href: "/dashboard",
    icon: SquaresFour,
  },
  {
    title: "App Explorer",
    href: "/dashboard/explorer",
    icon: MagnifyingGlass,
  },
  {
    title: "Trending",
    href: "/dashboard/trending",
    icon: TrendUp,
  },
]

function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="px-2 py-3">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Shopify Spy" className="size-8 shrink-0" />
          <div className="min-w-0 flex flex-col">
            <span className="truncate text-sm font-semibold leading-none">Shopify Spy</span>
            <span className="truncate text-[10px] text-muted-foreground">App intelligence</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
              >
                <Link href={item.href}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/dashboard/settings">
                <Gear className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function DashboardHeader() {
  return (
    <div className="flex h-12 items-center justify-between border-b border-border px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>
      <ThemeSwitcherControl />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <DashboardHeader />
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}
