import { requireEnv } from '../env.js';

/**
 * Database (PostgreSQL) configuration.
 * Validates that DATABASE_URL is set at import time.
 */
export const databaseConfig = {
  get url(): string {
    return requireEnv('DATABASE_URL');
  },
} as const;
