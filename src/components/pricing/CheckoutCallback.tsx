/**
 * CHECKOUT CALLBACK — Handles Stripe checkout return
 * ====================================================
 * Shown briefly when user returns from Stripe Checkout.
 * 
 * Success: Syncs subscription locally + redirects to wizard.
 * Cancel:  Shows a message + link back to pricing page.
 * 
 * Created: February 17, 2026
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { setSubscription, getEffectiveTier } from '@/services/subscriptionService';
import type { SubscriptionTier } from '@/types/commerce';

type CallbackStatus = 'loading' | 'success' | 'canceled' | 'error';

export default function CheckoutCallback() {
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [tier, setTier] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutResult = params.get('checkout');
    const sessionId = params.get('session_id');

    if (checkoutResult === 'canceled') {
      setStatus('canceled');
      return;
    }

    if (checkoutResult === 'success') {
      // The webhook will sync the real subscription to Supabase.
      // Here we optimistically activate the local tier so the user
      // sees immediate access while the webhook propagates.

      try {
        const pending = localStorage.getItem('pending_upgrade');
        if (pending) {
          const { tier: pendingTier, billing } = JSON.parse(pending);
          setSubscription(
            pendingTier as SubscriptionTier,
            billing || 'monthly',
            'trialing', // Will be updated to 'active' once webhook confirms
          );
          setTier(pendingTier);
          localStorage.removeItem('pending_upgrade');
        } else {
          // No pending data — just show the current tier
          setTier(getEffectiveTier());
        }

        setStatus('success');

        // Store sessionId for potential future verification
        if (sessionId) {
          localStorage.setItem('stripe_last_session_id', sessionId);
        }

        // Auto-redirect to wizard after 2.5 seconds
        setTimeout(() => {
          window.location.href = '/wizard';
        }, 2500);
      } catch (err) {
        console.error('[CheckoutCallback] Error processing success:', err);
        setStatus('error');
      }
      return;
    }

    // No checkout param — shouldn't be here, redirect
    window.location.href = '/pricing';
  }, []);

  const tierName = tier === 'starter' ? 'Builder' : tier === 'pro' ? 'Pro' : tier === 'advanced' ? 'Advanced' : tier;

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">

        {/* Loading */}
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
            <p className="text-white/60 text-lg">Processing your subscription…</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white mb-2">Welcome to {tierName}!</h1>
              <p className="text-white/50 text-lg">
                Your 14-day trial is active. You now have full access to all {tierName} features.
              </p>
            </div>
            <div className="bg-white/[0.04] rounded-xl border border-emerald-500/20 p-4">
              <p className="text-sm text-white/40">
                Redirecting to your wizard in a moment…
              </p>
            </div>
            <a
              href="/wizard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-semibold hover:bg-emerald-500/20 transition-all"
            >
              Go to Wizard
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Canceled */}
        {status === 'canceled' && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white mb-2">Checkout Canceled</h1>
              <p className="text-white/50 text-lg">
                No worries — you weren't charged. You can try again anytime.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/[0.06] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Pricing
              </a>
              <a
                href="/wizard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.04] border border-white/10 text-white/60 rounded-xl font-semibold hover:bg-white/[0.06] transition-all"
              >
                Continue Free
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white mb-2">Something went wrong</h1>
              <p className="text-white/50 text-lg">
                Your payment may have been processed. If you don't see your plan activated, please contact support.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <a
                href="mailto:support@merlin.energy"
                className="inline-flex items-center gap-2 px-6 py-3 border border-red-500/30 text-red-400 rounded-xl font-semibold hover:bg-red-500/10 transition-all"
              >
                Contact Support
              </a>
              <a
                href="/wizard"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/[0.06] transition-all"
              >
                Go to Wizard
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
