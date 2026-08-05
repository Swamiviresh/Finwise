// GET /api/settings & PUT /api/settings
import { NextRequest } from 'next/server';
import { settingsSchema } from '@/lib/validators';
import { db } from '@/lib/db';
import {
  getAuthUser,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    let settings = await db.settings.findUnique({
      where: { userId: authUser.id },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await db.settings.create({
        data: {
          userId: authUser.id,
        },
      });
    }

    return successResponse(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const settings = await db.settings.upsert({
      where: { userId: authUser.id },
      create: { userId: authUser.id, ...parsed.data },
      update: parsed.data,
    });

    // If currency changed, also update user
    if (parsed.data.currency) {
      await db.user.update({
        where: { id: authUser.id },
        data: { currency: parsed.data.currency },
      });
    }

    return successResponse(settings, 'Settings updated');
  } catch (error) {
    return handleApiError(error);
  }
}
