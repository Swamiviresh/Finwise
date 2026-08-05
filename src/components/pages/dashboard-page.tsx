'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { format, differenceInDays, parseISO } from 'date-fns'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Plus,
  Target,
  Bot,
  BarChart3,
  Lightbulb,
  Receipt,
  CalendarDays,
  Activity,
  Sparkles,
} from 'lucide-react'

import { useDashboardData, useMonthlyChart, useCategoryDistribution } from '@/hooks/use-dashboard'
import { useTransactions } from '@/hooks/use-transactions'
import { useBudgets } from '@/hooks/use-budgets'
import { useSubscriptions } from '@/hooks/use-subscriptions'
import { useRouterStore } from '@/store/router-store'
import { AppRoute } from '@/types'

import { StatCard } from '@/components/shared/stat-card'
import {
  DashboardSkeleton,
  CardSkeleton,
  ChartSkeleton,
  ListSkeleton,
} from '@/components/shared/loading-skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/format'
import { FINANCIAL_HEALTH_RANGES } from '@/lib/constants'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

// --- Animation Variants ---

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const

// --- Helpers ---

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getHealthInfo(score: number) {
  return (
    FINANCIAL_HEALTH_RANGES.find(
      (r) => score >= r.min && score <= r.max,
    ) ?? FINANCIAL_HEALTH_RANGES[FINANCIAL_HEALTH_RANGES.length - 1]
  )
}

function getBudgetBarClass(percent: number): string {
  if (percent > 90) return '[&>div]:bg-red-500'
  if (percent >= 70) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-emerald-500'
}

function daysUntil(dateStr: string | Date): number {
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  return differenceInDays(d, new Date())
}

// --- Chart Configs ---

const areaChartConfig: ChartConfig = {
  value: { label: 'Income', color: 'hsl(var(--chart-1))' },
  secondaryValue: { label: 'Expenses', color: 'hsl(var(--chart-5))' },
}

const pieChartConfig: ChartConfig = {
  value: { label: 'Amount' },
}

// --- Sub-components ---

function GreetingSection({ name }: { name: string | null | undefined }) {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')
  const displayName = name ?? 'there'

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {getGreeting()}, {displayName.split(' ')[0]}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{today}</p>
    </div>
  )
}

