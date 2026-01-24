import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { realtimeConfig } from '@cook-mode/config';
import { createPubSub, CHANNELS } from '@cook-mode/redis';
import { ConnectionRegistry } from './connection.js';

const { port: PORT, host: HOST, isDev } = realtimeConfig;

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

const pubsub = createPubSub();
const registry = new ConnectionRegistry();

// Register plugins
await fastify.register(cors, {
  origin: realtimeConfig.corsOrigin,
  credentials: true,
});

await fastify.register(websocket);

// Health check
fastify.get('/health', async (_request, reply) => {
  reply.send({
    status: 'ok',
    connections: registry.getConnectionCount(),
    timestamp: new Date().toISOString(),
  });
});

// WebSocket endpoint
fastify.get('/ws', { websocket: true }, (socket, _request) => {
  const connectionId = crypto.randomUUID();
  registry.addConnection(connectionId, socket);

  fastify.log.info(`WebSocket connected: ${connectionId}`);

  socket.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleClientMessage(connectionId, message);
    } catch (error) {
      fastify.log.error(error, 'Failed to parse WebSocket message');
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  socket.on('close', () => {
    registry.removeConnection(connectionId);
    fastify.log.info(`WebSocket disconnected: ${connectionId}`);
  });

  socket.on('error', (error) => {
    fastify.log.error(error, `WebSocket error for connection ${connectionId}`);
    registry.removeConnection(connectionId);
  });
});

function handleClientMessage(connectionId: string, message: { type: string; userId?: string; jobId?: string }) {
  switch (message.type) {
    case 'subscribe.user':
      if (message.userId) {
        registry.subscribeToUser(connectionId, message.userId);
        fastify.log.debug(`Connection ${connectionId} subscribed to user ${message.userId}`);
      }
      break;

    case 'subscribe.job':
      if (message.jobId) {
        registry.subscribeToJob(connectionId, message.jobId);
        fastify.log.debug(`Connection ${connectionId} subscribed to job ${message.jobId}`);
      }
      break;

    case 'unsubscribe.user':
      if (message.userId) {
        registry.unsubscribeFromUser(connectionId, message.userId);
      }
      break;

    case 'unsubscribe.job':
      if (message.jobId) {
        registry.unsubscribeFromJob(connectionId, message.jobId);
      }
      break;

    case 'ping':
      const socket = registry.getConnection(connectionId);
      if (socket) {
        socket.send(JSON.stringify({ type: 'pong' }));
      }
      break;

    default:
      fastify.log.warn(`Unknown message type: ${message.type}`);
  }
}

// Subscribe to Redis channels using pattern matching
async function setupRedisSubscriptions() {
  // Subscription events
  await pubsub.psubscribe(CHANNELS.patterns.subscription, (channel, message) => {
    const userId = channel.split(':')[1];
    registry.broadcastToUserSubscribers(userId, {
      type: 'subscription.updated',
      userId,
      ...message,
    });
  });

  // Voice usage events
  await pubsub.psubscribe(CHANNELS.patterns.voice, (channel, message) => {
    const userId = channel.split(':')[1];
    registry.broadcastToUserSubscribers(userId, {
      type: 'voice.usage',
      userId,
      ...message,
    });
  });

  // Recipe progress events
  await pubsub.psubscribe(CHANNELS.patterns.recipe, (channel, message) => {
    const jobId = channel.split(':')[1];
    registry.broadcastToJobSubscribers(jobId, {
      type: 'recipe.extraction.progress',
      jobId,
      progress: message,
    });
  });

  // Pantry/ingredient parsing progress events
  await pubsub.psubscribe(CHANNELS.patterns.pantry, (channel, message) => {
    const jobId = channel.split(':')[1];
    registry.broadcastToJobSubscribers(jobId, {
      type: 'pantry.progress',
      jobId,
      progress: message,
    });
  });

  // Meal plan generation progress events
  await pubsub.psubscribe(CHANNELS.patterns.mealplan, (channel, message) => {
    const jobId = channel.split(':')[1];
    registry.broadcastToJobSubscribers(jobId, {
      type: 'mealplan.progress',
      jobId,
      progress: message,
    });
  });

  // Job events
  await pubsub.psubscribe(CHANNELS.patterns.job, (channel, message) => {
    const jobId = channel.split(':')[1];
    const eventMessage = message as { eventType?: string; result?: unknown; error?: string };

    if (eventMessage.eventType === 'completed') {
      registry.broadcastToJobSubscribers(jobId, {
        type: 'job.completed',
        jobId,
        result: eventMessage.result,
      });
    } else if (eventMessage.eventType === 'failed') {
      registry.broadcastToJobSubscribers(jobId, {
        type: 'job.failed',
        jobId,
        error: eventMessage.error,
      });
    }
  });

  fastify.log.info('Redis subscriptions established');
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}. Starting graceful shutdown...`);
  try {
    await pubsub.close();
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
    await setupRedisSubscriptions();
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Realtime Server running on http://${HOST}:${PORT}`);
  } catch (error) {
    fastify.log.error(error, 'Failed to start server');
    process.exit(1);
  }
}

start();
