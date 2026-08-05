'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useCallback, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Printer,
  FileJson,
  FileSpreadsheet,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  DollarSign,
  PiggyBank,
  Receipt,
  Plus,
  Eye,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns'

import { useRouterStore } from '@/store/router-store'
import { useDashboardData, useMonthlyChart, useCategoryDistribution } from '@/hooks/use-dashboard'
import { useTransactions } from '@/hooks/use-transactions'
import { apiRequest } from '@/hooks/use-auth'
import { StatCard } from '@/components/shared/stat-card'
import {
  ChartSkeleton,
  CardSkeleton,
  ListSkeleton,
} from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { formatCurrency, formatDate, formatDateTime, formatPercentage } from '@/lib/format'
import type {
  ApiResponse,
  Report,
  TransactionWithCategory,
  CategoryDistribution,
  ChartDataPoint,
} from '@/types'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  TableCaption,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// --- Animation Variants ---

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// --- Helpers ---

function currencyTickFormatter(v: number) {
  if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(1)}M`
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`
  return `$${v}`
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/40 bg-background/95 backdrop-blur-sm px-3.5 py-2.5 shadow-lg">
      <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(entry.value, currency)}
          </span>
        </div>
      ))}
    </div>
  )
}

type ReportPeriod = {
  type: 'monthly' | 'yearly'
  month?: number
  year: number
}

function useReportData(period: ReportPeriod) {
  const { data: allTransactions, isLoading: txLoading } = useTransactions({ limit: 500 })
  const { data: monthlyChart, isLoading: chartLoading } = useMonthlyChart(12)
  const { data: catDist, isLoading: catLoading } = useCategoryDistribution()

  const filteredTransactions = useMemo(() => {
    if (!allTransactions?.data?.data) return []
    const txs = allTransactions.data.data as TransactionWithCategory[]
    const year = period.year
    const month = period.month

    if (!month) {
      // yearly - all transactions in that year
      return txs.filter((t) => {
        const d = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date)
        return d.getFullYear() === year
      })
    }

    // monthly
    const start = startOfMonth(new Date(year, month - 1))
    const end = endOfMonth(new Date(year, month - 1))
    return txs.filter((t) => {
      const d = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date)
      return isWithinInterval(d, { start, end })
    })
  }, [allTransactions, period])

  const incomeTransactions = filteredTransactions.filter((t) => t.type === 'income')
  const expenseTransactions = filteredTransactions.filter((t) => t.type === 'expense')

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
  const netSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0

  // Income by source
  const incomeBySource = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string }> = {}
    incomeTransactions.forEach((t) => {
      const name = t.category?.name ?? 'Other'
      if (!map[name]) {
        map[name] = { name, amount: 0, color: t.category?.color ?? '#10b981' }
      }
      map[name].amount += t.amount
    })
    return Object.values(map).sort((a, b) => b.amount - a.amount)
  }, [incomeTransactions])

  // Expense by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string; count: number; percentage: number }> = {}
    expenseTransactions.forEach((t) => {
      const name = t.category?.name ?? 'Other'
      if (!map[name]) {
        map[name] = { name, amount: 0, color: t.category?.color ?? '#ef4444', count: 0, percentage: 0 }
      }
      map[name].amount += t.amount
      map[name].count += 1
    })
    const items = Object.values(map).sort((a, b) => b.amount - a.amount)
    items.forEach((item) => {
      item.percentage = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0
    })
    return items
  }, [expenseTransactions, totalExpenses])

  // Previous period comparison
  const { prevIncome, prevExpenses } = useMemo(() => {
    if (!allTransactions?.data?.data) return { prevIncome: 0, prevExpenses: 0 }
    const txs = allTransactions.data.data as TransactionWithCategory[]
    let prevStart: Date
    let prevEnd: Date

    if (period.type === 'yearly') {
      prevStart = new Date(period.year - 1, 0, 1)
      prevEnd = new Date(period.year - 1, 11, 31)
    } else {
      const m = (period.month ?? 1) - 1
      prevStart = startOfMonth(subMonths(new Date(period.year, m), 1))
      prevEnd = endOfMonth(subMonths(new Date(period.year, m), 1))
    }

    const prev = txs.filter((t) => {
      const d = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date)
      return isWithinInterval(d, { start: prevStart, end: prevEnd })
    })

    return {
      prevIncome: prev.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      prevExpenses: prev.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  }, [allTransactions, period])

  const incomeChange = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0
  const expenseChange = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0
  const savingsChange = prevIncome > 0
    ? (((totalIncome - totalExpenses) - (prevIncome - prevExpenses)) / prevIncome) * 100
    : 0

  // Top 3 spending categories
  const top3Categories = expenseByCategory.slice(0, 3)

  return {
    isLoading: txLoading || chartLoading || catLoading,
    filteredTransactions,
    incomeTransactions,
    expenseTransactions,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    incomeBySource,
    expenseByCategory,
    top3Categories,
    incomeChange,
    expenseChange,
    savingsChange,
    prevIncome,
    prevExpenses,
    monthlyChart: monthlyChart?.data ?? [],
  }
}

