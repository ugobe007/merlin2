/**
 * SUBSCRIPTION SERVICE
 * ====================
 * Manages user subscriptions, quota tracking, billing cycles,
 * and upgrade/downgrade flows.
 *
 * QUOTA MODEL (Feb 2026 redesign):
 *   Guest (unauthenticated):
 *     - Unlimited previews (MagicFit tiers, pricing, recalc)
 *     - 3 quote EXPORTS per browser session (in-memory, resets on refresh)
 *     - After 3 → prompt to sign up
 *
 *   Authenticated starter: 10 quote exports per month (localStorage)
 *   Authenticated pro+:   Unlimited
 *
 *   "Quote export" = PDF/Word/Excel download or saved project.
 *   Previews/calculations are NEVER metered.
 *
 * Tiers: starter ($29/mo), pro ($49/mo), advanced ($99/mo), business (custom)
 *
 * Created: Feb 2026
 */

import type { SubscriptionTier, UserSubscription, SubscriptionPlan } from '@/types/commerce';

// ============================================================================
// Guest Session Quota (in-memory — resets on page refresh)
// ============================================================================

const GUEST_SESSION_LIMIT = 5;
let _guestSessionExportCount = 0;
let _guestSessionAdvancedCalcCount = 0;
let _guestSessionMarketReportCount = 0;

// Guest advanced calc / market report limits (teaser)
const GUEST_ADVANCED_CALC_LIMIT = 1;
const GUEST_MARKET_REPORT_LIMIT = 1;

/**
 * Check if the current user is authenticated via authService.
 * Reads the same localStorage key that authService.ts writes to.
 */
export function isUserAuthenticated(): boolean {
  try {
    const raw = localStorage.getItem('current_user');
    if (!raw) return false;
    const data = JSON.parse(raw);
    // authService wraps user in { user, sessionExpiry }
    if (data.sessionExpiry && new Date(data.sessionExpiry) < new Date()) {
      return false; // session expired
    }
    return !!data.user;
  } catch {
    return false;
  }
}

// ============================================================================
// Plan Definitions (SSOT for subscription plans)
// ============================================================================

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'plan_free',
    tier: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    stripePriceIdMonthly: undefined,
    stripePriceIdAnnual: undefined,
    features: [
      '3 quote exports per month',
      'BESS sizing & configuration',
      'TrueQuote™ verified calculations',
      'MagicFit tier comparison',
      'PDF export (Merlin branded)',
      '3 saved projects',
      'Email support',
    ],
    limits: {
      quotesPerMonth: 3,
      savedProjects: 3,
      teamMembers: 1,
      apiCallsPerMonth: 0,
      exportFormats: ['pdf'],
      advancedCalcsPerMonth: 0,
      marketReportsPerMonth: 0,
    },
    badge: undefined,
    highlight: false,
  },
  starter: {
    id: 'plan_starter',
    tier: 'starter',
    name: 'Builder',
    priceMonthly: 29,
    priceAnnual: 290,
    stripePriceIdMonthly: 'price_1T1o00DDikrZ8niOVKn08ILA',
    stripePriceIdAnnual: 'price_1T1oByDDikrZ8niOVx5OO12E',
    features: [
      '15 quotes per month',
      'BESS sizing & configuration',
      'ROI & simple payback analysis',
      'TrueQuote™ verified calculations',
      'PDF export (Merlin branded)',
      '10 saved projects',
      'Equipment comparison tool',
      '2 advanced financial analyses/mo ✨',
      '2 market intelligence reports/mo ✨',
      'Email support',
    ],
    limits: {
      quotesPerMonth: 15,
      savedProjects: 10,
      teamMembers: 1,
      apiCallsPerMonth: 0,
      exportFormats: ['pdf'],
      advancedCalcsPerMonth: 2,
      marketReportsPerMonth: 2,
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
    stripePriceIdMonthly: 'price_1T1o1lDDikrZ8niOIIb3Kjto',
    stripePriceIdAnnual: 'price_1T1oBADDikrZ8niO9IsHJ1Hv',
    features: [
      '100 quotes per month',
      'NPV, IRR & DCF analysis',
      'TrueQuote™ source attribution',
      'AI-powered recommendations',
      'Export to Word, Excel, PDF',
      '50 saved projects',
      'Custom logo on quotes',
      'Sensitivity analysis',
      'Financing calculator',
      '10 advanced financial analyses/mo',
      '10 market intelligence reports/mo',
      'Utility rate explorer',
      'ITC incentive calculator',
      'Priority email support',
    ],
    limits: {
      quotesPerMonth: 100,
      savedProjects: 50,
      teamMembers: 1,
      apiCallsPerMonth: 100,
      exportFormats: ['pdf', 'word', 'excel'],
      advancedCalcsPerMonth: 10,
      marketReportsPerMonth: 10,
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
    stripePriceIdMonthly: 'price_1T1o2pDDikrZ8niOvh28FT4J',
    stripePriceIdAnnual: 'price_1T1o9YDDikrZ8niOPfgW9rZE',
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
      advancedCalcsPerMonth: -1, // Unlimited
      marketReportsPerMonth: -1, // Unlimited
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
      advancedCalcsPerMonth: -1, // Unlimited
      marketReportsPerMonth: -1, // Unlimited
    },
    badge: undefined,
    highlight: false,
  },
};

