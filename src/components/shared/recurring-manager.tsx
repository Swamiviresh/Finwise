'use client'

import { useState, useMemo } from 'react'
import { useAppStore, type Expense } from '@/store/use-app-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Pause, Play, Pencil, Check, Trash2, RotateCcw, MoreHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addMonths } from 'date-fns'
import { toast } from 'sonner'

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#10b981', Rent: '#06b6d4', Shopping: '#f59e0b', Healthcare: '#f43f5e',
  Education: '#8b5cf6', Transportation: '#06b6d4', Entertainment: '#f59e0b',
  Utilities: '#10b981', Investments: '#10b981', Insurance: '#8b5cf6',
  Subscriptions: '#f43f5e', Others: '#94a3b8',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

const PAUSED_KEY = 'finwise_paused_recurring'

function getPausedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(PAUSED_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function savePausedIds(ids: Set<string>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PAUSED_KEY, JSON.stringify([...ids]))
}

interface RecurringManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function RecurringManager({ open, onOpenChange }: RecurringManagerProps) {
  const { user, expenses, setExpenses } = useAppStore()
  const [pausedIds, setPausedIds] = useState<Set<string>>(() => getPausedIds())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')

  const recurringExpenses = useMemo(() => {
    const seen = new Map<string, Expense>()
    for (const e of expenses) {
      if (e.isRecurring) {
        if (!seen.has(e.title.toLowerCase())) {
          seen.set(e.title.toLowerCase(), e)
        }
      }
    }
    return Array.from(seen.values())
  }, [expenses])

  const activeCount = recurringExpenses.filter(e => !pausedIds.has(e.id)).length
  const pausedCount = recurringExpenses.length - activeCount
  const monthlyTotal = recurringExpenses
    .filter(e => !pausedIds.has(e.id))
    .reduce((sum, e) => sum + e.amount, 0)

  function togglePaused(id: string) {
    setPausedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        toast.success('Recurring expense resumed')
      } else {
        next.add(id)
        toast.success('Recurring expense paused')
      }
      savePausedIds(next)
      return next
    })
  }

  function startEdit(e: Expense) {
    setEditingId(e.id)
    setEditAmount(String(e.amount))
  }

  async function saveEdit(id: string) {
    const newAmount = parseFloat(editAmount)
    if (isNaN(newAmount) || newAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, amount: newAmount }),
      })
      if (res.ok) {
        if (user?.id) {
          const data = await fetch(`/api/expenses?userId=${user.id}`)
          setExpenses(await data.json())
        }
        toast.success('Amount updated')
      }
    } catch {
      toast.error('Failed to update amount')
    }
    setEditingId(null)
    setEditAmount('')
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        if (user?.id) {
          const data = await fetch(`/api/expenses?userId=${user.id}`)
          setExpenses(await data.json())
        }
        toast.success('Recurring expense deleted')
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  function getNextDate(dateStr: string) {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      let next = addMonths(d, 1)
      while (next <= now) {
        next = addMonths(next, 1)
      }
      return next
    } catch {
      return new Date()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-0 sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header + Summary */}
        <div className="p-6 pb-4 space-y-4 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <RotateCcw className="w-5 h-5 text-emerald-400" />
              Manage Recurring Expenses
            </DialogTitle>
          </DialogHeader>

          {/* Summary Bar */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 text-sm"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-secondary">{activeCount} active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-secondary">{pausedCount} paused</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-secondary">{fmt(monthlyTotal)}/month</span>
          </motion.div>
        </div>

        <Separator className="opacity-20" />

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          <AnimatePresence>
            {recurringExpenses.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-tertiary text-center py-12"
              >
                No recurring expenses found
              </motion.p>
            ) : (
              recurringExpenses.map((expense, i) => {
                const isPaused = pausedIds.has(expense.id)
                const isEditing = editingId === expense.id
                const nextDate = getNextDate(expense.date)
                const color = CATEGORY_COLORS[expense.category] || '#94a3b8'

                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className={`rounded-xl p-4 transition-all ${isPaused ? 'opacity-50 bg-white/[0.02]' : 'bg-white/[0.04] hover:bg-white/[0.06]'}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Color dot */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${color}15` }}
                      >
                        <MoreHorizontal className="w-4 h-4" style={{ color }} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${isPaused ? 'text-muted-foreground line-through' : ''}`}>
                            {expense.title}
                          </p>
                          {isPaused && (
                            <Badge variant="secondary" className="badge-glass-amber text-[10px] px-1.5 py-0">
                              Paused
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-tertiary">
                          <span>{expense.category}</span>
                          <span className="opacity-40">·</span>
                          <span>Monthly</span>
                          <span className="opacity-40">·</span>
                          <span>Next: {format(nextDate, 'MMM d')}</span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="shrink-0 text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-tertiary">$</span>
                              <Input
                                type="number"
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveEdit(expense.id)
                                  if (e.key === 'Escape') setEditingId(null)
                                }}
                                className="glass w-20 h-7 text-xs pl-5 pr-2"
                                autoFocus
                              />
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-emerald-400 hover:text-emerald-300"
                              onClick={() => saveEdit(expense.id)}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-tertiary hover:text-foreground"
                              onClick={() => setEditingId(null)}
                            >
                              <span className="text-xs">✕</span>
                            </Button>
                          </div>
                        ) : (
                          <span className={`text-sm font-semibold ${isPaused ? 'text-muted-foreground' : 'text-rose-400'}`}>
                            -{fmt(expense.amount)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions row */}
                    {!isEditing && (
                      <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-white/5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`h-7 w-7 ${isPaused ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'}`}
                          onClick={() => togglePaused(expense.id)}
                          title={isPaused ? 'Resume' : 'Pause'}
                        >
                          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-tertiary hover:text-cyan-400"
                          onClick={() => startEdit(expense)}
                          title="Edit amount"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-tertiary hover:text-rose-400"
                          onClick={() => handleDelete(expense.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}