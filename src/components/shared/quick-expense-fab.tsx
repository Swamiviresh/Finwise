'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, Loader2, Receipt, UtensilsCrossed, Car, ShoppingBag, Coffee, Heart, GraduationCap, Zap, Gamepad2, Droplets, Building2, Shield, Repeat } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const CATEGORY_PILLS = [
  { name: 'Food', icon: UtensilsCrossed, color: 'from-orange-500 to-amber-500' },
  { name: 'Transportation', icon: Car, color: 'from-blue-400 to-cyan-400' },
  { name: 'Shopping', icon: ShoppingBag, color: 'from-pink-500 to-rose-500' },
  { name: 'Coffee', icon: Coffee, color: 'from-amber-600 to-yellow-600' },
  { name: 'Healthcare', icon: Heart, color: 'from-red-500 to-rose-500' },
  { name: 'Education', icon: GraduationCap, color: 'from-violet-500 to-purple-500' },
  { name: 'Utilities', icon: Zap, color: 'from-yellow-500 to-orange-500' },
  { name: 'Entertainment', icon: Gamepad2, color: 'from-emerald-500 to-teal-500' },
  { name: 'Rent', icon: Building2, color: 'from-slate-500 to-gray-500' },
  { name: 'Insurance', icon: Shield, color: 'from-cyan-500 to-sky-500' },
  { name: 'Subscriptions', icon: Repeat, color: 'from-indigo-500 to-violet-500' },
  { name: 'Others', icon: Receipt, color: 'from-gray-400 to-slate-400' },
]

export default function QuickExpenseFab() {
  const { user, expenses, setExpenses } = useAppStore()
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Focus amount when expanded
  useEffect(() => {
    if (expanded) {
      setTimeout(() => amountRef.current?.focus(), 150)
    }
  }, [expanded])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (expanded && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expanded])

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expanded) setExpanded(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [expanded])

  const resetForm = () => {
    setTitle('')
    setAmount('')
    setCategory('')
  }

  const handleSave = async () => {
    if (!amount || !category || !user?.id) {
      if (!amount) toast.error('Please enter an amount')
      else if (!category) toast.error('Please select a category')
      return
    }

    const expenseTitle = title.trim() || category

    setLoading(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: expenseTitle,
          amount: parseFloat(amount),
          category,
          date: new Date().toISOString(),
          isRecurring: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add expense')
      setExpenses([data, ...expenses])
      toast.success(`Added ${expenseTitle} — $${amount}`)
      resetForm()
      setExpanded(false)
    } catch {
      toast.error('Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  const selectedPill = CATEGORY_PILLS.find(c => c.name === category)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" ref={panelRef}>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-[340px] sm:w-[380px] rounded-2xl glass-strong border border-white/10 shadow-2xl shadow-black/30 overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold">Quick Expense</span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Amount Input */}
            <div className="px-5 pb-3">
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-bold text-muted-foreground/60">$</span>
                <input
                  ref={amountRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full h-16 bg-white/[0.03] border border-white/5 rounded-xl pl-11 pr-4 text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
                />
              </div>
            </div>

            {/* Category Pills - Horizontal Scroll */}
            <div className="px-5 pb-3">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {CATEGORY_PILLS.map(cat => {
                  const isSelected = category === cat.name
                  const Icon = cat.icon
                  return (
                    <motion.button
                      key={cat.name}
                      type="button"
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setCategory(isSelected ? '' : cat.name)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                        isSelected
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-white/[0.03] text-muted-foreground border-white/5 hover:bg-white/[0.06] hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="whitespace-nowrap">{cat.name}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Title Input */}
            <div className="px-5 pb-3">
              <input
                type="text"
                placeholder={selectedPill ? `e.g. ${selectedPill.name} expense` : 'What was this for? (optional)'}
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full h-10 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
              />
            </div>

            {/* Save Button */}
            <div className="px-5 pb-5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={loading || !amount || !category}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed hover:from-emerald-600 hover:to-cyan-600 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Save Expense
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setExpanded(!expanded)}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center hover:shadow-emerald-500/40 transition-shadow"
      >
        <motion.div
          animate={{ rotate: expanded ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </div>
  )
}