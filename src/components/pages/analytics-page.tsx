'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Target,
  Zap,
  ShoppingBag,
  Award,
  Flame,
  type LucideIcon,
} from 'lucide-react'

import { useRouterStore } from '@/store/router-store'
import { useDashboardData, useMonthlyChart, useCategoryDistribution } from '@/hooks/use-dashboard'
import { useTransactions } from '@/hooks/use-transactions'
import { useBudgets } from '@/hooks/use-budgets'
import { useGoals } from '@/hooks/use-goals'
import { StatCard } from '@/components/shared/stat-card'
import {
  ChartSkeleton,
  CardSkeleton,
  ListSkeleton,
} from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { formatCurrency, formatCompactNumber, formatPercentage } from '@/lib/format'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import type { AppRoute } from '@/types'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// --- Animation Variants ---

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const

// --- Constants ---

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#ef4444',
  '#f97316',
  '#84cc16',
  '#14b8a6',
  '#8b5cf6',
]

const CATEGORY_COLORS: Record<string, string> = {}
DEFAULT_CATEGORIES.forEach((cat, i) => {
  CATEGORY_COLORS[cat.name] = cat.color
})

const PERIODS = [
  { value: '1', label: 'This Month' },
  { value: '3', label: 'Last 3 Months' },
  { value: '6', label: 'Last 6 Months' },
  { value: '12', label: 'This Year' },
] as const

// --- Helpers ---

function getBarColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getChangeIcon(change: number) {
  if (change > 0) return <ArrowUpRight className="size-4 text-emerald-500" />
  if (change < 0) return <ArrowDownRight className="size-4 text-red-500" />
  return <span className="text-muted-foreground text-xs">—</span>
}

function currencyTickFormatter(v: number) {
  if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(1)}M`
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`
  return `$${v}`
}

// --- Custom Tooltip ---

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
      <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// --- Sub-Components ---

