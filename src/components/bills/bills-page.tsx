'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion } from 'framer-motion'
import { format, addMonths, isBefore, startOfDay } from 'date-fns'
import {
  Receipt, ChevronDown, Calendar, DollarSign, TrendingDown,
  AlertCircle, Sparkles, CreditCard, Zap, ArrowDownRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#34d399', Rent: '#22d3ee', Shopping: '#fbbf24', Healthcare: '#fb7185',
  Education: '#a78bfa', Transportation: '#38bdf8', Entertainment: '#f97316',
  Utilities: '#2dd4bf', Investments: '#4ade80', Insurance: '#c084fc',
  Subscriptions: '#f472b6', Others: '#94a3b8'
}

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍽️', Rent: '🏠', Shopping: '🛍️', Healthcare: '🏥',
  Education: '📚', Transportation: '🚗', Entertainment: '🎬',
  Utilities: '⚡', Investments: '📈', Insurance: '🛡️',
  Subscriptions: '📱', Others: '📦'
}

const CANCELABLE_CATEGORIES = ['Entertainment', 'Subscriptions']

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function getNextPaymentDate(dateStr: string): Date {
  const date = new Date(dateStr)
  let next = addMonths(date, 1)
  // If the next payment date is still in the past, keep adding months until it's in the future
  while (isBefore(next, startOfDay(new Date()))) {
    next = addMonths(next, 1)
  }
  return next
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export default function BillsPage() {
  const { expenses } = useAppStore()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Filter recurring expenses
  const recurringBills = useMemo(() => {
    return expenses
      .filter(e => e.isRecurring)
      .map(e => ({
        ...e,
        nextPaymentDate: getNextPaymentDate(e.date),
        isOverdue: isBefore(getNextPaymentDate(e.date), startOfDay(new Date())),
      }))
      .sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime())
  }, [expenses])

  // Group by category
  const groupedBills = useMemo(() => {
    const groups: Record<string, typeof recurringBills> = {}
    for (const bill of recurringBills) {
      if (!groups[bill.category]) groups[bill.category] = []
      groups[bill.category].push(bill)
    }
    return groups
  }, [recurringBills])

  // Summary calculations
  const monthlyTotal = useMemo(() => recurringBills.reduce((sum, b) => sum + b.amount, 0), [recurringBills])
  const annualTotal = monthlyTotal * 12
  const billCount = recurringBills.length

  // Potential savings (cancelable subscriptions)
  const cancelableBills = useMemo(() => {
    return recurringBills.filter(b => CANCELABLE_CATEGORIES.includes(b.category))
  }, [recurringBills])
  const potentialSavings = cancelableBills.reduce((sum, b) => sum + b.amount, 0)

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Empty state
  if (recurringBills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-12 text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Recurring Bills</h3>
          <p className="text-sm text-muted-foreground">
            Mark expenses as recurring to track your bills and subscriptions here.
          </p>
        </motion.div>
      </div>
    )
  }

  const overdueCount = recurringBills.filter(b => {
    return isBefore(getNextPaymentDate(b.date), startOfDay(new Date()))
  }).length

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={item}>
          <Card className="glass border-0 card-hover glass-accent-top" style={{ '--accent-color': '#34d399' } as React.CSSProperties}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                </div>
                <Badge className="badge-emerald text-[10px]">{billCount === 1 ? 'bill' : 'bills'}</Badge>
              </div>
              <p className="text-2xl font-bold number-tick">{formatCurrency(monthlyTotal)}</p>
              <p className="text-xs text-foreground/50 mt-1">Monthly Bills Total</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass border-0 card-hover glass-accent-top" style={{ '--accent-color': '#22d3ee' } as React.CSSProperties}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                </div>
                <Badge className="badge-cyan text-[10px]">Annual</Badge>
              </div>
              <p className="text-2xl font-bold number-tick">{formatCurrency(annualTotal)}</p>
              <p className="text-xs text-muted-foreground mt-1">Annual Total</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass border-0 card-hover glass-accent-top" style={{ '--accent-color': '#a78bfa' } as React.CSSProperties}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-violet-400" />
                </div>
                <Badge className="badge-amber text-[10px]">{billCount} bill{,billCount !== 1 ? 's' : ''}</Badge>
              </div>
              <p className="text-2xl font-bold number-tick">{billCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Active Recurring Bills</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Potential Savings Card */}
      {cancelableBills.length > 0 && (
        <motion.div variants={item}>
          <Card className="glass border-0 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500/60 via-orange-500/60 to-rose-500/60" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Potential Savings
                <Badge className="badge-amber ml-auto">{cancelableBills.length} item{cancelableBills.length !== 1 ? 's' : ''}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                These entertainment and subscription expenses could potentially be canceled to save money.
              </p>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  <span className="text-sm">Potential monthly savings</span>
                </div>
                <span className="text-lg font-bold text-amber-400 number-tick">{formatCurrency(potentialSavings)}</span>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-2">
                That&apos;s up to <span className="text-amber-400 font-medium">{formatCurrency(potentialSavings * 12)}</span> per year
              </p>

              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                {cancelableBills.map(bill => {
                  const color = CATEGORY_COLORS[bill.category] || '#94a3b8'
                  return (
                    <div key={bill.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/3 transition-colors">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: `${color}15` }}>
                        <span>{CATEGORY_ICONS[bill.category] || '📦'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{bill.title}</p>
                        <p className="text-[10px] text-muted-foreground">{bill.category}</p>
                      </div>
                      <span className="text-sm font-semibold text-rose-400">{formatCurrency(bill.amount)}/mo</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Bills grouped by category */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-semibold">Bills by Category</h2>
          {overdueCount > 0 && (
            <Badge className="badge-rose text-[10px] ml-1">{overdueCount} overdue</Badge>
          )}
        </div>

        <div className="space-y-3">
          {Object.entries(groupedBills).map(([category, bills]) => {
            const color = CATEGORY_COLORS[category] || '#94a3b8'
            const icon = CATEGORY_ICONS[category] || '📦'
            const isExpanded = expandedCategories.has(category)
            const catTotal = bills.reduce((sum, b) => sum + b.amount, 0)
            const catOverdue = bills.filter(b => b.isOverdue).length

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                  <Card className="glass border-0 overflow-hidden">
                    <CollapsibleTrigger className="w-full text-left">
                      <div className="flex items-center gap-3 p-4 hover:bg-white/3 transition-colors">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ background: `${color}15` }}
                        >
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold">{category}</h3>
                            {catOverdue > 0 && (
                              <Badge className="badge-rose text-[10px]">{catOverdue} overdue</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {bills.length} bill{bills.length !== 1 ? 's' : ''} · {formatCurrency(catTotal)}/mo
                          </p>
                        </div>
                        <div className="text-right shrink-0 mr-1">
                          <p className="text-sm font-semibold number-tick">{formatCurrency(catTotal * 12)}</p>
                          <p className="text-[10px] text-muted-foreground">per year</p>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t border-white/5">
                        {bills.map((bill, i) => {
                          const nextDate = getNextPaymentDate(bill.date)
                          const isOverdue = isBefore(nextDate, startOfDay(new Date()))
                          return (
                            <motion.div
                              key={bill.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05, duration: 0.2 }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors border-b border-white/3 last:border-0"
                            >
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: color }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{bill.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-4 border-white/10 text-foreground/50 font-normal"
                                  >
                                    {category}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" />
                                    {format(nextDate, 'MMM d, yyyy')}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-semibold text-rose-400 number-tick">
                                  {formatCurrency(bill.amount)}
                                  <span className="text-[10px] text-muted-foreground font-normal">/mo</span>
                                </p>
                                <div className="mt-0.5">
                                  {isOverdue ? (
                                    <Badge className="badge-rose text-[10px] gap-0.5">
                                      <AlertCircle className="w-2.5 h-2.5" />
                                      Overdue
                                    </Badge>
                                  ) : (
                                    <Badge className="badge-emerald text-[10px]">Active</Badge>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}