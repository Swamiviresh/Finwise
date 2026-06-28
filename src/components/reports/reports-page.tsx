'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, PiggyBank, Calendar,
  ArrowUpDown, ArrowUp, ArrowDown, Download,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/store/use-app-store'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

const CHART_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#f43f5e', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#e879f9', '#fb923c']

interface ReportData {
  period: string
  totalExpense: number
  totalIncome: number
  netSavings: number
  transactionCount: number
  categoryBreakdown: { category: string; amount: number }[]
  dailyTrend: { date: string; amount: number }[]
  topExpenses: { title: string; amount: number; category: string; date: string }[]
  averageDailySpend: number
}

type SortField = 'date' | 'amount'
type SortDir = 'asc' | 'desc'

type Period = 'weekly' | 'monthly' | 'annual'

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs border border-white/10">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: ${p.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { percent: number } }[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs border border-white/10">
      <p className="font-semibold text-foreground">{item.name}</p>
      <p className="text-muted-foreground">${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({(item.payload.percent * 100).toFixed(1)}%)</p>
    </div>
  )
}

function SummaryCard({ title, value, icon: Icon, color, trend }: {
  title: string
  value: string
  icon: React.ElementType
  color: string
  trend?: 'up' | 'down' | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 card-hover"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
          <Icon className="size-4" style={{ color }} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-xl font-bold counter-animate" style={{ color }}>{value}</p>
        {trend && (
          <span className={`flex items-center text-xs mb-0.5 ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend === 'up' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          </span>
        )}
      </div>
    </motion.div>
  )
}

export default function ReportsPage() {
  const { user } = useAppStore()
  const [period, setPeriod] = useState<Period>('monthly')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const fetchReport = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?userId=${user.id}&period=${period}`)
      const json = await res.json()
      if (res.ok) setData(json)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [user, period])

  useEffect(() => { fetchReport() }, [fetchReport])

  const fmt = useCallback((n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n), [])

  const incomeExpenseData = useMemo(() => {
    if (!data) return []
    const map: Record<string, { date: string; income: number; expense: number }> = {}
    for (const d of data.dailyTrend) {
      map[d.date] = { date: d.date, income: 0, expense: d.amount }
    }
    return Object.values(map)
  }, [data])

  const pieData = useMemo(() => {
    if (!data) return []
    const total = data.categoryBreakdown.reduce((s, c) => s + c.amount, 0)
    return data.categoryBreakdown.map(c => ({
      name: c.category,
      value: c.amount,
      percent: total > 0 ? c.amount / total : 0,
    }))
  }, [data])

  const barData = useMemo(() => {
    if (!data) return []
    return data.topExpenses.map(e => ({
      name: e.title.length > 18 ? e.title.slice(0, 18) + '…' : e.title,
      fullName: e.title,
      amount: e.amount,
      category: e.category,
    }))
  }, [data])

  const sortedTransactions = useMemo(() => {
    if (!data) return []
    const all = [
      ...data.topExpenses.map(e => ({
        date: e.date,
        title: e.title,
        category: e.category,
        amount: e.amount,
        type: 'Expense' as const,
      })),
    ]
    return all.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortField === 'date') return mul * a.date.localeCompare(b.date)
      return mul * (a.amount - b.amount)
    })
  }, [data, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed insights into your financial activity</p>
        </div>
        <Button variant="outline" className="gap-2 border-white/10 text-muted-foreground hover:text-foreground">
          <Download className="size-4" />
          Export
        </Button>
      </div>

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="weekly" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">Monthly</TabsTrigger>
          <TabsTrigger value="annual" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">Annual</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-6 mt-4">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
              ))}
            </div>
          ) : data ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                <SummaryCard
                  title="Total Income"
                  value={fmt(data.totalIncome)}
                  icon={TrendingUp}
                  color="#10b981"
                  trend="up"
                />
                <SummaryCard
                  title="Total Expenses"
                  value={fmt(data.totalExpense)}
                  icon={TrendingDown}
                  color="#f43f5e"
                  trend="down"
                />
                <SummaryCard
                  title="Net Savings"
                  value={fmt(data.netSavings)}
                  icon={PiggyBank}
                  color="#06b6d4"
                  trend={data.netSavings >= 0 ? 'up' : 'down'}
                />
                <SummaryCard
                  title="Avg Daily Spend"
                  value={fmt(data.averageDailySpend)}
                  icon={DollarSign}
                  color="#f59e0b"
                />
              </div>

              {/* Charts 2x2 Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Spending Trend - Area Chart */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Spending Trend</h3>
                  {data.dailyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={data.dailyTrend}>
                        <defs>
                          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(v: string) => format(parseISO(v), 'MMM d')}
                          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(v: number) => `$${v}`}
                          axisLine={false}
                          tickLine={false}
                          width={50}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          name="Spending"
                          stroke="#10b981"
                          fill="url(#spendGrad)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
                  )}
                </div>

                {/* Category Breakdown - Donut */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Category Breakdown</h3>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {pieData.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: '11px' }}
                          formatter={(value: string) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
                  )}
                </div>

                {/* Top Expenses - Horizontal Bar */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Top Expenses</h3>
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(v: number) => `$${v}`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          width={110}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload
                            return (
                              <div className="glass-strong rounded-lg px-3 py-2 text-xs border border-white/10">
                                <p className="font-semibold text-foreground">{d.fullName}</p>
                                <p className="text-muted-foreground">{d.category} · {fmt(d.amount)}</p>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="amount" name="Amount" radius={[0, 6, 6, 0]}>
                          {barData.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
                  )}
                </div>

                {/* Income vs Expenses - Bar Chart */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Income vs Expenses</h3>
                  {incomeExpenseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={incomeExpenseData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(v: string) => format(parseISO(v), 'MMM d')}
                          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(v: number) => `$${v}`}
                          axisLine={false}
                          tickLine={false}
                          width={50}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
                  )}
                </div>
              </div>

              {/* Transaction Table */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Transactions</h3>
                  <Badge variant="outline" className="border-white/10 text-muted-foreground">
                    {data.transactionCount} transactions
                  </Badge>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead
                          className="text-xs cursor-pointer select-none text-muted-foreground hover:text-foreground"
                          onClick={() => toggleSort('date')}
                        >
                          <div className="flex items-center gap-1">
                            Date
                            <ArrowUpDown className="size-3" />
                          </div>
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground">Description</TableHead>
                        <TableHead className="text-xs text-muted-foreground">Category</TableHead>
                        <TableHead
                          className="text-xs cursor-pointer select-none text-muted-foreground hover:text-foreground text-right"
                          onClick={() => toggleSort('amount')}
                        >
                          <div className="flex items-center gap-1 justify-end">
                            Amount
                            <ArrowUpDown className="size-3" />
                          </div>
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground text-right">Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                            No transactions in this period
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedTransactions.map((tx, idx) => (
                          <TableRow key={idx} className="border-white/5 hover:bg-white/[0.02]">
                            <TableCell className="text-xs text-muted-foreground py-3">
                              {format(parseISO(tx.date), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-xs text-foreground py-3 font-medium">{tx.title}</TableCell>
                            <TableCell className="py-3">
                              <Badge variant="outline" className="border-white/10 text-[10px] text-muted-foreground">
                                {tx.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right py-3 font-mono text-foreground">
                              {fmt(tx.amount)}
                            </TableCell>
                            <TableCell className="text-right py-3">
                              <Badge
                                className={`text-[10px] border-0 ${
                                  tx.type === 'Income'
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-rose-500/15 text-rose-400'
                                }`}
                              >
                                {tx.type}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-muted-foreground">No report data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
