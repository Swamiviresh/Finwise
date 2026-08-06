// ============================================================================
// FinWise - TypeScript Types & Interfaces
// ============================================================================

// --- User & Auth ---

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  occupation: string | null;
  currency: string;
  timezone: string;
  language: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  occupation: string | null;
  currency: string;
  timezone: string;
  language: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  currency: string;
}

// --- Category ---

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  type: 'income' | 'expense' | 'transfer';
  isDefault: boolean;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryCreate {
  name: string;
  icon?: string;
  color?: string;
  type?: 'income' | 'expense' | 'transfer';
}

// --- Transaction ---

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense' | 'transfer';
  date: Date;
  categoryId: string;
  paymentMethod: string | null;
  notes: string | null;
  attachmentUrl: string | null;
  isRecurring: boolean;
  recurringFreq: string | null;
  userId: string;
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionCreate {
  amount: number;
  description: string;
  type: 'income' | 'expense' | 'transfer';
  date: string | Date;
  categoryId: string;
  paymentMethod?: string;
  notes?: string;
  attachmentUrl?: string;
  isRecurring?: boolean;
  recurringFreq?: string;
}

export interface TransactionUpdate {
  amount?: number;
  description?: string;
  type?: 'income' | 'expense' | 'transfer';
  date?: string | Date;
  categoryId?: string;
  paymentMethod?: string;
  notes?: string;
  attachmentUrl?: string;
  isRecurring?: boolean;
  recurringFreq?: string;
}

export interface TransactionWithCategory extends Transaction {
  category: Category;
}

// --- Budget ---

export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date | null;
  alertThreshold: number;
  isActive: boolean;
  userId: string;
  categoryBudgets?: CategoryBudget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetCreate {
  name: string;
  amount: number;
  period?: 'weekly' | 'monthly' | 'yearly';
  startDate: string | Date;
  endDate?: string | Date;
  alertThreshold?: number;
  categoryBudgets?: { categoryId: string; amount: number }[];
}

export interface CategoryBudget {
  id: string;
  amount: number;
  spent: number;
  budgetId: string;
  categoryId: string;
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetWithCategories extends Budget {
  categoryBudgets: (CategoryBudget & { category: Category })[];
}

// --- Goal ---

export interface Goal {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
  icon: string | null;
  color: string;
  isCompleted: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalCreate {
  name: string;
  targetAmount: number;
  deadline?: string | Date;
  description?: string;
  icon?: string;
  color?: string;
}

export interface GoalUpdate {
  name?: string;
  description?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string | Date;
  icon?: string;
  color?: string;
  isCompleted?: boolean;
}

// --- Subscription ---

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  nextBillingDate: Date;
  startDate: Date;
  endDate: Date | null;
  category: string | null;
  icon: string | null;
  color: string;
  isActive: boolean;
  url: string | null;
  notes: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionCreate {
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  nextBillingDate: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  category?: string;
  icon?: string;
  color?: string;
  url?: string;
  notes?: string;
}

// --- Notification ---

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  actionUrl: string | null;
  userId: string;
  createdAt: Date;
}

// --- Settings ---

export interface Settings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
  enableNotifications: boolean;
  enableEmailDigest: boolean;
  budgetAlertThreshold: number;
  weeklyReportEnabled: boolean;
  dataExportFormat: 'csv' | 'json';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsUpdate {
  theme?: 'light' | 'dark' | 'system';
  currency?: string;
  language?: string;
  enableNotifications?: boolean;
  enableEmailDigest?: boolean;
  budgetAlertThreshold?: number;
  weeklyReportEnabled?: boolean;
  dataExportFormat?: 'csv' | 'json';
}

// --- Report ---

export interface Report {
  id: string;
  name: string;
  type: 'monthly' | 'yearly' | 'custom';
  period: string;
  data: string;
  summary: string | null;
  userId: string;
  createdAt: Date;
}

// --- Chat ---

export interface Chat {
  id: string;
  title: string | null;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens: number | null;
  chatId: string;
  createdAt: Date;
}

export interface ChatCreate {
  title?: string;
  message: string;
}

// --- API ---

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  code?: string;
}

// --- Pagination ---

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// --- Dashboard ---

export interface DashboardData {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
  netWorth: number;
  recentTransactions: TransactionWithCategory[];
  budgetProgress: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    utilizationPercent: number;
  };
  upcomingBills: Subscription[];
  unreadNotifications: number;
  financialHealthScore: FinancialHealthScore;
  monthlyChartData: ChartDataPoint[];
  categoryDistribution: CategoryDistribution[];
  goalsProgress: GoalProgress[];
}

export interface GoalProgress {
  goal: Goal;
  progressPercent: number;
  remaining: number;
  estimatedCompletion?: string;
}

export interface CategoryDistribution {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  amount: number;
  percentage: number;
  transactionCount: number;
}

// --- Financial Health ---

export interface FinancialHealthScore {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  savingsRate: number;
  budgetAdherence: number;
  debtRatio: number;
  emergencyFundMonths: number;
  investmentRatio: number;
  summary: string;
  recommendations: string[];
}

// --- Chart ---

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  category?: string;
}

// --- Routes (SPA Router) ---

export enum AppRoute {
  LOGIN = '/login',
  REGISTER = '/register',
  FORGOT_PASSWORD = '/forgot-password',
  RESET_PASSWORD = '/reset-password',
  DASHBOARD = '/dashboard',
  TRANSACTIONS = '/transactions',
  BUDGETS = '/budgets',
  GOALS = '/goals',
  SUBSCRIPTIONS = '/subscriptions',
  ANALYTICS = '/analytics',
  REPORTS = '/reports',
  SETTINGS = '/settings',
  PROFILE = '/profile',
  CHAT = '/chat',
  NOTIFICATIONS = '/notifications',
}

export enum ThemeType {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

// --- Transaction Filters ---

export interface TransactionFilters extends PaginationParams {
  search?: string;
  type?: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

// --- Analytics ---

export interface AnalyticsData {
  monthlyTrend: ChartDataPoint[];
  categoryBreakdown: CategoryDistribution[];
  spendingByDay: ChartDataPoint[];
  incomeVsExpense: ChartDataPoint[];
  topCategories: CategoryDistribution[];
  monthlySavings: ChartDataPoint[];
}

// --- Zod Inferred Types ---

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
};

export type LoginInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  password: string;
  confirmPassword: string;
};

export type TransactionInput = {
  amount: number;
  description: string;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  categoryId: string;
  paymentMethod?: string;
  notes?: string;
};

export type BudgetInput = {
  name: string;
  amount: number;
  period?: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  categoryBudgets?: { categoryId: string; amount: number }[];
};

export type GoalInput = {
  name: string;
  targetAmount: number;
  deadline?: string;
  description?: string;
  icon?: string;
  color?: string;
};

export type SubscriptionInput = {
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  nextBillingDate: string;
  category?: string;
  url?: string;
  notes?: string;
};

export type SettingsInput = {
  theme?: 'light' | 'dark' | 'system';
  currency?: string;
  language?: string;
  enableNotifications?: boolean;
  enableEmailDigest?: boolean;
  budgetAlertThreshold?: number;
  weeklyReportEnabled?: boolean;
  dataExportFormat?: 'csv' | 'json';
};

export type ProfileInput = {
  name?: string;
  phone?: string;
  occupation?: string;
  currency?: string;
  timezone?: string;
  language?: string;
};
