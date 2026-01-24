import type { FastifyInstance } from 'fastify';
import { PassThrough } from 'stream';
import Stripe from 'stripe';
import {
  getUserSubscription,
  updateUserSubscription,
  getUserByCustomerId,
  recordTokenUsage,
  startVoiceSession,
  endVoiceSession,
} from '@cook-mode/db';
import { getPlanConfig, calculateMinutesRemaining, type Plan } from '@cook-mode/shared';

// Lazy-initialize Stripe to allow app to start without STRIPE_SECRET_KEY
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

// Simple SSE connection manager
interface SSEConnection {
  id: string;
  userId: string;
  createdAt: Date;
}

const sseConnections = new Map<string, SSEConnection>();
const userConnections = new Map<string, Set<string>>();

function addConnection(userId: string, connectionId: string) {
  sseConnections.set(connectionId, {
    id: connectionId,
    userId,
    createdAt: new Date(),
  });
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)!.add(connectionId);
}

function removeConnection(userId: string, connectionId: string) {
  sseConnections.delete(connectionId);
  userConnections.get(userId)?.delete(connectionId);
}

function getUserConnections(userId: string): string[] {
  return Array.from(userConnections.get(userId) || []);
}

function getAllConnections(): SSEConnection[] {
  return Array.from(sseConnections.values());
}

function getConnection(connectionId: string): SSEConnection | undefined {
  return sseConnections.get(connectionId);
}

