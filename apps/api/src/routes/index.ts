import type { FastifyInstance } from 'fastify';
import { registerHealthRoutes } from './health.js';
import { registerRecipeRoutes } from './recipes.js';
import { registerUserRoutes } from './users.js';
import { registerTagRoutes } from './tags.js';
import { registerSubscriptionRoutes } from './subscriptions.js';
import { registerJobRoutes } from './jobs.js';
import { registerPantryRoutes } from './pantry.js';
import { registerWeeklyPlanRoutes } from './weekly-plans.js';
import { registerGroceryListRoutes } from './grocery-lists.js';
import { registerSingleMealRoutes } from './single-meal.js';

export async function registerRoutes(fastify: FastifyInstance) {
  // Register all route modules (routes define their own paths)
  await fastify.register(registerHealthRoutes);
  await fastify.register(registerRecipeRoutes);
  await fastify.register(registerUserRoutes);
  await fastify.register(registerTagRoutes);
  await fastify.register(registerSubscriptionRoutes);
  await fastify.register(registerJobRoutes, { prefix: '/jobs' });
  await fastify.register(registerPantryRoutes);
  await fastify.register(registerWeeklyPlanRoutes);
  await fastify.register(registerGroceryListRoutes);
  await fastify.register(registerSingleMealRoutes);
}
