import { NextResponse } from "next/server"
import { getAppById, getAppsByKeyword } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const appId = parseInt(id, 10)

    if (!Number.isFinite(appId)) {
      return NextResponse.json({ error: "Invalid app id" }, { status: 400 })
    }

    const app = await getAppById(appId)
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 })
    }

    const nicheApps = await getAppsByKeyword(app.keyword)
    const relatedApps = nicheApps
      .filter((item) => item.id !== app.id)
      .slice(0, 10)

    return NextResponse.json({ app, relatedApps })
  } catch (error) {
    console.error("Error fetching app:", error)
    return NextResponse.json({ error: "Failed to fetch app" }, { status: 500 })
  }
}