function IncomeVsExpensesTrend({
  data,
  isLoading,
}: {
  data: Array<{ label: string; value: number; secondaryValue?: number }>
  isLoading: boolean
}) {
  if (isLoading) return <ChartSkeleton className="col-span-full" />
  if (!data.length) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-base">Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[340px] items-center justify-center text-sm text-muted-foreground">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base">Income vs Expenses</CardTitle>
        <CardDescription>Trend over selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="analyticsIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="analyticsExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.2} />
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
              tickFormatter={currencyTickFormatter}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="Income"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2.5}
              fill="url(#analyticsIncomeGrad)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: 'hsl(var(--chart-1))' }}
            />
            <Area
              type="monotone"
              dataKey="secondaryValue"
              name="Expenses"
              stroke="hsl(var(--chart-5))"
              strokeWidth={2.5}
              fill="url(#analyticsExpenseGrad)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: 'hsl(var(--chart-5))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function CategoryDonutChart({
  data,
  isLoading,
}: {
  data: Array<{ label: string; value: number; fill: string }>
  isLoading: boolean
}) {
  const [activeSegment, setActiveSegment] = React.useState<number | null>(null)

  if (isLoading) return <ChartSkeleton />
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No spending categories
          </div>
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expense Distribution</CardTitle>
        <CardDescription>By category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:gap-6">
          <ResponsiveContainer width="100%" height={260} className="max-w-[260px]">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="label"
                onMouseEnter={(_, i) => setActiveSegment(i)}
                onMouseLeave={() => setActiveSegment(null)}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.fill}
                    stroke={activeSegment === i ? entry.fill : 'transparent'}
                    strokeWidth={2}
                    style={{
                      transform: activeSegment === i ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: 'center',
                      transition: 'transform 0.2s ease-out',
                      opacity: activeSegment !== null && activeSegment !== i ? 0.5 : 1,
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px] w-full lg:w-auto">
            {data.map((item, i) => (
              <div
                key={item.label}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
                  activeSegment === i && 'bg-muted'
                )}
                onMouseEnter={() => setActiveSegment(i)}
                onMouseLeave={() => setActiveSegment(null)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="truncate text-muted-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-medium tabular-nums">{formatCurrency(item.value)}</span>
                  <span className="text-xs text-muted-foreground">
                    {((item.value / total) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MonthlyTrendChart({
  data,
  isLoading,
}: {
  data: Array<{ label: string; value: number; secondaryValue?: number }>
  isLoading: boolean
}) {
  if (isLoading) return <ChartSkeleton />
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No monthly data
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    net: (d.value ?? 0) - (d.secondaryValue ?? 0),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Monthly Comparison</CardTitle>
        <CardDescription>Income, expenses & net savings</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              tickFormatter={currencyTickFormatter}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="value"
              name="Income"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="secondaryValue"
              name="Expenses"
              fill="hsl(var(--chart-5))"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Line
              type="monotone"
              dataKey="net"
              name="Net Savings"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0, fill: 'hsl(var(--chart-3))' }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function CashFlowChart({
  data,
  isLoading,
}: {
  data: Array<{ label: string; value: number; secondaryValue?: number }>
  isLoading: boolean
}) {
  if (isLoading) return <ChartSkeleton />
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No cash flow data
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    netFlow: (d.value ?? 0) - (d.secondaryValue ?? 0),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cash Flow Analysis</CardTitle>
        <CardDescription>Money in vs money out</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cashInGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="cashOutGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0.05} />
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
              tickFormatter={currencyTickFormatter}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="Money In"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              fill="url(#cashInGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="secondaryValue"
              name="Money Out"
              stroke="hsl(var(--chart-5))"
              strokeWidth={2}
              fill="url(#cashOutGrad)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="netFlow"
              name="Net Flow"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function SavingsTrendChart({
  data,
  goalAmount,
  isLoading,
}: {
  data: Array<{ label: string; value: number }>
  isLoading: boolean
  goalAmount?: number
}) {
  if (isLoading) return <ChartSkeleton />
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Savings Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No savings data
          </div>
        </CardContent>
      </Card>
    )
  }

  // cumulative savings
  const cumData = data.reduce<Array<{ label: string; value: number; cumulative: number }>>((acc, d, i) => {
    const cumulative = (acc.length > 0 ? acc[acc.length - 1].cumulative : 0) + d.value
    acc.push({ ...d, cumulative })
    return acc
  }, [])
  const maxY = Math.max(...cumData.map((d) => Math.abs(d.cumulative)), goalAmount ?? 0) * 1.1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Savings Trend</CardTitle>
        <CardDescription>Cumulative savings over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={cumData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
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
              tickFormatter={currencyTickFormatter}
              domain={['auto', maxY || 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              name="Cumulative Savings"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2.5}
              fill="url(#savingsGrad)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: 'hsl(var(--chart-1))' }}
            />
            {goalAmount && goalAmount > 0 && (
              <ReferenceLine
                y={goalAmount}
                stroke="hsl(var(--chart-4))"
                strokeDasharray="6 3"
                label={{
                  value: 'Target',
                  position: 'insideTopRight',
                  fill: 'hsl(var(--chart-4))',
                  fontSize: 11,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function BudgetUtilizationChart({
  budgets,
  isLoading,
}: {
  budgets: Array<{
    id: string
    name: string
    amount: number
    spent: number
    categoryBudgets?: Array<{ category?: { name: string; color: string }; amount: number; spent: number }>
  }>
  isLoading: boolean
}) {
  if (isLoading) return <ChartSkeleton />
  if (!budgets || !budgets.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No active budgets
          </div>
        </CardContent>
      </Card>
    )
  }

  // flatten category budgets
  const items: Array<{ name: string; spent: number; budget: number; percent: number }> = []
  for (const b of budgets) {
    if (b.categoryBudgets && b.categoryBudgets.length > 0) {
      for (const cb of b.categoryBudgets) {
        items.push({
          name: cb.category?.name ?? 'Unknown',
          spent: cb.spent,
          budget: cb.amount,
          percent: cb.amount > 0 ? Math.min((cb.spent / cb.amount) * 100, 100) : 0,
        })
      }
    } else {
      items.push({
        name: b.name,
        spent: b.spent,
        budget: b.amount,
        percent: b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0,
      })
    }
  }

  items.sort((a, b) => b.percent - a.percent)
  const topItems = items.slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Budget Utilization</CardTitle>
        <CardDescription>Spending against budget limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topItems.map((item) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate text-muted-foreground">{item.name}</span>
              <span className="shrink-0 tabular-nums font-medium">
                {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
              </span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(item.percent, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className={cn(
                  'h-full rounded-full transition-colors',
                  item.percent >= 90
                    ? 'bg-red-500'
                    : item.percent >= 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                )}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.percent.toFixed(1)}% used</span>
              <span>{formatCurrency(Math.max(item.budget - item.spent, 0))} remaining</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

type InsightCardProps = {
  icon: LucideIcon
  label: string
  value: string
  subtext?: string
  iconBg: string
  iconColor: string
  badge?: React.ReactNode
}

function InsightCardData({ icon: Icon, label, value, subtext, iconBg, iconColor, badge }: InsightCardProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="text-lg font-bold">{value}</p>
              {subtext && (
                <p className="text-xs text-muted-foreground">{subtext}</p>
              )}
            </div>
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                iconBg
              )}
            >
              <Icon className={cn('size-4', iconColor)} />
            </div>
          </div>
          {badge && <div className="mt-3">{badge}</div>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function SpendingInsights({
  categoryData,
  monthlyData,
  totalExpenses,
  isLoading,
}: {
  categoryData: Array<{ categoryName: string; amount: number; percentage: number; categoryColor?: string }>
  monthlyData: Array<{ label: string; value: number; secondaryValue?: number }>
  totalExpenses: number
  isLoading: boolean
}) {
  const insights = useMemo(() => {
    // Top spending category
    const topCategory =
      categoryData.length > 0
        ? categoryData.reduce((prev, curr) => (prev.amount > curr.amount ? prev : curr))
        : null

    // Biggest expense - highest single category amount
    const biggestExpense = topCategory

    // Most improved = biggest decrease (if we have at least 2 months)
    const mostImproved =
      monthlyData.length >= 2
        ? (() => {
            const last = monthlyData[monthlyData.length - 1]?.secondaryValue ?? 0
            const prev = monthlyData[monthlyData.length - 2]?.secondaryValue ?? 0
            const change = prev > 0 ? ((last - prev) / prev) * 100 : 0
            if (change < 0) {
              const bestCat = categoryData.reduce((prev, curr) =>
                prev.amount < curr.amount ? prev : curr
              )
              return { category: bestCat.categoryName, change }
            }
            return null
          })()
        : null

    // Spending vs last month
    const spendingChange =
      monthlyData.length >= 2
        ? (() => {
            const last = monthlyData[monthlyData.length - 1]?.secondaryValue ?? 0
            const prev = monthlyData[monthlyData.length - 2]?.secondaryValue ?? 0
            if (prev > 0) return ((last - prev) / prev) * 100
            return last > 0 ? 100 : 0
          })()
        : 0

    return { topCategory, biggestExpense, mostImproved, spendingChange }
  }, [categoryData, monthlyData])

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <motion.div className="grid gap-4 sm:grid-cols-2" variants={containerVariants} initial="hidden" animate="visible">
      <InsightCardData
        icon={ShoppingBag}
        label="Top Spending Category"
        value={insights.topCategory?.categoryName ?? 'N/A'}
        subtext={insights.topCategory ? `${formatCurrency(insights.topCategory.amount)} (${insights.topCategory.percentage.toFixed(1)}%)` : 'No spending data'}
        iconBg="bg-orange-500/10"
        iconColor="text-orange-500"
      />
      <InsightCardData
        icon={Flame}
        label="Biggest Expense"
        value={insights.biggestExpense ? formatCurrency(insights.biggestExpense.amount) : 'N/A'}
        subtext={insights.biggestExpense?.categoryName}
        iconBg="bg-red-500/10"
        iconColor="text-red-500"
      />
      <InsightCardData
        icon={Award}
        label="Most Improved"
        value={insights.mostImproved ? insights.mostImproved.category : 'N/A'}
        subtext={insights.mostImproved ? `${insights.mostImproved.change.toFixed(1)}% reduction` : 'Need more data'}
        iconBg="bg-emerald-500/10"
        iconColor="text-emerald-500"
        badge={
          insights.mostImproved ? (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="mr-1 size-3" />
              Improved
            </Badge>
          ) : undefined
        }
      />
      <InsightCardData
        icon={BarChart3}
        label="Spending vs Last Month"
        value={
          insights.spendingChange !== 0
            ? `${insights.spendingChange > 0 ? '+' : ''}${insights.spendingChange.toFixed(1)}%`
            : 'No change'
        }
        subtext={totalExpenses > 0 ? `Total: ${formatCurrency(totalExpenses)}` : 'No data'}
        iconBg={
          insights.spendingChange > 0
            ? 'bg-red-500/10'
            : insights.spendingChange < 0
              ? 'bg-emerald-500/10'
              : 'bg-muted'
        }
        iconColor={
          insights.spendingChange > 0
            ? 'text-red-500'
            : insights.spendingChange < 0
              ? 'text-emerald-500'
              : 'text-muted-foreground'
        }
        badge={
          insights.spendingChange !== 0 ? (
            <Badge
              variant="secondary"
              className={
                insights.spendingChange > 0
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }
            >
              {insights.spendingChange > 0 ? (
                <TrendingUp className="mr-1 size-3" />
              ) : (
                <TrendingDown className="mr-1 size-3" />
              )}
              {insights.spendingChange > 0 ? 'Increased' : 'Decreased'}
            </Badge>
          ) : undefined
        }
      />
    </motion.div>
  )
}

// --- Main Component ---

export function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = React.useState('6')
  const months = Number(selectedPeriod)

  const { data: dashboardData, isLoading: dashLoading } = useDashboardData()
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyChart(months)
  const { data: categoryData, isLoading: catLoading } = useCategoryDistribution()
  const { data: transactionsData } = useTransactions({ type: 'expense', limit: 200 })
  const { data: budgetsData } = useBudgets({ limit: 20 })
  const { data: goalsData } = useGoals()

  const isLoading = dashLoading || monthlyLoading || catLoading

  // Computed values
  const totalIncome = dashboardData?.data?.income ?? 0
  const totalExpenses = dashboardData?.data?.expenses ?? 0
  const netSavings = totalIncome - totalExpenses

  const daysInPeriod = months * 30
  const avgDailySpend = daysInPeriod > 0 ? totalExpenses / daysInPeriod : 0

  // savings change based on monthly data
  const savingsChange = useMemo(() => {
    const md = monthlyData?.data
    if (!md || md.length < 2) return undefined
    const last = md[md.length - 1]
    const prev = md[md.length - 2]
    const lastNet = (last.value ?? 0) - (last.secondaryValue ?? 0)
    const prevNet = (prev.value ?? 0) - (prev.secondaryValue ?? 0)
    if (prevNet === 0) return undefined
    return ((lastNet - prevNet) / Math.abs(prevNet)) * 100
  }, [monthlyData])

  // expense change vs last month
  const expenseChange = useMemo(() => {
    const md = monthlyData?.data
    if (!md || md.length < 2) return undefined
    const last = md[md.length - 1].secondaryValue ?? 0
    const prev = md[md.length - 2].secondaryValue ?? 0
    if (prev === 0) return undefined
    return ((last - prev) / prev) * 100
  }, [monthlyData])

  // income change
  const incomeChange = useMemo(() => {
    const md = monthlyData?.data
    if (!md || md.length < 2) return undefined
    const last = md[md.length - 1].value ?? 0
    const prev = md[md.length - 2].value ?? 0
    if (prev === 0) return undefined
    return ((last - prev) / prev) * 100
  }, [monthlyData])

  // Category distribution chart data
  const pieData = useMemo(() => {
    if (!categoryData?.data) return []
    return categoryData.data
      .filter((c) => c.amount > 0)
      .map((c, i) => ({
        label: c.categoryName,
        value: c.amount,
        fill: c.categoryColor || CHART_COLORS[i % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
  }, [categoryData])

  // Monthly savings data
  const monthlySavingsData = useMemo(() => {
    const md = monthlyData?.data ?? []
    return md.map((d) => ({
      label: d.label,
      value: (d.value ?? 0) - (d.secondaryValue ?? 0),
    }))
  }, [monthlyData])

  // Goals target amount for savings target line
  const goalsTargetAmount = useMemo(() => {
    const goals = goalsData?.data
    if (!goals) return undefined
    const savingsGoals = goals.filter(
      (g) => g.name.toLowerCase().includes('sav') || g.name.toLowerCase().includes('fund')
    )
    if (savingsGoals.length > 0) return savingsGoals[0].targetAmount
    return undefined
  }, [goalsData])

  // All budgets including category budgets
  const allBudgets = useMemo(() => {
    return budgetsData?.data ?? []
  }, [budgetsData])

  // Check for empty state
  const hasNoData =
    !isLoading &&
    !monthlyData?.data?.length &&
    !categoryData?.data?.length &&
    !transactionsData?.data?.data?.length

  if (hasNoData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Deep insights into your finances"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Analytics' },
          ]}
        />
        <EmptyState
          icon={BarChart3}
          title="No analytics data yet"
          description="Start tracking your income and expenses to see analytics and insights here."
          actionLabel="Add Transaction"
          onAction={() => useRouterStore.getState().setRoute('/transactions')}
        />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Analytics"
          description="Deep insights into your finances"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Analytics' },
          ]}
          actions={
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger size="sm" className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </motion.div>

      {/* Overview Stats Row */}
      <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" variants={itemVariants}>
        <StatCard
          icon={TrendingUp}
          title="Total Income"
          value={formatCurrency(totalIncome)}
          change={incomeChange}
          changeLabel="vs last month"
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-500"
        />
        <StatCard
          icon={TrendingDown}
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          change={expenseChange}
          changeLabel="vs last month"
          iconBgColor="bg-red-500/10"
          iconColor="text-red-500"
        />
        <StatCard
          icon={PiggyBank}
          title="Net Savings"
          value={formatCurrency(netSavings)}
          change={savingsChange}
          changeLabel="vs last month"
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          icon={CalendarDays}
          title="Avg Daily Spend"
          value={formatCurrency(avgDailySpend)}
          iconBgColor="bg-amber-500/10"
          iconColor="text-amber-500"
        />
      </motion.div>

      {/* Income vs Expenses Trend (Full Width) */}
      <motion.div variants={itemVariants}>
        <IncomeVsExpensesTrend
          data={monthlyData?.data ?? []}
          isLoading={monthlyLoading}
        />
      </motion.div>

      {/* Category Distribution + Monthly Trend */}
      <motion.div className="grid gap-4 lg:grid-cols-2" variants={itemVariants}>
        <CategoryDonutChart data={pieData} isLoading={catLoading} />
        <MonthlyTrendChart
          data={monthlyData?.data ?? []}
          isLoading={monthlyLoading}
        />
      </motion.div>

      {/* Cash Flow + Savings Trend */}
      <motion.div className="grid gap-4 lg:grid-cols-2" variants={itemVariants}>
        <CashFlowChart
          data={monthlyData?.data ?? []}
          isLoading={monthlyLoading}
        />
        <SavingsTrendChart
          data={monthlySavingsData}
          goalAmount={goalsTargetAmount}
          isLoading={monthlyLoading}
        />
      </motion.div>

      {/* Budget Utilization */}
      <motion.div className="grid gap-4 lg:grid-cols-2" variants={itemVariants}>
        <BudgetUtilizationChart budgets={allBudgets} isLoading={!budgetsData && !budgetsData?.data} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by Category</CardTitle>
            <CardDescription>Ranked by amount spent</CardDescription>
          </CardHeader>
          <CardContent>
            {catLoading ? (
              <ListSkeleton count={6} />
            ) : !categoryData?.data?.length ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No category data
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[320px] space-y-3">
                {categoryData.data
                  .filter((c) => c.amount > 0)
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 10)
                  .map((cat, i) => (
                    <motion.div
                      key={cat.categoryId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div
                        className="flex size-9 items-center justify-center rounded-lg text-sm"
                        style={{ backgroundColor: `${cat.categoryColor}15`, color: cat.categoryColor }}
                      >
                        {cat.categoryIcon || '#'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cat.categoryName}</p>
                        <p className="text-xs text-muted-foreground">
                          {cat.transactionCount} transactions
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium tabular-nums">
                          {formatCurrency(cat.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cat.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Spending Insights */}
      <motion.div variants={itemVariants}>
        <div className="mb-3">
          <h2 className="text-lg font-semibold tracking-tight">Spending Insights</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered observations about your spending patterns
          </p>
        </div>
        <SpendingInsights
          categoryData={categoryData?.data ?? []}
          monthlyData={monthlyData?.data ?? []}
          totalExpenses={totalExpenses}
          isLoading={isLoading}
        />
      </motion.div>
    </motion.div>
  )
}
