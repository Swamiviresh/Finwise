'use client'

import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  searchQuery: string
  globalLoading: boolean
}

interface AppActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setGlobalLoading: (loading: boolean) => void
}

type AppStore = AppState & AppActions

export const useAppStore = create<AppStore>((set, get) => ({
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  searchQuery: '',
  globalLoading: false,

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open })
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  setGlobalLoading: (loading) => {
    set({ globalLoading: loading })
  },
}))
