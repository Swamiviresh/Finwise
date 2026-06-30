import { useAppStore } from '@/store/use-app-store'

export function getUserCurrency(): string {
  return useAppStore.getState().user?.currency || 'USD'
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥',
}

export function getCurrencySymbol(currency?: string): string {
  const code = currency || getUserCurrency()
  return CURRENCY_SYMBOLS[code] || '$'
}

export function formatCurrency(amount: number, currency?: string): string {
  const curr = currency || getUserCurrency()
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    const symbol = CURRENCY_SYMBOLS[curr] || '$'
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
}
