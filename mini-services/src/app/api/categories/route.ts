// GET /api/categories & POST /api/categories
import { NextRequest } from 'next/server';
import { categorySchema } from '@/lib/validators';
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

    // Return both default and user-specific categories
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;

    const where: Record<string, unknown> = {
      OR: [
        { userId: null, isDefault: true },
        { userId: authUser.id },
      ],
    };

    if (type) {
      where.OR = [
        { userId: null, isDefault: true, type },
        { userId: authUser.id, type },
      ];
    }

    const categories = await db.category.findMany({
      where,
      orderBy: [{ isDefault: 'asc' }, { name: 'asc' }],
    });

    return successResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const body = await request.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const category = await db.category.create({
      data: {
        ...parsed.data,
        userId: authUser.id,
        isDefault: false,
      },
    });

    return successResponse(category, 'Category created', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
