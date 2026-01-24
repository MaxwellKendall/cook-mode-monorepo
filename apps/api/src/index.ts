import Fastify from 'fastify';
import cors from '@fastify/cors';
import { apiConfig } from '@cook-mode/config';
import { testConnection, closeConnection } from '@cook-mode/db';
import { registerRoutes } from './routes/index.js';

const { port: PORT, host: HOST, isDev } = apiConfig;

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
  origin: apiConfig.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// Error handler
fastify.setErrorHandler((error, _request, reply) => {
  fastify.log.error(error, 'Unhandled error');
  const err = error as Error & { statusCode?: number };
  const code = err.statusCode ?? 500;
  const message = err.message || 'Internal server error';
  reply.status(code).send({
    success: false,
    error: message,
  });
});

// Register routes
await fastify.register(registerRoutes);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}. Starting graceful shutdown...`);
  try {
    await closeConnection();
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
    fastify.log.info('Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    fastify.log.info('Database connection established');

    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`API Server running on http://${HOST}:${PORT}`);
  } catch (error) {
    fastify.log.error(error, 'Failed to start server');
    process.exit(1);
  }
}

start();
