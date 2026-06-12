/**
 * Query Key Factory
 * Centralized query key definitions for consistent cache management
 * @see https://tanstack.com/query/latest/docs/react/guides/query-keys
 */

// Apps query keys
export const appKeys = {
  all: ["apps"] as const,
  lists: () => [...appKeys.all, "list"] as const,
  list: (filters: AppFilters) => [...appKeys.lists(), filters] as const,
  details: () => [...appKeys.all, "detail"] as const,
  detail: (id: number) => [...appKeys.details(), id] as const,
}

// Keywords query keys
export const keywordKeys = {
  all: ["keywords"] as const,
  lists: () => [...keywordKeys.all, "list"] as const,
  list: (options?: { withCounts?: boolean }) => 
    [...keywordKeys.lists(), options] as const,
}

// Stats query keys
export const statsKeys = {
  all: ["stats"] as const,
  overview: () => [...statsKeys.all, "overview"] as const,
}

// Market analytics query keys
export const analyticsKeys = {
  all: ["analytics"] as const,
  market: () => [...analyticsKeys.all, "market"] as const,
}

// Favorites query keys
export const favoriteKeys = {
  all: ["favorites"] as const,
  lists: () => [...favoriteKeys.all, "list"] as const,
  list: () => [...favoriteKeys.lists()] as const,
}

// Type definitions for filters
export interface AppFilters {
  keywords?: string[]
  search?: string
  minRating?: number
  maxRating?: number
  minReviews?: number
  maxReviews?: number
  minRecentReviews?: number
  maxRecentReviews?: number
  minTrendingScore?: number
  maxTrendingScore?: number
  minRecentReviewRatio?: number
  maxRecentReviewRatio?: number
  priceType?: "all" | "free" | "paid"
  favoritesOnly?: boolean
  page?: number
  limit?: number
}