// GET /api/settings & PUT /api/settings
import { NextRequest, NextResponse } from 'next/server';
import { settingsSchema } from '@/lib/validators';
import { db } from '@/lib/db';
import {
  getAuthUser,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import { generateToken, createSessionCookie } from '@/lib/auth';

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

    // If currency changed, update user and re-issue JWT + cookie
    let newToken: string | undefined;
    if (parsed.data.currency) {
      await db.user.update({
        where: { id: authUser.id },
        data: { currency: parsed.data.currency },
      });

      // Re-issue JWT with updated currency
      newToken = await generateToken({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        role: authUser.role,
        currency: parsed.data.currency,
      });
    }

    const response = NextResponse.json(
      { success: true, data: settings, ...(newToken ? { token: newToken } : {}), message: 'Settings updated' },
      { status: 200 },
    );

    // Set new JWT as httpOnly cookie if re-issued
    if (newToken) {
      const cookie = createSessionCookie(newToken);
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
