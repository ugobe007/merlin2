/**
 * QUOTA EXCEEDED BANNER
 * =====================
 * Supabase dark theme inline banner shown when user hits quota limits.
 * Stroke-only CTA button. Dismissible.
 *
 * Created: Feb 2026
 */

import React from 'react';
import { AlertTriangle, ArrowUpRight, X } from 'lucide-react';
import type { QuotaInfo } from '@/hooks/useQuotaEnforcement';

interface QuotaExceededBannerProps {
  quotaInfo: QuotaInfo;
  onDismiss: () => void;
  onUpgrade: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  quote: 'quote generation',
  project: 'project save',
  api: 'API call',
};

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  advanced: 'Advanced',
  business: 'Business',
};

const QuotaExceededBanner: React.FC<QuotaExceededBannerProps> = ({
  quotaInfo,
  onDismiss,
  onUpgrade,
}) => {
  const typeLabel = TYPE_LABELS[quotaInfo.type] || quotaInfo.type;
  const currentTierLabel = TIER_LABELS[quotaInfo.tier] || quotaInfo.tier;
  const recommendedLabel = quotaInfo.recommendedTier
    ? TIER_LABELS[quotaInfo.recommendedTier]
    : 'Pro';

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-amber-300">
            {quotaInfo.type === 'quote' ? 'Quote' : quotaInfo.type === 'project' ? 'Project' : 'API'} Limit Reached
          </h4>
          <p className="text-xs text-amber-200/70 mt-1">
            You&apos;ve used all {quotaInfo.limit} {typeLabel}s on your {currentTierLabel} plan this month.
            {quotaInfo.upgradeReason && (
              <span className="block mt-1 text-white/50">{quotaInfo.upgradeReason}</span>
            )}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={onUpgrade}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all"
            >
              Upgrade to {recommendedLabel}
              <ArrowUpRight className="w-3 h-3" />
            </button>
            <button
              onClick={onDismiss}
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Compact inline version (for tight spaces like wizard panels).
 */
export const QuotaExceededInline: React.FC<{
  quotaInfo: QuotaInfo;
  onUpgrade: () => void;
}> = ({ quotaInfo, onUpgrade }) => {
  const currentTierLabel = TIER_LABELS[quotaInfo.tier] || quotaInfo.tier;
  const recommendedLabel = quotaInfo.recommendedTier
    ? TIER_LABELS[quotaInfo.recommendedTier]
    : 'Pro';

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-amber-500/20 bg-amber-500/[0.04] text-xs">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
      <span className="text-amber-200/70">
        {quotaInfo.limit}/{quotaInfo.limit} quotes used ({currentTierLabel})
      </span>
      <button
        onClick={onUpgrade}
        className="ml-auto text-emerald-400 hover:text-emerald-300 font-semibold whitespace-nowrap"
      >
        Upgrade to {recommendedLabel} →
      </button>
    </div>
  );
};

export default QuotaExceededBanner;
