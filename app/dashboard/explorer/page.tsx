"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { Separator } from "@/components/ui/separator"
import {
  Star,
  Message01Icon,
  ExternalLink,
  Flame,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search01Icon,
  Close,
  SlidersHorizontal,
  LoaderCircle,
  Download01Icon,
  RotateLeft01Icon,
} from "@hugeicons/core-free-icons"
import { Icon } from "@/lib/icons"
import { useApps, useKeywords } from "@/hooks/use-queries"
import { exportAppsToCsv, scoreApps, type ScoredApp } from "@/lib/analytics"
import { AppDetailSheet } from "@/components/analytics/app-detail-sheet"
import {
  LiveBadge,
  MomentumBar,
  OpportunityScore,
} from "@/components/analytics/visual-primitives"

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
  | "opportunity_score"
  | "price"
  | "relevance_score"

type SortDir = "asc" | "desc"

function SortIcon({
  column,
  sortKey,
  sortDir,
}: {
  column: SortKey
  sortKey: SortKey | null
  sortDir: SortDir
}) {
  if (sortKey !== column) return <Icon icon={ArrowUpDown} className="size-3 opacity-40" />
  return sortDir === "asc" ? (
    <Icon icon={ArrowUp} className="size-3 text-primary" />
  ) : (
    <Icon icon={ArrowDown} className="size-3 text-primary" />
  )
}

const DEFAULT_FILTERS: Filters = {
  keywords: [],
  search: "",
  minRating: "",
  minReviews: "",
  minTrending: "",
  priceType: "all",
}

function countActiveFilters(filters: Filters) {
  return [
    filters.keywords.length > 0,
    filters.minRating !== "",
    filters.minReviews !== "",
    filters.minTrending !== "",
    filters.priceType !== "all",
  ].filter(Boolean).length
}

