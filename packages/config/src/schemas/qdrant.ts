import { requireEnv, optionalEnvOrUndefined } from '../env.js';

/**
 * Qdrant (vector database) configuration.
 */
export const qdrantConfig = {
  get url(): string {
    return requireEnv('QDRANT_URL');
  },
  get apiKey(): string | undefined {
    return optionalEnvOrUndefined('QDRANT_API_KEY');
  },
} as const;
