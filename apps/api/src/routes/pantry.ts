import type { FastifyInstance } from 'fastify';
import { getQueue } from '@cook-mode/redis';
import {
  IngredientParsePayloadSchema,
  MealPlanGeneratePayloadSchema,
  type JobMessage,
} from '@cook-mode/shared';

export async function registerPantryRoutes(fastify: FastifyInstance) {
  // Parse ingredients from image
  fastify.post<{
    Body: { imageUrl: string; userId: string };
  }>('/pantry/parse', async (request, reply) => {
    try {
      const parsed = IngredientParsePayloadSchema.safeParse(request.body);

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
        operation: {
          type: 'ingredient.parse',
          payload: parsed.data,
        },
        createdAt: new Date().toISOString(),
      };

      await queue.add('ingredient.parse', jobMessage, { jobId });

      reply.status(201).send({
        success: true,
        data: {
          jobId,
          status: 'pending',
          operation: 'ingredient.parse',
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error creating ingredient parse job');
      reply.status(500).send({ success: false, error: 'Failed to create job' });
    }
  });

  // Generate meal plan from ingredients
  fastify.post<{
    Body: {
      userId: string;
      ingredients: string[];
      preferences?: {
        cuisinePreferences?: string[];
        dietaryRestrictions?: string[];
        maxCookTime?: number;
      };
    };
  }>('/pantry/mealplan', async (request, reply) => {
    try {
      const parsed = MealPlanGeneratePayloadSchema.safeParse(request.body);

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
        operation: {
          type: 'mealplan.generate',
          payload: parsed.data,
        },
        createdAt: new Date().toISOString(),
      };

      await queue.add('mealplan.generate', jobMessage, { jobId });

      reply.status(201).send({
        success: true,
        data: {
          jobId,
          status: 'pending',
          operation: 'mealplan.generate',
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error creating meal plan job');
      reply.status(500).send({ success: false, error: 'Failed to create job' });
    }
  });
}
