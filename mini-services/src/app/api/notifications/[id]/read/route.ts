// PUT /api/notifications/[id]/read
import { NextRequest } from 'next/server';
import { getAuthUser, successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { db } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { id } = await context.params;

    const notification = await db.notification.findFirst({
      where: { id, userId: authUser.id },
    });

    if (!notification) {
      return errorResponse('Notification not found', 404, 'NOT_FOUND');
    }

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return successResponse(updated, 'Notification marked as read');
  } catch (error) {
    return handleApiError(error);
  }
}
