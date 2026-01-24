import type { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import {
  getUserSubscription,
  updateUserSubscription,
  getUserByCustomerId,
  getRemainingMinutes,
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

export async function registerSubscriptionRoutes(fastify: FastifyInstance) {
  // Get subscription status
  fastify.get<{
    Params: { userId: string };
  }>('/:userId/status', async (request, reply) => {
    const { userId } = request.params;

    try {
      const subscription = await getUserSubscription(userId);

      if (!subscription) {
        // Return default free tier status
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

  // Create checkout session
  fastify.post<{
    Body: { user_id: string; plan: string; success_url: string; cancel_url: string };
  }>('/checkout', async (request, reply) => {
    const { user_id, plan, success_url, cancel_url } = request.body;

    if (!user_id || !plan || !success_url || !cancel_url) {
      reply.status(400).send({ success: false, error: 'Missing required fields' });
      return;
    }

    try {
      const priceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}`];
      if (!priceId) {
        reply.status(400).send({ success: false, error: 'Invalid plan' });
        return;
      }

      const session = await getStripe().checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url,
        cancel_url,
        client_reference_id: user_id,
        metadata: { user_id, plan },
      });

      reply.send({ success: true, data: { sessionId: session.id, url: session.url } });
    } catch (error) {
      fastify.log.error(error, 'Error creating checkout session');
      reply.status(500).send({ success: false, error: 'Failed to create checkout session' });
    }
  });

  // Stripe webhook
  fastify.post<{
    Body: Buffer;
    Headers: { 'stripe-signature': string };
  }>(
    '/webhooks/stripe',
    {
      config: {
        rawBody: true,
      },
    },
    async (request, reply) => {
      const sig = request.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        reply.status(500).send({ error: 'Webhook secret not configured' });
        return;
      }

      let event: Stripe.Event;

      try {
        event = getStripe().webhooks.constructEvent(request.body as unknown as Buffer, sig, webhookSecret);
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
            const plan = session.metadata?.plan || 'basic';

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
        }

        reply.send({ received: true });
      } catch (error) {
        fastify.log.error(error, 'Error processing webhook');
        reply.status(500).send({ error: 'Webhook processing failed' });
      }
    }
  );
}
