import { Redis } from 'ioredis';

export interface PubSub {
  publisher: Redis;
  subscriber: Redis;
  publish: (channel: string, message: Record<string, unknown>) => Promise<number>;
  subscribe: (channel: string, handler: (message: Record<string, unknown>) => void) => Promise<void>;
  psubscribe: (pattern: string, handler: (channel: string, message: Record<string, unknown>) => void) => Promise<void>;
  unsubscribe: (channel: string) => Promise<void>;
  punsubscribe: (pattern: string) => Promise<void>;
  close: () => Promise<void>;
}

export function createPubSub(): PubSub {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  const publisher = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const subscriber = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const messageHandlers = new Map<string, (message: Record<string, unknown>) => void>();
  const patternHandlers = new Map<string, (channel: string, message: Record<string, unknown>) => void>();

  subscriber.on('message', (channel, message) => {
    const handler = messageHandlers.get(channel);
    if (handler) {
      try {
        const parsed = JSON.parse(message);
        handler(parsed);
      } catch (error) {
        console.error(`Failed to parse message on channel ${channel}:`, error);
      }
    }
  });

  subscriber.on('pmessage', (pattern, channel, message) => {
    const handler = patternHandlers.get(pattern);
    if (handler) {
      try {
        const parsed = JSON.parse(message);
        handler(channel, parsed);
      } catch (error) {
        console.error(`Failed to parse message on pattern ${pattern}:`, error);
      }
    }
  });

  return {
    publisher,
    subscriber,

    async publish(channel: string, message: Record<string, unknown>): Promise<number> {
      return publisher.publish(channel, JSON.stringify(message));
    },

    async subscribe(channel: string, handler: (message: Record<string, unknown>) => void): Promise<void> {
      messageHandlers.set(channel, handler);
      await subscriber.subscribe(channel);
    },

    async psubscribe(pattern: string, handler: (channel: string, message: Record<string, unknown>) => void): Promise<void> {
      patternHandlers.set(pattern, handler);
      await subscriber.psubscribe(pattern);
    },

    async unsubscribe(channel: string): Promise<void> {
      messageHandlers.delete(channel);
      await subscriber.unsubscribe(channel);
    },

    async punsubscribe(pattern: string): Promise<void> {
      patternHandlers.delete(pattern);
      await subscriber.punsubscribe(pattern);
    },

    async close(): Promise<void> {
      await publisher.quit();
      await subscriber.quit();
    },
  };
}
