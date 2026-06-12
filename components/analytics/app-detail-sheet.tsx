"use client"

import Link from "next/link"
import {
  ArrowRight,
  ArrowSquareOut,
  ChatCircle,
  Flame,
  Heart,
  Star,
} from "@phosphor-icons/react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icon, type PhosphorIcon } from "@/lib/icons"
import type { ScoredApp } from "@/lib/analytics"
import { OpportunityScore, SignalPill } from "@/components/analytics/visual-primitives"
import { useFavoriteIds, useToggleFavorite } from "@/hooks/use-queries"

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
  icon: PhosphorIcon
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
  const { data: favoriteIds = [] } = useFavoriteIds()
  const { mutate: toggleFavorite } = useToggleFavorite()

  if (!app) return null

  const totalReviews = parseInt(app.review_count.replace(/,/g, ""), 10) || 0
  const recentShare =
    totalReviews > 0
      ? Math.round((app.recent_reviews_30_days / totalReviews) * 100)
      : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-primary/15 sm:max-w-md">
        <div className="sr-only" />

        <SheetHeader className="relative">
          <SheetTitle className="pr-8 text-base leading-snug">
            <span className="flex items-center gap-2">
              {app.title}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const isFav = favoriteIds.includes(app.id)
                  toggleFavorite({ appId: app.id, isFavorited: isFav })
                }}
                className="-mr-1 -ml-0.5 inline-flex items-center justify-center rounded-md p-1 transition-colors hover:bg-muted"
                aria-label={favoriteIds.includes(app.id) ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  weight={favoriteIds.includes(app.id) ? "fill" : "regular"}
                  className={favoriteIds.includes(app.id) ? "size-4 text-red-500" : "size-4 text-muted-foreground"}
                />
              </button>
            </span>
          </SheetTitle>
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
            <StatTile icon={ChatCircle} label="Total reviews" value={app.review_count || "—"} />
            <StatTile
              icon={ChatCircle}
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
                <ArrowRight data-icon="inline-start" />
                View more
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={app.url} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOut data-icon="inline-start" />
                Open in App Store
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
