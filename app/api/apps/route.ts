import { NextResponse } from "next/server"
import { getAllApps, searchApps } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

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
    const priceType = searchParams.get("priceType") as "free" | "paid" | "all" | undefined

    // If no filters, return all apps
    const hasFilters =
      keywords ||
      minRating ||
      maxRating ||
      minReviews ||
      maxReviews ||
      minRecentReviews ||
      maxRecentReviews ||
      minTrendingScore ||
      maxTrendingScore ||
      priceType

    let apps
    if (hasFilters) {
      apps = await searchApps({
        keywords,
        minRating,
        maxRating,
        minReviews,
        maxReviews,
        minRecentReviews,
        maxRecentReviews,
        minTrendingScore,
        maxTrendingScore,
        priceType,
      })
    } else {
      apps = await getAllApps()
    }

    return NextResponse.json({ apps })
  } catch (error) {
    console.error("Error fetching apps:", error)
    return NextResponse.json(
      { error: "Failed to fetch apps" },
      { status: 500 }
    )
  }
}
