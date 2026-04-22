"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Package01Icon, Tag01Icon, Calendar03Icon, Star, Message01Icon } from "@hugeicons/core-free-icons"
import { Icon } from "@/lib/icons"
import { useStats, useKeywords, useApps } from "@/hooks/use-queries"

export default function DashboardPage() {
  // Use TanStack Query hooks for data fetching
  const { data: stats, isLoading: statsLoading, isError: statsError } = useStats()
  const { data: keywords = [], isLoading: keywordsLoading } = useKeywords({ withCounts: true })
  const { data: apps = [], isLoading: appsLoading } = useApps()

  const isLoading = statsLoading || keywordsLoading || appsLoading

  // Handle error state
  if (statsError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load dashboard data. Please try again.</AlertDescription>
      </Alert>
    )
  }

  // Get top 5 apps for display
  const topApps = apps.slice(0, 5)
  // Get top 8 keywords for display
  const topKeywords = keywords.slice(0, 8) as { keyword: string; count: number }[]

  // Calculate average rating
  const appsWithRatings = topApps.filter((app) => app.rating)
  const avgRating = appsWithRatings.length > 0
    ? (appsWithRatings.reduce((acc, app) => acc + (parseFloat(app.rating) || 0), 0) / appsWithRatings.length).toFixed(1)
    : "N/A"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your Shopify app intelligence data</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Apps</CardTitle>
            <Icon icon={Package01Icon} className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_apps?.toLocaleString() || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Apps tracked in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keywords</CardTitle>
            <Icon icon={Tag01Icon} className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_keywords || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Search categories tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Update</CardTitle>
            <Icon icon={Calendar03Icon} className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.latest_scrape ? new Date(stats.latest_scrape).toLocaleDateString() : "N/A"}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Last data refresh</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Icon icon={Star} className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{avgRating}</div>
            )}
            <p className="text-xs text-muted-foreground">Average across top apps</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Apps</CardTitle>
            <CardDescription>Highest relevance score apps across all keywords</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topApps.length === 0 ? (
              <p className="text-muted-foreground">No apps found</p>
            ) : (
              <div className="flex flex-col gap-4">
                {topApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-1">
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        {app.title}
                      </a>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">{app.keyword}</Badge>
                        {app.rating && <span className="flex items-center gap-1"><Icon icon={Star} className="size-3 fill-current" />{app.rating}</span>}
                        {app.review_count && <span className="flex items-center gap-1"><Icon icon={Message01Icon} className="size-3" />{app.review_count}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {app.relevance_score.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keywords Tracked</CardTitle>
            <CardDescription>Categories being monitored</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : topKeywords.length === 0 ? (
              <p className="text-muted-foreground">No keywords found</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topKeywords.map((kw) => (
                  <div
                    key={kw.keyword}
                    className="flex items-center justify-between border-b py-2 last:border-0"
                  >
                    <span className="font-medium capitalize">{kw.keyword}</span>
                    <Badge variant="secondary">{kw.count} apps</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}