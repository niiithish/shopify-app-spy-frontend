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

export async function getAllApps(): Promise<AppResult[]> {
  const data = await executeQuery(
    `SELECT id, keyword, title, url, rating, review_count, price, 
            relevance_score, recent_reviews_30_days, trending_score, created_at, updated_at
     FROM search_results
     ORDER BY relevance_score DESC`
  )

  const rows = data.results?.[0]?.response?.result?.rows || []
  return rows.map(parseRow)
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
    minRating?: number
    maxRating?: number
    minReviews?: number
    maxReviews?: number
    minRecentReviews?: number
    maxRecentReviews?: number
    priceType?: "free" | "paid" | "all"
    minTrendingScore?: number
    maxTrendingScore?: number
  }
): Promise<AppResult[]> {
  let sql = `SELECT id, keyword, title, url, rating, review_count, price, 
                    relevance_score, recent_reviews_30_days, trending_score, created_at, updated_at
             FROM search_results`
  const conditions: string[] = []
  const args: (string | number | null)[] = []

  if (filters.keywords && filters.keywords.length > 0) {
    const placeholders = filters.keywords.map(() => "?").join(", ")
    conditions.push(`keyword IN (${placeholders})`)
    args.push(...filters.keywords)
  }

  if (filters.minRating !== undefined && filters.minRating > 0) {
    conditions.push("CAST(rating AS REAL) >= ?")
    args.push(filters.minRating)
  }

  if (filters.maxRating !== undefined && filters.maxRating < 5) {
    conditions.push("CAST(rating AS REAL) <= ?")
    args.push(filters.maxRating)
  }

  if (filters.minReviews !== undefined && filters.minReviews > 0) {
    conditions.push("CAST(review_count AS INTEGER) >= ?")
    args.push(filters.minReviews)
  }

  if (filters.maxReviews !== undefined && filters.maxReviews > 0) {
    conditions.push("CAST(review_count AS INTEGER) <= ?")
    args.push(filters.maxReviews)
  }

  if (filters.minRecentReviews !== undefined && filters.minRecentReviews > 0) {
    conditions.push("recent_reviews_30_days >= ?")
    args.push(filters.minRecentReviews)
  }

  if (filters.maxRecentReviews !== undefined && filters.maxRecentReviews > 0) {
    conditions.push("recent_reviews_30_days <= ?")
    args.push(filters.maxRecentReviews)
  }

  if (filters.minTrendingScore !== undefined && filters.minTrendingScore > 0) {
    conditions.push("trending_score >= ?")
    args.push(filters.minTrendingScore)
  }

  if (filters.maxTrendingScore !== undefined && filters.maxTrendingScore < 100) {
    conditions.push("trending_score <= ?")
    args.push(filters.maxTrendingScore)
  }

  if (filters.priceType === "free") {
    conditions.push("(price LIKE '%free%' OR price = '' OR price IS NULL)")
  } else if (filters.priceType === "paid") {
    conditions.push("price NOT LIKE '%free%' AND price != '' AND price IS NOT NULL")
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ")
  }

  sql += " ORDER BY relevance_score DESC"

  const data = await executeQuery(sql, args)
  const rows =  data.results?.[0]?.response?.result?.rows || []
  return rows.map(parseRow)
}
