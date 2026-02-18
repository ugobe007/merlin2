import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Supabase Edge Function: Stripe Webhook Handler
 * ================================================
 * 
 * Processes Stripe webhook events to manage subscription lifecycle.
 * 
 * Events handled:
 *   checkout.session.completed    → Activate subscription after payment
 *   invoice.paid                  → Renew/confirm subscription
 *   invoice.payment_failed        → Mark subscription as past_due
 *   customer.subscription.updated → Handle plan changes / cancellations
 *   customer.subscription.deleted → Deactivate subscription
 * 
 * Required Supabase secrets:
 *   STRIPE_SECRET_KEY     - Stripe secret key
 *   STRIPE_WEBHOOK_SECRET - Webhook signing secret (whsec_...)
 *   SUPABASE_URL          - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
 * 
 * Stripe webhook endpoint:
 *   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
 * 
 * Created: February 17, 2026
 */

// Map Stripe Price IDs → Merlin tier names
const PRICE_TO_TIER: Record<string, string> = {
  // Builder (Starter)
  'price_1T22fNDoNSCVLvYPyEeYKW5y': 'starter',  // monthly
  'price_1T22fNDoNSCVLvYPgIXNWuRe': 'starter',  // annual
  // Pro
  'price_1T22fODoNSCVLvYPVYRKn72N': 'pro',      // monthly
  'price_1T22fODoNSCVLvYPLOE4lTIc': 'pro',      // annual
  // Advanced
  'price_1T22fPDoNSCVLvYPhoa8KgM4': 'advanced',  // monthly
  'price_1T22fPDoNSCVLvYPrLnx5O4Y': 'advanced',  // annual
};

const PRICE_TO_BILLING: Record<string, string> = {
  'price_1T22fNDoNSCVLvYPyEeYKW5y': 'monthly',
  'price_1T22fNDoNSCVLvYPgIXNWuRe': 'annual',
  'price_1T22fODoNSCVLvYPVYRKn72N': 'monthly',
  'price_1T22fODoNSCVLvYPLOE4lTIc': 'annual',
  'price_1T22fPDoNSCVLvYPhoa8KgM4': 'monthly',
  'price_1T22fPDoNSCVLvYPrLnx5O4Y': 'annual',
};

serve(async (req: Request) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe secrets not configured', { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  // Initialize Supabase admin client (bypasses RLS)
  const supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  // ── Verify webhook signature ──
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', (err as Error).message);
    return new Response(`Webhook signature error: ${(err as Error).message}`, { status: 400 });
  }

  console.log(`[stripe-webhook] Event received: ${event.type} (${event.id})`);

  // ── Handle events ──
  try {
    switch (event.type) {

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CHECKOUT COMPLETED — User finished Stripe Checkout
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        const userId = session.metadata?.userId || session.client_reference_id;
        const customerEmail = session.customer_email || session.customer_details?.email;

        console.log(`[stripe-webhook] Checkout completed: user=${userId}, sub=${subscriptionId}`);

        // Retrieve the subscription to get the price ID
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const tier = PRICE_TO_TIER[priceId] || 'starter';
        const billing = PRICE_TO_BILLING[priceId] || 'monthly';
        const status = subscription.status; // 'active' or 'trialing'

        // Persist to Supabase
        if (supabase && userId && userId !== 'anonymous') {
          await supabase.from('user_subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            tier,
            billing_cycle: billing,
            status: status === 'trialing' ? 'trialing' : 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            email: customerEmail,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

          // Also update the users table tier
          await supabase.from('users').update({ tier }).eq('id', userId);
        }

        console.log(`[stripe-webhook] Activated: ${tier} (${billing}), status=${status}`);
        break;
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // INVOICE PAID — Recurring payment succeeded
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;

        if (!subscriptionId) break; // One-off invoice, skip

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const tier = PRICE_TO_TIER[priceId] || 'starter';

        if (supabase) {
          await supabase.from('user_subscriptions').update({
            status: 'active',
            tier,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('stripe_customer_id', customerId);
        }

        console.log(`[stripe-webhook] Invoice paid: customer=${customerId}, tier=${tier}`);
        break;
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PAYMENT FAILED — Card declined or expired
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (supabase) {
          await supabase.from('user_subscriptions').update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          }).eq('stripe_customer_id', customerId);
        }

        console.log(`[stripe-webhook] Payment failed: customer=${customerId}`);
        // TODO: Trigger email notification to user
        break;
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SUBSCRIPTION UPDATED — Plan change, trial end, etc.
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const tier = PRICE_TO_TIER[priceId] || 'starter';
        const billing = PRICE_TO_BILLING[priceId] || 'monthly';

        // Map Stripe status → our status
        const statusMap: Record<string, string> = {
          active: 'active',
          trialing: 'trialing',
          past_due: 'past_due',
          canceled: 'canceled',
          unpaid: 'past_due',
          paused: 'paused',
        };
        const status = statusMap[subscription.status] || 'active';

        if (supabase) {
          await supabase.from('user_subscriptions').update({
            tier,
            billing_cycle: billing,
            status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('stripe_customer_id', customerId);

          // Sync tier to users table
          const { data } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (data?.user_id) {
            await supabase.from('users').update({ tier }).eq('id', data.user_id);
          }
        }

        console.log(`[stripe-webhook] Subscription updated: customer=${customerId}, tier=${tier}, status=${status}`);
        break;
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // SUBSCRIPTION DELETED — Fully canceled
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        if (supabase) {
          // Downgrade to free tier
          await supabase.from('user_subscriptions').update({
            tier: 'free',
            status: 'canceled',
            updated_at: new Date().toISOString(),
          }).eq('stripe_customer_id', customerId);

          // Sync tier to users table
          const { data } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (data?.user_id) {
            await supabase.from('users').update({ tier: 'free' }).eq('id', data.user_id);
          }
        }

        console.log(`[stripe-webhook] Subscription deleted: customer=${customerId} → downgraded to free`);
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error(`[stripe-webhook] Error processing ${event.type}:`, err);
    // Return 200 anyway to prevent Stripe from retrying endlessly
    // Errors are logged for manual investigation
    return new Response(JSON.stringify({ received: true, error: (err as Error).message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
