import { NextResponse } from "next/server"
import {
  computeCategoryInsights,
  computeMarketSummary,
  getRankedOpportunities,
  scoreApps,
} from "@/lib/analytics"
import { getAllAppsForAnalytics } from "@/lib/db"

export async function GET() {
  try {
    const apps = await getAllAppsForAnalytics()
    const scoredApps = scoreApps(apps)
    const summary = computeMarketSummary(apps)
    const categories = computeCategoryInsights(apps)
    const topOpportunities = getRankedOpportunities(scoredApps, 15)

    return NextResponse.json({
      summary,
      categories,
      topOpportunities,
      totalApps: apps.length,
    })
  } catch (error) {
    console.error("Error computing market analytics:", error)
    return NextResponse.json(
      { error: "Failed to compute market analytics" },
      { status: 500 }
    )
  }
}
