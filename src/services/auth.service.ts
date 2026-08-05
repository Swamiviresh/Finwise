// ============================================================================
// FinWise - Auth Service
// ============================================================================

import { db } from '@/lib/db';
import { hashPassword, comparePassword, generateToken } from '@/lib/auth';
import { DEFAULT_CATEGORIES, APP_CONFIG } from '@/lib/constants';
import type { RegisterInput } from '@/types';

// ---------------------------------------------------------------------------
// Types (internal)
// ---------------------------------------------------------------------------

type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  occupation: string | null;
  currency: string;
  timezone: string;
  language: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function sanitizeUser(user: {
  passwordHash: string;
  [key: string]: unknown;
}): SafeUser {
  const { passwordHash, ...safe } = user;
  return safe as SafeUser;
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export async function registerUser(data: RegisterInput) {
  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await hashPassword(data.password);

  const user = await db.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      currency: APP_CONFIG.DEFAULT_CURRENCY,
      language: APP_CONFIG.DEFAULT_LANGUAGE,
      timezone: APP_CONFIG.DEFAULT_TIMEZONE,
    },
  });

  // Seed default categories
  await createDefaultCategories(user.id);

  // Create default settings
  await createDefaultSettings(user.id);

  return sanitizeUser(user);
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function loginUser(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new Error('Invalid email or password');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const token = await generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    currency: user.currency,
  });

  return { token, user: sanitizeUser(user) };
}

// ---------------------------------------------------------------------------
// Get user
// ---------------------------------------------------------------------------

export async function getUserById(id: string) {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return null;
  return sanitizeUser(user);
}

export async function getUserByEmail(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  return sanitizeUser(user);
}

// ---------------------------------------------------------------------------
// Update profile
// ---------------------------------------------------------------------------

export async function updateUserProfile(
  id: string,
  data: {
    name?: string;
    phone?: string;
    occupation?: string;
    currency?: string;
    timezone?: string;
    language?: string;
    avatar?: string;
  },
) {
  const user = await db.user.update({
    where: { id },
    data,
  });
  return sanitizeUser(user);
}

// ---------------------------------------------------------------------------
// Delete (soft)
// ---------------------------------------------------------------------------

export async function deleteUser(id: string) {
  await db.user.update({
    where: { id },
    data: { isActive: false },
  });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Forgot Password
// ---------------------------------------------------------------------------

export async function forgotPassword(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal whether email exists
    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  // Delete any existing unused tokens
  await db.resetToken.deleteMany({
    where: { userId: user.id, used: false },
  });

  const token = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + APP_CONFIG.RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  );

  await db.resetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // In production, send email with reset link
  // For now, we return the token for testing purposes
  return { success: true, message: 'If the email exists, a reset link has been sent', token };
}

// ---------------------------------------------------------------------------
// Reset Password
// ---------------------------------------------------------------------------

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await db.resetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    throw new Error('Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(newPassword);

  await db.$transaction([
    db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    db.resetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);

  return { success: true, message: 'Password has been reset successfully' };
}

// ---------------------------------------------------------------------------
// Seed default categories
// ---------------------------------------------------------------------------

export async function createDefaultCategories(userId: string) {
  const categories = DEFAULT_CATEGORIES.map((cat) => ({
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    type: cat.type,
    isDefault: true,
    userId,
  }));

  await db.category.createMany({ data: categories });
  return categories;
}

// ---------------------------------------------------------------------------
// Create default settings
// ---------------------------------------------------------------------------

export async function createDefaultSettings(userId: string) {
  const settings = await db.settings.create({
    data: {
      userId,
      theme: APP_CONFIG.DEFAULT_THEME,
      currency: APP_CONFIG.DEFAULT_CURRENCY,
      language: APP_CONFIG.DEFAULT_LANGUAGE,
      enableNotifications: true,
      enableEmailDigest: true,
      budgetAlertThreshold: APP_CONFIG.BUDGET_ALERT_DEFAULT_THRESHOLD,
      weeklyReportEnabled: true,
      dataExportFormat: 'csv',
    },
  });
  return settings;
}
