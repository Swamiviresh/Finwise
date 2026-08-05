// ============================================================================
// FinWise - Transaction Service
// ============================================================================

import { db } from '@/lib/db';
import type { TransactionFilters, TransactionWithCategory } from '@/types';
import { APP_CONFIG } from '@/lib/constants';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createTransaction(
  userId: string,
  data: {
    amount: number;
    description: string;
    type: string;
    date: string | Date;
    categoryId: string;
    paymentMethod?: string;
    notes?: string;
    attachmentUrl?: string;
    isRecurring?: boolean;
    recurringFreq?: string;
  },
) {
  const transaction = await db.transaction.create({
    data: {
      ...data,
      date: new Date(data.date),
      userId,
    },
    include: { category: true },
  });

  return transaction as unknown as TransactionWithCategory;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function getTransactions(
  userId: string,
  filters: TransactionFilters,
) {
  const {
    page = 1,
    limit = APP_CONFIG.DEFAULT_PAGE_SIZE,
    search,
    type,
    categoryId,
    startDate,
    endDate,
    sortBy = 'date',
    sortOrder = 'desc',
  } = filters;

  const effectiveLimit = Math.min(limit, APP_CONFIG.MAX_PAGE_SIZE);
  const skip = (page - 1) * effectiveLimit;

  const where: Record<string, unknown> = { userId };

  if (search) {
    where.description = { contains: search, mode: 'insensitive' as const };
  }
  if (type) {
    where.type = type;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
  }

  const orderBy: Record<string, string> = {};
  orderBy[sortBy] = sortOrder;

  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where,
      skip,
      take: effectiveLimit,
      orderBy,
      include: { category: true },
    }),
    db.transaction.count({ where }),
  ]);

  return {
    transactions: transactions as unknown as TransactionWithCategory[],
    total,
    page,
    limit: effectiveLimit,
    totalPages: Math.ceil(total / effectiveLimit),
  };
}

// ---------------------------------------------------------------------------
// Get by ID
// ---------------------------------------------------------------------------

export async function getTransactionById(
  userId: string,
  transactionId: string,
) {
  const transaction = await db.transaction.findFirst({
    where: { id: transactionId, userId },
    include: { category: true },
  });

  if (!transaction) return null;
  return transaction as unknown as TransactionWithCategory;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateTransaction(
  userId: string,
  transactionId: string,
  data: {
    amount?: number;
    description?: string;
    type?: string;
    date?: string | Date;
    categoryId?: string;
    paymentMethod?: string;
    notes?: string;
    attachmentUrl?: string;
    isRecurring?: boolean;
    recurringFreq?: string;
  },
) {
  const existing = await db.transaction.findFirst({
    where: { id: transactionId, userId },
  });
  if (!existing) throw new Error('NOT_FOUND');

  const updateData: Record<string, unknown> = { ...data };
  if (data.date) updateData.date = new Date(data.date);

  const transaction = await db.transaction.update({
    where: { id: transactionId },
    data: updateData,
    include: { category: true },
  });

  return transaction as unknown as TransactionWithCategory;
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteTransaction(
  userId: string,
  transactionId: string,
) {
  const existing = await db.transaction.findFirst({
    where: { id: transactionId, userId },
  });
  if (!existing) throw new Error('NOT_FOUND');

  await db.transaction.delete({ where: { id: transactionId } });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getTransactionStats(
  userId: string,
  period: 'month' | 'year' = 'month',
) {
  const now = new Date();
  const rangeStart =
    period === 'month' ? startOfMonth(now) : startOfYear(now);
  const rangeEnd = period === 'month' ? endOfMonth(now) : endOfYear(now);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: { gte: rangeStart, lte: rangeEnd },
    },
  });

  let income = 0;
  let expenses = 0;
  const categoryTotals: Record<string, number> = {};

  for (const t of transactions) {
    if (t.type === 'income') {
      income += t.amount;
    } else if (t.type === 'expense') {
      expenses += t.amount;
      categoryTotals[t.categoryId] =
        (categoryTotals[t.categoryId] || 0) + t.amount;
    }
  }

  const topCategories = await db.category.findMany({
    where: { id: { in: Object.keys(categoryTotals) } },
  });

  const topCategoryBreakdown = topCategories
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      amount: categoryTotals[cat.id] || 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    period,
    income,
    expenses,
    balance: income - expenses,
    savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
    transactionCount: transactions.length,
    topCategories: topCategoryBreakdown.slice(0, 5),
  };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function exportTransactions(
  userId: string,
  format: 'csv' | 'json' = 'csv',
) {
  const transactions = await db.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    include: { category: true },
  });

  if (format === 'json') {
    return {
      format: 'json' as const,
      data: JSON.stringify(transactions, null, 2),
      filename: `transactions_${Date.now()}.json`,
    };
  }

  // CSV
  const headers = [
    'Date',
    'Description',
    'Amount',
    'Type',
    'Category',
    'Payment Method',
    'Notes',
  ];
  const rows = transactions.map((t) => [
    new Date(t.date).toISOString().split('T')[0],
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.type,
    t.category?.name || 'Unknown',
    t.paymentMethod || '',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return {
    format: 'csv' as const,
    data: csv,
    filename: `transactions_${Date.now()}.csv`,
  };
}
