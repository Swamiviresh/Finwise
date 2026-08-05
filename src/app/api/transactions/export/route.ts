// GET /api/transactions/export
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthUser, errorResponse, handleApiError } from '@/lib/api-helpers';
import * as transactionService from '@/services/transaction.service';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') as 'csv' | 'json') || 'csv';

    if (!['csv', 'json'].includes(format)) {
      return errorResponse('Invalid format. Use csv or json.', 400);
    }

    const result = await transactionService.exportTransactions(authUser.id, format);

    const contentType =
      format === 'csv' ? 'text/csv' : 'application/json';

    return new NextResponse(result.data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
