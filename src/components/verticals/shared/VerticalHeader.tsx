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
    <header className={`${theme.headerBg} border-b border-cyan-500/20 sticky top-0 z-40`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Back to Merlin */}
        <a
          href="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mr-4 hover:bg-slate-800/50 px-3 py-2 rounded-lg"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <img src={merlinImage} alt="Merlin" className="w-7 h-7" />
          <span className="hidden sm:inline text-sm font-medium">Merlin</span>
        </a>

        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <BrandIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {baseNamePart}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                {brandHighlight}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {brandSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a href="#calculator" className="hidden md:block text-slate-400 hover:text-white text-sm font-medium transition-colors hover:bg-slate-800/50 px-4 py-2 rounded-lg">
            Calculator
          </a>
          <button
            onClick={onGetQuote}
            className={`group flex items-center gap-2 ${theme.ctaGradient} ${theme.ctaHoverGradient} px-5 py-2.5 rounded-full transition-all backdrop-blur-sm`}
          >
            <Phone className="w-4 h-4" />
            <span className="font-bold text-sm">Get Quote</span>
          </button>
        </div>
      </div>
    </header>
  );
}
