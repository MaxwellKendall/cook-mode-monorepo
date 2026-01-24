import { requireEnv, optionalEnv } from '../env.js';

/**
 * OpenAI configuration.
 */
export const openaiConfig = {
  get apiKey(): string {
    return requireEnv('OPENAI_API_KEY');
  },
  get embeddingModel(): string {
    return optionalEnv('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small');
  },
} as const;
