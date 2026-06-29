'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns'
import {
  PiggyBank,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Target,
  Repeat,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

interface Insight {
  icon: LucideIcon
  emoji?: string
  title: string
  metric: string
  description: string
  status: 'emerald' | 'amber' | 'rose'
}

const statusStyles = {
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    progress: 'bg-emerald-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    progress: 'bg-amber-400',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    progress: 'bg-rose-400',
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

interface SmartInsightsProps {
  compact?: boolean
}

export default function SmartInsights({ compact = false }: SmartInsightsProps) {
  const { expenses, incomes, budgets, goals } = useAppStore()

  const insights = useMemo<Insight[]>(() => {
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const lastMonth = subMonths(now, 1)
    const lastMonthStart = startOfMonth(lastMonth)
    const lastMonthEnd = endOfMonth(lastMonth)

    // ---- 1. Savings Rate ----
    const thisExpenses = expenses.filter(e =>
      isWithinInterval(new Date(e.date), { start: thisMonthStart, end: thisMonthEnd })
    )
    const thisIncomes = incomes.filter(i =>
      isWithinInterval(new Date(i.date), { start: thisMonthStart, end: thisMonthEnd })
    )
    const totalThisExp = thisExpenses.reduce((s, e) => s + e.amount, 0)
    const totalThisInc = thisIncomes.reduce((s, i) => s + i.amount, 0)
    const savingsRate = totalThisInc > 0 ? Math.round(((totalThisInc - totalThisExp) / totalThisInc) * 100) : 0

    // ---- 2. Top Spending Category ----
    const catMap: Record<string, number> = {}
    thisExpenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount })
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]
    const topCatPct = totalThisExp > 0 && topCat ? Math.round((topCat[1] / totalThisExp) * 100) : 0

    // ---- 3. Budget Health ----
    const overBudget = budgets.filter(b => (b.spent / b.limit) > 1).length
    const nearLimit = budgets.filter(b => {
      const pct = b.spent / b.limit
      return pct > 0.8 && pct <= 1
    }).length
    const atRisk = overBudget + nearLimit

    // ---- 4. Income vs Expenses Trend ----
    const lastExpenses = expenses.filter(e =>
      isWithinInterval(new Date(e.date), { start: lastMonthStart, end: lastMonthEnd })
    )
    const lastIncomes = incomes.filter(i =>
      isWithinInterval(new Date(i.date), { start: lastMonthStart, end: lastMonthEnd })
    )
    const totalLastExp = lastExpenses.reduce((s, e) => s + e.amount, 0)
    const totalLastInc = lastIncomes.reduce((s, i) => s + i.amount, 0)
    const netThisMonth = totalThisInc - totalThisExp
    const netLastMonth = totalLastInc - totalLastExp
    const netChangePct = netLastMonth !== 0
      ? Math.round(((netThisMonth - netLastMonth) / Math.abs(netLastMonth)) * 100)
      : 0

    // ---- 5. Goal Progress ----
    const goalProgress = goals.length > 0
      ? [...goals].sort((a, b) =>
          (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount)
        )[0]
      : null
    const goalPct = goalProgress
      ? Math.round((goalProgress.currentAmount / goalProgress.targetAmount) * 100)
      : 0

    // ---- 6. Recurring Cost Ratio ----
    const recurringExp = thisExpenses.filter(e => e.isRecurring).reduce((s, e) => s + e.amount, 0)
    const recurringPct = totalThisExp > 0 ? Math.round((recurringExp / totalThisExp) * 100) : 0

    const result: Insight[] = []

    // 1. Savings Rate
    result.push({
      icon: PiggyBank,
      title: 'Savings Rate',
      metric: `${savingsRate}%`,
      description:
        savingsRate >= 20
          ? 'Great job! Above the recommended 20% threshold.'
          : savingsRate >= 10
            ? 'On track, but aim for 20% or more.'
            : savingsRate >= 0
              ? 'Below target. Review discretionary spending.'
              : 'Negative savings — spending exceeds income.',
      status: savingsRate >= 20 ? 'emerald' : savingsRate >= 10 ? 'amber' : 'rose',
    })

    // 2. Top Spending Category
    if (topCat) {
      result.push({
        icon: ShoppingCart,
        title: 'Top Spending Category',
        metric: `${topCat[0]} · ${formatCurrency(topCat[1])}`,
        description: `Accounts for ${topCatPct}% of this month's spending.`,
        status: topCatPct >= 40 ? 'rose' : topCatPct >= 25 ? 'amber' : 'emerald',
      })
    }

    // 3. Budget Health
    if (budgets.length > 0) {
      result.push({
        icon: AlertTriangle,
        title: 'Budget Alert',
        metric: overBudget > 0
          ? `${overBudget} over limit`
          : atRisk > 0
            ? `${atRisk} near limit`
            : 'All on track',
        description: overBudget > 0
          ? `${overBudget} budget${overBudget > 1 ? 's' : ''} exceeded. Review spending immediately.`
          : atRisk > 0
            ? `${nearLimit} budget${nearLimit > 1 ? 's' : ''} over 80% utilized.`
            : `All ${budgets.length} budgets are within healthy limits.`,
        status: overBudget > 0 ? 'rose' : atRisk > 0 ? 'amber' : 'emerald',
      })
    }

    // 4. Income vs Expenses Trend
    result.push({
      icon: TrendingUp,
      title: 'Income vs Expenses',
      metric: `${netChangePct > 0 ? '+' : ''}${netChangePct}%`,
      description: netChangePct > 0
        ? 'Net savings improved compared to last month.'
        : netChangePct < 0
          ? 'Net savings decreased compared to last month.'
          : 'Net savings unchanged from last month.',
      status: netChangePct > 5 ? 'emerald' : netChangePct < -5 ? 'rose' : 'amber',
    })

    // 5. Goal Progress
    if (goalProgress) {
      result.push({
        icon: Target,
        title: 'Goal Progress',
        metric: `${goalPct}% · ${goalProgress.title}`,
        description: goalPct >= 90
          ? 'Almost there! Keep pushing to the finish line.'
          : goalPct >= 50
            ? 'Solid progress — stay consistent.'
            : 'Early stage. Consider increasing contributions.',
        status: goalPct >= 75 ? 'emerald' : goalPct >= 40 ? 'amber' : 'rose',
      })
    }

    // 6. Recurring Cost Ratio
    result.push({
      icon: Repeat,
      title: 'Recurring Costs',
      metric: `${recurringPct}%`,
      description: recurringPct >= 50
        ? 'Over half your spending is recurring. Audit subscriptions.'
        : recurringPct >= 30
          ? 'Moderate recurring load. Review for unused services.'
          : 'Low recurring cost ratio. Good flexibility.',
      status: recurringPct >= 50 ? 'rose' : recurringPct >= 30 ? 'amber' : 'emerald',
    })

    return result
  }, [expenses, incomes, budgets, goals])

  // Savings rate progress bar value (first insight)
  const savingsRateValue = insights.length > 0
    ? parseInt(insights[0].metric) || 0
    : 0

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={compact ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"}
    >
      {insights.map((insight, idx) => {
        const style = statusStyles[insight.status]
        const Icon = insight.icon

        return (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="glass border-0 card-hover p-4 rounded-2xl"
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${style.text}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-secondary">{insight.title}</p>
                <p className="text-sm font-bold mt-0.5 text-foreground">{insight.metric}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {insight.description}
            </p>
            {/* Savings rate gets a progress bar */}
            {idx === 0 && (
              <div className="mt-3">
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.max(savingsRateValue, 0), 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className={`h-full rounded-full ${style.progress}`}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">0%</span>
                  <span className="text-[10px] text-muted-foreground">Target: 20%</span>
                </div>
              </div>
            )}
          </motion.div>
        )
      })}
    </motion.div>
  )
}