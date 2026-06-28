'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, subMonths, startOfMonth, endOfMonth, getMonth } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  Plus, Search, Trash2, ChevronLeft, ChevronRight, Wallet, Briefcase, TrendingUp,
  Building2, MessageSquare, DollarSign, Award, Home, RotateCcw, CircleDollarSign,
  PiggyBank, ArrowUpRight, AlertCircle
} from 'lucide-react'
import { useAppStore, type Income } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'

// ─── Constants ────────────────────────────────────────────────────────

const SOURCES = [
  'All', 'Salary', 'Freelance', 'Investment', 'Side Business', 'Consulting',
  'Dividend', 'Bonus', 'Rental'
]

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  Salary: <Wallet className="size-4" />,
  Freelance: <Briefcase className="size-4" />,
  Investment: <TrendingUp className="size-4" />,
  'Side Business': <Building2 className="size-4" />,
  Consulting: <MessageSquare className="size-4" />,
  Dividend: <DollarSign className="size-4" />,
  Bonus: <Award className="size-4" />,
  Rental: <Home className="size-4" />,
}

const SOURCE_COLORS: Record<string, string> = {
  Salary: '#10b981',
  Freelance: '#06b6d4',
  Investment: '#f59e0b',
  'Side Business': '#8b5cf6',
  Consulting: '#06b6d4',
  Dividend: '#f59e0b',
  Bonus: '#10b981',
  Rental: '#8b5cf6',
}

const FALLBACK_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#f59e0b', '#10b981']

const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

// ─── Component ────────────────────────────────────────────────────────

