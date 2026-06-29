'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Wallet, Heart, Lightbulb, ArrowUpRight, ArrowDownRight, ChevronRight, AlertTriangle, Sparkles, Minus, BarChart3, Sun, Moon, CloudSun, Plus, PieChart as PieChartIcon, Target, Activity, Goal } from 'lucide-react'
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns'
import HealthScoreRing from './health-score-ring'
import ActivityFeed from './activity-feed'
import SpendingCalendar from './spending-calendar'
import NetWorthTracker from './net-worth-tracker'
import SmartInsights from './smart-insights'
import AchievementsPanel from './achievements-panel'
import CurrencyWidget from './currency-widget'

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#34d399', Rent: '#22d3ee', Shopping: '#fbbf24', Healthcare: '#fb7185',
  Education: '#a78bfa', Transportation: '#38bdf8', Entertainment: '#f97316',
  Utilities: '#2dd4bf', Investments: '#4ade80', Insurance: '#c084fc',
  Subscriptions: '#f472b6', Others: '#94a3b8'
}

const AI_TIPS = [
  { text: 'You spent 15% more on dining out this month. Consider meal prepping to save.', icon: '🍽️' },
  { text: 'Great job! Your savings rate is above the recommended 20% threshold.', icon: '💪' },
  { text: "You have 3 subscriptions you haven't used this month. Consider canceling them.", icon: '💡' },
  { text: 'Your emergency fund is on track. Keep it up!', icon: '🛡️' },
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

function AnimatedCard({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.div variants={itemVariants} initial="hidden" animate="show" transition={{ duration: 0.4, delay: index * 0.06 }}>
      {children}
    </motion.div>
  )
}

// Custom tooltip component for charts
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass border border-white/10 rounded-xl px-3 py-2.5 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1.5 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-foreground/70">{entry.name}:</span>
          <span className="font-semibold text-foreground">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user, expenses, incomes, budgets, goals, setExpenses, setIncomes, setBudgets, healthScore, setHealthScore, setView, setLoading } = useAppStore()
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
  const hour = now.getHours()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Time-based greeting helpers
  const GreetingIcon = hour < 12 ? Sun : hour < 18 ? CloudSun : Moon
  const greetingIconColor = hour < 12 ? 'text-amber-400' : hour < 18 ? 'text-emerald-400' : 'text-violet-400'
  const greetingIconBg = hour < 12 ? 'from-amber-500/20 to-orange-500/10' : hour < 18 ? 'from-emerald-500/20 to-cyan-500/10' : 'from-violet-500/20 to-indigo-500/10'
  const greetingText = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const greetingSubtext = hour < 12
    ? "Here's your financial overview for today. Start strong!"
    : hour < 18
      ? "Midday check — here's how your finances are looking."
      : "End of day summary. Review your spending and plan ahead."

  // Motivational tagline based on financial health
  const motivationalTagline = useMemo(() => {
    if (healthScore >= 80) return "Your finances are in great shape — keep it up! 🚀"
    if (healthScore >= 60) return "Solid progress! A few tweaks and you'll be thriving. 💪"
    if (healthScore >= 40) return "Room for improvement. Let's build better habits. 🌱"
    return "Let's turn things around. Every step counts. 🎯"
  }, [healthScore])

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

  // Previous month data for sparkline percentage changes
  const prevMonthData = useMemo(() => {
    const prev = subMonths(now, 1)
    const pStart = startOfMonth(prev)
    const pEnd = endOfMonth(prev)
    const pExp = expenses.filter(e => isWithinInterval(new Date(e.date), { start: pStart, end: pEnd })).reduce((s, e) => s + e.amount, 0)
    const pInc = incomes.filter(i => isWithinInterval(new Date(i.date), { start: pStart, end: pEnd })).reduce((s, i) => s + i.amount, 0)
    return { expenses: pExp, incomes: pInc, savings: pInc - pExp }
  }, [expenses, incomes, now])

  const incomeChange = prevMonthData.incomes > 0 ? Math.round(((totalIncome - prevMonthData.incomes) / prevMonthData.incomes) * 100) : 0
  const expenseChange = prevMonthData.expenses > 0 ? Math.round(((totalExpense - prevMonthData.expenses) / prevMonthData.expenses) * 100) : 0
  const savingsChange = prevMonthData.savings !== 0 ? Math.round(((netSavings - prevMonthData.savings) / Math.abs(prevMonthData.savings)) * 100) : 0

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

  // Financial snapshot stats
  const financialSnapshot = useMemo(() => {
    const totalBalance = totalIncome - totalExpense
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0
    const budgetUtilization = budgets.length > 0
      ? Math.round(budgets.reduce((s, b) => s + (b.spent / b.limit), 0) / budgets.length * 100)
      : 0
    const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount).length
    return { totalBalance, savingsRate, budgetUtilization, activeGoals }
  }, [totalIncome, totalExpense, budgets, goals])

  const forecastChartData = useMemo(() => {
    if (!forecast) return []
    return [
      ...forecast.historical,
      ...forecast.forecast.map((f: any) => ({ month: f.month, income: f.predictedIncome, expenses: f.predictedExpense })),
    ]
  }, [forecast])

  // Quick action buttons
  const quickActions = [
    { label: 'Add Expense', icon: Plus, view: 'expenses' as const, color: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:border-emerald-500/30', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
    { label: 'Set Budget', icon: PieChartIcon, view: 'budgets' as const, color: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-500/30', iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400' },
    { label: 'New Goal', icon: Target, view: 'goals' as const, color: 'hover:shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:border-violet-500/30', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400' },
    { label: 'Ask AI', icon: Sparkles, view: 'ai-coach' as const, color: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:border-amber-500/30', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
  ]

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-28 rounded-full" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      {/* ── LEFT COLUMN (8 cols) ── */}
      <div className="lg:col-span-8 space-y-6">

        {/* ── 1. Greeting Section ── */}
        <motion.div
          variants={itemVariants}
          className="relative glass rounded-2xl p-6 overflow-hidden shimmer-border"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-violet-500/5 pointer-events-none" style={{ animation: 'gradientShift 15s ease infinite', backgroundSize: '200% 200%' }} />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${greetingIconBg} flex items-center justify-center shadow-lg`}
              >
                <GreetingIcon className={`w-7 h-7 ${greetingIconColor}`} />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">
                  {greetingText},{' '}
                  <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span>
                </h2>
                <p className="text-sm text-secondary mt-0.5">{greetingSubtext}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-2">
                <div className="pulse-dot" />
                <span className="text-xs text-secondary font-medium">Live</span>
              </div>
              <p className="text-xs text-emerald-400 italic text-right max-w-[200px] leading-relaxed">
                {motivationalTagline}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── 2. Quick Actions ── */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={() => setView(action.view)}
                className={`
                  glass-subtle flex items-center gap-2.5 px-5 py-2.5 rounded-full
                  border border-white/[0.06] text-sm font-medium text-foreground/80
                  transition-all duration-300 group
                  ${action.color}
                  hover:text-foreground
                `}
              >
                <div className={`w-7 h-7 rounded-lg ${action.iconBg} flex items-center justify-center
                  group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-3.5 h-3.5 ${action.iconColor}`} />
                </div>
                <span>{action.label}</span>
              </button>
            )
          })}
        </motion.div>

        {/* ── 3. Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <AnimatedCard index={0}>
            <Card className="glass border-0 card-hover card-shine glass-accent-top" style={{ '--accent-color': '#34d399' } as React.CSSProperties}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className={`text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full ${
                    incomeChange >= 0
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-rose-400 bg-rose-500/10'
                  }`}>
                    {incomeChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(incomeChange)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold mt-1 counter-animate number-tick text-foreground">{formatCurrency(totalIncome)}</p>
                <p className="text-[11px] text-tertiary mt-1.5 font-medium">vs last month</p>
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
                  <span className={`text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full ${
                    expenseChange <= 0
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-rose-400 bg-rose-500/10'
                  }`}>
                    {expenseChange <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {Math.abs(expenseChange)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold mt-1 counter-animate number-tick text-foreground">{formatCurrency(totalExpense)}</p>
                <p className="text-[11px] text-tertiary mt-1.5 font-medium">vs last month</p>
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
                  <span className={`text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full ${
                    savingsChange >= 0
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-rose-400 bg-rose-500/10'
                  }`}>
                    {savingsChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(savingsChange)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Net Savings</p>
                <p className="text-2xl font-bold mt-1 counter-animate number-tick text-foreground">{formatCurrency(netSavings)}</p>
                <p className="text-[11px] text-tertiary mt-1.5 font-medium">vs last month</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard index={3}>
            <Card className="glass border-0 card-hover card-shine glass-accent-top" style={{ '--accent-color': '#a78bfa' } as React.CSSProperties}>
              <CardContent className="p-5 flex items-center gap-4">
                <HealthScoreRing score={healthScore} size={68} strokeWidth={5} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-tertiary uppercase tracking-wider font-medium">Health Score</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">Financial Health</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="pulse-dot" />
                    <p className="text-xs text-secondary">{healthScore >= 75 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Work'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

        {/* ── 4. Financial Snapshot Card ── */}
        <AnimatedCard index={4}>
          <Card className="glass border-0 glow-border-emerald">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Financial Snapshot</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-white/[0.06]">
                <div className="px-4 first:pl-0 last:pr-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <p className="text-xs text-muted-foreground">Total Balance</p>
                  </div>
                  <p className={`text-xl font-bold ${financialSnapshot.totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(financialSnapshot.totalBalance)}
                  </p>
                </div>
                <div className="px-4 first:pl-0 last:pr-0">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <p className="text-xs text-muted-foreground">Savings Rate</p>
                  </div>
                  <p className="text-xl font-bold text-cyan-400">
                    {financialSnapshot.savingsRate}%
                  </p>
                </div>
                <div className="px-4 first:pl-0 last:pr-0">
                  <div className="flex items-center gap-2 mb-2">
                    <PieChartIcon className="w-4 h-4 text-amber-400" />
                    <p className="text-xs text-muted-foreground">Budget Used</p>
                  </div>
                  <p className={`text-xl font-bold ${financialSnapshot.budgetUtilization > 80 ? 'text-rose-400' : financialSnapshot.budgetUtilization > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {financialSnapshot.budgetUtilization}%
                  </p>
                </div>
                <div className="px-4 first:pl-0 last:pr-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-violet-400" />
                    <p className="text-xs text-muted-foreground">Active Goals</p>
                  </div>
                  <p className="text-xl font-bold text-violet-400">
                    {financialSnapshot.activeGoals}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* ── 5. Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatedCard index={5}>
            <Card className="glass border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <div className="w-1/2 h-56 relative">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 pointer-events-none" />
                  <div className="relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" strokeWidth={1} stroke="rgba(6,10,16,0.8)">
                          {categoryData.map((entry, i) => (
                            <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={<CustomTooltip />}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="w-1/2 space-y-2.5 max-h-56 overflow-y-auto pr-2 scroll-fade-bottom">
                  {categoryData.map(c => (
                    <div key={c.name} className="flex items-center justify-between text-sm group cursor-default">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white/5" style={{ background: CATEGORY_COLORS[c.name] || '#94a3b8' }} />
                        <span className="text-xs text-foreground/80 truncate max-w-[100px] group-hover:text-foreground transition-colors" title={c.name}>{c.name}</span>
                      </div>
                      <span className="font-medium text-xs tabular-nums text-foreground/90">{formatCurrency(c.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard index={6}>
            <Card className="glass border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  Monthly Trend
                </CardTitle>
                {/* Custom legend */}
                <div className="flex items-center gap-4 ml-auto">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-muted-foreground">Income</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="text-[11px] text-muted-foreground">Expenses</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-56 relative">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/5 to-violet-500/5 pointer-events-none" />
                  <div className="relative">
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
                          content={<CustomTooltip />}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Area type="monotone" dataKey="income" stroke="#34d399" fill="url(#incomeGrad)" strokeWidth={2.5} name="Income" />
                        <Area type="monotone" dataKey="expense" stroke="#fb7185" fill="url(#expenseGrad)" strokeWidth={2.5} name="Expenses" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

        {/* ── 6. Net Worth Tracker ── */}
        <AnimatedCard index={7}>
          <NetWorthTracker />
        </AnimatedCard>

        {/* ── 7. Forecast & Category Trends ── */}
        {forecast && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AnimatedCard index={8}>
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
                  <div className="h-48 relative">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/3 to-rose-500/3 pointer-events-none" />
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

            <AnimatedCard index={9}>
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

        {/* ── 8. Recent Transactions + Active Budgets + AI Insights ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Transactions */}
          <AnimatedCard index={10}>
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
                    <Popover key={e.id}>
                      <PopoverTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-lg p-2 -mx-2 transition-colors">
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
                      </PopoverTrigger>
                      <PopoverContent className="glass border-0 w-72 p-4">
                        <div className="space-y-3">
                          <p className="font-bold text-base">{e.title}</p>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[e.category] || '#94a3b8' }} />
                            <span className="text-sm text-foreground/80">{e.category}</span>
                            {e.isRecurring && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-400 ml-auto">Recurring</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{format(new Date(e.date), 'MMMM d, yyyy')}</p>
                          <p className="text-2xl font-bold text-rose-400">-{formatCurrency(e.amount)}</p>
                          <p className="text-sm text-muted-foreground">{e.description || 'No description'}</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>

          {/* Active Budgets */}
          <AnimatedCard index={11}>
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
          <AnimatedCard index={12}>
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

        {/* ── 9. Spending Patterns ── */}
        <AnimatedCard index={13}>
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

        {/* ── 10. Activity Feed ── */}
        <AnimatedCard index={14}>
          <ActivityFeed />
        </AnimatedCard>
      </div>

      {/* ── RIGHT COLUMN (4 cols) ── */}
      <div className="lg:col-span-4 space-y-6">
        {/* Health Score */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <Heart className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                Financial Health
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-4">
              <HealthScoreRing score={healthScore} size={120} strokeWidth={8} />
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-foreground">
                  {healthScore >= 75 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Improvement'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {healthScore >= 75 ? 'Your finances are in great shape!' : healthScore >= 60 ? 'Solid foundation, keep it up.' : healthScore >= 40 ? 'Some areas need attention.' : 'Focus on reducing expenses.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Smart Insights */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                Smart Insights
                <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-0 ml-auto">AI Powered</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SmartInsights compact />
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements */}
        <AnimatedCard index={10}>
          <Card className="glass border-0">
            <CardContent className="pt-5">
              <AchievementsPanel />
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Spending Calendar */}
        <motion.div variants={itemVariants}>
          <SpendingCalendar />
        </motion.div>

        {/* Budget Status Mini */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <PieChartIcon className="w-3.5 h-3.5 text-amber-400" />
                </div>
                Budget Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No budgets set</p>
                ) : (
                  budgets.slice(0, 5).map(b => {
                    const pct = Math.round((b.spent / b.limit) * 100)
                    const color = pct > 90 ? '#f43f5e' : pct > 70 ? '#f59e0b' : '#10b981'
                    const statusLabel = pct > 100 ? 'Over budget!' : pct > 90 ? 'Almost there' : pct > 70 ? 'Getting close' : 'On track'
                    return (
                      <div key={b.id} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                            <span className="text-xs font-medium">{b.category}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{formatCurrency(b.spent)} / {formatCurrency(b.limit)}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct, 100)}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
                          />
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color }}>{statusLabel}</p>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Currency Widget */}
        <motion.div variants={itemVariants}>
          <CurrencyWidget
            currentCurrency={user?.currency || 'USD'}
            balance={netSavings}
          />
        </motion.div>
      </div>
    </motion.div>
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