import { createWorker, closeRedis, type Worker, type Job } from '@cook-mode/redis';
import { workerConfig } from '@cook-mode/config';
import type { JobMessage } from '@cook-mode/shared';
import { processJob } from './processor.js';

const CONCURRENCY = workerConfig.concurrency;

let worker: Worker<JobMessage> | null = null;

async function start() {
  console.log('Starting Cook Mode Worker...');
  console.log(`Concurrency: ${CONCURRENCY}`);

  worker = createWorker<JobMessage>(async (job: Job<JobMessage>) => {
    console.log(`Processing job ${job.id}: ${job.data.operation.type}`);
    await processJob(job);
  }, CONCURRENCY);

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  console.log('Worker started and listening for jobs');
}

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down worker...`);

  if (worker) {
    await worker.close();
  }
  await closeRedis();

  console.log('Worker shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((error) => {
  console.error('Failed to start worker:', error);
  process.exit(1);
});
