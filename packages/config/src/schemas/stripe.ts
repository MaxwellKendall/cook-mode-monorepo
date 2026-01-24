import { optionalEnvOrUndefined } from '../env.js';

/**
 * Stripe payment configuration.
 * All values are optional for local development.
 */
export const stripeConfig = {
  get secretKey(): string | undefined {
    return optionalEnvOrUndefined('STRIPE_SECRET_KEY');
  },
  get webhookSecret(): string | undefined {
    return optionalEnvOrUndefined('STRIPE_WEBHOOK_SECRET');
  },
  get priceBasic(): string | undefined {
    return optionalEnvOrUndefined('STRIPE_PRICE_BASIC');
  },
  get pricePro(): string | undefined {
    return optionalEnvOrUndefined('STRIPE_PRICE_PRO');
  },
  /**
   * Check if Stripe is configured (has at least the secret key).
   */
  get isConfigured(): boolean {
    return !!this.secretKey;
  },
} as const;
