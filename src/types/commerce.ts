/**
 * COMMERCE TYPES
 * ==============
 * Types for subscriptions, API keys, vendor integrations, and Stripe.
 * 
 * Created: Feb 16, 2026
 */

// =====================================================
// USER SUBSCRIPTION TIERS
// =====================================================

export type SubscriptionTier = 'starter' | 'pro' | 'advanced' | 'business';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  priceMonthly: number;      // USD
  priceAnnual: number;       // USD (total annual)
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  features: string[];
  limits: {
    quotesPerMonth: number;
    savedProjects: number;
    teamMembers: number;
    apiCallsPerMonth: number;
    exportFormats: string[];
  };
  badge?: string;
  highlight?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// VENDOR API KEYS
// =====================================================

export type ApiKeyScope = 
  | 'pricing:read'
  | 'pricing:write'
  | 'products:read'
  | 'products:write'
  | 'rfq:read'
  | 'rfq:write'
  | 'webhooks:manage'
  | 'analytics:read';

export interface VendorApiKey {
  id: string;
  vendorId: string;
  keyPrefix: string;
  keyHash: string;
  name: string;
  scopes: ApiKeyScope[];
  environment: 'live' | 'test';
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  totalRequests: number;
  createdAt: string;
  revokedAt?: string;
}

export interface VendorWebhook {
  id: string;
  vendorId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  failureCount: number;
  lastDeliveryAt?: string;
  lastDeliveryStatus?: 'success' | 'failure';
  createdAt: string;
}

export type WebhookEvent = 
  | 'rfq.created'
  | 'rfq.updated'
  | 'rfq.closed'
  | 'product.approved'
  | 'product.rejected'
  | 'pricing.request'
  | 'quote.matched'
  | 'report.available';

// =====================================================
// API INTEGRATION
// =====================================================

export interface VendorApiConfig {
  vendorId: string;
  apiKey: VendorApiKey;
  webhooks: VendorWebhook[];
  integrationStatus: 'setup' | 'testing' | 'active' | 'suspended';
  pricingFeedUrl?: string;
  pricingFeedFormat?: 'json' | 'csv' | 'xml';
  pricingFeedInterval?: 'hourly' | 'daily' | 'weekly';
  lastPricingSyncAt?: string;
  catalogSyncEnabled: boolean;
  autoRfqResponse: boolean;
}

export interface PricingFeedEntry {
  sku: string;
  productType: string;
  model: string;
  manufacturer: string;
  pricePerUnit: number;
  unit: 'kWh' | 'kW' | 'W' | 'unit';
  currency: string;
  minOrderQuantity?: number;
  leadTimeWeeks: number;
  warrantyYears: number;
  validUntil: string;
  region?: string;
  specifications?: Record<string, unknown>;
}

export interface VendorApiUsageMetrics {
  vendorId: string;
  period: 'day' | 'week' | 'month';
  apiCalls: number;
  pricingSubmissions: number;
  rfqResponses: number;
  webhookDeliveries: number;
  webhookFailures: number;
  lastActivity: string;
}

// =====================================================
// STRIPE TYPES (for future integration)
// =====================================================

export interface StripeCheckoutConfig {
  priceId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

