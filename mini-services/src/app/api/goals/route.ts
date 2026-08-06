// GET /api/goals (list) & POST /api/goals (create)
import { NextRequest } from 'next/server';
import { goalSchema } from '@/lib/validators';
import {
  getAuthUser,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import * as goalService from '@/services/goal.service';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const goals = await goalService.getGoals(authUser.id);
    return successResponse(goals);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const body = await request.json();
    const parsed = goalSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const goal = await goalService.createGoal(authUser.id, parsed.data);
    return successResponse(goal, 'Goal created', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
