// GET /api/transactions/[id], PUT /api/transactions/[id], DELETE /api/transactions/[id]
import { NextRequest } from 'next/server';
import { transactionSchema } from '@/lib/validators';
import {
  getAuthUser,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import * as transactionService from '@/services/transaction.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { id } = await context.params;
    const transaction = await transactionService.getTransactionById(
      authUser.id,
      id,
    );

    if (!transaction) {
      return errorResponse('Transaction not found', 404, 'NOT_FOUND');
    }

    return successResponse(transaction);
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
    const parsed = transactionSchema.partial().safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const transaction = await transactionService.updateTransaction(
      authUser.id,
      id,
      parsed.data,
    );

    return successResponse(transaction, 'Transaction updated');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { id } = await context.params;
    await transactionService.deleteTransaction(authUser.id, id);

    return successResponse(null, 'Transaction deleted');
  } catch (error) {
    return handleApiError(error);
  }
}
