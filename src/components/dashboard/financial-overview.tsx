'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, Calendar, Flame, Zap } from 'lucide-react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns'

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#34d399', Rent: '#22d3ee', Shopping: '#fbbf24', Healthcare: '#fb7185',
  Education: '#a78bfa', Transportation: '#38bdf8', Entertainment: '#f97316',
  Utilities: '#2dd4bf', Investments: '#4ade80', Insurance: '#c084fc',
  Subscriptions: '#f472b6', Others: '#94a3b8',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export default function FinancialOverview() {
  const { expenses, incomes } = useAppStore()

  const data = useMemo(() => {
    const now = new Date()
    const mStart = startOfMonth(now)
    const mEnd = endOfMonth(now)
    const wStart = startOfWeek(now, { weekStartsOn: 1 })
    const wEnd = endOfWeek(now, { weekStartsOn: 1 })

    const monthExp = expenses.filter((e) => isWithinInterval(new Date(e.date), { start: mStart, end: mEnd }))
    const monthInc = incomes.filter((i) => isWithinInterval(new Date(i.date), { start: mStart, end: mEnd }))
    const weekExp = expenses.filter((e) => isWithinInterval(new Date(e.date), { start: wStart, end: wEnd }))

    const totalExpense = monthExp.reduce((s, e) => s + e.amount, 0)
    const totalIncome = monthInc.reduce((s, i) => s + i.amount, 0)
    const netCashFlow = totalIncome - totalExpense

    // Expense breakdown
    const catMap: Record<string, number> = {}
    monthExp.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount })
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1])
    const top4 = sorted.slice(0, 4)
    const otherTotal = sorted.slice(4).reduce((s, [, v]) => s + v, 0)
    const barSegments = top4.map(([name, value]) => ({
      name,
      value,
      pct: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
      color: CATEGORY_COLORS[name] || '#94a3b8',
    }))
    if (otherTotal > 0) {
      barSegments.push({ name: 'Other', value: otherTotal, pct: totalExpense > 0 ? (otherTotal / totalExpense) * 100 : 0, color: '#475569' })
    }

    // Savings rate
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0

    // Quick stats
    const weekSpending = weekExp.reduce((s, e) => s + e.amount, 0)
    const dayOfMonth = now.getDate()
    const dailyAvg = totalExpense / Math.max(1, dayOfMonth)

    // Biggest day this month
    const dayMap: Record<string, number> = {}
    monthExp.forEach((e) => {
      const day = format(new Date(e.date), 'MMM d')
      dayMap[day] = (dayMap[day] || 0) + e.amount
    })
    const biggestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]

    return {
      netCashFlow,
      totalExpense,
      totalIncome,
      barSegments,
      savingsRate,
      weekSpending,
      dailyAvg,
      biggestDay: biggestDay ? { day: biggestDay[0], amount: biggestDay[1] } : null,
    }
  }, [expenses, incomes])

  const isPositive = data.netCashFlow >= 0

  // SVG progress ring
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const savingsOffset = circumference - (Math.min(Math.max(data.savingsRate, 0), 100) / 100) * circumference
  const ringColor = data.savingsRate >= 20 ? '#10b981' : data.savingsRate >= 10 ? '#f59e0b' : '#f43f5e'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card className="glass border-0 overflow-hidden">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 1. Cash Flow Indicator */}
            <div className="flex flex-col items-center justify-center md:items-start gap-2">
              <p className="text-[10px] uppercase tracking-wider text-tertiary font-medium">Monthly Cash Flow</p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPositive ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                  )}
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? '+' : ''}{fmt(data.netCashFlow)}
                  </p>
                  <p className="text-[10px] text-tertiary">
                    Income {fmt(data.totalIncome)} · Expenses {fmt(data.totalExpense)}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Expense Breakdown Mini Bar */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-tertiary font-medium">Expense Breakdown</p>
              <div className="h-5 rounded-full overflow-hidden flex bg-white/5">
                {data.barSegments.map((seg) => (
                  <Tooltip key={seg.name}>
                    <TooltipTrigger asChild>
                      <div
                        className="h-full transition-all duration-500 hover:brightness-110 cursor-pointer"
                        style={{
                          width: `${Math.max(seg.pct, 2)}%`,
                          backgroundColor: seg.color,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="glass border border-white/10 rounded-lg px-2.5 py-1.5 bg-slate-900/90 text-foreground">
                      <p className="text-[10px] font-semibold">{seg.name}</p>
                      <p className="text-[10px] text-foreground/70">{fmt(seg.value)} · {seg.pct.toFixed(1)}%</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {data.barSegments.length === 0 && (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-tertiary">
                    No expenses yet
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {data.barSegments.slice(0, 5).map((seg) => (
                  <div key={seg.name} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-[10px] text-foreground/50">{seg.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Savings Progress Ring */}
            <div className="flex flex-col items-center justify-center gap-1">
              <p className="text-[10px] uppercase tracking-wider text-tertiary font-medium">Savings Rate</p>
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: savingsOffset }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold" style={{ color: ringColor }}>
                    {data.savingsRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Quick Stats Row */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-tertiary font-medium">Quick Stats</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-tertiary">This Week</p>
                    <p className="text-xs font-semibold text-cyan-400">{fmt(data.weekSpending)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-tertiary">Daily Average</p>
                    <p className="text-xs font-semibold text-amber-400">{fmt(data.dailyAvg)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-tertiary">Biggest Day</p>
                    <p className="text-xs font-semibold text-rose-400">
                      {data.biggestDay ? `${fmt(data.biggestDay.amount)}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}