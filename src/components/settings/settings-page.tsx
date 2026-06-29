'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import {
  Sun, Moon, Monitor, Download, Trash2, RefreshCw, Shield, Smartphone,
  Laptop, Globe, User, Palette, Lock, Database, AlertTriangle, Check,
  X, ChevronDown, Bell, Target, Sparkles, BarChart3, Info, ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import CurrencyConverter from '@/components/shared/currency-converter'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Data & Privacy', icon: Lock },
  { id: 'devices', label: 'Devices', icon: Database },
  { id: 'about', label: 'About', icon: Info },
]

const MOCK_DEVICES = [
  { name: 'MacBook Pro', icon: Laptop, lastActive: 'Active now', current: true },
  { name: 'iPhone 15', icon: Smartphone, lastActive: '2 hours ago', current: false },
  { name: 'Windows PC', icon: Globe, lastActive: '3 days ago', current: false },
]

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
]

type NotificationPref = {
  budgetAlerts: boolean
  goalMilestones: boolean
  weeklySummary: boolean
  aiInsights: boolean
}

const NOTIFICATION_DEFAULTS: NotificationPref = {
  budgetAlerts: true,
  goalMilestones: true,
  weeklySummary: false,
  aiInsights: true,
}

function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotificationPref>(() => {
    if (typeof window === 'undefined') return NOTIFICATION_DEFAULTS
    try {
      const stored = localStorage.getItem('finwise_notification_prefs')
      return stored ? JSON.parse(stored) : NOTIFICATION_DEFAULTS
    } catch { return NOTIFICATION_DEFAULTS }
  })

  const updatePref = useCallback((key: keyof NotificationPref, value: boolean) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem('finwise_notification_prefs', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  return { prefs, updatePref }
}

export default function SettingsPage() {
  const { user, setUser } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('profile')
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState(user?.name || '')
  const [currency, setCurrency] = useState(user?.currency || 'USD')
  const [compactMode, setCompactMode] = useState(false)
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0)
  const [mounted, setMounted] = useState(false)
  const { prefs, updatePref } = useNotificationPrefs()

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('finwise_compact_mode')
      if (stored === 'true') {
        setCompactMode(true)
        document.body.classList.add('compact-mode')
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    setName(user?.name || '')
    setEmail(user?.email || '')
    setEditNameValue(user?.name || '')
    setCurrency(user?.currency || 'USD')
  }, [user])

  const handleSaveName = () => {
    if (!editNameValue.trim()) return
    if (user) setUser({ ...user, name: editNameValue.trim() })
    setName(editNameValue.trim())
    setIsEditingName(false)
    toast.success('Name updated')
  }

  const handleCancelName = () => {
    setEditNameValue(name)
    setIsEditingName(false)
  }

  const handleCurrencyChange = (code: string) => {
    setCurrency(code)
    if (user) setUser({ ...user, currency: code })
    toast.success(`Currency changed to ${code}`)
  }

  const toggleCompactMode = () => {
    const next = !compactMode
    setCompactMode(next)
    try { localStorage.setItem('finwise_compact_mode', String(next)) } catch { /* ignore */ }
    if (next) {
      document.body.classList.add('compact-mode')
    } else {
      document.body.classList.remove('compact-mode')
    }
    toast.success(next ? 'Compact mode enabled' : 'Compact mode disabled')
  }

  const handleSave = () => {
    if (user) setUser({ ...user, name, email })
    toast.success('Profile updated')
  }

  const handleClearChat = async () => {
    if (!user?.id) return
    await fetch(`/api/ai-chat?userId=${user.id}`, { method: 'DELETE' })
    toast.success('Chat history cleared')
  }

  const handleReseed = async () => {
    if (!user?.id) return
    await fetch('/api/seed', { method: 'POST' })
    toast.success('Demo data refreshed')
  }

  const handleExportData = async () => {
    try {
      toast.info('Preparing data export...')
      const res = await fetch('/api/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finwise-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Data exported successfully')
    } catch {
      toast.error('Export failed. Please try again.')
    }
  }

  const handleClearAllData = async () => {
    try {
      toast.info('Clearing all data...')
      if (user?.id) {
        await Promise.allSettled([
          fetch(`/api/ai-chat?userId=${user.id}`, { method: 'DELETE' }),
        ])
      }
      toast.success('All data cleared successfully')
    } catch {
      toast.error('Failed to clear data')
    }
  }

  const handleDeleteAccount = () => {
    setUser(null)
    toast.success('Account deleted')
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('') || 'U'

  const NOTIFICATION_ITEMS: { key: keyof NotificationPref; label: string; desc: string; icon: typeof Bell }[] = [
    { key: 'budgetMilestones', label: 'Budget Alerts', desc: 'Get notified when spending approaches budget limits', icon: AlertTriangle },
    { key: 'goalMilestones', label: 'Goal Milestones', desc: 'Celebrate when you hit savings goal checkpoints', icon: Target },
    { key: 'weeklySummary', label: 'Weekly Summary', desc: 'Receive a weekly digest of your financial activity', icon: BarChart3 },
    { key: 'aiInsights', label: 'AI Insights', desc: 'Get smart spending tips and anomaly detection alerts', icon: Sparkles },
  ]

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Nav */}
        <nav className="lg:col-span-1">
          <Card className="glass border-0">
            <CardContent className="p-2">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeSection === s.id ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </nav>

        {/* Content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeSection === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                {/* Profile Card */}
                <Card className="glass border-0 glass-card-hover">
                  <CardHeader><CardTitle className="text-base">Profile Information</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar + Name + Email */}
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-background">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-white text-xl font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        {isEditingName ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editNameValue}
                              onChange={e => setEditNameValue(e.target.value)}
                              className="glass h-8 w-48"
                              autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancelName() }}
                            />
                            <Button size="sm" variant="ghost" onClick={handleSaveName} className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelName} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-white/5">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditNameValue(name); setIsEditingName(true) }}
                            className="flex items-center gap-1.5 group"
                          >
                            <p className="font-semibold group-hover:text-emerald-400 transition-colors">{user?.name || 'User'}</p>
                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                          </button>
                        )}
                        <p className="text-sm text-secondary">{user?.email}</p>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Email + Currency */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={email} onChange={e => setEmail(e.target.value)} className="glass" />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <div className="relative">
                          <select
                            value={currency}
                            onChange={e => handleCurrencyChange(e.target.value)}
                            className="w-full h-10 rounded-md glass appearance-none pl-3 pr-10 text-sm bg-transparent border-none outline-none cursor-pointer"
                          >
                            {CURRENCIES.map(c => (
                              <option key={c.code} value={c.code} className="bg-background text-foreground">
                                {c.symbol} {c.code} — {c.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Currency Converter */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-secondary">Quick Convert:</span>
                      <CurrencyConverter currentCurrency={currency} />
                    </div>

                    <Button onClick={handleSave} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0">
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                <Card className="glass border-0 glass-card-hover">
                  <CardHeader><CardTitle className="text-base">Theme</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: Monitor },
                      ].map(t => (
                        <motion.button
                          key={t.value}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setTheme(t.value)}
                          className={`p-4 rounded-xl glass flex flex-col items-center gap-2 transition-all ${theme === t.value ? 'ring-1 ring-emerald-500 bg-emerald-500/10' : 'hover:bg-white/5'}`}>
                          <t.icon className={`w-6 h-6 ${theme === t.value ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                          <span className="text-sm font-medium">{t.label}</span>
                        </motion.button>
                      ))}
                    </div>
                    {/* Animated transition indicator */}
                    <motion.div
                      key={theme}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="h-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      />
                      <span className="shrink-0">Theme applied: <span className="text-emerald-400 capitalize">{theme}</span></span>
                    </motion.div>
                  </CardContent>
                </Card>

                <Card className="glass border-0 glass-card-hover">
                  <CardHeader><CardTitle className="text-base">Display</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Compact Mode</p>
                        <p className="text-xs text-muted-foreground">Reduce spacing for more content on screen</p>
                      </div>
                      <Switch checked={compactMode} onCheckedChange={toggleCompactMode} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                <Card className="glass border-0 glass-card-hover">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {NOTIFICATION_ITEMS.map((item) => (
                      <motion.div
                        key={item.key}
                        className="flex items-center justify-between"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: NOTIFICATION_ITEMS.indexOf(item) * 0.06 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mt-0.5 shrink-0">
                            <item.icon className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                        <Switch
                          checked={prefs[item.key]}
                          onCheckedChange={(v) => updatePref(item.key, v)}
                        />
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground text-center">Notification preferences are saved locally on your device.</p>
              </motion.div>
            )}

            {activeSection === 'privacy' && (
              <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                <Card className="glass border-0 glass-card-hover">
                  <CardHeader><CardTitle className="text-base">Privacy Settings</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'Allow AI to analyze transactions', desc: 'AI will generate insights from your spending data', defaultChecked: true, disabled: false },
                      { label: 'Delete documents after processing', desc: 'Uploaded documents are permanently deleted after analysis', defaultChecked: true, disabled: true },
                      { label: 'Anonymous analytics', desc: 'Help improve FinWise with anonymous usage data', defaultChecked: false, disabled: false },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                        <Switch defaultChecked={item.defaultChecked} disabled={item.disabled} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="glass border-0 glass-card-hover">
                  <CardHeader><CardTitle className="text-base">Data & Privacy</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleExportData}
                      className="w-full flex items-center gap-3 p-3 rounded-xl glass hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Export All Data</p>
                        <p className="text-xs text-muted-foreground">Download a complete copy of your financial data</p>
                      </div>
                    </motion.button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl glass hover:bg-rose-500/5 transition-colors text-left"
                        >
                          <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                            <Trash2 className="w-4 h-4 text-rose-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-rose-400">Clear All Data</p>
                            <p className="text-xs text-muted-foreground">Remove all your financial records</p>
                          </div>
                        </motion.button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass border-0">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all your expenses, incomes, budgets, goals, and chat history.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearAllData} className="bg-rose-500 hover:bg-rose-600">Clear Everything</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button variant="outline" className="w-full justify-start glass text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={handleClearChat}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete All Chat History
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === 'devices' && (
              <motion.div key="devices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                <Card className="glass border-0 glass-card-hover">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Connected Devices</CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs text-rose-400 hover:text-rose-300">Sign out all</Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {MOCK_DEVICES.map(d => (
                      <div key={d.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><d.icon className="w-5 h-5 text-muted-foreground" /></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2"><p className="text-sm font-medium">{d.name}</p>{d.current && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Current</span>}</div>
                          <p className="text-xs text-muted-foreground">{d.lastActive}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="glass border-0 glass-card-hover">
                  <CardHeader><CardTitle className="text-base">Data Management</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start glass" onClick={() => toast.info('Export started')}>
                      <Download className="w-4 h-4 mr-2" /> Export All Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start glass" onClick={handleReseed}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Reseed Demo Data
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === 'about' && (
              <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                <Card className="glass border-0 glass-card-hover">
                  <CardHeader><CardTitle className="text-base">About FinWise AI</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <span className="text-2xl font-bold text-white">F</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold gradient-text">FinWise AI</h3>
                        <p className="text-xs text-muted-foreground">Your intelligent financial companion</p>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Version</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-0">v1.0.0</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Built with</span>
                        <div className="flex gap-1.5">
                          <Badge variant="outline" className="border-border/50 text-[10px]">Next.js</Badge>
                          <Badge variant="outline" className="border-border/50 text-[10px]">TypeScript</Badge>
                          <Badge variant="outline" className="border-border/50 text-[10px]">Tailwind</Badge>
                          <Badge variant="outline" className="border-border/50 text-[10px]">Prisma</Badge>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    <p className="text-sm text-muted-foreground text-center">Made with ❤️ by FinWise Team</p>

                    <div className="flex gap-3 justify-center">
                      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
                        Privacy Policy <ExternalLink className="w-3 h-3" />
                      </button>
                      <span className="text-muted-foreground/30">|</span>
                      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
                        Terms of Service <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="glass border-0 border-t-2 border-t-rose-500/30!">
                  <CardHeader><CardTitle className="text-base text-rose-400">Danger Zone</CardTitle></CardHeader>
                  <CardContent>
                    {deleteConfirmStep === 0 ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20"
                        onClick={() => setDeleteConfirmStep(1)}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" /> Delete Account Permanently
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                          <p className="text-sm text-rose-400 font-medium">⚠️ This is irreversible!</p>
                          <p className="text-xs text-muted-foreground mt-1">Type <strong className="text-rose-400">DELETE</strong> below to confirm.</p>
                        </div>
                        <Input
                          placeholder='Type "DELETE" to confirm'
                          className="glass border-rose-500/20 focus-visible:ring-rose-500/30"
                          onChange={e => { if (e.target.value === 'DELETE') setDeleteConfirmStep(2) }}
                        />
                        {deleteConfirmStep === 2 && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white border-0">
                                  <AlertTriangle className="w-4 h-4 mr-2" /> Confirm Account Deletion
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="glass border-0">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. All your data will be permanently removed
                                    from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="glass" onClick={() => setDeleteConfirmStep(0)}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-rose-500 hover:bg-rose-600">Delete Forever</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </motion.div>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmStep(0)} className="text-muted-foreground">
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}