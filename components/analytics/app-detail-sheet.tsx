"use client"

import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowRight01Icon,
  ExternalLink,
  Flame,
  Message01Icon,
  Star,
} from "@hugeicons/core-free-icons"
import { Icon } from "@/lib/icons"
import type { ScoredApp } from "@/lib/analytics"
import { OpportunityScore, SignalPill } from "@/components/analytics/visual-primitives"

interface AppDetailSheetProps {
  app: ScoredApp | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function AppDetailSheet({ app, open, onOpenChange }: AppDetailSheetProps) {
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
          <SheetDescription className="flex items-center gap-2 capitalize">
            <Badge variant="outline">{app.keyword}</Badge>
            Quick overview
          </SheetDescription>
        </SheetHeader>

        <div className="relative flex flex-col gap-5 px-6 pb-6">
          <div className="flex items-center gap-4">
            <OpportunityScore score={app.opportunityScore} size="lg" />
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Opportunity score</p>
              <div className="flex flex-wrap gap-1">
                {app.signals.slice(0, 3).map((signal) => (
                  <SignalPill key={signal} signal={signal} />
                ))}
              </div>
            </div>
          </div>

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

          <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">{app.price || "Not listed"}</span>
            </div>
            {totalReviews > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Recent share</span>
                <span className="font-medium tabular-nums">{recentShare}%</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link
                href={`/dashboard/apps/${app.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon icon={ArrowRight01Icon} data-icon="inline-start" />
                View more
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={app.url} target="_blank" rel="noopener noreferrer">
                <Icon icon={ExternalLink} data-icon="inline-start" />
                Open in App Store
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