// ============================================================================
// Tier Ordering (for upgrade/downgrade logic)
// ============================================================================

const TIER_ORDER: SubscriptionTier[] = ['free', 'starter', 'pro', 'advanced', 'business'];

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
  advancedCalcsThisMonth: number;
  marketReportsThisMonth: number;
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
  return 'free'; // Default: Free tier (signup captures email, upgrade for paid features)
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
 * Track a quote DELIVERY (export/save — NOT a preview or calculation).
 *
 * Guest: increments in-memory session counter (max 3 per page session).
 * Authenticated: increments localStorage monthly counter.
 */
export function trackQuoteGenerated(): { allowed: boolean; remaining: number; limit: number } {
  // ── GUEST PATH ──
  if (!isUserAuthenticated()) {
    if (_guestSessionExportCount >= GUEST_SESSION_LIMIT) {
      return { allowed: false, remaining: 0, limit: GUEST_SESSION_LIMIT };
    }
    _guestSessionExportCount++;
    return {
      allowed: true,
      remaining: GUEST_SESSION_LIMIT - _guestSessionExportCount,
      limit: GUEST_SESSION_LIMIT,
    };
  }

  // ── AUTHENTICATED PATH ──
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

// ============================================================================
// Advanced Calc & Market Report Tracking (Feb 2026)
// ============================================================================

/**
 * Track an advanced financial calculation (Monte Carlo, 8760, sensitivity).
 *
 * Guest: limited to GUEST_ADVANCED_CALC_LIMIT per session (teaser).
 * Authenticated: plan-based monthly limit.
 */
export function trackAdvancedCalc(): { allowed: boolean; remaining: number; limit: number } {
  // ── GUEST PATH ──
  if (!isUserAuthenticated()) {
    if (_guestSessionAdvancedCalcCount >= GUEST_ADVANCED_CALC_LIMIT) {
      return { allowed: false, remaining: 0, limit: GUEST_ADVANCED_CALC_LIMIT };
    }
    _guestSessionAdvancedCalcCount++;
    return {
      allowed: true,
      remaining: GUEST_ADVANCED_CALC_LIMIT - _guestSessionAdvancedCalcCount,
      limit: GUEST_ADVANCED_CALC_LIMIT,
    };
  }

  // ── AUTHENTICATED PATH ──
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  const usage = getUsageTracking();

  const limit = plan.limits.advancedCalcsPerMonth;
  if (limit === -1) {
    usage.advancedCalcsThisMonth++;
    _saveUsage(usage);
    return { allowed: true, remaining: -1, limit: -1 };
  }

  if (usage.advancedCalcsThisMonth >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  usage.advancedCalcsThisMonth++;
  _saveUsage(usage);
  return { allowed: true, remaining: limit - usage.advancedCalcsThisMonth, limit };
}

/**
 * Track a market intelligence report request.
 *
 * Guest: limited to GUEST_MARKET_REPORT_LIMIT per session (teaser).
 * Authenticated: plan-based monthly limit.
 */
export function trackMarketReport(): { allowed: boolean; remaining: number; limit: number } {
  // ── GUEST PATH ──
  if (!isUserAuthenticated()) {
    if (_guestSessionMarketReportCount >= GUEST_MARKET_REPORT_LIMIT) {
      return { allowed: false, remaining: 0, limit: GUEST_MARKET_REPORT_LIMIT };
    }
    _guestSessionMarketReportCount++;
    return {
      allowed: true,
      remaining: GUEST_MARKET_REPORT_LIMIT - _guestSessionMarketReportCount,
      limit: GUEST_MARKET_REPORT_LIMIT,
    };
  }

  // ── AUTHENTICATED PATH ──
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  const usage = getUsageTracking();

  const limit = plan.limits.marketReportsPerMonth;
  if (limit === -1) {
    usage.marketReportsThisMonth++;
    _saveUsage(usage);
    return { allowed: true, remaining: -1, limit: -1 };
  }

  if (usage.marketReportsThisMonth >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  usage.marketReportsThisMonth++;
  _saveUsage(usage);
  return { allowed: true, remaining: limit - usage.marketReportsThisMonth, limit };
}

/**
 * Peek at advanced calc / market report quota WITHOUT incrementing.
 */
export function peekFeatureQuota(
  feature: 'advancedCalc' | 'marketReport'
): { allowed: boolean; remaining: number; limit: number } {
  // Dev mode bypass
  if (import.meta.env.DEV) return { allowed: true, remaining: 999, limit: -1 };

  // ── GUEST PATH ──
  if (!isUserAuthenticated()) {
    if (feature === 'advancedCalc') {
      const remaining = Math.max(0, GUEST_ADVANCED_CALC_LIMIT - _guestSessionAdvancedCalcCount);
      return { allowed: remaining > 0, remaining, limit: GUEST_ADVANCED_CALC_LIMIT };
    }
    const remaining = Math.max(0, GUEST_MARKET_REPORT_LIMIT - _guestSessionMarketReportCount);
    return { allowed: remaining > 0, remaining, limit: GUEST_MARKET_REPORT_LIMIT };
  }

  // ── AUTHENTICATED PATH ──
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  const usage = getUsageTracking();

  if (tier === 'business') return { allowed: true, remaining: -1, limit: -1 };

  const used = feature === 'advancedCalc' ? usage.advancedCalcsThisMonth : usage.marketReportsThisMonth;
  const limit = feature === 'advancedCalc' ? plan.limits.advancedCalcsPerMonth : plan.limits.marketReportsPerMonth;

  if (limit === -1) return { allowed: true, remaining: -1, limit: -1 };

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
  };
}

/**
 * Get usage summary for display.
 * Guest users see their session-based export count.
 * Authenticated users see their monthly plan usage.
 */
export function getUsageSummary(): {
  tier: SubscriptionTier;
  planName: string;
  isGuest: boolean;
  quotes: { used: number; limit: number; unlimited: boolean };
  projects: { used: number; limit: number; unlimited: boolean };
  apiCalls: { used: number; limit: number; unlimited: boolean };
  advancedCalcs: { used: number; limit: number; unlimited: boolean };
  marketReports: { used: number; limit: number; unlimited: boolean };
  daysRemaining: number;
  status: UserSubscription['status'] | 'none';
} {
  const isGuest = !isUserAuthenticated();

  if (isGuest) {
    return {
      tier: 'free',
      planName: 'Guest',
      isGuest: true,
      quotes: {
        used: _guestSessionExportCount,
        limit: GUEST_SESSION_LIMIT,
        unlimited: false,
      },
      projects: { used: 0, limit: 0, unlimited: false },
      apiCalls: { used: 0, limit: 0, unlimited: false },
      advancedCalcs: {
        used: _guestSessionAdvancedCalcCount,
        limit: GUEST_ADVANCED_CALC_LIMIT,
        unlimited: false,
      },
      marketReports: {
        used: _guestSessionMarketReportCount,
        limit: GUEST_MARKET_REPORT_LIMIT,
        unlimited: false,
      },
      daysRemaining: 0,
      status: 'none',
    };
  }

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
    isGuest: false,
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
    advancedCalcs: {
      used: usage.advancedCalcsThisMonth,
      limit: plan.limits.advancedCalcsPerMonth,
      unlimited: plan.limits.advancedCalcsPerMonth === -1,
    },
    marketReports: {
      used: usage.marketReportsThisMonth,
      limit: plan.limits.marketReportsPerMonth,
      unlimited: plan.limits.marketReportsPerMonth === -1,
    },
    daysRemaining,
    status: sub?.status || 'none',
  };
}

/**
 * Peek at remaining quota WITHOUT incrementing usage.
 * Use this for pre-flight checks (e.g., before showing export buttons).
 *
 * Guest: checks in-memory session counter (3 per session).
 * Authenticated: checks localStorage monthly counter against plan limits.
 *
 * ⚠️ NEVER use this to block previews/calculations — only for exports/saves.
 */
export function peekQuotaRemaining(type: 'quote' | 'project' | 'api'): { allowed: boolean; remaining: number; limit: number } {
  // Dev mode bypass — never block developers
  if (import.meta.env.DEV) return { allowed: true, remaining: 999, limit: -1 };

  // ── GUEST PATH (quote type only) ──
  if (type === 'quote' && !isUserAuthenticated()) {
    const remaining = Math.max(0, GUEST_SESSION_LIMIT - _guestSessionExportCount);
    return {
      allowed: remaining > 0,
      remaining,
      limit: GUEST_SESSION_LIMIT,
    };
  }

  // ── AUTHENTICATED PATH ──
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  const usage = getUsageTracking();

  // Admin/business bypass — always unlimited
  if (tier === 'business') return { allowed: true, remaining: -1, limit: -1 };

  let used: number;
  let limit: number;

  switch (type) {
    case 'quote':
      used = usage.quotesThisMonth;
      limit = plan.limits.quotesPerMonth;
      break;
    case 'project':
      used = usage.projectsCount;
      limit = plan.limits.savedProjects;
      break;
    case 'api':
      used = usage.apiCallsThisMonth;
      limit = plan.limits.apiCallsPerMonth;
      break;
  }

  if (limit === -1) return { allowed: true, remaining: -1, limit: -1 };

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
  };
}

