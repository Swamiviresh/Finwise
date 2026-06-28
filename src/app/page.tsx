'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { AppShell } from '@/components/layout/app-shell'

// Lazy-load page components
import LandingPage from '@/components/landing/landing-page'
import LoginPage from '@/components/auth/login-page'
import RegisterPage from '@/components/auth/register-page'
import DashboardPage from '@/components/dashboard/dashboard-page'
import ExpensesPage from '@/components/expenses/expenses-page'
import IncomePage from '@/components/expenses/income-page'
import GoalsPage from '@/components/goals/goals-page'
import ReportsPage from '@/components/reports/reports-page'
import AICoachPage from '@/components/ai-coach/ai-coach-page'
import SettingsPage from '@/components/settings/settings-page'

function BudgetsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
        <svg className="size-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground">Budgets</h3>
      <p className="text-sm text-muted-foreground max-w-sm">Budget management coming soon. Track your spending limits per category.</p>
    </div>
  )
}

function SecurityPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
        <svg className="size-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground">Security</h3>
      <p className="text-sm text-muted-foreground max-w-sm">Security settings coming soon. Manage 2FA, sessions, and more.</p>
    </div>
  )
}

function ViewRouter() {
  const { currentView } = useAppStore()

  switch (currentView) {
    case 'landing':
      return <LandingPage />
    case 'login':
      return <LoginPage />
    case 'register':
      return <RegisterPage />
    case 'dashboard':
      return <DashboardPage />
    case 'expenses':
      return <ExpensesPage />
    case 'income':
      return <IncomePage />
    case 'budgets':
      return <BudgetsPlaceholder />
    case 'goals':
      return <GoalsPage />
    case 'reports':
      return <ReportsPage />
    case 'ai-coach':
      return <AICoachPage />
    case 'settings':
      return <SettingsPage />
    case 'security':
      return <SecurityPlaceholder />
    default:
      return <DashboardPage />
  }
}

export default function Home() {
  const { isAuthenticated, user, setUser, setView, setExpenses, setIncomes, setBudgets, setGoals, setHealthScore } = useAppStore()
  const [ready, setReady] = useState(false)

  // Initialize: try to load from /api for seed data, then auto-login as demo
  useEffect(() => {
    async function init() {
      try {
        // Seed demo data
        const seedRes = await fetch('/api/seed', { method: 'POST' })
        const seedData = await seedRes.json()

        if (seedData.user) {
          setUser(seedData.user)

          // Load all data
          const [expRes, incRes, budRes, goalRes, healthRes] = await Promise.all([
            fetch(`/api/expenses?userId=${seedData.user.id}`).then(r => r.json()).catch(() => []),
            fetch(`/api/incomes?userId=${seedData.user.id}`).then(r => r.json()).catch(() => []),
            fetch(`/api/budgets?userId=${seedData.user.id}`).then(r => r.json()).catch(() => []),
            fetch(`/api/goals?userId=${seedData.user.id}`).then(r => r.json()).catch(() => []),
            fetch(`/api/health-score?userId=${seedData.user.id}`).then(r => r.json()).catch(() => ({ score: 0 })),
          ])

          if (Array.isArray(expRes)) setExpenses(expRes)
          if (Array.isArray(incRes)) setIncomes(incRes)
          if (Array.isArray(budRes)) setBudgets(budRes)
          if (Array.isArray(goalRes)) setGoals(goalRes)
          if (healthRes.score !== undefined) setHealthScore(healthRes.score)

          setView('dashboard')
        }
      } catch {
        setView('landing')
      }
      setReady(true)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen mesh-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-sm text-muted-foreground">Loading FinWise AI...</span>
        </div>
      </div>
    )
  }

  // Auth pages don't use the app shell
  if (!isAuthenticated) {
    return <ViewRouter />
  }

  return (
    <AppShell>
      <ViewRouter />
    </AppShell>
  )
}