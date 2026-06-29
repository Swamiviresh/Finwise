'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { format, isSameDay } from 'date-fns'

function useFinancialAlerts() {
  const { expenses, budgets, goals } = useAppStore()
  const shownAlerts = useRef(new Set<string>())

  useEffect(() => {
    // Budget alerts: category at >90% of limit
    if (budgets.length > 0) {
      for (const budget of budgets) {
        const pct = budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0
        if (pct >= 90) {
          const alertKey = `budget-${budget.id}`
          if (!shownAlerts.current.has(alertKey)) {
            shownAlerts.current.add(alertKey)
            toast({
              title: `Budget Alert: ${budget.category} at ${pct}%`,
              description: `You've used $${budget.spent.toLocaleString()} of $${budget.limit.toLocaleString()} limit.`,
              variant: 'destructive',
            })
          }
        }
      }
    }

    // Goal achieved alerts
    if (goals.length > 0) {
      for (const goal of goals) {
        if (goal.currentAmount >= goal.targetAmount) {
          const alertKey = `goal-achieved-${goal.id}`
          if (!shownAlerts.current.has(alertKey)) {
            shownAlerts.current.add(alertKey)
            toast({
              title: `Goal Achieved! ${goal.title} target reached!`,
              description: `You've saved $${goal.currentAmount.toLocaleString()} — congratulations! 🎉`,
            })
          }
        }
      }
    }

    // High daily spending: expenses over $500 in a single day
    if (expenses.length > 0) {
      const dailyTotals = new Map<string, number>()
      for (const expense of expenses) {
        const dayKey = format(new Date(expense.date), 'yyyy-MM-dd')
        dailyTotals.set(dayKey, (dailyTotals.get(dayKey) || 0) + expense.amount)
      }

      for (const [dayKey, total] of dailyTotals) {
        if (total > 500) {
          const alertKey = `daily-spend-${dayKey}`
          if (!shownAlerts.current.has(alertKey)) {
            shownAlerts.current.add(alertKey)
            const isToday = isSameDay(new Date(dayKey), new Date())
            toast({
              title: `High Spending Alert`,
              description: `${isToday ? 'Today' : format(new Date(dayKey), 'MMM d')}: $${total.toLocaleString()} in expenses.`,
            })
          }
        }
      }
    }
  }, [expenses, budgets, goals])
}

export default function NotificationToasts() {
  useFinancialAlerts()

  return <Toaster />
}