'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts'
import {
  Plus, Search, Trash2, X, ChevronLeft, ChevronRight, Utensils, Home, ShoppingBag,
  Heart, GraduationCap, Car, Film, Zap, TrendingUp, Shield, RotateCcw, MoreHorizontal,
  Receipt, DollarSign, Tag, CalendarDays, AlertCircle
} from 'lucide-react'
import { useAppStore, type Expense } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'

// ─── Constants ────────────────────────────────────────────────────────

const CATEGORIES = [
  'All', 'Food', 'Rent', 'Shopping', 'Healthcare', 'Education',
  'Transportation', 'Entertainment', 'Utilities', 'Investments', 'Insurance', 'Subscriptions', 'Others'
]

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Food: <Utensils className="size-4" />,
  Rent: <Home className="size-4" />,
  Shopping: <ShoppingBag className="size-4" />,
  Healthcare: <Heart className="size-4" />,
  Education: <GraduationCap className="size-4" />,
  Transportation: <Car className="size-4" />,
  Entertainment: <Film className="size-4" />,
  Utilities: <Zap className="size-4" />,
  Investments: <TrendingUp className="size-4" />,
  Insurance: <Shield className="size-4" />,
  Subscriptions: <RotateCcw className="size-4" />,
  Others: <MoreHorizontal className="size-4" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#10b981',
  Rent: '#06b6d4',
  Shopping: '#f59e0b',
  Healthcare: '#f43f5e',
  Education: '#8b5cf6',
  Transportation: '#06b6d4',
  Entertainment: '#f59e0b',
  Utilities: '#10b981',
  Investments: '#10b981',
  Insurance: '#8b5cf6',
  Subscriptions: '#f43f5e',
  Others: '#94a3b8',
}

