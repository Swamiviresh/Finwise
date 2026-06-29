'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Activity, Zap, Trophy, Flame, DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#34d399',
  Rent: '#22d3ee',
  Shopping: '#fbbf24',
  Healthcare: '#fb7185',
  Education: '#a78bfa',
  Transportation: '#38bdf8',
  Entertainment: '#f97316',
  Utilities: '#2dd4bf',
  Investments: '#4ade80',
  Insurance: '#c084fc',
  Subscriptions: '#f472b6',
  Others: '#94a3b8',
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

// ─── Animation variants ───────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg border border-white/10 px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-secondary mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-tertiary">{p.name}</span>
          <span className="font-semibold text-foreground ml-auto">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const w = 80
  const h = 28
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-7 shrink-0">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Circular Progress Ring ───────────────────────────────────────────────────

function ConsistencyRing({ score }: { score: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 75 ? '#10b981' : score >= 50 ? '#fbbf24' : score >= 25 ? '#f97316' : '#f43f5e'

  const label =
    score >= 75
      ? 'Very Consistent'
      : score >= 50
        ? 'Moderately Consistent'
        : score >= 25
          ? 'Somewhat Variable'
          : 'Highly Variable'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={130} height={130} className="-rotate-90">
          <circle
            cx={65}
            cy={65}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={8}
            className="text-white/5"
          />
          <motion.circle
            cx={65}
            cy={65}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold stat-number"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            style={{ color }}
          >
            {Math.round(score)}
          </motion.span>
          <span className="text-[10px] text-tertiary mt-0.5">/ 100</span>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color }}>
        {label}
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InsightsPage() {
  const { expenses, incomes } = useAppStore()

  // ─── 1. Spending Trend Chart (6 months) ────────────────────────────────────

  const trendData = useMemo(() => {
    const now = new Date()
    const months: { key: string; label: string; expenses: number; income: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yr = d.getFullYear()
      const mo = d.getMonth()
      const key = `${yr}-${mo}`
      months.push({
        key,
        label: `${MONTH_SHORT[mo]} ${yr.toString().slice(2)}`,
        expenses: 0,
        income: 0,
      })
    }

    for (const e of expenses) {
      const d = new Date(e.date)
      const k = `${d.getFullYear()}-${d.getMonth()}`
      const m = months.find((x) => x.key === k)
      if (m) m.expenses += e.amount
    }
    for (const inc of incomes) {
      const d = new Date(inc.date)
      const k = `${d.getFullYear()}-${d.getMonth()}`
      const m = months.find((x) => x.key === k)
      if (m) m.income += inc.amount
    }

    return months
  }, [expenses, incomes])

  // ─── 2. Category Evolution (top 5) ─────────────────────────────────────────

  const categoryEvolution = useMemo(() => {
    const now = new Date()
    const monthKeys: string[] = []
    const monthLabels: string[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthKeys.push(`${d.getFullYear()}-${d.getMonth()}`)
      monthLabels.push(MONTH_SHORT[d.getMonth()])
    }

    // Sum by category
    const catTotals: Record<string, number> = {}
    for (const e of expenses) {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount
    }

    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5)

    return sorted.map(([cat, total]) => {
      const monthly: number[] = monthKeys.map((k) => {
        return expenses
          .filter((e) => {
            const d = new Date(e.date)
            return `${d.getFullYear()}-${d.getMonth()}` === k && e.category === cat
          })
          .reduce((s, e) => s + e.amount, 0)
      })
      return { category: cat, total, monthly, color: CATEGORY_COLORS[cat] || '#94a3b8' }
    })
  }, [expenses])

  // ─── 3. Spending Velocity ──────────────────────────────────────────────────

  const spendingVelocity = useMemo(() => {
    const now = new Date()
    const last3: number[] = []
    const prev3: number[] = []

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yr = d.getFullYear()
      const mo = d.getMonth()
      const total = expenses
        .filter((e) => {
          const ed = new Date(e.date)
          return ed.getFullYear() === yr && ed.getMonth() === mo
        })
        .reduce((s, e) => s + e.amount, 0)

      if (i < 3) last3.push(total)
      else prev3.push(total)
    }

    const avgLast = last3.reduce((a, b) => a + b, 0) / (last3.length || 1)
    const avgPrev = prev3.reduce((a, b) => a + b, 0) / (prev3.length || 1)
    const change = avgPrev > 0 ? ((avgLast - avgPrev) / avgPrev) * 100 : 0

    return { avgLast, avgPrev, change }
  }, [expenses])

  // ─── 4. Top 5 Expenses of All Time ─────────────────────────────────────────

  const topExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [expenses])

  // ─── 5. Month-over-Month Changes ───────────────────────────────────────────

  const momChanges = useMemo(() => {
    const now = new Date()
    const curMonth = now.getMonth()
    const curYear = now.getFullYear()
    const prevMonth = curMonth === 0 ? 11 : curMonth - 1
    const prevYear = curMonth === 0 ? curYear - 1 : curYear

    const curMap: Record<string, number> = {}
    const prevMap: Record<string, number> = {}

    for (const e of expenses) {
      const d = new Date(e.date)
      if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
        curMap[e.category] = (curMap[e.category] || 0) + e.amount
      }
      if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
        prevMap[e.category] = (prevMap[e.category] || 0) + e.amount
      }
    }

    const allCats = new Set([...Object.keys(curMap), ...Object.keys(prevMap)])

    return Array.from(allCats)
      .map((cat) => {
        const cur = curMap[cat] || 0
        const prev = prevMap[cat] || 0
        const diff = cur - prev
        return {
          category: cat,
          current: cur,
          previous: prev,
          change: diff,
          percentChange: prev > 0 ? (diff / prev) * 100 : cur > 0 ? 100 : 0,
        }
      })
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  }, [expenses])

  // ─── 6. Spending Consistency Score ─────────────────────────────────────────

  const consistencyScore = useMemo(() => {
    const now = new Date()
    const monthTotals: number[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yr = d.getFullYear()
      const mo = d.getMonth()
      const total = expenses
        .filter((e) => {
          const ed = new Date(e.date)
          return ed.getFullYear() === yr && ed.getMonth() === mo
        })
        .reduce((s, e) => s + e.amount, 0)
      monthTotals.push(total)
    }

    if (monthTotals.length < 2) return 50

    const mean = monthTotals.reduce((a, b) => a + b, 0) / monthTotals.length
    const variance =
      monthTotals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / monthTotals.length
    const stdDev = Math.sqrt(variance)

    // Coefficient of variation → 0 = perfectly consistent, 1+ = very inconsistent
    const cv = mean > 0 ? stdDev / mean : 1

    // Map CV to 0-100 score: CV 0 → 100, CV 0.5+ → 0
    const score = Math.max(0, Math.min(100, 100 - cv * 200))
    return score
  }, [expenses])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="space-y-6 max-w-7xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── 1. Spending Trend Chart ─────────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="glass card-depth-1 border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              Spending &amp; Income Trend
            </CardTitle>
            <p className="text-xs text-tertiary mt-1">Last 6 months overview</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fill="url(#gradExpenses)"
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gradIncome)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <hr className="glass-divider" />

      {/* ── 2. Category Evolution + 3. Spending Velocity (side by side) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Evolution */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass card-depth-1 border-white/[0.06] h-full">
            <CardHeader className="pb-2">
              <div className="section-header">
                <div>
                  <div className="section-header-title flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-violet-400" />
                    </div>
                    Category Evolution
                  </div>
                  <p className="section-header-subtitle">Top 5 spending categories — 6 month trend</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {categoryEvolution.map((cat) => {
                  const isIncreasing =
                    cat.monthly.length >= 2 &&
                    cat.monthly[cat.monthly.length - 1] >= cat.monthly[cat.monthly.length - 2]
                  return (
                    <div
                      key={cat.category}
                      className="flex items-center gap-4 p-3 rounded-xl hover-glow-emerald transition-all duration-200 group"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ background: `${cat.color}15`, color: cat.color }}
                      >
                        {cat.category.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{cat.category}</span>
                          <span className="text-sm font-semibold number-tick">{fmt(cat.total)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkline data={cat.monthly} color={cat.color} />
                          <span
                            className={cn(
                              'text-[11px] font-medium flex items-center gap-0.5',
                              isIncreasing ? 'text-rose-400' : 'text-emerald-400'
                            )}
                          >
                            {isIncreasing ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {isIncreasing ? 'Up' : 'Down'} trend
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {categoryEvolution.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-tertiary">
                    <Flame className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No expense data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Spending Velocity */}
        <motion.div variants={item}>
          <Card className="glass-card-interactive card-depth-1 h-full">
            <CardHeader className="pb-2">
              <div className="section-header">
                <div>
                  <div className="section-header-title flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-400" />
                    </div>
                    Spending Velocity
                  </div>
                  <p className="section-header-subtitle">Last 3 months vs previous 3</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col items-center justify-center flex-1 py-6">
              <div
                className={cn(
                  'w-24 h-24 rounded-2xl flex items-center justify-center mb-4',
                  spendingVelocity.change > 0
                    ? 'bg-rose-500/10'
                    : spendingVelocity.change < 0
                      ? 'bg-emerald-500/10'
                      : 'bg-white/5'
                )}
              >
                {spendingVelocity.change > 5 ? (
                  <TrendingUp className="w-10 h-10 text-rose-400" />
                ) : spendingVelocity.change < -5 ? (
                  <TrendingDown className="w-10 h-10 text-emerald-400" />
                ) : (
                  <DollarSign className="w-10 h-10 text-amber-400" />
                )}
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    'text-2xl font-bold stat-number flex items-center justify-center gap-1.5',
                    spendingVelocity.change > 5
                      ? 'text-rose-400'
                      : spendingVelocity.change < -5
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                  )}
                >
                  {spendingVelocity.change > 0 ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : spendingVelocity.change < 0 ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : null}
                  {Math.abs(spendingVelocity.change).toFixed(1)}%
                </p>
                <p className="text-sm text-secondary mt-1">
                  {spendingVelocity.change > 5
                    ? 'Spending is accelerating'
                    : spendingVelocity.change < -5
                      ? 'Spending is decelerating'
                      : 'Spending is stable'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 w-full">
                <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-xs text-tertiary mb-1">Last 3 mo avg</p>
                  <p className="text-sm font-semibold stat-number">{fmt(spendingVelocity.avgLast)}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-xs text-tertiary mb-1">Previous 3 mo avg</p>
                  <p className="text-sm font-semibold stat-number">{fmt(spendingVelocity.avgPrev)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <hr className="glass-divider" />

      {/* ── 4. Top 5 Expenses + 5. MoM Changes (side by side) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Expenses */}
        <motion.div variants={item}>
          <Card className="glass card-depth-1 border-white/[0.06] h-full">
            <CardHeader className="pb-2">
              <div className="section-header">
                <div>
                  <div className="section-header-title flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-rose-400" />
                    </div>
                    Top 5 Expenses of All Time
                  </div>
                  <p className="section-header-subtitle">Highest single transactions</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2.5">
                {topExpenses.map((exp, i) => {
                  const color = CATEGORY_COLORS[exp.category] || '#94a3b8'
                  return (
                    <motion.div
                      key={exp.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.06, duration: 0.3 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover-scale-subtle hover-surface transition-colors group"
                    >
                      <span className="text-xs font-bold text-tertiary w-5 text-center shrink-0">
                        {i + 1}
                      </span>
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${color}15` }}
                      >
                        <span className="text-xs font-bold" style={{ color }}>
                          {exp.category.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-emerald-400 transition-colors">
                          {exp.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 border-white/10 text-foreground/50 font-normal"
                            style={{ borderColor: `${color}30`, color }}
                          >
                            {exp.category}
                          </Badge>
                          <span className="text-[10px] text-tertiary">
                            {format(new Date(exp.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-rose-400 number-tick shrink-0">
                        -{fmt(exp.amount)}
                      </span>
                    </motion.div>
                  )
                })}
                {topExpenses.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-tertiary">
                    <Flame className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No expense data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Month-over-Month Changes */}
        <motion.div variants={item}>
          <Card className="glass card-depth-1 border-white/[0.06] h-full">
            <CardHeader className="pb-2">
              <div className="section-header">
                <div>
                  <div className="section-header-title flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                    </div>
                    Month-over-Month Changes
                  </div>
                  <p className="section-header-subtitle">
                    Category changes this month vs last month
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={momChanges}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.04)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${(Math.abs(v) / 1000).toFixed(1)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null
                        const d = payload[0].payload as (typeof momChanges)[number]
                        return (
                          <div className="glass rounded-lg border border-white/10 px-3 py-2 shadow-xl">
                            <p className="text-xs font-medium text-secondary mb-1">
                              {d.category}
                            </p>
                            <div className="text-xs space-y-0.5">
                              <div className="flex justify-between gap-4">
                                <span className="text-tertiary">This month</span>
                                <span className="font-semibold">{fmt(d.current)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-tertiary">Last month</span>
                                <span className="font-semibold">{fmt(d.previous)}</span>
                              </div>
                              <div
                                className={cn(
                                  'flex justify-between gap-4 pt-1 border-t border-white/5',
                                  d.change > 0 ? 'text-rose-400' : 'text-emerald-400'
                                )}
                              >
                                <span>Change</span>
                                <span className="font-semibold">
                                  {d.change > 0 ? '+' : ''}
                                  {fmt(d.change)} ({d.percentChange > 0 ? '+' : ''}
                                  {d.percentChange.toFixed(0)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="change" radius={[0, 4, 4, 0]} barSize={14}>
                      {momChanges.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.change >= 0 ? '#f43f5e' : '#10b981'}
                          opacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {momChanges.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-tertiary">
                  <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No comparative data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <hr className="glass-divider" />

      {/* ── 6. Spending Consistency Score ─────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="glass-card-interactive card-depth-1">
          <CardHeader className="pb-2">
            <div className="section-header">
              <div>
                <div className="section-header-title flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  Spending Consistency Score
                </div>
                <p className="section-header-subtitle">
                  How stable your monthly spending is — low variance = high consistency
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row items-center gap-8 py-4">
              <ConsistencyRing score={consistencyScore} />
              <div className="flex-1 space-y-3">
                <p className="text-sm text-secondary leading-relaxed">
                  {consistencyScore >= 75
                    ? 'Your spending is very consistent month to month. You have strong financial discipline and predictable habits.'
                    : consistencyScore >= 50
                      ? 'Your spending shows moderate variation. Some months are higher than others, but overall patterns are reasonably stable.'
                      : consistencyScore >= 25
                        ? 'Your spending varies significantly between months. Consider reviewing your budget to identify what causes spikes.'
                        : 'Your spending is highly unpredictable. Large swings between months may indicate irregular expenses or impulse spending.'}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                    <p className="text-[10px] text-tertiary mb-0.5">Avg Monthly</p>
                    <p className="text-sm font-semibold stat-number">
                      {fmt(
                        expenses.length > 0
                          ? (() => {
                              const now = new Date()
                              let sum = 0
                              let count = 0
                              for (let i = 5; i >= 0; i--) {
                                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                                const total = expenses
                                  .filter((e) => {
                                    const ed = new Date(e.date)
                                    return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth()
                                  })
                                  .reduce((s, e) => s + e.amount, 0)
                                if (total > 0) {
                                  sum += total
                                  count++
                                }
                              }
                              return count > 0 ? sum / count : 0
                            })()
                          : 0
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                    <p className="text-[10px] text-tertiary mb-0.5">Highest Month</p>
                    <p className="text-sm font-semibold stat-number">
                      {fmt(
                        (() => {
                          const now = new Date()
                          let maxVal = 0
                          for (let i = 5; i >= 0; i--) {
                            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                            const total = expenses
                              .filter((e) => {
                                const ed = new Date(e.date)
                                return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth()
                              })
                              .reduce((s, e) => s + e.amount, 0)
                            maxVal = Math.max(maxVal, total)
                          }
                          return maxVal
                        })()
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                    <p className="text-[10px] text-tertiary mb-0.5">Lowest Month</p>
                    <p className="text-sm font-semibold stat-number">
                      {fmt(
                        (() => {
                          const now = new Date()
                          let minVal = Infinity
                          for (let i = 5; i >= 0; i--) {
                            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                            const total = expenses
                              .filter((e) => {
                                const ed = new Date(e.date)
                                return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth()
                              })
                              .reduce((s, e) => s + e.amount, 0)
                            minVal = Math.min(minVal, total)
                          }
                          return minVal === Infinity ? 0 : minVal
                        })()
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}