export async function registerSubscriptionRoutes(fastify: FastifyInstance) {
  // Create checkout session
  fastify.post<{
    Body: { priceId: string; userId: string; recipeId?: string; email?: string };
  }>('/create-checkout-session', async (request, reply) => {
    const { priceId, userId, recipeId, email } = request.body;

    if (!priceId || !userId) {
      reply.status(400).send({ success: false, error: 'priceId and userId are required' });
      return;
    }

    try {
      const successUrl = recipeId
        ? `${process.env.FRONTEND_URL}/recipe/${recipeId}?checkout=success`
        : `${process.env.FRONTEND_URL}/dashboard?checkout=success`;
      const cancelUrl = recipeId
        ? `${process.env.FRONTEND_URL}/recipe/${recipeId}?checkout=canceled`
        : `${process.env.FRONTEND_URL}/dashboard?checkout=canceled`;

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: { userId, recipeId: recipeId || '' },
      };

      if (email) {
        sessionParams.customer_email = email;
      }

      const session = await getStripe().checkout.sessions.create(sessionParams);

      reply.send({ success: true, data: { sessionId: session.id, url: session.url } });
    } catch (error) {
      fastify.log.error(error, 'Error creating checkout session');
      reply.status(500).send({ success: false, error: 'Failed to create checkout session' });
    }
  });

  // Generate ephemeral key for OpenAI Realtime API
  fastify.post('/generate-ephemeral-key', async (_request, reply) => {
    try {
      fastify.log.info('generate-ephemeral-key called');

      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        reply.status(500).send({ success: false, error: 'OpenAI API key not configured' });
        return;
      }

      // Generate ephemeral key via OpenAI API
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'verse',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        fastify.log.error(`OpenAI API error: ${errorText}`);
        reply.status(500).send({ success: false, error: 'Failed to generate ephemeral key' });
        return;
      }

      const data = await response.json() as { client_secret: { value: string; expires_at: number }; expires_at?: number };

      reply.send({
        success: true,
        data: {
          client_secret: data.client_secret,
          expires_at: data.expires_at,
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to generate ephemeral key');
      reply.status(500).send({ success: false, error: 'Failed to generate ephemeral key' });
    }
  });

  // Create realtime session (unified interface)
  fastify.post<{
    Body: { sdp: string; recipe?: any };
  }>('/realtime/session', async (request, reply) => {
    try {
      const { sdp, recipe } = request.body;

      if (!sdp || typeof sdp !== 'string') {
        reply.status(400).send({ success: false, error: 'SDP offer is required and must be a string' });
        return;
      }

      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        reply.status(500).send({ success: false, error: 'OpenAI API key not configured' });
        return;
      }

      // Build session config based on recipe context
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      const instructions = recipe
        ? `You are a helpful cooking assistant. The user is cooking: ${recipe.title}. Help them with the recipe.`
        : 'You are a helpful cooking assistant. Help users find and cook recipes.';

      // Create WebRTC session with OpenAI
      const response = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/sdp',
        },
        body: sdp,
      });

      if (!response.ok) {
        const errorText = await response.text();
        fastify.log.error(`OpenAI Realtime API error: ${errorText}`);
        reply.status(500).send({ success: false, error: 'Failed to create realtime session' });
        return;
      }

      const sdpAnswer = await response.text();

      reply.send({ success: true, sdp: sdpAnswer });
    } catch (error) {
      fastify.log.error(error, 'Error creating realtime session');
      reply.status(500).send({ success: false, error: 'Failed to create realtime session' });
    }
  });

  // Get subscription status
  fastify.get<{
    Params: { user_id: string };
  }>('/subscription/status/:user_id', async (request, reply) => {
    const { user_id } = request.params;

    try {
      const subscription = await getUserSubscription(user_id);

      if (!subscription) {
        const freeConfig = getPlanConfig('free');
        reply.send({
          success: true,
          data: {
            isSubscribed: false,
            plan: 'free',
            status: 'inactive',
            minutesRemaining: freeConfig.minutesEstimate,
            costRemaining: freeConfig.allowance,
            inputTokensUsed: 0,
            outputTokensUsed: 0,
          },
        });
        return;
      }

      const plan = (subscription.plan || 'free') as Plan;
      const minutesRemaining = calculateMinutesRemaining(
        plan,
        subscription.inputTokensUsed || 0,
        subscription.outputTokensUsed || 0
      );
      const planConfig = getPlanConfig(plan);
      const costUsed = parseFloat(subscription.incurredCost || '0');

      reply.send({
        success: true,
        data: {
          isSubscribed: subscription.isSubscribed,
          plan,
          status: subscription.status,
          minutesRemaining,
          costRemaining: Math.max(0, planConfig.allowance - costUsed),
          inputTokensUsed: subscription.inputTokensUsed || 0,
          outputTokensUsed: subscription.outputTokensUsed || 0,
          currentPeriodStart: subscription.currentPeriodStart?.toISOString(),
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error fetching subscription status');
      reply.status(500).send({ success: false, error: 'Failed to fetch subscription status' });
    }
  });

  // Start voice session
  fastify.post<{
    Params: { user_id: string };
    Body: { recipe_id?: string };
  }>('/voice-session/start/:user_id', async (request, reply) => {
    const { user_id } = request.params;
    const { recipe_id } = request.body || {};

    try {
      const sessionId = await startVoiceSession(user_id, recipe_id);
      reply.send({ success: true, data: { sessionId } });
    } catch (error) {
      fastify.log.error(error, 'Error starting voice session');
      const message = error instanceof Error ? error.message : 'Failed to start voice session';
      reply.status(500).send({ success: false, error: message });
    }
  });

  // End voice session
  fastify.post<{
    Params: { session_id: string };
  }>('/voice-session/end/:session_id', async (request, reply) => {
    const { session_id } = request.params;

    try {
      await endVoiceSession(session_id);
      reply.send({ success: true, data: { ended: true } });
    } catch (error) {
      fastify.log.error(error, 'Error ending voice session');
      const message = error instanceof Error ? error.message : 'Failed to end voice session';
      reply.status(500).send({ success: false, error: message });
    }
  });

  // Record token usage
  fastify.post<{
    Body: { user_id: string; input_tokens: number; output_tokens: number };
  }>('/voice-session/usage', async (request, reply) => {
    const { user_id, input_tokens, output_tokens } = request.body;

    if (!user_id) {
      reply.status(400).send({ success: false, error: 'user_id is required' });
      return;
    }

    if (typeof input_tokens !== 'number' || typeof output_tokens !== 'number') {
      reply.status(400).send({ success: false, error: 'input_tokens and output_tokens are required numbers' });
      return;
    }

    try {
      const result = await recordTokenUsage(user_id, input_tokens, output_tokens);

      // Calculate minutes remaining
      const subscription = await getUserSubscription(user_id);
      const plan = (subscription?.plan || 'free') as Plan;
      const minutesRemaining = calculateMinutesRemaining(
        plan,
        (subscription?.inputTokensUsed || 0) + input_tokens,
        (subscription?.outputTokensUsed || 0) + output_tokens
      );

      reply.send({
        success: true,
        hasAvailable: result.hasAvailable,
        minutesRemaining,
      });
    } catch (error) {
      fastify.log.error(error, 'Error recording token usage');
      reply.status(500).send({ success: false, error: 'Failed to record token usage' });
    }
  });

  // SSE endpoint for real-time subscription updates
  fastify.get<{
    Params: { user_id: string };
  }>('/subscription/events/:user_id', async (request, reply) => {
    const { user_id } = request.params;

    try {
      const connectionId = `${user_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      addConnection(user_id, connectionId);

      fastify.log.info(`SSE connection established: ${connectionId} for user ${user_id}`);

      // Set SSE headers
      reply.header('Content-Type', 'text/event-stream');
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');
      reply.header('Connection', 'keep-alive');
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Headers', 'Cache-Control');
      reply.header('X-Accel-Buffering', 'no');

      const stream = new PassThrough();

      // Send initial connection event
      const initialEvent = {
        type: 'connected',
        connection_id: connectionId,
        timestamp: new Date().toISOString(),
      };
      stream.write(`data: ${JSON.stringify(initialEvent)}\n\n`);

      // Keep-alive interval
      const keepAliveInterval = setInterval(() => {
        try {
          const keepAliveEvent = {
            type: 'keepalive',
            timestamp: new Date().toISOString(),
          };
          stream.write(`data: ${JSON.stringify(keepAliveEvent)}\n\n`);
        } catch {
          clearInterval(keepAliveInterval);
          stream.destroy();
        }
      }, 30000);

      // Handle client disconnect
      request.raw.on('close', () => {
        fastify.log.info(`SSE connection closed: ${connectionId}`);
        clearInterval(keepAliveInterval);
        removeConnection(user_id, connectionId);
        stream.destroy();
      });

      request.raw.on('error', () => {
        clearInterval(keepAliveInterval);
        removeConnection(user_id, connectionId);
        stream.destroy();
      });

      return reply.send(stream);
    } catch (error) {
      fastify.log.error(error, 'Error in SSE endpoint');
      reply.status(500).send({ success: false, error: 'Failed to establish SSE connection' });
    }
  });

  // Broadcast event (for testing/admin)
  fastify.post<{
    Params: { user_id: string };
    Body: { type: string; data?: any };
  }>('/subscription/broadcast/:user_id', async (request, reply) => {
    const { user_id } = request.params;
    const { type, data } = request.body;

    try {
      const connections = getUserConnections(user_id);

      if (connections.length === 0) {
        reply.status(404).send({ success: false, error: 'No active connections found for user' });
        return;
      }

      const event = {
        type,
        data,
        timestamp: new Date().toISOString(),
      };

      fastify.log.info(`Broadcasting event to ${connections.length} connections for user ${user_id}`);

      reply.send({
        success: true,
        data: {
          message: `Event broadcasted to ${connections.length} connections`,
          connections: connections.length,
          event,
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error in broadcast endpoint');
      reply.status(500).send({ success: false, error: 'Failed to broadcast event' });
    }
  });

  // Get active SSE connections (for monitoring)
  fastify.get<{
    Querystring: { user_id?: string };
  }>('/subscription/connections', async (request, reply) => {
    const { user_id } = request.query;

    try {
      if (user_id) {
        const connections = getUserConnections(user_id);
        reply.send({
          success: true,
          data: {
            user_id,
            connections: connections.map((id) => ({
              id,
              created_at: getConnection(id)?.createdAt,
            })),
          },
        });
      } else {
        const allConnections = getAllConnections();
        reply.send({
          success: true,
          data: {
            total_connections: allConnections.length,
            connections: allConnections.map((conn) => ({
              id: conn.id,
              user_id: conn.userId,
              created_at: conn.createdAt,
            })),
          },
        });
      }
    } catch (error) {
      fastify.log.error(error, 'Error in get connections endpoint');
      reply.status(500).send({ success: false, error: 'Failed to get connections' });
    }
  });

  // Create customer portal session
  fastify.post<{
    Params: { user_id: string };
    Body: { recipeId?: string };
  }>('/customer-portal/:user_id', async (request, reply) => {
    const { user_id } = request.params;
    const { recipeId } = request.body || {};

    try {
      const subscription = await getUserSubscription(user_id);
      const customerId = subscription?.customerId;

      if (!customerId) {
        reply.status(404).send({
          success: false,
          error: 'Customer not found. Please ensure you have an active subscription.',
        });
        return;
      }

      const returnUrl = recipeId
        ? `${process.env.FRONTEND_URL}/recipe/${recipeId}`
        : `${process.env.FRONTEND_URL}/dashboard`;

      const session = await getStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      reply.send({ success: true, data: { url: session.url } });
    } catch (error) {
      fastify.log.error(error, 'Error creating customer portal session');
      reply.status(500).send({ success: false, error: 'Failed to create customer portal session' });
    }
  });

  // Stripe webhook - register with custom content type parser
  fastify.register(async function (webhookFastify) {
    webhookFastify.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      function (_req, body, done) {
        try {
          const rawBody = body;
          const jsonBody = JSON.parse(body.toString());
          const newBody = {
            raw: rawBody,
            json: jsonBody,
          };
          done(null, newBody);
        } catch (error: any) {
          error.statusCode = 400;
          done(error, undefined);
        }
      }
    );

    webhookFastify.post<{
      Body: { raw: Buffer; json: any };
      Headers: { 'stripe-signature': string };
    }>('/webhooks/stripe', async (request, reply) => {
      const sig = request.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        reply.status(500).send({ error: 'Webhook secret not configured' });
        return;
      }

      let event: Stripe.Event;

      try {
        event = getStripe().webhooks.constructEvent(request.body.raw, sig, webhookSecret);
      } catch (err) {
        fastify.log.error(err, 'Webhook signature verification failed');
        reply.status(400).send({ error: 'Invalid signature' });
        return;
      }

      try {
        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.client_reference_id;
            const subscriptionObj = await getStripe().subscriptions.retrieve(
              session.subscription as string
            );
            const priceId = subscriptionObj.items.data[0]?.price.id;

            // Determine plan from price ID
            let plan = 'basic';
            if (priceId === process.env.STRIPE_PRICE_PRO) {
              plan = 'pro';
            } else if (priceId === process.env.STRIPE_PRICE_PREMIUM) {
              plan = 'premium';
            }

            if (userId) {
              await updateUserSubscription(userId, {
                isSubscribed: true,
                subscriptionId: session.subscription as string,
                customerId: session.customer as string,
                status: 'active',
                plan,
              });
            }
            break;
          }

          case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            const userId = await getUserByCustomerId(subscription.customer as string);

            if (userId) {
              await updateUserSubscription(userId, {
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              });
            }
            break;
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const userId = await getUserByCustomerId(subscription.customer as string);

            if (userId) {
              await updateUserSubscription(userId, {
                isSubscribed: false,
                status: 'canceled',
                plan: 'free',
              });
            }
            break;
          }

          case 'invoice.payment_succeeded': {
            const invoice = event.data.object as Stripe.Invoice;
            if (invoice.billing_reason === 'subscription_cycle') {
              const userId = await getUserByCustomerId(invoice.customer as string);
              if (userId) {
                // Reset usage on subscription renewal
                await updateUserSubscription(userId, {
                  inputTokensUsed: 0,
                  outputTokensUsed: 0,
                  incurredCost: '0.000000',
                });
              }
            }
            break;
          }
        }

        reply.send({ received: true });
      } catch (error) {
        fastify.log.error(error, 'Error processing webhook');
        reply.status(500).send({ error: 'Webhook processing failed' });
      }
    });
  });
}
