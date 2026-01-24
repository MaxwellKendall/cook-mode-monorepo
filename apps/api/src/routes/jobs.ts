import type { FastifyInstance } from 'fastify';
import { getQueue } from '@cook-mode/redis';
import { CreateJobRequestSchema, type JobMessage } from '@cook-mode/shared';

export async function registerJobRoutes(fastify: FastifyInstance) {
  // Create a new job
  fastify.post<{
    Body: { operation: { type: string; payload: Record<string, unknown> } };
  }>('/', async (request, reply) => {
    try {
      const parsed = CreateJobRequestSchema.safeParse(request.body);

      if (!parsed.success) {
        reply.status(400).send({
          success: false,
          error: 'Invalid request',
          details: parsed.error.errors,
        });
        return;
      }

      const queue = getQueue();
      const jobId = crypto.randomUUID();

      const jobMessage: JobMessage = {
        jobId,
        operation: parsed.data.operation,
        createdAt: new Date().toISOString(),
      };

      await queue.add(parsed.data.operation.type, jobMessage, {
        jobId,
      });

      reply.status(201).send({
        success: true,
        data: {
          jobId,
          status: 'pending',
          operation: parsed.data.operation.type,
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error creating job');
      reply.status(500).send({ success: false, error: 'Failed to create job' });
    }
  });

  // Get job status
  fastify.get<{
    Params: { jobId: string };
  }>('/:jobId', async (request, reply) => {
    const { jobId } = request.params;

    try {
      const queue = getQueue();
      const job = await queue.getJob(jobId);

      if (!job) {
        reply.status(404).send({ success: false, error: 'Job not found' });
        return;
      }

      const state = await job.getState();
      const progress = job.progress;

      reply.send({
        success: true,
        data: {
          jobId,
          status: state,
          progress,
          result: job.returnvalue,
          failedReason: job.failedReason,
          createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : undefined,
          processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
          finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error fetching job status');
      reply.status(500).send({ success: false, error: 'Failed to fetch job status' });
    }
  });
}
