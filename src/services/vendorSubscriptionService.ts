/**
 * VENDOR SUBSCRIPTION SERVICE
 * ============================
 * Manages vendor-specific subscriptions, equipment access,
 * pricing feed quotas, bid positioning, and API integrations.
 *
 * Vendor Tiers:
 *   - Starter ($29/mo)  — List equipment, basic analytics, 1 category
 *   - Pro ($99/mo)      — Full catalog, priority positioning, webhooks, 3 categories
 *   - Enterprise (custom) — Unlimited, white-label API, dedicated support
 *
 * Created: Feb 2026
 */

// ============================================================================
// Vendor Tier Types
// ============================================================================

export type VendorTier = 'vendor_starter' | 'vendor_pro' | 'vendor_enterprise';

export interface VendorPlan {
  id: string;
  tier: VendorTier;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  features: string[];
  limits: VendorLimits;
  badge?: string;
}

export interface VendorLimits {
  equipmentCategories: number;        // How many equipment categories (1, 3, unlimited)
  productsPerCategory: number;        // Products listed per category
  pricingFeedUpdatesPerMonth: number; // How often they can push pricing data
  apiCallsPerMonth: number;           // API access
  rfqResponsesPerMonth: number;       // RFQ auto-responses
  webhooks: number;                   // Webhook endpoints
  teamMembers: number;                // Vendor team size
  analyticsRetentionDays: number;     // How far back analytics go
}

export interface VendorSubscription {
  id: string;
  vendorId: string;
  companyName: string;
  tier: VendorTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd: boolean;
  enabledCategories: EquipmentCategory[]; // Which categories they've activated
  createdAt: string;
  updatedAt: string;
}

export type EquipmentCategory =
  | 'bess'
  | 'solar'
  | 'wind'
  | 'inverters'
  | 'transformers'
  | 'generators'
  | 'ev_chargers'
  | 'bos'           // Balance of System
  | 'nuclear_smr';

export interface VendorUsageTracking {
  pricingFeedUpdates: number;
  apiCalls: number;
  rfqResponses: number;
  impressions: number;           // How many times listed in quotes
  clickThroughs: number;         // How many times user clicked vendor link
  quoteInclusions: number;       // How many quotes include this vendor
  lastResetDate: string;
}

export interface VendorAnalytics {
  period: string; // "2026-02"
  impressions: number;
  clickThroughs: number;
  quoteInclusions: number;
  rfqsReceived: number;
  conversionRate: number;      // clickThroughs / impressions
  averageQuoteSize: number;    // Average $ value of quotes they appear in
  topCategories: Array<{ category: EquipmentCategory; count: number }>;
  competitorComparison?: {
    priceRank: number;         // 1 = cheapest among vendors
    totalVendors: number;
  };
}

// ============================================================================
// Vendor Plan Definitions
// ============================================================================

export const VENDOR_PLANS: Record<VendorTier, VendorPlan> = {
  vendor_starter: {
    id: 'vplan_starter',
    tier: 'vendor_starter',
    name: 'Vendor Starter',
    priceMonthly: 29,
    priceAnnual: 290,
    description: 'List your equipment, appear in quotes, and reach BESS buyers.',
    features: [
      '1 equipment category',
      '25 products listed',
      'Appear in Merlin quotes',
      'Basic analytics dashboard',
      'Pricing feed (10 updates/mo)',
      'Email support',
    ],
    limits: {
      equipmentCategories: 1,
      productsPerCategory: 25,
      pricingFeedUpdatesPerMonth: 10,
      apiCallsPerMonth: 100,
      rfqResponsesPerMonth: 5,
      webhooks: 1,
      teamMembers: 1,
      analyticsRetentionDays: 30,
    },
    badge: undefined,
  },
  vendor_pro: {
    id: 'vplan_pro',
    tier: 'vendor_pro',
    name: 'Vendor Pro',
    priceMonthly: 99,
    priceAnnual: 990,
    description: 'Full catalog, priority positioning, and advanced integrations.',
    features: [
      '3 equipment categories',
      '100 products per category',
      'Priority positioning in quotes',
      'Full analytics + competitor insights',
      'Pricing feed (unlimited updates)',
      'Webhook notifications',
      'RFQ auto-response (25/mo)',
      'RESTful API access',
      '3 team members',
      'Priority support',
    ],
    limits: {
      equipmentCategories: 3,
      productsPerCategory: 100,
      pricingFeedUpdatesPerMonth: -1, // Unlimited
      apiCallsPerMonth: 5000,
      rfqResponsesPerMonth: 25,
      webhooks: 5,
      teamMembers: 3,
      analyticsRetentionDays: 90,
    },
    badge: 'Most Popular',
  },
  vendor_enterprise: {
    id: 'vplan_enterprise',
    tier: 'vendor_enterprise',
    name: 'Vendor Enterprise',
    priceMonthly: -1, // Custom
    priceAnnual: -1,
    description: 'Unlimited access with dedicated support and white-label API.',
    features: [
      'All 9 equipment categories',
      'Unlimited products',
      'Featured vendor positioning',
      'Full analytics + market intelligence',
      'Unlimited pricing feed updates',
      'Unlimited webhooks',
      'Unlimited RFQ auto-responses',
      'Full API access (unlimited)',
      'Unlimited team members',
      'White-label API for your platform',
      'Dedicated account manager',
      'Custom integrations',
      'Quarterly business reviews',
    ],
    limits: {
      equipmentCategories: -1, // All 9
      productsPerCategory: -1, // Unlimited
      pricingFeedUpdatesPerMonth: -1,
      apiCallsPerMonth: -1,
      rfqResponsesPerMonth: -1,
      webhooks: -1,
      teamMembers: -1,
      analyticsRetentionDays: 365,
    },
    badge: undefined,
  },
};

