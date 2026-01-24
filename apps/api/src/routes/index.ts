import type { FastifyInstance } from 'fastify';
import { registerHealthRoutes } from './health.js';
import { registerRecipeRoutes } from './recipes.js';
import { registerUserRoutes } from './users.js';
import { registerTagRoutes } from './tags.js';
import { registerSubscriptionRoutes } from './subscriptions.js';
import { registerJobRoutes } from './jobs.js';

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check
  await fastify.register(registerHealthRoutes, { prefix: '/health' });

  // V1 API routes
  await fastify.register(registerRecipeRoutes, { prefix: '/v1/recipes' });
  await fastify.register(registerUserRoutes, { prefix: '/v1/users' });
  await fastify.register(registerTagRoutes, { prefix: '/v1/tags' });
  await fastify.register(registerSubscriptionRoutes, { prefix: '/v1/subscriptions' });
  await fastify.register(registerJobRoutes, { prefix: '/v1/jobs' });
}
