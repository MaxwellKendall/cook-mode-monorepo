/**
 * Shared Plan Configuration
 *
 * Two tiers: Free and Pro ($8/mo).
 * Primary gating: plan generation frequency (2 plans/month free, unlimited Pro).
 */

export type Plan = 'free' | 'pro';

/**
 * Plan prices in dollars per month
 */
export const PLAN_PRICES: Record<Plan, number> = {
  free: 0,
  pro: 8,
};

/**
 * Advertised voice cooking minutes per plan
 */
export const ADVERTISED_MINUTES: Record<Plan, number> = {
  free: 10,  // one-time trial
  pro: 60,   // per month
};

/**
 * Plan display names
 */
export const PLAN_NAMES: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
};

/**
 * Monthly weekly plan generation limit (null = unlimited)
 */
export const MONTHLY_PLAN_LIMIT: Record<Plan, number | null> = {
  free: 2,
  pro: null,
};
