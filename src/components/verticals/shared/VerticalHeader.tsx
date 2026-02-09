/**
 * SHARED VERTICAL HEADER
 * ======================
 * Sticky header with brand name, back-to-Merlin button, and CTA.
 * Config-driven via VerticalConfig.
 * 
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React from 'react';
import { Phone } from 'lucide-react';
import type { VerticalConfig } from '@/config/verticalConfig';
import merlinImage from '@/assets/images/new_profile_merlin.png';

interface VerticalHeaderProps {
  config: VerticalConfig;
  onGetQuote?: () => void;
}

export function VerticalHeader({ config, onGetQuote }: VerticalHeaderProps) {
  const { brandName, brandHighlight, brandSubtitle, brandIcon: BrandIcon, theme } = config;
  
  // Split brand name into base + highlight
  const baseNamePart = brandName.replace(brandHighlight, '');

  return (
    <header className={`${theme.headerBg} backdrop-blur-xl border-b-2 border-${theme.accent}-500/40 sticky top-0 z-40 shadow-lg shadow-${theme.accent}-500/10`}>
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Back to Merlin */}
        <a
          href="/"
          className={`flex items-center gap-2 text-${theme.accent}-300 hover:text-white transition-colors group mr-4 bg-slate-800/50 hover:bg-slate-700/50 px-3 py-2 rounded-xl border border-${theme.accent}-500/30 hover:border-${theme.accent}-400/50`}
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <img src={merlinImage} alt="Merlin" className="w-7 h-7" />
          <span className="hidden sm:inline text-sm font-semibold">Merlin</span>
        </a>

        <div className="flex items-center gap-3 flex-1">
          <div className={`w-12 h-12 bg-gradient-to-br ${theme.ctaGradient} rounded-xl flex items-center justify-center shadow-lg shadow-${theme.accent}-500/40 border-2 border-${theme.accent}-400/50`}>
            <BrandIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {baseNamePart}
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-${theme.accent}-400 to-${theme.accentSecondary}-400`}>
                {brandHighlight}
              </span>
            </h1>
            <p className={`text-xs text-${theme.accent}-300 font-medium`}>
              {brandSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a href="#calculator" className={`hidden md:block text-${theme.accent}-200 hover:text-white text-sm font-semibold transition-colors hover:bg-${theme.accent}-500/20 px-4 py-2 rounded-lg`}>
            Calculator
          </a>
          <button
            onClick={onGetQuote}
            className={`flex items-center gap-2 bg-gradient-to-r ${theme.ctaGradient} hover:${theme.ctaHoverGradient} px-5 py-2.5 rounded-full transition-all shadow-lg shadow-${theme.accent}-500/30 border-2 border-${theme.accent}-300/50 hover:scale-105`}
          >
            <Phone className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm">Get Quote</span>
          </button>
        </div>
      </div>
    </header>
  );
}
