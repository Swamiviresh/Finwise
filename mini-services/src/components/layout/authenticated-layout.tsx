'use client'

import { useEffect, useRef } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { useAuth } from '@/hooks/use-auth'
import { useRouterStore } from '@/store/router-store'
import { AppRoute } from '@/types'

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const { setRoute } = useRouterStore()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Only redirect to login after initial load is complete AND user is not authenticated
    // Prevents redirecting during the loading/verification phase
    if (!isLoading && !isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true
      setRoute(AppRoute.LOGIN)
    }
    // Reset the ref when authenticated (allows future redirects if session expires)
    if (isAuthenticated) {
      hasRedirected.current = false
    }
  }, [isAuthenticated, isLoading, setRoute])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading FinWise...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/30">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
