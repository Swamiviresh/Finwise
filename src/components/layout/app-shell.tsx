'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, type ViewType } from '@/store/use-app-store'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard, Receipt, TrendingUp, PieChart, Target,
  BarChart3, MessageSquare, Settings, Shield, LogOut,
  Menu, Sun, Moon, Zap, X, Bell, Search, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const NAV_ITEMS: { icon: typeof LayoutDashboard; label: string; view: ViewType }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
  { icon: Receipt, label: 'Expenses', view: 'expenses' },
  { icon: TrendingUp, label: 'Income', view: 'income' },
  { icon: PieChart, label: 'Budgets', view: 'budgets' },
  { icon: Target, label: 'Goals', view: 'goals' },
  { icon: BarChart3, label: 'Reports', view: 'reports' },
  { icon: MessageSquare, label: 'AI Coach', view: 'ai-coach' },
]

const BOTTOM_NAV = [
  { icon: Settings, label: 'Settings', view: 'settings' },
  { icon: Shield, label: 'Security', view: 'security' },
]

const PAGE_TITLES: Record<ViewType, string> = {
  landing: 'Welcome', login: 'Sign In', register: 'Create Account',
  dashboard: 'Dashboard', expenses: 'Expenses', income: 'Income',
  budgets: 'Budgets', goals: 'Goals', reports: 'Reports',
  'ai-coach': 'AI Finance Coach', settings: 'Settings', security: 'Security Center',
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { currentView, setView, user, setUser } = useAppStore()

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
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold">FinWise <span className="gradient-text">AI</span></span>
      </div>
      <Separator className="bg-border/50" />

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = currentView === item.view
          return (
            <button key={item.view} onClick={() => handleNav(item.view)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
                active ? 'bg-emerald-500/10 text-emerald-400' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}>
              {active && <motion.div layoutId="nav-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-r-full" />}
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.view === 'ai-coach' && (
                <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">AI</span>
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
                active ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
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
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-rose-400 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { currentView, sidebarOpen, setSidebarOpen } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
        <header className="h-16 border-b border-border/30 glass-strong flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/5">
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block p-2 rounded-lg hover:bg-white/5">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">{PAGE_TITLES[currentView]}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center glass rounded-lg px-3 py-2 gap-2 w-64">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" />
            </div>
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full" />
            </button>
            {mounted && (
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
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
      </div>
    </div>
  )
}