// ============================================================================
// FinWise - Financial Calculation Utilities
// ============================================================================

import type {
  Transaction,
  Goal,
  Budget,
  FinancialHealthScore,
  ChartDataPoint,
  CategoryDistribution,
} from '@/types';

// ---------------------------------------------------------------------------
// Balance
// ---------------------------------------------------------------------------

export function calculateBalance(
  transactions: Pick<Transaction, 'amount' | 'type'>[],
): { income: number; expenses: number; balance: number } {
  let income = 0;
  let expenses = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      income += t.amount;
    } else if (t.type === 'expense') {
      expenses += t.amount;
    }
  }

  return { income, expenses, balance: income - expenses };
}

// ---------------------------------------------------------------------------
// Net Worth
// ---------------------------------------------------------------------------

export function calculateNetWorth(
  transactions: Pick<Transaction, 'amount' | 'type'>[],
  goals: Pick<Goal, 'currentAmount'>[],
): number {
  const { balance } = calculateBalance(transactions);
  const goalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  return balance - goalSavings;
}

// ---------------------------------------------------------------------------
// Budget Utilization
// ---------------------------------------------------------------------------

export function calculateBudgetUtilization(
  budget: Pick<Budget, 'amount' | 'spent'>,
): { percent: number; remaining: number; isOverBudget: boolean } {
  const percent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
  return {
    percent: Math.min(percent, 100),
    remaining: Math.max(budget.amount - budget.spent, 0),
    isOverBudget: budget.spent > budget.amount,
  };
}

// ---------------------------------------------------------------------------
// Savings Rate
// ---------------------------------------------------------------------------

export function calculateSavingsRate(
  income: number,
  expenses: number,
): number {
  if (income <= 0) return 0;
  return ((income - expenses) / income) * 100;
}

// ---------------------------------------------------------------------------
// Financial Health Score (0-100)
// ---------------------------------------------------------------------------

export function calculateFinancialHealthScore(metrics: {
  savingsRate: number;
  budgetAdherence: number; // 0-100 percent of budget used (100 = perfectly within)
  debtRatio: number; // debt / income (lower is better)
  emergencyFundMonths: number;
  investmentRatio: number; // investments / income
}): FinancialHealthScore {
  // Score components (each 0-20, total 0-100)
  const savingsScore = Math.min(metrics.savingsRate / 30, 1) * 20; // 30%+ is ideal
  const budgetScore = metrics.budgetAdherence >= 0 && metrics.budgetAdherence <= 100
    ? (metrics.budgetAdherence / 100) * 20
    : 0;
  const debtScore = metrics.debtRatio < 0 ? 20 : Math.max(20 - metrics.debtRatio * 40, 0);
  const emergencyScore = Math.min(metrics.emergencyFundMonths / 6, 1) * 20; // 6+ months ideal
  const investmentScore = Math.min(metrics.investmentRatio / 0.2, 1) * 20; // 20%+ ideal

  const score = Math.round(
    savingsScore + budgetScore + debtScore + emergencyScore + investmentScore,
  );

  // Determine grade
  let grade: FinancialHealthScore['grade'] = 'F';
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 50) grade = 'D';

  // Recommendations
  const recommendations: string[] = [];
  if (metrics.savingsRate < 20) recommendations.push('Try to save at least 20% of your income.');
  if (metrics.budgetAdherence > 100) recommendations.push('You are exceeding your budget. Review your spending.');
  if (metrics.debtRatio > 0.4) recommendations.push('Your debt ratio is high. Focus on reducing debt.');
  if (metrics.emergencyFundMonths < 3) recommendations.push('Build an emergency fund covering at least 3 months of expenses.');
  if (metrics.investmentRatio < 0.1) recommendations.push('Consider investing a portion of your income for long-term growth.');

  // Summary
  const summary =
    score >= 80
      ? 'Your finances are in great shape! Keep up the good work.'
      : score >= 60
        ? 'Your financial health is decent but there is room for improvement.'
        : score >= 40
          ? 'Your finances need attention. Focus on the recommendations below.'
          : 'Your financial health needs immediate attention. Take action on the recommendations below.';

  return {
    score,
    grade,
    savingsRate: metrics.savingsRate,
    budgetAdherence: metrics.budgetAdherence,
    debtRatio: metrics.debtRatio,
    emergencyFundMonths: metrics.emergencyFundMonths,
    investmentRatio: metrics.investmentRatio,
    summary,
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// Goal Completion Estimate
// ---------------------------------------------------------------------------

export function calculateGoalCompletionEstimate(
  goal: Pick<Goal, 'targetAmount' | 'currentAmount' | 'deadline'>,
  monthlyContribution: number,
): { estimatedMonths: number; estimatedDate: string | null; onTrack: boolean } {
  const remaining = goal.targetAmount - goal.currentAmount;

  if (remaining <= 0) {
    return { estimatedMonths: 0, estimatedDate: new Date().toISOString(), onTrack: true };
  }

  if (monthlyContribution <= 0) {
    return { estimatedMonths: Infinity, estimatedDate: null, onTrack: false };
  }

  const estimatedMonths = Math.ceil(remaining / monthlyContribution);
  const estimatedDate = new Date();
  estimatedDate.setMonth(estimatedDate.getMonth() + estimatedMonths);

  // Check if on track based on deadline
  let onTrack = true;
  if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline);
    const monthsUntilDeadline =
      (deadlineDate.getFullYear() - new Date().getFullYear()) * 12 +
      deadlineDate.getMonth() -
      new Date().getMonth();
    const requiredMonthly = remaining / Math.max(monthsUntilDeadline, 1);
    onTrack = monthlyContribution >= requiredMonthly;
  }

  return {
    estimatedMonths,
    estimatedDate: estimatedDate.toISOString(),
    onTrack,
  };
}

