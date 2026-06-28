'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  User, Palette, ShieldCheck, Monitor, Database,
  Trash2, Download, RefreshCcw, Sun, Moon, Monitor as MonitorIcon,
  ChevronRight, LogOut, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/store/use-app-store'
import { toast } from 'sonner'

type SettingsSection = 'profile' | 'appearance' | 'privacy' | 'devices' | 'data'

const NAV_ITEMS: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
  { id: 'devices', label: 'Connected Devices', icon: Monitor },
  { id: 'data', label: 'Data Management', icon: Database },
]

const MOCK_DEVICES = [
  { name: 'MacBook Pro', lastActive: 'Active now', current: true, icon: '💻' },
  { name: 'iPhone 15 Pro', lastActive: '2 hours ago', current: false, icon: '📱' },
  { name: 'iPad Air', lastActive: '3 days ago', current: false, icon: '📟' },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
]

export default function SettingsPage() {
  const { user, setUser, clearChatMessages } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currency, setCurrency] = useState(user?.currency || 'USD')
  const [aiAnalysis, setAiAnalysis] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setCurrency(user.currency)
    }
  }, [user])

  const handleSaveProfile = () => {
    if (!user) return
    setUser({ ...user, name, email, currency })
    toast.success('Profile updated successfully')
  }

  const handleDeleteChatHistory = async () => {
    if (!user) return
    try {
      await fetch(`/api/ai-chat?userId=${user.id}`, { method: 'DELETE' })
      clearChatMessages()
      toast.success('Chat history deleted')
    } catch {
      toast.error('Failed to delete chat history')
    }
  }

  const handleReseed = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.user) {
        setUser(data.user)
        toast.success('Demo data reseeded! Reloading...')
        setTimeout(() => window.location.reload(), 1200)
      } else {
        throw new Error(data.error || 'Seed failed')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reseed data')
    }
  }

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(false)
    toast.error('Account deletion is disabled in demo mode')
  }

  const handleClearAllData = () => {
    setClearDataDialogOpen(false)
    toast.error('Data clearing is disabled in demo mode')
  }

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??'

  const storageUsed = 42

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
      {/* Left Nav */}
      <div className="lg:w-56 shrink-0">
        <div className="glass rounded-2xl p-3 lg:sticky lg:top-6">
          <h2 className="text-sm font-semibold text-foreground px-3 py-2">Settings</h2>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="size-3.5" />}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 min-w-0">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="glass rounded-2xl p-6"
        >
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Profile</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your personal information</p>
              </div>

              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 text-2xl">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-white text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{name}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  <Badge variant="outline" className="mt-1 border-emerald-500/30 text-emerald-400 text-[10px]">
                    <Check className="size-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>

              <Separator className="bg-white/5" />

              <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0"
              >
                Save Changes
              </Button>
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
                <p className="text-sm text-muted-foreground mt-1">Customize the look and feel</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label className="text-xs">Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: MonitorIcon },
                    ].map((t) => {
                      const Icon = t.icon
                      const isActive = theme === t.value
                      return (
                        <button
                          key={t.value}
                          onClick={() => setTheme(t.value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                            isActive
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                              : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:bg-white/5 hover:text-foreground'
                          }`}
                        >
                          <Icon className="size-5" />
                          <span className="text-xs font-medium">{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Separator className="bg-white/5" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Compact Mode</p>
                    <p className="text-xs text-muted-foreground">Reduce spacing for denser layout</p>
                  </div>
                  <Switch
                    checked={compactMode}
                    onCheckedChange={setCompactMode}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Privacy Section */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Privacy &amp; Security</h2>
                <p className="text-sm text-muted-foreground mt-1">Control how your data is used</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Allow AI to analyze transactions</p>
                    <p className="text-xs text-muted-foreground">Enable personalized financial insights</p>
                  </div>
                  <Switch checked={aiAnalysis} onCheckedChange={setAiAnalysis} />
                </div>

                <Separator className="bg-white/5" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Delete documents after processing</p>
                    <p className="text-xs text-muted-foreground">Automatically remove uploaded files</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                <Separator className="bg-white/5" />

                <div className="space-y-3 pt-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 border-white/10 text-muted-foreground hover:text-foreground"
                    onClick={handleDeleteChatHistory}
                  >
                    <Trash2 className="size-4 text-amber-500" />
                    Delete All Chat History
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 border-white/10 text-muted-foreground hover:text-foreground"
                  >
                    <Download className="size-4 text-cyan-400" />
                    Download My Data
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Connected Devices Section */}
          {activeSection === 'devices' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Connected Devices</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your active sessions</p>
              </div>

              <div className="space-y-3 max-w-md">
                {MOCK_DEVICES.map((device, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      device.current
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-2xl">{device.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{device.name}</p>
                        {device.current && (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{device.lastActive}</p>
                    </div>
                    {!device.current && (
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-rose-400">
                        <LogOut className="size-3 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-2"
              >
                <LogOut className="size-4" />
                Sign Out from All Devices
              </Button>
            </div>
          )}

          {/* Data Management Section */}
          {activeSection === 'data' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Data Management</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your stored data</p>
              </div>

              <div className="space-y-4 max-w-md">
                {/* Storage Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Storage Used</span>
                    <span className="text-sm font-medium text-foreground">{storageUsed}%</span>
                  </div>
                  <Progress value={storageUsed} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {storageUsed} MB of 100 MB used
                  </p>
                </div>

                <Separator className="bg-white/5" />

                <div className="space-y-3 pt-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 border-white/10 text-muted-foreground hover:text-foreground"
                  >
                    <Download className="size-4 text-emerald-400" />
                    Export All Data
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 border-white/10 text-muted-foreground hover:text-foreground"
                    onClick={handleReseed}
                  >
                    <RefreshCcw className="size-4 text-cyan-400" />
                    Reseed Demo Data
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    onClick={() => setClearDataDialogOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    Clear All Data
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glass-strong border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-400">Delete Account</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data, including expenses,
              incomes, goals, budgets, and chat history will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
        <DialogContent className="glass-strong border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Clear All Data</DialogTitle>
            <DialogDescription>
              This will remove all your financial data including expenses, incomes, goals,
              budgets, and chat messages. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClearDataDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleClearAllData}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Clear Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}