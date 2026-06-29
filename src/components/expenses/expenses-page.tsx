'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Utensils, Home, ShoppingBag, Heart, GraduationCap, Car, Film, Zap, TrendingUp, Shield, RotateCcw, MoreHorizontal } from 'lucide-react'
import TransactionDetail from '@/components/shared/transaction-detail'
import CsvImportButton from '@/components/shared/csv-import-button'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { toast } from 'sonner'

const CATEGORIES = ['Food', 'Rent', 'Shopping', 'Healthcare', 'Education', 'Transportation', 'Entertainment', 'Utilities', 'Investments', 'Insurance', 'Subscriptions', 'Others']
const CATEGORY_ICONS: Record<string, typeof Utensils> = { Food: Utensils, Rent: Home, Shopping: ShoppingBag, Healthcare: Heart, Education: GraduationCap, Transportation: Car, Entertainment: Film, Utilities: Zap, Investments: TrendingUp, Insurance: Shield, Subscriptions: RotateCcw, Others: MoreHorizontal }
const CATEGORY_COLORS: Record<string, string> = { Food: '#10b981', Rent: '#06b6d4', Shopping: '#f59e0b', Healthcare: '#f43f5e', Education: '#8b5cf6', Transportation: '#06b6d4', Entertainment: '#f59e0b', Utilities: '#10b981', Investments: '#10b981', Insurance: '#8b5cf6', Subscriptions: '#f43f5e', Others: '#94a3b8' }
function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) }

export default function ExpensesPage() {
  const { user, expenses, setExpenses } = useAppStore()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', date: format(new Date(), 'yyyy-MM-dd'), description: '', isRecurring: false })

  useEffect(() => {
    if (user?.id) fetch(`/api/expenses?userId=${user.id}`).then(r => r.json()).then(setExpenses).catch(console.error)
  }, [user?.id, setExpenses])

  const filtered = useMemo(() => {
    let list = [...expenses]
    if (filter !== 'All') list = list.filter(e => e.category === filter)
    if (search) list = list.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [expenses, filter, search])

  const now = new Date()
  const monthExpenses = expenses.filter(e => isWithinInterval(new Date(e.date), { start: startOfMonth(now), end: endOfMonth(now) }))
  const totalMonth = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const avgDaily = totalMonth / Math.max(1, now.getDate())
  const catMap: Record<string, number> = {}
  monthExpenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount })
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]
  const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value).slice(0, 6)
  const topExpenses = [...monthExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5).map(e => ({ name: e.title.length > 15 ? e.title.slice(0, 15) + '...' : e.title, amount: Math.round(e.amount) }))

  const handleAdd = async () => {
    if (!user?.id || !form.title || !form.amount) return
    try {
      const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, userId: user.id }) })
      if (res.ok) {
        const data = await fetch(`/api/expenses?userId=${user.id}`)
        setExpenses(await data.json())
        setDialogOpen(false)
        setForm({ title: '', amount: '', category: 'Food', date: format(new Date(), 'yyyy-MM-dd'), description: '', isRecurring: false })
        toast.success('Expense added')
      }
    } catch { toast.error('Failed to add expense') }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Expenses</h2>
          <p className="text-sm text-secondary">Track and manage your spending</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImportButton defaultType="expense" />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0">
                <Plus className="w-4 h-4 mr-2" /> Add Expense
              </Button>
            </DialogTrigger>
          <DialogContent className="glass border-0 sm:max-w-md">
            <DialogHeader><DialogTitle>Add New Expense</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Coffee, Groceries..." className="glass" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Amount ($)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="glass" /></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="glass" /></div>
              </div>
              <div className="space-y-2"><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes..." className="glass" /></div>
              <div className="flex items-center justify-between">
                <Label>Recurring</Label><Switch checked={form.isRecurring} onCheckedChange={v => setForm({ ...form, isRecurring: v })} />
              </div>
              <Button onClick={handleAdd} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0">Save Expense</Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total This Month', value: fmt(totalMonth), color: 'text-rose-400' },
          { label: 'Avg Daily Spend', value: fmt(avgDaily), color: 'text-amber-400' },
          { label: 'Top Category', value: topCat ? `${topCat[0]} (${fmt(topCat[1])})` : 'N/A', color: 'text-cyan-400' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="glass border-0"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses..." className="glass pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['All', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${filter === c ? 'bg-emerald-500/20 text-emerald-400' : 'glass text-foreground/60 hover:text-foreground'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Transaction List */}
        <div className="lg:col-span-3">
          <Card className="glass border-0">
            <CardHeader className="pb-2"><CardTitle className="text-base">Transactions ({filtered.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scroll-fade-bottom">
                <AnimatePresence>
                  {filtered.map(e => {
                    const Icon = CATEGORY_ICONS[e.category] || MoreHorizontal
                    return (
                      <TransactionDetail key={e.id} type="expense" data={e}>
                        <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${CATEGORY_COLORS[e.category] || '#94a3b8'}15` }}>
                            <Icon className="w-4 h-4" style={{ color: CATEGORY_COLORS[e.category] || '#94a3b8' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate flex items-center gap-1.5">
                              {e.title}
                              {e.isRecurring && (
                                <span className="badge-amber text-[9px] px-1 py-0">↻</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{format(new Date(e.date), 'MMM d, yyyy')}</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px] shrink-0 hidden sm:block">{e.category}</Badge>
                          <span className="text-sm font-medium text-rose-400 shrink-0">-{fmt(e.amount)}</span>
                        </motion.div>
                      </TransactionDetail>
                    )
                  })}
                </AnimatePresence>
                {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No expenses found</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass border-0">
            <CardHeader className="pb-2"><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {categoryData.map((e, i) => <Cell key={i} fill={CATEGORY_COLORS[e.name] || '#94a3b8'} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {categoryData.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[c.name] }} /><span className="text-muted-foreground">{c.name}</span></div>
                    <span className="font-medium">{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardHeader className="pb-2"><CardTitle className="text-base">Top Expenses</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topExpenses} layout="vertical">
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={100} />
                    <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="amount" fill="#f43f5e" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}