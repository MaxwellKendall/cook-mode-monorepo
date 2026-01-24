import { Queue, Worker, Job } from 'bullmq';

const QUEUE_NAME = 'cook-mode-jobs';

function getRedisUrl(): string {
  return process.env.REDIS_URL || 'redis://localhost:6379';
}

let queue: Queue | null = null;

export function createQueue(): Queue {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: { url: getRedisUrl() },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });
  }
  return queue;
}

export function getQueue(): Queue {
  if (!queue) {
    return createQueue();
  }
  return queue;
}

export function createWorker<T = unknown>(
  processor: (job: Job<T>) => Promise<void>,
  concurrency: number = 5
): Worker<T> {
  return new Worker<T>(QUEUE_NAME, processor, {
    connection: { url: getRedisUrl() },
    concurrency,
  });
}

export type { Job, Worker };