/**
 * Reset monthly quota usage (admin/recovery function).
 * Call this to recover from bugs that burned quota slots.
 */
export function resetQuotaUsage(): void {
  const usage = getUsageTracking();
  usage.quotesThisMonth = 0;
  usage.apiCallsThisMonth = 0;
  usage.advancedCalcsThisMonth = 0;
  usage.marketReportsThisMonth = 0;
  _saveUsage(usage);
  if (import.meta.env.DEV) {
    console.log('[SubscriptionService] Quota usage reset to 0');
  }
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

  // Check advanced calc limit
  if (plan.limits.advancedCalcsPerMonth !== -1 && usage.advancedCalcsThisMonth >= plan.limits.advancedCalcsPerMonth) {
    const nextTier = TIER_ORDER[getTierRank(tier) + 1] as SubscriptionTier;
    return {
      shouldUpgrade: true,
      reason: `You've used all ${plan.limits.advancedCalcsPerMonth} advanced analyses this month`,
      recommendedTier: nextTier,
    };
  }

  // Check market report limit
  if (plan.limits.marketReportsPerMonth !== -1 && usage.marketReportsThisMonth >= plan.limits.marketReportsPerMonth) {
    const nextTier = TIER_ORDER[getTierRank(tier) + 1] as SubscriptionTier;
    return {
      shouldUpgrade: true,
      reason: `You've used all ${plan.limits.marketReportsPerMonth} market intelligence reports this month`,
      recommendedTier: nextTier,
    };
  }

  return { shouldUpgrade: false };
}

