import Fastify from 'fastify';
import cors from '@fastify/cors';
import { voiceBridgeConfig } from '@cook-mode/config';
import { registerSessionRoutes } from './routes/session.js';

const { port: PORT, host: HOST, isDev } = voiceBridgeConfig;

const fastify = Fastify({
  logger: isDev
    ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }
    : { level: 'info' },
});

// Register CORS
await fastify.register(cors, {
  origin: voiceBridgeConfig.corsOrigin,
  credentials: true,
});

// Error handler
fastify.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
  fastify.log.error(error, 'Unhandled error');
  reply.status(error.statusCode || 500).send({
    success: false,
    error: error.message || 'Internal server error',
  });
});

// Health check
fastify.get('/health', async (_request, reply) => {
  reply.send({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register session routes
await fastify.register(registerSessionRoutes);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}. Starting graceful shutdown...`);
  try {
    await fastify.close();
    process.exit(0);
  } catch (error) {
    fastify.log.error(error, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function start() {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Voice Bridge running on http://${HOST}:${PORT}`);
  } catch (error) {
    fastify.log.error(error, 'Failed to start server');
    process.exit(1);
  }
}

start();
