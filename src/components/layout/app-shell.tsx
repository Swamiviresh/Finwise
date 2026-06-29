'use client'

import { useState, useCallback, useRef, useEffect, useSyncExternalStore } from 'react'
import { useAppStore, type ViewType } from '@/store/use-app-store'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard, Receipt, TrendingUp, PieChart, Target,
  BarChart3, MessageSquare, Settings, Shield, LogOut,
  Menu, Sun, Moon, Zap, X, Bell, Search, ChevronRight, AlertTriangle, Plus, FileText, MoreHorizontal, Wallet, StickyNote, Lightbulb, Tag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import QuickExpenseFab from '@/components/shared/quick-expense-fab'
import KeyboardShortcuts from '@/components/layout/keyboard-shortcuts'
import NotificationToasts from '@/components/layout/notification-toast'

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#34d399', Rent: '#22d3ee', Shopping: '#fbbf24', Healthcare: '#fb7185',
  Education: '#a78bfa', Transportation: '#38bdf8', Entertainment: '#f97316',
  Utilities: '#2dd4bf', Investments: '#4ade80', Insurance: '#c084fc',
  Subscriptions: '#f472b6', Others: '#94a3b8'
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

interface SearchResult {
  id: string
  title: string
  category: string
  date: string
  amount: number
  type: 'expense' | 'income'
  description?: string
}

const NAV_ITEMS: { icon: typeof LayoutDashboard; label: string; view: ViewType }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
  { icon: Receipt, label: 'Expenses', view: 'expenses' },
  { icon: TrendingUp, label: 'Income', view: 'income' },
  { icon: PieChart, label: 'Budgets', view: 'budgets' },
  { icon: Target, label: 'Goals', view: 'goals' },
  { icon: FileText, label: 'Bills', view: 'bills' },
  { icon: Wallet, label: 'Wallets', view: 'wallets' },
  { icon: Tag, label: 'Categories', view: 'categories' },
  { icon: BarChart3, label: 'Reports', view: 'reports' },
  { icon: Lightbulb, label: 'Spending Insights', view: 'insights' },
  { icon: StickyNote, label: 'Notes', view: 'notes' },
  { icon: MessageSquare, label: 'AI Coach', view: 'ai-coach' },
]

const BOTTOM_NAV = [
  { icon: Settings, label: 'Settings', view: 'settings' },
  { icon: Shield, label: 'Security', view: 'security' },
]

