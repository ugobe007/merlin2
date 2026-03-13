/**
 * Stripe service for billing and subscription management
 */

import { supabase } from "@/services/supabaseClient";

// Stripe price IDs by tier (from Stripe Dashboard)
const STRIPE_PRICES = {
  pro: {
    id: import.meta.env.VITE_STRIPE_PRICE_PRO || "price_demo_pro",
    name: "Pro",
    monthlyPrice: 99,
  },
  enterprise: {
    id: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || "price_demo_enterprise",
    name: "Enterprise",
    monthlyPrice: 299,
  },
};

/**
 * Check if Stripe is configured (has real price IDs)
 */
export function isStripeConfigured(): boolean {
  return !!(
    import.meta.env.VITE_STRIPE_PRICE_PRO &&
    import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE &&
    !import.meta.env.VITE_STRIPE_PRICE_PRO.startsWith("price_demo")
  );
}

/**
 * Get Stripe price configuration by tier
 */
export function getStripePriceByTier(tier: "pro" | "enterprise") {
  return STRIPE_PRICES[tier];
}

/**
 * Demo checkout (when Stripe not configured)
 */
export function demoCheckout(tier: "pro" | "enterprise") {
  console.log(`[DEMO] Checkout for ${tier} tier - ${STRIPE_PRICES[tier].monthlyPrice}/month`);
  alert(`Demo Mode: Upgrade to ${tier} tier ($${STRIPE_PRICES[tier].monthlyPrice}/month)\n\nIn production, this would open Stripe Checkout.`);
}

/**
 * Create a Stripe Customer Portal session for subscription management
 * @param customerId - Stripe customer ID
 * @returns Portal session URL
 */
export async function createCustomerPortalSession(customerId: string): Promise<{ url: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("stripe-webhook", {
      body: { type: "create_portal_session", customerId },
    });

    if (error) throw error;
    return { url: data.url };
  } catch (error) {
    console.error("Failed to create customer portal session:", error);
    throw new Error("Failed to create portal session");
  }
}

/**
 * Create a Stripe Checkout session for subscription upgrade
 */
export async function createCheckoutSession(params: {
  priceId: string;
  partnerId: string;
  partnerEmail: string;
}): Promise<{ url: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("stripe-webhook", {
      body: { 
        type: "create_checkout_session", 
        priceId: params.priceId, 
        partnerId: params.partnerId,
        customerEmail: params.partnerEmail,
      },
    });

    if (error) throw error;
    return { url: data.url };
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    throw new Error("Failed to create checkout session");
  }
}
