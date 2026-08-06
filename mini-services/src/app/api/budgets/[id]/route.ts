// GET /api/budgets/[id], PUT /api/budgets/[id], DELETE /api/budgets/[id]
import { NextRequest } from 'next/server';
import { budgetSchema } from '@/lib/validators';
import {
  getAuthUser,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import * as budgetService from '@/services/budget.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { id } = await context.params;
    const budget = await budgetService.getBudgetById(authUser.id, id);

    if (!budget) {
      return errorResponse('Budget not found', 404, 'NOT_FOUND');
    }

    return successResponse(budget);
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
    const parsed = budgetSchema.partial().safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const budget = await budgetService.updateBudget(authUser.id, id, parsed.data);
    return successResponse(budget, 'Budget updated');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { id } = await context.params;
    await budgetService.deleteBudget(authUser.id, id);

    return successResponse(null, 'Budget deleted');
  } catch (error) {
    return handleApiError(error);
  }
}
