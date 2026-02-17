import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

/**
 * Supabase Edge Function: Stripe Checkout Session Creator
 * ========================================================
 * 
 * Creates a Stripe Checkout Session for subscription purchases.
 * Called from the client-side PricingPage when a user selects a plan.
 * 
 * Required Supabase secrets (set via `supabase secrets set`):
 *   STRIPE_SECRET_KEY     - Stripe secret key (sk_live_... or sk_test_...)
 *   STRIPE_WEBHOOK_SECRET - Webhook signing secret (whsec_...)
 *   SITE_URL              - Your production URL (e.g., https://merlin.energy)
 * 
 * Usage:
 *   POST /functions/v1/stripe-checkout
 *   Body: { priceId: "price_...", userId: "...", email: "..." }
 * 
 * Returns:
 *   { url: "https://checkout.stripe.com/...", sessionId: "cs_..." }
 * 
 * Created: February 17, 2026
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5178';

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { priceId, userId, email } = await req.json();

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Missing priceId' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Build checkout session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/wizard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing?checkout=canceled`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId: userId || 'anonymous',
          source: 'merlin-pricing-page',
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    };

    // If we have the user's email, pre-fill it
    if (email) {
      sessionParams.customer_email = email;
    }

    // If we already have a Stripe customer ID, use it instead
    // (future: look up from Supabase users table)

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[stripe-checkout] Error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});
