import { create } from 'zustand'

export type ViewType =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'expenses'
  | 'income'
  | 'budgets'
  | 'goals'
  | 'reports'
  | 'ai-coach'
  | 'bills'
  | 'settings'
  | 'security'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  currency: string
}

export interface Expense {
  id: string
  userId: string
  title: string
  amount: number
  category: string
  date: string
  description?: string
  isRecurring: boolean
  createdAt: string
}

export interface Income {
  id: string
  userId: string
  title: string
  amount: number
  source: string
  date: string
  isRecurring: boolean
  createdAt: string
}

export interface Budget {
  id: string
  userId: string
  category: string
  limit: number
  spent: number
  period: string
  startDate: string
}

export interface Goal {
  id: string
  userId: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  icon: string
  color: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface AppState {
  // Navigation
  currentView: ViewType
  previousView: ViewType | null
  setView: (view: ViewType) => void
  goBack: () => void

  // Auth
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Data
  expenses: Expense[]
 setExpenses: (expenses: Expense[]) => void
  incomes: Income[]
  setIncomes: (incomes: Income[]) => void
  budgets: Budget[]
  setBudgets: (budgets: Budget[]) => void
  goals: Goal[]
  setGoals: (goals: Goal[]) => void
  chatMessages: ChatMessage[]
  addChatMessage: (msg: ChatMessage) => void
  clearChatMessages: () => void

  // Health score
  healthScore: number
  setHealthScore: (score: number) => void

  // Loading states
  isLoading: boolean
  setLoading: (loading: boolean) => void

  // Onboarding
  hasCompletedOnboarding: boolean
  setHasCompletedOnboarding: (v: boolean) => void
  onboardingData: Record<string, unknown>
  setOnboardingData: (data: Record<string, unknown>) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: 'landing',
  previousView: null,
  setView: (view) => set({ previousView: get().currentView, currentView: view }),
  goBack: () => {
    const prev = get().previousView
    if (prev) set({ currentView: prev, previousView: null })
  },

  // Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Data
  expenses: [],
  setExpenses: (expenses) => set({ expenses }),
  incomes: [],
  setIncomes: (incomes) => set({ incomes }),
  budgets: [],
  setBudgets: (budgets) => set({ budgets }),
  goals: [],
  setGoals: (goals) => set({ goals }),
  chatMessages: [],
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  clearChatMessages: () => set({ chatMessages: [] }),

  // Health score
  healthScore: 0,
  setHealthScore: (score) => set({ healthScore: score }),

  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Onboarding (persisted to localStorage)
  hasCompletedOnboarding: typeof window !== 'undefined' ? localStorage.getItem('finwise_onboarding_done') === 'true' : false,
  setHasCompletedOnboarding: (v) => {
    if (typeof window !== 'undefined') localStorage.setItem('finwise_onboarding_done', String(v))
    set({ hasCompletedOnboarding: v })
  },
  onboardingData: {},
  setOnboardingData: (data) => set((s) => ({ onboardingData: { ...s.onboardingData, ...data } })),
}))
