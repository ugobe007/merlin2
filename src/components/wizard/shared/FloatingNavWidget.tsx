/**
 * FLOATING NAV WIDGET (Option 1 - Recommended)
 * ============================================
 * 
 * Apple-like minimal design: Small dashboard icon in corner that expands to show
 * all navigation widgets and controls.
 * 
 * Design Principles:
 * - Hidden by default (minimal, non-intrusive)
 * - Expands on click to show all widgets
 * - Auto-collapses when clicking outside
 * - Consistent across all wizard steps and Merlin site
 * 
 * SSOT Compliance:
 * - All data comes from wizardState (Single Source of Truth)
 * - Widgets display calculated values from centralizedState
 * - TrueQuote badge links to methodology explanation
 * 
 * @created December 20, 2025
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu, X, Shield, Sun, Battery, Zap, HelpCircle, AlertTriangle,
  ChevronDown, ChevronUp, Home, Wand2, DollarSign
} from 'lucide-react';
import merlinImage from '@/assets/images/new_profile_merlin.png';
import { getSavingsScoutResult } from '@/services/savingsScoutCalculations';
import type { WizardState } from '../types/wizardTypes';

// CentralizedState type from useStreamlinedWizard hook
export interface CentralizedState {
  calculated?: {
    totalPeakDemandKW?: number;
    recommendedBatteryKW?: number;
    recommendedBatteryKWh?: number;
    recommendedSolarKW?: number;
    estimatedAnnualSavings?: number;
    estimatedPaybackYears?: number;
    estimatedCost?: number;
  };
}

export interface FloatingNavWidgetProps {
  // Wizard state (SSOT)
  wizardState: WizardState;
  centralizedState?: CentralizedState;
  
  // Navigation callbacks
  onOpenSidebarMenu: () => void;
  onOpenTrueQuote: () => void;
  onOpenSolarOpportunity: () => void;
  onOpenPowerProfileExplainer: () => void;
  onClose: () => void;
  onNavigateToSection?: (section: number) => void;
  
  // Current section for navigation
  currentSection?: number;
}

export function FloatingNavWidget({
  wizardState,
  centralizedState,
  onOpenSidebarMenu,
  onOpenTrueQuote,
  onOpenSolarOpportunity,
  onOpenPowerProfileExplainer,
  onClose,
  onNavigateToSection,
  currentSection = 0,
}: FloatingNavWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [savingsScoutExpanded, setSavingsScoutExpanded] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isExpanded) return undefined;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Calculate solar opportunity
  const geoSolarHours = wizardState.geoRecommendations?.profile?.avgSolarHoursPerDay || 0;
  const hasState = !!wizardState.state;
  
  const getDefaultSolarHours = (state: string): number => {
    const highSolarStates = ['Arizona', 'California', 'Nevada', 'New Mexico', 'Texas', 'Florida', 'Hawaii'];
    const medSolarStates = ['Colorado', 'Utah', 'Georgia', 'North Carolina', 'Oklahoma', 'Kansas'];
    if (highSolarStates.some(s => state.toLowerCase().includes(s.toLowerCase()))) return 6;
    if (medSolarStates.some(s => state.toLowerCase().includes(s.toLowerCase()))) return 5;
    return 4.5;
  };
  
  const solarHours = geoSolarHours > 0 ? geoSolarHours : (hasState && wizardState.state ? getDefaultSolarHours(wizardState.state) : 0);
  const sunRating = hasState ? Math.min(5, Math.max(1, Math.round(solarHours - 2))) : 0;

  // Calculate power profile (SSOT: Only user-configured values)
  const calc = centralizedState?.calculated || {};
  const batteryKW = wizardState.batteryKW || 0;
  const batteryKWh = wizardState.batteryKWh || 0;
  const solarKW = wizardState.solarKW || 0;
  const generatorKW = wizardState.generatorKW || 0;
  const totalPowerKW = batteryKW + solarKW + generatorKW;
  const totalStorageKWh = batteryKWh;
  const hasPowerData = totalPowerKW > 0 || totalStorageKWh > 0;

  const formatEnergy = (kwh: number) => {
    if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`;
    return `${Math.round(kwh)} kWh`;
  };
  const formatPower = (kw: number) => {
    if (kw >= 1000) return `${(kw / 1000).toFixed(1)} MW`;
    return `${Math.round(kw)} kW`;
  };

  // Calculate power gap (SSOT: Only calculated values)
  const peakDemandKW = calc.totalPeakDemandKW || 0;
  const totalConfiguredKW = batteryKW + solarKW + generatorKW;
  const rawCoverage = peakDemandKW > 0 
    ? Math.round((totalConfiguredKW / peakDemandKW) * 100)
    : 0;
  const coverage = Math.min(rawCoverage, 200);
  const isCovered = rawCoverage >= 100;
  const isPartial = rawCoverage >= 50 && rawCoverage < 100;
  const isCritical = rawCoverage > 0 && rawCoverage < 50;
  const hasPowerConfig = totalConfiguredKW > 0;
  const hasPeakDemand = peakDemandKW > 0;
  const hasPowerGapData = hasPeakDemand && hasPowerConfig;

  // Calculate Savings Scout opportunities
  const savingsScoutResult = useMemo(() => {
    if (!wizardState.state || !(calc.totalPeakDemandKW ?? 0)) return null;
    return getSavingsScoutResult(
      wizardState.state,
      calc.totalPeakDemandKW ?? 200,
      wizardState.selectedIndustry || 'hotel',
      {
        rooms: wizardState.useCaseData?.rooms || wizardState.useCaseData?.roomCount || 100,
        hasEVChargers: wizardState.useCaseData?.hasEVChargers || false,
        evChargerCount: wizardState.useCaseData?.evChargerCount || 0,
        evChargersL2: wizardState.evChargersL2 || 0,
        evChargersDCFC: wizardState.evChargersDCFC || 0,
        gridConnection: wizardState.gridConnection as any || 'on-grid',
      }
    );
  }, [wizardState.state, calc.totalPeakDemandKW, wizardState.selectedIndustry, wizardState.useCaseData]);

  const topOpportunities = savingsScoutResult?.opportunities
    .filter(o => o.status !== 'not-recommended')
    .slice(0, 3) || [];
  const totalPotential = savingsScoutResult?.totalAnnualPotential || 0;

  return (
    <>
      {/* Floating Dashboard Button - Always Visible */}
      <div ref={widgetRef} className="fixed top-4 right-4 z-[60]">
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 bg-gradient-to-br from-[#3B5BDB] to-[#5B21B6] rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white border-2 border-white/20 backdrop-blur-sm"
            title="Open navigation dashboard"
            aria-label="Open navigation dashboard"
          >
            <Menu className="w-6 h-6" />
          </button>
        ) : (
          <div className={`bg-gradient-to-br from-[#1a1a2e] via-[#252547] to-[#1e1e3d] rounded-2xl shadow-2xl border-2 border-[#3B5BDB]/50 backdrop-blur-xl p-4 transition-all duration-300 ${
            savingsScoutExpanded ? 'min-w-[400px] max-w-[500px]' : 'min-w-[320px] max-w-[400px]'
          } max-h-[85vh] overflow-y-auto`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
                <div>
                  <h3 className="text-white font-bold text-sm">Navigation Dashboard</h3>
                  <p className="text-white/60 text-xs">System status & controls</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close dashboard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 mb-4">
              <button
                onClick={onOpenSidebarMenu}
                className="w-full flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white text-sm"
              >
                <Menu className="w-4 h-4" />
                <span>Menu & Navigation</span>
              </button>
              <button
                onClick={onOpenTrueQuote}
                className="w-full flex items-center gap-3 px-3 py-2 bg-[#FEF3C7]/10 hover:bg-[#FEF3C7]/20 rounded-lg transition-colors border border-[#FCD34D]/30"
              >
                <Shield className="w-4 h-4 text-[#D97706]" />
                <span className="text-[#92400E] font-semibold text-sm">TrueQuote™</span>
              </button>
              <button
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-300 text-sm"
              >
                <X className="w-4 h-4" />
                <span>Close Wizard</span>
              </button>
            </div>

            {/* System Status Widgets */}
            <div className="space-y-3">
              {/* Solar Opportunity */}
              {hasState && (
                <button
                  onClick={onOpenSolarOpportunity}
                  className="w-full p-3 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-400/30 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-xs font-semibold">Solar Opportunity</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Sun 
                          key={i}
                          className={`w-3 h-3 ${
                            i <= sunRating 
                              ? 'text-amber-400 fill-amber-400' 
                              : 'text-amber-400/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-amber-300 text-sm font-bold">
                    {solarHours.toFixed(1)} hours/day
                  </div>
                </button>
              )}

              {/* Power Profile */}
              {hasPowerData && (
                <button
                  onClick={onOpenPowerProfileExplainer}
                  className="w-full p-3 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-400/30 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/80 text-xs font-semibold">Power Profile</span>
                    <Battery className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-emerald-300 text-lg font-black">
                    {formatEnergy(totalStorageKWh)}
                  </div>
                  <div className="text-emerald-400/70 text-xs">
                    {formatPower(totalPowerKW)} total power
                  </div>
                </button>
              )}

              {/* Power Gap */}
              {hasPowerConfig && (
                <button
                  onClick={onOpenPowerProfileExplainer}
                  className={`w-full p-3 rounded-xl border-2 transition-colors text-left ${
                    isCritical
                      ? 'bg-red-500/20 border-red-400/50 animate-pulse'
                      : isCovered
                        ? 'bg-emerald-500/20 border-emerald-400/50'
                        : 'bg-amber-500/20 border-amber-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-xs font-semibold">Power Coverage</span>
                    <Zap className={`w-4 h-4 ${
                      isCritical ? 'text-red-400' : isCovered ? 'text-emerald-400' : 'text-amber-400'
                    }`} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          isCritical
                            ? 'bg-gradient-to-r from-red-400 to-orange-400'
                            : isCovered
                              ? 'bg-gradient-to-r from-emerald-400 to-green-400'
                              : 'bg-gradient-to-r from-amber-400 to-yellow-400'
                        }`}
                        style={{ width: hasPowerGapData ? `${Math.min(100, coverage)}%` : '0%' }}
                      />
                    </div>
                    <span className={`text-lg font-black ${
                      isCritical ? 'text-red-300' : isCovered ? 'text-emerald-300' : 'text-amber-300'
                    }`}>
                      {hasPowerGapData ? `${coverage}%` : '—'}
                    </span>
                  </div>
                  <div className={`text-xs ${
                    isCritical ? 'text-red-300' : isCovered ? 'text-emerald-300' : 'text-amber-300'
                  }`}>
                    {isCovered ? '✓ Power covered' : isCritical ? '⚠ Need more power!' : 'Partial coverage'}
                  </div>
                </button>
              )}

              {/* Energy Opportunity (Savings Scout) */}
              {wizardState.state && (calc.totalPeakDemandKW ?? 0) > 0 && savingsScoutResult && (
                <div className="bg-indigo-500/10 rounded-xl border border-indigo-400/30 overflow-hidden">
                  {/* Savings Scout Trigger Button */}
                  <button
                    onClick={() => setSavingsScoutExpanded(!savingsScoutExpanded)}
                    className="w-full p-3 flex items-center justify-between hover:bg-indigo-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Wand2 className="w-5 h-5 text-indigo-400" />
                      <div className="text-left">
                        <div className="text-white/90 font-semibold text-sm">Savings Scout™</div>
                        {totalPotential > 0 && (
                          <div className="text-indigo-300 text-xs">
                            ${(totalPotential / 1000).toFixed(0)}K+ potential
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform duration-200 ${
                      savingsScoutExpanded ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {/* Expanded Savings Opportunities */}
                  {savingsScoutExpanded && (
                    <div className="px-3 pb-3 space-y-2.5 border-t border-indigo-400/20 pt-3">
                      {topOpportunities.length > 0 ? (
                        <>
                          {topOpportunities.map((opp) => {
                            // Abbreviate opportunity name if too long
                            const displayName = opp.name.length > 20 
                              ? `${opp.name.substring(0, 18)}...` 
                              : opp.name;
                            
                            // Abbreviate reason/context
                            const displayReason = opp.reason.length > 35
                              ? `${opp.reason.substring(0, 33)}...`
                              : opp.reason;
                            
                            return (
                              <div
                                key={opp.id}
                                className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <span className="text-base flex-shrink-0">{opp.icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-white/95 font-bold text-xs">{displayName}</span>
                                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded flex-shrink-0 ${
                                          opp.status === 'high' || opp.status === 'critical'
                                            ? 'bg-emerald-500 text-white'
                                            : opp.status === 'moderate'
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-gray-500 text-white'
                                        }`}>
                                          {opp.status === 'high' ? 'HIGH' : opp.status === 'critical' ? 'CRIT' : opp.status === 'moderate' ? 'MOD' : 'LOW'}
                                        </span>
                                      </div>
                                      <p className="text-white/60 text-[10px] leading-tight line-clamp-2">
                                        {displayReason}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {opp.potentialAnnual > 0 && (
                                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-emerald-300 font-bold text-sm">
                                        ${(opp.potentialAnnual / 1000).toFixed(1)}K
                                      </span>
                                      <span className="text-emerald-400/70 text-[10px]">/yr</span>
                                      {opp.potentialMonthly > 0 && (
                                        <span className="text-white/50 text-[10px]">
                                          (${(opp.potentialMonthly / 1000).toFixed(1)}K/mo)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Total and CTA */}
                          {totalPotential > 0 && (
                            <div className="mt-3 pt-3 border-t border-indigo-400/30">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div className="text-white/70 text-[10px] uppercase tracking-wide mb-0.5">
                                    Total Annual Potential
                                  </div>
                                  <div className="text-white/50 text-[10px]">
                                    Based on {topOpportunities.length} opportunity{topOpportunities.length !== 1 ? 'ies' : 'y'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-emerald-300 font-black text-xl">
                                    ${(totalPotential / 1000).toFixed(1)}K
                                  </div>
                                  <div className="text-emerald-400/70 text-[10px]">per year</div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSavingsScoutExpanded(false);
                                  setIsExpanded(false);
                                  onNavigateToSection?.(4);
                                }}
                                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 
                                          text-white font-bold text-sm rounded-lg hover:shadow-lg 
                                          transition-all hover:from-indigo-600 hover:to-purple-600
                                          flex items-center justify-center gap-2"
                              >
                                <Wand2 className="w-4 h-4" />
                                Get My Quote
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6 text-white/60">
                          <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs font-medium mb-1">No opportunities found</p>
                          <p className="text-[10px] text-white/40">Try adjusting your facility details</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

