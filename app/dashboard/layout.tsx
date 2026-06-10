"use client"

import { useTheme } from "next-themes"
import { Switch } from "radix-ui"
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
import {
  DashboardSquare01Icon,
  Search01Icon,
  TrendingUp,
  Settings01Icon,
  Sun01Icon,
  Moon01Icon,
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
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="flex h-12 items-center justify-between border-b border-border/60 bg-card/40 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
      </div>
      <div className="flex items-center gap-2">
        <Icon icon={Sun01Icon} className="size-4 text-muted-foreground" />
        <Switch.Root
          checked={isDark}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          className="peer inline-flex h-[13px] w-[23px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        >
          <Switch.Thumb className="pointer-events-none block size-[10px] rounded-full bg-background shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-[10px] data-[state=unchecked]:translate-x-0" />
        </Switch.Root>
        <Icon icon={Moon01Icon} className="size-4 text-muted-foreground" />
      </div>
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
