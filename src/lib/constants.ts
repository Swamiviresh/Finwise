// ============================================================================
// FinWise - Application Constants
// ============================================================================

// --- Currencies ---

export const CURRENCY_CODES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', locale: 'de-CH' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', locale: 'ko-KR' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', locale: 'en-HK' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', locale: 'es-MX' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', locale: 'ru-RU' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', locale: 'en-ZA' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', locale: 'ar-AE' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', locale: 'sv-SE' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', locale: 'nb-NO' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', locale: 'tr-TR' },
] as const;

// --- Timezones ---

export const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (Brazil)' },
  { value: 'Europe/London', label: 'London (UK)' },
  { value: 'Europe/Paris', label: 'Paris (France)' },
  { value: 'Europe/Berlin', label: 'Berlin (Germany)' },
  { value: 'Europe/Moscow', label: 'Moscow (Russia)' },
  { value: 'Asia/Dubai', label: 'Dubai (UAE)' },
  { value: 'Asia/Kolkata', label: 'Mumbai / New Delhi (India)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (Thailand)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (China)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (Japan)' },
  { value: 'Asia/Seoul', label: 'Seoul (South Korea)' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { value: 'Australia/Sydney', label: 'Sydney (Australia)' },
  { value: 'Pacific/Auckland', label: 'Auckland (New Zealand)' },
] as const;

// --- Languages ---

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ar', name: 'العربية' },
  { code: 'ru', name: 'Русский' },
] as const;

// --- Default Categories ---

export const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'Food & Dining', icon: '🍽️', color: '#ef4444', type: 'expense' },
  { name: 'Transportation', icon: '🚗', color: '#f97316', type: 'expense' },
  { name: 'Housing', icon: '🏠', color: '#eab308', type: 'expense' },
  { name: 'Entertainment', icon: '🎬', color: '#84cc16', type: 'expense' },
  { name: 'Shopping', icon: '🛍️', color: '#22c55e', type: 'expense' },
  { name: 'Health & Fitness', icon: '💪', color: '#14b8a6', type: 'expense' },
  { name: 'Education', icon: '📚', color: '#06b6d4', type: 'expense' },
  { name: 'Utilities', icon: '⚡', color: '#8b5cf6', type: 'expense' },
  { name: 'Insurance', icon: '🛡️', color: '#a855f7', type: 'expense' },
  { name: 'Personal Care', icon: '💅', color: '#d946ef', type: 'expense' },
  { name: 'Gifts & Donations', icon: '🎁', color: '#ec4899', type: 'expense' },
  { name: 'Travel', icon: '✈️', color: '#f43f5e', type: 'expense' },
  { name: 'Subscriptions', icon: '📱', color: '#0ea5e9', type: 'expense' },
  // Income categories
  { name: 'Salary', icon: '💰', color: '#10b981', type: 'income' },
  { name: 'Freelance', icon: '💻', color: '#059669', type: 'income' },
  { name: 'Investments', icon: '📈', color: '#047857', type: 'income' },
  { name: 'Rental Income', icon: '🏢', color: '#065f46', type: 'income' },
  { name: 'Business Income', icon: '💼', color: '#064e3b', type: 'income' },
  { name: 'Side Hustle', icon: '🔧', color: '#34d399', type: 'income' },
  { name: 'Other Income', icon: '💵', color: '#6ee7b7', type: 'income' },
  // Other
  { name: 'Other', icon: '📌', color: '#6b7280', type: 'expense' },
  { name: 'Transfer', icon: '🔄', color: '#9ca3af', type: 'transfer' },
] as const;

// --- Payment Methods ---

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'debit_card', label: 'Debit Card', icon: '💳' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'digital_wallet', label: 'Digital Wallet', icon: '📱' },
  { value: 'check', label: 'Check', icon: '📝' },
  { value: 'crypto', label: 'Cryptocurrency', icon: '₿' },
] as const;

// --- Transaction Types ---

export const TRANSACTION_TYPES = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
] as const;

// --- Budget Periods ---

export const BUDGET_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

// --- Subscription Billing Cycles ---

export const SUBSCRIPTION_BILLING_CYCLES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

// --- Financial Health Ranges ---

export const FINANCIAL_HEALTH_RANGES = [
  { min: 90, max: 100, grade: 'A+', label: 'Excellent', color: '#10b981' },
  { min: 80, max: 89, grade: 'A', label: 'Very Good', color: '#22c55e' },
  { min: 70, max: 79, grade: 'B', label: 'Good', color: '#84cc16' },
  { min: 60, max: 69, grade: 'C', label: 'Fair', color: '#eab308' },
  { min: 50, max: 59, grade: 'D', label: 'Poor', color: '#f97316' },
  { min: 0, max: 49, grade: 'F', label: 'Critical', color: '#ef4444' },
] as const;

// --- App Config ---

export const APP_CONFIG = {
  APP_NAME: 'FinWise',
  APP_DESCRIPTION: 'Smart Personal Finance Management',
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_THEME: 'system' as const,
  DEFAULT_TIMEZONE: 'UTC',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MAX_TRANSACTION_AMOUNT: 999_999_999,
  MIN_PASSWORD_LENGTH: 8,
  SESSION_DURATION_DAYS: 7,
  BUDGET_ALERT_DEFAULT_THRESHOLD: 80,
  RESET_TOKEN_EXPIRY_HOURS: 1,
} as const;
