export const CHANNELS = {
  subscription: (userId: string) => `subscription:${userId}:events`,
  voice: (userId: string) => `voice:${userId}:usage`,
  recipe: (jobId: string) => `recipe:${jobId}:progress`,
  job: (jobId: string) => `job:${jobId}:events`,

  // Patterns for subscribing
  patterns: {
    subscription: 'subscription:*:events',
    voice: 'voice:*:usage',
    recipe: 'recipe:*:progress',
    job: 'job:*:events',
  },
} as const;
