"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Star,
  MessageSquare,
  ExternalLink,
  RotateCcw,
  Filter,
  Flame,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  SlidersHorizontal,
} from "lucide-react"

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
  search: string
  minRating: string
  minReviews: string
  minTrending: string
  priceType: "all" | "free" | "paid"
}

type SortKey =
  | "title"
  | "keyword"
  | "rating"
  | "review_count"
  | "recent_reviews_30_days"
  | "trending_score"
  | "price"
  | "relevance_score"

type SortDir = "asc" | "desc"

const DEFAULT_FILTERS: Filters = {
  keywords: [],
  search: "",
  minRating: "",
  minReviews: "",
  minTrending: "",
  priceType: "all",
}

export default function ExplorerPage() {
  const [apps, setApps] = useState<AppResult[]>([])
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS })

  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // ── Data fetching ──────────────────────────────────────────────────

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
      if (filters.minRating) params.set("minRating", filters.minRating)
      if (filters.minReviews) params.set("minRecentReviews", filters.minReviews)
      if (filters.minTrending) params.set("minTrendingScore", filters.minTrending)
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
  }, [filters.keywords, filters.minRating, filters.minReviews, filters.minTrending, filters.priceType])

  useEffect(() => {
    fetchKeywords()
    fetchApps()
  }, [fetchKeywords, fetchApps])

  // ── Sorting ────────────────────────────────────────────────────────

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="size-3 opacity-40" />
    return sortDir === "asc" ? (
      <ArrowUp className="size-3 text-primary" />
    ) : (
      <ArrowDown className="size-3 text-primary" />
    )
  }

  const sortedApps = useMemo(() => {
    let result = [...apps]

    // Client-side search filter
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.keyword.toLowerCase().includes(q)
      )
    }

    if (!sortKey) return result

    result.sort((a, b) => {
      let aVal: number
      let bVal: number

      switch (sortKey) {
        case "title":
          return sortDir === "asc"
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title)
        case "keyword":
          return sortDir === "asc"
            ? a.keyword.localeCompare(b.keyword)
            : b.keyword.localeCompare(a.keyword)
        case "rating":
          aVal = parseFloat(a.rating) || 0
          bVal = parseFloat(b.rating) || 0
          break
        case "review_count":
          aVal = parseInt(a.review_count) || 0
          bVal = parseInt(b.review_count) || 0
          break
        case "recent_reviews_30_days":
          aVal = a.recent_reviews_30_days
          bVal = b.recent_reviews_30_days
          break
        case "trending_score":
          aVal = a.trending_score
          bVal = b.trending_score
          break
        case "price":
          aVal = a.price ? parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0 : 0
          bVal = b.price ? parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0 : 0
          break
        case "relevance_score":
          aVal = a.relevance_score
          bVal = b.relevance_score
          break
        default:
          return 0
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal
    })

    return result
  }, [apps, sortKey, sortDir, filters.search])

  // ── Filter helpers ─────────────────────────────────────────────────

  const toggleKeyword = (keyword: string) => {
    setFilters((prev) => ({
      ...prev,
      keywords: prev.keywords.includes(keyword)
        ? prev.keywords.filter((k) => k !== keyword)
        : [...prev.keywords, keyword],
    }))
  }

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS })
    setSortKey(null)
    setSortDir("desc")
  }

  const hasActiveFilters =
    filters.keywords.length > 0 ||
    filters.search !== "" ||
    filters.minRating !== "" ||
    filters.minReviews !== "" ||
    filters.minTrending !== "" ||
    filters.priceType !== "all"

  const activeFilterCount = [
    filters.keywords.length > 0,
    filters.minRating !== "",
    filters.minReviews !== "",
    filters.minTrending !== "",
    filters.priceType !== "all",
  ].filter(Boolean).length

  // ── Render ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header row ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">App Explorer</h1>
          <p className="text-sm text-muted-foreground">
            Search, filter &amp; sort through Shopify apps
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
              <RotateCcw className="mr-1 size-3.5" />
              Clear all
            </Button>
          )}
          <Button
            variant={filtersOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="relative"
          >
            <SlidersHorizontal className="mr-1.5 size-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ── Search bar ───────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search apps by name or keyword..."
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
          className="h-9 pl-9 pr-9"
        />
        {filters.search && (
          <button
            onClick={() => setFilters((p) => ({ ...p, search: "" }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* ── Compact filter panel ─────────────────────────────────── */}
      {filtersOpen && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col gap-4 p-4">
            {/* Keyword chips */}
            {availableKeywords.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant={filters.keywords.includes(keyword) ? "default" : "outline"}
                      className="cursor-pointer capitalize text-xs transition-all hover:scale-105"
                      onClick={() => toggleKeyword(keyword)}
                    >
                      {keyword}
                      {filters.keywords.includes(keyword) && (
                        <X className="ml-1 size-3" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Inline numeric filters */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Min Rating</span>
                <Input
                  type="number"
                  placeholder="0"
                  min={0}
                  max={5}
                  step={0.1}
                  value={filters.minRating}
                  onChange={(e) => setFilters((p) => ({ ...p, minRating: e.target.value }))}
                  className="h-8 w-24"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Min Reviews (30d)</span>
                <Input
                  type="number"
                  placeholder="0"
                  min={0}
                  step={1}
                  value={filters.minReviews}
                  onChange={(e) => setFilters((p) => ({ ...p, minReviews: e.target.value }))}
                  className="h-8 w-28"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Min Trending %</span>
                <Input
                  type="number"
                  placeholder="0"
                  min={0}
                  max={100}
                  step={1}
                  value={filters.minTrending}
                  onChange={(e) => setFilters((p) => ({ ...p, minTrending: e.target.value }))}
                  className="h-8 w-24"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Price</span>
                <Select
                  value={filters.priceType}
                  onValueChange={(v) =>
                    setFilters((p) => ({ ...p, priceType: v as "all" | "free" | "paid" }))
                  }
                >
                  <SelectTrigger className="h-8 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Active keyword pills (always visible when filters collapsed) */}
      {!filtersOpen && filters.keywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="size-3.5 text-muted-foreground" />
          {filters.keywords.map((kw) => (
            <Badge
              key={kw}
              variant="default"
              className="cursor-pointer capitalize text-xs"
              onClick={() => toggleKeyword(kw)}
            >
              {kw}
              <X className="ml-1 size-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* ── Results table ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {loading ? "Loading..." : `${sortedApps.length} apps`}
            </CardTitle>
            {sortKey && (
              <button
                onClick={() => { setSortKey(null); setSortDir("desc") }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3" />
                Clear sort
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="flex flex-col gap-3 px-6 pb-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : sortedApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Search className="size-10 opacity-40" />
              <p className="text-sm">No apps match your filters</p>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>
                      <button
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("title")}
                      >
                        App
                        <SortIcon column="title" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("keyword")}
                      >
                        Keyword
                        <SortIcon column="keyword" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("rating")}
                      >
                        Rating
                        <SortIcon column="rating" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("review_count")}
                      >
                        Reviews
                        <SortIcon column="review_count" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("recent_reviews_30_days")}
                      >
                        Recent (30d)
                        <SortIcon column="recent_reviews_30_days" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("trending_score")}
                      >
                        Trending
                        <SortIcon column="trending_score" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("price")}
                      >
                        Price
                        <SortIcon column="price" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("relevance_score")}
                      >
                        Relevance
                        <SortIcon column="relevance_score" />
                      </button>
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedApps.map((app) => (
                    <TableRow key={app.id} className="group">
                      <TableCell className="max-w-[240px] truncate font-medium">
                        {app.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-xs font-normal">
                          {app.keyword}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="size-3.5 fill-current text-yellow-500" />
                            <span className="text-sm tabular-nums">{app.rating}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="tabular-nums">{app.review_count || "–"}</span>
                      </TableCell>
                      <TableCell>
                        {app.recent_reviews_30_days > 0 ? (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="size-3.5 text-muted-foreground" />
                            <span className="tabular-nums">{app.recent_reviews_30_days}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.trending_score > 0 ? (
                          <div className="flex items-center gap-1">
                            <Flame
                              className={`size-3.5 ${
                                app.trending_score > 50
                                  ? "fill-current text-orange-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span
                              className={`tabular-nums ${
                                app.trending_score > 50
                                  ? "font-semibold text-orange-500"
                                  : ""
                              }`}
                            >
                              {app.trending_score.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{app.price || "–"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="tabular-nums">{app.relevance_score.toFixed(1)}%</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                          asChild
                        >
                          <a href={app.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-3.5" />
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