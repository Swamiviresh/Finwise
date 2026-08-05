// POST /api/auth/logout
import { NextResponse } from 'next/server';
import { destroySessionCookie } from '@/lib/auth';
import { successResponse } from '@/lib/api-helpers';

export async function POST() {
  const cookie = destroySessionCookie();
  const response = successResponse(null, 'Logged out successfully');
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
