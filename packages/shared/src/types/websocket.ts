import type { RecipeProgressMessage } from './job.js';
import type { SubscriptionStatus } from './subscription.js';

// Client -> Server messages
export type ClientMessageType =
  | 'subscribe.user'
  | 'subscribe.job'
  | 'unsubscribe.user'
  | 'unsubscribe.job'
  | 'ping';

export interface SubscribeUserMessage {
  type: 'subscribe.user';
  userId: string;
}

export interface SubscribeJobMessage {
  type: 'subscribe.job';
  jobId: string;
}

export interface UnsubscribeUserMessage {
  type: 'unsubscribe.user';
  userId: string;
}

export interface UnsubscribeJobMessage {
  type: 'unsubscribe.job';
  jobId: string;
}

export interface PingMessage {
  type: 'ping';
}

export type ClientMessage =
  | SubscribeUserMessage
  | SubscribeJobMessage
  | UnsubscribeUserMessage
  | UnsubscribeJobMessage
  | PingMessage;

// Server -> Client messages
export type ServerMessageType =
  | 'subscription.updated'
  | 'voice.usage'
  | 'recipe.extraction.progress'
  | 'job.completed'
  | 'job.failed'
  | 'pong'
  | 'error';

export interface SubscriptionUpdatedMessage {
  type: 'subscription.updated';
  userId: string;
  status: SubscriptionStatus;
}

export interface VoiceUsageMessage {
  type: 'voice.usage';
  userId: string;
  minutesRemaining: number;
  costRemaining: number;
  inputTokens: number;
  outputTokens: number;
}

export interface RecipeExtractionProgressMessage {
  type: 'recipe.extraction.progress';
  jobId: string;
  progress: RecipeProgressMessage;
}

export interface JobCompletedMessage {
  type: 'job.completed';
  jobId: string;
  result: unknown;
}

export interface JobFailedMessage {
  type: 'job.failed';
  jobId: string;
  error: string;
}

export interface PongMessage {
  type: 'pong';
}

export interface ErrorMessage {
  type: 'error';
  message: string;
  code?: string;
}

export type ServerMessage =
  | SubscriptionUpdatedMessage
  | VoiceUsageMessage
  | RecipeExtractionProgressMessage
  | JobCompletedMessage
  | JobFailedMessage
  | PongMessage
  | ErrorMessage;

// Redis pub/sub channels
export const CHANNELS = {
  subscription: (userId: string) => `subscription:${userId}:events`,
  voice: (userId: string) => `voice:${userId}:usage`,
  recipe: (jobId: string) => `recipe:${jobId}:progress`,
  job: (jobId: string) => `job:${jobId}:events`,
} as const;
