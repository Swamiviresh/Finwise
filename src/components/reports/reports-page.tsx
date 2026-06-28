'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#f59e0b', '#10b981']
function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) }

export default function ReportsPage() {
  const { user } = useAppStore()
  const [period, setPeriod] = useState('monthly')
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    fetch(`/api/reports?userId=${user.id}&period=${period}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) { setReport(data); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id, period])

  if (loading || !report) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 glass rounded-2xl animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-sm text-muted-foreground">Detailed analysis of your finances</p>
        </div>
        <Button variant="outline" className="glass"><Download className="w-4 h-4 mr-2" /> Export</Button>
      </div>

      {/* Period Tabs + Summary */}
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList className="glass">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="annual">Annual</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Income', value: fmt(report.totalIncome), color: 'text-emerald-400' },
          { label: 'Total Expenses', value: fmt(report.totalExpense), color: 'text-rose-400' },
          { label: 'Net Savings', value: fmt(report.netSavings), color: report.netSavings >= 0 ? 'text-cyan-400' : 'text-rose-400' },
          { label: 'Avg Daily Spend', value: fmt(report.averageDailySpend), color: 'text-amber-400' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="glass border-0"><CardContent className="p-5"><p className="text-sm text-muted-foreground">{c.label}</p><p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p></CardContent></Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass border-0">
          <CardHeader className="pb-2"><CardTitle className="text-base">Spending Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.dailyTrend}>
                  <defs><linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => format(new Date(v), 'MMM d')} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => fmt(v)} />
                  <Area type="monotone" dataKey="amount" stroke="#f43f5e" fill="url(#repGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader className="pb-2"><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={report.categoryBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="amount" nameKey="category">
                    {report.categoryBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => fmt(v)} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader className="pb-2"><CardTitle className="text-base">Top Expenses</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.topExpenses} layout="vertical">
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={100} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="amount" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader className="pb-2"><CardTitle className="text-base">Income vs Expenses</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Summary', Income: report.totalIncome, Expenses: report.totalExpense }]}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                  <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}