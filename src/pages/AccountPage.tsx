/**
 * ACCOUNT PAGE — User subscription, usage, and billing management
 * ================================================================
 * Route: /account
 * 
 * Shows current plan, usage meters, upgrade/downgrade, cancel/reactivate.
 * Same dark theme as PricingPage for consistency.
 * Created: Feb 17, 2026
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Crown, Zap, Building2, Rocket, User,
  BarChart3, FileText, Shield, AlertTriangle, Check,
  ChevronRight, RefreshCw, XCircle, CheckCircle2,
  Loader2, Settings, CreditCard, Calendar, Clock,
  TrendingUp, Sparkles, Download, Star, Activity,
} from 'lucide-react';
import merlinIcon from '@/assets/images/new_small_profile_.png';
import {
  getEffectiveTier,
  getUsageSummary,
  getCurrentSubscription,
  getPlan,
  getAllPlans,
  cancelSubscription,
  reactivateSubscription,
  getUpgradeRecommendation,
} from '@/services/subscriptionService';
import { authService } from '@/services/authService';
import type { SubscriptionTier } from '@/types/commerce';

// ============================================================================
// Constants
// ============================================================================

const TIER_ICONS: Record<SubscriptionTier, React.ElementType> = {
  free: User,
  starter: Zap,
  pro: Crown,
  advanced: Building2,
  business: Rocket,
};

const TIER_COLORS: Record<SubscriptionTier, { text: string; bg: string; border: string; ring: string }> = {
  free:     { text: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20',   ring: 'ring-green-500/30' },
  starter:  { text: 'text-slate-300',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   ring: 'ring-slate-500/30' },
  pro:      { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', ring: 'ring-emerald-500/30' },
  advanced: { text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    ring: 'ring-cyan-500/30' },
  business: { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    ring: 'ring-blue-500/30' },
};

const TIER_NAMES: Record<SubscriptionTier, string> = {
  free: 'Free',
  starter: 'Builder',
  pro: 'Pro',
  advanced: 'Advanced',
  business: 'Business',
};

// ============================================================================
// Usage Meter Component
// ============================================================================

function UsageMeter({ label, used, limit, unlimited, icon: Icon }: {
  label: string;
  used: number;
  limit: number;
  unlimited: boolean;
  icon: React.ElementType;
}) {
  const pct = unlimited ? 0 : limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const isNearLimit = !unlimited && limit > 0 && pct >= 80;
  const isAtLimit = !unlimited && limit > 0 && used >= limit;

  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-4 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/[0.06]">
            <Icon className="w-4 h-4 text-white/60" />
          </div>
          <span className="text-sm font-medium text-white/80">{label}</span>
        </div>
        <span className={`text-sm font-mono ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-white/50'}`}>
          {unlimited ? '∞' : `${used} / ${limit}`}
        </span>
      </div>

      {!unlimited && limit > 0 && (
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {unlimited && (
        <div className="flex items-center gap-1 text-xs text-emerald-400/70">
          <Sparkles className="w-3 h-3" />
          Unlimited
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Account Page
// ============================================================================

export default function AccountPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [, setRefresh] = useState(0); // force re-render after actions

  const user = authService.getCurrentUser();
  const tier = getEffectiveTier();
  const usage = getUsageSummary();
  const sub = getCurrentSubscription();
  const plan = getPlan(tier);
  const recommendation = getUpgradeRecommendation();
  const TierIcon = TIER_ICONS[tier];
  const colors = TIER_COLORS[tier];

  // Clear action messages after 4s
  useEffect(() => {
    if (actionMessage) {
      const t = setTimeout(() => setActionMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionMessage]);

  const handleCancel = () => {
    const result = cancelSubscription();
    if (result) {
      setActionMessage({ type: 'success', text: 'Subscription will cancel at end of billing period.' });
      setCancelConfirm(false);
      setRefresh(n => n + 1);
    } else {
      setActionMessage({ type: 'error', text: 'Failed to cancel. Please contact support.' });
    }
  };

  const handleReactivate = () => {
    const result = reactivateSubscription();
    if (result) {
      setActionMessage({ type: 'success', text: 'Subscription reactivated!' });
      setRefresh(n => n + 1);
    } else {
      setActionMessage({ type: 'error', text: 'Failed to reactivate. Please contact support.' });
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return { text: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'trialing': return { text: 'Trial', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      case 'past_due': return { text: 'Past Due', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
      case 'canceled': return { text: 'Canceled', color: 'text-white/40 bg-white/[0.04] border-white/[0.08]' };
      case 'paused': return { text: 'Paused', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      default: return { text: 'Free', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
    }
  };

  const status = statusLabel(usage.status === 'none' ? 'free' : usage.status);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0f1117]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <img src={merlinIcon} alt="Merlin" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-lg">Merlin</span>
            </a>
          </div>
          <div className="flex items-center gap-6">
            <a href="/wizard" className="text-sm text-white/50 hover:text-white transition-colors">Wizard</a>
            <a href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</a>
            <a href="/support" className="text-sm text-white/50 hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Action Messages */}
        {actionMessage && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span className="text-sm">{actionMessage.text}</span>
          </div>
        )}

        {/* ── PLAN OVERVIEW CARD ── */}
        <div className={`bg-white/[0.03] rounded-2xl border ${colors.border} p-8`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Plan Info */}
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl ${colors.bg} border ${colors.border}`}>
                <TierIcon className={`w-8 h-8 ${colors.text}`} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">{TIER_NAMES[tier]} Plan</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.color}`}>
                    {status.text}
                  </span>
                </div>
                <p className="text-white/50 text-sm">
                  {user ? user.email : 'Guest user'}
                  {sub?.cancelAtPeriodEnd && (
                    <span className="text-amber-400 ml-2">• Cancels at end of period</span>
                  )}
                </p>
                {sub && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {sub.billingCycle === 'annual' ? 'Annual' : 'Monthly'} billing
                    </span>
                    {usage.daysRemaining > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {usage.daysRemaining} days remaining
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Plan Price + Actions */}
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                {plan.priceMonthly > 0 ? (
                  <>
                    <span className="text-3xl font-black">${plan.priceMonthly}</span>
                    <span className="text-white/40 text-sm">/mo</span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-white/60">Free</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {tier !== 'business' && (
                  <a
                    href="/pricing"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${colors.border} ${colors.text} hover:${colors.bg}`}
                  >
                    {tier === 'free' ? 'Upgrade' : 'Change Plan'}
                  </a>
                )}
                {sub && !sub.cancelAtPeriodEnd && tier !== 'free' && (
                  <button
                    onClick={() => setCancelConfirm(true)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-white/[0.08] text-white/40 hover:text-red-400 hover:border-red-500/20 transition-all"
                  >
                    Cancel
                  </button>
                )}
                {sub?.cancelAtPeriodEnd && (
                  <button
                    onClick={handleReactivate}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Confirmation */}
        {cancelConfirm && (
          <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-400 mb-1">Cancel your subscription?</h3>
                <p className="text-sm text-white/50 mb-4">
                  Your plan will remain active until the end of the current billing period.
                  You won't be charged again, but you'll lose access to {TIER_NAMES[tier]} features when it expires.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    Yes, cancel subscription
                  </button>
                  <button
                    onClick={() => setCancelConfirm(false)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-white/[0.08] text-white/50 hover:text-white transition-all"
                  >
                    Keep my plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── UPGRADE RECOMMENDATION ── */}
        {recommendation.shouldUpgrade && recommendation.recommendedTier && (
          <div className="bg-amber-500/5 rounded-2xl border border-amber-500/20 p-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-400 text-sm mb-0.5">Upgrade recommended</h3>
                <p className="text-xs text-white/50">{recommendation.reason}</p>
              </div>
              <a
                href="/pricing"
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all shrink-0"
              >
                View {TIER_NAMES[recommendation.recommendedTier]}
                <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </a>
            </div>
          </div>
        )}

        {/* ── USAGE METERS ── */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-white/40" />
            Usage this month
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <UsageMeter
              label="Quote Exports"
              used={usage.quotes.used}
              limit={usage.quotes.limit}
              unlimited={usage.quotes.unlimited}
              icon={Download}
            />
            <UsageMeter
              label="Saved Projects"
              used={usage.projects.used}
              limit={usage.projects.limit}
              unlimited={usage.projects.unlimited}
              icon={FileText}
            />
            <UsageMeter
              label="API Calls"
              used={usage.apiCalls.used}
              limit={usage.apiCalls.limit}
              unlimited={usage.apiCalls.unlimited}
              icon={Settings}
            />
            <UsageMeter
              label="Advanced Analyses"
              used={usage.advancedCalcs.used}
              limit={usage.advancedCalcs.limit}
              unlimited={usage.advancedCalcs.unlimited}
              icon={BarChart3}
            />
            <UsageMeter
              label="Market Reports"
              used={usage.marketReports.used}
              limit={usage.marketReports.limit}
              unlimited={usage.marketReports.unlimited}
              icon={TrendingUp}
            />
          </div>
        </div>

        {/* ── PLAN FEATURES ── */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-white/40" />
            Your plan includes
          </h2>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className={`w-4 h-4 mt-0.5 shrink-0 ${colors.text}`} />
                  <span className="text-sm text-white/70">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── QUICK LINKS ── */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-white/40" />
            Quick links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/wizard"
              className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-4 hover:bg-white/[0.05] hover:border-white/[0.15] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/90">Create Quote</h3>
                  <p className="text-xs text-white/40">Open the BESS wizard</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/50 transition-colors" />
              </div>
            </a>
            <a
              href="/market-intelligence"
              className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-4 hover:bg-white/[0.05] hover:border-white/[0.15] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/90">Market Intelligence</h3>
                  <p className="text-xs text-white/40">BESS market reports</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/50 transition-colors" />
              </div>
            </a>
            <a
              href="/templates"
              className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-4 hover:bg-white/[0.05] hover:border-white/[0.15] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/90">Brand Kit</h3>
                  <p className="text-xs text-white/40">Customize quote branding</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/50 transition-colors" />
              </div>
            </a>
          </div>
        </div>

        {/* ── NEED HELP ── */}
        <div className="text-center py-8 border-t border-white/[0.06]">
          <p className="text-sm text-white/30">
            Questions about your subscription?{' '}
            <a href="/support" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Contact support
            </a>
            {' '}or email{' '}
            <a href="mailto:support@merlin.energy" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              support@merlin.energy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
