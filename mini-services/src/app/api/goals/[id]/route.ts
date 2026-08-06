// GET /api/goals/[id], PUT /api/goals/[id], DELETE /api/goals/[id]
import { NextRequest } from 'next/server';
import { goalSchema } from '@/lib/validators';
import {
  getAuthUser,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import * as goalService from '@/services/goal.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { id } = await context.params;
    const goal = await goalService.getGoalById(authUser.id, id);

    if (!goal) {
      return errorResponse('Goal not found', 404, 'NOT_FOUND');
    }

    return successResponse(goal);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { id } = await context.params;
    const body = await request.json();
    const parsed = goalSchema.partial().safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const goal = await goalService.updateGoal(authUser.id, id, parsed.data);
    return successResponse(goal, 'Goal updated');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { id } = await context.params;
    await goalService.deleteGoal(authUser.id, id);

    return successResponse(null, 'Goal deleted');
  } catch (error) {
    return handleApiError(error);
  }
}