// ============================================================================
// Stripe Integration — Live Checkout via Supabase Edge Functions
// ============================================================================

/**
 * Create a Stripe Checkout Session via Edge Function.
 * Falls back to local trial if Edge Function is unavailable.
 */
export async function createCheckoutSession(
  tier: SubscriptionTier,
  billingCycle: 'monthly' | 'annual'
): Promise<{ url: string; sessionId: string }> {
  const plan = getPlan(tier);
  const priceId = billingCycle === 'monthly' ? plan.stripePriceIdMonthly : plan.stripePriceIdAnnual;

  if (!priceId) {
    // Free or Business tier — no Stripe checkout needed
    setSubscription(tier, billingCycle, 'trialing');
    return { url: '/wizard', sessionId: `local_${Date.now()}` };
  }

  // Get user info for Stripe pre-fill
  const userId = _getUserId();
  let email: string | undefined;
  try {
    const userData = localStorage.getItem('current_user');
    if (userData) {
      const user = JSON.parse(userData);
      email = user.email;
    }
  } catch { /* ignore */ }

  // Call Supabase Edge Function
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ priceId, userId, email }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          return { url: data.url, sessionId: data.sessionId };
        }
      }

      // Edge Function returned an error — log and fall through to local trial
      const errorData = await response.json().catch(() => ({}));
      console.warn('[createCheckoutSession] Edge Function error:', errorData);
    } catch (err) {
      console.warn('[createCheckoutSession] Edge Function unavailable, falling back to local trial:', err);
    }
  }

  // Fallback: local trial (pre-deployment or Edge Function down)
  console.info('[createCheckoutSession] Using local trial fallback for', tier, billingCycle);
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
    // ✅ FIX: Read 'current_user' — same key authService.ts uses
    const userData = localStorage.getItem('current_user');
    if (userData) {
      const parsed = JSON.parse(userData);
      // authService wraps in { user, sessionExpiry }
      const user = parsed.user || parsed;
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
    advancedCalcsThisMonth: 0,
    marketReportsThisMonth: 0,
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
  usage.advancedCalcsThisMonth = 0;
  usage.marketReportsThisMonth = 0;
  usage.lastResetDate = new Date().toISOString();
  _saveUsage(usage);
  return usage;
}

