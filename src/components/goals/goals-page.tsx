'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Trash2, PartyPopper, PiggyBank, Wallet } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInDays, differenceInMonths } from 'date-fns'
import { toast } from 'sonner'

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) }
const EMOJIS = ['🎯', '💻', '✈️', '📈', '🚗', '🏠', '🎓', '💎', '🛡️', '📱', '🎮', '🎁']
const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#f43f5e']

const MILESTONES = [25, 50, 75, 100] as const

interface ContributionRecord {
  amount: number
  date: string
}

export default function GoalsPage() {
  const { user, goals, setGoals } = useAppStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addFundGoalId, setAddFundGoalId] = useState<string | null>(null)
  const [fundAmount, setFundAmount] = useState('')
  const [form, setForm] = useState({ title: '', targetAmount: '', deadline: '', icon: '🎯', color: '#10b981' })
  const [celebration, setCelebration] = useState<string | null>(null)
  const [contributions, setContributions] = useState<Record<string, ContributionRecord>>({})

  useEffect(() => {
    if (user?.id) fetch(`/api/goals?userId=${user.id}`).then(r => r.json()).then(setGoals).catch(console.error)
  }, [user?.id, setGoals])

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  const handleAdd = async () => {
    if (!user?.id || !form.title || !form.targetAmount) return
    try {
      await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, ...form }) })
      const data = await fetch(`/api/goals?userId=${user.id}`).then(r => r.json())
      setGoals(data)
      setDialogOpen(false)
      setForm({ title: '', targetAmount: '', deadline: '', icon: '🎯', color: '#10b981' })
      toast.success('Goal created')
    } catch { toast.error('Failed') }
  }

  const handleAddFunds = useCallback(async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal || !fundAmount || parseFloat(fundAmount) <= 0) return
    try {
      const formData = new FormData()
      formData.append('goalId', goalId)
      formData.append('amount', fundAmount)
      await fetch('/api/goals', { method: 'POST', body: formData })
      const data = await fetch(`/api/goals?userId=${user.id}`).then(r => r.json())
      setGoals(data)

      // Track contribution locally
      const addAmt = parseFloat(fundAmount)
      setContributions(prev => ({
        ...prev,
        [goalId]: { amount: addAmt, date: new Date().toISOString() },
      }))

      const newTotal = goal.currentAmount + addAmt
      setAddFundGoalId(null)
      setFundAmount('')
      if (newTotal >= goal.targetAmount) {
        setCelebration(goalId)
        setTimeout(() => setCelebration(null), 3000)
        toast.success('🎉 Goal completed!')
      } else {
        toast.success(`Added ${fmt(addAmt)} to ${goal.title}`)
      }
    } catch { toast.error('Failed to add funds') }
  }, [fundAmount, goals, setGoals, user])

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/goals?id=${id}`, { method: 'DELETE' })
      setGoals(goals.filter(g => g.id !== id))
      toast.success('Goal deleted')
    } catch { toast.error('Failed') }
  }

  const getDeadlineText = (deadline: string) => {
    const now = new Date()
    const target = new Date(deadline)
    const days = differenceInDays(target, now)

    if (days > 0) {
      if (days === 1) return '1 day left'
      if (days <= 30) return `${days} days left`
      const months = differenceInMonths(target, now)
      if (months > 0) return `${months} month${months > 1 ? 's' : ''} left`
      return `${days} days left`
    }
    if (days === 0) return 'Due today'
    return `${Math.abs(days)} days overdue`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Savings Goals</h2>
          <p className="text-sm text-muted-foreground">Track progress towards your financial dreams</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0">
              <Plus className="w-4 h-4 mr-2" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-0 sm:max-w-md">
            <DialogHeader><DialogTitle>Create Savings Goal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Goal Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Emergency Fund" className="glass" /></div>
              <div className="space-y-2"><Label>Target Amount ($)</Label><Input type="number" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} className="glass" /></div>
              <div className="space-y-2"><Label>Deadline (optional)</Label><Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="glass" /></div>
              <div className="space-y-2"><Label>Icon</Label>
                <div className="flex gap-2 flex-wrap">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm({ ...form, icon: e })} className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === e ? 'bg-emerald-500/20 ring-1 ring-emerald-500' : 'glass hover:bg-white/10'}`}>{e}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2"><Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-offset-background' : ''}`} style={{ background: c, ringColor: c }} />
                  ))}
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0">Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Saved', value: fmt(totalSaved), color: 'text-emerald-400' },
          { label: 'Total Target', value: fmt(totalTarget), color: 'text-cyan-400' },
          { label: 'Overall Progress', value: `${overallPct}%`, color: 'text-violet-400' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="glass border-0"><CardContent className="p-5"><p className="text-sm text-muted-foreground">{c.label}</p><p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p></CardContent></Card>
          </motion.div>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {goals.map((g, i) => {
            const pct = Math.round((g.currentAmount / g.targetAmount) * 100)
            const isComplete = g.currentAmount >= g.targetAmount
            const deadlineText = g.deadline ? getDeadlineText(g.deadline) : null
            const daysLeft = g.deadline ? differenceInDays(new Date(g.deadline), new Date()) : null
            const contribution = contributions[g.id]

            return (
              <motion.div key={g.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.06 }}>
                <Card className={`glass border-0 h-full relative overflow-hidden card-hover ${pct >= 90 ? 'animated-border' : ''}`}>
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: g.color }} />
                  <CardContent className="p-5 pl-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{g.icon}</span>
                        <div>
                          <h3 className="font-semibold">{g.title}</h3>
                          {isComplete && <span className="text-xs text-emerald-400 font-medium">Completed! 🎉</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(g.id)} className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress bar with milestone indicators */}
                    <div className="mb-3">
                      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: g.color }} />
                        {/* Milestone tick marks */}
                        {MILESTONES.map(ms => {
                          const left = `${ms}%`
                          const reached = pct >= ms
                          return (
                            <div
                              key={ms}
                              className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
                              style={{ left, transform: 'translateX(-50%)' }}
                            >
                              <div className={`w-0.5 h-3 ${reached ? 'bg-white/50' : 'bg-white/10'} transition-colors`} />
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{fmt(g.currentAmount)} / {fmt(g.targetAmount)}</span>
                        <span className="font-medium" style={{ color: g.color }}>{pct}%</span>
                      </div>
                    </div>

                    {/* Deadline + Add Funds */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${deadlineText && daysLeft !== null && daysLeft < 0 ? 'text-rose-400' : 'text-muted-foreground'}`}>
                        {deadlineText || 'No deadline'}
                      </span>
                      {!isComplete && (
                        <Dialog open={addFundGoalId === g.id} onOpenChange={(open) => { if (!open) { setAddFundGoalId(null); setFundAmount('') } else { setAddFundGoalId(g.id); setFundAmount('') } }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-xs h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                              <Wallet className="w-3 h-3 mr-1" /> Add Funds
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass border-0 sm:max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <span className="text-lg">{g.icon}</span>
                                Add Funds to {g.title}
                              </DialogTitle>
                              <DialogDescription>
                                Current: {fmt(g.currentAmount)} of {fmt(g.targetAmount)} ({pct}%)
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="space-y-2">
                                <Label>Amount ($)</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={fundAmount}
                                    onChange={e => setFundAmount(e.target.value)}
                                    className="glass pl-7"
                                    autoFocus
                                    min="1"
                                    step="any"
                                  />
                                </div>
                                {fundAmount && parseFloat(fundAmount) > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    New total: {fmt(g.currentAmount + parseFloat(fundAmount))} ({Math.min(Math.round(((g.currentAmount + parseFloat(fundAmount)) / g.targetAmount) * 100), 100)}%)
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {[10, 50, 100, 500].map(quick => (
                                  <button
                                    key={quick}
                                    onClick={() => setFundAmount(String(quick))}
                                    className="flex-1 text-xs py-1.5 rounded-lg glass hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors font-medium"
                                  >
                                    ${quick}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                className="glass"
                                onClick={() => { setAddFundGoalId(null); setFundAmount('') }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleAddFunds(g.id)}
                                disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0"
                              >
                                Add Funds
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {/* Contribution History */}
                    {contribution && (
                      <p className="text-xs text-muted-foreground/70 mt-2 flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        Last contribution: {fmt(contribution.amount)} on {format(new Date(contribution.date), 'MMM d')}
                      </p>
                    )}

                    {/* Celebration */}
                    <AnimatePresence>
                      {celebration === g.id && (
                        <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                          <div className="text-center">
                            <PartyPopper className="w-10 h-10 text-emerald-400 mx-auto mb-1" />
                            <p className="text-sm font-semibold text-emerald-400">Goal Achieved!</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {goals.length === 0 && (
          <div className="col-span-full text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 mb-5">
              <PiggyBank className="w-10 h-10 text-emerald-400/70" />
            </div>
            <p className="text-4xl mb-4">🐷</p>
            <h3 className="text-lg font-semibold text-foreground/90 mb-1">Start Your Savings Journey</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Set your first financial goal and watch your savings grow. Every dollar brings you closer to your dreams!
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" /> Create First Goal
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}