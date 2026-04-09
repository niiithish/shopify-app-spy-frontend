"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Star, MessageSquare, TrendingUp, ExternalLink, RotateCcw, Filter, Flame } from "lucide-react"

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

interface Filters {
  keywords: string[]
  minRating: number
  maxRating: number
  minRecentReviews: number
  maxRecentReviews: number
  minTrendingScore: number
  maxTrendingScore: number
  priceType: "all" | "free" | "paid"
}

export default function ExplorerPage() {
  const [apps, setApps] = useState<AppResult[]>([])
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(true)

  const [filters, setFilters] = useState<Filters>({
    keywords: [],
    minRating: 0,
    maxRating: 5,
    minRecentReviews: 0,
    maxRecentReviews: 10000,
    minTrendingScore: 0,
    maxTrendingScore: 100,
    priceType: "all",
  })

  const fetchKeywords = useCallback(async () => {
    try {
      const res = await fetch("/api/keywords")
      if (!res.ok) throw new Error("Failed to fetch keywords")
      const data = await res.json()
      setAvailableKeywords(data.keywords)
    } catch (err) {
      console.error("Error fetching keywords:", err)
    }
  }, [])

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.keywords.length > 0) params.set("keywords", filters.keywords.join(","))
      if (filters.minRating > 0) params.set("minRating", filters.minRating.toString())
      if (filters.maxRating < 5) params.set("maxRating", filters.maxRating.toString())
      if (filters.minRecentReviews > 0) params.set("minRecentReviews", filters.minRecentReviews.toString())
      if (filters.maxRecentReviews < 10000) params.set("maxRecentReviews", filters.maxRecentReviews.toString())
      if (filters.minTrendingScore > 0) params.set("minTrendingScore", filters.minTrendingScore.toString())
      if (filters.maxTrendingScore < 100) params.set("maxTrendingScore", filters.maxTrendingScore.toString())
      if (filters.priceType !== "all") params.set("priceType", filters.priceType)

      const res = await fetch(`/api/apps?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch apps")
      const data = await res.json()
      setApps(data.apps)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchKeywords()
    fetchApps()
  }, [fetchKeywords, fetchApps])

  const toggleKeyword = (keyword: string) => {
    setFilters((prev) => ({
      ...prev,
      keywords: prev.keywords.includes(keyword) ? prev.keywords.filter((k) => k !== keyword) : [...prev.keywords, keyword],
    }))
  }

  const resetFilters = () => {
    setFilters({ keywords: [], minRating: 0, maxRating: 5, minRecentReviews: 0, maxRecentReviews: 10000, minTrendingScore: 0, maxTrendingScore: 100, priceType: "all" })
  }

  const hasActiveFilters = filters.keywords.length > 0 || filters.minRating > 0 || filters.maxRating < 5 || filters.minRecentReviews > 0 || filters.maxRecentReviews < 10000 || filters.minTrendingScore > 0 || filters.maxTrendingScore < 100 || filters.priceType !== "all"

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">App Explorer</h1>
          <p className="text-muted-foreground">Advanced search and filtering for Shopify apps</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="mr-2 size-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <RotateCcw className="mr-2 size-4" />
                  Reset
                </Button>
              )}
            </div>
            <CardDescription>Refine your search with these filters</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2">
                {availableKeywords.map((keyword) => (
                  <Badge key={keyword} variant={filters.keywords.includes(keyword) ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => toggleKeyword(keyword)}>
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <Label>Minimum Rating: {filters.minRating.toFixed(1)}</Label>
                <Slider value={[filters.minRating]} onValueChange={([v]) => setFilters((p) => ({ ...p, minRating: v }))} min={0} max={5} step={0.1} />
              </div>
              <div className="flex flex-col gap-3">
                <Label>Maximum Rating: {filters.maxRating.toFixed(1)}</Label>
                <Slider value={[filters.maxRating]} onValueChange={([v]) => setFilters((p) => ({ ...p, maxRating: v }))} min={0} max={5} step={0.1} />
              </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <Label>Min Recent Reviews (30d): {filters.minRecentReviews}</Label>
                <Slider value={[filters.minRecentReviews]} onValueChange={([v]) => setFilters((p) => ({ ...p, minRecentReviews: v }))} min={0} max={5000} step={10} />
              </div>
              <div className="flex flex-col gap-3">
                <Label>Max Recent Reviews (30d): {filters.maxRecentReviews}</Label>
                <Slider value={[filters.maxRecentReviews]} onValueChange={([v]) => setFilters((p) => ({ ...p, maxRecentReviews: v }))} min={0} max={10000} step={100} />
              </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <Label className="flex items-center gap-2">
                  <Flame className="size-4 text-orange-500" />
                  Min Trending Score: {filters.minTrendingScore.toFixed(0)}%
                </Label>
                <Slider value={[filters.minTrendingScore]} onValueChange={([v]) => setFilters((p) => ({ ...p, minTrendingScore: v }))} min={0} max={100} step={1} />
              </div>
              <div className="flex flex-col gap-3">
                <Label className="flex items-center gap-2">
                  <Flame className="size-4 text-orange-500" />
                  Max Trending Score: {filters.maxTrendingScore.toFixed(0)}%
                </Label>
                <Slider value={[filters.maxTrendingScore]} onValueChange={([v]) => setFilters((p) => ({ ...p, maxTrendingScore: v }))} min={0} max={100} step={1} />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <Label>Price</Label>
              <Select value={filters.priceType} onValueChange={(v) => setFilters((p) => ({ ...p, priceType: v as "all" | "free" | "paid" }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select price type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Results ({apps.length} apps)</CardTitle>
          <CardDescription>Click on any app to view in Shopify App Store</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <TrendingUp className="size-12 text-muted-foreground" />
              <p className="text-muted-foreground">No apps match your filters</p>
              <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead>Recent (30d)</TableHead>
                    <TableHead>Trending</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Relevance</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.title}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{app.keyword}</Badge></TableCell>
                      <TableCell>
                        {app.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="size-4 fill-current text-yellow-500" />
                            <span>{app.rating}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{app.review_count || "-"}</TableCell>
                      <TableCell>
                        {app.recent_reviews_30_days > 0 ? (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="size-4" />
                            <span>{app.recent_reviews_30_days}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {app.trending_score > 0 ? (
                          <div className="flex items-center gap-1">
                            <Flame className={`size-4 ${app.trending_score > 50 ? 'text-orange-500 fill-current' : 'text-muted-foreground'}`} />
                            <span className={app.trending_score > 50 ? 'text-orange-500 font-semibold' : ''}>{app.trending_score.toFixed(1)}%</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{app.price || "-"}</TableCell>
                      <TableCell>{app.relevance_score.toFixed(1)}%</TableCell>
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