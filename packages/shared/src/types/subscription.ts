export type Plan = 'free' | 'basic' | 'pro';

export interface PlanConfig {
  name: string;
  allowance: number; // Cost budget in dollars
  minutesEstimate: number; // Estimated minutes based on average usage
  pricePerMonth: number;
}

export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  free: {
    name: 'Free',
    allowance: 0.50,
    minutesEstimate: 5,
    pricePerMonth: 0,
  },
  basic: {
    name: 'Basic',
    allowance: 3.00,
    minutesEstimate: 30,
    pricePerMonth: 5,
  },
  pro: {
    name: 'Pro',
    allowance: 15.00,
    minutesEstimate: 150,
    pricePerMonth: 20,
  },
};

// Token costs per 1M tokens (OpenAI Realtime API)
export const TOKEN_COSTS = {
  input: 100.00,  // $100/1M input tokens
  output: 200.00, // $200/1M output tokens
};

export interface SubscriptionStatus {
  isSubscribed: boolean;
  plan: Plan;
  status: string;
  minutesRemaining: number;
  costRemaining: number;
  inputTokensUsed: number;
  outputTokensUsed: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

// Helper functions
export function calculateTokenCost(tokens: number, type: 'input' | 'output'): number {
  return (tokens / 1_000_000) * TOKEN_COSTS[type];
}

export function calculateTotalTokenCost(inputTokens: number, outputTokens: number): number {
  return calculateTokenCost(inputTokens, 'input') + calculateTokenCost(outputTokens, 'output');
}

export function getPlanConfig(plan: Plan): PlanConfig {
  return PLAN_CONFIGS[plan] || PLAN_CONFIGS.free;
}

export function calculateMinutesRemaining(
  plan: Plan,
  inputTokensUsed: number,
  outputTokensUsed: number
): number {
  const config = getPlanConfig(plan);
  const costUsed = calculateTotalTokenCost(inputTokensUsed, outputTokensUsed);
  const costRemaining = Math.max(0, config.allowance - costUsed);

  // Estimate minutes based on average cost per minute (~$0.10/min)
  const costPerMinute = 0.10;
  return Math.floor(costRemaining / costPerMinute);
}
