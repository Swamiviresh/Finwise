// ============================================================================
// FinWise - Formatting Utilities
// ============================================================================

import { CURRENCY_CODES } from './constants';
import { formatDistanceToNow, format, parseISO } from 'date-fns';

function getCurrencyInfo(code: string) {
  return (
    CURRENCY_CODES.find((c) => c.code === code) ?? {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      locale: 'en-US',
    }
  );
}

/**
 * Format an amount as currency string.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
): string {
  const info = getCurrencyInfo(currency);
  try {
    return new Intl.NumberFormat(info.locale, {
      style: 'currency',
      currency: info.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${info.symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Format a date to a readable string (e.g., "Jan 15, 2025").
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

/**
 * Format a date-time to a readable string (e.g., "Jan 15, 2025, 3:30 PM").
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy, h:mm a');
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago").
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format a number with thousands separators.
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format a value as a percentage string.
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Compact number format (e.g., 1.2K, 3.5M).
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(num % 1 === 0 ? 0 : 2);
}
