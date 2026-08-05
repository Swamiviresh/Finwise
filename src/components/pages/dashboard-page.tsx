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
} from 'recharts'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  Target,
  Bot,
  BarChart3,
  Lightbulb,
  Receipt,
  CalendarDays,
  Activity,
  Sparkles,
  ChevronRight,
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

const belowFoldVariants = {
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

function getBudgetColor(percent: number) {
  if (percent > 90) return { bar: '#f43f5e', text: 'text-rose-600 dark:text-rose-400' }
  if (percent >= 70) return { bar: '#f59e0b', text: 'text-amber-600 dark:text-amber-400' }
  return { bar: '#10b981', text: 'text-emerald-600 dark:text-emerald-400' }
}

function getBudgetGradient(percent: number) {
  if (percent > 90) return 'from-rose-400 to-rose-500'
  if (percent >= 70) return 'from-amber-400 to-amber-500'
  return 'from-emerald-400 to-emerald-500'
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <h2 className="text-2xl font-bold tracking-tight">
        {getGreeting()}, {displayName.split(' ')[0]}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{today}</p>
    </motion.div>
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
      <div className="premium-card rounded-2xl border bg-card p-6">
        <p className="text-sm font-semibold text-foreground">Income vs Expenses</p>
        <p className="mt-1 text-xs text-muted-foreground">Last 6 months trend</p>
        <div className="mt-6 flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          No data available yet
        </div>
      </div>
    )
  }

  return (
    <div className="premium-card rounded-2xl border bg-card p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">Income vs Expenses</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Last 6 months trend</p>
      </div>
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
    </div>
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
      <div className="premium-card rounded-2xl border bg-card p-6">
        <p className="text-sm font-semibold text-foreground">Category Distribution</p>
        <p className="mt-1 text-xs text-muted-foreground">Where your money goes</p>
        <div className="mt-6 flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          No spending data yet
        </div>
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="premium-card rounded-2xl border bg-card p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">Category Distribution</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Where your money goes</p>
      </div>
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
        <div className="flex max-h-[240px] w-full flex-col gap-2.5 overflow-y-auto lg:max-w-[180px]">
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
    </div>
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
  const [dashOffset, setDashOffset] = React.useState(circumference)

  React.useEffect(() => {
    const targetOffset = circumference - (score / 100) * circumference
    const timer = setTimeout(() => setDashOffset(targetOffset), 100)
    return () => clearTimeout(timer)
  }, [score, circumference])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="premium-card rounded-2xl border bg-card p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <Activity className="size-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Financial Health Score</p>
      </div>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
        {/* Circular progress */}
        <div className="relative shrink-0">
          <svg width="130" height="130" className="-rotate-90">
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke={healthInfo.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold leading-none" style={{ color: healthInfo.color }}>
              {score}
            </span>
            <span className="mt-0.5 text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <span
              className="inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-bold text-white"
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
    </motion.div>
  )
}

