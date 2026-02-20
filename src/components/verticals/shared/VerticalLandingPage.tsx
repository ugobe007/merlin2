/**
 * VERTICAL LANDING PAGE — MASTER SHELL
 * =======================================
 * Composes all shared sections + modals into a complete landing page.
 * 
 * Usage:
 *   import { getVerticalConfig } from '@/config/verticals';
 *   const config = getVerticalConfig('car-wash')!;
 *   <VerticalLandingPage config={config} />
 * 
 * Handles:
 *   - Header, Hero, Calculator, HowItWorks, SocialProof, FinalCTA, Footer
 *   - Lead capture modal (Supabase)
 *   - Wizard V7 modal overlay
 *   - TrueQuote modal
 *   - Page title + meta description
 * 
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { VerticalConfig } from '@/config/verticalConfig';
import { VerticalHeader } from './VerticalHeader';
import { VerticalHeroSection } from './VerticalHeroSection';
import { VerticalCalculatorSection } from './VerticalCalculatorSection';
import { HowItWorksSection } from './HowItWorksSection';
import { SocialProofSection } from './SocialProofSection';
import { FinalCTASection } from './FinalCTASection';
import { VerticalFooter } from './VerticalFooter';
import { LeadCaptureModal } from './LeadCaptureModal';
import { TrueQuoteModal } from '@/components/shared/TrueQuoteModal';

// Lazy-load WizardV7 to keep initial bundle small
const WizardV7Page = React.lazy(() => import('@/pages/WizardV7Page'));

interface VerticalLandingPageProps {
  config: VerticalConfig;
  /** Optional: disable wizard redirect that some verticals had (hotel, ev-charging) */
  disableRedirect?: boolean;
  /** Optional: override initial state for calculator */
  initialState?: string;
  /** Optional: custom children rendered between calculator and how-it-works */
  children?: React.ReactNode;
}

export function VerticalLandingPage({
  config,
  disableRedirect: _disableRedirect = true,
  initialState = 'California',
  children,
}: VerticalLandingPageProps) {
  // ─── Page meta ──────────────────────────────────────────────────────
  useEffect(() => {
    if (config.pageTitle) document.title = config.pageTitle;
  }, [config.pageTitle]);

  // ─── Modal state ────────────────────────────────────────────────────
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);

  // ─── Calculator inputs (passed to hero for inline estimate) ─────────
  const [calculatorInputs, setCalculatorInputs] = useState<Record<string, any>>({});

  const handleInputsChange = useCallback((inputs: Record<string, any>) => {
    setCalculatorInputs(inputs);
  }, []);

  // ─── Action handlers ────────────────────────────────────────────────
  const handleGetQuote = useCallback(() => setShowWizard(true), []);
  const handleTalkToExpert = useCallback(() => setShowLeadForm(true), []);
  const handleShowTrueQuote = useCallback(() => setShowTrueQuoteModal(true), []);

  return (
    <div className={`min-h-screen ${config.theme.pageBg}`}>
      {/* ─── HEADER ────────────────────────────────────────── */}
      <VerticalHeader config={config} onGetQuote={handleGetQuote} />

      {/* ─── HERO ──────────────────────────────────────────── */}
      <VerticalHeroSection
        config={config}
        calculatorInputs={calculatorInputs}
        onGetQuote={handleGetQuote}
        onShowTrueQuote={handleShowTrueQuote}
      />

      {/* ─── CALCULATOR ────────────────────────────────────── */}
      <VerticalCalculatorSection
        config={config}
        onBuildQuote={handleGetQuote}
        onTalkToExpert={handleTalkToExpert}
        onShowTrueQuote={handleShowTrueQuote}
        onInputsChange={handleInputsChange}
        initialState={initialState}
      />

      {/* ─── CUSTOM CONTENT SLOT ──────────────────────────── */}
      {children}

      {/* ─── HOW IT WORKS ──────────────────────────────────── */}
      <HowItWorksSection config={config} />

      {/* ─── SOCIAL PROOF ──────────────────────────────────── */}
      {config.caseStudies.length > 0 && (
        <SocialProofSection config={config} />
      )}

      {/* ─── FINAL CTA ─────────────────────────────────────── */}
      <FinalCTASection config={config} onGetQuote={handleGetQuote} />

      {/* ─── FOOTER ────────────────────────────────────────── */}
      <VerticalFooter config={config} />

      {/* ─── LEAD CAPTURE MODAL ────────────────────────────── */}
      <LeadCaptureModal
        config={config}
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
      />

      {/* ─── WIZARD V7 MODAL ──────────────────────────────── */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-slate-900">
          <button
            onClick={() => setShowWizard(false)}
            className="fixed top-4 right-4 z-[60] bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors backdrop-blur-sm border border-white/20"
          >
            ← Back to {config.brandName}{config.brandHighlight}
          </button>
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full" />
            </div>
          }>
            <WizardV7Page {...{ initialIndustry: config.wizardIndustrySlug } as any} />
          </React.Suspense>
        </div>
      )}

      {/* ─── TRUEQUOTE MODAL ──────────────────────────────── */}
      <TrueQuoteModal
        isOpen={showTrueQuoteModal}
        onClose={() => setShowTrueQuoteModal(false)}
      />
    </div>
  );
}
