// ============================================================================
// FinWise - API Helper Utilities
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import type { JwtPayload } from '@/lib/auth';

/**
 * Extract the authenticated user from the JWT session cookie.
 * Returns null if not authenticated.
 */
export async function getAuthUser(
  request: NextRequest,
): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Create a standardized success JSON response.
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
) {
  return NextResponse.json(
    { success: true, data, ...(message ? { message } : {}) },
    { status },
  );
}

/**
 * Create a standardized paginated JSON response.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * Create a standardized error JSON response.
 */
export function errorResponse(
  message: string,
  status: number = 400,
  code?: string,
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code ? { code } : {}),
    },
    { status },
  );
}

/**
 * Handle unexpected errors and return a safe error response.
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  if (error instanceof z.ZodError) {
    return errorResponse(
      error.errors.map((e) => e.message).join(', '),
      400,
      'VALIDATION_ERROR',
    );
  }

  if (error instanceof Error) {
    // Known application errors
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }
    if (error.message === 'FORBIDDEN') {
      return errorResponse('Forbidden', 403, 'FORBIDDEN');
    }
    if (error.message === 'NOT_FOUND') {
      return errorResponse('Resource not found', 404, 'NOT_FOUND');
    }

    return errorResponse(
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
      500,
    );
  }

  return errorResponse('An unexpected error occurred', 500);
}

// Need this import for handleApiError
import { z } from 'zod';
