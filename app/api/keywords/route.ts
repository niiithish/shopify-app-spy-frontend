import { NextResponse } from "next/server"
import { getKeywords, getKeywordCounts } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const withCounts = searchParams.get("withCounts") === "true"

    if (withCounts) {
      const keywordCounts = await getKeywordCounts()
      return NextResponse.json({ keywords: keywordCounts })
    }

    const keywords = await getKeywords()
    return NextResponse.json({ keywords })
  } catch (error) {
    console.error("Error fetching keywords:", error)
    return NextResponse.json(
      { error: "Failed to fetch keywords" },
      { status: 500 }
    )
  }
}
