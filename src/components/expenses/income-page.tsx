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
import { Plus, TrendingUp, RotateCcw, Briefcase, Award, DollarSign, Building } from 'lucide-react'
import TransactionDetail from '@/components/shared/transaction-detail'
import CsvImportButton from '@/components/shared/csv-import-button'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns'
import { toast } from 'sonner'

const SOURCES = ['Salary', 'Freelance Project', 'Investment Returns', 'Side Business', 'Consulting', 'Dividend', 'Bonus', 'Rental Income']
const SOURCE_COLORS: Record<string, string> = { Salary: '#10b981', 'Freelance Project': '#06b6d4', 'Investment Returns': '#8b5cf6', 'Side Business': '#f59e0b', Consulting: '#06b6d4', Dividend: '#10b981', Bonus: '#f43f5e', 'Rental Income': '#f59e0b' }
function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) }

export default function IncomePage() {
  const { user, incomes, setIncomes } = useAppStore()
  const [filter, setFilter] = useState('All')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', source: 'Salary', date: format(new Date(), 'yyyy-MM-dd'), isRecurring: true })

  useEffect(() => {
    if (user?.id) fetch(`/api/incomes?userId=${user.id}`).then(r => r.json()).then(setIncomes).catch(console.error)
  }, [user?.id, setIncomes])

  const filtered = useMemo(() => {
    let list = [...incomes]
    if (filter !== 'All') list = list.filter(i => i.source === filter)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [incomes, filter])

  const now = new Date()
  const monthIncomes = incomes.filter(i => isWithinInterval(new Date(i.date), { start: startOfMonth(now), end: endOfMonth(now) }))
  const totalMonth = monthIncomes.reduce((s, i) => s + i.amount, 0)

  const monthCount = 6
  const monthlyTrend = useMemo(() => {
    const result = []
    for (let m = monthCount - 1; m >= 0; m--) {
      const d = subMonths(now, m)
      const mStart = startOfMonth(d)
      const mEnd = endOfMonth(d)
      const total = incomes.filter(i => isWithinInterval(new Date(i.date), { start: mStart, end: mEnd })).reduce((s, i) => s + i.amount, 0)
      result.push({ month: format(d, 'MMM'), amount: Math.round(total) })
    }
    return result
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  }, [incomes, now])

  const totalAll = incomes.reduce((s, i) => s + i.amount, 0)
  const avgMonthly = totalAll / Math.max(1, Math.ceil((new Date().getTime() - new Date(incomes[incomes.length - 1]?.date || now).getTime()) / (30 * 24 * 60 * 60 * 1000)))
  const sourceMap: Record<string, number> = {}
  incomes.forEach(i => { sourceMap[i.source] = (sourceMap[i.source] || 0) + i.amount })
  const primarySource = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0]

  const handleAdd = async () => {
    if (!user?.id || !form.title || !form.amount) return
    try {
      await fetch('/api/incomes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, userId: user.id }) })
      const data = await fetch(`/api/incomes?userId=${user.id}`).then(r => r.json())
      setIncomes(data)
      setDialogOpen(false)
      setForm({ title: '', amount: '', source: 'Salary', date: format(new Date(), 'yyyy-MM-dd'), isRecurring: true })
      toast.success('Income added')
    } catch { toast.error('Failed to add income') }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Income</h2>
          <p className="text-sm text-muted-foreground">Track your earnings and revenue sources</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImportButton defaultType="income" />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0">
                <Plus className="w-4 h-4 mr-2" /> Add Income
              </Button>
            </DialogTrigger>
          <DialogContent className="glass border-0 sm:max-w-md">
            <DialogHeader><DialogTitle>Add New Income</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Monthly Salary, Freelance..." className="glass" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Amount ($)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="glass" /></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="glass" /></div>
              </div>
              <div className="space-y-2"><Label>Source</Label>
                <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                  <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between"><Label>Recurring</Label><Switch checked={form.isRecurring} onCheckedChange={v => setForm({ ...form, isRecurring: v })} /></div>
              <Button onClick={handleAdd} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0">Save Income</Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'This Month', value: fmt(totalMonth), color: 'text-emerald-400' },
          { label: 'Avg Monthly', value: fmt(avgMonthly), color: 'text-cyan-400' },
          { label: 'Primary Source', value: primarySource ? `${primarySource[0]} (${fmt(primarySource[1])})` : 'N/A', color: 'text-violet-400' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="glass border-0"><CardContent className="p-5"><p className="text-sm text-muted-foreground">{c.label}</p><p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p></CardContent></Card>
          </motion.div>
        ))}
      </div>

      {/* Trend Chart */}
      <Card className="glass border-0">
        <CardHeader className="pb-2"><CardTitle className="text-base">Income Trend (6 months)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs><linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#incGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filters + List */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', ...SOURCES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === s ? 'bg-emerald-500/20 text-emerald-400' : 'glass text-muted-foreground hover:text-foreground'}`}>{s}</button>
        ))}
      </div>

      <Card className="glass border-0">
        <CardContent className="p-2">
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {filtered.map(i => (
              <TransactionDetail key={i.id} type="income" data={i}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${SOURCE_COLORS[i.source] || '#10b981'}15` }}>
                    <TrendingUp className="w-4 h-4" style={{ color: SOURCE_COLORS[i.source] || '#10b981' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{i.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">{i.source}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(i.date), 'MMM d, yyyy')}</span>
                      {i.isRecurring && <RotateCcw className="w-3 h-3 text-muted-foreground" />}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-emerald-400">+{fmt(i.amount)}</span>
                </motion.div>
              </TransactionDetail>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No income found</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}