"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Database01Icon, Globe, CodeIcon } from "@hugeicons/core-free-icons"
import { Icon } from "@/lib/icons"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Application configuration and information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon icon={Database01Icon} className="size-5 text-muted-foreground" />
              <CardTitle>Database</CardTitle>
            </div>
            <CardDescription>Connected data source</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Provider</span>
              <Badge variant="secondary">Turso (SQLite)</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Connection</span>
              <Badge variant="outline">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon icon={Globe} className="size-5 text-muted-foreground" />
              <CardTitle>Data Source</CardTitle>
            </div>
            <CardDescription>Where app data comes from</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Source</span>
              <Badge variant="secondary">Shopify App Store</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Update Method</span>
              <Badge variant="outline">Manual Scrape</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon icon={CodeIcon} className="size-5 text-muted-foreground" />
              <CardTitle>About</CardTitle>
            </div>
            <CardDescription>Shopify App Spy - Intelligence for Shopify App Developers</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              This tool helps you discover trending Shopify apps by analyzing data from the Shopify App Store.
              Use the Dashboard for an overview, App Explorer for advanced filtering, and Trending to see
              apps with the most recent activity.
            </p>
            <Separator />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Built with:</span>
              <Badge variant="outline">Next.js</Badge>
              <Badge variant="outline">shadcn/ui</Badge>
              <Badge variant="outline">Tailwind CSS</Badge>
              <Badge variant="outline">Turso</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
