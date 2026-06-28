'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns'

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#34d399', Rent: '#22d3ee', Shopping: '#fbbf24', Healthcare: '#fb7185',
  Education: '#a78bfa', Transportation: '#38bdf8', Entertainment: '#f97316',
  Utilities: '#2dd4bf', Investments: '#4ade80', Insurance: '#c084fc',
  Subscriptions: '#f472b6', Others: '#94a3b8'
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

export default function NetWorthTracker() {
  const { expenses, incomes } = useAppStore()

  const { currentNetWorth, previousNetWorth, monthlyData, changePercent } = useMemo(() => {
    const now = new Date()
    const months: { month: string; netWorth: number }[] = []

    let prevNetWorth = 0
    let currNetWorth = 0

    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
      const key = format(d, 'MMM')
      const mStart = startOfMonth(d)
      const mEnd = endOfMonth(d)
      const mExp = expenses
        .filter(e => isWithinInterval(new Date(e.date), { start: mStart, end: mEnd }))
        .reduce((s, e) => s + e.amount, 0)
      const mInc = incomes
        .filter(i => isWithinInterval(new Date(i.date), { start: mStart, end: mEnd }))
        .reduce((s, i) => s + i.amount, 0)
      const net = mInc - mExp
      months.push({ month: key, netWorth: Math.round(net) })
      if (m === 1) prevNetWorth = net
      if (m === 0) currNetWorth = net
    }

    const change = prevNetWorth !== 0
      ? Math.round(((currNetWorth - prevNetWorth) / Math.abs(prevNetWorth)) * 100)
      : 0

    return {
      currentNetWorth: currNetWorth,
      previousNetWorth: prevNetWorth,
      monthlyData: months,
      changePercent: change,
    }
  }, [expenses, incomes])

  const isPositive = changePercent >= 0
  const isFlat = changePercent === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyan-500/10 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            Net Worth Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            {/* Current net worth */}
            <div className="shrink-0">
              <p className="text-xs text-muted-foreground mb-1">Current Net Worth (This Month)</p>
              <div className="flex items-center gap-3">
                <p className={`text-3xl font-bold number-tick ${currentNetWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(currentNetWorth)}
                </p>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isFlat
                    ? 'bg-amber-500/10 text-amber-400'
                    : isPositive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {isFlat ? (
                    <span className="w-3 h-3 flex items-center justify-center">—</span>
                  ) : isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {isPositive ? '+' : ''}{changePercent}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isFlat
                  ? 'No change from last month'
                  : isPositive
                    ? `${formatCurrency(Math.abs(currentNetWorth - previousNetWorth))} more than last month`
                    : `${formatCurrency(Math.abs(currentNetWorth - previousNetWorth))} less than last month`
                }
              </p>
            </div>

            {/* Bar chart */}
            <div className="flex-1 w-full h-40 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barCategoryGap="20%">
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#cbd5e1' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#cbd5e1' }}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,15,25,0.95)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#e8edf5',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Net Worth']}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar
                    dataKey="netWorth"
                    radius={[6, 6, 0, 0]}
                    fill="#22d3ee"
                    opacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}