function IncomeVsExpensesChart({
  data,
  isLoading,
}: {
  data: Array<{ label: string; value: number; secondaryValue?: number }>
  isLoading: boolean
}) {
  if (isLoading) {
    return <ChartSkeleton />
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Income vs Expenses</CardTitle>
          <CardDescription>Last 6 months trend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No data available yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Income vs Expenses</CardTitle>
        <CardDescription>Last 6 months trend</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={areaChartConfig} className="w-full">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
              }
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="value"
              name="Income"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              fill="url(#incomeGradient)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="secondaryValue"
              name="Expenses"
              stroke="hsl(var(--chart-5))"
              strokeWidth={2}
              fill="url(#expenseGradient)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function CategoryPieChart({
  data,
  isLoading,
}: {
  data: Array<{ label: string; value: number; fill: string }>
  isLoading: boolean
}) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

  if (isLoading) {
    return <ChartSkeleton />
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Distribution</CardTitle>
          <CardDescription>Where your money goes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No spending data yet
          </div>
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Category Distribution</CardTitle>
        <CardDescription>Where your money goes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 lg:flex-row">
          <ChartContainer config={pieChartConfig} className="w-full max-w-[240px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={88}
                paddingAngle={2}
                dataKey="value"
                nameKey="label"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.fill}
                    stroke="hsl(var(--background))"
                    strokeWidth={activeIndex === index ? 2 : 0}
                    style={{
                      transform: activeIndex === index ? 'scale(1.04)' : 'scale(1)',
                      transformOrigin: 'center',
                      transition: 'transform 0.2s ease-out',
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex max-h-[240px] w-full flex-col gap-2 overflow-y-auto lg:max-w-[180px]">
            {data.slice(0, 8).map((entry) => {
              const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0'
              return (
                <div key={entry.label} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="truncate text-xs font-medium">{entry.label}</span>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FinancialHealthCard({
  score,
  grade,
  summary,
}: {
  score: number
  grade: string
  summary: string
}) {
  const healthInfo = getHealthInfo(score)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-4" />
          Financial Health Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          {/* Circular progress */}
          <div className="relative shrink-0">
            <svg width="130" height="130" className="-rotate-90">
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="10"
              />
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke={healthInfo.color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: healthInfo.color }}>
                {score}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <span
                className="inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-lg font-bold text-white"
                style={{ backgroundColor: healthInfo.color }}
              >
                {grade}
              </span>
              <span className="text-sm font-medium" style={{ color: healthInfo.color }}>
                {healthInfo.label}
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {summary}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentTransactionsCard({
  transactions,
  onViewAll,
}: {
  transactions: Array<{
    id: string
    description: string
    amount: number
    type: 'income' | 'expense' | 'transfer'
    date: Date | string
    category: { name: string; color: string; icon: string | null } | undefined
  }>
  onViewAll: () => void
}) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" className="text-xs" onClick={onViewAll}>
              View All <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Receipt className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No transactions yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Start by adding your first transaction
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Transactions</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-xs" onClick={onViewAll}>
            View All <ArrowRight className="ml-1 size-3" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Description</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden pr-6 text-right md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.slice(0, 5).map((tx) => (
              <TableRow key={tx.id} className="cursor-pointer">
                <TableCell className="pl-6 font-medium">
                  <div className="flex items-center gap-2.5">
                    {tx.category?.icon && (
                      <span className="text-base leading-none">
                        {tx.category.icon}
                      </span>
                    )}
                    <span className="max-w-[180px] truncate">
                      {tx.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {tx.category && (
                    <Badge
                      variant="secondary"
                      className="gap-1.5"
                      style={{
                        backgroundColor: `${tx.category.color}15`,
                        color: tx.category.color,
                        borderColor: `${tx.category.color}30`,
                      }}
                    >
                      {tx.category.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  <span
                    className={cn(
                      tx.type === 'income' && 'text-emerald-600 dark:text-emerald-400',
                      tx.type === 'expense' && 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(Math.abs(tx.amount))}
                  </span>
                </TableCell>
                <TableCell className="hidden pr-6 text-right text-muted-foreground md:table-cell">
                  {formatDate(tx.date)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function BudgetProgressCard({
  budgets,
  isLoading,
}: {
  budgets: Array<{
    id: string
    name: string
    amount: number
    spent: number
    period: string
  }>
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ListSkeleton count={4} />
        </CardContent>
      </Card>
    )
  }

  const activeBudgets = budgets.filter((b) => b.amount > 0)

  if (activeBudgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <BarChart3 className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No active budgets
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Create a budget to start tracking your spending
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Budget Progress</CardTitle>
        <CardDescription>This month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {activeBudgets.slice(0, 5).map((budget) => {
          const percent = Math.min(
            Math.round((budget.spent / budget.amount) * 100),
            100,
          )
          const remaining = Math.max(budget.amount - budget.spent, 0)

          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{budget.name}</span>
                <span
                  className={cn(
                    'text-xs font-semibold',
                    percent > 90 && 'text-red-600 dark:text-red-400',
                    percent >= 70 &&
                      percent <= 90 &&
                      'text-amber-600 dark:text-amber-400',
                    percent < 70 && 'text-emerald-600 dark:text-emerald-400',
                  )}
                >
                  {percent}%
                </span>
              </div>
              <Progress
                value={percent}
                className={cn('h-2', getBudgetBarClass(percent))}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}
                </span>
                <span>{formatCurrency(remaining)} left</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function UpcomingBillsCard({
  subscriptions,
  isLoading,
}: {
  subscriptions: Array<{
    id: string
    name: string
    amount: number
    nextBillingDate: Date | string
    icon: string | null
    color: string
    billingCycle: string
  }>
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <ListSkeleton count={4} />
        </CardContent>
      </Card>
    )
  }

  const upcoming = subscriptions
    .filter((s) => {
      const days = daysUntil(s.nextBillingDate)
      return days >= 0 && days <= 30
    })
    .sort(
      (a, b) =>
        new Date(a.nextBillingDate).getTime() -
        new Date(b.nextBillingDate).getTime(),
    )
    .slice(0, 5)

  if (upcoming.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CalendarDays className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No upcoming bills
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Your subscription tracking is clear
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Bills</CardTitle>
        <CardDescription>Next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {upcoming.map((sub) => {
            const days = daysUntil(sub.nextBillingDate)
            const isSoon = days <= 3

            return (
              <div
                key={sub.id}
                className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50"
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{ backgroundColor: `${sub.color}15` }}
                >
                  {sub.icon ?? <Receipt className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{sub.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(sub.nextBillingDate)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(sub.amount)}
                  </p>
                  <Badge
                    variant={isSoon ? 'destructive' : 'secondary'}
                    className="mt-0.5 text-[10px]"
                  >
                    {days === 0
                      ? 'Today'
                      : days === 1
                        ? 'Tomorrow'
                        : `${days}d`}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function AISummaryCard({ onNavigate }: { onNavigate: (route: string) => void }) {
  const quickActions = [
    {
      label: 'Analyze Spending',
      icon: BarChart3,
    },
    {
      label: 'Suggest Savings',
      icon: PiggyBank,
    },
    {
      label: 'Budget Tips',
      icon: Lightbulb,
    },
  ]

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="size-4 text-primary" />
          </div>
          AI Financial Assistant
        </CardTitle>
        <CardDescription>
          Get personalized insights and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <p className="mb-4 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          <Sparkles className="mb-1.5 inline size-3.5 text-amber-500" />{' '}
          Ask AI anything about your finances — spending analysis, savings
          strategies, or budget optimization.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="h-auto flex-col gap-1.5 py-3 text-xs"
              onClick={() => onNavigate(AppRoute.CHAT)}
            >
              <action.icon className="size-4 text-muted-foreground" />
              <span className="font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionsRow({
  onNavigate,
}: {
  onNavigate: (route: string) => void
}) {
  const actions = [
    {
      label: 'Add Transaction',
      icon: Plus,
      route: AppRoute.TRANSACTIONS,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Create Budget',
      icon: BarChart3,
      route: AppRoute.BUDGETS,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      label: 'Set Goal',
      icon: Target,
      route: AppRoute.GOALS,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          className="flex h-auto flex-col items-center gap-2.5 rounded-xl py-5 transition-all hover:shadow-md"
          onClick={() => onNavigate(action.route)}
        >
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-xl',
              action.bg,
            )}
          >
            <action.icon className={cn('size-5', action.color)} />
          </div>
          <span className="text-xs font-medium">{action.label}</span>
        </Button>
      ))}
    </div>
  )
}

// --- Main Dashboard Page ---

export function DashboardPage() {
  const { user, setRoute } = useRouterStore()

  // Data fetching
  const { data: dashboardRes, isLoading: isDashboardLoading } = useDashboardData()
  const { data: chartRes, isLoading: isChartLoading } = useMonthlyChart(6)
  const { data: categoryRes, isLoading: isCategoryLoading } = useCategoryDistribution()
  const { data: transactionsRes, isLoading: isTransactionsLoading } = useTransactions({
    limit: 5,
    sortBy: 'date',
    sortOrder: 'desc',
  })
  const { data: budgetsRes, isLoading: isBudgetsLoading } = useBudgets({ limit: 5 })
  const { data: subscriptionsRes, isLoading: isSubscriptionsLoading } =
    useSubscriptions({ limit: 5, sortBy: 'nextBillingDate', sortOrder: 'asc' })

  const dashboard = dashboardRes?.data
  const chartData = chartRes?.data ?? []
  const categoryData = categoryRes?.data ?? []
  const transactions = transactionsRes?.data ?? []
  const budgets = budgetsRes?.data ?? []
  const subscriptions = subscriptionsRes?.data ?? []

  const isLoading = isDashboardLoading && !dashboard

  const navigate = React.useCallback(
    (route: string) => setRoute(route),
    [setRoute],
  )

  // Compute savings rate
  const savingsRate =
    dashboard && dashboard.income > 0
      ? ((dashboard.income - dashboard.expenses) / dashboard.income) * 100
      : 0

  // Format chart data
  const areaChartData = React.useMemo(
    () =>
      chartData.map((d) => ({
        label: d.label,
        value: d.value,
        secondaryValue: d.secondaryValue ?? 0,
      })),
    [chartData],
  )

  const pieChartData = React.useMemo(
    () =>
      categoryData.map((d) => ({
        label: d.categoryName,
        value: d.amount,
        fill: d.categoryColor,
      })),
    [categoryData],
  )

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Dashboard"
          description="Your financial overview at a glance"
          breadcrumbs={[{ label: 'Dashboard' }]}
        />
      </motion.div>

      {/* Greeting */}
      <motion.div variants={itemVariants}>
        <GreetingSection name={user?.name} />
      </motion.div>

      {/* Financial Overview Stats */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          icon={Wallet}
          title="Current Balance"
          value={formatCurrency(dashboard?.balance ?? 0)}
          change={2.5}
          changeLabel="vs last month"
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={TrendingUp}
          title="Monthly Income"
          value={formatCurrency(dashboard?.income ?? 0)}
          change={5.2}
          changeLabel="vs last month"
          iconBgColor="bg-sky-500/10"
          iconColor="text-sky-600 dark:text-sky-400"
        />
        <StatCard
          icon={TrendingDown}
          title="Monthly Expenses"
          value={formatCurrency(dashboard?.expenses ?? 0)}
          change={-3.1}
          changeLabel="vs last month"
          iconBgColor="bg-rose-500/10"
          iconColor="text-rose-600 dark:text-rose-400"
        />
        <StatCard
          icon={PiggyBank}
          title="Savings Rate"
          value={formatPercentage(savingsRate)}
          change={savingsRate > 20 ? 1.8 : -1.2}
          changeLabel="vs last month"
          iconBgColor="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </motion.div>

      {/* Charts Section */}
      <motion.div
        variants={itemVariants}
        className="grid gap-6 lg:grid-cols-7"
      >
        <div className="lg:col-span-4">
          <IncomeVsExpensesChart data={areaChartData} isLoading={isChartLoading} />
        </div>
        <div className="lg:col-span-3">
          <CategoryPieChart data={pieChartData} isLoading={isCategoryLoading} />
        </div>
      </motion.div>

      {/* Financial Health Score + AI Summary */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {dashboard?.financialHealthScore ? (
          <FinancialHealthCard
            score={dashboard.financialHealthScore.score}
            grade={dashboard.financialHealthScore.grade}
            summary={dashboard.financialHealthScore.summary}
          />
        ) : (
          <CardSkeleton className="h-[220px]" />
        )}
        <AISummaryCard onNavigate={navigate} />
      </motion.div>

      {/* Recent Transactions + Budget Progress */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {isTransactionsLoading ? (
            <CardSkeleton className="h-[380px]" />
          ) : (
            <RecentTransactionsCard
              transactions={transactions}
              onViewAll={() => navigate(AppRoute.TRANSACTIONS)}
            />
          )}
        </div>
        <div className="lg:col-span-2">
          <BudgetProgressCard budgets={budgets} isLoading={isBudgetsLoading} />
        </div>
      </motion.div>

      {/* Upcoming Bills + Quick Actions */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UpcomingBillsCard
            subscriptions={subscriptions}
            isLoading={isSubscriptionsLoading}
          />
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Common tasks at your fingertips</CardDescription>
            </CardHeader>
            <CardContent>
              <QuickActionsRow onNavigate={navigate} />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}
