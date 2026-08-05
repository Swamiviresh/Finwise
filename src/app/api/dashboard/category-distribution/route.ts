// GET /api/dashboard/category-distribution
import { NextRequest } from 'next/server';
import { getAuthUser, successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import * as dashboardService from '@/services/dashboard.service';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const data = await dashboardService.getCategoryDistribution(authUser.id);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