// ============================================================================
// Equipment Categories Metadata
// ============================================================================

export const EQUIPMENT_CATEGORIES_META: Record<EquipmentCategory, {
  name: string;
  icon: string;
  description: string;
  exampleBrands: string[];
}> = {
  bess: {
    name: 'Battery Energy Storage',
    icon: '🔋',
    description: 'Lithium-ion, flow batteries, sodium-ion, and other storage technologies',
    exampleBrands: ['CATL', 'BYD', 'Tesla', 'Samsung SDI', 'LG Energy'],
  },
  solar: {
    name: 'Solar Panels & Modules',
    icon: '☀️',
    description: 'Monocrystalline, bifacial, thin-film panels and racking systems',
    exampleBrands: ['LONGi', 'JinkoSolar', 'Canadian Solar', 'First Solar', 'Trina Solar'],
  },
  wind: {
    name: 'Wind Turbines',
    icon: '💨',
    description: 'Small, medium, and utility-scale wind turbine systems',
    exampleBrands: ['Vestas', 'Siemens Gamesa', 'GE Renewable', 'Goldwind'],
  },
  inverters: {
    name: 'Inverters & PCS',
    icon: '⚡',
    description: 'String inverters, central inverters, and power conversion systems',
    exampleBrands: ['SMA', 'Sungrow', 'Huawei', 'Enphase', 'SolarEdge'],
  },
  transformers: {
    name: 'Transformers',
    icon: '🔌',
    description: 'Medium-voltage transformers, pad-mounted, and distribution transformers',
    exampleBrands: ['ABB', 'Siemens', 'Eaton', 'Schneider Electric'],
  },
  generators: {
    name: 'Generators',
    icon: '🏭',
    description: 'Natural gas, diesel, dual-fuel, and linear generators',
    exampleBrands: ['Caterpillar', 'Cummins', 'Mainspring', 'Generac', 'Kohler'],
  },
  ev_chargers: {
    name: 'EV Chargers',
    icon: '🚗',
    description: 'Level 2, DCFC, and HPC charging stations',
    exampleBrands: ['ChargePoint', 'ABB', 'Tritium', 'BTC Power', 'Blink'],
  },
  bos: {
    name: 'Balance of System',
    icon: '🔧',
    description: 'Switchgear, panels, conduit, wiring, racking, and enclosures',
    exampleBrands: ['Eaton', 'Schneider', 'Siemens', 'Panduit'],
  },
  nuclear_smr: {
    name: 'Nuclear / SMR',
    icon: '⚛️',
    description: 'Small modular reactors and nuclear microreactor systems',
    exampleBrands: ['NuScale', 'X-energy', 'Kairos Power', 'TerraPower'],
  },
};

// ============================================================================
// Vendor Tier Ordering
// ============================================================================

const VENDOR_TIER_ORDER: VendorTier[] = ['vendor_starter', 'vendor_pro', 'vendor_enterprise'];

export function getVendorTierRank(tier: VendorTier): number {
  return VENDOR_TIER_ORDER.indexOf(tier);
}

