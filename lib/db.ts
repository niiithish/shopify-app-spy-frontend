// Database client for Turso
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || ""
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || ""

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
  created_at: string
  updated_at: string
}

export interface DatabaseStats {
  total_apps: number
  total_keywords: number
  latest_scrape: string | null
}

export interface KeywordCount {
  keyword: string
  count: number
}

interface TursoArg {
  type: string
  value?: string | number
}

interface TursoResponse {
  results?: Array<{
    response?: {
      error?: { message: string }
      result?: {
        rows?: TursoValue[][]
      }
    }
  }>
}

interface TursoValue {
  type: string
  value?: unknown
}

async function executeQuery(sql: string, args: (string | number | null)[] = []): Promise<TursoResponse> {
  const apiURL = TURSO_DATABASE_URL.replace("libsql://", "https://")

  const requestBody = {
    requests: [
      {
        type: "execute",
        stmt: {
          sql,
          args: args.map((arg): TursoArg => {
            if (arg === null) {
              return { type: "null" }
            }
            if (typeof arg === "number") {
              if (Number.isInteger(arg)) {
                return { type: "integer", value: String(arg) }
              }
              return { type: "float", value: arg }
            }
            return { type: "text", value: arg }
          }),
        },
      },
    ],
  }

  const response = await fetch(`${apiURL}/v2/pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TURSO_AUTH_TOKEN}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Turso API error: ${response.status} - ${errorText}`)
  }

  const data: TursoResponse = await response.json()

  if (data.results?.[0]?.response?.error) {
    throw new Error(`Query error: ${data.results[0].response.error.message}`)
  }

  return data
}

function getString(value: TursoValue | undefined): string {
  if (!value || value.type === "null" || value.value === null || value.value === undefined) return ""
  return String(value.value)
}

function getNumber(value: TursoValue | undefined): number {
  if (!value || value.type === "null" || value.value === null || value.value === undefined) return 0
  const num = Number(value.value)
  return isNaN(num) ? 0 : num
}

function getInt(value: TursoValue | undefined): number {
  return Math.floor(getNumber(value))
}

function parseRow(row: TursoValue[]): AppResult {
  return {
    id: getInt(row[0]),
    keyword: getString(row[1]),
    title: getString(row[2]),
    url: getString(row[3]),
    rating: getString(row[4]),
    review_count: getString(row[5]),
    price: getString(row[6]),
    relevance_score: getNumber(row[7]),
    recent_reviews_30_days: getInt(row[8]),
    trending_score: getNumber(row[9]),
    created_at: getString(row[10]),
    updated_at: getString(row[11]),
  }
}

export async function getAllAppsForAnalytics(): Promise<AppResult[]> {
  const data = await executeQuery(
    `SELECT id, keyword, title, url, rating, review_count, price, 
            relevance_score, recent_reviews_30_days, trending_score, created_at, updated_at
     FROM search_results
     ORDER BY relevance_score DESC`
  )

  const rows = data.results?.[0]?.response?.result?.rows || []
  return rows.map(parseRow)
}

export async function getAllApps(options?: {
  page?: number
  limit?: number
  search?: string
}): Promise<{ apps: AppResult[]; total: number }> {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 20
  const search = options?.search?.trim()
  const offset = (page - 1) * limit

  let whereClause = ""
  const countArgs: (string | number | null)[] = []
  const dataArgs: (string | number | null)[] = []

  if (search) {
    whereClause = " WHERE (title LIKE ? OR keyword LIKE ?)"
    const pattern = `%${search}%`
    countArgs.push(pattern, pattern)
    dataArgs.push(pattern, pattern)
  }

  const countData = await executeQuery(
    `SELECT COUNT(*) FROM search_results${whereClause}`,
    countArgs
  )
  const total = getInt(countData.results?.[0]?.response?.result?.rows?.[0]?.[0])

  const data = await executeQuery(
    `SELECT id, keyword, title, url, rating, review_count, price, 
            relevance_score, recent_reviews_30_days, trending_score, created_at, updated_at
     FROM search_results${whereClause}
     ORDER BY relevance_score DESC
     LIMIT ? OFFSET ?`,
    [...dataArgs, limit, offset]
  )

  const rows = data.results?.[0]?.response?.result?.rows || []
  return { apps: rows.map(parseRow), total }
}

