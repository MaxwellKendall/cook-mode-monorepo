import type { FastifyInstance } from 'fastify';
import { startVoiceSession } from '@cook-mode/db';
import { createPubSub, CHANNELS } from '@cook-mode/redis';
import { buildSessionConfig, type RecipeContext } from '../config/session.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const pubsub = createPubSub();

export async function registerSessionRoutes(fastify: FastifyInstance) {
  // Create WebRTC session
  fastify.post<{
    Body: {
      sdpOffer: string;
      recipe?: RecipeContext;
      userId?: string;
    };
  }>('/session', async (request, reply) => {
    const { sdpOffer, recipe, userId } = request.body;

    if (!sdpOffer) {
      reply.status(400).send({ success: false, error: 'sdpOffer is required' });
      return;
    }

    if (!OPENAI_API_KEY) {
      reply.status(500).send({ success: false, error: 'OpenAI API key not configured' });
      return;
    }

    try {
      // Start voice session in database if userId provided
      let sessionId: string | undefined;
      if (userId) {
        sessionId = await startVoiceSession(userId, recipe?.id);
      }

      // Build session config
      const sessionConfig = buildSessionConfig(recipe);

      // Create form data for OpenAI
      const formData = new FormData();
      formData.set('sdp', sdpOffer);
      formData.set('session', JSON.stringify(sessionConfig));

      // Call OpenAI Realtime API
      const response = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        fastify.log.error(`OpenAI API error: ${response.status} - ${errorText}`);
        reply.status(response.status).send({
          success: false,
          error: `OpenAI API error: ${response.status}`,
        });
        return;
      }

      const sdpAnswer = await response.text();

      reply.send({
        success: true,
        sdpAnswer,
        sessionId,
      });
    } catch (error) {
      fastify.log.error(error, 'Error creating voice session');
      reply.status(500).send({ success: false, error: 'Failed to create session' });
    }
  });

  // Report token usage
  fastify.post<{
    Params: { sessionId: string };
    Body: {
      userId: string;
      inputTokens: number;
      outputTokens: number;
    };
  }>('/session/:sessionId/usage', async (request, reply) => {
    const { sessionId } = request.params;
    const { userId, inputTokens, outputTokens } = request.body;

    if (!userId || inputTokens === undefined || outputTokens === undefined) {
      reply.status(400).send({ success: false, error: 'Missing required fields' });
      return;
    }

    try {
      // Publish to voice usage channel for real-time updates
      await pubsub.publish(CHANNELS.voice(userId), {
        sessionId,
        inputTokens,
        outputTokens,
      });

      reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error, 'Error recording usage');
      reply.status(500).send({ success: false, error: 'Failed to record usage' });
    }
  });
}
