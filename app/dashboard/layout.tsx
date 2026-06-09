"use client"

import { LiveBadge } from "@/components/analytics/visual-primitives"
import { useStats } from "@/hooks/use-queries"
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
} from "@/components/ui/sidebar"
import {
  DashboardSquare01Icon,
  Search01Icon,
  TrendingUp,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { Icon } from "@/lib/icons"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  {
    title: "Intelligence",
    href: "/dashboard",
    icon: DashboardSquare01Icon,
  },
  {
    title: "App Explorer",
    href: "/dashboard/explorer",
    icon: Search01Icon,
  },
  {
    title: "Trending",
    href: "/dashboard/trending",
    icon: TrendingUp,
  },
]

function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="px-2 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon icon={TrendingUp} className="relative size-3.5" />
          </div>
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
                  <Icon icon={item.icon} />
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
                <Icon icon={Settings01Icon} />
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
  const { data: stats } = useStats()
  const lastUpdate = stats?.latest_scrape
    ? new Date(stats.latest_scrape).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  return (
    <div className="flex h-12 items-center justify-between border-b border-border/60 bg-card/40 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex flex-col">
        <span className="text-sm font-medium">Shopify Spy</span>
        <span className="text-[11px] text-muted-foreground">
          {lastUpdate ? `Updated ${lastUpdate}` : "Scanning the app store"}
        </span>
      </div>
      <LiveBadge />
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
      <main className="ambient-bg flex-1 overflow-auto">
        <DashboardHeader />
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}
