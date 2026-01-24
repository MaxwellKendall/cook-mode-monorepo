/**
 * Shared Plan Configuration
 * 
 * Centralized configuration for subscription plans used across API and browser services.
 * This ensures consistency between backend calculations and frontend display.
 */

export type Plan = 'free' | 'starter' | 'cook' | 'chef';

/**
 * Plan prices in dollars per month
 */
export const PLAN_PRICES: Record<Plan, number> = {
  free: 1.50,   // Equivalent to $0.30 cost
  starter: 5,   // $5/mo
  cook: 8,      // $8/mo
  chef: 10,     // $10/mo
};

/**
 * Advertised minutes per plan
 * These are the user-facing minutes advertised for each subscription tier.
 * 
 * To calculate these values, run: npm run calculate-advertised-minutes
 * (or: cd services/data && npx ts-node scripts/calculate-advertised-minutes.ts)
 * 
 * Formula: Allowance = Price × (1 - TARGET_MARGIN) → Minutes = Allowance / COST_PER_MINUTE
 */
export const ADVERTISED_MINUTES: Record<Plan, number> = {
  free: 10, // rounded down from 11
  starter: 40, // rounded up from 39
  cook: 60, // rounded down from 63
  chef: 80, // rounded up from 79
};

/**
 * Plan display names
 */
export const PLAN_NAMES: Record<Plan, string> = {
  free: 'Free',
  starter: 'Starter',
  cook: 'Cook',
  chef: 'Chef',
};
