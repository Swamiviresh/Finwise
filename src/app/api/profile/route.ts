// GET /api/profile & PUT /api/profile
import { NextRequest } from 'next/server';
import { profileSchema } from '@/lib/validators';
import {
  getAuthUser,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import * as authService from '@/services/auth.service';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const user = await authService.getUserById(authUser.id);
    if (!user) {
      return errorResponse('User not found', 404, 'NOT_FOUND');
    }

    return successResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      occupation: user.occupation,
      currency: user.currency,
      timezone: user.timezone,
      language: user.language,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const user = await authService.updateUserProfile(
      authUser.id,
      parsed.data,
    );

    return successResponse(user, 'Profile updated');
  } catch (error) {
    return handleApiError(error);
  }
}
