"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TrendingUp, Star, MessageSquare, ExternalLink, Flame } from "lucide-react"

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

type SortMode = "recent_reviews" | "trending_score"

export default function TrendingPage() {
  const [apps, setApps] = useState<AppResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>("trending_score")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await fetch("/api/apps")
        if (!res.ok) throw new Error("Failed to fetch apps")
        const data = await res.json()
        setApps(data.apps)
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

  // Sort based on selected mode
  const sortedApps = [...apps].sort((a, b) => {
    if (sortMode === "trending_score") {
      return b.trending_score - a.trending_score
    }
    return b.recent_reviews_30_days - a.recent_reviews_30_days
  })

  const trendingApps = sortedApps.slice(0, 20)

  // Calculate stats
  const highestTrendingScore = apps.length > 0 ? Math.max(...apps.map(a => a.trending_score)) : 0
  const hottestApp = sortedApps[0]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trending Apps</h1>
        <p className="text-muted-foreground">
          {sortMode === "trending_score" 
            ? "Apps with highest % of recent reviews vs total (new/trending apps)"
            : "Apps with the most reviews in the last 30 days"}
        </p>
      </div>

      <div className="flex gap-2">
        <Button 
          variant={sortMode === "trending_score" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortMode("trending_score")}
        >
          <Flame className="mr-2 size-4" />
          By Trending Score
        </Button>
        <Button 
          variant={sortMode === "recent_reviews" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortMode("recent_reviews")}
        >
          <MessageSquare className="mr-2 size-4" />
          By Recent Reviews
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hottest App</CardTitle>
            <Flame className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-32" />
            ) : hottestApp ? (
              <div className="text-lg font-bold truncate">{hottestApp.title}</div>
            ) : (
              <div className="text-lg font-bold">-</div>
            )}
            <p className="text-xs text-muted-foreground">
              {hottestApp ? `${hottestApp.trending_score.toFixed(1)}% trending score` : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Trending Score</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold text-orange-500">
                {highestTrendingScore.toFixed(1)}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">Highest ratio found</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recent Reviews</CardTitle>
            <MessageSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {apps.reduce((acc, app) => acc + app.recent_reviews_30_days, 0).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Across all tracked apps</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Trending Score</CardTitle>
            <Flame className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : apps.length > 0 ? (
              <div className="text-2xl font-bold">
                {(apps.reduce((acc, app) => acc + app.trending_score, 0) / apps.length).toFixed(1)}%
              </div>
            ) : (
              <div className="text-2xl font-bold">0%</div>
            )}
            <p className="text-xs text-muted-foreground">Per app average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 20 {sortMode === "trending_score" ? "Trending" : "Active"} Apps</CardTitle>
          <CardDescription>
            {sortMode === "trending_score" 
              ? "Ranked by trending score - apps where most reviews came recently"
              : "Ranked by number of reviews in the last 30 days"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : trendingApps.length === 0 ? (
            <p className="text-muted-foreground">No trending apps found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Rank</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Trending Score</TableHead>
                    <TableHead>Recent (30d)</TableHead>
                    <TableHead>Total Reviews</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trendingApps.map((app, index) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        {index < 3 ? (
                          <Badge variant={index === 0 ? "default" : "secondary"} className="justify-center w-8">
                            {index + 1}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground w-8 text-center inline-block">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{app.title}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{app.keyword}</Badge></TableCell>
                      <TableCell>
                        {app.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="size-4 fill-current text-yellow-500" />
                            <span>{app.rating}</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Flame className={`size-4 ${app.trending_score > 50 ? 'text-orange-500 fill-current' : 'text-muted-foreground'}`} />
                          <span className={`font-semibold ${app.trending_score > 50 ? 'text-orange-500' : ''}`}>
                            {app.trending_score.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="size-4 text-muted-foreground" />
                          <span>{app.recent_reviews_30_days}</span>
                        </div>
                      </TableCell>
                      <TableCell>{app.review_count || "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={app.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}