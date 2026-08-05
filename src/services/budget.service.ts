// ============================================================================
// FinWise - Budget Service
// ============================================================================

import { db } from '@/lib/db';
import { calculateBudgetUtilization } from '@/lib/calculations';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createBudget(
  userId: string,
  data: {
    name: string;
    amount: number;
    period?: string;
    startDate: string | Date;
    endDate?: string | Date;
    alertThreshold?: number;
    categoryBudgets?: { categoryId: string; amount: number }[];
  },
) {
  const startDate = new Date(data.startDate);
  let endDate: Date | null = data.endDate ? new Date(data.endDate) : null;

  // Auto-calculate end date based on period
  if (!endDate && data.period) {
    if (data.period === 'weekly') endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    else if (data.period === 'monthly') endDate = addMonths(startDate, 1);
    else if (data.period === 'yearly') endDate = addMonths(startDate, 12);
  }

  const budget = await db.budget.create({
    data: {
      name: data.name,
      amount: data.amount,
      period: data.period || 'monthly',
      startDate,
      endDate,
      alertThreshold: data.alertThreshold ?? 80,
      userId,
      categoryBudgets: data.categoryBudgets
        ? {
            create: data.categoryBudgets.map((cb) => ({
              categoryId: cb.categoryId,
              amount: cb.amount,
            })),
          }
        : undefined,
    },
    include: { categoryBudgets: { include: { category: true } } },
  });

  return budget;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function getBudgets(userId: string) {
  return db.budget.findMany({
    where: { userId, isActive: true },
    include: { categoryBudgets: { include: { category: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

// ---------------------------------------------------------------------------
// Get by ID
// ---------------------------------------------------------------------------

export async function getBudgetById(userId: string, budgetId: string) {
  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId },
    include: { categoryBudgets: { include: { category: true } } },
  });

  if (!budget) return null;
  return budget;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateBudget(
  userId: string,
  budgetId: string,
  data: {
    name?: string;
    amount?: number;
    period?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    alertThreshold?: number;
    isActive?: boolean;
    categoryBudgets?: { categoryId: string; amount: number }[];
  },
) {
  const existing = await db.budget.findFirst({
    where: { id: budgetId, userId },
  });
  if (!existing) throw new Error('NOT_FOUND');

  const updateData: Record<string, unknown> = { ...data };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  // Handle category budgets replacement
  if (data.categoryBudgets) {
    await db.categoryBudget.deleteMany({ where: { budgetId } });
  }

  const budget = await db.budget.update({
    where: { id: budgetId },
    data: {
      ...updateData,
      ...(data.categoryBudgets
        ? {
            categoryBudgets: {
              create: data.categoryBudgets.map((cb) => ({
                categoryId: cb.categoryId,
                amount: cb.amount,
              })),
            },
          }
        : {}),
    },
    include: { categoryBudgets: { include: { category: true } } },
  });

  return budget;
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteBudget(userId: string, budgetId: string) {
  const existing = await db.budget.findFirst({
    where: { id: budgetId, userId },
  });
  if (!existing) throw new Error('NOT_FOUND');

  await db.budget.delete({ where: { id: budgetId } });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Budget Progress
// ---------------------------------------------------------------------------

export async function getBudgetProgress(userId: string, budgetId: string) {
  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId },
    include: { categoryBudgets: { include: { category: true } } },
  });

  if (!budget) throw new Error('NOT_FOUND');

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Calculate total spent in the budget period
  const expenseTransactions = await db.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  const totalSpent = expenseTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  // Calculate per-category spent
  const categorySpent: Record<string, number> = {};
  for (const t of expenseTransactions) {
    categorySpent[t.categoryId] = (categorySpent[t.categoryId] || 0) + t.amount;
  }

  const utilization = calculateBudgetUtilization({ amount: budget.amount, spent: totalSpent });

  const categoryProgress = budget.categoryBudgets.map((cb) => ({
    ...cb,
    spent: categorySpent[cb.categoryId] || 0,
    utilization: calculateBudgetUtilization({
      amount: cb.amount,
      spent: categorySpent[cb.categoryId] || 0,
    }),
  }));

  return {
    budget,
    totalSpent,
    ...utilization,
    categoryProgress,
  };
}

// ---------------------------------------------------------------------------
// Budget Alerts
// ---------------------------------------------------------------------------

export async function checkBudgetAlerts(userId: string) {
  const budgets = await db.budget.findMany({
    where: { userId, isActive: true },
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const alerts: {
    budgetId: string;
    budgetName: string;
    percent: number;
    type: 'warning' | 'exceeded';
  }[] = [];

  for (const budget of budgets) {
    const expenses = await db.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        date: { gte: monthStart, lte: monthEnd },
      },
    });

    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    const percent = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;

    if (percent >= budget.alertThreshold && percent < 100) {
      alerts.push({
        budgetId: budget.id,
        budgetName: budget.name,
        percent: Math.round(percent),
        type: 'warning',
      });
    } else if (percent >= 100) {
      alerts.push({
        budgetId: budget.id,
        budgetName: budget.name,
        percent: Math.round(percent),
        type: 'exceeded',
      });
    }
  }

  return alerts;
}