export default function ExplorerPage() {
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS })
  const [draftFilters, setDraftFilters] = useState<Filters>({ ...DEFAULT_FILTERS })
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey | null>("opportunity_score")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selectedApp, setSelectedApp] = useState<ScoredApp | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: availableKeywords = [], isLoading: keywordsLoading } = useKeywords()

  const queryFilters = useMemo(() => {
    const result: {
      keywords?: string[]
      minRating?: number
      minRecentReviews?: number
      minTrendingScore?: number
      priceType?: "all" | "free" | "paid"
    } = {}

    if (filters.keywords.length > 0) result.keywords = filters.keywords
    if (filters.minRating) result.minRating = parseFloat(filters.minRating)
    if (filters.minReviews) result.minRecentReviews = parseInt(filters.minReviews, 10)
    if (filters.minTrending) result.minTrendingScore = parseFloat(filters.minTrending)
    if (filters.priceType !== "all") result.priceType = filters.priceType

    return result
  }, [filters])

  const hasServerFilters = Object.keys(queryFilters).length > 0

  const {
    data: apps = [],
    isLoading: appsLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useApps(hasServerFilters ? queryFilters : undefined)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const scoredApps = useMemo(() => scoreApps(apps), [apps])
  const sortedApps = useMemo(() => {
    let result = [...scoredApps]

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
        case "opportunity_score":
          aVal = a.opportunityScore
          bVal = b.opportunityScore
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
  }, [scoredApps, sortKey, sortDir, filters.search])

  const activeFilterCount = countActiveFilters(filters)

  useEffect(() => {
    if (filterOpen) {
      setDraftFilters({ ...filters })
    }
  }, [filterOpen, filters])

  const applyFilters = () => {
    setFilters({ ...draftFilters })
    setFilterOpen(false)
  }

  const clearFilters = () => {
    setDraftFilters({ ...DEFAULT_FILTERS, search: filters.search })
    setFilters({ ...DEFAULT_FILTERS, search: filters.search })
    setFilterOpen(false)
  }

  const toggleDraftKeyword = (keyword: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      keywords: prev.keywords.includes(keyword)
        ? prev.keywords.filter((k) => k !== keyword)
        : [...prev.keywords, keyword],
    }))
  }

  const openApp = (app: ScoredApp) => {
    setSelectedApp(app)
    setSheetOpen(true)
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error?.message || "An error occurred while fetching apps"}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-fade-in-up">
        <div className="mb-2">
          <LiveBadge label="Research mode" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">App Explorer</h1>
        <p className="text-sm text-muted-foreground">Search apps and refine with filters when you need them</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Icon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by app name or keyword..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            className="h-10 pl-9 pr-9"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, search: "" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon icon={Close} className="size-3.5" />
            </button>
          )}
        </div>

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 shrink-0 gap-2">
              <Icon icon={SlidersHorizontal} data-icon="inline-start" />
              Filter
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <PopoverHeader className="border-b px-4 py-3">
              <PopoverTitle>Filters</PopoverTitle>
            </PopoverHeader>

            <div className="flex max-h-[min(60vh,420px)] flex-col gap-4 overflow-y-auto p-4">
              <div className="flex flex-col gap-2">
                <Label>Keywords</Label>
                {keywordsLoading ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-5 w-full" />
                    ))}
                  </div>
                ) : availableKeywords.length === 0 ? (
                  <p className="text-muted-foreground">No keywords available</p>
                ) : (
                  <div className="flex max-h-36 flex-col gap-2 overflow-y-auto pr-1">
                    {(availableKeywords as string[]).map((keyword) => {
                      const checked = draftFilters.keywords.includes(keyword)
                      return (
                        <label
                          key={keyword}
                          className="flex cursor-pointer items-center gap-2 capitalize"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleDraftKeyword(keyword)}
                          />
                          <span>{keyword}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="min-rating">Min rating</Label>
                  <Input
                    id="min-rating"
                    type="number"
                    placeholder="0"
                    min={0}
                    max={5}
                    step={0.1}
                    value={draftFilters.minRating}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, minRating: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="min-reviews">Min reviews (30d)</Label>
                  <Input
                    id="min-reviews"
                    type="number"
                    placeholder="0"
                    min={0}
                    value={draftFilters.minReviews}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, minReviews: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="min-trending">Min trending %</Label>
                <Input
                  id="min-trending"
                  type="number"
                  placeholder="0"
                  min={0}
                  max={100}
                  value={draftFilters.minTrending}
                  onChange={(e) =>
                    setDraftFilters((p) => ({ ...p, minTrending: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Price</Label>
                <Select
                  value={draftFilters.priceType}
                  onValueChange={(v) =>
                    setDraftFilters((p) => ({
                      ...p,
                      priceType: v as "all" | "free" | "paid",
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
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

            <div className="flex items-center justify-between border-t px-4 py-3">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <Icon icon={RotateLeft01Icon} data-icon="inline-start" />
                Clear
              </Button>
              <Button size="sm" onClick={applyFilters}>
                Apply filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {appsLoading ? (
                "Loading..."
              ) : (
                <>
                  {sortedApps.length} apps
                  {isFetching && !appsLoading && (
                    <Icon icon={LoaderCircle} className="ml-2 inline size-4 animate-spin" />
                  )}
                </>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {sortKey && (
                <button
                  type="button"
                  onClick={() => {
                    setSortKey(null)
                    setSortDir("desc")
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon icon={Close} className="size-3" />
                  Clear sort
                </button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAppsToCsv(sortedApps)}
                disabled={sortedApps.length === 0}
              >
                <Icon icon={Download01Icon} data-icon="inline-start" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-7"
              >
                {isFetching ? (
                  <Icon icon={LoaderCircle} className="size-3 animate-spin" />
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {appsLoading ? (
            <div className="flex flex-col gap-3 px-6 pb-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : sortedApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Icon icon={Search01Icon} className="size-10 opacity-40" />
              <p className="text-sm">No apps match your search or filters</p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("title")}
                      >
                        App
                        <SortIcon column="title" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("keyword")}
                      >
                        Keyword
                        <SortIcon column="keyword" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("rating")}
                      >
                        Rating
                        <SortIcon column="rating" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("review_count")}
                      >
                        Reviews
                        <SortIcon column="review_count" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("recent_reviews_30_days")}
                      >
                        Recent (30d)
                        <SortIcon column="recent_reviews_30_days" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("opportunity_score")}
                      >
                        Opportunity
                        <SortIcon column="opportunity_score" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("trending_score")}
                      >
                        Trending
                        <SortIcon column="trending_score" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("price")}
                      >
                        Price
                        <SortIcon column="price" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                        onClick={() => handleSort("relevance_score")}
                      >
                        Relevance
                        <SortIcon column="relevance_score" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedApps.map((app) => (
                    <TableRow
                      key={app.id}
                      className="group row-hover-lift cursor-pointer"
                      onClick={() => openApp(app)}
                    >
                      <TableCell className="max-w-[240px] truncate font-medium">
                        {app.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal capitalize">
                          {app.keyword}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.rating ? (
                          <div className="flex items-center gap-1">
                            <Icon icon={Star} className="size-3.5 fill-current text-yellow-500" />
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
                            <Icon icon={Message01Icon} className="size-3.5 text-muted-foreground" />
                            <span className="tabular-nums">{app.recent_reviews_30_days}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <OpportunityScore score={app.opportunityScore} size="sm" />
                      </TableCell>
                      <TableCell>
                        {app.trending_score > 0 ? (
                          <MomentumBar value={app.trending_score} />
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
                          onClick={(event) => event.stopPropagation()}
                        >
                          <a href={app.url} target="_blank" rel="noopener noreferrer">
                            <Icon icon={ExternalLink} className="size-3.5" />
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

      <AppDetailSheet
        app={selectedApp}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
