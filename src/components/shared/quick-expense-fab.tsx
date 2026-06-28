'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Plus, X, Loader2, Receipt } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const CATEGORIES = ['Food', 'Rent', 'Shopping', 'Healthcare', 'Education', 'Transportation', 'Entertainment', 'Utilities', 'Investments', 'Insurance', 'Subscriptions', 'Others']

export default function QuickExpenseFab() {
  const { user, expenses, setExpenses } = useAppStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount || !category || !user?.id) return

    setLoading(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title,
          amount: parseFloat(amount),
          category,
          date: new Date().toISOString(),
          isRecurring: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add expense')
      setExpenses([data, ...expenses])
      toast.success(`Added ${title} - $${amount}`)
      setTitle('')
      setAmount('')
      setCategory('')
      setOpen(false)
    } catch (err) {
      toast.error('Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* FAB Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center z-50 hover:shadow-emerald-500/40 transition-shadow"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Quick Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass border-0 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-white" />
              </div>
              Quick Add Expense
            </DialogTitle>
            <DialogDescription>Add a new expense in seconds</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="fab-title">What did you spend on?</Label>
              <Input
                id="fab-title"
                placeholder="e.g. Coffee, Lunch, Uber"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="glass"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fab-amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id="fab-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="glass pl-7"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="glass">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              {['Food', 'Transport', 'Shopping', 'Coffee'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat === 'Transport' ? 'Transportation' : cat)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all ${category === (cat === 'Transport' ? 'Transportation' : cat)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'glass text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat === 'Transport' ? '🚗' : cat === 'Food' ? '🍽️' : cat === 'Shopping' ? '🛍️' : '☕'} {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !title || !amount || !category}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0 hover:from-emerald-600 hover:to-cyan-600"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Add Expense
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}