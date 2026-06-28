'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Wallet, Heart, Lightbulb, ArrowUpRight, ArrowDownRight, ChevronRight, AlertTriangle, Sparkles, Minus, BarChart3 } from 'lucide-react'
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import HealthScoreRing from './health-score-ring'
import ActivityFeed from './activity-feed'
import SpendingCalendar from './spending-calendar'

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#34d399', Rent: '#22d3ee', Shopping: '#fbbf24', Healthcare: '#fb7185',
  Education: '#a78bfa', Transportation: '#38bdf8', Entertainment: '#f97316',
  Utilities: '#2dd4bf', Investments: '#4ade80', Insurance: '#c084fc',
  Subscriptions: '#f472b6', Others: '#94a3b8'
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
  const [forecast, setForecast] = useState<any>(null)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    setLoadingState(true)

    const fetchData = async () => {
      try {
        const [expRes, incRes, budRes, healthRes, forecastRes] = await Promise.all([
          fetch(`/api/expenses?userId=${user.id}`),
          fetch(`/api/incomes?userId=${user.id}`),
          fetch(`/api/budgets?userId=${user.id}`),
          fetch(`/api/health-score?userId=${user.id}`),
          fetch(`/api/forecast?userId=${user.id}`),
        ])
        if (cancelled) return
        const [expData, incData, budData, healthData, forecastData] = await Promise.all([expRes.json(), incRes.json(), budRes.json(), healthRes.json(), forecastRes.json()])
        setExpenses(expData)
        setIncomes(incData)
        setBudgets(budData)
        setHealthScore(healthData.score)
        setForecast(forecastData)
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

  const forecastChartData = useMemo(() => {
    if (!forecast) return []
    return [
      ...forecast.historical,
      ...forecast.forecast.map((f: any) => ({ month: f.month, income: f.predictedIncome, expenses: f.predictedExpense })),
    ]
  }, [forecast])

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
          <Card className="glass border-0 card-hover card-shine glass-accent-top" style={{ '--accent-color': '#34d399' } as React.CSSProperties}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full"><ArrowUpRight className="w-3 h-3" />12.5%</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold mt-1 counter-animate number-tick text-foreground">{formatCurrency(totalIncome)}</p>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard index={1}>
          <Card className="glass border-0 card-hover card-shine glass-accent-top" style={{ '--accent-color': '#fb7185' } as React.CSSProperties}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                </div>
                <span className="text-xs text-rose-400 font-semibold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-full"><ArrowDownRight className="w-3 h-3" />8.2%</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold mt-1 counter-animate number-tick text-foreground">{formatCurrency(totalExpense)}</p>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard index={2}>
          <Card className="glass border-0 card-hover card-shine glass-accent-top" style={{ '--accent-color': '#22d3ee' } as React.CSSProperties}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-full"><ArrowUpRight className="w-3 h-3" />23.1%</span>
              </div>
              <p className="text-sm text-muted-foreground">Net Savings</p>
              <p className="text-2xl font-bold mt-1 counter-animate number-tick text-foreground">{formatCurrency(netSavings)}</p>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard index={3}>
          <Card className="glass border-0 card-hover card-shine glass-accent-top" style={{ '--accent-color': '#a78bfa' } as React.CSSProperties}>
            <CardContent className="p-4 flex items-center gap-3">
              <HealthScoreRing score={healthScore} size={64} strokeWidth={5} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Health Score</p>
                <p className="text-base font-bold text-foreground">Financial Health</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="pulse-dot" />
                  <p className="text-[11px] text-muted-foreground">{healthScore >= 75 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Work'}</p>
                </div>
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
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" strokeWidth={1} stroke="rgba(6,10,16,0.8)">
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(10,15,25,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', fontSize: '12px', color: '#e8edf5' }}
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
                      <span className="text-xs text-foreground/80 truncate max-w-[80px]">{c.name}</span>
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
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#cbd5e1' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(10,15,25,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', fontSize: '12px', color: '#e8edf5' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#cbd5e1', paddingTop: '8px' }} />
                    <Area type="monotone" dataKey="income" stroke="#34d399" fill="url(#incomeGrad)" strokeWidth={2.5} name="Income" />
                    <Area type="monotone" dataKey="expense" stroke="#fb7185" fill="url(#expenseGrad)" strokeWidth={2.5} name="Expenses" />
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

      {/* Forecast & Category Trends */}
      {forecast && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatedCard index={9}>
            <Card className="glass border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Spending Forecast
                  <Badge variant="secondary" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-0 ml-auto">AI Powered</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${forecast.trend.direction === 'increasing' ? 'bg-rose-500/10' : forecast.trend.direction === 'decreasing' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                    {forecast.trend.direction === 'increasing' ? <TrendingUp className="w-4 h-4 text-rose-400" /> : forecast.trend.direction === 'decreasing' ? <TrendingDown className="w-4 h-4 text-emerald-400" /> : <Minus className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Spending is {forecast.trend.direction}</p>
                    <p className="text-xs text-muted-foreground">{forecast.trend.percent > 0 ? '+' : ''}{forecast.trend.percent}% vs last month</p>
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastChartData}>
                      <defs>
                        <linearGradient id="fIncGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                        <linearGradient id="fExpGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                      </defs>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#fIncGrad)" strokeWidth={2} name="Income" />
                      <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="url(#fExpGrad)" strokeWidth={2} name="Expenses" strokeDasharray="0" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {forecast.forecast.map((f: any, i: number) => (
                    <div key={i} className="glass rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">{f.month}</p>
                      <p className={`text-sm font-bold ${f.predictedSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(f.predictedSavings)}</p>
                      <p className="text-[10px] text-muted-foreground">net savings</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard index={10}>
            <Card className="glass border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Category Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {forecast.categoryTrends.map((ct: any, i: number) => (
                    <div key={ct.category} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${CATEGORY_COLORS[ct.category] || '#94a3b8'}15` }}>
                        <span className="text-xs font-bold" style={{ color: CATEGORY_COLORS[ct.category] || '#94a3b8' }}>{ct.category[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ct.category}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(ct.current)} this month</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${ct.change > 10 ? 'text-rose-400' : ct.change < -10 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                          {ct.change > 0 ? '+' : ''}{ct.change}%
                        </span>
                        <p className="text-[10px] text-muted-foreground">vs last month</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>
      )}

      {/* Spending Calendar */}
      <AnimatedCard index={11}>
        <SpendingCalendar />
      </AnimatedCard>

      {/* Spending Patterns / Insights */}
      <AnimatedCard index={12}>
        <Card className="glass border-0 card-shine">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
              </div>
              Spending Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingPatterns expenses={expenses} incomes={incomes} />
          </CardContent>
        </Card>
      </AnimatedCard>

      {/* Activity Feed */}
      <AnimatedCard index={13}>
        <ActivityFeed />
      </AnimatedCard>
    </div>
  )
}

function SpendingPatterns({ expenses, incomes }: { expenses: any[]; incomes: any[] }) {
  const patterns = useMemo(() => {
    const now = new Date()
    const thisMonth = expenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const lastMonth = expenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === (now.getMonth() - 1 + 12) % 12 && d.getFullYear() === (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
    })

    const thisTotal = thisMonth.reduce((s, e) => s + e.amount, 0)
    const lastTotal = lastMonth.reduce((s, e) => s + e.amount, 0)
    const changePercent = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0

    // Top spending day of week
    const dayTotals: Record<string, number> = {}
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    expenses.forEach(e => {
      const day = dayNames[new Date(e.date).getDay()]
      dayTotals[day] = (dayTotals[day] || 0) + e.amount
    })
    const topDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]

    // Recurring vs one-time
    const recurring = expenses.filter(e => e.isRecurring).reduce((s, e) => s + e.amount, 0)
    const oneTime = expenses.filter(e => !e.isRecurring).reduce((s, e) => s + e.amount, 0)
    const total = recurring + oneTime
    const recurringPct = total > 0 ? Math.round((recurring / total) * 100) : 0

    // Average transaction size
    const avgTransaction = thisMonth.length > 0 ? thisMonth.reduce((s, e) => s + e.amount, 0) / thisMonth.length : 0

    return { changePercent, topDay, recurringPct, avgTransaction, thisMonthCount: thisMonth.length }
  }, [expenses, incomes])

  const fmt = (n: number) => formatCurrency(n)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="glass-subtle rounded-xl p-3">
        <p className="text-xs text-muted-foreground mb-1">Month-over-Month</p>
        <div className="flex items-center gap-2">
          {patterns.changePercent > 0 ? (
            <TrendingUp className="w-4 h-4 text-rose-400" />
          ) : patterns.changePercent < 0 ? (
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          ) : (
            <Minus className="w-4 h-4 text-amber-400" />
          )}
          <span className={`text-lg font-bold ${patterns.changePercent > 0 ? 'text-rose-400' : patterns.changePercent < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {patterns.changePercent > 0 ? '+' : ''}{patterns.changePercent}%
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{patterns.changePercent > 0 ? 'Spending increased' : patterns.changePercent < 0 ? 'Great! Spending decreased' : 'Spending stable'}</p>
      </div>

      <div className="glass-subtle rounded-xl p-3">
        <p className="text-xs text-muted-foreground mb-1">Biggest Spending Day</p>
        <p className="text-lg font-bold">{patterns.topDay?.[0] || 'N/A'}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{fmt(patterns.topDay?.[1] || 0)} total</p>
      </div>

      <div className="glass-subtle rounded-xl p-3">
        <p className="text-xs text-muted-foreground mb-1">Recurring Expenses</p>
        <p className="text-lg font-bold">{patterns.recurringPct}%</p>
        <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${patterns.recurringPct}%` }} transition={{ duration: 1, delay: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">of total spending</p>
      </div>

      <div className="glass-subtle rounded-xl p-3">
        <p className="text-xs text-muted-foreground mb-1">Avg Transaction</p>
        <p className="text-lg font-bold">{fmt(patterns.avgTransaction)}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{patterns.thisMonthCount} transactions this month</p>
      </div>
    </div>
  )
}