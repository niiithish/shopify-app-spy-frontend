"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  AppDetailContent,
  AppDetailError,
  AppDetailSkeleton,
  scoreAppBundle,
} from "@/components/analytics/app-detail-content"
import type { AppRecord } from "@/lib/analytics"

export default function AppDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bundle, setBundle] = useState<ReturnType<typeof scoreAppBundle> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/apps/${id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Failed to load app")
        }

        const data = (await res.json()) as {
          app: AppRecord
          relatedApps: AppRecord[]
        }

        if (!cancelled) {
          setBundle(scoreAppBundle(data.app, data.relatedApps))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load app")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <AppDetailSkeleton />
  if (error || !bundle) return <AppDetailError message={error || "App not found"} />

  return <AppDetailContent app={bundle.scoredApp} relatedApps={bundle.scoredRelated} />
}