// ---------------------------------------------------------------------------
// Chart helpers
// ---------------------------------------------------------------------------

export function calculateMonthlyChartData(
  transactions: Pick<Transaction, 'amount' | 'type' | 'date'>[],
  months: number = 6,
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    let income = 0;
    let expenses = 0;

    for (const t of transactions) {
      const tDate = new Date(t.date);
      if (tDate >= monthStart && tDate <= monthEnd) {
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'expense') expenses += t.amount;
      }
    }

    const monthLabel = monthStart.toLocaleString('en-US', {
      month: 'short',
      year: '2-digit',
    });

    data.push({ label: monthLabel, value: income, secondaryValue: expenses });
  }

  return data;
}

export function calculateCategoryDistribution(
  transactions: (Transaction & { category?: Pick<import('@/types').Category, 'id' | 'name' | 'color' | 'icon'> })[],
): CategoryDistribution[] {
  const map = new Map<
    string,
    { amount: number; count: number; name: string; color: string; icon: string | null }
  >();

  for (const t of transactions) {
    const catId = t.categoryId;
    const existing = map.get(catId);

    if (existing) {
      existing.amount += t.amount;
      existing.count += 1;
    } else {
      map.set(catId, {
        amount: t.amount,
        count: 1,
        name: t.category?.name ?? 'Unknown',
        color: t.category?.color ?? '#6b7280',
        icon: t.category?.icon ?? null,
      });
    }
  }

  const total = Array.from(map.values()).reduce((s, v) => s + v.amount, 0);
  const result: CategoryDistribution[] = [];

  for (const [catId, val] of map.entries()) {
    result.push({
      categoryId: catId,
      categoryName: val.name,
      categoryColor: val.color,
      categoryIcon: val.icon,
      amount: val.amount,
      percentage: total > 0 ? (val.amount / total) * 100 : 0,
      transactionCount: val.count,
    });
  }

  return result.sort((a, b) => b.amount - a.amount);
}
