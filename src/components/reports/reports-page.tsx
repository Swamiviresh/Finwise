'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Download, FileSpreadsheet, FileText, TrendingUp, TrendingDown, Calendar, DollarSign, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#f59e0b', '#10b981']
function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) }

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

// ─── Heatmap Cell ────────────────────────────────────────────────────────────

interface HeatmapCellData {
  month: number
  day: number
  amount: number
  isToday: boolean
  validDay: boolean
}

function getCellColor(amount: number, thresholds: { low: number; medium: number }): string {
  if (amount <= 0) return 'transparent'
  if (amount <= thresholds.low) return 'rgba(16, 185, 129, 0.2)'
  if (amount <= thresholds.medium) return 'rgba(245, 158, 11, 0.4)'
  return 'rgba(244, 63, 94, 0.6)'
}

// ─── Year Spending Heatmap ───────────────────────────────────────────────────

function YearSpendingHeatmap({ expenses }: { expenses: { date: string; amount: number }[] }) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCellData | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const { spendingMap, thresholds } = useMemo(() => {
    const map = new Map<string, number>()
    const amounts: number[] = []

    for (const exp of expenses) {
      const d = new Date(exp.date)
      const key = `${d.getMonth()}-${d.getDate()}`
      const prev = map.get(key) ?? 0
      const newVal = prev + exp.amount
      map.set(key, newVal)
      amounts.push(exp.amount)
    }

    // Calculate thresholds using 33rd and 66th percentile of daily totals
    const sorted = [...map.values()].sort((a, b) => a - b)
    const low = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.33)] ?? 0 : 0
    const medium = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.66)] ?? 0 : 0

    return { spendingMap: map, thresholds: { low, medium: Math.max(low, medium) } }
  }, [expenses])

  const today = useMemo(() => {
    const n = new Date()
    return { month: n.getMonth(), day: n.getDate() }
  }, [])

  const handleMouseEnter = useCallback((cell: HeatmapCellData, e: React.MouseEvent<HTMLDivElement>) => {
    setHoveredCell(cell)
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const parent = (e.target as HTMLElement).closest('[data-heatmap-scroll]')?.getBoundingClientRect()
    setTooltipPos({
      x: rect.left - (parent?.left ?? 0) + rect.width / 2,
      y: rect.top - (parent?.top ?? 0) - 8
    })
  }, [])

  return (
    <Card className="glass border-0 card-depth-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Year Spending Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-tertiary">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm border border-white/10" style={{ background: 'transparent' }} />
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(16, 185, 129, 0.2)' }} />
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(245, 158, 11, 0.4)' }} />
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(244, 63, 94, 0.6)' }} />
          </div>
          <span>More</span>
        </div>

        <div className="relative" data-heatmap-scroll>
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="min-w-[780px]">
              {/* Day numbers header */}
              <div className="flex items-center mb-1">
                <div className="w-10 flex-shrink-0" />
                {Array.from({ length: 31 }, (_, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] text-tertiary font-medium min-w-[20px]">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Month rows */}
              {Array.from({ length: 12 }, (_, monthIdx) => (
                <div key={monthIdx} className="flex items-center mb-[3px]">
                  <div className="w-10 flex-shrink-0 text-[11px] text-secondary font-medium pr-1 text-right">
                    {MONTH_NAMES[monthIdx]}
                  </div>
                  {Array.from({ length: 31 }, (_, dayIdx) => {
                    const day = dayIdx + 1
                    const validDay = day <= DAYS_IN_MONTH[monthIdx]
                    const key = `${monthIdx}-${day}`
                    const amount = spendingMap.get(key) ?? 0
                    const isToday = today.month === monthIdx && today.day === day

                    return (
                      <div
                        key={day}
                        className="flex-1 flex justify-center min-w-[20px] px-[1px]"
                        onMouseEnter={(e) => handleMouseEnter({ month: monthIdx, day, amount, isToday, validDay }, e)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className="w-[18px] h-[14px] rounded-[3px] transition-all duration-150 cursor-pointer"
                          style={{
                            background: validDay ? getCellColor(amount, thresholds) : 'transparent',
                            boxShadow: isToday ? 'inset 0 0 0 1.5px #10b981' : 'none',
                            opacity: validDay ? 1 : 0.15,
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Custom tooltip */}
          {hoveredCell && (
            <div
              className="absolute z-50 pointer-events-none"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="glass badge-glass rounded-lg px-3 py-2 text-xs shadow-xl whitespace-nowrap">
                <p className="font-semibold text-white/90">
                  {MONTH_FULL[hoveredCell.month]} {hoveredCell.day}
                </p>
                <p className={hoveredCell.amount > 0 ? 'text-rose-400' : 'text-tertiary'}>
                  {hoveredCell.amount > 0 ? fmt(hoveredCell.amount) : 'No spending'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Year Summary Cards ──────────────────────────────────────────────────────

function YearSummaryCards({ expenses }: { expenses: { date: string; amount: number }[] }) {
  const stats = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()

    const yearExpenses = expenses.filter(e => {
      const d = new Date(e.date)
      return d.getFullYear() === currentYear
    })

    const totalSpending = yearExpenses.reduce((s, e) => s + e.amount, 0)

    // Monthly totals
    const monthlyTotals = Array.from({ length: 12 }, () => 0)
    for (const exp of yearExpenses) {
      const m = new Date(exp.date).getMonth()
      monthlyTotals[m] += exp.amount
    }

    const avgMonthly = totalSpending / 12

    let highestMonth = 0
    let lowestMonth = 0
    for (let i = 1; i < 12; i++) {
      if (monthlyTotals[i] > monthlyTotals[highestMonth]) highestMonth = i
      if (monthlyTotals[i] < monthlyTotals[lowestMonth]) lowestMonth = i
    }

    return {
      totalSpending,
      avgMonthly,
      highestMonth,
      highestAmount: monthlyTotals[highestMonth],
      lowestMonth,
      lowestAmount: monthlyTotals[lowestMonth],
      year: currentYear,
    }
  }, [expenses])

  const cards = [
    {
      label: `Total ${stats.year} Spending`,
      value: fmt(stats.totalSpending),
      icon: DollarSign,
      color: 'text-rose-400',
      iconColor: 'text-rose-400/70',
      bgGlow: 'from-rose-500/5',
    },
    {
      label: 'Average Monthly',
      value: fmt(stats.avgMonthly),
      icon: Minus,
      color: 'text-amber-400',
      iconColor: 'text-amber-400/70',
      bgGlow: 'from-amber-500/5',
    },
    {
      label: 'Highest Month',
      value: `${MONTH_NAMES[stats.highestMonth]} · ${fmt(stats.highestAmount)}`,
      icon: TrendingUp,
      color: 'text-rose-400',
      iconColor: 'text-rose-400/70',
      bgGlow: 'from-rose-500/5',
    },
    {
      label: 'Lowest Month',
      value: `${MONTH_NAMES[stats.lowestMonth]} · ${fmt(stats.lowestAmount)}`,
      icon: TrendingDown,
      color: 'text-emerald-400',
      iconColor: 'text-emerald-400/70',
      bgGlow: 'from-emerald-500/5',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, ease: 'easeOut' }}
        >
          <Card className="glass border-0 card-depth-1 hover-glow-emerald transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <p className="text-xs text-tertiary font-medium uppercase tracking-wider">{c.label}</p>
                <c.icon className={`w-4 h-4 ${c.iconColor}`} />
              </div>
              <p className={`text-lg font-bold mt-2 number-tick ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Monthly Comparison Bar Chart ────────────────────────────────────────────

function MonthlyComparisonChart({ expenses }: { expenses: { date: string; amount: number }[] }) {
  const { chartData, average } = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()

    const monthlyTotals = Array.from({ length: 12 }, () => 0)
    for (const exp of expenses) {
      const d = new Date(exp.date)
      if (d.getFullYear() === currentYear) {
        monthlyTotals[d.getMonth()] += exp.amount
      }
    }

    const data = MONTH_NAMES.map((name, i) => ({
      name,
      spending: monthlyTotals[i],
    }))

    const total = monthlyTotals.reduce((s, v) => s + v, 0)
    const avg = total / 12

    return { chartData: data, average: avg }
  }, [expenses])

  const glassTooltipStyle = {
    background: 'rgba(15, 23, 42, 0.92)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    fontSize: '12px',
    backdropFilter: 'blur(12px)',
  }

  return (
    <Card className="glass border-0 card-depth-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Monthly Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="15%">
              <defs>
                <linearGradient id="annualBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={v => `$${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}k`}
              />
              <Tooltip
                contentStyle={glassTooltipStyle}
                formatter={(v: number) => [fmt(v), 'Spending']}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <ReferenceLine
                y={average}
                stroke="#f59e0b"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: `Avg ${fmt(average)}`,
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />
              <Bar
                dataKey="spending"
                fill="url(#annualBarGrad)"
                radius={[6, 6, 0, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Reports Page ───────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user, expenses } = useAppStore()
  const [period, setPeriod] = useState('monthly')
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const handleExport = async (type: 'expenses' | 'incomes' | 'report') => {
    if (!user?.id) return
    setExporting(true)
    try {
      const params = new URLSearchParams({ userId: user.id, type, period })
      const res = await fetch(`/api/export?${params}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finwise-${type}-${period}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${type} successfully`)
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (period === 'annual') {
      setLoading(false)
      return
    }
    if (!user?.id) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/reports?userId=${user.id}&period=${period}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) { setReport(data); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id, period])

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 glass rounded-2xl animate-pulse" />)}</div>
  }

  const isAnnual = period === 'annual'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-sm text-muted-foreground">
            {isAnnual ? 'Annual overview with spending heatmap' : 'Detailed analysis of your finances'}
          </p>
        </div>
        {!isAnnual && (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => handleExport('report')}
              disabled={exporting}
              className="glass bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20 hover:from-emerald-500/20 hover:to-cyan-500/20 text-emerald-400 gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="glass" disabled={exporting}>
                  <FileSpreadsheet className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass" align="end">
                <DropdownMenuItem onClick={() => handleExport('expenses')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-400" /> Export Expenses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('incomes')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-cyan-400" /> Export Income
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('report')}>
                  <FileText className="w-4 h-4 mr-2 text-amber-400" /> Export Full Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList className="glass">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="annual">Annual</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ─── Annual View ─────────────────────────────────────────── */}
      {isAnnual && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Year Spending Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4, ease: 'easeOut' }}
          >
            <YearSpendingHeatmap expenses={expenses} />
          </motion.div>

          {/* Year Summary Cards */}
          <YearSummaryCards expenses={expenses} />

          {/* Monthly Comparison Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4, ease: 'easeOut' }}
          >
            <MonthlyComparisonChart expenses={expenses} />
          </motion.div>
        </motion.div>
      )}

      {/* ─── Weekly / Monthly View ───────────────────────────────── */}
      {!isAnnual && report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Income', value: fmt(report.totalIncome), color: 'text-emerald-400' },
              { label: 'Total Expenses', value: fmt(report.totalExpense), color: 'text-rose-400' },
              { label: 'Net Savings', value: fmt(report.netSavings), color: report.netSavings >= 0 ? 'text-cyan-400' : 'text-rose-400' },
              { label: 'Avg Daily Spend', value: fmt(report.averageDailySpend), color: 'text-amber-400' },
            ].map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="glass border-0">
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass border-0">
              <CardHeader className="pb-2"><CardTitle className="text-base">Spending Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report.dailyTrend}>
                      <defs>
                        <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => format(new Date(v), 'MMM d')} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
                      <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => fmt(v)} />
                      <Area type="monotone" dataKey="amount" stroke="#f43f5e" fill="url(#repGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader className="pb-2"><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={report.categoryBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="amount" nameKey="category">
                        {report.categoryBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => fmt(v)} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader className="pb-2"><CardTitle className="text-base">Top Expenses</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.topExpenses} layout="vertical">
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
                      <YAxis type="category" dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={100} />
                      <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="amount" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader className="pb-2"><CardTitle className="text-base">Income vs Expenses</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{ name: 'Summary', Income: report.totalIncome, Expenses: report.totalExpense }]}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                      <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}