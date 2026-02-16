/**
 * SUBSCRIPTION SERVICE
 * ====================
 * Manages user subscriptions, quota tracking, billing cycles,
 * and upgrade/downgrade flows.
 *
 * Tiers: starter ($29/mo), pro ($49/mo), advanced ($99/mo), business (custom)
 *
 * Created: Feb 2026
 */

import type { SubscriptionTier, UserSubscription, SubscriptionPlan } from '@/types/commerce';

// ============================================================================
// Plan Definitions (SSOT for subscription plans)
// ============================================================================

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  starter: {
    id: 'plan_starter',
    tier: 'starter',
    name: 'Starter',
    priceMonthly: 29,
    priceAnnual: 290,
    stripePriceIdMonthly: undefined, // TODO: Set after Stripe product creation
    stripePriceIdAnnual: undefined,
    features: [
      '10 quotes per month',
      'BESS sizing & configuration',
      'ROI & simple payback analysis',
      'TrueQuote™ verified calculations',
      'PDF export (Merlin branded)',
      '10 saved projects',
      'Equipment comparison tool',
      'Email support',
    ],
    limits: {
      quotesPerMonth: 10,
      savedProjects: 10,
      teamMembers: 1,
      apiCallsPerMonth: 0,
      exportFormats: ['pdf'],
    },
    badge: undefined,
    highlight: false,
  },
  pro: {
    id: 'plan_pro',
    tier: 'pro',
    name: 'Pro',
    priceMonthly: 49,
    priceAnnual: 490,
    stripePriceIdMonthly: undefined,
    stripePriceIdAnnual: undefined,
    features: [
      'Unlimited quotes',
      'NPV, IRR & DCF analysis',
      'TrueQuote™ source attribution',
      'AI-powered recommendations',
      'Export to Word, Excel, PDF',
      '50 saved projects',
      'Custom logo on quotes',
      'Sensitivity analysis',
      'Financing calculator',
      'Priority email support',
    ],
    limits: {
      quotesPerMonth: -1, // Unlimited
      savedProjects: 50,
      teamMembers: 1,
      apiCallsPerMonth: 100,
      exportFormats: ['pdf', 'word', 'excel'],
    },
    badge: 'Most Popular',
    highlight: true,
  },
  advanced: {
    id: 'plan_advanced',
    tier: 'advanced',
    name: 'Advanced',
    priceMonthly: 99,
    priceAnnual: 990,
    stripePriceIdMonthly: undefined,
    stripePriceIdAnnual: undefined,
    features: [
      'Everything in Pro',
      'Monte Carlo risk analysis',
      '8760 hourly dispatch simulation',
      'Battery degradation modeling',
      'Dynamic ITC calculator (IRA 2022)',
      'Real-time market intelligence',
      'Team workspace (5 members)',
      'Unlimited projects',
      'White-label branding',
      'Bank-ready financial models',
      'API access (1,000 calls/mo)',
      'Phone + priority support',
    ],
    limits: {
      quotesPerMonth: -1,
      savedProjects: -1, // Unlimited
      teamMembers: 5,
      apiCallsPerMonth: 1000,
      exportFormats: ['pdf', 'word', 'excel', 'json', 'csv'],
    },
    badge: 'Best Value',
    highlight: false,
  },
  business: {
    id: 'plan_business',
    tier: 'business',
    name: 'Business',
    priceMonthly: -1, // Custom
    priceAnnual: -1,
    stripePriceIdMonthly: undefined,
    stripePriceIdAnnual: undefined,
    features: [
      'Everything in Advanced',
      'Unlimited team members',
      'Full API access (unlimited)',
      'Vendor API integration',
      'Custom use case templates',
      'Dedicated account manager',
      'Custom integrations',
      '99.9% SLA',
      'Quarterly business reviews',
    ],
    limits: {
      quotesPerMonth: -1,
      savedProjects: -1,
      teamMembers: -1, // Unlimited
      apiCallsPerMonth: -1, // Unlimited
      exportFormats: ['pdf', 'word', 'excel', 'json', 'csv', 'api'],
    },
    badge: undefined,
    highlight: false,
  },
};

