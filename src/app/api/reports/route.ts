// GET /api/reports (list) & POST /api/reports (generate)
import { NextRequest } from 'next/server';
import { reportSchema } from '@/lib/validators';
import { db } from '@/lib/db';
import {
  getAuthUser,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const reports = await db.report.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(reports);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const body = await request.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const now = new Date();
    let startDate: Date;
    let reportPeriod: string;

    if (parsed.data.type === 'monthly') {
      startDate = startOfMonth(now);
      reportPeriod = format(startDate, 'MMMM yyyy');
    } else if (parsed.data.type === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      reportPeriod = String(now.getFullYear());
    } else {
      startDate = new Date(parsed.data.period);
      reportPeriod = format(startDate, 'MMM d, yyyy');
    }

    // Fetch transaction data for the report period
    const transactions = await db.transaction.findMany({
      where: {
        userId: authUser.id,
        date: { gte: startDate, lte: now },
      },
      include: { category: true },
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const t of transactions) {
      if (t.type === 'income') totalIncome += t.amount;
      else if (t.type === 'expense') {
        totalExpenses += t.amount;
        const catName = t.category?.name || 'Other';
        categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + t.amount;
      }
    }

    const reportData = {
      period: reportPeriod,
      generatedAt: new Date().toISOString(),
      income: totalIncome,
      expenses: totalExpenses,
      net: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      transactionCount: transactions.length,
      categoryBreakdown,
    };

    const report = await db.report.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        period: reportPeriod,
        data: JSON.stringify(reportData),
        summary: `Income: $${totalIncome.toFixed(2)}, Expenses: $${totalExpenses.toFixed(2)}, Net: $${(totalIncome - totalExpenses).toFixed(2)}`,
        userId: authUser.id,
      },
    });

    return successResponse(report, 'Report generated', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
