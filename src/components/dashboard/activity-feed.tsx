'use client'

import { useMemo, useState } from 'react'
import { useAppStore, type Expense, type Income } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Repeat, ChevronDown, Inbox } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isToday, isYesterday, startOfDay, parseISO } from 'date-fns'

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#34d399', Rent: '#22d3ee', Shopping: '#fbbf24', Healthcare: '#fb7185',
  Education: '#a78bfa', Transportation: '#38bdf8', Entertainment: '#f97316',
  Utilities: '#2dd4bf', Investments: '#4ade80', Insurance: '#c084fc',
  Subscriptions: '#f472b6', Others: '#94a3b8'
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount)
}

interface ActivityItem {
  id: string
  type: 'expense' | 'income'
  title: string
  category: string
  amount: number
  date: Date
  time: string
  isRecurring: boolean
}

function formatDayLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

function formatTime(date: Date): string {
  return format(date, 'h:mm a')
}

export default function ActivityFeed() {
  const { expenses, incomes } = useAppStore()
  const [visibleCount, setVisibleCount] = useState(15)

  const groupedActivities = useMemo(() => {
    const items: ActivityItem[] = [
      ...expenses.map((e: Expense) => ({
        id: e.id,
        type: 'expense' as const,
        title: e.title,
        category: e.category,
        amount: e.amount,
        date: parseISO(e.date),
        time: formatTime(parseISO(e.date)),
        isRecurring: e.isRecurring,
      })),
      ...incomes.map((i: Income) => ({
        id: i.id,
        type: 'income' as const,
        title: i.title,
        category: i.source,
        amount: i.amount,
        date: parseISO(i.date),
        time: formatTime(parseISO(i.date)),
        isRecurring: i.isRecurring,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime())

    // Group by day
    const groups: { label: string; dateKey: string; items: ActivityItem[] }[] = []
    let currentGroup: { label: string; dateKey: string; items: ActivityItem[] } | null = null

    for (const item of items) {
      const dayStart = startOfDay(item.date)
      const dateKey = dayStart.toISOString()
      const label = formatDayLabel(item.date)

      if (!currentGroup || currentGroup.dateKey !== dateKey) {
        currentGroup = { label, dateKey, items: [] }
        groups.push(currentGroup)
      }
      currentGroup.items.push(item)
    }

    return groups
  }, [expenses, incomes])

  // Flatten for "load more" pagination
  const flatItems = useMemo(() => {
    return groupedActivities.flatMap(g => g.items)
  }, [groupedActivities])

  const hasMore = flatItems.length > visibleCount

  // Get grouped items up to visibleCount
  const visibleGroups = useMemo(() => {
    let count = 0
    return groupedActivities
      .map(g => {
        if (count >= visibleCount) return null
        const remaining = visibleCount - count
        const items = g.items.slice(0, remaining)
        count += items.length
        return { ...g, items }
      })
      .filter(Boolean) as typeof groupedActivities
  }, [groupedActivities, visibleCount])

  const totalItems = flatItems.length

  if (totalItems === 0) {
    return (
      <Card className="glass border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyan-500/10 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground/80">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your financial activity will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cyan-500/10 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          Activity Feed
          <Badge variant="secondary" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-0 ml-auto">
            {totalItems} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[480px] overflow-y-auto scroll-fade-bottom pr-1 space-y-1">
          <AnimatePresence mode="popLayout">
            {visibleGroups.map((group) => (
              <div key={group.dateKey}>
                {/* Day label */}
                <div className="sticky top-0 z-10 bg-transparent py-2">
                  <span className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>

                {/* Items for this day */}
                <div className="space-y-1">
                  {group.items.map((item, idx) => {
                    const color = CATEGORY_COLORS[item.category] || '#94a3b8'
                    const globalIdx = flatItems.findIndex(fi => fi.id === item.id)
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(globalIdx * 0.03, 0.6) }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                      >
                        {/* Category icon */}
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${color}18` }}
                        >
                          <span className="text-xs font-bold" style={{ color }}>
                            {item.category[0]}
                          </span>
                        </div>

                        {/* Title + meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            {item.isRecurring && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                                <Repeat className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4 border-0"
                              style={{
                                background: `${color}15`,
                                color
                              }}
                            >
                              {item.category}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">{item.time}</span>
                          </div>
                        </div>

                        {/* Amount */}
                        <span
                          className={`text-sm font-semibold shrink-0 tabular-nums ${
                            item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisibleCount(prev => prev + 15)}
              className="text-xs text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <ChevronDown className="w-3.5 h-3.5 mr-1" />
              Load more ({totalItems - visibleCount} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}