'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const ALL_CATEGORIES = ['Food', 'Rent', 'Shopping', 'Healthcare', 'Education', 'Transportation', 'Entertainment', 'Utilities', 'Investments', 'Insurance', 'Subscriptions', 'Others']
function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) }

export default function BudgetsPage() {
  const { user, budgets, setBudgets } = useAppStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ category: '', limit: '' })

  useEffect(() => {
    if (user?.id) fetch(`/api/budgets?userId=${user.id}`).then(r => r.json()).then(setBudgets).catch(console.error)
  }, [user?.id, setBudgets])

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const totalPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0
  const overallColor = totalPct > 85 ? '#f43f5e' : totalPct > 60 ? '#f59e0b' : '#10b981'

  const availableCategories = ALL_CATEGORIES.filter(c => !budgets.some(b => b.category === c))
  const chartData = budgets.map(b => ({ name: b.category, spent: Math.round(b.spent), limit: Math.round(b.limit), pct: Math.round((b.spent / b.limit) * 100) }))

  const handleAdd = async () => {
    if (!user?.id || !form.category || !form.limit) return
    try {
      await fetch('/api/budgets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, category: form.category, limit: form.limit, period: 'monthly' }) })
      const data = await fetch(`/api/budgets?userId=${user.id}`).then(r => r.json())
      setBudgets(data)
      setDialogOpen(false)
      setForm({ category: '', limit: '' })
      toast.success('Budget created')
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' })
      setBudgets(budgets.filter(b => b.id !== id))
      toast.success('Budget deleted')
    } catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Budgets</h2>
          <p className="text-sm text-muted-foreground">Set spending limits and stay on track</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0" disabled={availableCategories.length === 0}>
              <Plus className="w-4 h-4 mr-2" /> Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-0 sm:max-w-md">
            <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="glass"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{availableCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Monthly Limit ($)</Label><Input type="number" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} placeholder="500" className="glass" /></div>
              <Button onClick={handleAdd} disabled={!form.category || !form.limit} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overall Progress */}
      <Card className="glass border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-secondary">Total Budget Utilization</p>
              <p className="text-3xl font-bold mt-1" style={{ color: overallColor }}>{totalPct}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Spent / Limit</p>
              <p className="text-lg font-semibold">{fmt(totalSpent)} <span className="text-muted-foreground font-normal">/ {fmt(totalLimit)}</span></p>
              <p className="text-sm text-emerald-400">{fmt(totalLimit - totalSpent)} remaining</p>
            </div>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(totalPct, 100)}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: overallColor }} />
          </div>
        </CardContent>
      </Card>

      {/* Budget Grid + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgets.map((b, i) => {
            const pct = Math.round((b.spent / b.limit) * 100)
            const color = pct > 90 ? '#f43f5e' : pct > 70 ? '#f59e0b' : '#10b981'
            return (
              <motion.div key={b.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="glass border-0 h-full card-hover">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{b.category}</h3>
                      <div className="flex items-center gap-1">
                        {pct > 85 && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                        <button onClick={() => handleDelete(b.id)} className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xl font-bold" style={{ color }}>{fmt(b.spent)}</span>
                      <span className="text-sm text-muted-foreground">/ {fmt(b.limit)}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8, delay: i * 0.06 }} className="h-full rounded-full" style={{ background: color }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{pct}% used</span>
                      <span>{fmt(b.limit - b.spent)} left</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
          {budgets.length === 0 && (
            <div className="col-span-2 text-center py-16">
              <p className="text-muted-foreground">No budgets created yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click &quot;Create Budget&quot; to get started</p>
            </div>
          )}
        </div>

        <Card className="glass border-0 h-fit">
          <CardHeader className="pb-2"><CardTitle className="text-base">Budget Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="spent" radius={[0, 6, 6, 0]} barSize={14}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.pct > 90 ? '#f43f5e' : entry.pct > 70 ? '#f59e0b' : '#10b981'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}