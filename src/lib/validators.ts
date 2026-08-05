// ============================================================================
// FinWise - Zod Validation Schemas
// ============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------

export const transactionSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description is too long'),
  type: z.enum(['income', 'expense', 'transfer'], {
    required_error: 'Transaction type is required',
  }),
  date: z.string().min(1, 'Date is required'),
  categoryId: z.string().min(1, 'Category is required'),
  paymentMethod: z.string().optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
});

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export const budgetSchema = z.object({
  name: z
    .string()
    .min(1, 'Budget name is required')
    .max(100, 'Budget name is too long'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Budget amount must be positive'),
  period: z.enum(['weekly', 'monthly', 'yearly']).optional().default('monthly'),
  startDate: z.string().min(1, 'Start date is required'),
  categoryBudgets: z
    .array(
      z.object({
        categoryId: z.string().min(1),
        amount: z.number().positive(),
      }),
    )
    .optional(),
});

// ---------------------------------------------------------------------------
// Goal
// ---------------------------------------------------------------------------

export const goalSchema = z.object({
  name: z
    .string()
    .min(1, 'Goal name is required')
    .max(100, 'Goal name is too long'),
  targetAmount: z
    .number({ invalid_type_error: 'Target amount must be a number' })
    .positive('Target amount must be positive'),
  deadline: z.string().optional(),
  description: z.string().max(500, 'Description is too long').optional(),
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
    .optional(),
});

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export const subscriptionSchema = z.object({
  name: z
    .string()
    .min(1, 'Subscription name is required')
    .max(100, 'Name is too long'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive'),
  billingCycle: z.enum(['weekly', 'monthly', 'yearly'], {
    required_error: 'Billing cycle is required',
  }),
  nextBillingDate: z.string().min(1, 'Next billing date is required'),
  category: z.string().optional(),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  currency: z.string().length(3).optional(),
  language: z.string().length(2).optional(),
  enableNotifications: z.boolean().optional(),
  enableEmailDigest: z.boolean().optional(),
  budgetAlertThreshold: z
    .number()
    .min(0)
    .max(100)
    .optional(),
  weeklyReportEnabled: z.boolean().optional(),
  dataExportFormat: z.enum(['csv', 'json']).optional(),
});

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  occupation: z.string().max(100).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
});

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Name is too long'),
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
    .optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional().default('expense'),
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export const reportSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['monthly', 'yearly', 'custom']),
  period: z.string().min(1),
});
