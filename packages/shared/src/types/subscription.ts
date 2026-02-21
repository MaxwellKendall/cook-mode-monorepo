export type Plan = 'free' | 'pro';

export interface PlanConfig {
  name: string;
  allowance: number; // Cost budget in dollars (voice cooking)
  minutesEstimate: number; // Estimated voice minutes based on allowance
  pricePerMonth: number;
  monthlyPlanLimit: number | null; // null = unlimited
}

export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  free: {
    name: 'Free',
    allowance: 0.50,
    minutesEstimate: 10,
    pricePerMonth: 0,
    monthlyPlanLimit: 2,
  },
  pro: {
    name: 'Pro',
    allowance: 6.00,
    minutesEstimate: 60,
    pricePerMonth: 8,
    monthlyPlanLimit: null,
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
