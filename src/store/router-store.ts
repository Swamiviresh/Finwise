'use client'

import { create } from 'zustand'
import { AppRoute, type User } from '@/types'

interface RouterState {
  route: string
  previousRoute: string | null
  routeParams: Record<string, string>
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

interface RouterActions {
  setRoute: (route: string, params?: Record<string, string>) => void
  goBack: () => void
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

type RouterStore = RouterState & RouterActions

export const useRouterStore = create<RouterStore>((set, get) => ({
  route: 'landing',
  previousRoute: null,
  routeParams: {},
  isAuthenticated: false,
  user: null,
  token: null,

  setRoute: (route, params) => {
    const currentRoute = get().route
    set({
      previousRoute: currentRoute,
      route,
      routeParams: params ?? {},
    })
  },

  goBack: () => {
    const { previousRoute } = get()
    if (previousRoute) {
      set({
        route: previousRoute,
        previousRoute: null,
      })
    } else {
      set({ route: AppRoute.DASHBOARD })
    }
  },

  setAuth: (user, token) => {
    set({
      isAuthenticated: true,
      user,
      token,
    })
  },

  clearAuth: () => {
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      route: 'landing',
      previousRoute: null,
      routeParams: {},
    })
  },
}))
