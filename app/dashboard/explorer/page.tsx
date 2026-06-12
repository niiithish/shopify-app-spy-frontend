"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  ArrowDown,
  ArrowSquareOut,
  ArrowsDownUp,
  ArrowUp,
  ChatCircle,
  CircleNotch,
  DownloadSimple,
  Heart,
  MagnifyingGlass,
  SlidersHorizontal,
  Star,
  X,
} from "@phosphor-icons/react"
import { useApps, useKeywords, useFavoriteIds, useToggleFavorite } from "@/hooks/use-queries"
import { exportAppsToCsv, scoreApps, type ScoredApp } from "@/lib/analytics"
import { AppDetailSheet } from "@/components/analytics/app-detail-sheet"
import {
  MomentumBar,
  OpportunityScore,
} from "@/components/analytics/visual-primitives"

interface Filters {
  keywords: string[]
  search: string
  minRating: string
  maxRating: string
  minReviews: string
  maxReviews: string
  minRecent: string
  maxRecent: string
  minRecentRatio: string
  maxRecentRatio: string
  priceType: "all" | "free" | "paid"
  favoritesOnly: boolean
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
  if (sortKey !== column) return <ArrowsDownUp className="size-3 opacity-40" />
  return sortDir === "asc" ? (
    <ArrowUp className="size-3 text-primary" />
  ) : (
    <ArrowDown className="size-3 text-primary" />
  )
}

const DEFAULT_FILTERS: Filters = {
  keywords: [],
  search: "",
  minRating: "",
  maxRating: "",
  minReviews: "",
  maxReviews: "",
  minRecent: "",
  maxRecent: "",
  minRecentRatio: "",
  maxRecentRatio: "",
  priceType: "all",
  favoritesOnly: false,
}

