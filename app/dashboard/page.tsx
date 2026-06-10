"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ChartBar,
  Flame,
  Lightbulb,
  MagnifyingGlass,
  Star,
  Tag,
  TrendUp,
} from "@phosphor-icons/react"
import { Icon, type PhosphorIcon } from "@/lib/icons"
import { useMarketAnalytics, useStats } from "@/hooks/use-queries"
import {
  type CategoryInsight,
  type ScoredApp,
} from "@/lib/analytics"
import { AppDetailSheet } from "@/components/analytics/app-detail-sheet"
import {
  AnimatedStat,
  MomentumBar,
  OpportunityScore,
  RankBadge,
  SignalPill,
  SpotlightHero,
} from "@/components/analytics/visual-primitives"
import Link from "next/link"
import { cn } from "@/lib/utils"

const nicheChartConfig = {
  opportunity: { label: "Opportunity", color: "var(--chart-1)" },
  apps: { label: "Apps", color: "var(--chart-2)" },
} satisfies ChartConfig

const momentumChartConfig = {
  trending: { label: "Avg trending %", color: "var(--chart-3)" },
} satisfies ChartConfig

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useStats()
  const {
    data: market,
    isLoading: marketLoading,
    isError: marketError,
  } = useMarketAnalytics()
  const [selectedApp, setSelectedApp] = useState<ScoredApp | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const isLoading = statsLoading || marketLoading
  const summary = market?.summary ?? {
    topOpportunity: null,
    bestNiche: null,
    hottestMomentum: null,
    totalRecentReviews: 0,
    medianCompetition: 0,
  }
  const categories: CategoryInsight[] = market?.categories ?? []
  const topOpportunities = market?.topOpportunities ?? []

  const nicheChartData = useMemo(
    () =>
      categories.slice(0, 8).map((category) => ({
        keyword: category.keyword,
        opportunity: category.opportunityIndex,
        apps: category.appCount,
      })),
    [categories]
  )

  const momentumChartData = useMemo(
    () =>
      categories
        .slice(0, 10)
        .sort((a, b) => b.avgTrendingScore - a.avgTrendingScore)
        .map((category) => ({
          keyword: category.keyword,
          trending: category.avgTrendingScore,
        })),
    [categories]
  )

  const openApp = (app: ScoredApp) => {
    setSelectedApp(app)
    setSheetOpen(true)
  }

  if (statsError || marketError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load market data. Check your database connection.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Market Intelligence</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            What&apos;s heating up, where the gaps are, and which apps deserve a closer look
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/explorer">
            <MagnifyingGlass data-icon="inline-start" />
            Deep dive in Explorer
          </Link>
        </Button>
      </div>

      <SpotlightHero
        app={summary.topOpportunity}
        loading={isLoading}
        onOpen={openApp}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InsightCard
          title="Top Opportunity"
          icon={Lightbulb}
          loading={isLoading}
          value={summary.topOpportunity?.title ?? "—"}
          hint={
            summary.topOpportunity
              ? `Score ${summary.topOpportunity.opportunityScore} · ${summary.topOpportunity.keyword}`
              : stats?.total_apps
                ? "No apps meet the scoring threshold yet"
                : "No apps in database"
          }
          onClick={
            summary.topOpportunity ? () => openApp(summary.topOpportunity!) : undefined
          }
        />
        <InsightCard
          title="Best Niche"
          icon={Tag}
          loading={isLoading}
          value={summary.bestNiche?.keyword ?? "—"}
          hint={
            summary.bestNiche
              ? `Index ${summary.bestNiche.opportunityIndex} · ${summary.bestNiche.appCount} apps tracked`
              : "No categories yet"
          }
        />
        <InsightCard
          title="Hottest Momentum"
          icon={Flame}
          loading={isLoading}
          value={summary.hottestMomentum?.title ?? "—"}
          hint={
            summary.hottestMomentum
              ? `${summary.hottestMomentum.trending_score.toFixed(1)}% trending`
              : "No momentum data"
          }
          onClick={
            summary.hottestMomentum ? () => openApp(summary.hottestMomentum!) : undefined
          }
        />
        <InsightCard
          title="Apps Tracked"
          icon={ChartBar}
          loading={isLoading}
          numericValue={stats?.total_apps ?? 0}
          value={stats?.total_apps?.toLocaleString() ?? "0"}
          hint={`${stats?.total_keywords ?? 0} keywords · ${summary.totalRecentReviews.toLocaleString()} recent reviews`}
        />
      </div>

      <Tabs defaultValue="opportunities">
        <TabsList>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="niches">Niche Analysis</TabsTrigger>
          <TabsTrigger value="charts">Market Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="flex flex-col gap-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Opportunity Leaderboard</CardTitle>
              <CardDescription>
                Momentum (35%), validation (25%), quality (15%), market gap (25%). Requires 5+ recent
                reviews and meaningful total volume to score well.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {isLoading ? (
                <div className="flex flex-col gap-3 px-6 pb-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : topOpportunities.length === 0 ? (
                <p className="px-6 pb-6 text-muted-foreground">
                  {stats?.total_apps
                    ? "No apps meet the 5+ recent review threshold for opportunity scoring."
                    : "No apps to analyze yet."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>App</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Signals</TableHead>
                        <TableHead>Trending</TableHead>
                        <TableHead>Recent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topOpportunities.map((app, index) => (
                        <TableRow
                          key={app.id}
                          className="row-hover-lift cursor-pointer"
                          onClick={() => openApp(app)}
                        >
                          <TableCell>
                            <RankBadge rank={index + 1} />
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate font-medium">
                            {app.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {app.keyword}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <OpportunityScore score={app.opportunityScore} size="sm" />
                          </TableCell>
                          <TableCell>
                            <div className="flex max-w-[200px] flex-wrap gap-1">
                              {app.signals.slice(0, 2).map((signal) => (
                                <SignalPill key={signal} signal={signal} />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <MomentumBar value={app.trending_score} />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium tabular-nums">
                              {app.recent_reviews_30_days}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="niches" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Intelligence</CardTitle>
              <CardDescription>
                Compare competition density, momentum, and niche opportunity across keywords
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {isLoading ? (
                <div className="flex flex-col gap-3 px-6 pb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Category</TableHead>
                        <TableHead>Opportunity</TableHead>
                        <TableHead>Apps</TableHead>
                        <TableHead>Avg trending</TableHead>
                        <TableHead>Avg recent</TableHead>
                        <TableHead>Avg rating</TableHead>
                        <TableHead>Free / Paid</TableHead>
                        <TableHead>Leader</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.keyword}>
                          <TableCell className="font-medium capitalize">
                            {category.keyword}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold tabular-nums">
                              {category.opportunityIndex}
                            </span>
                          </TableCell>
                          <TableCell className="tabular-nums">{category.appCount}</TableCell>
                          <TableCell className="tabular-nums">
                            {category.avgTrendingScore}%
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {category.avgRecentReviews}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 tabular-nums">
                              <Star className="size-4" />
                              {category.avgRating}
                            </div>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {category.freeCount} / {category.paidCount}
                          </TableCell>
                          <TableCell>
                            {category.topApp ? (
                              <button
                                type="button"
                                className="max-w-[140px] truncate text-left text-sm hover:underline"
                                onClick={() => openApp(category.topApp!)}
                              >
                                {category.topApp.title}
                              </button>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Niche Opportunity Map</CardTitle>
                <CardDescription>
                  Top categories by opportunity index vs tracked app count
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : nicheChartData.length === 0 ? (
                  <p className="text-muted-foreground">No chart data available.</p>
                ) : (
                  <ChartContainer config={nicheChartConfig} className="h-[280px] w-full">
                    <BarChart data={nicheChartData} margin={{ left: 0, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="keyword"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          String(value).length > 10
                            ? `${String(value).slice(0, 10)}…`
                            : String(value)
                        }
                      />
                      <YAxis tickLine={false} axisLine={false} width={32} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="opportunity"
                        fill="var(--color-opportunity)"
                        radius={4}
                        animationDuration={900}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Momentum by Category</CardTitle>
                <CardDescription>
                  Average trending score — where recent review activity is hottest
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : momentumChartData.length === 0 ? (
                  <p className="text-muted-foreground">No chart data available.</p>
                ) : (
                  <ChartContainer config={momentumChartConfig} className="h-[280px] w-full">
                    <BarChart
                      data={momentumChartData}
                      layout="vertical"
                      margin={{ left: 4, right: 8, top: 8 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="keyword"
                        tickLine={false}
                        axisLine={false}
                        width={72}
                        tickFormatter={(value) =>
                          String(value).length > 12
                            ? `${String(value).slice(0, 12)}…`
                            : String(value)
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="trending"
                        fill="var(--color-trending)"
                        radius={4}
                        animationDuration={900}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendUp className="size-4" />
                <CardTitle>How to read this</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Opportunity score</strong> surfaces apps worth
                investigating: strong recent momentum, at least 5 reviews in the last 30 days,
                enough total reviews to trust the signal, good ratings, and categories that
                aren&apos;t overcrowded in your dataset.
              </p>
              <p>
                <strong className="text-foreground">Niche opportunity index</strong> highlights
                categories where demand signals are high relative to how many competitors you&apos;re
                tracking — useful for spotting underserved spaces.
              </p>
              <p>
                Click any app row to open a breakdown with score components and category context.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AppDetailSheet
        app={selectedApp}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}

function InsightCard({
  title,
  icon,
  loading,
  value,
  numericValue,
  hint,
  onClick,
}: {
  index?: number
  title: string
  icon: PhosphorIcon
  accent?: "primary" | "chart-2" | "hot" | "muted"
  loading: boolean
  value: string
  numericValue?: number
  hint: string
  onClick?: () => void
}) {
  const content = (
    <Card
      className={cn(
        "h-full transition-colors",
        onClick && "cursor-pointer hover:bg-muted/30"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <Icon icon={icon} className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-32" />
        ) : numericValue !== undefined ? (
          <AnimatedStat value={numericValue} className="text-2xl" />
        ) : (
          <div className="line-clamp-2 text-base font-semibold leading-snug">{value}</div>
        )}
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )

  if (onClick) {
    return (
      <button type="button" className="h-full text-left" onClick={onClick}>
        {content}
      </button>
    )
  }

  return content
}