export function isVendorUpgrade(from: VendorTier, to: VendorTier): boolean {
  return getVendorTierRank(to) > getVendorTierRank(from);
}

// ============================================================================
// Vendor Subscription Management
// ============================================================================

const VENDOR_STORAGE_KEY = 'merlin_vendor_subscription';
const VENDOR_USAGE_KEY = 'merlin_vendor_usage';

/**
 * Get current vendor subscription
 */
export function getVendorSubscription(): VendorSubscription | null {
  try {
    const stored = localStorage.getItem(VENDOR_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as VendorSubscription;
  } catch {
    return null;
  }
}

/**
 * Get the effective vendor tier
 */
export function getEffectiveVendorTier(): VendorTier | null {
  const sub = getVendorSubscription();
  if (!sub) return null;
  if (sub.status === 'active' || sub.status === 'trialing') return sub.tier;
  return null;
}

/**
 * Get vendor plan details
 */
export function getVendorPlan(tier: VendorTier): VendorPlan {
  return VENDOR_PLANS[tier];
}

/**
 * Get all vendor plans
 */
export function getAllVendorPlans(): VendorPlan[] {
  return VENDOR_TIER_ORDER.map((tier) => VENDOR_PLANS[tier]);
}

/**
 * Create or update a vendor subscription
 */
export function setVendorSubscription(
  vendorId: string,
  companyName: string,
  tier: VendorTier,
  billingCycle: 'monthly' | 'annual' = 'monthly',
  categories: EquipmentCategory[] = [],
  status: VendorSubscription['status'] = 'trialing'
): VendorSubscription {
  const now = new Date();
  const periodEnd = new Date(now);

  if (status === 'trialing') {
    periodEnd.setDate(periodEnd.getDate() + 14); // 14-day trial
  } else if (billingCycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // Validate category count
  const plan = VENDOR_PLANS[tier];
  const maxCats = plan.limits.equipmentCategories;
  const enabledCategories = maxCats === -1 ? categories : categories.slice(0, maxCats);

  const subscription: VendorSubscription = {
    id: `vsub_${Date.now()}`,
    vendorId,
    companyName,
    tier,
    status,
    billingCycle,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    cancelAtPeriodEnd: false,
    enabledCategories,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(subscription));
  return subscription;
}

/**
 * Cancel vendor subscription
 */
export function cancelVendorSubscription(): VendorSubscription | null {
  const sub = getVendorSubscription();
  if (!sub) return null;

  sub.cancelAtPeriodEnd = true;
  sub.updatedAt = new Date().toISOString();
  localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(sub));
  return sub;
}

/**
 * Check if vendor can list in a specific equipment category
 */
export function canListInCategory(category: EquipmentCategory): boolean {
  const sub = getVendorSubscription();
  if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) return false;

  const plan = VENDOR_PLANS[sub.tier];
  if (plan.limits.equipmentCategories === -1) return true; // Unlimited

  return sub.enabledCategories.includes(category);
}

/**
 * Add an equipment category to subscription
 */
export function addCategory(category: EquipmentCategory): {
  success: boolean;
  error?: string;
} {
  const sub = getVendorSubscription();
  if (!sub) return { success: false, error: 'No active subscription' };

  const plan = VENDOR_PLANS[sub.tier];
  const limit = plan.limits.equipmentCategories;

  if (limit !== -1 && sub.enabledCategories.length >= limit) {
    return {
      success: false,
      error: `Your ${plan.name} plan supports ${limit} equipment categor${limit === 1 ? 'y' : 'ies'}. Upgrade to add more.`,
    };
  }

  if (sub.enabledCategories.includes(category)) {
    return { success: false, error: 'Category already enabled' };
  }

  sub.enabledCategories.push(category);
  sub.updatedAt = new Date().toISOString();
  localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(sub));
  return { success: true };
}

// ============================================================================
// Vendor Usage Tracking
// ============================================================================

/**
 * Get vendor usage for current period
 */
export function getVendorUsage(): VendorUsageTracking {
  try {
    const stored = localStorage.getItem(VENDOR_USAGE_KEY);
    if (stored) {
      const usage = JSON.parse(stored) as VendorUsageTracking;
      if (_isNewMonth(usage.lastResetDate)) {
        return _resetVendorUsage(usage);
      }
      return usage;
    }
  } catch {
    // Fall through
  }
  return _createDefaultVendorUsage();
}

/**
 * Track a pricing feed update
 */
