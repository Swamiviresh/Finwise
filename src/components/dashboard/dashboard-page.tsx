'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Wallet, Heart, Lightbulb, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import HealthScoreRing from './health-score-ring'

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#10b981', Rent: '#06b6d4', Shopping: '#f59e0b', Healthcare: '#f43f5e',
  Education: '#8b5cf6', Transportation: '#06b6d4', Entertainment: '#f59e0b',
  Utilities: '#10b981', Investments: '#10b981', Insurance: '#8b5cf6',
  Subscriptions: '#f43f5e', Others: '#94a3b8'
}

const AI_TIPS = [
  { text: 'You spent 15% more on dining out this month. Consider meal prepping to save.', icon: '🍽️' },
  { text: 'Great job! Your savings rate is above the recommended 20% threshold.', icon: '💪' },
  { text: 'You have 3 subscriptions you haven\'t used this month. Consider canceling them.', icon: '💡' },
  { text: 'Your emergency fund is on track. Keep it up!', icon: '🛡️' },
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function AnimatedCard({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.08 }}>
      {children}
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user, expenses, incomes, budgets, setExpenses, setIncomes, setBudgets, healthScore, setHealthScore, setView, setLoading } = useAppStore()
  const [loading, setLoadingState] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    setLoadingState(true)

    const fetchData = async () => {
      try {
        const [expRes, incRes, budRes, healthRes] = await Promise.all([
          fetch(`/api/expenses?userId=${user.id}`),
          fetch(`/api/incomes?userId=${user.id}`),
          fetch(`/api/budgets?userId=${user.id}`),
          fetch(`/api/health-score?userId=${user.id}`),
        ])
        if (cancelled) return
        const [expData, incData, budData, healthData] = await Promise.all([expRes.json(), incRes.json(), budRes.json(), healthRes.json()])
        setExpenses(expData)
        setIncomes(incData)
        setBudgets(budData)
        setHealthScore(healthData.score)
      } catch (e) { console.error(e) }
      finally { if (!cancelled) setLoadingState(false) }
    }
    fetchData()
    return () => { cancelled = true }
  }, [user?.id, setExpenses, setIncomes, setBudgets, setHealthScore])

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const monthExpenses = useMemo(() =>
    expenses.filter(e => isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd })),
    [expenses, monthStart, monthEnd]
  )
  const monthIncomes = useMemo(() =>
    incomes.filter(i => isWithinInterval(new Date(i.date), { start: monthStart, end: monthEnd })),
    [incomes, monthStart, monthEnd]
  )

  const totalExpense = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const totalIncome = monthIncomes.reduce((s, i) => s + i.amount, 0)
  const netSavings = totalIncome - totalExpense

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    monthExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [monthExpenses])

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {}
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
      const key = format(d, 'MMM')
      const mStart = startOfMonth(d)
      const mEnd = endOfMonth(d)
      const mExp = expenses.filter(e => isWithinInterval(new Date(e.date), { start: mStart, end: mEnd })).reduce((s, e) => s + e.amount, 0)
      const mInc = incomes.filter(i => isWithinInterval(new Date(i.date), { start: mStart, end: mEnd })).reduce((s, i) => s + i.amount, 0)
      map[key] = { income: Math.round(mInc), expense: Math.round(mExp) }
    }
    return Object.entries(map).map(([month, data]) => ({ month, ...data }))
  }, [expenses, incomes, now])

  const recentExpenses = monthExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
  const topBudgets = budgets.slice(0, 3)

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <AnimatedCard index={0}>
          <Card className="glass border-0 card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs text-emerald-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" />12.5%</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold mt-1 counter-animate">{formatCurrency(totalIncome)}</p>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard index={1}>
          <Card className="glass border-0 card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                </div>
                <span className="text-xs text-rose-400 flex items-center gap-1"><ArrowDownRight className="w-3 h-3" />8.2%</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold mt-1 counter-animate">{formatCurrency(totalExpense)}</p>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard index={2}>
          <Card className="glass border-0 card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs text-cyan-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" />23.1%</span>
              </div>
              <p className="text-sm text-muted-foreground">Net Savings</p>
              <p className="text-2xl font-bold mt-1 counter-animate">{formatCurrency(netSavings)}</p>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard index={3}>
          <Card className="glass border-0 card-hover">
            <CardContent className="p-5 flex items-center gap-4">
              <HealthScoreRing score={healthScore} size={72} strokeWidth={6} />
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-lg font-bold">Financial Health</p>
                <p className="text-xs text-muted-foreground mt-0.5">{healthScore >= 75 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Work'}</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatedCard index={4}>
          <Card className="glass border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="w-1/2 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2 max-h-52 overflow-y-auto pr-2">
                {categoryData.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[c.name] || '#94a3b8' }} />
                      <span className="text-muted-foreground">{c.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard index={5}>
          <Card className="glass border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} name="Income" />
                    <Area type="monotone" dataKey="expense" stroke="#f43f5e" fill="url(#expenseGrad)" strokeWidth={2} name="Expenses" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <AnimatedCard index={6}>
          <Card className="glass border-0">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <button onClick={() => setView('expenses')} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentExpenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No transactions this month</p>
                ) : recentExpenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${CATEGORY_COLORS[e.category] || '#94a3b8'}15` }}>
                        <span className="text-xs font-bold" style={{ color: CATEGORY_COLORS[e.category] || '#94a3b8' }}>
                          {e.category[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(e.date), 'MMM d')}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-rose-400">-{formatCurrency(e.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Active Budgets */}
        <AnimatedCard index={7}>
          <Card className="glass border-0">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Active Budgets</CardTitle>
              <button onClick={() => setView('budgets')} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topBudgets.map(b => {
                  const pct = Math.round((b.spent / b.limit) * 100)
                  const color = pct > 90 ? '#f43f5e' : pct > 70 ? '#f59e0b' : '#10b981'
                  return (
                    <div key={b.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{b.category}</span>
                        <span className="text-xs text-muted-foreground">{formatCurrency(b.spent)} / {formatCurrency(b.limit)}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                          className="h-full rounded-full" style={{ background: color }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{pct}% used</p>
                    </div>
                  )
                })}
                {topBudgets.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No budgets set</p>}
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* AI Suggestions */}
        <AnimatedCard index={8}>
          <Card className="glass border-0">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-400" /> AI Insights</CardTitle>
              <button onClick={() => setView('ai-coach')} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                Ask AI <ChevronRight className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {AI_TIPS.map((tip, i) => (
                  <div key={i} className="glass rounded-xl p-3 text-sm text-muted-foreground leading-relaxed">
                    <span className="mr-1.5">{tip.icon}</span>{tip.text}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    </div>
  )
}