"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  ExternalLink,
  Flame,
  Message01Icon,
  Star,
} from "@hugeicons/core-free-icons"
import { Icon } from "@/lib/icons"
import {
  MIN_RECENT_REVIEWS_FOR_SCORE,
  type CategoryInsight,
  type ScoredApp,
} from "@/lib/analytics"
import { OpportunityScore, SignalPill } from "@/components/analytics/visual-primitives"

interface AppDetailSheetProps {
  app: ScoredApp | null
  category?: CategoryInsight | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ScoreRow({ label, value, animate }: { label: string; value: number; animate: boolean }) {
  const [display, setDisplay] = useState(animate ? 0 : value)

  useEffect(() => {
    if (!animate) {
      setDisplay(value)
      return
    }
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 700, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(value * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    setDisplay(0)
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, animate])

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{display.toFixed(0)}</span>
      </div>
      <Progress value={display} className="h-2" />
    </div>
  )
}

export function AppDetailSheet({
  app,
  category,
  open,
  onOpenChange,
}: AppDetailSheetProps) {
  if (!app) return null

  const totalReviews = parseInt(app.review_count.replace(/,/g, ""), 10) || 0
  const recentShare =
    totalReviews > 0
      ? Math.round((app.recent_reviews_30_days / totalReviews) * 100)
      : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-primary/15 sm:max-w-md">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/15 to-transparent" />

        <SheetHeader className="relative">
          <SheetTitle className="pr-8 text-base leading-snug">{app.title}</SheetTitle>
          <SheetDescription className="capitalize">{app.keyword} category</SheetDescription>
        </SheetHeader>

        <div className="relative flex flex-col gap-6 px-6 pb-6">
          <div className="flex flex-wrap gap-2">
            {app.signals.map((signal) => (
              <SignalPill key={signal} signal={signal} />
            ))}
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-4">
            <OpportunityScore score={app.opportunityScore} size="lg" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Opportunity score
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Momentum, validation, quality &amp; market gap combined
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <ScoreRow label="Momentum (trending %)" value={app.momentumScore} animate={open} />
            <ScoreRow label="Validation (recent reviews)" value={app.validationScore} animate={open} />
            <ScoreRow label="Quality (rating)" value={app.qualityScore} animate={open} />
            <ScoreRow label="Market gap (low competition)" value={app.gapScore} animate={open} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={Star} label="Rating" value={app.rating || "—"} />
            <StatTile icon={Message01Icon} label="Total reviews" value={app.review_count || "—"} />
            <StatTile
              icon={Message01Icon}
              label="Recent (30d)"
              value={String(app.recent_reviews_30_days)}
              highlight
            />
            <StatTile
              icon={Flame}
              label="Trending"
              value={`${app.trending_score.toFixed(1)}%`}
              highlight
            />
          </div>

          {totalReviews > 0 && (
            <p className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{recentShare}%</span> of all reviews
              landed in the last 30 days
              {recentShare >= 50 ? " — this app is accelerating." : "."}
              {app.recent_reviews_30_days < MIN_RECENT_REVIEWS_FOR_SCORE && (
                <>
                  {" "}
                  Needs at least {MIN_RECENT_REVIEWS_FOR_SCORE} recent reviews to be considered a
                  strong opportunity.
                </>
              )}
            </p>
          )}

          {category && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Category context</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <ContextTile label="Competitors tracked" value={String(category.appCount)} />
                  <ContextTile label="Niche opportunity" value={String(category.opportunityIndex)} />
                  <ContextTile label="Avg category rating" value={String(category.avgRating)} />
                  <ContextTile label="Avg recent reviews" value={String(category.avgRecentReviews)} />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Price</p>
            <Badge variant="outline" className="w-fit">
              {app.price || "Not listed"}
            </Badge>
          </div>

          <Button asChild>
            <a href={app.url} target="_blank" rel="noopener noreferrer">
              <Icon icon={ExternalLink} data-icon="inline-start" />
              View on Shopify App Store
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function StatTile({
  icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Star
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-md border border-primary/20 bg-primary/5 p-3"
          : "rounded-md border p-3"
      }
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon icon={icon} />
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
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