// --- Sub-Components ---

function ReportSummary({
  totalIncome,
  totalExpenses,
  netSavings,
  savingsRate,
  incomeChange,
  expenseChange,
  savingsChange,
  top3Categories,
  isLoading,
}: {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  savingsRate: number
  incomeChange: number
  expenseChange: number
  savingsChange: number
  top3Categories: Array<{ name: string; amount: number; color: string }>
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" variants={itemVariants}>
        <StatCard
          icon={DollarSign}
          title="Total Income"
          value={formatCurrency(totalIncome, currency)}
          change={incomeChange || undefined}
          changeLabel="vs last period"
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-500"
        />
        <StatCard
          icon={Receipt}
          title="Total Expenses"
          value={formatCurrency(totalExpenses, currency)}
          change={expenseChange || undefined}
          changeLabel="vs last period"
          iconBgColor="bg-red-500/10"
          iconColor="text-red-500"
        />
        <StatCard
          icon={PiggyBank}
          title="Net Savings"
          value={formatCurrency(netSavings, currency)}
          change={savingsChange || undefined}
          changeLabel="vs last period"
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
        />
        <Card className="rounded-2xl border-border/40 backdrop-blur-sm bg-card/80 transition-all duration-200 hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Savings Rate</p>
                <p className="text-2xl font-bold tracking-tight">
                  {savingsRate.toFixed(1)}%
                </p>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                <BarChart3 className="size-5 text-violet-500" />
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    savingsRate >= 20
                      ? 'bg-emerald-500'
                      : savingsRate >= 10
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(savingsRate, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {savingsRate >= 20
                  ? 'Great savings rate!'
                  : savingsRate >= 10
                    ? 'Good progress'
                    : 'Try to save more'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top 3 Spending Categories */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl border-border/40">
          <CardHeader>
            <CardTitle className="text-base">Top Spending Categories</CardTitle>
            <CardDescription>Your biggest expense areas for this period</CardDescription>
          </CardHeader>
          <CardContent>
            {top3Categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No spending data for this period</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {top3Categories.map((cat, i) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 rounded-xl border border-border/40 p-3.5 transition-all duration-200 hover:shadow-sm hover:bg-muted/30"
                  >
                    <div
                      className="flex size-10 items-center justify-center rounded-lg text-lg font-bold"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{cat.name}</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(cat.amount, currency)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function IncomeReport({
  incomeBySource,
  totalIncome,
  monthlyChart,
  isLoading,
}: {
  incomeBySource: Array<{ name: string; amount: number; color: string }>
  totalIncome: number
  monthlyChart: ChartDataPoint[]
  isLoading: boolean
}) {
  if (isLoading) return <ChartSkeleton />

  const pieData = incomeBySource.map((item) => ({
    name: item.name,
    value: item.amount,
    color: item.color,
  }))

  const trendData = monthlyChart.map((d) => ({
    label: d.label,
    value: d.value,
  }))

  return (
    <div className="space-y-6">
      {/* Income Breakdown */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Income Breakdown by Source</CardTitle>
          <CardDescription>Where your income comes from</CardDescription>
        </CardHeader>
        <CardContent>
          {incomeBySource.length === 0 ? (
            <p className="text-sm text-muted-foreground">No income data for this period</p>
          ) : (
            <div className="space-y-4">
              {incomeBySource.map((source) => {
                const pct = totalIncome > 0 ? (source.amount / totalIncome) * 100 : 0
                return (
                  <div key={source.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="font-medium">{source.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(source.amount, currency)}
                        </span>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: source.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Income Trend */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Income Trend</CardTitle>
          <CardDescription>Monthly income over the past 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              No trend data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Income"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: 'hsl(var(--chart-1))' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ExpenseReport({
  expenseByCategory,
  totalExpenses,
  isLoading,
}: {
  expenseByCategory: Array<{ name: string; amount: number; color: string; count: number; percentage: number }>
  totalExpenses: number
  isLoading: boolean
}) {
  const [sortField, setSortField] = React.useState<'amount' | 'percentage' | 'name'>('amount')
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc')

  const sorted = useMemo(() => {
    return [...expenseByCategory].sort((a, b) => {
      let cmp = 0
      if (sortField === 'amount') cmp = a.amount - b.amount
      else if (sortField === 'percentage') cmp = a.percentage - b.percentage
      else cmp = a.name.localeCompare(b.name)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [expenseByCategory, sortField, sortDir])

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const pieData = expenseByCategory.map((item) => ({
    name: item.name,
    value: item.amount,
    color: item.color,
  }))

  if (isLoading) return <ChartSkeleton />

  return (
    <div className="space-y-6">
      {/* Pie Chart + Top Expenses */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/40">
          <CardHeader>
            <CardTitle className="text-base">Expense Distribution</CardTitle>
            <CardDescription>Spending breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No expense data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40">
          <CardHeader>
            <CardTitle className="text-base">Top Expenses</CardTitle>
            <CardDescription>Highest spending categories</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {expenseByCategory.slice(0, 8).map((cat, i) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 rounded-xl border border-border/40 p-3 transition-all duration-200 hover:shadow-sm"
                  >
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cat.count} transaction{cat.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(cat.amount, currency)}
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
      </div>

      {/* Category Table */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Category Details</CardTitle>
          <CardDescription>Click column headers to sort</CardDescription>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No expense data for this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Category
                        {sortField === 'name' && (
                          <span className="text-muted-foreground">
                            {sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => toggleSort('amount')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Amount
                        {sortField === 'amount' && (
                          <span className="text-muted-foreground">
                            {sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => toggleSort('percentage')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        % of Total
                        {sortField === 'percentage' && (
                          <span className="text-muted-foreground">
                            {sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((cat) => (
                    <TableRow key={cat.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium">{cat.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(cat.amount, currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {cat.percentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {cat.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Total expenses: {formatCurrency(totalExpenses, currency)} across{' '}
                  {sorted.length} categories
                </TableCaption>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function HistoricalReports() {
  const [reports, setReports] = React.useState<Report[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchReports() {
      try {
        const res = await apiRequest<ApiResponse<Report[]>>('/api/reports')
        setReports(res.data)
      } catch {
        // silently fail
      } finally {
        setIsLoading(false)
      }
    }
    fetchReports()
  }, [])

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Historical Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <ListSkeleton count={5} />
        </CardContent>
      </Card>
    )
  }

  if (!reports.length) {
    return (
      <Card className="rounded-2xl border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Historical Reports</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No reports generated yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use the &quot;Generate Report&quot; button to create your first report
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader>
        <CardTitle className="text-base">Historical Reports</CardTitle>
        <CardDescription>{reports.length} report{reports.length !== 1 ? 's' : ''} generated</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {reports.map((report) => {
            let reportData: Record<string, unknown> | null = null
            try {
              reportData = JSON.parse(report.data)
            } catch {
              // ignore parse errors
            }

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 rounded-xl border border-border/40 p-3.5 transition-all duration-200 hover:shadow-sm hover:bg-muted/30"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{report.name}</p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {report.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{report.period}</p>
                  {report.summary && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{report.summary}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>{formatDateTime(report.createdAt)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// --- Export Functions ---

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportAsCSV(
  expenseByCategory: Array<{ name: string; amount: number; percentage: number; count: number }>,
  incomeBySource: Array<{ name: string; amount: number }>,
  totalIncome: number,
  totalExpenses: number,
  netSavings: number,
  period: string
) {
  const lines: string[] = [
    `Report Period: ${period}`,
    '',
    '=== Summary ===',
    `Total Income,${totalIncome.toFixed(2)}`,
    `Total Expenses,${totalExpenses.toFixed(2)}`,
    `Net Savings,${netSavings.toFixed(2)}`,
    '',
    '=== Income by Source ===',
    'Source,Amount',
    ...incomeBySource.map((s) => `${s.name},${s.amount.toFixed(2)}`),
    '',
    '=== Expenses by Category ===',
    'Category,Amount,Percentage,Transactions',
    ...expenseByCategory.map((c) =>
      `${c.name},${c.amount.toFixed(2)},${c.percentage.toFixed(1)}%,${c.count}`
    ),
  ]
  downloadFile(`finwise-report-${format(new Date(), 'yyyy-MM-dd')}.csv`, lines.join('\n'), 'text/csv')
  toast.success('CSV report exported')
}

function exportAsJSON(
  expenseByCategory: Array<{ name: string; amount: number; percentage: number; count: number }>,
  incomeBySource: Array<{ name: string; amount: number }>,
  totalIncome: number,
  totalExpenses: number,
  netSavings: number,
  savingsRate: number,
  period: string
) {
  const data = {
    reportPeriod: period,
    generatedAt: new Date().toISOString(),
    summary: {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
    },
    incomeBySource,
    expensesByCategory: expenseByCategory,
  }
  downloadFile(
    `finwise-report-${format(new Date(), 'yyyy-MM-dd')}.json`,
    JSON.stringify(data, null, 2),
    'application/json'
  )
  toast.success('JSON report exported')
}

// --- Main Component ---

export function ReportsPage() {
  const { user } = useRouterStore()
  const currency = user?.currency || 'USD'

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [reportType, setReportType] = React.useState<'monthly' | 'yearly'>('monthly')
  const [selectedMonth, setSelectedMonth] = React.useState(String(currentMonth))
  const [selectedYear, setSelectedYear] = React.useState(String(currentYear))
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = React.useState(false)

  const period: ReportPeriod = useMemo(() => ({
    type: reportType,
    month: reportType === 'monthly' ? Number(selectedMonth) : undefined,
    year: Number(selectedYear),
  }), [reportType, selectedMonth, selectedYear])

  const {
    isLoading,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    incomeBySource,
    expenseByCategory,
    top3Categories,
    incomeChange,
    expenseChange,
    savingsChange,
    monthlyChart,
  } = useReportData(period)

  const periodLabel = useMemo(() => {
    if (reportType === 'yearly') return `${selectedYear}`
    return `${MONTHS[Number(selectedMonth) - 1]} ${selectedYear}`
  }, [reportType, selectedMonth, selectedYear])

  const handleGenerateReport = useCallback(async () => {
    setIsGenerating(true)
    try {
      const body = {
        name: `${reportType === 'yearly' ? 'Yearly' : 'Monthly'} Report - ${periodLabel}`,
        type: reportType,
      }
      await apiRequest<ApiResponse<Report>>('/api/reports', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      toast.success('Report generated successfully!')
      setShowGenerateDialog(false)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to generate report'
      toast.error(msg)
    } finally {
      setIsGenerating(false)
    }
  }, [reportType, periodLabel])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const years = useMemo(() => {
    const arr: string[] = []
    for (let y = currentYear - 5; y <= currentYear; y++) {
      arr.push(String(y))
    }
    return arr.reverse()
  }, [currentYear])

  const hasNoData =
    !isLoading &&
    totalIncome === 0 &&
    totalExpenses === 0

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Reports"
          description="Generate and analyze financial reports"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Reports' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-1.5 size-3.5" />
                    Export
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="mr-2 size-4" />
                    Print / PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      exportAsCSV(expenseByCategory, incomeBySource, totalIncome, totalExpenses, netSavings, periodLabel)
                    }
                    disabled={hasNoData}
                  >
                    <FileSpreadsheet className="mr-2 size-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      exportAsJSON(expenseByCategory, incomeBySource, totalIncome, totalExpenses, netSavings, savingsRate, periodLabel)
                    }
                    disabled={hasNoData}
                  >
                    <FileJson className="mr-2 size-4" />
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Generate Report */}
              <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-1.5 size-3.5" />
                    Generate Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl border-border/40" >
                  <DialogHeader>
                    <DialogTitle>Generate Report</DialogTitle>
                    <DialogDescription>
                      Save a snapshot of this report for future reference.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Report Type</p>
                      <p className="text-sm text-muted-foreground capitalize">{reportType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Period</p>
                      <p className="text-sm text-muted-foreground">{periodLabel}</p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Summary</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <span>Income:</span>
                        <span className="text-right font-medium text-foreground">{formatCurrency(totalIncome, currency)}</span>
                        <span>Expenses:</span>
                        <span className="text-right font-medium text-foreground">{formatCurrency(totalExpenses, currency)}</span>
                        <span>Net:</span>
                        <span className="text-right font-medium text-foreground">{formatCurrency(netSavings, currency)}</span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleGenerateReport} disabled={isGenerating}>
                      {isGenerating ? 'Generating...' : 'Generate & Save'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />
      </motion.div>

      {/* Period Selector */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl border-border/40">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={reportType} onValueChange={(v) => setReportType(v as 'monthly' | 'yearly')}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportType === 'monthly' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Month</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Badge variant="secondary" className="py-1.5 px-3">
                  <Calendar className="mr-1 size-3" />
                  {periodLabel}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Empty state for no data */}
      {hasNoData && !isLoading ? (
        <motion.div variants={itemVariants}>
          <EmptyState
            icon={FileText}
            title="No data for this period"
            description="Try selecting a different time period, or start adding transactions to generate reports."
            actionLabel="Add Transaction"
            onAction={() => useRouterStore.getState().setRoute('/transactions')}
          />
        </motion.div>
      ) : (
        <>
          {/* Report Summary */}
          <motion.div variants={itemVariants}>
            <ReportSummary
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              netSavings={netSavings}
              savingsRate={savingsRate}
              incomeChange={incomeChange}
              expenseChange={expenseChange}
              savingsChange={savingsChange}
              top3Categories={top3Categories}
              isLoading={isLoading}
            />
          </motion.div>

          {/* Detailed Reports Tabs */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl border-border/40">
              <CardHeader>
                <CardTitle className="text-base">Detailed Reports</CardTitle>
                <CardDescription>Deep dive into income, expenses, and categories</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="income">
                  <TabsList>
                    <TabsTrigger value="income">
                      <DollarSign className="mr-1.5 size-3.5" />
                      Income
                    </TabsTrigger>
                    <TabsTrigger value="expenses">
                      <Receipt className="mr-1.5 size-3.5" />
                      Expenses
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <Clock className="mr-1.5 size-3.5" />
                      History
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="income" className="mt-6">
                    <IncomeReport
                      incomeBySource={incomeBySource}
                      totalIncome={totalIncome}
                      monthlyChart={monthlyChart}
                      isLoading={isLoading}
                    />
                  </TabsContent>
                  <TabsContent value="expenses" className="mt-6">
                    <ExpenseReport
                      expenseByCategory={expenseByCategory}
                      totalExpenses={totalExpenses}
                      isLoading={isLoading}
                    />
                  </TabsContent>
                  <TabsContent value="history" className="mt-6">
                    <HistoricalReports />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