export async function getAppById(id: number): Promise<AppResult | null> {
  const data = await executeQuery(
    `SELECT id, keyword, title, url, rating, review_count, price, 
            relevance_score, recent_reviews_30_days, trending_score, created_at, updated_at
     FROM search_results
     WHERE id = ?
     LIMIT 1`,
    [id]
  )

  const row = data.results?.[0]?.response?.result?.rows?.[0]
  if (!row) return null
  return parseRow(row)
}

export async function getAppsByKeyword(keyword: string): Promise<AppResult[]> {
  const data = await executeQuery(
    `SELECT id, keyword, title, url, rating, review_count, price, 
            relevance_score, recent_reviews_30_days, trending_score, created_at, updated_at
     FROM search_results
     WHERE keyword = ?
     ORDER BY relevance_score DESC`,
    [keyword]
  )

  const rows = data.results?.[0]?.response?.result?.rows || []
  return rows.map(parseRow)
}

export async function getKeywords(): Promise<string[]> {
  const data = await executeQuery(
    `SELECT DISTINCT keyword FROM search_results ORDER BY keyword`
  )

  const rows = data.results?.[0]?.response?.result?.rows || []
  return rows.map((row: TursoValue[]) => getString(row[0]))
}

export async function getKeywordCounts(): Promise<KeywordCount[]> {
  const data = await executeQuery(
    `SELECT keyword, COUNT(*) as count 
     FROM search_results 
     GROUP BY keyword 
     ORDER BY count DESC`
  )

  const rows = data.results?.[0]?.response?.result?.rows || []
  return rows.map((row: TursoValue[]) => ({
    keyword: getString(row[0]),
    count: getInt(row[1]),
  }))
}

// ──────────────────────────────────────────────
// Favorites
// ──────────────────────────────────────────────

export async function initFavoritesTable(): Promise<void> {
  await executeQuery(
    `CREATE TABLE IF NOT EXISTS favorites (
      app_id INTEGER PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now'))
    )`
  )
}

export async function getFavoriteIds(): Promise<number[]> {
  const data = await executeQuery(
    `SELECT app_id FROM favorites ORDER BY created_at DESC`
  )
  const rows = data.results?.[0]?.response?.result?.rows || []
  return rows.map((row: TursoValue[]) => getInt(row[0]))
}

export async function addFavorite(appId: number): Promise<void> {
  await executeQuery(
    `INSERT OR IGNORE INTO favorites (app_id) VALUES (?)`,
    [appId]
  )
}

export async function removeFavorite(appId: number): Promise<void> {
  await executeQuery(
    `DELETE FROM favorites WHERE app_id = ?`,
    [appId]
  )
}

// ──────────────────────────────────────────────
// Stats
// ──────────────────────────────────────────────

export async function getStats(): Promise<DatabaseStats> {
  const appsData = await executeQuery(`SELECT COUNT(*) FROM search_results`)
  const totalApps = getInt(appsData.results?.[0]?.response?.result?.rows?.[0]?.[0])

  const keywordsData = await executeQuery(`SELECT COUNT(DISTINCT keyword) FROM search_results`)
  const totalKeywords = getInt(keywordsData.results?.[0]?.response?.result?.rows?.[0]?.[0])

  const latestData = await executeQuery(`SELECT MAX(updated_at) FROM search_results`)
  const latestScrape = getString(latestData.results?.[0]?.response?.result?.rows?.[0]?.[0])

  return {
    total_apps: totalApps,
    total_keywords: totalKeywords,
    latest_scrape: latestScrape || null,
  }
}

