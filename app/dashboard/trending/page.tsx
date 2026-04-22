"use client"

import { useState, useMemo } from "react"
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
import { TrendingUp, Star, Message01Icon, ExternalLink, Flame, LoaderCircle } from "@hugeicons/core-free-icons"
import { Icon } from "@/lib/icons"
import { useApps, type AppResult } from "@/hooks/use-queries"

type SortMode = "recent_reviews" | "trending_score"

export default function TrendingPage() {
  const [sortMode, setSortMode] = useState<SortMode>("trending_score")

  const { data: apps = [], isLoading, isError, error, isFetching, refetch } = useApps()

  // Sort and filter top 20 apps
  const sortedApps = useMemo(() => {
    return [...apps].sort((a, b) => {
      if (sortMode === "trending_score") {
        return b.trending_score - a.trending_score
      }
      return b.recent_reviews_30_days - a.recent_reviews_30_days
    })
  }, [apps, sortMode])

  const trendingApps = sortedApps.slice(0, 20)

  // Calculate stats
  const highestTrendingScore = apps.length > 0 ? Math.max(...apps.map((a) => a.trending_score)) : 0
  const hottestApp = sortedApps[0]
  const totalRecentReviews = apps.reduce((acc, app) => acc + app.recent_reviews_30_days, 0)
  const avgTrendingScore =
    apps.length > 0
      ? (apps.reduce((acc, app) => acc + app.trending_score, 0) / apps.length).toFixed(1)
      : "0"

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error?.message || "An error occurred while fetching data"}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trending Apps</h1>
          <p className="text-muted-foreground">
            {sortMode === "trending_score"
              ? "Apps with highest % of recent reviews vs total (new/trending apps)"
              : "Apps with the most reviews in the last 30 days"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Icon icon={LoaderCircle} className="mr-2 size-4 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={sortMode === "trending_score" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortMode("trending_score")}
        >
          <Icon icon={Flame} className="mr-2 size-4" />
          By Trending Score
        </Button>
        <Button
          variant={sortMode === "recent_reviews" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortMode("recent_reviews")}
        >
          <Icon icon={Message01Icon} className="mr-2 size-4" />
          By Recent Reviews
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hottest App</CardTitle>
            <Icon icon={Flame} className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
            <Icon icon={TrendingUp} className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold text-orange-500">{highestTrendingScore.toFixed(1)}%</div>
            )}
            <p className="text-xs text-muted-foreground">Highest ratio found</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recent Reviews</CardTitle>
            <Icon icon={Message01Icon} className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totalRecentReviews.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">Across all tracked apps</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Trending Score</CardTitle>
            <Icon icon={Flame} className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{avgTrendingScore}%</div>
            )}
            <p className="text-xs text-muted-foreground">Per app average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Top 20 {sortMode === "trending_score" ? "Trending" : "Active"} Apps
            {isFetching && !isLoading && " (Updating...)"}
          </CardTitle>
          <CardDescription>
            {sortMode === "trending_score"
              ? "Ranked by trending score - apps where most reviews came recently"
              : "Ranked by number of reviews in the last 30 days"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
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
                  {trendingApps.map((app: AppResult, index: number) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        {index < 3 ? (
                          <Badge
                            variant={index === 0 ? "default" : "secondary"}
                            className="justify-center w-8"
                          >
                            {index + 1}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground w-8 text-center inline-block">
                            {index + 1}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{app.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {app.keyword}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.rating ? (
                          <div className="flex items-center gap-1">
                            <Icon icon={Star} className="size-4 fill-current text-yellow-500" />
                            <span>{app.rating}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon icon={Flame}
                            className={`size-4 ${app.trending_score > 50 ? "text-orange-500 fill-current" : "text-muted-foreground"}`}
                          />
                          <span
                            className={`font-semibold ${app.trending_score > 50 ? "text-orange-500" : ""}`}
                          >
                            {app.trending_score.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon icon={Message01Icon} className="size-4 text-muted-foreground" />
                          <span>{app.recent_reviews_30_days}</span>
                        </div>
                      </TableCell>
                      <TableCell>{app.review_count || "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={app.url} target="_blank" rel="noopener noreferrer">
                            <Icon icon={ExternalLink} className="size-4" />
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