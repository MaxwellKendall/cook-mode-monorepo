import type { FastifyInstance } from 'fastify';
import { getQueue } from '@cook-mode/redis';
import {
  WeeklyPlanGeneratePayloadSchema,
  type JobMessage,
} from '@cook-mode/shared';
import {
  getUserWeeklyPlans,
  getWeeklyPlanById,
  updateWeeklyPlanStatus,
  markMealCooked,
  deleteWeeklyPlan,
  claimAnonymousWeeklyPlans,
  type WeeklyPlanStatus,
} from '@cook-mode/db';

export async function registerWeeklyPlanRoutes(fastify: FastifyInstance) {
  // Generate a weekly plan (anonymous or authenticated)
  fastify.post<{
    Body: {
      userId?: string;
      anonymousSessionId?: string;
      preferences: {
        servings: number;
        numDinners: number;
        dietary: string[];
        freeText?: string;
      };
    };
  }>('/weekly-plans/generate', async (request, reply) => {
    try {
      const parsed = WeeklyPlanGeneratePayloadSchema.safeParse(request.body);

      if (!parsed.success) {
        reply.status(400).send({
          success: false,
          error: 'Invalid request',
          details: parsed.error.errors,
        });
        return;
      }

      if (!parsed.data.userId && !parsed.data.anonymousSessionId) {
        reply.status(400).send({
          success: false,
          error: 'Either userId or anonymousSessionId is required',
        });
        return;
      }

      const queue = getQueue();
      const jobId = crypto.randomUUID();

      const jobMessage: JobMessage = {
        jobId,
        operation: {
          type: 'weeklyplan.generate',
          payload: parsed.data,
        },
        createdAt: new Date().toISOString(),
      };

      await queue.add('weeklyplan.generate', jobMessage, { jobId });

      reply.status(201).send({
        success: true,
        data: {
          jobId,
          status: 'pending',
          operation: 'weeklyplan.generate',
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error creating weekly plan generate job');
      reply.status(500).send({ success: false, error: 'Failed to create job' });
    }
  });

  // Claim anonymous plans after sign-up (authenticated only)
  fastify.post<{
    Body: { userId: string; anonymousSessionId: string };
  }>('/weekly-plans', async (request, reply) => {
    try {
      const { userId, anonymousSessionId } = request.body;

      if (!userId || !anonymousSessionId) {
        reply.status(400).send({
          success: false,
          error: 'userId and anonymousSessionId are required',
        });
        return;
      }

      const claimed = await claimAnonymousWeeklyPlans(anonymousSessionId, userId);

      reply.status(200).send({
        success: true,
        data: { claimed },
      });
    } catch (error) {
      fastify.log.error(error, 'Error claiming anonymous weekly plans');
      reply.status(500).send({ success: false, error: 'Failed to claim plans' });
    }
  });

  // List user's weekly plans
  fastify.get<{
    Querystring: { userId: string; status?: WeeklyPlanStatus };
  }>('/weekly-plans', async (request, reply) => {
    try {
      const { userId, status } = request.query;

      if (!userId) {
        reply.status(400).send({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      const plans = await getUserWeeklyPlans(userId, status);

      reply.status(200).send({
        success: true,
        data: plans,
      });
    } catch (error) {
      fastify.log.error(error, 'Error fetching weekly plans');
      reply.status(500).send({ success: false, error: 'Failed to fetch weekly plans' });
    }
  });

  // Get a single weekly plan by ID
  fastify.get<{
    Params: { id: string };
  }>('/weekly-plans/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const plan = await getWeeklyPlanById(id);

      if (!plan) {
        reply.status(404).send({
          success: false,
          error: 'Weekly plan not found',
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: plan,
      });
    } catch (error) {
      fastify.log.error(error, 'Error fetching weekly plan');
      reply.status(500).send({ success: false, error: 'Failed to fetch weekly plan' });
    }
  });

  // Update weekly plan status
  fastify.patch<{
    Params: { id: string };
    Body: { status: WeeklyPlanStatus };
  }>('/weekly-plans/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { status } = request.body;

      if (status !== 'generating' && status !== 'active' && status !== 'completed') {
        reply.status(400).send({
          success: false,
          error: 'Invalid status: must be "generating", "active", or "completed"',
        });
        return;
      }

      const plan = await updateWeeklyPlanStatus(id, status);

      if (!plan) {
        reply.status(404).send({
          success: false,
          error: 'Weekly plan not found',
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: plan,
      });
    } catch (error) {
      fastify.log.error(error, 'Error updating weekly plan');
      reply.status(500).send({ success: false, error: 'Failed to update weekly plan' });
    }
  });

  // Mark a meal as cooked
  fastify.patch<{
    Params: { id: string; day: string };
  }>('/weekly-plans/:id/meals/:day', async (request, reply) => {
    try {
      const { id, day } = request.params;
      const dayNum = parseInt(day, 10);

      if (isNaN(dayNum) || dayNum < 1 || dayNum > 7) {
        reply.status(400).send({
          success: false,
          error: 'Invalid day: must be between 1 and 7',
        });
        return;
      }

      const plan = await markMealCooked(id, dayNum);

      if (!plan) {
        reply.status(404).send({
          success: false,
          error: 'Weekly plan not found',
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: plan,
      });
    } catch (error) {
      fastify.log.error(error, 'Error marking meal as cooked');
      reply.status(500).send({ success: false, error: 'Failed to mark meal as cooked' });
    }
  });

  // Swap a single meal slot — re-enqueues a generate job with same preferences
  fastify.post<{
    Params: { id: string };
    Body: { day: number };
  }>('/weekly-plans/:id/swap', async (request, reply) => {
    try {
      const { id } = request.params;
      const { day } = request.body;

      if (!day || day < 1 || day > 7) {
        reply.status(400).send({
          success: false,
          error: 'Invalid day: must be between 1 and 7',
        });
        return;
      }

      const plan = await getWeeklyPlanById(id);

      if (!plan) {
        reply.status(404).send({
          success: false,
          error: 'Weekly plan not found',
        });
        return;
      }

      const queue = getQueue();
      const jobId = crypto.randomUUID();

      const jobMessage: JobMessage = {
        jobId,
        operation: {
          type: 'weeklyplan.generate',
          payload: {
            userId: plan.userId ?? undefined,
            anonymousSessionId: plan.anonymousSessionId ?? undefined,
            preferences: plan.preferences as {
              servings: number;
              numDinners: number;
              dietary: string[];
              freeText?: string;
            },
          },
        },
        createdAt: new Date().toISOString(),
      };

      await queue.add('weeklyplan.generate', jobMessage, {
        jobId,
        // Pass swap context as job metadata so the worker can handle it
        opts: { planId: id, swapDay: day },
      } as any);

      reply.status(201).send({
        success: true,
        data: {
          jobId,
          status: 'pending',
          operation: 'weeklyplan.swap',
          planId: id,
          day,
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error swapping meal');
      reply.status(500).send({ success: false, error: 'Failed to swap meal' });
    }
  });

  // Delete a weekly plan
  fastify.delete<{
    Params: { id: string };
    Querystring: { userId: string };
  }>('/weekly-plans/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const deleted = await deleteWeeklyPlan(id);

      if (!deleted) {
        reply.status(404).send({
          success: false,
          error: 'Weekly plan not found',
        });
        return;
      }

      reply.status(200).send({
        success: true,
        message: 'Weekly plan deleted',
      });
    } catch (error) {
      fastify.log.error(error, 'Error deleting weekly plan');
      reply.status(500).send({ success: false, error: 'Failed to delete weekly plan' });
    }
  });
}