// ============================================================================
// Tier Ordering (for upgrade/downgrade logic)
// ============================================================================

const TIER_ORDER: SubscriptionTier[] = ['starter', 'pro', 'advanced', 'business'];

export function getTierRank(tier: SubscriptionTier): number {
  return TIER_ORDER.indexOf(tier);
}

export function isUpgrade(from: SubscriptionTier, to: SubscriptionTier): boolean {
  return getTierRank(to) > getTierRank(from);
}

export function isDowngrade(from: SubscriptionTier, to: SubscriptionTier): boolean {
  return getTierRank(to) < getTierRank(from);
}

// ============================================================================
// Subscription Management
// ============================================================================

const STORAGE_KEY = 'merlin_user_subscription';
const USAGE_KEY = 'merlin_usage_tracking';

export interface UsageTracking {
  quotesThisMonth: number;
  projectsCount: number;
  apiCallsThisMonth: number;
  lastResetDate: string; // ISO date string
  monthlyQuoteHistory: Array<{ month: string; count: number }>;
}

/**
 * Get the current user's subscription (from localStorage for now)
 */
export function getCurrentSubscription(): UserSubscription | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserSubscription;
  } catch {
    return null;
  }
}

/**
 * Get the effective tier (subscription or default starter)
 */
export function getEffectiveTier(): SubscriptionTier {
  const sub = getCurrentSubscription();
  if (sub && sub.status === 'active') return sub.tier;
  if (sub && sub.status === 'trialing') return sub.tier;
  return 'starter';
}

/**
 * Get the plan details for a specific tier
 */
export function getPlan(tier: SubscriptionTier): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[tier];
}

/**
 * Get all available plans
 */
export function getAllPlans(): SubscriptionPlan[] {
  return TIER_ORDER.map((tier) => SUBSCRIPTION_PLANS[tier]);
}

/**
 * Create or update a subscription (localStorage-based for pre-Stripe)
 */
