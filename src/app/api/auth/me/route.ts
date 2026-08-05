// GET /api/auth/me
import { NextRequest } from 'next/server';
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers';
import * as authService from '@/services/auth.service';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = await authService.getUserById(authUser.id);
    if (!user || !user.isActive) {
      return errorResponse('User not found', 404, 'NOT_FOUND');
    }

    return successResponse(user);
  } catch (error) {
    console.error('[Auth ME Error]', error);
    return errorResponse('Internal server error', 500);
  }
}
