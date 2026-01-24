import { eq } from 'drizzle-orm';
import { getDb } from '../client.js';
import { userSubscriptions, type UserSubscription } from '../schema.js';
import {
  type Plan,
  getPlanConfig,
  calculateTotalTokenCost,
  calculateMinutesRemaining,
} from '@cook-mode/shared';

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const db = getDb();

  const result = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  return result[0] || null;
}

export async function updateUserSubscription(
  userId: string,
  data: Partial<UserSubscription>
): Promise<boolean> {
  const db = getDb();

  const existing = await getUserSubscription(userId);

  if (existing) {
    await db
      .update(userSubscriptions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));
  } else {
    await db.insert(userSubscriptions).values({
      userId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return true;
}

export async function getUserByCustomerId(customerId: string): Promise<string | null> {
  const db = getDb();

  const result = await db
    .select({ userId: userSubscriptions.userId })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.customerId, customerId))
    .limit(1);

  return result[0]?.userId || null;
}

export async function recordTokenUsage(
  userId: string,
  inputTokens: number,
  outputTokens: number
): Promise<{ hasAvailable: boolean; costRemaining: number }> {
  const db = getDb();

  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const currentCost = parseFloat(subscription.incurredCost || '0');
  const additionalCost = calculateTotalTokenCost(inputTokens, outputTokens);
  const newCost = currentCost + additionalCost;

  const newInputTokens = (subscription.inputTokensUsed || 0) + inputTokens;
  const newOutputTokens = (subscription.outputTokensUsed || 0) + outputTokens;

  await db
    .update(userSubscriptions)
    .set({
      inputTokensUsed: newInputTokens,
      outputTokensUsed: newOutputTokens,
      incurredCost: newCost.toFixed(6),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, userId));

  const plan = (subscription.plan || 'free') as Plan;
  const planConfig = getPlanConfig(plan);
  const costRemaining = Math.max(0, planConfig.allowance - newCost);

  return {
    hasAvailable: costRemaining > 0,
    costRemaining,
  };
}

export async function hasAvailableMinutes(userId: string): Promise<boolean> {
  const db = getDb();

  let subscription = await getUserSubscription(userId);

  if (!subscription) {
    await db.insert(userSubscriptions).values({
      userId,
      isSubscribed: false,
      status: 'inactive',
      inputTokensUsed: 0,
      outputTokensUsed: 0,
      plan: 'free',
      incurredCost: '0.000000',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return true;
  }

  const plan = (subscription.plan || 'free') as Plan;
  const planConfig = getPlanConfig(plan);
  const incurredCost = parseFloat(subscription.incurredCost || '0');

  return incurredCost < planConfig.allowance;
}

export async function getRemainingMinutes(userId: string): Promise<number> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return calculateMinutesRemaining('free', 0, 0);
  }

  const plan = (subscription.plan || 'free') as Plan;
  return calculateMinutesRemaining(
    plan,
    subscription.inputTokensUsed || 0,
    subscription.outputTokensUsed || 0
  );
}