const PAGE_TITLES: Record<ViewType, string> = {
  landing: 'Welcome', login: 'Sign In', register: 'Create Account',
  dashboard: 'Dashboard', expenses: 'Expenses', income: 'Income',
  budgets: 'Budgets', goals: 'Goals', bills: 'Bills & Subscriptions', wallets: 'Wallets', categories: 'Categories', reports: 'Reports', insights: 'Spending Insights', notes: 'Notes',
  'ai-coach': 'AI Finance Coach', settings: 'Settings', security: 'Security Center',
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { currentView, setView, user, setUser, budgets } = useAppStore()
  const overBudgets = budgets.filter(b => (b.spent / b.limit) > 0.85).length

  const handleNav = (view: ViewType) => {
    setView(view)
    onNavigate?.()
  }

  const handleLogout = () => {
    setUser(null)
    setView('landing')
    toast.success('Logged out successfully')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-16">
        <motion.div
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center"
          animate={{ boxShadow: ['0 0 8px rgba(16,185,129,0.3)', '0 0 20px rgba(16,185,129,0.5)', '0 0 8px rgba(16,185,129,0.3)'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Zap className="w-5 h-5 text-white" />
          </motion.div>
        </motion.div>
        <span className="text-lg font-bold">FinWise <motion.span className="gradient-text" animate={{ opacity: [0.85, 1, 0.85] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>AI</motion.span></span>
      </div>
      <Separator className="bg-border/50" />

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = currentView === item.view
          return (
            <button key={item.view} onClick={() => handleNav(item.view)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
                active ? 'bg-emerald-500/10 text-emerald-400' : 'text-muted-foreground hover:text-foreground hover-surface'
              )}>
              {active && <motion.div layoutId="nav-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-r-full" />}
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.view === 'ai-coach' && (
                <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">AI</span>
              )}
              {item.view === 'budgets' && overBudgets > 0 && (
                <span className="ml-auto text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full font-medium">{overBudgets}</span>
              )}
            </button>
          )
        })}
      </nav>

      <Separator className="bg-border/50" />
      <nav className="py-3 px-3 space-y-1">
        {BOTTOM_NAV.map(item => {
          const active = currentView === item.view
          return (
            <button key={item.view} onClick={() => handleNav(item.view)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                active ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-muted-foreground hover:text-foreground hover-surface'
              )}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <Separator className="bg-border/50" />
      <div className="p-3">
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-white text-xs font-semibold">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-rose-400 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function GlobalSearch() {
  const { expenses, incomes, setView } = useAppStore()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query.trim().length > 0
    ? ([
        ...expenses.map(e => ({
          id: e.id, title: e.title, category: e.category,
          date: e.date, amount: e.amount, type: 'expense' as const,
          description: e.description,
        })),
        ...incomes.map(i => ({
          id: i.id, title: i.title, category: i.source,
          date: i.date, amount: i.amount, type: 'income' as const,
          description: undefined,
        })),
      ]
        .filter(r => {
          const q = query.toLowerCase()
          return (
            r.title.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            (r.description && r.description.toLowerCase().includes(q))
          )
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8))
    : []

  const handleSelect = (result: SearchResult) => {
    setView(result.type === 'expense' ? 'expenses' : 'income')
    setOpen(false)
    setQuery('')
  }

  // Keyboard shortcut "/" to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <div className={cn(
        'flex items-center glass rounded-xl px-3.5 py-2 gap-2.5 w-72 transition-all duration-300',
        open ? 'glow-border-emerald' : 'focus-within:glow-border-emerald'
      )}>
        <Search className="w-4 h-4 text-foreground/40 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { if (query.trim()) setOpen(true) }}
          placeholder="Search transactions..."
          className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-foreground/30"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }} className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10">
            <X className="w-3.5 h-3.5 text-foreground/40" />
          </button>
        )}
        {!query && (
          <kbd className="text-[10px] text-foreground/20 border border-white/10 rounded px-1.5 py-0.5 font-mono">/</kbd>
        )}
      </div>

      <AnimatePresence>
        {open && (results.length > 0 || query.trim().length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 backdrop-blur-sm bg-black/10 z-40"
            onClick={() => { setOpen(false); inputRef.current?.blur() }}
          />
        )}
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-96 glass rounded-xl border border-white/10 z-50 shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-white/5">
              <p className="text-[11px] text-muted-foreground px-2 font-medium">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto p-1.5 space-y-0.5">
              {results.map((result, i) => {
                const color = CATEGORY_COLORS[result.category] || '#94a3b8'
                return (
                  <motion.button
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.15 }}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover-surface transition-colors text-left group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${color}15` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-white/10 text-foreground/50 font-normal">
                          {result.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(result.date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn(
                        'text-sm font-semibold',
                        result.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      )}>
                        {result.type === 'income' ? '+' : '-'}{formatCurrency(result.amount)}
                      </span>
                      <p className="text-[10px] text-muted-foreground capitalize">{result.type}</p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
        {open && query.trim().length > 0 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-80 glass rounded-xl border border-white/10 z-50 shadow-2xl p-6 text-center"
          >
            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No transactions match &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try searching by title, category, or description</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const MOBILE_TAB_ITEMS: { icon: typeof LayoutDashboard; label: string; view: ViewType; isMore?: boolean }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
  { icon: Receipt, label: 'Expenses', view: 'expenses' },
  { icon: MessageSquare, label: 'AI Coach', view: 'ai-coach' },
  { icon: Target, label: 'Goals', view: 'goals' },
  { icon: MoreHorizontal, label: 'More', view: 'dashboard', isMore: true },
]

function MobileBottomTabBar({ onMoreClick }: { onMoreClick: () => void }) {
  const { currentView, setView } = useAppStore()

  const handleTab = (item: typeof MOBILE_TAB_ITEMS[number]) => {
    if (item.isMore) {
      onMoreClick()
    } else {
      setView(item.view)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-40">
      <div className="mx-3 mb-3 rounded-2xl border border-white/10 bg-background/60 backdrop-blur-2xl shadow-lg shadow-black/20">
        <div className="flex items-center justify-around py-1.5 px-2">
          {MOBILE_TAB_ITEMS.map(item => {
            const active = !item.isMore && currentView === item.view
            return (
              <button
                key={item.label}
                onClick={() => handleTab(item)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0"
              >
                {active && (
                  <motion.div
                    layoutId="mobile-tab-active"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon className={cn(
                  'w-5 h-5 transition-colors',
                  active ? 'text-emerald-400' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'text-[10px] font-medium transition-colors truncate max-w-[56px]',
                  active ? 'text-emerald-400' : 'text-muted-foreground'
                )}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { currentView, sidebarOpen, setSidebarOpen, budgets } = useAppStore()
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const overBudgets = budgets.filter(b => (b.spent / b.limit) > 0.85)

  // Close notification dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false} animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col border-r border-border/30 bg-sidebar shrink-0 overflow-hidden">
        <SidebarNav />
      </motion.aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar border-border/30">
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="relative h-16 border-b border-border/30 glass-strong flex items-center justify-between px-4 md:px-6 shrink-0">
          {/* Animated gradient line below header */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
            <motion.div
              className="h-full w-[200%]"
              animate={{ x: ['-50%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              style={{ background: 'linear-gradient(90deg, transparent, #10b981, #06b6d4, transparent)' }}
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover-surface">
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block p-2 rounded-lg hover-surface">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">{PAGE_TITLES[currentView]}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <div className="relative" ref={notifRef}>
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg hover-surface transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {overBudgets.length > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white">{overBudgets.length}</span>
                </motion.span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && overBudgets.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-12 w-80 glass rounded-xl border border-white/10 p-4 z-50 shadow-2xl">
                  <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-3"><AlertTriangle className="w-3.5 h-3.5" /> Budget Alerts</p>
                  <div className="space-y-1">
                    {overBudgets.map(b => {
                      const pct = Math.round((b.spent / b.limit) * 100)
                      return (
                        <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg hover-surface transition-colors">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${pct > 95 ? 'bg-rose-400 animate-breathe' : 'bg-amber-400'}`} />
                            <span className="text-sm">{b.category}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-semibold ${pct > 95 ? 'text-rose-400' : 'text-amber-400'}`}>{pct}%</span>
                            <p className="text-[10px] text-foreground/40">${b.spent.toLocaleString()} / ${b.limit.toLocaleString()}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
            {mounted && (
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg hover-surface transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <QuickExpenseFab />
        <MobileBottomTabBar onMoreClick={() => setMobileOpen(true)} />
        <KeyboardShortcuts />
        <NotificationToasts />
      </div>
    </div>
  )
}