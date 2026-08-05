// POST /api/auth/register
import { NextRequest } from 'next/server';
import { registerSchema } from '@/lib/validators';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-helpers';
import { generateToken, createSessionCookie } from '@/lib/auth';
import * as authService from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const user = await authService.registerUser(parsed.data);
    const token = await generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      currency: user.currency,
    });
    const cookie = createSessionCookie(token);

    const response = successResponse(
      { user, token },
      'Account created successfully',
      201,
    );

    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
