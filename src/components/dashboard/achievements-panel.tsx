'use client'

import { useMemo, useEffect, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Receipt, Target, PiggyBank, Flag, Flame, TrendingDown,
  LayoutGrid, CalendarCheck, ShieldAlert, MessageSquare,
  Download, BarChart3, Lock, Check, Trophy, Sparkles,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AchievementState {
  unlocked: boolean
  unlockedAt?: string
}

interface AchievementDef {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  hexColor: string
  checkProgress: () => number
}

/* ------------------------------------------------------------------ */
/*  Achievement definitions                                            */
/* ------------------------------------------------------------------ */

function buildAchievements(
  expenses: ReturnType<typeof useAppStore.getState>['expenses'],
  incomes: ReturnType<typeof useAppStore.getState>['incomes'],
  budgets: ReturnType<typeof useAppStore.getState>['budgets'],
  goals: ReturnType<typeof useAppStore.getState>['goals'],
  chatMessages: ReturnType<typeof useAppStore.getState>['chatMessages'],
): AchievementDef[] {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const thisMonthExpenses = expenses.filter(e => new Date(e.date) >= thisMonthStart)
  const lastMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date)
    return d >= lastMonthStart && d < thisMonthStart
  })
  const thisMonthIncomes = incomes.filter(i => new Date(i.date) >= thisMonthStart)

  const totalExpensesThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0)
  const totalIncomeThisMonth = thisMonthIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExpensesLastMonth = lastMonthExpenses.reduce((s, e) => s + e.amount, 0)
  const uniqueCategories = new Set(expenses.map(e => e.category))
  const userMsgCount = chatMessages.filter(m => m.role === 'user').length

  const getLoginStreak = (): number => {
    if (typeof window === 'undefined') return 0
    try {
      const raw = localStorage.getItem('finwise-login-days')
      if (!raw) return 0
      const data = JSON.parse(raw) as { days: string[] }
      if (!Array.isArray(data.days)) return 0
      const sorted = [...data.days].sort().reverse()
      if (sorted.length === 0) return 0
      const today = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      if (sorted[0] !== today && sorted[0] !== yesterday) return 0
      let streak = 1
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1])
        const curr = new Date(sorted[i])
        const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)
        if (diffDays === 1) streak++
        else break
      }
      return streak
    } catch {
      return 0
    }
  }

  const loginStreak = getLoginStreak()
  const hasExported = typeof window !== 'undefined'
    ? localStorage.getItem('finwise-export-done') === 'true'
    : false
  const hasViewedReports = typeof window !== 'undefined'
    ? localStorage.getItem('finwise-reports-viewed') === 'true'
    : false

  return [
    {
      id: 'first-transaction',
      name: 'First Transaction',
      description: 'Record your first expense',
      icon: Receipt,
      color: 'emerald',
      hexColor: '#34d399',
      checkProgress: () => (expenses.length > 0 ? 1 : 0),
    },
    {
      id: 'budget-master',
      name: 'Budget Master',
      description: 'Stay under all budgets for a month',
      icon: ShieldAlert,
      color: 'cyan',
      hexColor: '#22d3ee',
      checkProgress: () => {
        if (budgets.length === 0) return 0
        const allUnder = budgets.every(b => b.spent <= b.limit)
        return allUnder ? 1 : budgets.filter(b => b.spent <= b.limit).length / budgets.length
      },
    },
    {
      id: 'savings-streak',
      name: 'Savings Streak',
      description: '3+ months positive net savings',
      icon: Flame,
      color: 'amber',
      hexColor: '#fbbf24',
      checkProgress: () => {
        let positiveMonths = 0
        for (let m = 0; m < 3; m++) {
          const mStart = new Date(now.getFullYear(), now.getMonth() - m, 1)
          const mEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 1)
          const mExp = expenses.filter(e => { const d = new Date(e.date); return d >= mStart && d < mEnd }).reduce((s, e) => s + e.amount, 0)
          const mInc = incomes.filter(i => { const d = new Date(i.date); return d >= mStart && d < mEnd }).reduce((s, i) => s + i.amount, 0)
          if (mInc - mExp > 0) positiveMonths++
        }
        return Math.min(positiveMonths / 3, 1)
      },
    },
    {
      id: 'goal-getter',
      name: 'Goal Getter',
      description: 'Complete your first goal',
      icon: Flag,
      color: 'violet',
      hexColor: '#a78bfa',
      checkProgress: () => {
        const completed = goals.find(g => g.currentAmount >= g.targetAmount)
        if (completed) return 1
        if (goals.length === 0) return 0
        const best = goals.reduce((max, g) => Math.max(max, g.currentAmount / g.targetAmount), 0)
        return Math.min(best, 0.99)
      },
    },
    {
      id: 'super-saver',
      name: 'Super Saver',
      description: 'Savings rate above 30%',
      icon: PiggyBank,
      color: 'emerald',
      hexColor: '#10b981',
      checkProgress: () => {
        if (totalIncomeThisMonth === 0) return 0
        const savingsRate = (totalIncomeThisMonth - totalExpensesThisMonth) / totalIncomeThisMonth
        return Math.max(0, Math.min(savingsRate / 0.3, 1))
      },
    },
    {
      id: 'frugal-fighter',
      name: 'Frugal Fighter',
      description: 'Spending decreased 20%+ vs last month',
      icon: TrendingDown,
      color: 'rose',
      hexColor: '#fb7185',
      checkProgress: () => {
        if (totalExpensesLastMonth === 0) return 0
        const decrease = (totalExpensesLastMonth - totalExpensesThisMonth) / totalExpensesLastMonth
        return Math.max(0, Math.min(decrease / 0.2, 1))
      },
    },
    {
      id: 'diversified',
      name: 'Diversified',
      description: 'Transactions in 5+ categories',
      icon: LayoutGrid,
      color: 'cyan',
      hexColor: '#06b6d4',
      checkProgress: () => Math.min(uniqueCategories.size / 5, 1),
    },
    {
      id: 'consistent',
      name: 'Consistent',
      description: 'Login 3+ consecutive days',
      icon: CalendarCheck,
      color: 'amber',
      hexColor: '#f59e0b',
      checkProgress: () => Math.min(loginStreak / 3, 1),
    },
    {
      id: 'big-spender-awareness',
      name: 'Big Spender Awareness',
      description: 'Set 3+ budgets',
      icon: Target,
      color: 'rose',
      hexColor: '#f43f5e',
      checkProgress: () => Math.min(budgets.length / 3, 1),
    },
    {
      id: 'chat-buddy',
      name: 'Chat Buddy',
      description: 'Send 5+ AI coach messages',
      icon: MessageSquare,
      color: 'violet',
      hexColor: '#8b5cf6',
      checkProgress: () => Math.min(userMsgCount / 5, 1),
    },
    {
      id: 'export-expert',
      name: 'Export Expert',
      description: 'Export your data at least once',
      icon: Download,
      color: 'emerald',
      hexColor: '#4ade80',
      checkProgress: () => (hasExported ? 1 : 0),
    },
    {
      id: 'data-driven',
      name: 'Data Driven',
      description: 'View the reports page',
      icon: BarChart3,
      color: 'cyan',
      hexColor: '#38bdf8',
      checkProgress: () => (hasViewedReports ? 1 : 0),
    },
  ]
}

