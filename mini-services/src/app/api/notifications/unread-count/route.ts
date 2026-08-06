// GET /api/notifications/unread-count
import { NextRequest } from 'next/server';
import { getAuthUser, successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const count = await db.notification.count({
      where: { userId: authUser.id, isRead: false },
    });

    return successResponse({ count });
  } catch (error) {
    return handleApiError(error);
  }
}