const SOURCE_COLORS_ARR = ['#10b981', '#06b6d4', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4', '#94a3b8']

const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

// ─── Component ────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { user, expenses, setExpenses } = useAppStore()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState('Food')
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formDescription, setFormDescription] = useState('')
  const [formRecurring, setFormRecurring] = useState(false)

  // ─── Fetch ─────────────────────────────────────────────────────────

  const fetchExpenses = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ userId: user.id, month: currentMonth })
      if (selectedCategory !== 'All') params.set('category', selectedCategory)
      const res = await fetch(`/api/expenses?${params}`)
      const data = await res.json()
      setExpenses(data)
    } catch (err) {
      console.error('Fetch expenses error:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentMonth, selectedCategory, setExpenses])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // ─── Derived Data ──────────────────────────────────────────────────

  const filteredExpenses = useMemo(() => {
    let list = expenses
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      )
    }
    return list
  }, [expenses, searchQuery])

  const totalSpent = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  )

  const avgDailySpend = useMemo(() => {
    const monthDate = parseISO(currentMonth + '-01')
    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)
    const days = eachDayOfInterval({ start, end }).length
    const today = new Date()
    const daysSoFar = today.getMonth() === monthDate.getMonth() && today.getFullYear() === monthDate.getFullYear()
      ? today.getDate()
      : days
    return daysSoFar > 0 ? totalSpent / daysSoFar : 0
  }, [totalSpent, currentMonth])

  const topCategory = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount })
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1])
    return entries.length > 0 ? { name: entries[0][0], amount: entries[0][1] } : { name: 'N/A', amount: 0 }
  }, [expenses])

  const pieData = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
  }, [expenses])

  const topExpenses = useMemo(
    () => [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5),
    [expenses]
  )

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!user?.id || !formTitle.trim() || !formAmount || !formCategory) return
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: formTitle,
          amount: formAmount,
          category: formCategory,
          date: formDate,
          description: formDescription || undefined,
          isRecurring: formRecurring,
        }),
      })
      setDialogOpen(false)
      resetForm()
      fetchExpenses()
    } catch (err) {
      console.error('Save expense error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' })
      fetchExpenses()
    } catch (err) {
      console.error('Delete expense error:', err)
    }
  }

  const resetForm = () => {
    setFormTitle('')
    setFormAmount('')
    setFormCategory('Food')
    setFormDate(format(new Date(), 'yyyy-MM-dd'))
    setFormDescription('')
    setFormRecurring(false)
  }

  const changeMonth = (delta: number) => {
    const d = parseISO(currentMonth + '-01')
    d.setMonth(d.getMonth() + delta)
    setCurrentMonth(format(d, 'yyyy-MM'))
  }

  // ─── Custom Tooltip ────────────────────────────────────────────────

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload?: { name: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg px-3 py-2 text-xs">
          <p className="font-medium text-foreground">{payload[0].payload?.name || payload[0].name}</p>
          <p className="text-emerald">{currencyFmt.format(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage your spending</p>
        </div>
        <Button
          onClick={() => { resetForm(); setDialogOpen(true) }}
          className="bg-emerald hover:bg-emerald/90 text-white gap-2 btn-glow"
        >
          <Plus className="size-4" />
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search + Month Selector */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 glass"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg glass card-hover">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(parseISO(currentMonth + '-01'), 'MMMM yyyy')}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-lg glass card-hover">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'glass text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="glass rounded-xl p-4 card-hover">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose/10 text-rose">
                <Receipt className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold text-rose counter-animate">{currencyFmt.format(totalSpent)}</p>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="glass rounded-xl p-4 card-hover">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber/10 text-amber">
                <DollarSign className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Daily Spend</p>
                <p className="text-xl font-bold text-amber counter-animate">{currencyFmt.format(avgDailySpend)}</p>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="glass rounded-xl p-4 card-hover">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald/10 text-emerald">
                <Tag className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Top Category</p>
                <p className="text-xl font-bold text-emerald">{topCategory.name}</p>
                <p className="text-xs text-muted-foreground">{currencyFmt.format(topCategory.amount)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Transaction List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Receipt className="size-4 text-emerald" />
            Transactions
            <Badge variant="secondary" className="ml-auto text-xs">{filteredExpenses.length}</Badge>
          </h2>

          {loading ? (
            <div className="space-y-3 py-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted/50 shimmer" />
              ))}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Receipt className="size-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No expenses found</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first expense to get started</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              <AnimatePresence mode="popLayout">
                {filteredExpenses.map((expense) => (
                  <motion.div
                    key={expense.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group"
                  >
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: `${CATEGORY_COLORS[expense.category] || '#94a3b8'}15`, color: CATEGORY_COLORS[expense.category] || '#94a3b8' }}
                    >
                      {CATEGORY_ICONS[expense.category] || <MoreHorizontal className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{expense.title}</span>
                        {expense.isRecurring && (
                          <RotateCcw className="size-3 text-violet shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                          style={{ borderColor: `${CATEGORY_COLORS[expense.category] || '#94a3b8'}40`, color: CATEGORY_COLORS[expense.category] || '#94a3b8' }}
                        >
                          {expense.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(expense.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-rose whitespace-nowrap">
                        -{currencyFmt.format(expense.amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose/10 text-rose"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Right — Analytics */}
        <div className="space-y-6">
          {/* Donut Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-4"
          >
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <CalendarDays className="size-4 text-emerald" />
              Category Breakdown
            </h2>
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="size-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No data for this period</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.name] || SOURCE_COLORS_ARR[i % SOURCE_COLORS_ARR.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {pieData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                      <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.name] || SOURCE_COLORS_ARR[i % SOURCE_COLORS_ARR.length] }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Top 5 Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-xl p-4"
          >
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald" />
              Top 5 Expenses
            </h2>
            {topExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="size-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(150, topExpenses.length * 48)}>
                <BarChart data={topExpenses} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="title" width={120} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={24}>
                    {topExpenses.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.category] || SOURCE_COLORS_ARR[i % SOURCE_COLORS_ARR.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="gradient-text text-xl">Add Expense</DialogTitle>
            <DialogDescription>Record a new expense transaction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exp-title">Title</Label>
              <Input id="exp-title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Grocery shopping" className="glass" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-amount">Amount ($)</Label>
                <Input id="exp-amount" type="number" min="0" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" className="glass" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="w-full glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-date">Date</Label>
              <Input id="exp-date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="glass" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-desc">Description (optional)</Label>
              <Textarea id="exp-desc" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Add a note..." className="glass resize-none" rows={2} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="exp-recurring">Recurring</Label>
              <Switch id="exp-recurring" checked={formRecurring} onCheckedChange={setFormRecurring} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="glass">Cancel</Button>
            <Button onClick={handleSave} disabled={!formTitle.trim() || !formAmount} className="bg-emerald hover:bg-emerald/90 text-white">
              Save Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}