export function trackPricingFeedUpdate(): { allowed: boolean; remaining: number } {
  const tier = getEffectiveVendorTier();
  if (!tier) return { allowed: false, remaining: 0 };

  const plan = VENDOR_PLANS[tier];
  const usage = getVendorUsage();
  const limit = plan.limits.pricingFeedUpdatesPerMonth;

  if (limit === -1) {
    usage.pricingFeedUpdates++;
    _saveVendorUsage(usage);
    return { allowed: true, remaining: -1 };
  }

  if (usage.pricingFeedUpdates >= limit) {
    return { allowed: false, remaining: 0 };
  }

  usage.pricingFeedUpdates++;
  _saveVendorUsage(usage);
  return { allowed: true, remaining: limit - usage.pricingFeedUpdates };
}

/**
 * Track a vendor API call
 */
export function trackVendorApiCall(): { allowed: boolean; remaining: number } {
  const tier = getEffectiveVendorTier();
  if (!tier) return { allowed: false, remaining: 0 };

  const plan = VENDOR_PLANS[tier];
  const usage = getVendorUsage();
  const limit = plan.limits.apiCallsPerMonth;

  if (limit === -1) {
    usage.apiCalls++;
    _saveVendorUsage(usage);
    return { allowed: true, remaining: -1 };
  }

  if (usage.apiCalls >= limit) {
    return { allowed: false, remaining: 0 };
  }

  usage.apiCalls++;
  _saveVendorUsage(usage);
  return { allowed: true, remaining: limit - usage.apiCalls };
}

/**
 * Track an RFQ response
 */
export function trackRfqResponse(): { allowed: boolean; remaining: number } {
  const tier = getEffectiveVendorTier();
  if (!tier) return { allowed: false, remaining: 0 };

  const plan = VENDOR_PLANS[tier];
  const usage = getVendorUsage();
  const limit = plan.limits.rfqResponsesPerMonth;

  if (limit === -1) {
    usage.rfqResponses++;
    _saveVendorUsage(usage);
    return { allowed: true, remaining: -1 };
  }

  if (usage.rfqResponses >= limit) {
    return { allowed: false, remaining: 0 };
  }

  usage.rfqResponses++;
  _saveVendorUsage(usage);
  return { allowed: true, remaining: limit - usage.rfqResponses };
}

/**
 * Track a vendor impression (vendor appeared in a quote)
 */
export function trackImpression(): void {
  const usage = getVendorUsage();
  usage.impressions++;
  _saveVendorUsage(usage);
}

/**
 * Track a click-through (user clicked vendor link)
 */
export function trackClickThrough(): void {
  const usage = getVendorUsage();
  usage.clickThroughs++;
  _saveVendorUsage(usage);
}

/**
 * Get vendor analytics summary
 */
export function getVendorAnalytics(): VendorAnalytics | null {
  const sub = getVendorSubscription();
  if (!sub) return null;

  const usage = getVendorUsage();
  const now = new Date();

  return {
    period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    impressions: usage.impressions,
    clickThroughs: usage.clickThroughs,
    quoteInclusions: usage.quoteInclusions,
    rfqsReceived: usage.rfqResponses,
    conversionRate: usage.impressions > 0 ? usage.clickThroughs / usage.impressions : 0,
    averageQuoteSize: 0, // TODO: Calculate from actual quote data
    topCategories: sub.enabledCategories.map((cat) => ({ category: cat, count: 0 })),
  };
}

/**
 * Get vendor usage summary for display
 */
