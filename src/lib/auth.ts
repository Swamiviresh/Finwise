import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { CookieOptions } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'finwise-default-secret-change-in-production';
const secretKey = new TextEncoder().encode(JWT_SECRET);

const COOKIE_NAME = 'finwise_session';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------

export interface JwtPayload {
  id: string;
  email: string;
  name: string | null;
  role: string;
  currency: string;
}

export async function generateToken(payload: object): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyToken(
  token: string,
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: (payload.name as string) ?? null,
      role: (payload.role as string) ?? 'user',
      currency: (payload.currency as string) ?? 'USD',
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Session cookie helpers
// ---------------------------------------------------------------------------

export function createSessionCookie(token: string): {
  name: string;
  value: string;
  options: CookieOptions;
} {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE,
    },
  };
}

export function destroySessionCookie(): {
  name: string;
  value: string;
  options: CookieOptions;
} {
  return {
    name: COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    },
  };
}

export { COOKIE_NAME };
