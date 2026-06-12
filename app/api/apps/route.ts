import { NextResponse } from "next/server"
import { getAllApps, searchApps } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100)

    // Text search
    const search = searchParams.get("search") || undefined

    // Parse filters from query params
    const keywords = searchParams.get("keywords")?.split(",").filter(Boolean) || undefined
    const minRating = searchParams.get("minRating")
      ? parseFloat(searchParams.get("minRating")!)
      : undefined
    const maxRating = searchParams.get("maxRating")
      ? parseFloat(searchParams.get("maxRating")!)
      : undefined
    const minReviews = searchParams.get("minReviews")
      ? parseInt(searchParams.get("minReviews")!)
      : undefined
    const maxReviews = searchParams.get("maxReviews")
      ? parseInt(searchParams.get("maxReviews")!)
      : undefined
    const minRecentReviews = searchParams.get("minRecentReviews")
      ? parseInt(searchParams.get("minRecentReviews")!)
      : undefined
    const maxRecentReviews = searchParams.get("maxRecentReviews")
      ? parseInt(searchParams.get("maxRecentReviews")!)
      : undefined
    const minTrendingScore = searchParams.get("minTrendingScore")
      ? parseFloat(searchParams.get("minTrendingScore")!)
      : undefined
    const maxTrendingScore = searchParams.get("maxTrendingScore")
      ? parseFloat(searchParams.get("maxTrendingScore")!)
      : undefined
    const minRecentReviewRatio = searchParams.get("minRecentReviewRatio")
      ? parseFloat(searchParams.get("minRecentReviewRatio")!)
      : undefined
    const maxRecentReviewRatio = searchParams.get("maxRecentReviewRatio")
      ? parseFloat(searchParams.get("maxRecentReviewRatio")!)
      : undefined
    const priceType = searchParams.get("priceType") as "free" | "paid" | "all" | undefined
    const favoritesOnly = searchParams.get("favoritesOnly") === "true"

    // Check if any filters (including search) are applied
    const hasFilters =
      search ||
      keywords ||
      minRating ||
      maxRating ||
      minReviews ||
      maxReviews ||
      minRecentReviews ||
      maxRecentReviews ||
      minTrendingScore ||
      maxTrendingScore ||
      minRecentReviewRatio ||
      maxRecentReviewRatio ||
      priceType ||
      favoritesOnly

    let result
    if (hasFilters) {
      result = await searchApps({
        search,
        keywords,
        minRating,
        maxRating,
        minReviews,
        maxReviews,
        minRecentReviews,
        maxRecentReviews,
        minTrendingScore,
        maxTrendingScore,
        minRecentReviewRatio,
        maxRecentReviewRatio,
        priceType,
        favoritesOnly,
        page,
        limit,
      })
    } else {
      result = await getAllApps({ page, limit })
    }

    return NextResponse.json({
      apps: result.apps,
      total: result.total,
      page,
      limit,
    })
  } catch (error) {
    console.error("Error fetching apps:", error)
    return NextResponse.json(
      { error: "Failed to fetch apps" },
      { status: 500 }
    )
  }
}
