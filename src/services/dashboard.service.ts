// ============================================================================
// FinWise - Dashboard Service
// ============================================================================

import { db } from '@/lib/db';
import type { DashboardData } from '@/types';
import {
  calculateBalance,
  calculateNetWorth,
  calculateSavingsRate,
  calculateFinancialHealthScore,
  calculateMonthlyChartData,
  calculateCategoryDistribution,
} from '@/lib/calculations';
import { startOfMonth, endOfMonth } from 'date-fns';

// ---------------------------------------------------------------------------
// Dashboard Data
// ---------------------------------------------------------------------------

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Fetch all user data in parallel
  const [
    allTransactions,
    currentMonthTransactions,
    budgets,
    goals,
    subscriptions,
    notifications,
  ] = await Promise.all([
    db.transaction.findMany({
      where: { userId },
      include: { category: true },
    }),
    db.transaction.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      include: { category: true },
    }),
    db.budget.findMany({
      where: { userId, isActive: true },
      include: { categoryBudgets: { include: { category: true } } },
    }),
    db.goal.findMany({ where: { userId } }),
    db.subscription.findMany({
      where: { userId, isActive: true },
    }),
    db.notification.findMany({
      where: { userId, isRead: false },
    }),
  ]);

  // Balance calculations
  const allBalance = calculateBalance(allTransactions);
  const monthBalance = calculateBalance(currentMonthTransactions);
  const netWorth = calculateNetWorth(allTransactions, goals);

  // Budget progress
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const budgetProgress = {
    totalBudget,
    totalSpent: monthBalance.expenses,
    remaining: Math.max(totalBudget - monthBalance.expenses, 0),
    utilizationPercent:
      totalBudget > 0
        ? Math.min((monthBalance.expenses / totalBudget) * 100, 100)
        : 0,
  };

  // Upcoming bills (next 30 days)
  const thirtyDaysFromNow = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000,
  );
  const upcomingBills = subscriptions.filter(
    (s) => s.nextBillingDate >= now && s.nextBillingDate <= thirtyDaysFromNow,
  );

  // Goals progress
  const goalsProgress = goals.map((g) => ({
    goal: g,
    progressPercent:
      g.targetAmount > 0
        ? Math.min((g.currentAmount / g.targetAmount) * 100, 100)
        : 0,
    remaining: Math.max(g.targetAmount - g.currentAmount, 0),
    estimatedCompletion: g.deadline
      ? new Date(g.deadline).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : undefined,
  }));

  // Monthly chart data
  const monthlyChartData = calculateMonthlyChartData(allTransactions, 6);

  // Category distribution (current month expenses)
  const expenseTxns = currentMonthTransactions.filter(
    (t) => t.type === 'expense',
  );
  const categoryDistribution = calculateCategoryDistribution(
    expenseTxns as unknown as Parameters<typeof calculateCategoryDistribution>[0],
  );

  // Financial health score
  const monthlyIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = monthBalance.expenses;

  const savingsRate = calculateSavingsRate(monthlyIncome, monthlyExpenses);
  const budgetAdherence =
    totalBudget > 0 ? Math.min((monthlyExpenses / totalBudget) * 100, 100) : 100;

  const emergencyFund = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const monthlyExpensesAvg =
    allBalance.expenses > 0
      ? allBalance.expenses /
        Math.max(
          Math.ceil(
            (now.getTime() -
              new Date(
                Math.min(
                  ...allTransactions.map((t) => new Date(t.date).getTime()),
                ),
              ).getTime()) /
              (30 * 24 * 60 * 60 * 1000),
          ),
          1,
        )
      : 0;

  const financialHealthScore = calculateFinancialHealthScore({
    savingsRate,
    budgetAdherence,
    debtRatio: 0, // No debt tracking in current schema
    emergencyFundMonths:
      monthlyExpensesAvg > 0 ? emergencyFund / monthlyExpensesAvg : 0,
    investmentRatio: (() => {
      if (monthlyIncome <= 0) return 0;
      const totalGoalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);
      const oldestTxnDate = allTransactions.length > 0
        ? Math.min(...allTransactions.map((t) => new Date(t.date).getTime()))
        : now.getTime();
      const monthsActive = Math.max(
        Math.ceil((now.getTime() - oldestTxnDate) / (30 * 24 * 60 * 60 * 1000)),
        1,
      );
      const totalIncome = monthlyIncome * monthsActive;
      return totalIncome > 0 ? totalGoalSavings / totalIncome : 0;
    })(),
  });

  // Recent transactions (last 10)
  const recentTransactions = [...allTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10) as unknown as DashboardData['recentTransactions'];

  return {
    balance: allBalance.balance,
    income: monthBalance.income,
    expenses: monthlyExpenses,
    savings: monthBalance.income - monthlyExpenses,
    netWorth,
    recentTransactions,
    budgetProgress,
    upcomingBills,
    unreadNotifications: notifications.length,
    financialHealthScore,
    monthlyChartData,
    categoryDistribution,
    goalsProgress,
  };
}

// ---------------------------------------------------------------------------
// Monthly Chart Data
// ---------------------------------------------------------------------------

export async function getMonthlyChartData(userId: string, months: number = 12) {
  const transactions = await db.transaction.findMany({
    where: { userId },
  });

  return calculateMonthlyChartData(transactions, months);
}

// ---------------------------------------------------------------------------
// Category Distribution
// ---------------------------------------------------------------------------

export async function getCategoryDistribution(
  userId: string,
  period: 'month' | 'year' = 'month',
) {
  const now = new Date();
  let startDate: Date;

  if (period === 'month') {
    startDate = startOfMonth(now);
  } else {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const transactions = await db.transaction.findMany({
    where: { userId, type: 'expense', date: { gte: startDate } },
    include: { category: true },
  });

  return calculateCategoryDistribution(
    transactions as unknown as Parameters<typeof calculateCategoryDistribution>[0],
  );
}
