import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import { weeklyPlans, type WeeklyPlan } from '../schema.js';
import type { WeeklyPlanPreferences, WeeklyPlanMeal } from '@cook-mode/shared';

export type WeeklyPlanStatus = 'generating' | 'active' | 'completed';

export interface CreateWeeklyPlanInput {
  userId?: string;
  anonymousSessionId?: string;
  preferences: WeeklyPlanPreferences;
}

export async function createWeeklyPlan(input: CreateWeeklyPlanInput): Promise<WeeklyPlan> {
  const db = getDb();

  const [plan] = await db
    .insert(weeklyPlans)
    .values({
      userId: input.userId,
      anonymousSessionId: input.anonymousSessionId,
      preferences: input.preferences,
      status: 'generating',
    })
    .returning();

  return plan!;
}

export async function getWeeklyPlanById(planId: string): Promise<WeeklyPlan | null> {
  const db = getDb();

  const [plan] = await db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.id, planId))
    .limit(1);

  return plan || null;
}

export async function getUserWeeklyPlans(
  userId: string,
  status?: WeeklyPlanStatus
): Promise<WeeklyPlan[]> {
  const db = getDb();

  const conditions = status
    ? and(eq(weeklyPlans.userId, userId), eq(weeklyPlans.status, status))
    : eq(weeklyPlans.userId, userId);

  return db
    .select()
    .from(weeklyPlans)
    .where(conditions)
    .orderBy(desc(weeklyPlans.createdAt));
}

export async function getWeeklyPlanByAnonymousSession(
  anonymousSessionId: string
): Promise<WeeklyPlan | null> {
  const db = getDb();

  const [plan] = await db
    .select()
    .from(weeklyPlans)
    .where(eq(weeklyPlans.anonymousSessionId, anonymousSessionId))
    .orderBy(desc(weeklyPlans.createdAt))
    .limit(1);

  return plan || null;
}

export async function updateWeeklyPlanStatus(
  planId: string,
  status: WeeklyPlanStatus,
  meals?: WeeklyPlanMeal[]
): Promise<WeeklyPlan | null> {
  const db = getDb();

  const updates: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };
  if (meals !== undefined) {
    updates.meals = meals;
  }

  const [updated] = await db
    .update(weeklyPlans)
    .set(updates)
    .where(eq(weeklyPlans.id, planId))
    .returning();

  return updated || null;
}

export async function markMealCooked(
  planId: string,
  day: number
): Promise<WeeklyPlan | null> {
  const db = getDb();

  // Use jsonb_set to add cookedAt to the matching meal by day
  const [updated] = await db
    .update(weeklyPlans)
    .set({
      meals: sql`(
        SELECT jsonb_agg(
          CASE
            WHEN (elem->>'day')::int = ${day}
            THEN elem || jsonb_build_object('cookedAt', ${new Date().toISOString()})
            ELSE elem
          END
        )
        FROM jsonb_array_elements(${weeklyPlans.meals}) AS elem
      )`,
      updatedAt: new Date(),
    })
    .where(eq(weeklyPlans.id, planId))
    .returning();

  return updated || null;
}

export async function deleteWeeklyPlan(planId: string): Promise<boolean> {
  const db = getDb();

  const result = await db
    .delete(weeklyPlans)
    .where(eq(weeklyPlans.id, planId))
    .returning({ id: weeklyPlans.id });

  return result.length > 0;
}

export async function claimAnonymousWeeklyPlans(
  anonymousSessionId: string,
  userId: string
): Promise<number> {
  const db = getDb();

  const result = await db
    .update(weeklyPlans)
    .set({
      userId,
      anonymousSessionId: null,
      updatedAt: new Date(),
    })
    .where(eq(weeklyPlans.anonymousSessionId, anonymousSessionId))
    .returning({ id: weeklyPlans.id });

  return result.length;
}
