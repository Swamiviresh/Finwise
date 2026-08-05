// POST /api/auth/login
import { NextRequest } from 'next/server';
import { loginSchema } from '@/lib/validators';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { createSessionCookie } from '@/lib/auth';
import * as authService from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const { token, user } = await authService.loginUser(
      parsed.data.email,
      parsed.data.password,
    );

    const cookie = createSessionCookie(token);

    const response = successResponse({ user, token }, 'Login successful');
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
