// GET /api/transactions (list) & POST /api/transactions (create)
import { NextRequest } from 'next/server';
import { transactionSchema } from '@/lib/validators';
import {
  getAuthUser,
  successResponse,
  errorResponse,
  paginatedResponse,
  handleApiError,
} from '@/lib/api-helpers';
import * as transactionService from '@/services/transaction.service';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { searchParams } = new URL(request.url);
    const filters = {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20,
      search: searchParams.get('search') || undefined,
      type: (searchParams.get('type') as 'income' | 'expense' | 'transfer') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      sortBy: searchParams.get('sortBy') || 'date',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const result = await transactionService.getTransactions(authUser.id, filters);

    return paginatedResponse(
      result.transactions,
      result.total,
      result.page,
      result.limit,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const transaction = await transactionService.createTransaction(
      authUser.id,
      parsed.data,
    );

    return successResponse(transaction, 'Transaction created', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
