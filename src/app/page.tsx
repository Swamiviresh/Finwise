'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import LandingPage from '@/components/landing/landing-page'
import LoginPage from '@/components/auth/login-page'
import RegisterPage from '@/components/auth/register-page'
import AppShell from '@/components/layout/app-shell'
import OnboardingWizard from '@/components/onboarding/onboarding-wizard'
import DashboardPage from '@/components/dashboard/dashboard-page'
import ExpensesPage from '@/components/expenses/expenses-page'
import IncomePage from '@/components/expenses/income-page'
import BudgetsPage from '@/components/budgets/budgets-page'
import GoalsPage from '@/components/goals/goals-page'
import ReportsPage from '@/components/reports/reports-page'
import AICoachPage from '@/components/ai-coach/ai-coach-page'
import SettingsPage from '@/components/settings/settings-page'
import SecurityPage from '@/components/settings/security-page'
import BillsPage from '@/components/bills/bills-page'
import WalletsPage from '@/components/wallets/wallets-page'
import CategoriesPage from '@/components/categories/categories-page'
import InsightsPage from '@/components/insights/insights-page'
import NotesPage from '@/components/notes/notes-page'

export default function Home() {
  const { currentView, isAuthenticated, hasCompletedOnboarding, setHasCompletedOnboarding, setView, setUser } = useAppStore()

  // Sync onboarding state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('finwise_onboarding_done')
    if (stored === 'true') setHasCompletedOnboarding(true)
  }, [setHasCompletedOnboarding])

  // Expose store for automation/testing
  useEffect(() => {
    const state = useAppStore.getState()
    ;(window as any).__finwise = { setView: state.setView, getState: useAppStore.getState }
  }, [])

  // Public views (no shell)
  if (!isAuthenticated) {
    switch (currentView) {
      case 'login': return <LoginPage />
      case 'register': return <RegisterPage />
      default: return <LandingPage />
    }
  }

  // Onboarding (before dashboard)
  if (currentView === 'onboarding' || !hasCompletedOnboarding) {
    return <OnboardingWizard />
  }

  // Authenticated views (with shell)
  return (
    <AppShell>
      <div key={currentView} className="page-enter">
      {currentView === 'dashboard' && <DashboardPage />}
      {currentView === 'expenses' && <ExpensesPage />}
      {currentView === 'income' && <IncomePage />}
      {currentView === 'budgets' && <BudgetsPage />}
      {currentView === 'goals' && <GoalsPage />}
      {currentView === 'bills' && <BillsPage />}
      {currentView === 'wallets' && <WalletsPage />}
      {currentView === 'categories' && <CategoriesPage />}
      {currentView === 'reports' && <ReportsPage />}
      {currentView === 'insights' && <InsightsPage />}
      {currentView === 'ai-coach' && <AICoachPage />}
      {currentView === 'notes' && <NotesPage />}
      {currentView === 'settings' && <SettingsPage />}
      {currentView === 'security' && <SecurityPage />}
      </div>
    </AppShell>
  )
}