export function setSubscription(
  tier: SubscriptionTier,
  billingCycle: 'monthly' | 'annual' = 'monthly',
  status: UserSubscription['status'] = 'trialing'
): UserSubscription {
  const now = new Date();
  const periodEnd = new Date(now);
  
  if (status === 'trialing') {
    periodEnd.setDate(periodEnd.getDate() + 14); // 14-day trial
  } else if (billingCycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  const subscription: UserSubscription = {
    id: `sub_${Date.now()}`,
    userId: _getUserId(),
    tier,
    status,
    billingCycle,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    cancelAtPeriodEnd: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
  return subscription;
}

/**
 * Cancel subscription (effective at period end)
 */
export function cancelSubscription(): UserSubscription | null {
  const sub = getCurrentSubscription();
  if (!sub) return null;

  sub.cancelAtPeriodEnd = true;
  sub.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
  return sub;
}

/**
 * Reactivate a cancelled subscription
 */
export function reactivateSubscription(): UserSubscription | null {
  const sub = getCurrentSubscription();
  if (!sub) return null;

  sub.cancelAtPeriodEnd = false;
  sub.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
  return sub;
}

// ============================================================================
// Quota / Usage Tracking
// ============================================================================

/**
 * Get usage tracking data for the current period
 */
export function getUsageTracking(): UsageTracking {
  try {
    const stored = localStorage.getItem(USAGE_KEY);
    if (stored) {
      const usage = JSON.parse(stored) as UsageTracking;
      // Reset if new month
      if (_isNewMonth(usage.lastResetDate)) {
        return _resetMonthlyUsage(usage);
      }
      return usage;
    }
  } catch {
    // Fall through to default
  }

  return _createDefaultUsage();
}

/**
 * Track a quote generation
 */
export function trackQuoteGenerated(): { allowed: boolean; remaining: number; limit: number } {
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  const usage = getUsageTracking();

  const limit = plan.limits.quotesPerMonth;
  if (limit === -1) {
    // Unlimited
    usage.quotesThisMonth++;
    _saveUsage(usage);
    return { allowed: true, remaining: -1, limit: -1 };
  }

  if (usage.quotesThisMonth >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  usage.quotesThisMonth++;
  _saveUsage(usage);
  return { allowed: true, remaining: limit - usage.quotesThisMonth, limit };
}

/**
 * Track a project save
 */
export function trackProjectSaved(): { allowed: boolean; remaining: number; limit: number } {
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  const usage = getUsageTracking();

  const limit = plan.limits.savedProjects;
  if (limit === -1) {
    usage.projectsCount++;
    _saveUsage(usage);
    return { allowed: true, remaining: -1, limit: -1 };
  }

  if (usage.projectsCount >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  usage.projectsCount++;
  _saveUsage(usage);
  return { allowed: true, remaining: limit - usage.projectsCount, limit };
}

/**
 * Track an API call
 */
export function trackApiCall(): { allowed: boolean; remaining: number; limit: number } {
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  const usage = getUsageTracking();

  const limit = plan.limits.apiCallsPerMonth;
  if (limit === -1) {
    usage.apiCallsThisMonth++;
    _saveUsage(usage);
    return { allowed: true, remaining: -1, limit: -1 };
  }

  if (limit === 0) {
    return { allowed: false, remaining: 0, limit: 0 };
  }

  if (usage.apiCallsThisMonth >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  usage.apiCallsThisMonth++;
  _saveUsage(usage);
  return { allowed: true, remaining: limit - usage.apiCallsThisMonth, limit };
}

/**
 * Check if a specific export format is allowed
 */
export function canExport(format: string): boolean {
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  return plan.limits.exportFormats.includes(format);
}

/**
 * Get usage summary for display
 */
export function getUsageSummary(): {
  tier: SubscriptionTier;
  planName: string;
  quotes: { used: number; limit: number; unlimited: boolean };
  projects: { used: number; limit: number; unlimited: boolean };
  apiCalls: { used: number; limit: number; unlimited: boolean };
  daysRemaining: number;
  status: UserSubscription['status'] | 'none';
} {
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  const usage = getUsageTracking();
  const sub = getCurrentSubscription();

  const daysRemaining = sub
    ? Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000))
    : 0;

  return {
    tier,
    planName: plan.name,
    quotes: {
      used: usage.quotesThisMonth,
      limit: plan.limits.quotesPerMonth,
      unlimited: plan.limits.quotesPerMonth === -1,
    },
    projects: {
      used: usage.projectsCount,
      limit: plan.limits.savedProjects,
      unlimited: plan.limits.savedProjects === -1,
    },
    apiCalls: {
      used: usage.apiCallsThisMonth,
      limit: plan.limits.apiCallsPerMonth,
      unlimited: plan.limits.apiCallsPerMonth === -1,
    },
    daysRemaining,
    status: sub?.status || 'none',
  };
}

/**
 * Get upgrade recommendation based on current usage
 */
export function getUpgradeRecommendation(): {
  shouldUpgrade: boolean;
  reason?: string;
  recommendedTier?: SubscriptionTier;
  monthlySavings?: string;
} {
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  const usage = getUsageTracking();

  // Already on business — no upgrade
  if (tier === 'business') return { shouldUpgrade: false };

  // Check quote quota usage
  if (plan.limits.quotesPerMonth !== -1 && usage.quotesThisMonth >= plan.limits.quotesPerMonth * 0.8) {
    const nextTier = TIER_ORDER[getTierRank(tier) + 1] as SubscriptionTier;
    return {
      shouldUpgrade: true,
      reason: `You've used ${usage.quotesThisMonth}/${plan.limits.quotesPerMonth} quotes this month`,
      recommendedTier: nextTier,
    };
  }

  // Check project limit
  if (plan.limits.savedProjects !== -1 && usage.projectsCount >= plan.limits.savedProjects * 0.8) {
    const nextTier = TIER_ORDER[getTierRank(tier) + 1] as SubscriptionTier;
    return {
      shouldUpgrade: true,
      reason: `You've used ${usage.projectsCount}/${plan.limits.savedProjects} project slots`,
      recommendedTier: nextTier,
    };
  }

  return { shouldUpgrade: false };
}

// ============================================================================
// Stripe Integration Stubs (ready for real Stripe integration)
// ============================================================================

/**
 * Create a Stripe checkout session (stub - replace with real Stripe call)
 */
export async function createCheckoutSession(
  tier: SubscriptionTier,
  billingCycle: 'monthly' | 'annual'
): Promise<{ url: string; sessionId: string }> {
  const plan = getPlan(tier);
  const priceId = billingCycle === 'monthly' ? plan.stripePriceIdMonthly : plan.stripePriceIdAnnual;

  if (!priceId) {
    // Pre-Stripe: create local subscription with trial
    setSubscription(tier, billingCycle, 'trialing');
    return { url: '/wizard', sessionId: `local_${Date.now()}` };
  }

  // TODO: Real Stripe integration
  // const response = await fetch('/api/create-checkout-session', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ priceId, billingCycle, userId: _getUserId() }),
  // });
  // const data = await response.json();
  // return { url: data.url, sessionId: data.sessionId };

  setSubscription(tier, billingCycle, 'trialing');
  return { url: '/wizard', sessionId: `local_${Date.now()}` };
}

/**
 * Handle Stripe webhook events (stub)
 */
export async function handleStripeWebhook(event: {
  type: string;
  data: { object: Record<string, unknown> };
}): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      // Activate subscription
      break;
    case 'invoice.paid':
      // Renew subscription
      break;
    case 'invoice.payment_failed':
      // Mark as past_due
      break;
    case 'customer.subscription.deleted':
      // Cancel subscription
      break;
    default:
      console.log(`[SubscriptionService] Unhandled webhook: ${event.type}`);
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

function _getUserId(): string {
  try {
    const userData = localStorage.getItem('merlin_current_user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || 'anonymous';
    }
  } catch {
    // Fall through
  }
  return 'anonymous';
}

function _createDefaultUsage(): UsageTracking {
  const usage: UsageTracking = {
    quotesThisMonth: 0,
    projectsCount: 0,
    apiCallsThisMonth: 0,
    lastResetDate: new Date().toISOString(),
    monthlyQuoteHistory: [],
  };
  _saveUsage(usage);
  return usage;
}

function _isNewMonth(lastReset: string): boolean {
  const last = new Date(lastReset);
  const now = new Date();
  return last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear();
}

function _resetMonthlyUsage(usage: UsageTracking): UsageTracking {
  // Archive the current month
  const lastMonth = new Date(usage.lastResetDate).toISOString().slice(0, 7); // "2026-02"
  usage.monthlyQuoteHistory.push({ month: lastMonth, count: usage.quotesThisMonth });
  
  // Keep last 12 months
  if (usage.monthlyQuoteHistory.length > 12) {
    usage.monthlyQuoteHistory = usage.monthlyQuoteHistory.slice(-12);
  }

  usage.quotesThisMonth = 0;
  usage.apiCallsThisMonth = 0;
  usage.lastResetDate = new Date().toISOString();
  _saveUsage(usage);
  return usage;
}

function _saveUsage(usage: UsageTracking): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
}

// ============================================================================
// Export Service Object
// ============================================================================

export const subscriptionService = {
  // Plan data
  SUBSCRIPTION_PLANS,
  getPlan,
  getAllPlans,
  getTierRank,
  isUpgrade,
  isDowngrade,

  // Subscription management
  getCurrentSubscription,
  getEffectiveTier,
  setSubscription,
  cancelSubscription,
  reactivateSubscription,

  // Usage tracking
  getUsageTracking,
  trackQuoteGenerated,
  trackProjectSaved,
  trackApiCall,
  canExport,
  getUsageSummary,
  getUpgradeRecommendation,

  // Stripe (stubs)
  createCheckoutSession,
  handleStripeWebhook,
};

export default subscriptionService;
