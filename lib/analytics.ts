import type { AppFilters } from "@/lib/query-keys"

export interface AppRecord {
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

export interface ScoredApp extends AppRecord {
  opportunityScore: number
  momentumScore: number
  validationScore: number
  qualityScore: number
  gapScore: number
  signals: string[]
}

export interface CategoryInsight {
  keyword: string
  appCount: number
  avgRating: number
  avgReviews: number
  avgRecentReviews: number
  avgTrendingScore: number
  freeCount: number
  paidCount: number
  opportunityIndex: number
  topApp: ScoredApp | null
}

export interface MarketSummary {
  topOpportunity: ScoredApp | null
  bestNiche: CategoryInsight | null
  hottestMomentum: ScoredApp | null
  totalRecentReviews: number
  medianCompetition: number
}

export interface ResearchPreset {
  id: string
  name: string
  description: string
  filters: AppFilters
  sortBy: "opportunity" | "trending_score" | "recent_reviews_30_days" | "rating"
}

export const RESEARCH_PRESETS: ResearchPreset[] = [
  {
    id: "emerging",
    name: "Emerging Winners",
    description: "High momentum with real recent traction",
    filters: { minTrendingScore: 40, minRecentReviews: 10, minRating: 4 },
    sortBy: "opportunity",
  },
  {
    id: "validated",
    name: "Validated Movers",
    description: "Proven demand — lots of recent reviews",
    filters: { minRecentReviews: 30, minRating: 4.2, minTrendingScore: 15 },
    sortBy: "recent_reviews_30_days",
  },
  {
    id: "early",
    name: "Early Movers",
    description: "Young apps gaining traction before saturation",
    filters: { minTrendingScore: 35, maxReviews: 150, minRecentReviews: 5 },
    sortBy: "trending_score",
  },
  {
    id: "quality",
    name: "Quality Leaders",
    description: "Top-rated apps with steady activity",
    filters: { minRating: 4.5, minReviews: 20 },
    sortBy: "rating",
  },
]

function parseRating(rating: string): number {
  const value = parseFloat(rating)
  return Number.isFinite(value) ? value : 0
}

function parseReviews(reviewCount: string): number {
  const value = parseInt(reviewCount.replace(/,/g, ""), 10)
  return Number.isFinite(value) ? value : 0
}

function isFreeApp(price: string): boolean {
  const normalized = price.toLowerCase().trim()
  return !normalized || normalized.includes("free")
}

/** Minimum recent (30d) reviews required before an app can score well */
export const MIN_RECENT_REVIEWS_FOR_SCORE = 5

/** Recent review count where validation component reaches full strength */
const VALIDATION_FULL_AT_RECENT = 40

/** Total review count where volume confidence reaches full strength */
const VALIDATION_FULL_AT_TOTAL = 30

function computeValidationScore(app: AppRecord): number {
  const recent = app.recent_reviews_30_days
  const total = parseReviews(app.review_count)

  if (recent < MIN_RECENT_REVIEWS_FOR_SCORE) {
    // 1–4 recent reviews → negligible validation (e.g. 4 total + 1 recent isn't meaningful)
    return Math.round((recent / MIN_RECENT_REVIEWS_FOR_SCORE) * 10 * 10) / 10
  }

  const recentStrength = Math.min(
    ((recent - MIN_RECENT_REVIEWS_FOR_SCORE) /
      (VALIDATION_FULL_AT_RECENT - MIN_RECENT_REVIEWS_FOR_SCORE)) *
      100,
    100
  )
  const volumeStrength = Math.min((total / VALIDATION_FULL_AT_TOTAL) * 100, 100)

  // Recent activity matters most, but tiny total bases (e.g. 4 reviews ever) cap confidence
  return Math.round((recentStrength * 0.65 + volumeStrength * 0.35) * 10) / 10
}

function computeCredibilityMultiplier(app: AppRecord): number {
  const recent = app.recent_reviews_30_days
  const total = parseReviews(app.review_count)

  if (recent < MIN_RECENT_REVIEWS_FOR_SCORE) {
    // Hard penalty: high trending % on 1–4 recent reviews should not rank as "top opportunity"
    return 0.15 + (recent / MIN_RECENT_REVIEWS_FOR_SCORE) * 0.2
  }

  if (total < 10) {
    // Thin review history even when recent looks okay
    return 0.55 + (total / 10) * 0.45
  }

  return 1
}

function buildKeywordCounts(apps: AppRecord[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const app of apps) {
    counts.set(app.keyword, (counts.get(app.keyword) ?? 0) + 1)
  }
  return counts
}

function buildSignals(
  app: AppRecord,
  keywordCount: number,
  maxKeywordCount: number,
  scores: Pick<ScoredApp, "momentumScore" | "validationScore" | "qualityScore" | "gapScore">
): string[] {
  const signals: string[] = []
  const totalReviews = parseReviews(app.review_count)
  const meetsRecentThreshold =
    app.recent_reviews_30_days >= MIN_RECENT_REVIEWS_FOR_SCORE

  if (!meetsRecentThreshold) {
    signals.push("Low traction")
    return signals
  }

  if (scores.momentumScore >= 50) signals.push("Hot momentum")
  if (scores.validationScore >= 70) signals.push("Strong validation")
  if (scores.qualityScore >= 85) signals.push("High quality")
  if (keywordCount <= Math.max(3, maxKeywordCount * 0.25)) signals.push("Low competition")
  if (totalReviews < 100 && totalReviews >= 10 && app.trending_score >= 30) {
    signals.push("Early mover")
  }
  if (isFreeApp(app.price)) signals.push("Free entry")
  if (app.recent_reviews_30_days >= 50 && app.trending_score < 20) {
    signals.push("Established player")
  }

  return signals
}

export function scoreApps(apps: AppRecord[]): ScoredApp[] {
  const keywordCounts = buildKeywordCounts(apps)
  const maxKeywordCount = Math.max(...keywordCounts.values(), 1)

  return apps.map((app) => {
    const keywordCount = keywordCounts.get(app.keyword) ?? 1
    const rating = parseRating(app.rating)

    const momentumScore = Math.min(Math.max(app.trending_score, 0), 100)
    const validationScore = computeValidationScore(app)
    const qualityScore = (rating / 5) * 100
    const gapScore =
      maxKeywordCount <= 1
        ? 50
        : (1 - (keywordCount - 1) / (maxKeywordCount - 1)) * 100

    const rawOpportunityScore =
      momentumScore * 0.35 +
      validationScore * 0.25 +
      qualityScore * 0.15 +
      gapScore * 0.25

    const credibilityMultiplier = computeCredibilityMultiplier(app)
    let opportunityScore = rawOpportunityScore * credibilityMultiplier

    // Apps under the recent-review floor cannot rank as strong opportunities
    if (app.recent_reviews_30_days < MIN_RECENT_REVIEWS_FOR_SCORE) {
      opportunityScore = Math.min(opportunityScore, 22)
    }

    const signals = buildSignals(app, keywordCount, maxKeywordCount, {
      momentumScore,
      validationScore,
      qualityScore,
      gapScore,
    })

    return {
      ...app,
      opportunityScore: Math.round(opportunityScore * 10) / 10,
      momentumScore: Math.round(momentumScore * 10) / 10,
      validationScore: Math.round(validationScore * 10) / 10,
      qualityScore: Math.round(qualityScore * 10) / 10,
      gapScore: Math.round(gapScore * 10) / 10,
      signals,
    }
  })
}

export function computeCategoryInsights(apps: AppRecord[]): CategoryInsight[] {
  const scored = scoreApps(apps)
  const byKeyword = new Map<string, ScoredApp[]>()

  for (const app of scored) {
    const list = byKeyword.get(app.keyword) ?? []
    list.push(app)
    byKeyword.set(app.keyword, list)
  }

  const maxCount = Math.max(...[...byKeyword.values()].map((list) => list.length), 1)

  return [...byKeyword.entries()]
    .map(([keyword, keywordApps]) => {
      const appCount = keywordApps.length
      const avgRating =
        keywordApps.reduce((sum, app) => sum + parseRating(app.rating), 0) / appCount
      const avgReviews =
        keywordApps.reduce((sum, app) => sum + parseReviews(app.review_count), 0) / appCount
      const avgRecentReviews =
        keywordApps.reduce((sum, app) => sum + app.recent_reviews_30_days, 0) / appCount
      const avgTrendingScore =
        keywordApps.reduce((sum, app) => sum + app.trending_score, 0) / appCount
      const freeCount = keywordApps.filter((app) => isFreeApp(app.price)).length
      const paidCount = appCount - freeCount

      const densityPenalty = maxCount <= 1 ? 0.5 : (appCount - 1) / (maxCount - 1)
      const momentum = Math.min(avgTrendingScore, 100)
      const validation = Math.min((avgRecentReviews / 25) * 100, 100)
      const opportunityIndex = Math.round(
        (momentum * 0.45 + validation * 0.35 + (1 - densityPenalty) * 100 * 0.2) * 10
      ) / 10

      const topApp = [...keywordApps].sort(
        (a, b) => b.opportunityScore - a.opportunityScore
      )[0]

      return {
        keyword,
        appCount,
        avgRating: Math.round(avgRating * 10) / 10,
        avgReviews: Math.round(avgReviews),
        avgRecentReviews: Math.round(avgRecentReviews),
        avgTrendingScore: Math.round(avgTrendingScore * 10) / 10,
        freeCount,
        paidCount,
        opportunityIndex,
        topApp: topApp ?? null,
      }
    })
    .sort((a, b) => b.opportunityIndex - a.opportunityIndex)
}

export function computeMarketSummary(apps: AppRecord[]): MarketSummary {
  const scored = scoreApps(apps)
  const categories = computeCategoryInsights(apps)
  const sortedByOpportunity = [...scored].sort(
    (a, b) => b.opportunityScore - a.opportunityScore
  )
  const sortedByMomentum = [...scored].sort(
    (a, b) => b.trending_score - a.trending_score
  )

  const competitionCounts = categories.map((c) => c.appCount).sort((a, b) => a - b)
  const medianCompetition =
    competitionCounts.length === 0
      ? 0
      : competitionCounts[Math.floor(competitionCounts.length / 2)]

  return {
    topOpportunity: sortedByOpportunity[0] ?? null,
    bestNiche: categories[0] ?? null,
    hottestMomentum: sortedByMomentum[0] ?? null,
    totalRecentReviews: apps.reduce((sum, app) => sum + app.recent_reviews_30_days, 0),
    medianCompetition,
  }
}

export function sortScoredApps(
  apps: ScoredApp[],
  sortBy: ResearchPreset["sortBy"]
): ScoredApp[] {
  return [...apps].sort((a, b) => {
    switch (sortBy) {
      case "opportunity":
        return b.opportunityScore - a.opportunityScore
      case "trending_score":
        return b.trending_score - a.trending_score
      case "recent_reviews_30_days":
        return b.recent_reviews_30_days - a.recent_reviews_30_days
      case "rating":
        return parseRating(b.rating) - parseRating(a.rating)
      default:
        return 0
    }
  })
}

export function filterAppsByPreset(apps: AppRecord[], preset: ResearchPreset): ScoredApp[] {
  const { filters } = preset
  const filtered = apps.filter((app) => {
    const rating = parseRating(app.rating)
    const reviews = parseReviews(app.review_count)

    if (filters.keywords?.length && !filters.keywords.includes(app.keyword)) {
      return false
    }
    if (filters.minRating !== undefined && rating < filters.minRating) return false
    if (filters.maxRating !== undefined && rating > filters.maxRating) return false
    if (filters.minReviews !== undefined && reviews < filters.minReviews) return false
    if (filters.maxReviews !== undefined && reviews > filters.maxReviews) return false
    if (
      filters.minRecentReviews !== undefined &&
      app.recent_reviews_30_days < filters.minRecentReviews
    ) {
      return false
    }
    if (
      filters.maxRecentReviews !== undefined &&
      app.recent_reviews_30_days > filters.maxRecentReviews
    ) {
      return false
    }
    if (
      filters.minTrendingScore !== undefined &&
      app.trending_score < filters.minTrendingScore
    ) {
      return false
    }
    if (
      filters.maxTrendingScore !== undefined &&
      app.trending_score > filters.maxTrendingScore
    ) {
      return false
    }
    if (filters.priceType === "free" && !isFreeApp(app.price)) return false
    if (filters.priceType === "paid" && isFreeApp(app.price)) return false

    return true
  })

  return sortScoredApps(scoreApps(filtered), preset.sortBy)
}

export function exportAppsToCsv(apps: AppRecord[]): void {
  const headers = [
    "title",
    "keyword",
    "rating",
    "review_count",
    "recent_reviews_30_days",
    "trending_score",
    "relevance_score",
    "price",
    "url",
  ]

  const rows = apps.map((app) =>
    [
      app.title,
      app.keyword,
      app.rating,
      app.review_count,
      app.recent_reviews_30_days,
      app.trending_score,
      app.relevance_score,
      app.price,
      app.url,
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  )

  const csv = [headers.join(","), ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `shopify-apps-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
