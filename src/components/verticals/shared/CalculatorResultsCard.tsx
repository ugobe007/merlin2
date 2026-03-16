/**
 * SHARED CALCULATOR RESULTS CARD
 * ================================
 * Displays quote results (annual savings, payback, ROI, battery size, net cost)
 * with TrueQuote attribution and CTA buttons.
 * 
 * Identical pattern across all verticals, themed via config.
 * 
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React from 'react';
import { TrendingDown, Zap, Sparkles, ArrowRight, Phone, Check, Calculator } from 'lucide-react';
import type { VerticalConfig } from '@/config/verticalConfig';
import { TrueQuoteBadgeCanonical } from '@/components/shared/TrueQuoteBadgeCanonical';

/** Matches the shape returned by QuoteEngine.generateQuote() */
interface QuoteResult {
  financials: {
    annualSavings: number;
    paybackYears: number;
    roi25Year: number;
    [key: string]: any;
  };
  costs: {
    netCost: number;
    [key: string]: any;
  };
  benchmarkAudit?: {
    sources?: any[];
    [key: string]: any;
  };
  [key: string]: any;
}

interface CalculatorResultsCardProps {
  config: VerticalConfig;
  quoteResult: QuoteResult | null;
  isCalculating: boolean;
  /** Peak load in kW (displayed as battery size) */
  peakKW: number;
  onBuildQuote: () => void;
  onTalkToExpert: () => void;
  onShowTrueQuote: () => void;
}

export function CalculatorResultsCard({
  config,
  quoteResult,
  isCalculating,
  peakKW,
  onBuildQuote,
  onTalkToExpert,
  onShowTrueQuote,
}: CalculatorResultsCardProps) {
  const { theme: _theme } = config;

  return (
    <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl p-8 border border-emerald-400/30 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
          <TrendingDown className="w-5 h-5 text-white" />
        </div>
        <span className="text-white">Your Estimated Savings</span>
      </h3>

      {isCalculating ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full" />
        </div>
      ) : quoteResult ? (
        <div className="space-y-6">
          {/* Main Savings - HERO NUMBER */}
          <div className="relative bg-gradient-to-br from-emerald-600/30 via-cyan-600/20 to-emerald-600/30 rounded-2xl p-8 text-center border border-emerald-400/40">
            <p className="text-sm text-emerald-300 uppercase tracking-[0.2em] mb-3 font-bold">
              <span className="flex items-center gap-2 justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>ANNUAL SAVINGS</span>
                <Zap className="w-5 h-5 text-emerald-400" />
              </span>
            </p>
            <p className="text-6xl md:text-7xl font-black text-emerald-400 drop-shadow-lg">
              ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
            </p>
            <p className="text-white/80 mt-3 text-lg font-medium">per year</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center border border-cyan-400/30">
              <p className="text-3xl font-bold text-cyan-400">
                {quoteResult.financials.paybackYears.toFixed(1)}
              </p>
              <p className="text-sm text-white/70">Year Payback</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center border border-purple-400/30">
              <p className="text-3xl font-bold text-purple-400">
                {Math.round(quoteResult.financials.roi25Year)}%
              </p>
              <p className="text-sm text-white/70">25-Year ROI</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center border border-blue-400/30">
              <p className="text-3xl font-bold text-blue-400">
                {peakKW} kW
              </p>
              <p className="text-sm text-white/70">Battery Size</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center border border-amber-400/30">
              <p className="text-3xl font-bold text-amber-400">
                ${Math.round(quoteResult.costs.netCost).toLocaleString()}
              </p>
              <p className="text-sm text-white/70">Net Cost (after ITC)</p>
            </div>
          </div>

          {/* TrueQuote™ Attribution */}
          {quoteResult.benchmarkAudit && (
            <div className="rounded-xl p-4 border border-indigo-400/20 bg-slate-800/30 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <TrueQuoteBadgeCanonical onClick={onShowTrueQuote} />
                <div className="flex-1">
                  <p className="text-xs text-slate-300/80 mb-1">
                    All costs traceable to {quoteResult.benchmarkAudit.sources?.length || 0} authoritative sources
                  </p>
                  <button
                    onClick={onShowTrueQuote}
                    className="text-xs text-indigo-300 hover:text-indigo-200 underline flex items-center gap-1"
                  >
                    View Source Attribution →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CTA Buttons - Supabase Style */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={onBuildQuote}
              className="group w-full border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-300 hover:text-cyan-300 py-5 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              <span>Build My Quote</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onTalkToExpert}
              className="w-full border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-300 hover:text-emerald-300 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Talk to an Expert
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-emerald-200 text-xs">
            <Check className="w-3 h-3" />
            <span>Free consultation</span>
            <span>•</span>
            <Check className="w-3 h-3" />
            <span>No obligation</span>
            <span>•</span>
            <Check className="w-3 h-3" />
            <span>Takes 2 minutes</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-white/60">
          <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Adjust the sliders to see your savings</p>
        </div>
      )}
    </div>
  );
}