export async function searchApps(
  filters: {
    keywords?: string[]
    search?: string
    minRating?: number
    maxRating?: number
    minReviews?: number
    maxReviews?: number
    minRecentReviews?: number
    maxRecentReviews?: number
    priceType?: "free" | "paid" | "all"
    minTrendingScore?: number
    maxTrendingScore?: number
    minRecentReviewRatio?: number
    maxRecentReviewRatio?: number
    favoritesOnly?: boolean
    page?: number
    limit?: number
  }
): Promise<{ apps: AppResult[]; total: number }> {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const search = filters.search?.trim()
  const offset = (page - 1) * limit

  let sql = `FROM search_results`
  const conditions: string[] = []
  const args: (string | number | null)[] = []
  const countArgs: (string | number | null)[] = []

  if (filters.keywords && filters.keywords.length > 0) {
    const placeholders = filters.keywords.map(() => "?").join(", ")
    conditions.push(`keyword IN (${placeholders})`)
    args.push(...filters.keywords)
    countArgs.push(...filters.keywords)
  }

  if (search) {
    conditions.push("(title LIKE ? OR keyword LIKE ?)")
    const pattern = `%${search}%`
    args.push(pattern, pattern)
    countArgs.push(pattern, pattern)
  }

  if (filters.minRating !== undefined && filters.minRating > 0) {
    conditions.push("CAST(rating AS REAL) >= ?")
    args.push(filters.minRating)
    countArgs.push(filters.minRating)
  }

  if (filters.maxRating !== undefined && filters.maxRating < 5) {
    conditions.push("CAST(rating AS REAL) <= ?")
    args.push(filters.maxRating)
    countArgs.push(filters.maxRating)
  }

  if (filters.minReviews !== undefined && filters.minReviews > 0) {
    conditions.push("CAST(review_count AS INTEGER) >= ?")
    args.push(filters.minReviews)
    countArgs.push(filters.minReviews)
  }

  if (filters.maxReviews !== undefined && filters.maxReviews > 0) {
    conditions.push("CAST(review_count AS INTEGER) <= ?")
    args.push(filters.maxReviews)
    countArgs.push(filters.maxReviews)
  }

  if (filters.minRecentReviews !== undefined && filters.minRecentReviews > 0) {
    conditions.push("recent_reviews_30_days >= ?")
    args.push(filters.minRecentReviews)
    countArgs.push(filters.minRecentReviews)
  }

  if (filters.maxRecentReviews !== undefined && filters.maxRecentReviews > 0) {
    conditions.push("recent_reviews_30_days <= ?")
    args.push(filters.maxRecentReviews)
    countArgs.push(filters.maxRecentReviews)
  }

  if (filters.minTrendingScore !== undefined && filters.minTrendingScore > 0) {
    conditions.push("trending_score >= ?")
    args.push(filters.minTrendingScore)
    countArgs.push(filters.minTrendingScore)
  }

  if (filters.maxTrendingScore !== undefined && filters.maxTrendingScore < 100) {
    conditions.push("trending_score <= ?")
    args.push(filters.maxTrendingScore)
    countArgs.push(filters.maxTrendingScore)
  }

  if (filters.minRecentReviewRatio !== undefined && filters.minRecentReviewRatio > 0) {
    // Ratio = recent_reviews_30_days * 100 / total review_count (in %).
    // Guard against division by zero with NULLIF so apps with 0 reviews don't match
    // (NULL < anything is unknown, which excludes the row from a >= filter).
    conditions.push(
      "(CAST(recent_reviews_30_days AS REAL) * 100.0 / NULLIF(CAST(review_count AS INTEGER), 0)) >= ?"
    )
    args.push(filters.minRecentReviewRatio)
    countArgs.push(filters.minRecentReviewRatio)
  }

  if (filters.maxRecentReviewRatio !== undefined && filters.maxRecentReviewRatio < 100) {
    conditions.push(
      "(CAST(recent_reviews_30_days AS REAL) * 100.0 / NULLIF(CAST(review_count AS INTEGER), 0)) <= ?"
    )
    args.push(filters.maxRecentReviewRatio)
    countArgs.push(filters.maxRecentReviewRatio)
  }

  if (filters.priceType === "free") {
    conditions.push("(price LIKE '%free%' OR price = '' OR price IS NULL)")
  } else if (filters.priceType === "paid") {
    conditions.push("price NOT LIKE '%free%' AND price != '' AND price IS NOT NULL")
  }

  if (filters.favoritesOnly) {
    conditions.push("id IN (SELECT app_id FROM favorites)")
  }

  const whereClause = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : ""

  // Get total count
  const countData = await executeQuery(
    `SELECT COUNT(*) ${sql}${whereClause}`,
    countArgs
  )
  const total = getInt(countData.results?.[0]?.response?.result?.rows?.[0]?.[0])

  // Get paginated results
  const data = await executeQuery(
    `SELECT id, keyword, title, url, rating, review_count, price, 
            relevance_score, recent_reviews_30_days, trending_score, created_at, updated_at
     ${sql}${whereClause}
     ORDER BY relevance_score DESC
     LIMIT ? OFFSET ?`,
    [...args, limit, offset]
  )

  const rows = data.results?.[0]?.response?.result?.rows || []
  return { apps: rows.map(parseRow), total }
}
