// ============================================================================
// FinWise - Goal Service
// ============================================================================

import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createGoal(
  userId: string,
  data: {
    name: string;
    targetAmount: number;
    deadline?: string | Date;
    description?: string;
    icon?: string;
    color?: string;
  },
) {
  return db.goal.create({
    data: {
      name: data.name,
      targetAmount: data.targetAmount,
      deadline: data.deadline ? new Date(data.deadline) : null,
      description: data.description,
      icon: data.icon,
      color: data.color || '#10b981',
      userId,
    },
  });
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function getGoals(userId: string) {
  return db.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

// ---------------------------------------------------------------------------
// Get by ID
// ---------------------------------------------------------------------------

export async function getGoalById(userId: string, goalId: string) {
  const goal = await db.goal.findFirst({
    where: { id: goalId, userId },
  });
  if (!goal) return null;
  return goal;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateGoal(
  userId: string,
  goalId: string,
  data: {
    name?: string;
    description?: string;
    targetAmount?: number;
    currentAmount?: number;
    deadline?: string | Date;
    icon?: string;
    color?: string;
    isCompleted?: boolean;
  },
) {
  const existing = await db.goal.findFirst({ where: { id: goalId, userId } });
  if (!existing) throw new Error('NOT_FOUND');

  const updateData: Record<string, unknown> = { ...data };
  if (data.deadline) updateData.deadline = new Date(data.deadline);
  if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;

  return db.goal.update({
    where: { id: goalId },
    data: updateData,
  });
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteGoal(userId: string, goalId: string) {
  const existing = await db.goal.findFirst({ where: { id: goalId, userId } });
  if (!existing) throw new Error('NOT_FOUND');

  await db.goal.delete({ where: { id: goalId } });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Update progress (add to currentAmount)
// ---------------------------------------------------------------------------

export async function updateGoalProgress(
  userId: string,
  goalId: string,
  amount: number,
) {
  const goal = await db.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new Error('NOT_FOUND');

  const newAmount = goal.currentAmount + amount;
  const isCompleted = newAmount >= goal.targetAmount;

  const updated = await db.goal.update({
    where: { id: goalId },
    data: {
      currentAmount: Math.min(newAmount, goal.targetAmount),
      isCompleted,
    },
  });

  return updated;
}
