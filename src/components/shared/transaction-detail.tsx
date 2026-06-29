'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useAppStore } from '@/store/use-app-store'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, RotateCcw, Calendar, Tag, FileText, Scissors } from 'lucide-react'
import SplitExpenseDialog from '@/components/shared/split-expense-dialog'

interface TransactionDetailProps {
  type: 'expense' | 'income'
  data: {
    id: string
    title: string
    amount: number
    category?: string
    source?: string
    date: string
    description?: string
    isRecurring: boolean
  }
  children: React.ReactNode
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export default function TransactionDetail({ type, data, children }: TransactionDetailProps) {
  const { expenses, setExpenses, incomes, setIncomes, user } = useAppStore()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [splitOpen, setSplitOpen] = useState(false)

  const isExpense = type === 'expense'
  const amountColor = isExpense ? 'text-rose-400' : 'text-emerald-400'
  const amountPrefix = isExpense ? '-' : '+'
  const label = isExpense ? 'Category' : 'Source'
  const labelValue = isExpense ? data.category : data.source

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const endpoint = isExpense ? `/api/expenses?id=${data.id}` : `/api/incomes?id=${data.id}`
      const res = await fetch(endpoint, { method: 'DELETE' })
      if (res.ok) {
        if (isExpense) {
          setExpenses(expenses.filter((e) => e.id !== data.id))
        } else {
          setIncomes(incomes.filter((i) => i.id !== data.id))
        }
        toast.success(`${isExpense ? 'Expense' : 'Income'} deleted`)
      } else {
        toast.error(`Failed to delete ${isExpense ? 'expense' : 'income'}`)
      }
    } catch {
      toast.error(`Failed to delete ${isExpense ? 'expense' : 'income'}`)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const formattedDate = (() => {
    try {
      return format(new Date(data.date), "MMMM d, yyyy 'at' h:mm a")
    } catch {
      return data.date
    }
  })()

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="glass border-0 w-80 p-0 overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-5 space-y-4"
        >
          {/* Title + Amount */}
          <div>
            <h3 className="text-lg font-bold leading-tight">{data.title}</h3>
            <p className={`text-2xl font-bold mt-1 ${amountColor}`}>
              {amountPrefix}{fmt(data.amount)}
            </p>
          </div>

          {/* Category / Source Badge */}
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{label}:</span>
            <Badge variant="secondary" className="text-[10px]">
              {labelValue}
            </Badge>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
          </div>

          {/* Recurring */}
          {data.isRecurring && (
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[10px] hover:bg-amber-500/20">
                Recurring
              </Badge>
            </div>
          )}

          {/* Description */}
          {data.description && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Description</span>
              </div>
              <p className="text-xs text-foreground/70 bg-white/5 rounded-lg p-3 leading-relaxed">
                {data.description}
              </p>
            </div>
          )}

          {/* Split (expenses only) */}
          {isExpense && (
            <div className="pt-2 border-t border-white/5">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setSplitOpen(true)}
                className="w-full text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 text-xs gap-2"
              >
                <Scissors className="w-3.5 h-3.5" />
                Split Expense
              </Button>
            </div>
          )}

          {/* Delete */}
          <div className="pt-2 border-t border-white/5">
            {!confirmDelete ? (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete {isExpense ? 'Expense' : 'Income'}
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-rose-400 text-center font-medium">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 text-xs"
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 text-xs gap-1.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    {deleting ? 'Deleting...' : 'Confirm'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </PopoverContent>

      {/* Split Dialog */}
      {isExpense && user && (
        <SplitExpenseDialog
          open={splitOpen}
          onOpenChange={(v) => { setSplitOpen(v); if (!v) setConfirmDelete(false) }}
          expense={{
            id: data.id,
            title: data.title,
            amount: data.amount,
            category: data.category || 'Others',
            date: data.date,
            description: data.description,
            userId: user.id,
          }}
        />
      )}
    </Popover>
  )
}