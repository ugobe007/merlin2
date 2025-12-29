/**
 * MERLIN RECOMMENDATION MODAL
 * ===========================
 * 
 * Appears after Step 3 completion, before Step 4 (Magic Fit)
 * Shows Merlin's recommended system with financial summary and RAVS score
 * 
 * Design:
 * - Two-column layout: Merlin image (left) + Recommendation summary (right)
 * - System breakdown: BESS (core) + Solar/Generator/EV (if selected)
 * - Financial Summary: Total Investment | Annual Savings | Payback | ROI
 * - RAVS™ score badge
 * - ProQuote option for customization
 */

import React, { useState, useMemo } from 'react';
import { 
  X, Sun, Battery, Zap, Flame, Sparkles, 
  ArrowRight, ArrowLeft, Shield
} from 'lucide-react';
// Try new_profile_merlin.png first, fallback to new_profile_.png
import merlinImage from '@/assets/images/new_profile_merlin.png';
import { calculateRAVS, type RAVSInput, type RAVSScore } from '@/services/ravsService';
import { RAVSDisplay } from './RAVSDisplay';
import type { OpportunityPreferences } from './MerlinInsightModal';

// ============================================================================
// TYPES
// ============================================================================

export interface SystemRecommendation {
  batteryKW: number;
  batteryKWH: number;
  solarKW?: number;
  generatorKW?: number;
  evStations?: {
    level2Count?: number;
    dcFastCount?: number;
  };
}

export interface FinancialSummary {
  totalInvestment: number;
  annualSavings: number;
  paybackYears: number;
  roi10Year: number;
  npv: number;
}

