// POST /api/auth/reset-password
import { NextRequest } from 'next/server';
import { resetPasswordSchema } from '@/lib/validators';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import * as authService from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    // Token can be in body or in query param
    const token =
      body.token || new URL(request.url).searchParams.get('token');

    if (!token) {
      return errorResponse('Reset token is required', 400, 'VALIDATION_ERROR');
    }

    const result = await authService.resetPassword(
      token,
      parsed.data.password,
    );
    return successResponse(result, 'Password reset successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
