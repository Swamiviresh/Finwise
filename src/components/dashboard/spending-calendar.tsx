'use client'

import { useMemo, useState, useCallback } from 'react'
import { useAppStore, type Expense } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronLeft, ChevronRight, CalendarDays, Flame, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, parseISO
} from 'date-fns'

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

interface DayData {
  date: Date
  total: number
  count: number
  expenses: Expense[]
}

function getSpendingColor(total: number, maxSpend: number): { bg: string; border: string; text: string } {
  if (total === 0) return { bg: 'bg-white/[0.02]', border: 'border-transparent', text: 'text-muted-foreground/40' }
  if (maxSpend === 0) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' }

  const ratio = total / maxSpend
  if (ratio > 0.7) return { bg: 'bg-rose-500/15', border: 'border-rose-500/30', text: 'text-rose-400' }
  if (ratio > 0.35) return { bg: 'bg-amber-500/12', border: 'border-amber-500/25', text: 'text-amber-400' }
  return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' }
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function SpendingCalendar() {
  const { expenses } = useAppStore()
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  // Build calendar days for current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: calStart, end: calEnd })

    return days.map(date => {
      const dayKey = format(date, 'yyyy-MM-dd')
      const dayExpenses = expenses.filter(e => {
        const expDate = format(parseISO(e.date), 'yyyy-MM-dd')
        return expDate === dayKey
      })

      const total = dayExpenses.reduce((s, e) => s + e.amount, 0)
      return {
        date,
        total: Math.round(total),
        count: dayExpenses.length,
        expenses: dayExpenses,
      } satisfies DayData
    })
  }, [currentMonth, expenses])

  // Max spending in month (for color scaling)
  const maxSpend = useMemo(() => {
    return Math.max(...calendarDays.filter(d => isSameMonth(d.date, currentMonth)).map(d => d.total), 1)
  }, [calendarDays, currentMonth])

  // Monthly stats
  const stats = useMemo(() => {
    const monthDays = calendarDays.filter(d => isSameMonth(d.date, currentMonth) && d.total > 0)
    if (monthDays.length === 0) return { highestDay: null, avgDaily: 0, totalDays: 0 }

    const highest = monthDays.reduce((max, d) => d.total > max.total ? d : max, monthDays[0])
    const avgDaily = Math.round(monthDays.reduce((s, d) => s + d.total, 0) / monthDays.length)
    return { highestDay: highest, avgDaily, totalDays: monthDays.length }
  }, [calendarDays, currentMonth])

  const goNext = useCallback(() => setCurrentMonth(prev => addMonths(prev, 1)), [])
  const goPrev = useCallback(() => setCurrentMonth(prev => subMonths(prev, 1)), [])

  return (
    <Card className="glass border-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center">
              <CalendarDays className="w-3.5 h-3.5 text-violet-400" />
            </div>
            Spending Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
              onClick={goPrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
              onClick={goNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEK_DAYS.map(day => (
            <div key={day} className="text-center text-[11px] text-muted-foreground/60 font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          <AnimatePresence mode="popLayout">
            {calendarDays.map((dayData) => {
              const inMonth = isSameMonth(dayData.date, currentMonth)
              const today = isToday(dayData.date)
              const colors = getSpendingColor(dayData.total, maxSpend)
              const hasData = dayData.total > 0

              return (
                <Popover key={dayData.date.toISOString()}>
                  <PopoverTrigger asChild>
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: inMonth ? 1 : 0.3, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {}}
                      disabled={!inMonth}
                      className={`
                        relative rounded-lg p-1.5 sm:p-2 text-center transition-all duration-200
                        ${inMonth ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}
                        ${today ? 'ring-2 ring-emerald-500/60 ring-offset-1 ring-offset-transparent' : ''}
                        ${hasData && inMonth ? colors.bg : inMonth ? 'hover:bg-white/[0.03]' : ''}
                        border ${hasData && inMonth ? colors.border : 'border-transparent'}
                        group
                      `}
                    >
                      <span className={`
                        text-xs sm:text-sm font-medium
                        ${today ? 'text-emerald-400 font-bold' : ''}
                        ${!today && inMonth ? 'text-foreground/80' : ''}
                      `}>
                        {format(dayData.date, 'd')}
                      </span>
                      {hasData && inMonth && (
                        <div className={`text-[9px] sm:text-[10px] mt-0.5 font-medium ${colors.text} leading-tight`}>
                          {dayData.total >= 1000
                            ? `$${(dayData.total / 1000).toFixed(1)}k`
                            : `$${dayData.total}`
                          }
                        </div>
                      )}
                    </motion.button>
                  </PopoverTrigger>
                  {hasData && (
                    <PopoverContent
                      className="w-64 p-3 glass border-white/10"
                      side="top"
                      align="center"
                      sideOffset={8}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">
                            {format(dayData.date, 'EEEE, MMM d')}
                          </span>
                          <span className="text-xs font-bold text-rose-400">
                            -{formatCurrency(dayData.total)}
                          </span>
                        </div>
                        <div className="h-px bg-white/10" />
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {dayData.expenses.map(exp => {
                            const color = CATEGORY_COLORS[exp.category] || '#94a3b8'
                            return (
                              <div key={exp.id} className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                                  style={{ background: `${color}18` }}
                                >
                                  <span className="text-[10px] font-bold" style={{ color }}>
                                    {exp.category[0]}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{exp.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{exp.category}</p>
                                </div>
                                <span className="text-xs font-medium text-rose-400 shrink-0">
                                  -{formatCurrency(exp.amount)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center pt-1">
                          {dayData.count} transaction{dayData.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Summary row */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-white/[0.06]">
          {stats.highestDay && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-rose-500/10 flex items-center justify-center">
                <Flame className="w-3 h-3 text-rose-400" />
              </div>
              <span className="text-xs text-muted-foreground">
                Highest: <span className="text-foreground font-medium">{format(stats.highestDay.date, 'MMM d')}</span>
                <span className="text-rose-400 font-medium ml-1">({formatCurrency(stats.highestDay.total)})</span>
              </span>
            </div>
          )}
          {stats.totalDays > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center">
                <TrendingDown className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-xs text-muted-foreground">
                Avg daily: <span className="text-foreground font-medium">{formatCurrency(stats.avgDaily)}</span>
              </span>
            </div>
          )}

          {/* Color legend */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
              <span className="text-[10px] text-muted-foreground">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500/40" />
              <span className="text-[10px] text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-rose-500/40" />
              <span className="text-[10px] text-muted-foreground">High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}