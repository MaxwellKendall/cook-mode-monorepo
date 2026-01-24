import type { FastifyInstance } from 'fastify';
import { testConnection } from '@cook-mode/db';

export async function registerHealthRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_request, reply) => {
    const dbConnected = await testConnection();

    reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
      },
    });
  });

  fastify.get('/live', async (_request, reply) => {
    reply.send({ status: 'ok' });
  });

  fastify.get('/ready', async (_request, reply) => {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      reply.status(503).send({ status: 'not ready', reason: 'database not connected' });
      return;
    }
    reply.send({ status: 'ready' });
  });
}
