/**
 * Stripe Integration Service
 * Handles checkout sessions, webhooks, and subscription management
 */

import { supabase } from "./supabaseClient";

// Stripe configuration (from environment variables)
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const STRIPE_API_URL = import.meta.env.VITE_STRIPE_API_URL || "/api/stripe";

export interface StripePriceConfig {
  id: string;
  tier: "pro" | "enterprise";
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  monthlyQuoteLimit: number;
}

// Stripe Price IDs (set these in Stripe Dashboard)
export const STRIPE_PRICES: StripePriceConfig[] = [
  {
    id: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly_placeholder",
    tier: "pro",
    name: "Pro",
    price: 99,
    interval: "month",
    monthlyQuoteLimit: 500,
    features: [
      "500 quotes per month",
      'Hide "Powered by Merlin" badge',
      "Custom branding colors",
      "Priority support",
      "Email notifications",
    ],
  },
  {
    id:
      import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY ||
      "price_enterprise_monthly_placeholder",
    tier: "enterprise",
    name: "Enterprise",
    price: 499,
    interval: "month",
    monthlyQuoteLimit: 999999,
    features: [
      "Unlimited quotes",
      "Complete white-label",
      "Custom integrations",
      "Dedicated account manager",
      "99.9% SLA",
      "Custom contract terms",
    ],
  },
];

export interface CreateCheckoutSessionParams {
  priceId: string;
  partnerId: string;
  partnerEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Create Stripe Checkout Session for subscription upgrade
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResponse> {
  try {
    // In production, this calls your backend API endpoint
    const response = await fetch(`${STRIPE_API_URL}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceId: params.priceId,
        partnerId: params.partnerId,
        customerEmail: params.partnerEmail,
        successUrl: params.successUrl || `${window.location.origin}/dashboard?checkout=success`,
        cancelUrl: params.cancelUrl || `${window.location.origin}/dashboard?checkout=canceled`,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create checkout session");
    }

    const data = await response.json();
    return {
      sessionId: data.sessionId,
      url: data.url,
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

/**
 * Create Stripe Customer Portal session for subscription management
 */
export async function createCustomerPortalSession(partnerId: string): Promise<{ url: string }> {
  try {
    // Get partner's Stripe customer ID
    const { data: partner, error } = await supabase
      .from("widget_partners")
      .select("stripe_customer_id")
      .eq("id", partnerId)
      .single();

    if (error || !partner?.stripe_customer_id) {
      throw new Error("No Stripe customer found");
    }

    // Call backend to create portal session
    const response = await fetch(`${STRIPE_API_URL}/create-portal-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: partner.stripe_customer_id,
        returnUrl: `${window.location.origin}/dashboard`,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create portal session");
    }

    const data = await response.json();
    return { url: data.url };
  } catch (error) {
    console.error("Error creating portal session:", error);
    throw error;
  }
}

/**
 * Get Stripe price config by tier
 */
export function getStripePriceByTier(tier: "pro" | "enterprise"): StripePriceConfig | undefined {
  return STRIPE_PRICES.find((price) => price.tier === tier);
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

/**
 * Check if Stripe is configured (has valid publishable key)
 */
export function isStripeConfigured(): boolean {
  return !!STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY !== "placeholder";
}

/**
 * Demo mode checkout (when Stripe not configured)
 */
export function demoCheckout(tier: "pro" | "enterprise"): void {
  const price = getStripePriceByTier(tier);
  if (price) {
    alert(
      `Demo Mode: ${price.name} Plan Checkout\n\n` +
        `Price: $${price.price}/month\n` +
        `Quote Limit: ${price.monthlyQuoteLimit === 999999 ? "Unlimited" : price.monthlyQuoteLimit}\n\n` +
        "To enable real payments, configure Stripe API keys in your environment variables:\n" +
        "- VITE_STRIPE_PUBLISHABLE_KEY\n" +
        "- VITE_STRIPE_PRICE_PRO_MONTHLY\n" +
        "- VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY"
    );
  }
}