function _saveUsage(usage: UsageTracking): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
}

// ============================================================================
// Emergency Quota Recovery — callable from browser console
// Usage: window.__merlinResetQuota()
// ============================================================================
if (typeof window !== 'undefined') {
  (window as any).__merlinResetQuota = () => {
    resetQuotaUsage();
    console.info('[Merlin] ✅ All quota counters reset to 0. Refresh the page.');
  };
  (window as any).__merlinQuotaStatus = () => {
    const usage = getUsageTracking();
    const tier = getEffectiveTier();
    const plan = getPlan(tier);
    console.table({
      tier,
      quotesUsed: usage.quotesThisMonth,
      quotesLimit: plan.limits.quotesPerMonth,
      advancedCalcs: usage.advancedCalcsThisMonth,
      marketReports: usage.marketReportsThisMonth,
    });
  };
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

  // Auth detection
  isUserAuthenticated,

  // Subscription management
  getCurrentSubscription,
  getEffectiveTier,
  setSubscription,
  cancelSubscription,
  reactivateSubscription,

  // Usage tracking
  getUsageTracking,
  peekQuotaRemaining,
  peekFeatureQuota,
  resetQuotaUsage,
  trackQuoteGenerated,
  trackProjectSaved,
  trackApiCall,
  trackAdvancedCalc,
  trackMarketReport,
  canExport,
  getUsageSummary,
  getUpgradeRecommendation,

  // Stripe (stubs)
  createCheckoutSession,
  handleStripeWebhook,
};

export default subscriptionService;
