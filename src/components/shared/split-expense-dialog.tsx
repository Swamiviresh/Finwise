'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Scissors, Loader2, ArrowRightLeft, Tag, Calendar, DollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { toast } from 'sonner'

const CATEGORIES = [
  'Food', 'Rent', 'Shopping', 'Healthcare', 'Education',
  'Transportation', 'Entertainment', 'Utilities', 'Investments',
  'Insurance', 'Subscriptions', 'Others',
]

const ROW_COLORS = [
  'bg-emerald-400',
  'bg-cyan-400',
  'bg-violet-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-emerald-300',
  'bg-cyan-300',
  'bg-violet-300',
  'bg-amber-300',
  'bg-rose-300',
]

interface SplitPart {
  title: string
  amount: string
  category: string
}

interface ExpenseData {
  id: string
  title: string
  amount: number
  category: string
  date: string
  description?: string
  userId: string
}

interface SplitExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: ExpenseData
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtShort(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export default function SplitExpenseDialog({ open, onOpenChange, expense }: SplitExpenseDialogProps) {
  const { user, expenses, setExpenses } = useAppStore()
  const [splitCount, setSplitCount] = useState(2)
  const [parts, setParts] = useState<SplitPart[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Initialize parts when dialog opens or split count changes
  const initParts = useCallback((count: number) => {
    const equalAmount = (expense.amount / count).toFixed(2)
    const newParts: SplitPart[] = []
    for (let i = 0; i < count; i++) {
      // Use existing value if available, otherwise default
      const existing = parts[i]
      newParts.push({
        title: existing?.title || `${expense.title} — Part ${i + 1}`,
        amount: existing?.amount || equalAmount,
        category: existing?.category || expense.category,
      })
    }
    setParts(newParts)
  }, [expense.title, expense.amount, expense.category, parts])

  useEffect(() => {
    if (open) {
      const equalAmount = (expense.amount / 2).toFixed(2)
      setParts([
        { title: `${expense.title} — Part 1`, amount: equalAmount, category: expense.category },
        { title: `${expense.title} — Part 2`, amount: equalAmount, category: expense.category },
      ])
      setSplitCount(2)
    }
  }, [open, expense.amount, expense.category, expense.title])

  const handleSplitCountChange = (newCount: number) => {
    const clamped = Math.max(2, Math.min(10, newCount))
    setSplitCount(clamped)
    const equalAmount = (expense.amount / clamped).toFixed(2)
    const newParts: SplitPart[] = []
    for (let i = 0; i < clamped; i++) {
      const existing = parts[i]
      newParts.push({
        title: existing?.title || `${expense.title} — Part ${i + 1}`,
        amount: existing?.amount || equalAmount,
        category: existing?.category || expense.category,
      })
    }
    setParts(newParts)
  }

  const updatePart = (index: number, field: keyof SplitPart, value: string) => {
    setParts(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const totalAllocated = useMemo(() => {
    return parts.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  }, [parts])

  const remaining = useMemo(() => {
    return expense.amount - totalAllocated
  }, [expense.amount, totalAllocated])

  const remainingColor = useMemo(() => {
    if (Math.abs(remaining) < 0.005) return 'text-emerald-400'
    if (remaining < 0) return 'text-amber-400'
    return 'text-rose-400'
  }, [remaining])

  const remainingBg = useMemo(() => {
    if (Math.abs(remaining) < 0.005) return 'bg-emerald-500/10 border-emerald-500/20'
    if (remaining < 0) return 'bg-amber-500/10 border-amber-500/20'
    return 'bg-rose-500/10 border-rose-500/20'
  }, [remaining])

  const canSplit = Math.abs(remaining) < 0.005 && parts.every(p => p.title.trim() && p.category)

  const handleSubmit = async () => {
    if (!canSplit || !user?.id) return
    setSubmitting(true)
    try {
      // Create each split part
      const createdExpenses = []
      for (const part of parts) {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            title: part.title.trim(),
            amount: parseFloat(part.amount),
            category: part.category,
            date: expense.date,
            description: `Split from: ${expense.title}`,
            isRecurring: false,
          }),
        })
        if (!res.ok) throw new Error('Failed to create split part')
        const data = await res.json()
        createdExpenses.push(data)
      }

      // Delete the original expense
      const delRes = await fetch(`/api/expenses?id=${expense.id}`, { method: 'DELETE' })
      if (!delRes.ok) throw new Error('Failed to delete original expense')

      // Refresh expenses list
      const freshRes = await fetch(`/api/expenses?userId=${user.id}`)
      const freshExpenses = await freshRes.json()
      setExpenses(freshExpenses)

      toast.success(`Expense split into ${parts.length} parts`)
      onOpenChange(false)
    } catch {
      toast.error('Failed to split expense. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formattedDate = (() => {
    try {
      return format(new Date(expense.date), 'MMM d, yyyy')
    } catch {
      return expense.date
    }
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-0 sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            Split Expense
          </DialogTitle>
          <DialogDescription className="text-tertiary">
            Break this expense into multiple sub-expenses
          </DialogDescription>
        </DialogHeader>

        {/* Original Expense Info */}
        <div className="shrink-0 glass-subtle rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold truncate mr-4">{expense.title}</h4>
            <span className="text-lg font-bold text-rose-400 shrink-0">{fmtShort(expense.amount)}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-tertiary" />
              <span className="text-xs text-secondary">{expense.category}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-tertiary" />
              <span className="text-xs text-secondary">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Split Into Control */}
        <div className="shrink-0 flex items-center justify-between">
          <Label className="text-xs text-secondary">Split into</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-tertiary hover:text-foreground"
              onClick={() => handleSplitCountChange(splitCount - 1)}
              disabled={splitCount <= 2}
            >
              −
            </Button>
            <Input
              type="number"
              min={2}
              max={10}
              value={splitCount}
              onChange={e => handleSplitCountChange(parseInt(e.target.value) || 2)}
              className="w-14 h-7 text-center text-sm glass p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-tertiary hover:text-foreground"
              onClick={() => handleSplitCountChange(splitCount + 1)}
              disabled={splitCount >= 10}
            >
              +
            </Button>
            <span className="text-xs text-tertiary ml-1">parts</span>
          </div>
        </div>

        {/* Split Parts List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1 scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {parts.map((part, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="glass-subtle rounded-xl p-3 space-y-2.5"
              >
                {/* Row Header */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${ROW_COLORS[index % ROW_COLORS.length]}`} />
                  <span className="text-xs font-medium text-secondary">Part {index + 1}</span>
                </div>

                {/* Title + Amount Row */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-3">
                    <Label className="text-[10px] text-tertiary mb-1 block">Title</Label>
                    <Input
                      value={part.title}
                      onChange={e => updatePart(index, 'title', e.target.value)}
                      placeholder={`Part ${index + 1}`}
                      className="h-8 text-xs glass p-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-tertiary mb-1 block">Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-tertiary pointer-events-none" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={part.amount}
                        onChange={e => updatePart(index, 'amount', e.target.value)}
                        className="h-8 text-xs glass p-2 pl-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Category Select */}
                <div>
                  <Label className="text-[10px] text-tertiary mb-1 block">Category</Label>
                  <Select value={part.category} onValueChange={v => updatePart(index, 'category', v)}>
                    <SelectTrigger className="h-8 text-xs glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Remaining Amount Indicator */}
        <div className={`shrink-0 flex items-center justify-between rounded-lg border px-3 py-2 ${remainingBg}`}>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-3.5 h-3.5 text-tertiary" />
            <span className="text-xs text-secondary">Remaining</span>
          </div>
          <span className={`text-sm font-bold ${remainingColor}`}>
            {remaining >= 0 ? '' : '-'}{fmt(Math.abs(remaining))}
          </span>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          <Button
            onClick={handleSubmit}
            disabled={!canSplit || submitting}
            className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white border-0 gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Splitting...
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                Split Expense
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}