'use client'

import { useAppStore } from '@/store/use-app-store'
import LandingPage from '@/components/landing/landing-page'
import LoginPage from '@/components/auth/login-page'
import RegisterPage from '@/components/auth/register-page'
import AppShell from '@/components/layout/app-shell'
import DashboardPage from '@/components/dashboard/dashboard-page'
import ExpensesPage from '@/components/expenses/expenses-page'
import IncomePage from '@/components/expenses/income-page'
import BudgetsPage from '@/components/budgets/budgets-page'
import GoalsPage from '@/components/goals/goals-page'
import ReportsPage from '@/components/reports/reports-page'
import AICoachPage from '@/components/ai-coach/ai-coach-page'
import SettingsPage from '@/components/settings/settings-page'
import SecurityPage from '@/components/settings/security-page'

export default function Home() {
  const { currentView, isAuthenticated } = useAppStore()

  // Public views (no shell)
  if (!isAuthenticated) {
    switch (currentView) {
      case 'login': return <LoginPage />
      case 'register': return <RegisterPage />
      default: return <LandingPage />
    }
  }

  // Authenticated views (with shell)
  return (
    <AppShell>
      {currentView === 'dashboard' && <DashboardPage />}
      {currentView === 'expenses' && <ExpensesPage />}
      {currentView === 'income' && <IncomePage />}
      {currentView === 'budgets' && <BudgetsPage />}
      {currentView === 'goals' && <GoalsPage />}
      {currentView === 'reports' && <ReportsPage />}
      {currentView === 'ai-coach' && <AICoachPage />}
      {currentView === 'settings' && <SettingsPage />}
      {currentView === 'security' && <SecurityPage />}
    </AppShell>
  )
}