function countActiveFilters(filters: Filters) {
  return [
    filters.keywords.length > 0,
    filters.minRating !== "",
    filters.maxRating !== "",
    filters.minReviews !== "",
    filters.maxReviews !== "",
    filters.minRecent !== "",
    filters.maxRecent !== "",
    filters.minRecentRatio !== "",
    filters.maxRecentRatio !== "",
    filters.priceType !== "all",
    filters.favoritesOnly,
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
  const { data: favoriteIds = [] } = useFavoriteIds()
  const { mutate: toggleFavorite } = useToggleFavorite()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(20)

  // Reset to page 1 when filters or page size change
  useEffect(() => {
    setPage(1)
  }, [filters, pageSize])

  const queryFilters = useMemo(() => {
    const result: {
      keywords?: string[]
      search?: string
      minRating?: number
      maxRating?: number
      minRecentReviews?: number
      maxRecentReviews?: number
      minReviews?: number
      maxReviews?: number
      minRecentReviewRatio?: number
      maxRecentReviewRatio?: number
      priceType?: "all" | "free" | "paid"
      favoritesOnly?: boolean
      page?: number
      limit?: number
    } = {}

    if (filters.keywords.length > 0) result.keywords = filters.keywords
    if (filters.search) result.search = filters.search
    if (filters.minRating) result.minRating = parseFloat(filters.minRating)
    if (filters.maxRating) result.maxRating = parseFloat(filters.maxRating)
    if (filters.minReviews) result.minReviews = parseInt(filters.minReviews, 10)
    if (filters.maxReviews) result.maxReviews = parseInt(filters.maxReviews, 10)
    if (filters.minRecent) result.minRecentReviews = parseInt(filters.minRecent, 10)
    if (filters.maxRecent) result.maxRecentReviews = parseInt(filters.maxRecent, 10)
    if (filters.minRecentRatio) result.minRecentReviewRatio = parseFloat(filters.minRecentRatio)
    if (filters.maxRecentRatio) result.maxRecentReviewRatio = parseFloat(filters.maxRecentRatio)
    if (filters.priceType !== "all") result.priceType = filters.priceType
    if (filters.favoritesOnly) result.favoritesOnly = true
    result.page = page
    result.limit = pageSize

    return result
  }, [filters, page, pageSize])

  const {
    data: paginated,
    isLoading: appsLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useApps(queryFilters)

  const apps = paginated?.apps ?? []
  const total = paginated?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

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
  }, [scoredApps, sortKey, sortDir])

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
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">App Explorer</h1>
        <p className="text-sm text-muted-foreground">Search apps and refine with filters when you need them</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlass
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
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-10 shrink-0 gap-2">
              <SlidersHorizontal data-icon="inline-start" />
              Filter
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              {/* Recent review ratio - range slider */}
              <div className="flex items-center justify-between">
                <Label>Recent review ratio (30d/total)</Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {draftFilters.minRecentRatio || draftFilters.maxRecentRatio
                    ? `${draftFilters.minRecentRatio || 0}%–${draftFilters.maxRecentRatio || 100}%`
                    : "Any"}
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[
                  draftFilters.minRecentRatio ? parseInt(draftFilters.minRecentRatio, 10) : 0,
                  draftFilters.maxRecentRatio ? parseInt(draftFilters.maxRecentRatio, 10) : 100,
                ]}
                onValueChange={([min, max]) =>
                  setDraftFilters((p) => ({
                    ...p,
                    minRecentRatio: min === 0 ? "" : min.toString(),
                    maxRecentRatio: max === 100 ? "" : max.toString(),
                  }))
                }
              />

              {/* Number inputs - each row with min/max */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="min-recent">Min recent (30d)</Label>
                    <Input
                      id="min-recent"
                      type="number"
                      placeholder="0"
                      min={0}
                      value={draftFilters.minRecent}
                      onChange={(e) =>
                        setDraftFilters((p) => ({ ...p, minRecent: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="max-recent">Max recent (30d)</Label>
                    <Input
                      id="max-recent"
                      type="number"
                      placeholder="0"
                      min={0}
                      value={draftFilters.maxRecent}
                      onChange={(e) =>
                        setDraftFilters((p) => ({ ...p, maxRecent: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="min-reviews">Min total reviews</Label>
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
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="max-reviews">Max total reviews</Label>
                    <Input
                      id="max-reviews"
                      type="number"
                      placeholder="0"
                      min={0}
                      value={draftFilters.maxReviews}
                      onChange={(e) =>
                        setDraftFilters((p) => ({ ...p, maxReviews: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
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
                    <Label htmlFor="max-rating">Max rating</Label>
                    <Input
                      id="max-rating"
                      type="number"
                      placeholder="5"
                      min={0}
                      max={5}
                      step={0.1}
                      value={draftFilters.maxRating}
                      onChange={(e) =>
                        setDraftFilters((p) => ({ ...p, maxRating: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Price</Label>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    spacing={0}
                    className="h-9"
                    value={draftFilters.priceType}
                    onValueChange={(v) => {
                      if (v) {
                        setDraftFilters((p) => ({
                          ...p,
                          priceType: v as "all" | "free" | "paid",
                        }))
                      }
                    }}
                  >
                    <ToggleGroupItem value="all">All</ToggleGroupItem>
                    <ToggleGroupItem value="free">Free</ToggleGroupItem>
                    <ToggleGroupItem value="paid">Paid</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              {/* Favorites toggle */}
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() =>
                  setDraftFilters((p) => ({ ...p, favoritesOnly: !p.favoritesOnly }))
                }
              >
                <Heart
                  weight={draftFilters.favoritesOnly ? "fill" : "regular"}
                  className={draftFilters.favoritesOnly ? "text-red-500" : "text-muted-foreground"}
                />
                {draftFilters.favoritesOnly ? "Favorites only" : "Show favorites only"}
                {draftFilters.favoritesOnly && (
                  <X
                    className="ml-auto size-3 opacity-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDraftFilters((p) => ({ ...p, favoritesOnly: false }))
                    }}
                  />
                )}
              </Button>

              {/* Keywords */}
              <div className="flex flex-col gap-1.5">
                <Label>Keywords</Label>
                {draftFilters.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {draftFilters.keywords.slice(0, 3).map((k) => (
                      <Badge key={k} variant="secondary" className="capitalize gap-1">
                        {k}
                        <button
                          type="button"
                          onClick={() => toggleDraftKeyword(k)}
                          className="p-0.5 hover:bg-foreground/10"
                          aria-label={`Remove ${k}`}
                        >
                          <X className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                    {draftFilters.keywords.length > 3 && (
                      <Badge variant="secondary">+{draftFilters.keywords.length - 3}</Badge>
                    )}
                  </div>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-between"
                      disabled={keywordsLoading || availableKeywords.length === 0}
                    >
                      {keywordsLoading
                        ? "Loading..."
                        : availableKeywords.length === 0
                          ? "No keywords"
                          : draftFilters.keywords.length > 0
                            ? "Change keywords"
                            : "Select keywords"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="right"
                    className="w-72 p-0"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <Command shouldFilter>
                      <CommandInput placeholder="Search keywords..." />
                      <CommandList>
                        <CommandEmpty>No keywords found.</CommandEmpty>
                        <CommandGroup>
                          {(availableKeywords as string[]).map((keyword) => {
                            const selected = draftFilters.keywords.includes(keyword)
                            return (
                              <CommandItem
                                key={keyword}
                                value={keyword}
                                checked={selected}
                                onSelect={() => toggleDraftKeyword(keyword)}
                                className="capitalize"
                              >
                                {keyword}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
              <Button size="sm" onClick={applyFilters}>
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                {appsLoading ? (
                  "Loading..."
                ) : (
                  <>
                    {total.toLocaleString()} apps
                    {isFetching && !appsLoading && (
                      <CircleNotch className="ml-2 inline size-4 animate-spin" />
                    )}
                  </>
                )}
              </CardTitle>
              {total > 0 && !appsLoading && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Prev
                  </Button>
                  <span className="text-xs tabular-nums text-muted-foreground min-w-[2.5rem] text-center">
                    {page}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(v) => setPageSize(parseInt(v, 10))}
                  >
                    <SelectTrigger className="h-7 w-[62px] [&>span]:text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
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
                  <X className="size-3" />
                  Clear sort
                </button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAppsToCsv(sortedApps)}
                disabled={sortedApps.length === 0}
              >
                <DownloadSimple data-icon="inline-start" />
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
                  <CircleNotch className="size-3 animate-spin" />
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
              <MagnifyingGlass className="size-10 opacity-40" />
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
                    <TableHead className="w-10">
                      <span className="sr-only">Favorite</span>
                    </TableHead>
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
                      <TableCell className="w-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const isFav = favoriteIds.includes(app.id)
                            toggleFavorite({ appId: app.id, isFavorited: isFav })
                          }}
                          className="flex items-center justify-center"
                          aria-label={favoriteIds.includes(app.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart
                            weight={favoriteIds.includes(app.id) ? "fill" : "regular"}
                            className={
                              favoriteIds.includes(app.id)
                                ? "size-4 text-red-500"
                                : "size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60"
                            }
                          />
                        </button>
                      </TableCell>
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
                            <Star weight="fill" className="size-3.5 text-yellow-500" />
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
                            <ChatCircle className="size-3.5 text-muted-foreground" />
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
                            <ArrowSquareOut className="size-3.5" />
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 7) {
              pageNum = i + 1
            } else if (page <= 4) {
              pageNum = i + 1
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i
            } else {
              pageNum = page - 3 + i
            }
            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                className="min-w-[2rem] h-7"
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>
      )}

      <AppDetailSheet
        app={selectedApp}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
