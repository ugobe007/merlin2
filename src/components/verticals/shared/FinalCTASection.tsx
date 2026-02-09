/**
 * SHARED FINAL CTA SECTION
 * =========================
 * Bottom-of-page CTA banner with TrueQuote™ messaging.
 * 
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { VerticalConfig } from '@/config/verticalConfig';

interface FinalCTASectionProps {
  config: VerticalConfig;
  onGetQuote: () => void;
}

export function FinalCTASection({ config, onGetQuote }: FinalCTASectionProps) {
  const { theme } = config;

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to Start Saving?
        </h2>
        <p className={`text-xl text-${theme.accent}-200/70 mb-8`}>
          Get a free, no-obligation TrueQuote™ in under 5 minutes
        </p>
        <button
          onClick={onGetQuote}
          className={`inline-flex items-center gap-3 bg-gradient-to-r ${theme.ctaGradient} text-white px-12 py-5 rounded-full font-bold text-xl shadow-xl hover:shadow-2xl hover:shadow-${theme.accent}-500/40 transition-all hover:scale-105 border border-${theme.accent}-400/30`}
        >
          <Sparkles className="w-6 h-6" />
          Get My TrueQuote™
          <ArrowRight className="w-6 h-6" />
        </button>
        <p className="mt-4 text-sm text-slate-400">
          ◎ Every number backed by NREL, IEEE & IRA 2022 sources
        </p>
      </div>
    </section>
  );
}
