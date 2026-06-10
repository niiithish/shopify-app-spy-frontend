"use client"

import { type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAnimatedNumber } from "@/hooks/use-animated-number"
import { ArrowRight, Flame } from "@phosphor-icons/react"
import type { ScoredApp } from "@/lib/analytics"

export function LiveBadge({ label = "Live" }: { label?: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      {label}
    </Badge>
  )
}

export function AnimatedStat({
  value,
  loading,
  className,
  decimals = 0,
}: {
  value: number
  loading?: boolean
  className?: string
  decimals?: number
}) {
  const animated = useAnimatedNumber(value, { enabled: !loading })
  if (loading) return <Skeleton className="h-8 w-20" />

  return (
    <span className={cn("font-semibold tabular-nums tracking-tight", className)}>
      {decimals > 0 ? animated.toFixed(decimals) : Math.round(animated).toLocaleString()}
    </span>
  )
}

export function OpportunityScore({
  score,
  size = "md",
}: {
  score: number
  size?: "sm" | "md" | "lg"
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg border border-border bg-muted/40 font-semibold tabular-nums text-foreground",
        size === "sm" && "min-w-9 px-2 py-1 text-xs",
        size === "md" && "min-w-11 px-2.5 py-1.5 text-sm",
        size === "lg" && "min-w-14 px-3 py-2 text-lg"
      )}
    >
      {score.toFixed(0)}
    </div>
  )
}

export function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums text-foreground">
        {rank}
      </span>
    )
  }
  return (
    <span className="inline-flex size-7 items-center justify-center text-xs tabular-nums text-muted-foreground">
      {rank}
    </span>
  )
}

export function MomentumBar({ value, max = 100 }: { value: number; max?: number }) {
  const width = Math.min((value / max) * 100, 100)

  return (
    <div className="flex min-w-[88px] items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/70 transition-all duration-500 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
        {value.toFixed(0)}%
      </span>
    </div>
  )
}

export function SignalPill({ signal }: { signal: string }) {
  return (
    <span className="inline-flex rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
      {signal}
    </span>
  )
}

export function SpotlightHero({
  app,
  loading,
  onOpen,
}: {
  app: ScoredApp | null
  loading: boolean
  onOpen: (app: ScoredApp) => void
}) {
  if (loading) {
    return <Skeleton className="h-36 w-full rounded-xl" />
  }

  if (!app) return null

  return (
    <div className="rounded-xl border border-border bg-card p-5 lg:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Featured pick</span>
            <Badge variant="secondary" className="capitalize">
              {app.keyword}
            </Badge>
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">{app.title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {app.signals.slice(0, 3).join(" · ") || "Strong signals across momentum, quality, and market gap"}
            </p>
          </div>

          {app.signals.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {app.signals.slice(0, 4).map((signal) => (
                <SignalPill key={signal} signal={signal} />
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-end">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Opportunity</p>
              <OpportunityScore score={app.opportunityScore} size="lg" />
            </div>
            <div className="hidden h-12 w-px bg-border sm:block lg:hidden" />
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Flame className="size-3.5" />
                <span className="tabular-nums">{app.trending_score.toFixed(1)}% trending</span>
              </div>
              <p className="tabular-nums text-muted-foreground">
                {app.recent_reviews_30_days} reviews this month
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => onOpen(app)}>
            View breakdown
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Stagger({ children, className }: { index?: number; children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
