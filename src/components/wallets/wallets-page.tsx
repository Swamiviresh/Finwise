'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type Wallet } from '@/store/use-app-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Wallet as WalletIcon, Trash2, TrendingUp, CreditCard,
  Landmark, Banknote, PiggyBank, CircleDollarSign, Minus, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const WALLET_COLORS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Violet', value: '#a78bfa' },
  { name: 'Amber', value: '#fbbf24' },
  { name: 'Rose', value: '#fb7185' },
]

const WALLET_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit' },
  { value: 'cash', label: 'Cash' },
  { value: 'investment', label: 'Investment' },
] as const

const TYPE_ICONS: Record<string, string> = {
  checking: '💳',
  savings: '🏦',
  credit: '💳',
  cash: '💵',
  investment: '📈',
}

const TYPE_BADGE_CLASS: Record<string, string> = {
  checking: 'badge-emerald',
  savings: 'badge-cyan',
  credit: 'badge-rose',
  cash: 'badge-amber',
  investment: 'badge-violet',
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export default function WalletsPage() {
  const { user, wallets, setWallets } = useAppStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('checking')
  const [formBalance, setFormBalance] = useState('')
  const [formColor, setFormColor] = useState('#10b981')

  const fetchWallets = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/wallets?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setWallets(data)
      }
    } catch {
      // silent
    }
  }, [user, setWallets])

  useEffect(() => {
    fetchWallets()
  }, [fetchWallets])

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error('Please enter a wallet name')
      return
    }
    if (!user) return

    setLoading(true)
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: formName.trim(),
          type: formType,
          balance: formBalance || '0',
          color: formColor,
          icon: TYPE_ICONS[formType] || '💳',
        }),
      })
      if (res.ok) {
        toast.success('Wallet created successfully')
        setDialogOpen(false)
        setFormName('')
        setFormType('checking')
        setFormBalance('')
        setFormColor('#10b981')
        fetchWallets()
      } else {
        toast.error('Failed to create wallet')
      }
    } catch {
      toast.error('Failed to create wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBalance = async (wallet: Wallet, amount: number) => {
    setLoading(true)
    try {
      const res = await fetch('/api/wallets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wallet.id, amount }),
      })
      if (res.ok) {
        fetchWallets()
        toast.success(`${amount > 0 ? 'Deposited' : 'Withdrew'} ${formatCurrency(Math.abs(amount))}`)
      } else {
        toast.error('Failed to update balance')
      }
    } catch {
      toast.error('Failed to update balance')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setLoading(true)
    try {
      const res = await fetch(`/api/wallets?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Wallet deleted')
        fetchWallets()
      } else {
        toast.error('Failed to delete wallet')
      }
    } catch {
      toast.error('Failed to delete wallet')
    } finally {
      setLoading(false)
      setDeleteTarget(null)
    }
  }

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)
  const highestBalance = wallets.length > 0
    ? Math.max(...wallets.map(w => w.balance))
    : 0
  const highestWallet = wallets.find(w => w.balance === highestBalance)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Wallets</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your accounts and track balances</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Wallet
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create New Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Wallet Name</label>
                <Input
                  placeholder="e.g., Main Checking"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Type</label>
                <Select value={formType} onValueChange={(val) => {
                  setFormType(val)
                }}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-white/10">
                    {WALLET_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {TYPE_ICONS[t.value]} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Balance</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formBalance}
                  onChange={(e) => setFormBalance(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-3">
                  {WALLET_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setFormColor(c.value)}
                      className={cn(
                        'w-9 h-9 rounded-full transition-all duration-200',
                        formColor === c.value
                          ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-background scale-110'
                          : 'hover:scale-110 opacity-70 hover:opacity-100'
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={loading || !formName.trim()}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
              >
                {loading ? 'Creating...' : 'Create Wallet'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <motion.div variants={item}>
          <Card className="glass border-white/10 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CircleDollarSign className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass border-white/10 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Number of Wallets</p>
                  <p className="text-2xl font-bold mt-1">{wallets.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <WalletIcon className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass border-white/10 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Highest Balance</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(highestBalance)}</p>
                  {highestWallet && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">{highestWallet.name}</p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Wallet Cards Grid */}
      {wallets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
            <WalletIcon className="w-10 h-10 text-emerald-400/60" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Wallets Yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Start tracking your finances by adding your first wallet or bank account.
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Wallet
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {wallets.map((wallet) => (
              <motion.div
                key={wallet.id}
                variants={item}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="glass glass-card-hover border-white/10 overflow-hidden group relative">
                  {/* Color accent bar */}
                  <div
                    className="h-1 w-full"
                    style={{ background: `linear-gradient(90deg, ${wallet.color}, ${wallet.color}80)` }}
                  />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${wallet.color}15` }}
                        >
                          {wallet.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">{wallet.name}</h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-2 py-0 h-5 border-white/10 font-normal mt-1',
                              TYPE_BADGE_CLASS[wallet.type] || ''
                            )}
                          >
                            {wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteTarget(wallet)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mb-4">
                      <p className="text-3xl font-bold tracking-tight">
                        {formatCurrency(wallet.balance)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{wallet.currency}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 text-xs h-8"
                        onClick={() => handleUpdateBalance(wallet, 100)}
                        disabled={loading}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Deposit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-white/10 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 text-xs h-8"
                        onClick={() => handleUpdateBalance(wallet, -100)}
                        disabled={loading}
                      >
                        <Minus className="w-3.5 h-3.5 mr-1" />
                        Withdraw
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent className="glass border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wallet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">&ldquo;{deleteTarget?.name}&rdquo;</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}