/**
 * FEATURE GATE SERVICE
 * ====================
 * Thin wrappers that enforce subscription limits around premium features.
 *
 * ┌────────────────────┐
 * │  Component calls    │
 * │  gatedMonteCarlo()  │
 * └────────┬───────────┘
 *          │ peekFeatureQuota → trackAdvancedCalc → actual service
 *          ▼
 * ┌────────────────────────────────────────────────┐
 * │  subscriptionService  │  monteCarloService      │
 * └────────────────────────────────────────────────┘
 *
 * Created: Feb 2026
 */

import {
  trackAdvancedCalc,
  trackMarketReport,
  peekFeatureQuota,
  getEffectiveTier,
  getPlan,
} from '@/services/subscriptionService';

// ============================================================================
// Types
// ============================================================================

export interface GateResult<T> {
  /** Whether the feature was allowed to execute */
  allowed: boolean;
  /** The feature result (undefined if gated out) */
  data?: T;
  /** Remaining quota after this call (-1 = unlimited) */
  remaining: number;
  /** Plan limit for this feature (-1 = unlimited) */
  limit: number;
  /** If gated, the recommended upgrade tier */
  upgradeTier?: string;
  /** Human-readable denial reason */
  reason?: string;
}

// ============================================================================
// Advanced Calculation Gates
// ============================================================================

/**
 * Gated wrapper for any advanced calculation (Monte Carlo, 8760, sensitivity).
 *
 * Usage:
 * ```ts
 * const result = await gatedAdvancedCalc(() => runMonteCarloSimulation(input));
 * if (!result.allowed) showUpgradePrompt(result.reason);
 * else displayResults(result.data);
 * ```
 */
export async function gatedAdvancedCalc<T>(
  fn: () => T | Promise<T>
): Promise<GateResult<T>> {
  const quota = trackAdvancedCalc();

  if (!quota.allowed) {
    const tier = getEffectiveTier();
    const nextTier = tier === 'starter' ? 'pro' : tier === 'pro' ? 'advanced' : undefined;
    return {
      allowed: false,
      remaining: 0,
      limit: quota.limit,
      upgradeTier: nextTier,
      reason: `You've used all ${quota.limit} advanced analyses this month. Upgrade to ${nextTier === 'pro' ? 'Pro' : 'Advanced'} for more.`,
    };
  }

  const data = await fn();
  return {
    allowed: true,
    data,
    remaining: quota.remaining,
    limit: quota.limit,
  };
}

/**
 * Pre-flight check for advanced calcs (doesn't consume quota).
 */
export function canRunAdvancedCalc(): {
  allowed: boolean;
  remaining: number;
  limit: number;
  tierName: string;
} {
  const peek = peekFeatureQuota('advancedCalc');
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  return { ...peek, tierName: plan.name };
}

// ============================================================================
// Market Report Gates
// ============================================================================

/**
 * Gated wrapper for market intelligence report generation.
 *
 * Usage:
 * ```ts
 * const result = await gatedMarketReport(() => getMarketOverview());
 * if (!result.allowed) showUpgradePrompt(result.reason);
 * else displayReport(result.data);
 * ```
 */
export async function gatedMarketReport<T>(
  fn: () => T | Promise<T>
): Promise<GateResult<T>> {
  const quota = trackMarketReport();

  if (!quota.allowed) {
    const tier = getEffectiveTier();
    const nextTier = tier === 'starter' ? 'pro' : tier === 'pro' ? 'advanced' : undefined;
    return {
      allowed: false,
      remaining: 0,
      limit: quota.limit,
      upgradeTier: nextTier,
      reason: `You've used all ${quota.limit} market reports this month. Upgrade to ${nextTier === 'pro' ? 'Pro' : 'Advanced'} for more.`,
    };
  }

  const data = await fn();
  return {
    allowed: true,
    data,
    remaining: quota.remaining,
    limit: quota.limit,
  };
}

/**
 * Pre-flight check for market reports (doesn't consume quota).
 */
export function canRunMarketReport(): {
  allowed: boolean;
  remaining: number;
  limit: number;
  tierName: string;
} {
  const peek = peekFeatureQuota('marketReport');
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  return { ...peek, tierName: plan.name };
}

// ============================================================================
// Feature availability by tier (for UI display)
// ============================================================================

export interface FeatureAvailability {
  monteCarlo: boolean;
  hourly8760: boolean;
  sensitivity: boolean;
  degradation: boolean;
  dynamicITC: boolean;
  marketIntelligence: boolean;
  brandKit: boolean;
  templateStudio: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
}

/**
 * Returns which features are available on the current tier.
 * Use for toggling UI elements (show/hide/tease).
 */
export function getFeatureAvailability(): FeatureAvailability {
  const tier = getEffectiveTier();

  return {
    // Advanced calcs — available on all tiers (quota-gated)
    monteCarlo: true,       // gated by advancedCalcsPerMonth
    hourly8760: true,       // gated by advancedCalcsPerMonth
    sensitivity: true,      // gated by advancedCalcsPerMonth
    degradation: true,      // gated by advancedCalcsPerMonth

    // Dynamic ITC — available on all tiers (informational, no gate)
    dynamicITC: true,

    // Market intelligence — available on all tiers (quota-gated)
    marketIntelligence: true, // gated by marketReportsPerMonth

    // Brand Kit — Pro and above
    brandKit: tier !== 'free' && tier !== 'starter',

    // Template Studio — Advanced and above
    templateStudio: tier === 'advanced' || tier === 'business',

    // White-label — Advanced and above
    whiteLabel: tier === 'advanced' || tier === 'business',

    // API access — Pro and above (0 calls on free/starter)
    apiAccess: tier !== 'free' && tier !== 'starter',
  };
}

export default {
  gatedAdvancedCalc,
  gatedMarketReport,
  canRunAdvancedCalc,
  canRunMarketReport,
  getFeatureAvailability,
};
