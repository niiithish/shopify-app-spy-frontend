"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Package, Tag, Calendar, Star, MessageSquare } from "lucide-react"

interface Stats {
  total_apps: number
  total_keywords: number
  latest_scrape: string | null
}

interface KeywordCount {
  keyword: string
  count: number
}

interface AppResult {
  id: number
  keyword: string
  title: string
  url: string
  rating: string
  review_count: string
  price: string
  relevance_score: number
  recent_reviews_30_days: number
  trending_score: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [keywords, setKeywords] = useState<KeywordCount[]>([])
  const [topApps, setTopApps] = useState<AppResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const statsRes = await fetch("/api/stats")
        if (!statsRes.ok) throw new Error("Failed to fetch stats")
        const statsData = await statsRes.json()
        setStats(statsData.stats)

        const keywordsRes = await fetch("/api/keywords?withCounts=true")
        if (!keywordsRes.ok) throw new Error("Failed to fetch keywords")
        const keywordsData = await keywordsRes.json()
        setKeywords(keywordsData.keywords.slice(0, 8))

        const appsRes = await fetch("/api/apps")
        if (!appsRes.ok) throw new Error("Failed to fetch apps")
        const appsData = await appsRes.json()
        setTopApps(appsData.apps.slice(0, 5))
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

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
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{stats?.total_apps?.toLocaleString() || 0}</div>}
            <p className="text-xs text-muted-foreground">Apps tracked in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keywords</CardTitle>
            <Tag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{stats?.total_keywords || 0}</div>}
            <p className="text-xs text-muted-foreground">Search categories tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Update</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-32" /> : <div className="text-2xl font-bold">{stats?.latest_scrape ? new Date(stats.latest_scrape).toLocaleDateString() : "N/A"}</div>}
            <p className="text-xs text-muted-foreground">Last data refresh</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{topApps.length > 0 ? (topApps.reduce((acc, app) => acc + (parseFloat(app.rating) || 0), 0) / topApps.filter((app) => app.rating).length).toFixed(1) || "N/A" : "N/A"}</div>}
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
            {loading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : topApps.length === 0 ? (
              <p className="text-muted-foreground">No apps found</p>
            ) : (
              <div className="flex flex-col gap-4">
                {topApps.map((app) => (
                  <div key={app.id} className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-1">
                      <a href={app.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{app.title}</a>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">{app.keyword}</Badge>
                        {app.rating && <span className="flex items-center gap-1"><Star className="size-3 fill-current" />{app.rating}</span>}
                        {app.review_count && <span className="flex items-center gap-1"><MessageSquare className="size-3" />{app.review_count}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">{app.relevance_score.toFixed(1)}%</Badge>
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
            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : keywords.length === 0 ? (
              <p className="text-muted-foreground">No keywords found</p>
            ) : (
              <div className="flex flex-col gap-2">
                {keywords.map((kw) => (
                  <div key={kw.keyword} className="flex items-center justify-between border-b py-2 last:border-0">
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
