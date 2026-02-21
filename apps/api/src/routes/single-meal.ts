import type { FastifyInstance } from 'fastify';
import { getQueue } from '@cook-mode/redis';
import { SingleMealGeneratePayloadSchema, type JobMessage } from '@cook-mode/shared';

export async function registerSingleMealRoutes(fastify: FastifyInstance) {
  // POST /single-meal/generate — Enqueue singlemeal.generate job
  fastify.post<{
    Body: {
      servings?: number;
      dietary?: string[];
      freeText?: string;
      excludeRecipeIds?: string[];
      userId?: string;
      anonymousSessionId?: string;
    };
  }>('/single-meal/generate', async (request, reply) => {
    try {
      const parsed = SingleMealGeneratePayloadSchema.safeParse({
        dietary: [],
        ...request.body,
      });

      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid request',
          details: parsed.error.errors,
        });
      }

      const queue = getQueue();
      const jobId = crypto.randomUUID();

      const jobMessage: JobMessage = {
        jobId,
        operation: {
          type: 'singlemeal.generate',
          payload: parsed.data,
        },
        createdAt: new Date().toISOString(),
      };

      await queue.add('singlemeal.generate', jobMessage, { jobId });

      reply.status(201).send({
        success: true,
        data: {
          jobId,
          status: 'pending',
          operation: 'singlemeal.generate',
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error creating single meal generate job');
      reply.status(500).send({ success: false, error: 'Failed to create job' });
    }
  });
}
