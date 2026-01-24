import { optionalEnv } from '../env.js';

/**
 * Redis configuration.
 */
export const redisConfig = {
  get url(): string {
    return optionalEnv('REDIS_URL', 'redis://localhost:6379');
  },
} as const;
