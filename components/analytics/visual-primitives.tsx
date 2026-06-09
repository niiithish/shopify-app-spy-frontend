"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAnimatedNumber } from "@/hooks/use-animated-number"
import { Flame, SparklesIcon } from "@hugeicons/core-free-icons"
import { Icon } from "@/lib/icons"
import type { ScoredApp } from "@/lib/analytics"

export function LiveBadge({ label = "Live data" }: { label?: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 font-normal">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
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
    <span className={cn("font-bold tabular-nums tracking-tight", className)}>
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
  const tier =
    score >= 75 ? "hot" : score >= 55 ? "warm" : score >= 35 ? "mild" : "cool"

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold tabular-nums ring-2",
        size === "sm" && "size-9 text-xs",
        size === "md" && "size-11 text-sm",
        size === "lg" && "size-16 text-lg",
        tier === "hot" && "bg-primary/20 text-primary ring-primary/40",
        tier === "warm" && "bg-chart-2/20 text-chart-2 ring-chart-2/30",
        tier === "mild" && "bg-chart-4/15 text-foreground ring-chart-4/25",
        tier === "cool" && "bg-muted text-muted-foreground ring-border"
      )}
    >
      {score.toFixed(0)}
    </div>
  )
}

export function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <Badge className="size-8 justify-center bg-primary text-primary-foreground shadow-sm">
        1
      </Badge>
    )
  }
  if (rank === 2) {
    return (
      <Badge variant="secondary" className="size-8 justify-center font-bold">
        2
      </Badge>
    )
  }
  if (rank === 3) {
    return (
      <Badge variant="outline" className="size-8 justify-center font-bold">
        3
      </Badge>
    )
  }
  return <span className="inline-flex size-8 items-center justify-center text-muted-foreground tabular-nums">{rank}</span>
}

export function MomentumBar({ value, max = 100 }: { value: number; max?: number }) {
  const width = Math.min((value / max) * 100, 100)
  const hot = value >= 50

  return (
    <div className="flex min-w-[88px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            hot ? "bg-primary" : "bg-chart-3"
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={cn("w-10 text-right text-xs tabular-nums", hot && "font-semibold text-primary")}>
        {value.toFixed(0)}%
      </span>
    </div>
  )
}

export function SignalPill({ signal }: { signal: string }) {
  const accent =
    signal.includes("Low traction")
      ? "border-destructive/25 bg-destructive/10 text-destructive"
      : signal.includes("Hot") || signal.includes("momentum")
        ? "border-primary/30 bg-primary/10 text-primary"
        : signal.includes("competition") || signal.includes("Early")
          ? "border-chart-2/30 bg-chart-2/10 text-chart-2"
          : "border-border bg-muted/60 text-foreground"

  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium", accent)}>
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
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (loading) {
    return <Skeleton className="h-44 w-full rounded-2xl" />
  }

  if (!app) return null

  return (
    <div
      className={cn(
        "animate-fade-in-up relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-6 shadow-sm",
        mounted && "opacity-100"
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 size-48 rounded-full bg-chart-2/10 blur-3xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <LiveBadge label="Top pick right now" />
            <Badge variant="secondary" className="capitalize">
              {app.keyword}
            </Badge>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              Highest opportunity
            </p>
            <h2 className="mt-1 max-w-xl text-2xl font-semibold tracking-tight lg:text-3xl">
              {app.title}
            </h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              {app.signals.slice(0, 3).join(" · ") || "Strong composite signals across your dataset"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {app.signals.map((signal) => (
              <SignalPill key={signal} signal={signal} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center gap-2">
            <OpportunityScore score={app.opportunityScore} size="lg" />
            <span className="text-xs text-muted-foreground">Opportunity</span>
          </div>
          <div className="hidden h-20 w-px bg-border sm:block" />
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Icon icon={Flame} className="animate-flame text-primary" />
              <span className="font-medium tabular-nums">{app.trending_score.toFixed(1)}% trending</span>
            </div>
            <div className="tabular-nums text-muted-foreground">
              {app.recent_reviews_30_days} reviews this month
            </div>
            <Button size="sm" onClick={() => onOpen(app)}>
              <Icon icon={SparklesIcon} data-icon="inline-start" />
              Inspect breakdown
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Stagger({ index, children, className }: { index: number; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("animate-fade-in-up", className)}
      style={{ animationDelay: `${Math.min(index * 60, 420)}ms` }}
    >
      {children}
    </div>
  )
}