export default function IncomePage() {
  const { user, incomes, setIncomes } = useAppStore()
  const [selectedSource, setSelectedSource] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formSource, setFormSource] = useState('Salary')
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formRecurring, setFormRecurring] = useState(false)

  // ─── Fetch ─────────────────────────────────────────────────────────

  const fetchIncomes = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ userId: user.id, month: currentMonth })
      if (selectedSource !== 'All') params.set('source', selectedSource)
      const res = await fetch(`/api/incomes?${params}`)
      const data = await res.json()
      setIncomes(data)
    } catch (err) {
      console.error('Fetch incomes error:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentMonth, selectedSource, setIncomes])

  useEffect(() => {
    fetchIncomes()
  }, [fetchIncomes])

  // ─── Derived Data ──────────────────────────────────────────────────

  const filteredIncomes = useMemo(() => {
    let list = incomes
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.source.toLowerCase().includes(q)
      )
    }
    return list
  }, [incomes, searchQuery])

  const totalIncome = useMemo(
    () => incomes.reduce((s, i) => s + i.amount, 0),
    [incomes]
  )

  // Average monthly income (from last 6 months, but we compute from current data)
  const avgMonthlyIncome = useMemo(() => {
    if (incomes.length === 0) return 0
    return totalIncome
  }, [totalIncome, incomes.length])

  const primarySource = useMemo(() => {
    const map: Record<string, number> = {}
    incomes.forEach((i) => { map[i.source] = (map[i.source] || 0) + 1 })
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1])
    return entries.length > 0 ? entries[0][0] : 'N/A'
  }, [incomes])

  // Monthly trend (last 6 months) — we fetch all incomes and compute per month
  const [trendData, setTrendData] = useState<Array<{ month: string; amount: number }>>([])

  useEffect(() => {
    const fetchTrend = async () => {
      if (!user?.id) return
      try {
        const res = await fetch(`/api/incomes?userId=${user.id}`)
        const allIncomes: Income[] = await res.json()
        const now = new Date()
        const months: Array<{ month: string; amount: number }> = []
        for (let i = 5; i >= 0; i--) {
          const d = subMonths(now, i)
          const monthStr = format(d, 'yyyy-MM')
          const label = format(d, 'MMM')
          const total = allIncomes
            .filter((inc) => format(parseISO(inc.date), 'yyyy-MM') === monthStr)
            .reduce((s, inc) => s + inc.amount, 0)
          months.push({ month: label, amount: Math.round(total * 100) / 100 })
        }
        setTrendData(months)
      } catch (err) {
        console.error('Fetch trend error:', err)
      }
    }
    fetchTrend()
  }, [user?.id])

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!user?.id || !formTitle.trim() || !formAmount || !formSource) return
    try {
      await fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: formTitle,
          amount: formAmount,
          source: formSource,
          date: formDate,
          isRecurring: formRecurring,
        }),
      })
      setDialogOpen(false)
      resetForm()
      fetchIncomes()
    } catch (err) {
      console.error('Save income error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/incomes?id=${id}`, { method: 'DELETE' })
      fetchIncomes()
    } catch (err) {
      console.error('Delete income error:', err)
    }
  }

  const resetForm = () => {
    setFormTitle('')
    setFormAmount('')
    setFormSource('Salary')
    setFormDate(format(new Date(), 'yyyy-MM-dd'))
    setFormRecurring(false)
  }

  const changeMonth = (delta: number) => {
    const d = parseISO(currentMonth + '-01')
    d.setMonth(d.getMonth() + delta)
    setCurrentMonth(format(d, 'yyyy-MM'))
  }

  // ─── Custom Tooltip ────────────────────────────────────────────────

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg px-3 py-2 text-xs">
          <p className="text-emerald font-medium">{currencyFmt.format(payload[0].value)}</p>
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
          <h1 className="text-2xl font-bold gradient-text">Income</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor your earnings and revenue streams</p>
        </div>
        <Button
          onClick={() => { resetForm(); setDialogOpen(true) }}
          className="bg-emerald hover:bg-emerald/90 text-white gap-2 btn-glow"
        >
          <Plus className="size-4" />
          Add Income
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search + Month Selector */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search income..."
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

        {/* Source Pills */}
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((src) => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedSource === src
                  ? 'bg-emerald text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'glass text-muted-foreground hover:text-foreground'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="glass rounded-xl p-4 card-hover">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald/10 text-emerald">
                <CircleDollarSign className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total This Month</p>
                <p className="text-xl font-bold text-emerald counter-animate">{currencyFmt.format(totalIncome)}</p>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="glass rounded-xl p-4 card-hover">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan/10 text-cyan">
                <PiggyBank className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average Monthly</p>
                <p className="text-xl font-bold text-cyan counter-animate">{currencyFmt.format(avgMonthlyIncome)}</p>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="glass rounded-xl p-4 card-hover">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber/10 text-amber">
                <ArrowUpRight className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Primary Source</p>
                <p className="text-xl font-bold text-amber">{primarySource}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Income List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <CircleDollarSign className="size-4 text-emerald" />
            Income Records
            <Badge variant="secondary" className="ml-auto text-xs">{filteredIncomes.length}</Badge>
          </h2>

          {loading ? (
            <div className="space-y-3 py-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted/50 shimmer" />
              ))}
            </div>
          ) : filteredIncomes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Wallet className="size-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No income records found</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first income to get started</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              <AnimatePresence mode="popLayout">
                {filteredIncomes.map((income) => (
                  <motion.div
                    key={income.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group"
                  >
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: `${SOURCE_COLORS[income.source] || '#94a3b8'}15`, color: SOURCE_COLORS[income.source] || '#94a3b8' }}
                    >
                      {SOURCE_ICONS[income.source] || <CircleDollarSign className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{income.title}</span>
                        {income.isRecurring && (
                          <RotateCcw className="size-3 text-violet shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                          style={{ borderColor: `${SOURCE_COLORS[income.source] || '#94a3b8'}40`, color: SOURCE_COLORS[income.source] || '#94a3b8' }}
                        >
                          {income.source}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(income.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-emerald whitespace-nowrap">
                        +{currencyFmt.format(income.amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(income.id)}
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

        {/* Right — Monthly Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-4"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald" />
            Monthly Income Trend
          </h2>

          {trendData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No trend data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#incomeGradient)"
                  dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#060a10' }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#060a10' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Source Breakdown */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <h3 className="text-xs font-medium text-muted-foreground mb-3">Source Breakdown</h3>
            <div className="space-y-2">
              {(() => {
                const map: Record<string, number> = {}
                incomes.forEach((i) => { map[i.source] = (map[i.source] || 0) + i.amount })
                const entries = Object.entries(map).sort((a, b) => b[1] - a[1])
                if (entries.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">No data</p>
                return entries.map(([source, amount]) => (
                  <div key={source} className="flex items-center gap-3">
                    <div
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: SOURCE_COLORS[source] || '#94a3b8' }}
                    />
                    <span className="text-sm flex-1">{source}</span>
                    <span className="text-sm font-medium text-emerald">{currencyFmt.format(amount)}</span>
                  </div>
                ))
              })()}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add Income Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="gradient-text text-xl">Add Income</DialogTitle>
            <DialogDescription>Record a new income entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inc-title">Title</Label>
              <Input id="inc-title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Monthly salary" className="glass" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inc-amount">Amount ($)</Label>
                <Input id="inc-amount" type="number" min="0" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" className="glass" />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={formSource} onValueChange={setFormSource}>
                  <SelectTrigger className="w-full glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    {SOURCES.filter(s => s !== 'All').map((src) => (
                      <SelectItem key={src} value={src}>{src}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inc-date">Date</Label>
              <Input id="inc-date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="glass" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="inc-recurring">Recurring</Label>
              <Switch id="inc-recurring" checked={formRecurring} onCheckedChange={setFormRecurring} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="glass">Cancel</Button>
            <Button onClick={handleSave} disabled={!formTitle.trim() || !formAmount} className="bg-emerald hover:bg-emerald/90 text-white">
              Save Income
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}