'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Wallet, Target, TrendingUp, X, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAppStore, type Goal } from '@/store/use-app-store'
import { toast } from 'sonner'
import { differenceInMonths, format } from 'date-fns'

const EMOJI_OPTIONS = ['🎯', '💻', '✈️', '📈', '🚗', '🏠', '🎓', '💎', '🛡️', '💰', '🎁', '🏖️']
const COLOR_OPTIONS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#f43f5e', '#ec4899', '#14b8a6', '#f97316']

function ConfettiParticle({ color, delay }: { color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }}
      animate={{
        opacity: 0,
        y: [0, -80, 60, 120],
        x: [0, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 160],
        scale: [1, 1.2, 0.6, 0.2],
        rotate: [0, 180, 360, 540],
      }}
      transition={{ duration: 1.8, delay, ease: 'easeOut' }}
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{ backgroundColor: color }}
    />
  )
}

function GoalCard({ goal, onDelete, onAddFunds, celebrate }: {
  goal: Goal
  onDelete: (id: string) => void
  onAddFunds: (goal: Goal) => void
  celebrate: boolean
}) {
  const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
  const isComplete = progress >= 100

  let deadlineText = ''
  if (goal.deadline) {
    const months = differenceInMonths(new Date(goal.deadline), new Date())
    if (months < 0) deadlineText = 'Overdue'
    else if (months === 0) deadlineText = 'Due this month'
    else deadlineText = `${months} month${months > 1 ? 's' : ''} remaining`
  }

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-2xl p-5 card-hover relative overflow-hidden group"
      style={{ borderLeft: `4px solid ${goal.color}` }}
    >
      {/* Confetti celebration */}
      <AnimatePresence>
        {celebrate && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {Array.from({ length: 20 }).map((_, i) => (
              <ConfettiParticle
                key={i}
                color={COLOR_OPTIONS[i % COLOR_OPTIONS.length]}
                delay={i * 0.03}
              />
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="relative z-10 flex flex-col items-center gap-2 bg-background/80 backdrop-blur-sm rounded-2xl px-6 py-4"
            >
              <PartyPopper className="size-8 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">Goal Reached! 🎉</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(goal.id)}
        className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
      >
        <Trash2 className="size-3.5" />
      </Button>

      {/* Icon & Title */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: goal.color + '15' }}
        >
          {goal.icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">{goal.title}</h3>
          {deadlineText && (
            <p className={`text-xs mt-0.5 ${deadlineText === 'Overdue' ? 'text-rose-400' : 'text-muted-foreground'}`}>
              {deadlineText}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">
            {fmt.format(goal.currentAmount)} / {fmt.format(goal.targetAmount)}
          </span>
          <span className="font-semibold" style={{ color: goal.color }}>
            {progress}%
          </span>
        </div>
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: goal.color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Remaining */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isComplete
            ? '🎉 Goal complete!'
            : `${fmt.format(goal.targetAmount - goal.currentAmount)} to go`}
        </p>
        {!isComplete && (
          <Button
            size="sm"
            onClick={() => onAddFunds(goal)}
            className="h-7 text-xs bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 px-3"
          >
            <Wallet className="size-3 mr-1" />
            Add Funds
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export default function GoalsPage() {
  const { goals, setGoals, user, addChatMessage } = useAppStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [celebratingGoalId, setCelebratingGoalId] = useState<string | null>(null)
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [addAmount, setAddAmount] = useState('')
  const [form, setForm] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    icon: '🎯',
    color: '#10b981',
  })

  useEffect(() => {
    if (!user) return
    fetch(`/api/goals?userId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setGoals(data)
      })
      .catch(() => {})
  }, [user, setGoals])

  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.currentAmount, 0), [goals])
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.targetAmount, 0), [goals])
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  const handleCreate = async () => {
    if (!user || !form.title || !form.targetAmount) {
      toast.error('Please fill in title and target amount')
      return
    }
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGoals([...goals, data])
      setCreateOpen(false)
      setForm({ title: '', targetAmount: '', deadline: '', icon: '🎯', color: '#10b981' })
      toast.success('Goal created!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create goal')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/goals?id=${id}`, { method: 'DELETE' })
      setGoals(goals.filter(g => g.id !== id))
      toast.success('Goal deleted')
    } catch {
      toast.error('Failed to delete goal')
    }
  }

  const handleAddFunds = async () => {
    if (!selectedGoal || !addAmount || parseFloat(addAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    try {
      const newAmount = selectedGoal.currentAmount + parseFloat(addAmount)
      const res = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedGoal.id, currentAmount: newAmount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGoals(goals.map(g => g.id === selectedGoal.id ? { ...g, currentAmount: newAmount } : g))

      if (newAmount >= selectedGoal.targetAmount) {
        setCelebratingGoalId(selectedGoal.id)
        setTimeout(() => setCelebratingGoalId(null), 2500)
        addChatMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `🎉 **Congratulations!** You've reached your **${selectedGoal.title}** goal of ${fmt.format(selectedGoal.targetAmount)}! That's a huge milestone. Consider setting a new financial goal to keep the momentum going!`,
          createdAt: new Date().toISOString(),
        })
      }

      setAddFundsOpen(false)
      setSelectedGoal(null)
      setAddAmount('')
      toast.success(`Added ${fmt.format(parseFloat(addAmount))} to ${selectedGoal.title}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add funds')
    }
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Savings Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your financial targets and watch your savings grow</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 shrink-0"
        >
          <Plus className="size-4 mr-2" />
          Create New Goal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="size-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Total Saved</span>
          </div>
          <p className="text-xl font-bold text-emerald-400 counter-animate">{fmt.format(totalSaved)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="size-4 text-cyan-400" />
            <span className="text-xs text-muted-foreground">Total Target</span>
          </div>
          <p className="text-xl font-bold text-cyan-400 counter-animate">{fmt.format(totalTarget)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="size-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">Overall Progress</span>
          </div>
          <p className="text-xl font-bold text-amber-400 counter-animate">{overallProgress}%</p>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <Target className="size-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No goals yet</h3>
          <p className="text-sm text-muted-foreground">Create your first savings goal to start tracking your progress</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDelete={handleDelete}
                onAddFunds={(g) => { setSelectedGoal(g); setAddFundsOpen(true) }}
                celebrate={celebratingGoalId === goal.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Goal Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-strong border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>Set a savings target and start tracking your progress</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Emergency Fund"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Target Amount ($)</Label>
              <Input
                type="number"
                value={form.targetAmount}
                onChange={(e) => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                placeholder="10000"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Icon</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                      form.icon === emoji ? 'bg-emerald-500/20 ring-2 ring-emerald-500 scale-110' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm(f => ({ ...f, color }))}
                    className={`w-8 h-8 rounded-full transition-all ${
                      form.color === color ? 'ring-2 ring-white scale-110 ring-offset-2 ring-offset-background' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0">
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
        <DialogContent className="glass-strong border-white/10 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Funds</DialogTitle>
            <DialogDescription>
              Add money to &quot;{selectedGoal?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Amount ($)</Label>
              <Input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="500"
                className="bg-white/5 border-white/10"
                autoFocus
              />
            </div>
            {selectedGoal && (
              <div className="text-xs text-muted-foreground">
                Current: {fmt.format(selectedGoal.currentAmount)} / {fmt.format(selectedGoal.targetAmount)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setAddFundsOpen(false); setSelectedGoal(null) }}>Cancel</Button>
            <Button onClick={handleAddFunds} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0">
              Add Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}