function RecentTransactionsCard({
  transactions,
  onViewAll,
  currency,
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
  currency: string
}) {
  if (transactions.length === 0) {
    return (
      <div className="premium-card rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Recent Transactions</p>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Receipt className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Start by adding your first transaction
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-card rounded-2xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Recent Transactions</p>
        <button
          onClick={onViewAll}
          className="group inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <motion.span
            className="inline-block"
            initial={{ x: 0 }}
            whileHover={{ x: 3 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </motion.span>
        </button>
      </div>

      <div className="divide-y divide-border/50">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 pb-2.5 sm:grid-cols-[1fr_auto_auto_auto]">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Description
          </span>
          <span className="hidden text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:block">
            Category
          </span>
          <span className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Amount
          </span>
          <span className="hidden text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:block">
            Date
          </span>
        </div>

        {/* Transaction rows */}
        {transactions.slice(0, 5).map((tx) => (
          <div
            key={tx.id}
            className="grid cursor-pointer grid-cols-[1fr_auto_auto] items-center gap-4 py-3 transition-colors hover:bg-muted/30 sm:grid-cols-[1fr_auto_auto_auto]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {tx.category?.icon && (
                <span className="shrink-0 text-base leading-none">{tx.category.icon}</span>
              )}
              <span className="truncate text-sm font-medium">{tx.description}</span>
            </div>
            <div className="hidden sm:block">
              {tx.category && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                  )}
                  style={{
                    backgroundColor: `${tx.category.color}12`,
                    color: tx.category.color,
                  }}
                >
                  {tx.category.name}
                </span>
              )}
            </div>
            <div className="text-right">
              <span
                className={cn(
                  'font-mono text-sm font-semibold tabular-nums',
                  tx.type === 'income' && 'text-emerald-600 dark:text-emerald-400',
                  tx.type === 'expense' && 'text-rose-600 dark:text-rose-400',
                )}
              >
                {tx.type === 'income' ? '+' : '-'}
                {formatCurrency(Math.abs(tx.amount), currency)}
              </span>
            </div>
            <div className="hidden text-right text-xs text-muted-foreground md:block">
              {formatDate(tx.date)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BudgetProgressCard({
  budgets,
  isLoading,
  currency,
}: {
  budgets: Array<{
    id: string
    name: string
    amount: number
    spent: number
    period: string
  }>
  isLoading: boolean
  currency: string
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <p className="text-sm font-semibold text-foreground">Budget Progress</p>
        <div className="mt-4">
          <ListSkeleton count={4} />
        </div>
      </div>
    )
  }

  const activeBudgets = budgets.filter((b) => b.amount > 0)

  if (activeBudgets.length === 0) {
    return (
      <div className="premium-card rounded-2xl border bg-card p-6">
        <p className="text-sm font-semibold text-foreground">Budget Progress</p>
        <p className="mt-0.5 text-xs text-muted-foreground">This month</p>
        <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
          <BarChart3 className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No active budgets</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Create a budget to start tracking your spending
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-card rounded-2xl border bg-card p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">Budget Progress</p>
        <p className="mt-0.5 text-xs text-muted-foreground">This month</p>
      </div>
      <div className="space-y-3">
        {activeBudgets.slice(0, 5).map((budget, i) => {
          const percent = Math.min(
            Math.round((budget.spent / budget.amount) * 100),
            100,
          )
          const remaining = Math.max(budget.amount - budget.spent, 0)
          const color = getBudgetColor(percent)
          const gradient = getBudgetGradient(percent)

          return (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: i * 0.08,
              }}
              className="rounded-xl bg-muted/30 p-3.5 transition-colors hover:bg-muted/50"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{budget.name}</span>
                <span className={cn('text-xs font-semibold tabular-nums', color.text)}>
                  {percent}%
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={cn('absolute inset-y-0 left-0 rounded-full bg-gradient-to-r', gradient)}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{
                    duration: 0.8,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.3 + i * 0.08,
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono tabular-nums">
                  {formatCurrency(budget.spent, currency)}{' '}
                  <span className="text-muted-foreground/60">of</span>{' '}
                  {formatCurrency(budget.amount, currency)}
                </span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(remaining, currency)} left
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function UpcomingBillsCard({
  subscriptions,
  isLoading,
  currency,
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
  currency: string
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <p className="text-sm font-semibold text-foreground">Upcoming Bills</p>
        <div className="mt-4">
          <ListSkeleton count={4} />
        </div>
      </div>
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
      <div className="premium-card rounded-2xl border bg-card p-6">
        <p className="text-sm font-semibold text-foreground">Upcoming Bills</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Next 30 days</p>
        <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
          <CalendarDays className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No upcoming bills</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Your subscription tracking is clear
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-card rounded-2xl border bg-card p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">Upcoming Bills</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Next 30 days</p>
      </div>
      <div className="space-y-2">
        {upcoming.map((sub, i) => {
          const days = daysUntil(sub.nextBillingDate)
          const isSoon = days <= 3

          return (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: i * 0.06,
              }}
              className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/40"
            >
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-base"
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
                <p className="font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(sub.amount, currency)}
                </p>
                <span
                  className={cn(
                    'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    isSoon
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {days === 0
                    ? 'Today'
                    : days === 1
                      ? 'Tomorrow'
                      : `${days}d`}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function AISummaryCard({ onNavigate }: { onNavigate: (route: string) => void }) {
  const quickActions = [
    { label: 'Analyze Spending', icon: BarChart3 },
    { label: 'Suggest Savings', icon: PiggyBank },
    { label: 'Budget Tips', icon: Lightbulb },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="premium-card relative overflow-hidden rounded-2xl border bg-card p-6"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="relative">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="relative flex size-8 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="size-4 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary/60 animate-pulse-soft" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Financial Assistant</p>
            <p className="text-xs text-muted-foreground">Get personalized insights</p>
          </div>
        </div>
        <p className="mb-5 rounded-xl border bg-muted/30 p-3.5 text-sm text-muted-foreground">
          <Sparkles className="mb-1 inline size-3.5 text-amber-500" />{' '}
          Ask AI anything about your finances — spending analysis, savings
          strategies, or budget optimization.
        </p>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              onClick={() => onNavigate(AppRoute.CHAT)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-2 text-xs font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <action.icon className="size-3.5 text-muted-foreground" />
              {action.label}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
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
      {actions.map((action, i) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: i * 0.08,
          }}
          whileHover={{ y: -2, boxShadow: '0 8px 24px oklch(0 0 0 / 0.1)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onNavigate(action.route)}
          className={cn(
            'flex h-auto flex-col items-center gap-3 rounded-2xl border bg-card p-5 transition-colors hover:bg-muted/30',
          )}
        >
          <div
            className={cn(
              'flex size-11 items-center justify-center rounded-2xl',
              action.bg,
            )}
          >
            <action.icon className={cn('size-6', action.color)} />
          </div>
          <span className="text-sm font-medium">{action.label}</span>
        </motion.button>
      ))}
    </div>
  )
}

// --- Main Dashboard Page ---

export function DashboardPage() {
  const { user, setRoute } = useRouterStore()
  const currency = user?.currency || 'USD'

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
      <div className="mx-auto max-w-7xl space-y-6 p-6">
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
      className="mx-auto max-w-7xl space-y-6 p-6"
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          title="Current Balance"
          value={formatCurrency(dashboard?.balance ?? 0, currency)}
          change={2.5}
          changeLabel="vs last month"
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          index={0}
        />
        <StatCard
          icon={TrendingUp}
          title="Monthly Income"
          value={formatCurrency(dashboard?.income ?? 0, currency)}
          change={5.2}
          changeLabel="vs last month"
          iconBgColor="bg-sky-500/10"
          iconColor="text-sky-600 dark:text-sky-400"
          index={1}
        />
        <StatCard
          icon={TrendingDown}
          title="Monthly Expenses"
          value={formatCurrency(dashboard?.expenses ?? 0, currency)}
          change={-3.1}
          changeLabel="vs last month"
          iconBgColor="bg-rose-500/10"
          iconColor="text-rose-600 dark:text-rose-400"
          index={2}
        />
        <StatCard
          icon={PiggyBank}
          title="Savings Rate"
          value={formatPercentage(savingsRate)}
          change={savingsRate > 20 ? 1.8 : -1.2}
          changeLabel="vs last month"
          iconBgColor="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
          index={3}
        />
      </div>

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
      <motion.div
        variants={belowFoldVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="grid gap-6 lg:grid-cols-2"
      >
        {dashboard?.financialHealthScore ? (
          <FinancialHealthCard
            score={dashboard.financialHealthScore.score}
            grade={dashboard.financialHealthScore.grade}
            summary={dashboard.financialHealthScore.summary}
          />
        ) : (
          <CardSkeleton className="h-[240px] rounded-2xl" />
        )}
        <AISummaryCard onNavigate={navigate} />
      </motion.div>

      {/* Recent Transactions + Budget Progress */}
      <motion.div
        variants={belowFoldVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="grid gap-6 lg:grid-cols-5"
      >
        <div className="lg:col-span-3">
          {isTransactionsLoading ? (
            <CardSkeleton className="h-[420px] rounded-2xl" />
          ) : (
            <RecentTransactionsCard
              transactions={transactions}
              onViewAll={() => navigate(AppRoute.TRANSACTIONS)}
              currency={currency}
            />
          )}
        </div>
        <div className="lg:col-span-2">
          <BudgetProgressCard budgets={budgets} isLoading={isBudgetsLoading} currency={currency} />
        </div>
      </motion.div>

      {/* Upcoming Bills + Quick Actions */}
      <motion.div
        variants={belowFoldVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="grid gap-6 lg:grid-cols-5"
      >
        <div className="lg:col-span-3">
          <UpcomingBillsCard
            subscriptions={subscriptions}
            isLoading={isSubscriptionsLoading}
            currency={currency}
          />
        </div>
        <div className="lg:col-span-2">
          <div className="premium-card rounded-2xl border bg-card p-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground">Quick Actions</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Common tasks at your fingertips</p>
            </div>
            <QuickActionsRow onNavigate={navigate} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
