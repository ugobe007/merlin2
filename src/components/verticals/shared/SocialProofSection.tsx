/**
 * SHARED SOCIAL PROOF SECTION
 * ============================
 * Case study cards showing example savings scenarios.
 * Config-driven via VerticalConfig.caseStudies.
 * 
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React from 'react';
import type { VerticalConfig, CaseStudy } from '@/config/verticalConfig';

const CARD_BORDERS = [
  'border-cyan-500/40 shadow-cyan-500/10 hover:shadow-cyan-500/20',
  'border-emerald-500/40 shadow-emerald-500/10 hover:shadow-emerald-500/20',
  'border-purple-500/40 shadow-purple-500/10 hover:shadow-purple-500/20',
  'border-amber-500/40 shadow-amber-500/10 hover:shadow-amber-500/20',
  'border-blue-500/40 shadow-blue-500/10 hover:shadow-blue-500/20',
  'border-rose-500/40 shadow-rose-500/10 hover:shadow-rose-500/20',
];

const BADGE_COLORS = [
  'bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/30',
  'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-500/30',
  'bg-gradient-to-br from-purple-400 to-indigo-600 shadow-purple-500/30',
  'bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-500/30',
  'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-blue-500/30',
  'bg-gradient-to-br from-rose-400 to-pink-600 shadow-rose-500/30',
];

const DETAIL_COLORS = [
  'text-cyan-400',
  'text-emerald-400',
  'text-purple-400',
  'text-amber-400',
  'text-blue-400',
  'text-rose-400',
];

interface SocialProofSectionProps {
  config: VerticalConfig;
  /** Optional click handler for case study cards */
  onCaseStudyClick?: (study: CaseStudy) => void;
}

export function SocialProofSection({ config, onCaseStudyClick }: SocialProofSectionProps) {
  const { caseStudies, theme, socialProofHeadline } = config;

  if (!caseStudies || caseStudies.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900/50 via-purple-950/20 to-slate-900/50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-black text-white text-center mb-4">
          {socialProofHeadline || (
            <>
              {config.brandName}{' '}
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-${theme.accent}-400`}>
                Saving Big
              </span>
            </>
          )}
        </h2>
        <p className="text-center text-gray-400 text-lg mb-12">
          Example savings scenarios based on typical installations
        </p>

        <div className={`grid md:grid-cols-${Math.min(caseStudies.length, 3)} gap-6`}>
          {caseStudies.slice(0, 3).map((study, index) => (
            <div
              key={study.id}
              onClick={() => onCaseStudyClick?.(study)}
              className={`bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-3xl p-6 border-2 ${CARD_BORDERS[index % CARD_BORDERS.length]} shadow-xl transition-all hover:scale-[1.02] ${onCaseStudyClick ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 ${BADGE_COLORS[index % BADGE_COLORS.length]} rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg`}>
                  {study.metrics.primaryValue}
                </div>
                <div>
                  <p className="font-black text-white text-lg">{study.title}</p>
                  <p className={`${DETAIL_COLORS[index % DETAIL_COLORS.length]} font-medium`}>
                    {study.category}
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 rounded-2xl p-5 text-center mb-4 border-2 border-emerald-500/30">
                <p className="text-4xl font-black text-emerald-400">
                  ${study.annualSavings.toLocaleString()}
                </p>
                <p className="text-gray-300 font-medium mt-1">Annual Savings</p>
              </div>
              <div className="flex justify-between text-sm bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                <span className="text-gray-400">
                  {study.metrics.batteryKW} kW system
                </span>
                <span className={`${DETAIL_COLORS[index % DETAIL_COLORS.length]} font-bold`}>
                  {study.paybackYears} yr payback
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
