// POST /api/auth/forgot-password
import { NextRequest } from 'next/server';
import { forgotPasswordSchema } from '@/lib/validators';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import * as authService from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const result = await authService.forgotPassword(parsed.data.email);
    return successResponse(result, 'Reset link sent');
  } catch (error) {
    return handleApiError(error);
  }
}
