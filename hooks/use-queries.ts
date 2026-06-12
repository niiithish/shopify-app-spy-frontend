"use client"

import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query"
import { appKeys, keywordKeys, statsKeys, analyticsKeys, favoriteKeys, type AppFilters } from "@/lib/query-keys"
import type {
  CategoryInsight,
  MarketSummary,
  ScoredApp,
} from "@/lib/analytics"

// Types
export interface AppResult {
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
  created_at?: string
  updated_at?: string
}

export interface PaginatedResult<T> {
  apps: T[]
  total: number
  page: number
  limit: number
}

export interface KeywordCount {
  keyword: string
  count: number
}

export interface Stats {
  total_apps: number
  total_keywords: number
  latest_scrape: string | null
}

export interface MarketAnalytics {
  summary: MarketSummary
  categories: CategoryInsight[]
  topOpportunities: ScoredApp[]
  totalApps: number
}

// Query Options - for prefetching and type safety
export const appQueries = {
  all: () =>
    queryOptions({
      queryKey: appKeys.lists(),
      queryFn: fetchAllApps,
      staleTime: 5 * 60 * 1000,
    }),
  
  byFilters: (filters: AppFilters) =>
    queryOptions({
      queryKey: appKeys.list(filters),
      queryFn: () => fetchAppsByFilters(filters),
      staleTime: 5 * 60 * 1000,
    }),
}

export const keywordQueries = {
  all: () =>
    queryOptions({
      queryKey: keywordKeys.lists(),
      queryFn: () => fetchKeywords(false),
      staleTime: 10 * 60 * 1000,
    }),
  
  withCounts: () =>
    queryOptions({
      queryKey: keywordKeys.list({ withCounts: true }),
      queryFn: () => fetchKeywords(true),
      staleTime: 10 * 60 * 1000,
    }),
}

export const statsQueries = {
  overview: () =>
    queryOptions({
      queryKey: statsKeys.overview(),
      queryFn: fetchStats,
      staleTime: 5 * 60 * 1000,
    }),
}

export const marketAnalyticsQueries = {
  overview: () =>
    queryOptions({
      queryKey: analyticsKeys.market(),
      queryFn: fetchMarketAnalytics,
      staleTime: 5 * 60 * 1000,
    }),
}

// Fetch functions
async function fetchAllApps(): Promise<PaginatedResult<AppResult>> {
  const res = await fetch("/api/apps")
  if (!res.ok) throw new Error("Failed to fetch apps")
  const data = await res.json()
  return { apps: data.apps, total: data.total, page: data.page, limit: data.limit }
}

async function fetchAppsByFilters(filters: AppFilters): Promise<PaginatedResult<AppResult>> {
  const params = new URLSearchParams()
  
  if (filters.search) {
    params.set("search", filters.search)
  }
  if (filters.page) {
    params.set("page", filters.page.toString())
  }
  if (filters.limit) {
    params.set("limit", filters.limit.toString())
  }
  if (filters.keywords?.length) {
    params.set("keywords", filters.keywords.join(","))
  }
  if (filters.minRating !== undefined && filters.minRating > 0) {
    params.set("minRating", filters.minRating.toString())
  }
  if (filters.maxRating !== undefined && filters.maxRating < 5) {
    params.set("maxRating", filters.maxRating.toString())
  }
  if (filters.minRecentReviews !== undefined && filters.minRecentReviews > 0) {
    params.set("minRecentReviews", filters.minRecentReviews.toString())
  }
  if (filters.maxRecentReviews !== undefined && filters.maxRecentReviews < 10000) {
    params.set("maxRecentReviews", filters.maxRecentReviews.toString())
  }
  if (filters.minTrendingScore !== undefined && filters.minTrendingScore > 0) {
    params.set("minTrendingScore", filters.minTrendingScore.toString())
  }
  if (filters.maxTrendingScore !== undefined && filters.maxTrendingScore < 100) {
    params.set("maxTrendingScore", filters.maxTrendingScore.toString())
  }
  if (filters.minRecentReviewRatio !== undefined && filters.minRecentReviewRatio > 0) {
    params.set("minRecentReviewRatio", filters.minRecentReviewRatio.toString())
  }
  if (filters.maxRecentReviewRatio !== undefined && filters.maxRecentReviewRatio < 100) {
    params.set("maxRecentReviewRatio", filters.maxRecentReviewRatio.toString())
  }
  if (filters.minReviews !== undefined && filters.minReviews > 0) {
    params.set("minReviews", filters.minReviews.toString())
  }
  if (filters.maxReviews !== undefined && filters.maxReviews > 0) {
    params.set("maxReviews", filters.maxReviews.toString())
  }
  if (filters.priceType && filters.priceType !== "all") {
    params.set("priceType", filters.priceType)
  }
  if (filters.favoritesOnly) {
    params.set("favoritesOnly", "true")
  }

  const queryString = params.toString()
  const url = queryString ? `/api/apps?${queryString}` : "/api/apps"
  
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch apps")
  const data = await res.json()
  return { apps: data.apps, total: data.total, page: data.page, limit: data.limit }
}

async function fetchKeywords(withCounts: boolean): Promise<string[] | KeywordCount[]> {
  const url = withCounts ? "/api/keywords?withCounts=true" : "/api/keywords"
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch keywords")
  const data = await res.json()
  return data.keywords
}

async function fetchStats(): Promise<Stats> {
  const res = await fetch("/api/stats")
  if (!res.ok) throw new Error("Failed to fetch stats")
  const data = await res.json()
  return data.stats
}

async function fetchMarketAnalytics(): Promise<MarketAnalytics> {
  const res = await fetch("/api/analytics/market")
  if (!res.ok) throw new Error("Failed to fetch market analytics")
  return res.json()
}

// Hooks
export function useApps(filters?: AppFilters) {
  return useQuery({
    queryKey: filters ? appKeys.list(filters) : appKeys.lists(),
    queryFn: () => filters ? fetchAppsByFilters(filters) : fetchAllApps(),
    staleTime: 5 * 60 * 1000,
    select: (data) => ({
      apps: data.apps,
      total: data.total,
      page: data.page,
      limit: data.limit,
    }),
  })
}

export function useKeywords(options?: { withCounts?: boolean }) {
  const withCounts = options?.withCounts ?? false
  return useQuery<string[] | KeywordCount[], Error>({ 
    queryKey: keywordKeys.list(options),
    queryFn: () => fetchKeywords(withCounts),
    staleTime: 10 * 60 * 1000,
  })
}

export function useStats() {
  return useQuery({
    queryKey: statsKeys.overview(),
    queryFn: fetchStats,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMarketAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.market(),
    queryFn: fetchMarketAnalytics,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  })
}

// ──────────────────────────────────────────────
// Favorites
// ──────────────────────────────────────────────

async function fetchFavoriteIds(): Promise<number[]> {
  const res = await fetch("/api/favorites")
  if (!res.ok) throw new Error("Failed to fetch favorites")
  const data = await res.json()
  return data.favorites
}

export function useFavoriteIds() {
  return useQuery<number[]>({
    queryKey: favoriteKeys.list(),
    queryFn: fetchFavoriteIds,
    staleTime: 60 * 1000,
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      appId,
      isFavorited,
    }: {
      appId: number
      isFavorited: boolean
    }) => {
      if (isFavorited) {
        const res = await fetch(`/api/favorites?appId=${appId}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error("Failed to remove favorite")
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId }),
        })
        if (!res.ok) throw new Error("Failed to add favorite")
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
    },
  })
}