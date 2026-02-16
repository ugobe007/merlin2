/**
 * QUOTA ENFORCEMENT HOOK
 * ======================
 * Reusable hook for checking and enforcing subscription quotas
 * before quote generation, project saves, and exports.
 *
 * Usage:
 *   const { checkQuota, quotaExceeded, quotaInfo, dismissQuotaWarning } = useQuotaEnforcement();
 *   
 *   // Before generating a quote:
 *   const allowed = checkQuota('quote');
 *   if (!allowed) return; // quotaExceeded is now true, UI shows upgrade prompt
 *
 * Created: Feb 2026
 */

import { useState, useCallback } from 'react';
import {
  trackQuoteGenerated,
  trackProjectSaved,
  trackApiCall,
  getEffectiveTier,
  getUsageSummary,
  getUpgradeRecommendation,
} from '@/services/subscriptionService';
import type { SubscriptionTier } from '@/types/commerce';

export interface QuotaInfo {
  type: 'quote' | 'project' | 'api';
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: SubscriptionTier;
  upgradeReason?: string;
  recommendedTier?: SubscriptionTier;
}

export function useQuotaEnforcement() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);

  /**
   * Check and track quota usage. Returns true if allowed, false if blocked.
   */
  const checkQuota = useCallback((type: 'quote' | 'project' | 'api'): boolean => {
    const tier = getEffectiveTier();
    let result: { allowed: boolean; remaining: number; limit: number };

    switch (type) {
      case 'quote':
        result = trackQuoteGenerated();
        break;
      case 'project':
        result = trackProjectSaved();
        break;
      case 'api':
        result = trackApiCall();
        break;
    }

    if (!result.allowed) {
      const recommendation = getUpgradeRecommendation();
      setQuotaInfo({
        type,
        allowed: false,
        remaining: result.remaining,
        limit: result.limit,
        tier,
        upgradeReason: recommendation.reason,
        recommendedTier: recommendation.recommendedTier,
      });
      setQuotaExceeded(true);
      return false;
    }

    // Allowed — update info but don't block
    setQuotaInfo({
      type,
      allowed: true,
      remaining: result.remaining,
      limit: result.limit,
      tier,
    });
    return true;
  }, []);

  /**
   * Peek at remaining quota without consuming it.
   */
  const peekQuota = useCallback(() => {
    return getUsageSummary();
  }, []);

  /**
   * Dismiss the quota exceeded warning.
   */
  const dismissQuotaWarning = useCallback(() => {
    setQuotaExceeded(false);
    setQuotaInfo(null);
  }, []);

  return {
    checkQuota,
    peekQuota,
    quotaExceeded,
    quotaInfo,
    dismissQuotaWarning,
  };
}

/**
 * Standalone (non-hook) quota check for use outside React components.
 * Returns { allowed, remaining, limit, tier } without setting state.
 */
export function checkQuotaStandalone(type: 'quote' | 'project' | 'api'): QuotaInfo {
  const tier = getEffectiveTier();
  let result: { allowed: boolean; remaining: number; limit: number };

  switch (type) {
    case 'quote':
      result = trackQuoteGenerated();
      break;
    case 'project':
      result = trackProjectSaved();
      break;
    case 'api':
      result = trackApiCall();
      break;
  }

  if (!result.allowed) {
    const recommendation = getUpgradeRecommendation();
    return {
      type,
      allowed: false,
      remaining: result.remaining,
      limit: result.limit,
      tier,
      upgradeReason: recommendation.reason,
      recommendedTier: recommendation.recommendedTier,
    };
  }

  return {
    type,
    allowed: true,
    remaining: result.remaining,
    limit: result.limit,
    tier,
  };
}

export default useQuotaEnforcement;
