import type { FastifyInstance } from 'fastify';
import { testConnection } from '@cook-mode/db';

export async function registerHealthRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/health', async (_request, reply) => {
    try {
      const dbConnected = await testConnection();

      reply.send({
        success: true,
        data: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          services: {
            database: dbConnected ? 'connected' : 'disconnected',
          },
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error getting health status');
      reply.status(500).send({
        success: false,
        error: 'Failed to get health status',
      });
    }
  });

  // API info endpoint
  fastify.get('/info', async (_request, reply) => {
    try {
      reply.send({
        success: true,
        data: {
          name: 'Cook Mode API',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error getting API info');
      reply.status(500).send({
        success: false,
        error: 'Failed to get API info',
      });
    }
  });
}
