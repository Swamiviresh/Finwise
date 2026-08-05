'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRouterStore } from '@/store/router-store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import { LandingPage } from '@/components/pages/landing-page'
import { LoginPage } from '@/components/pages/login-page'
import { RegisterPage } from '@/components/pages/register-page'
import { ForgotPasswordPage } from '@/components/pages/forgot-password-page'
import { DashboardPage } from '@/components/pages/dashboard-page'
import { TransactionsPage } from '@/components/pages/transactions-page'
import { BudgetsPage } from '@/components/pages/budgets-page'
import { GoalsPage } from '@/components/pages/goals-page'
import { SubscriptionsPage } from '@/components/pages/subscriptions-page'
import { NotificationsPage } from '@/components/pages/notifications-page'
import { AnalyticsPage } from '@/components/pages/analytics-page'
import { ReportsPage } from '@/components/pages/reports-page'
import { AiAssistantPage } from '@/components/pages/ai-assistant-page'
import { ProfilePage } from '@/components/pages/profile-page'
import { SettingsPage } from '@/components/pages/settings-page'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { AppRoute } from '@/types'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

const publicRoutes = new Set([
  'landing',
  AppRoute.LOGIN,
  AppRoute.REGISTER,
  AppRoute.FORGOT_PASSWORD,
  AppRoute.RESET_PASSWORD,
])

function PageRouter() {
  const { route, isAuthenticated } = useRouterStore()

  const pageMap: Record<string, React.ReactNode> = {
    landing: <LandingPage />,
    [AppRoute.LOGIN]: <LoginPage />,
    [AppRoute.REGISTER]: <RegisterPage />,
    [AppRoute.FORGOT_PASSWORD]: <ForgotPasswordPage />,
    [AppRoute.DASHBOARD]: <DashboardPage />,
    [AppRoute.TRANSACTIONS]: <TransactionsPage />,
    [AppRoute.BUDGETS]: <BudgetsPage />,
    [AppRoute.GOALS]: <GoalsPage />,
    [AppRoute.SUBSCRIPTIONS]: <SubscriptionsPage />,
    [AppRoute.NOTIFICATIONS]: <NotificationsPage />,
    [AppRoute.ANALYTICS]: <AnalyticsPage />,
    [AppRoute.REPORTS]: <ReportsPage />,
    [AppRoute.CHAT]: <AiAssistantPage />,
    [AppRoute.PROFILE]: <ProfilePage />,
    [AppRoute.SETTINGS]: <SettingsPage />,
  }

  const page = pageMap[route] ?? <LandingPage />
  const isPublic = publicRoutes.has(route)

  const content = (
    <AnimatePresence mode="wait">
      <motion.div
        key={route}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {page}
      </motion.div>
    </AnimatePresence>
  )

  // If authenticated and on a protected route, wrap with authenticated layout
  if (!isPublic && isAuthenticated) {
    return <AuthenticatedLayout>{content}</AuthenticatedLayout>
  }

  return content
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <PageRouter />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
