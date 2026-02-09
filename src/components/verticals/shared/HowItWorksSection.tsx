/**
 * SHARED HOW IT WORKS SECTION
 * ============================
 * 3-card "How Battery Storage Saves You Money" section.
 * Config-driven via VerticalConfig.howItWorks.
 * 
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React from 'react';
import { TrendingDown, Shield, Sun } from 'lucide-react';
import type { VerticalConfig } from '@/config/verticalConfig';

// Default icons/colors for the 3 cards when no custom ones are provided
const DEFAULT_CARD_STYLES = [
  { icon: TrendingDown, gradientFrom: 'from-blue-500', gradientTo: 'to-cyan-600', border: 'border-blue-500/40', shadow: 'shadow-blue-500/10', hoverShadow: 'hover:shadow-blue-500/20', hoverBorder: 'hover:border-blue-400/60' },
  { icon: Shield, gradientFrom: 'from-emerald-500', gradientTo: 'to-teal-600', border: 'border-emerald-500/40', shadow: 'shadow-emerald-500/10', hoverShadow: 'hover:shadow-emerald-500/20', hoverBorder: 'hover:border-emerald-400/60' },
  { icon: Sun, gradientFrom: 'from-amber-500', gradientTo: 'to-orange-600', border: 'border-amber-500/40', shadow: 'shadow-amber-500/10', hoverShadow: 'hover:shadow-amber-500/20', hoverBorder: 'hover:border-amber-400/60' },
];

interface HowItWorksSectionProps {
  config: VerticalConfig;
}

export function HowItWorksSection({ config }: HowItWorksSectionProps) {
  const { howItWorks, theme } = config;

  return (
    <section className="py-20 relative">
      <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-${theme.accent}-900/10 to-transparent`} />

      <div className="max-w-6xl mx-auto px-6 relative">
        <h2 className="text-4xl font-black text-white text-center mb-4">
          How Battery Storage{' '}
          <span className={`text-transparent bg-clip-text bg-gradient-to-r from-${theme.accent}-400 to-emerald-400`}>
            Saves You Money
          </span>
        </h2>
        <p className="text-center text-gray-400 mb-12 text-lg">
          Three powerful ways BESS transforms your energy costs
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {howItWorks.slice(0, 3).map((step, index) => {
            const style = DEFAULT_CARD_STYLES[index] || DEFAULT_CARD_STYLES[0];
            const Icon = style.icon;
            return (
              <div
                key={index}
                className={`bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-3xl p-8 border-2 ${style.border} text-center shadow-xl ${style.shadow} ${style.hoverShadow} transition-all hover:scale-[1.02] ${style.hoverBorder}`}
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${style.gradientFrom} ${style.gradientTo} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ${style.shadow.replace('/10', '/30')}`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">{step.title}</h3>
                <p className="text-gray-300 text-base leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
