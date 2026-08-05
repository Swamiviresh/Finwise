// GET /api/dashboard/monthly-chart?months=6
import { NextRequest } from 'next/server';
import { getAuthUser, successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import * as dashboardService from '@/services/dashboard.service';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6', 10);

    const data = await dashboardService.getMonthlyChartData(authUser.id, months);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