/* ------------------------------------------------------------------ */
/*  Color helpers                                                      */
/* ------------------------------------------------------------------ */

const colorMap: Record<string, { bg: string; text: string; ring: string; glow: string }> = {
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', ring: 'ring-emerald-500/30', glow: '0 0 20px rgba(16,185,129,0.3)' },
  cyan:    { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    ring: 'ring-cyan-500/30',    glow: '0 0 20px rgba(6,182,212,0.3)' },
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-400',   ring: 'ring-amber-500/30',   glow: '0 0 20px rgba(245,158,11,0.3)' },
  violet:  { bg: 'bg-violet-500/15',  text: 'text-violet-400',  ring: 'ring-violet-500/30',  glow: '0 0 20px rgba(139,92,246,0.3)' },
  rose:    { bg: 'bg-rose-500/15',    text: 'text-rose-400',    ring: 'ring-rose-500/30',    glow: '0 0 20px rgba(244,63,94,0.3)' },
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'finwise-achievements'

function loadAchievementStates(): Record<string, AchievementState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// Module-level set to track toasts shown this session (survives across renders, not in localStorage)
const sessionToasted = new Set<string>()

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AchievementsPanel() {
  const { expenses, incomes, budgets, goals, chatMessages } = useAppStore()

  // Load saved states once from localStorage
  const [savedStates] = useState<Record<string, AchievementState>>(() => loadAchievementStates())

  const achievements = buildAchievements(expenses, incomes, budgets, goals, chatMessages)

  // Pure derivation: merge saved states with condition checks
  const states = useMemo(() => {
    const merged = { ...savedStates }
    for (const ach of achievements) {
      if (merged[ach.id]?.unlocked) continue
      if (ach.checkProgress() >= 1) {
        merged[ach.id] = { unlocked: true, unlockedAt: new Date().toISOString() }
      }
    }
    return merged
  }, [savedStates, achievements])

  // Side-effect only: persist & toast (no setState)
  useEffect(() => {
    const newUnlocks: string[] = []
    for (const ach of achievements) {
      const wasSaved = savedStates[ach.id]?.unlocked
      const isNow = states[ach.id]?.unlocked
      if (isNow && !wasSaved) {
        newUnlocks.push(ach.id)
      }
    }

    if (newUnlocks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(states))
    }

    for (const id of newUnlocks) {
      if (sessionToasted.has(id)) continue
      sessionToasted.add(id)
      const ach = achievements.find(a => a.id === id)
      if (ach) {
        toast.success(`🏆 Achievement Unlocked: ${ach.name}`, {
          description: ach.description,
          duration: 4000,
        })
      }
    }
    }, [states])

  const unlockedCount = achievements.filter(a => states[a.id]?.unlocked).length
  const totalCount = achievements.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-sm font-semibold">Achievements</span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.span
            className="text-xs font-bold text-amber-400"
            key={unlockedCount}
            initial={{ scale: 1.3, color: '#fbbf24' }}
            animate={{ scale: 1, color: '#fbbf24' }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {unlockedCount}/{totalCount}
          </motion.span>
          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
        <AnimatePresence mode="popLayout">
          {achievements.map((ach, idx) => {
            const isUnlocked = !!states[ach.id]?.unlocked
            const progress = ach.checkProgress()
            const colors = colorMap[ach.color] ?? colorMap.emerald
            const Icon = ach.icon

            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: idx * 0.04, ease: 'easeOut' }}
                className={`relative group rounded-xl p-3 transition-all duration-300 cursor-default ${
                  isUnlocked
                    ? 'achievement-unlocked glass-subtle border border-white/10 hover:border-white/20'
                    : 'achievement-locked glass-subtle'
                }`}
                style={
                  isUnlocked
                    ? { boxShadow: colors.glow }
                    : undefined
                }
              >
                {/* Checkmark overlay for unlocked */}
                <AnimatePresence>
                  {isUnlocked && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center z-10"
                    >
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-start gap-2.5">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isUnlocked ? `${colors.bg}` : 'bg-white/5'
                    }`}
                  >
                    {isUnlocked ? (
                      <Icon className={`w-4.5 h-4.5 ${colors.text}`} />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-tight truncate ${
                      isUnlocked ? 'text-foreground' : 'text-muted-foreground/60'
                    }`}>
                      {ach.name}
                    </p>
                    <p className={`text-[10px] mt-0.5 leading-snug line-clamp-2 ${
                      isUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/40'
                    }`}>
                      {ach.description}
                    </p>

                    {/* Progress bar */}
                    {!isUnlocked && (
                      <div className="mt-2">
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round(progress * 100)}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.04 + 0.2 }}
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${ach.hexColor}66, ${ach.hexColor})`,
                            }}
                          />
                        </div>
                        <p className="text-[9px] text-muted-foreground/40 mt-0.5 text-right">
                          {Math.round(progress * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}