export interface MerlinRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onProQuote?: () => void;
  
  // Input data
  state: string;
  industryName: string;
  preferences: OpportunityPreferences | undefined;
  
  // System recommendation
  recommendation: SystemRecommendation;
  
  // Financial summary
  financials: FinancialSummary;
  
  // Optional: Grid connection for RAVS calculation
  gridConnection?: 'on-grid' | 'off-grid' | 'limited' | 'unreliable' | 'expensive';
  electricityRate?: number;
  industry?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MerlinRecommendationModal: React.FC<MerlinRecommendationModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  onProQuote,
  state,
  industryName,
  preferences,
  recommendation,
  financials,
  gridConnection = 'on-grid',
  electricityRate = 0.12,
  industry = 'commercial',
}) => {
  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  // Calculate RAVS score
  const ravsScore = useMemo<RAVSScore | null>(() => {
    try {
      // Estimate IRR from payback
      const estimatedIRR = financials.paybackYears > 0 
        ? Math.min(25, (1 / financials.paybackYears) * 100 * 1.5)
        : 10;
      
      const ravsInput: RAVSInput = {
        financial: {
          npv: financials.npv,
          irr: estimatedIRR,
          paybackYears: financials.paybackYears,
          roi10Year: financials.roi10Year,
          initialInvestment: financials.totalInvestment,
        },
        project: {
          systemType: recommendation.solarKW ? 'solar+bess' : 'bess',
          systemSizeKW: recommendation.batteryKW + (recommendation.solarKW || 0),
          durationHours: recommendation.batteryKWH / recommendation.batteryKW,
          state: state,
          gridConnection: gridConnection,
          industry: industry,
        },
        market: {
          electricityRate: electricityRate,
          incentivesAvailable: true,
          itcPercentage: 30,
          stateIncentives: ['CA', 'NY', 'MA', 'NJ', 'CT', 'CO'].includes(state),
          netMeteringAvailable: !['TX', 'AZ'].includes(state),
        },
        operational: {
          warrantyYears: 15,
          expectedLifeYears: 25,
          maintenanceIncluded: false,
          installerTier: 'standard',
          equipmentTier: 'tier1',
        },
      };
      
      return calculateRAVS(ravsInput);
    } catch (error) {
      console.warn('RAVS calculation failed:', error);
      return null;
    }
  }, [financials, recommendation, state, gridConnection, electricityRate, industry]);

  const getMerlinMessage = () => {
    return `Excellent choice! This system offers outstanding returns with ${financials.paybackYears.toFixed(1)}-year payback and ${financials.roi10Year.toFixed(0)}% ROI over 10 years.`;
  };

  // Calculate solar annual production estimate (MWh)
  const solarAnnualMWh = recommendation.solarKW 
    ? (recommendation.solarKW * 1500 / 1000) // ~1500 kWh/kW/year average
    : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-500/20 max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-900/80 to-indigo-900/80 backdrop-blur-md border-b border-purple-500/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Merlin's Magic</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-col md:flex-row p-6 gap-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Left Column - Merlin Image */}
          <div className="md:w-1/3 flex-shrink-0 flex flex-col items-center justify-center relative">
            {/* Merlin Image with Sparkles */}
            <div className="relative">
              <img 
                src={merlinImage} 
                alt="Merlin" 
                className="w-48 h-48 md:w-56 md:h-56 rounded-2xl shadow-xl"
              />
              {/* Animated Sparkles */}
              <div className="absolute inset-0 pointer-events-none">
                <Sparkles className="absolute top-2 right-2 w-4 h-4 text-purple-400 animate-pulse" />
                <Sparkles className="absolute bottom-4 left-4 w-3 h-3 text-amber-400 animate-pulse delay-300" />
                <Sparkles className="absolute top-1/2 right-1 w-2 h-2 text-cyan-400 animate-pulse delay-500" />
              </div>
            </div>
            
            {/* Merlin's Message */}
            <div className="mt-6 p-4 bg-purple-500/20 rounded-xl border border-purple-500/30 w-full">
              <div className="flex items-start gap-2">
                <span className="text-2xl">💬</span>
                <p className="text-white/90 text-sm leading-relaxed">
                  {getMerlinMessage()}
                </p>
              </div>
            </div>

            {/* RAVS Score Badge */}
            {ravsScore && (
              <div className="mt-4 w-full">
                <RAVSDisplay score={ravsScore} variant="badge" animated={true} />
              </div>
            )}
          </div>

          {/* Right Column - Recommendation Summary */}
          <div className="md:w-2/3 flex-shrink-0 space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-1">Your Recommended System</h2>
              <p className="text-purple-300 text-sm">Optimized for {industryName} in {state}</p>
            </div>

            {/* System Breakdown */}
            <div className="space-y-3">
              {/* BESS - Core */}
              <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-xl p-4 border-2 border-purple-500/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Battery className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Battery Storage (BESS)</h3>
                      <p className="text-white/60 text-sm">
                        {formatNumber(recommendation.batteryKW)} kW • {formatNumber(recommendation.batteryKWH)} kWh • {((recommendation.batteryKWH / recommendation.batteryKW)).toFixed(1)}hr
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium border border-purple-500/50">
                    CORE
                  </span>
                </div>
              </div>

              {/* Solar Array */}
              {preferences?.wantsSolar && recommendation.solarKW && recommendation.solarKW > 0 && (
                <div className="bg-slate-800/60 rounded-xl p-4 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <Sun className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Solar Array</h3>
                        <p className="text-white/60 text-sm">
                          {formatNumber(recommendation.solarKW)} kW DC • ~{solarAnnualMWh.toFixed(0)} MWh/year
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/50">
                      ✓
                    </span>
                  </div>
                </div>
              )}

              {/* EV Charging */}
              {preferences?.wantsEV && recommendation.evStations && (
                <div className="bg-slate-800/60 rounded-xl p-4 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">EV Charging</h3>
                        <p className="text-white/60 text-sm">
                          {recommendation.evStations.level2Count || 0} dual-port stations
                          {recommendation.evStations.dcFastCount && recommendation.evStations.dcFastCount > 0 
                            ? ` • ${recommendation.evStations.dcFastCount} DC Fast`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/50">
                      ✓
                    </span>
                  </div>
                </div>
              )}

              {/* Generator */}
              {preferences?.wantsGenerator && recommendation.generatorKW && recommendation.generatorKW > 0 && (
                <div className="bg-slate-800/60 rounded-xl p-4 border border-red-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <Flame className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Generator</h3>
                        <p className="text-white/60 text-sm">
                          {formatNumber(recommendation.generatorKW)} kW backup power
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/50">
                      ✓
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="mt-6 p-4 bg-slate-800/60 rounded-xl border border-white/10">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">💰</span>
                Financial Summary
              </h3>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-xs text-white/50 mb-1">Investment</div>
                  <div className="text-lg font-bold text-white">{formatCurrency(financials.totalInvestment)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50 mb-1">Annual Savings</div>
                  <div className="text-lg font-bold text-emerald-400">{formatCurrency(financials.annualSavings)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50 mb-1">Payback</div>
                  <div className="text-lg font-bold text-amber-400">{financials.paybackYears.toFixed(1)}yr</div>
                </div>
                <div>
                  <div className="text-xs text-white/50 mb-1">10-Year ROI</div>
                  <div className="text-lg font-bold text-purple-400">{financials.roi10Year.toFixed(0)}%</div>
                </div>
              </div>
            </div>

            {/* ProQuote Option */}
            {onProQuote && (
              <div className="mt-4 p-4 bg-slate-800/40 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium mb-1 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      Want to Customize?
                    </div>
                    <p className="text-white/60 text-sm">Use ProQuote for full control over sizing, equipment selection, and financing options.</p>
                  </div>
                  <button
                    onClick={onProQuote}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium transition-all text-sm flex items-center gap-2 whitespace-nowrap"
                  >
                    Open ProQuote
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative border-t border-purple-500/20 px-6 py-4 bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium transition-all text-sm flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </button>
          <button
            onClick={onAccept}
            className="px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all text-sm flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/30 hover:shadow-purple-500/50"
          >
            Accept Merlin's Magic
            <Sparkles className="w-4 h-4" />
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MerlinRecommendationModal;

