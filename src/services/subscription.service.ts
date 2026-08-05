// ============================================================================
// FinWise - Subscription Service
// ============================================================================

import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createSubscription(
  userId: string,
  data: {
    name: string;
    amount: number;
    billingCycle: string;
    nextBillingDate: string | Date;
    startDate?: string | Date;
    endDate?: string | Date;
    category?: string;
    icon?: string;
    color?: string;
    url?: string;
    notes?: string;
  },
) {
  return db.subscription.create({
    data: {
      name: data.name,
      amount: data.amount,
      billingCycle: data.billingCycle,
      nextBillingDate: new Date(data.nextBillingDate),
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : null,
      category: data.category,
      icon: data.icon,
      color: data.color || '#8b5cf6',
      url: data.url,
      notes: data.notes,
      userId,
    },
  });
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function getSubscriptions(userId: string) {
  return db.subscription.findMany({
    where: { userId, isActive: true },
    orderBy: { nextBillingDate: 'asc' },
  });
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateSubscription(
  userId: string,
  subId: string,
  data: {
    name?: string;
    amount?: number;
    billingCycle?: string;
    nextBillingDate?: string | Date;
    endDate?: string | Date;
    category?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
    url?: string;
    notes?: string;
  },
) {
  const existing = await db.subscription.findFirst({
    where: { id: subId, userId },
  });
  if (!existing) throw new Error('NOT_FOUND');

  const updateData: Record<string, unknown> = { ...data };
  if (data.nextBillingDate) updateData.nextBillingDate = new Date(data.nextBillingDate);
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

  return db.subscription.update({
    where: { id: subId },
    data: updateData,
  });
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteSubscription(userId: string, subId: string) {
  const existing = await db.subscription.findFirst({
    where: { id: subId, userId },
  });
  if (!existing) throw new Error('NOT_FOUND');

  await db.subscription.delete({ where: { id: subId } });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Upcoming Renewals (next 30 days)
// ---------------------------------------------------------------------------

export async function getUpcomingRenewals(userId: string) {
  const now = new Date();
  const thirtyDaysFromNow = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000,
  );

  return db.subscription.findMany({
    where: {
      userId,
      isActive: true,
      nextBillingDate: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    },
    orderBy: { nextBillingDate: 'asc' },
  });
}

// ---------------------------------------------------------------------------
// Total Monthly Cost
// ---------------------------------------------------------------------------

export async function getTotalMonthlyCost(userId: string) {
  const subscriptions = await db.subscription.findMany({
    where: { userId, isActive: true },
  });

  let monthlyTotal = 0;

  for (const sub of subscriptions) {
    if (sub.billingCycle === 'monthly') {
      monthlyTotal += sub.amount;
    } else if (sub.billingCycle === 'yearly') {
      monthlyTotal += sub.amount / 12;
    } else if (sub.billingCycle === 'weekly') {
      monthlyTotal += sub.amount * 4.33; // ~4.33 weeks per month
    }
  }

  return {
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    yearlyTotal: Math.round(monthlyTotal * 12 * 100) / 100,
    subscriptionCount: subscriptions.length,
    breakdown: subscriptions.map((s) => ({
      id: s.id,
      name: s.name,
      amount: s.amount,
      billingCycle: s.billingCycle,
      monthlyEquivalent:
        s.billingCycle === 'monthly'
          ? s.amount
          : s.billingCycle === 'yearly'
            ? s.amount / 12
            : s.amount * 4.33,
    })),
  };
}
