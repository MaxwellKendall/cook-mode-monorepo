import type { FastifyInstance } from 'fastify';
import { getQueue } from '@cook-mode/redis';
import {
  IngredientParsePayloadSchema,
  MealPlanGeneratePayloadSchema,
  type JobMessage,
  type MealPlan,
} from '@cook-mode/shared';
import {
  createMealPlan,
  getUserMealPlans,
  getMealPlanById,
  updateMealPlanStatus,
  deleteMealPlan,
  type MealPlanStatus,
} from '@cook-mode/db';

export async function registerPantryRoutes(fastify: FastifyInstance) {
  // Parse ingredients from images (supports multiple images)
  fastify.post<{
    Body: { imageUrls: string[]; userId: string };
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

  // Save a meal plan
  fastify.post<{
    Body: {
      userId: string;
      ingredients: string[];
      plan: MealPlan;
    };
  }>('/pantry/plans', async (request, reply) => {
    try {
      const { userId, ingredients, plan } = request.body;

      if (!userId || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0 || !plan) {
        reply.status(400).send({
          success: false,
          error: 'Invalid request: userId, ingredients array, and plan are required',
        });
        return;
      }

      const savedPlan = await createMealPlan({
        userId,
        ingredients,
        plan,
      });

      reply.status(201).send({
        success: true,
        data: savedPlan,
      });
    } catch (error) {
      fastify.log.error(error, 'Error saving meal plan');
      reply.status(500).send({ success: false, error: 'Failed to save meal plan' });
    }
  });

  // Get user's meal plans
  fastify.get<{
    Querystring: { userId: string; status?: MealPlanStatus };
  }>('/pantry/plans', async (request, reply) => {
    try {
      const { userId, status } = request.query;

      if (!userId) {
        reply.status(400).send({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      const plans = await getUserMealPlans(userId, status);

      reply.status(200).send({
        success: true,
        data: plans,
      });
    } catch (error) {
      fastify.log.error(error, 'Error fetching meal plans');
      reply.status(500).send({ success: false, error: 'Failed to fetch meal plans' });
    }
  });

  // Get a single meal plan by ID
  fastify.get<{
    Params: { id: string };
    Querystring: { userId: string };
  }>('/pantry/plans/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { userId } = request.query;

      if (!userId) {
        reply.status(400).send({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      const plan = await getMealPlanById(id, userId);

      if (!plan) {
        reply.status(404).send({
          success: false,
          error: 'Meal plan not found',
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: plan,
      });
    } catch (error) {
      fastify.log.error(error, 'Error fetching meal plan');
      reply.status(500).send({ success: false, error: 'Failed to fetch meal plan' });
    }
  });

  // Update meal plan status
  fastify.patch<{
    Params: { id: string };
    Body: { userId: string; status: MealPlanStatus };
  }>('/pantry/plans/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { userId, status } = request.body;

      if (!userId) {
        reply.status(400).send({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      if (status !== 'active' && status !== 'completed') {
        reply.status(400).send({
          success: false,
          error: 'Invalid status: must be "active" or "completed"',
        });
        return;
      }

      const plan = await updateMealPlanStatus(id, userId, status);

      if (!plan) {
        reply.status(404).send({
          success: false,
          error: 'Meal plan not found',
        });
        return;
      }

      reply.status(200).send({
        success: true,
        data: plan,
      });
    } catch (error) {
      fastify.log.error(error, 'Error updating meal plan');
      reply.status(500).send({ success: false, error: 'Failed to update meal plan' });
    }
  });

  // Delete a meal plan
  fastify.delete<{
    Params: { id: string };
    Querystring: { userId: string };
  }>('/pantry/plans/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { userId } = request.query;

      if (!userId) {
        reply.status(400).send({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      const deleted = await deleteMealPlan(id, userId);

      if (!deleted) {
        reply.status(404).send({
          success: false,
          error: 'Meal plan not found',
        });
        return;
      }

      reply.status(200).send({
        success: true,
        message: 'Meal plan deleted',
      });
    } catch (error) {
      fastify.log.error(error, 'Error deleting meal plan');
      reply.status(500).send({ success: false, error: 'Failed to delete meal plan' });
    }
  });
}
