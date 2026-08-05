// GET /api/analytics
import { NextRequest } from 'next/server';
import { getAuthUser, successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import * as dashboardService from '@/services/dashboard.service';
import * as transactionService from '@/services/transaction.service';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as 'month' | 'year') || 'month';
    const months = Number(searchParams.get('months')) || 12;

    const [monthlyChartData, categoryDistribution, stats] = await Promise.all([
      dashboardService.getMonthlyChartData(authUser.id, months),
      dashboardService.getCategoryDistribution(authUser.id, period),
      transactionService.getTransactionStats(authUser.id, period),
    ]);

    return successResponse({
      monthlyTrend: monthlyChartData,
      categoryBreakdown: categoryDistribution,
      incomeVsExpense: monthlyChartData.map((d) => ({
        label: d.label,
        value: d.value,
        secondaryValue: d.secondaryValue,
      })),
      topCategories: categoryDistribution.slice(0, 10),
      monthlySavings: monthlyChartData.map((d) => ({
        label: d.label,
        value: (d.secondaryValue ?? 0) > 0
          ? d.value - d.secondaryValue
          : d.value,
      })),
      summary: stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