export function getVendorUsageSummary(): {
  tier: VendorTier;
  planName: string;
  categories: { used: number; limit: number; unlimited: boolean; enabled: EquipmentCategory[] };
  pricingUpdates: { used: number; limit: number; unlimited: boolean };
  apiCalls: { used: number; limit: number; unlimited: boolean };
  rfqResponses: { used: number; limit: number; unlimited: boolean };
  impressions: number;
  clickThroughs: number;
  conversionRate: string;
  daysRemaining: number;
  status: VendorSubscription['status'] | 'none';
} {
  const sub = getVendorSubscription();
  if (!sub) {
    return {
      tier: 'vendor_starter',
      planName: 'No Subscription',
      categories: { used: 0, limit: 0, unlimited: false, enabled: [] },
      pricingUpdates: { used: 0, limit: 0, unlimited: false },
      apiCalls: { used: 0, limit: 0, unlimited: false },
      rfqResponses: { used: 0, limit: 0, unlimited: false },
      impressions: 0,
      clickThroughs: 0,
      conversionRate: '0%',
      daysRemaining: 0,
      status: 'none',
    };
  }

  const plan = VENDOR_PLANS[sub.tier];
  const usage = getVendorUsage();
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000)
  );

  return {
    tier: sub.tier,
    planName: plan.name,
    categories: {
      used: sub.enabledCategories.length,
      limit: plan.limits.equipmentCategories,
      unlimited: plan.limits.equipmentCategories === -1,
      enabled: sub.enabledCategories,
    },
    pricingUpdates: {
      used: usage.pricingFeedUpdates,
      limit: plan.limits.pricingFeedUpdatesPerMonth,
      unlimited: plan.limits.pricingFeedUpdatesPerMonth === -1,
    },
    apiCalls: {
      used: usage.apiCalls,
      limit: plan.limits.apiCallsPerMonth,
      unlimited: plan.limits.apiCallsPerMonth === -1,
    },
    rfqResponses: {
      used: usage.rfqResponses,
      limit: plan.limits.rfqResponsesPerMonth,
      unlimited: plan.limits.rfqResponsesPerMonth === -1,
    },
    impressions: usage.impressions,
    clickThroughs: usage.clickThroughs,
    conversionRate:
      usage.impressions > 0
        ? `${((usage.clickThroughs / usage.impressions) * 100).toFixed(1)}%`
        : '0%',
    daysRemaining,
    status: sub.status,
  };
}

// ============================================================================
// Positioning & Visibility Logic
// ============================================================================

/**
 * Get vendor's positioning rank for a given equipment category
 * Higher tiers get priority positioning in quotes
 */
export function getPositioningPriority(tier: VendorTier): number {
  switch (tier) {
    case 'vendor_enterprise':
      return 1; // Featured - always shown first
    case 'vendor_pro':
      return 2; // Priority - shown above starter
    case 'vendor_starter':
      return 3; // Standard - shown in alphabetical order
    default:
      return 99;
  }
}

/**
 * Check if vendor gets the "Featured" badge on quotes
 */
export function isFeaturedVendor(tier: VendorTier): boolean {
  return tier === 'vendor_enterprise';
}

/**
 * Check if vendor gets priority positioning
 */
export function hasPriorityPositioning(tier: VendorTier): boolean {
  return tier === 'vendor_pro' || tier === 'vendor_enterprise';
}

// ============================================================================
// Internal Helpers
// ============================================================================

function _isNewMonth(lastReset: string): boolean {
  const last = new Date(lastReset);
  const now = new Date();
  return last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear();
}

function _createDefaultVendorUsage(): VendorUsageTracking {
  const usage: VendorUsageTracking = {
    pricingFeedUpdates: 0,
    apiCalls: 0,
    rfqResponses: 0,
    impressions: 0,
    clickThroughs: 0,
    quoteInclusions: 0,
    lastResetDate: new Date().toISOString(),
  };
  _saveVendorUsage(usage);
  return usage;
}

function _resetVendorUsage(usage: VendorUsageTracking): VendorUsageTracking {
  usage.pricingFeedUpdates = 0;
  usage.apiCalls = 0;
  usage.rfqResponses = 0;
  // Don't reset cumulative metrics (impressions, clicks, quote inclusions)
  usage.lastResetDate = new Date().toISOString();
  _saveVendorUsage(usage);
  return usage;
}

function _saveVendorUsage(usage: VendorUsageTracking): void {
  localStorage.setItem(VENDOR_USAGE_KEY, JSON.stringify(usage));
}

// ============================================================================
// Export Service Object
// ============================================================================

export const vendorSubscriptionService = {
  // Plan data
  VENDOR_PLANS,
  EQUIPMENT_CATEGORIES_META,
  getVendorPlan,
  getAllVendorPlans,
  getVendorTierRank,
  isVendorUpgrade,

  // Subscription management
  getVendorSubscription,
  getEffectiveVendorTier,
  setVendorSubscription,
  cancelVendorSubscription,

  // Category management
  canListInCategory,
  addCategory,

  // Usage tracking
  getVendorUsage,
  trackPricingFeedUpdate,
  trackVendorApiCall,
  trackRfqResponse,
  trackImpression,
  trackClickThrough,
  getVendorUsageSummary,
  getVendorAnalytics,

  // Positioning
  getPositioningPriority,
  isFeaturedVendor,
  hasPriorityPositioning,
};

export default vendorSubscriptionService;
