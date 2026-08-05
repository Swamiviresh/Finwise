// GET /api/budgets (list) & POST /api/budgets (create)
import { NextRequest } from 'next/server';
import { budgetSchema } from '@/lib/validators';
import {
  getAuthUser,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import * as budgetService from '@/services/budget.service';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const budgets = await budgetService.getBudgets(authUser.id);
    return successResponse(budgets);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const body = await request.json();
    const parsed = budgetSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const budget = await budgetService.createBudget(authUser.id, parsed.data);
    return successResponse(budget, 'Budget created', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
