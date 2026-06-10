"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ArrowSquareOut,
  CalendarBlank,
  Link as LinkIcon,
  Tag,
} from "@phosphor-icons/react"
import { Icon, type PhosphorIcon } from "@/lib/icons"
import {
  MIN_RECENT_REVIEWS_FOR_SCORE,
  computeCategoryInsights,
  scoreApps,
  type AppRecord,
  type ScoredApp,
} from "@/lib/analytics"
import { OpportunityScore, SignalPill } from "@/components/analytics/visual-primitives"

function formatDate(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value.toFixed(0)}</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}

function ContextTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function DataRow({
  label,
  value,
  link,
  icon,
}: {
  label: string
  value: string
  link?: boolean
  icon?: PhosphorIcon
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        {icon && <Icon icon={icon} />}
        {label}
      </span>
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex max-w-[240px] items-center gap-1 truncate text-right text-primary hover:underline"
        >
          <LinkIcon />
          <span className="truncate">{value.replace(/^https?:\/\//, "")}</span>
        </a>
      ) : (
        <span className="text-right font-medium">{value}</span>
      )}
    </div>
  )
}

interface AppDetailContentProps {
  app: ScoredApp
  relatedApps: ScoredApp[]
}

export function AppDetailContent({ app, relatedApps }: AppDetailContentProps) {
  const totalReviews = parseInt(app.review_count.replace(/,/g, ""), 10) || 0
  const recentShare =
    totalReviews > 0
      ? Math.round((app.recent_reviews_30_days / totalReviews) * 100)
      : 0

  const category = computeCategoryInsights([app, ...relatedApps]).find(
    (item) => item.keyword === app.keyword
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-2 capitalize">
            {app.keyword}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{app.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Full app breakdown and niche context</p>
        </div>
        <div className="flex items-center gap-3">
          <OpportunityScore score={app.opportunityScore} size="lg" />
          <Button asChild>
            <a href={app.url} target="_blank" rel="noopener noreferrer">
              <ArrowSquareOut data-icon="inline-start" />
              App Store
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {app.signals.map((signal) => (
          <SignalPill key={signal} signal={signal} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-xl border p-4">
          <p className="text-sm font-medium">Score breakdown</p>
          <ScoreRow label="Momentum (trending %)" value={app.momentumScore} />
          <ScoreRow label="Validation (recent reviews)" value={app.validationScore} />
          <ScoreRow label="Quality (rating)" value={app.qualityScore} />
          <ScoreRow label="Market gap (low competition)" value={app.gapScore} />
        </section>

        <section className="flex flex-col gap-3 rounded-xl border p-4">
          <p className="text-sm font-medium">Key stats</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <ContextTile label="Rating" value={app.rating || "—"} />
            <ContextTile label="Total reviews" value={app.review_count || "—"} />
            <ContextTile label="Recent (30d)" value={String(app.recent_reviews_30_days)} />
            <ContextTile label="Trending" value={`${app.trending_score.toFixed(1)}%`} />
            <ContextTile label="Relevance" value={`${app.relevance_score.toFixed(1)}%`} />
            <ContextTile label="Price" value={app.price || "Not listed"} />
          </div>
          {totalReviews > 0 && (
            <p className="text-xs text-muted-foreground">
              {recentShare}% of reviews are from the last 30 days.
              {app.recent_reviews_30_days < MIN_RECENT_REVIEWS_FOR_SCORE &&
                ` Needs ${MIN_RECENT_REVIEWS_FOR_SCORE}+ recent reviews for a strong score.`}
            </p>
          )}
        </section>
      </div>

      {category && (
        <section className="flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Tag className="size-4" />
            <p className="text-sm font-medium capitalize">{app.keyword} niche</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <ContextTile label="Competitors tracked" value={String(category.appCount)} />
            <ContextTile label="Niche opportunity" value={String(category.opportunityIndex)} />
            <ContextTile label="Avg category rating" value={String(category.avgRating)} />
            <ContextTile label="Avg recent reviews" value={String(category.avgRecentReviews)} />
            <ContextTile label="Avg trending" value={`${category.avgTrendingScore}%`} />
            <ContextTile label="Free / paid" value={`${category.freeCount} / ${category.paidCount}`} />
          </div>
        </section>
      )}

      {relatedApps.length > 0 && (
        <section className="flex flex-col gap-3 rounded-xl border p-4">
          <p className="text-sm font-medium">Others in this niche</p>
          <div className="flex flex-col gap-1">
            {relatedApps.map((related) => (
              <Link
                key={related.id}
                href={`/dashboard/apps/${related.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md border px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <span className="font-medium">{related.title}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  Score {related.opportunityScore}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border p-4">
        <p className="text-sm font-medium">Collected data</p>
        <div className="flex flex-col gap-2 text-sm">
          <DataRow label="App Store URL" value={app.url} link />
          <DataRow icon={CalendarBlank} label="First tracked" value={formatDate(app.created_at)} />
          <DataRow icon={CalendarBlank} label="Last updated" value={formatDate(app.updated_at)} />
        </div>
        <p className="text-xs text-muted-foreground">
          Description and full listing copy aren&apos;t stored in the database yet. Use the App Store
          link above for the complete listing.
        </p>
      </section>
    </div>
  )
}

export function AppDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full max-w-lg" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}

export function AppDetailError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Could not load app</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export function scoreAppBundle(app: AppRecord, relatedApps: AppRecord[]) {
  const scored = scoreApps([app, ...relatedApps])
  const scoredApp = scored.find((item) => item.id === app.id)!
  const scoredRelated = scored
    .filter((item) => item.id !== app.id)
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
  return { scoredApp, scoredRelated }
}
