/**
 * STEP 5: Magic Fit - Power Level Selection
 * =========================================
 * The Big Reveal: 3 cards with REAL calculations from TrueQuote Engine V2
 * 
 * ✅ SSOT COMPLIANT - January 2026 Refactor (Porsche 911 Architecture)
 * 
 * CRITICAL: ALL calculations come from:
 * - MerlinOrchestrator → TrueQuoteEngineV2 → MagicFit → Validators
 * - NO local calculation functions
 * - NO hardcoded constants
 * 
 * Data Flow:
 * WizardState → mapWizardStateToMerlinRequest() → generateQuote() → Display
 */

import React, { useEffect, useState } from 'react';
import { Zap, Battery, Sun, Clock, TrendingUp, Star, Check, Loader2, Info, Shield, Home, Fuel, AlertTriangle, PlugZap } from 'lucide-react';
import type { WizardState, PowerLevel } from '../types';
import { POWER_LEVELS } from '../types';

// ============================================================================
// SSOT IMPORTS - Porsche 911 Architecture
// ============================================================================
import { generateQuote, isAuthenticated, isRejected } from '@/services/merlin';
import type { TrueQuoteAuthenticatedResult, AuthenticatedSystemOption } from '@/services/merlin';
import { mapWizardStateToMerlinRequest } from '../utils/trueQuoteMapper';
import { TrueQuoteVerifyBadge } from '../components/TrueQuoteVerifyBadge';
import { calculateIncentives } from '@/services/stateIncentivesService';

// ============================================================================
// TYPES
// ============================================================================

interface DisplayOption {
  tier: 'starter' | 'perfectFit' | 'beastMode';
  name: string;
  tagline: string;
  emoji: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  option: AuthenticatedSystemOption;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  goToStep: (step: number) => void;
}

export function Step5MagicFit({ state, updateState, goToStep }: Props) {
  // === STATE ===
  const [quoteResult, setQuoteResult] = useState<TrueQuoteAuthenticatedResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<'starter' | 'perfectFit' | 'beastMode' | null>(null);
  const [stateIncentiveAmount, setStateIncentiveAmount] = useState<number>(0);
  const [stateIncentivePrograms, setStateIncentivePrograms] = useState<string[]>([]);

  // === DEBUG LOGGING ===
  useEffect(() => {
    console.log('🔍 === STEP 5 STATE DEBUG ===');
    console.log('industry:', state.industry);
    console.log('industryName:', state.industryName);
    console.log('useCaseData:', state.useCaseData);
    console.log('selectedOptions:', state.selectedOptions);
    console.log('goals:', state.goals);
  }, [state]);

  // === FETCH QUOTE FROM TRUEQUOTE ENGINE V2 ===
  useEffect(() => {
    async function loadQuote() {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Step5: Calling MerlinOrchestrator.generateQuote()');
        
        // Map wizard state to MerlinRequest format
        const request = mapWizardStateToMerlinRequest(state);
        console.log('📋 MerlinRequest:', request);
        
        // Call the Porsche 911 architecture
        const result = await generateQuote(state);
        
        if (isRejected(result)) {
          console.error('❌ Quote rejected:', result.reason);
          setError(result.reason || 'Quote generation failed');
          return;
        }
        
        if (isAuthenticated(result)) {
          console.log('✅ Quote authenticated:', result.quoteId);
          console.log('📊 Options:', {
            starter: result.options.starter.financials,
            perfectFit: result.options.perfectFit.financials,
            beastMode: result.options.beastMode.financials,
          });
          setQuoteResult(result);
          
          // Load state incentives
          try {
            const incentiveResult = await calculateIncentives(
              state.zipCode,
              result.options.perfectFit.financials.totalInvestment,
              result.options.perfectFit.bess.energyKWh,
              'commercial',
              result.options.perfectFit.solar.capacityKW > 0,
              false
            );
            setStateIncentiveAmount(incentiveResult.stateIncentives);
            setStateIncentivePrograms(incentiveResult.statePrograms?.map(p => p.program) || []);
          } catch (err) {
            console.warn('Could not load state incentives:', err);
          }
        }
      } catch (err) {
        console.error('❌ Quote error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unable to generate quote. Please try again.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadQuote();
  }, [
    state.zipCode, 
    state.industry, 
    state.useCaseData, 
    state.selectedOptions, 
    state.customSolarKw, 
    state.customEvL2, 
    state.customEvDcfc, 
    state.customEvUltraFast,
    state.customGeneratorKw,
    state.generatorFuel,
    state.goals,
  ]);

  // === SELECT POWER LEVEL ===
  const selectPowerLevel = (tier: 'starter' | 'perfectFit' | 'beastMode') => {
    if (!quoteResult) return;
    
    const option = quoteResult.options[tier];
    setSelectedTier(tier);
    
    // Update wizard state with selected calculations
    updateState({
      selectedPowerLevel: tier === 'starter' ? 'starter' : tier === 'perfectFit' ? 'perfect_fit' : 'beast_mode',
      calculations: {
        bessKW: option.bess.powerKW,
        bessKWh: option.bess.energyKWh,
        solarKW: option.solar.capacityKW,
        evChargers: option.ev.l2Count + option.ev.dcfcCount + option.ev.ultraFastCount,
        generatorKW: option.generator.capacityKW,
        totalInvestment: option.financials.totalInvestment,
        annualSavings: option.financials.annualSavings,
        paybackYears: option.financials.paybackYears,
        tenYearROI: option.financials.tenYearROI,
        federalITC: option.financials.federalITC,
        federalITCRate: quoteResult.baseCalculation.financials.federalITCRate,
        netInvestment: option.financials.netCost,
        quoteId: quoteResult.quoteId,
        pricingSources: quoteResult.notes || [],
        utilityName: quoteResult.baseCalculation.utility.name,
        utilityRate: quoteResult.baseCalculation.utility.rate,
        demandCharge: quoteResult.baseCalculation.utility.demandCharge,
        hasTOU: quoteResult.baseCalculation.utility.hasTOU,
      },
    });
  };

  // === RENDER HELPERS ===
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatNumber = (value: number) => value.toLocaleString();

  // === BUILD DISPLAY OPTIONS ===
  const displayOptions: DisplayOption[] = quoteResult ? [
    {
      tier: 'starter',
      name: 'Starter',
      tagline: 'Essential savings',
      emoji: '🌱',
      color: 'text-emerald-600',
      borderColor: 'border-emerald-200 hover:border-emerald-400',
      bgGradient: 'from-emerald-50 to-green-50',
      option: quoteResult.options.starter,
    },
    {
      tier: 'perfectFit',
      name: 'Perfect Fit',
      tagline: 'Recommended',
      emoji: '⭐',
      color: 'text-purple-600',
      borderColor: 'border-purple-300 hover:border-purple-500 ring-2 ring-purple-200',
      bgGradient: 'from-purple-50 to-indigo-50',
      option: quoteResult.options.perfectFit,
    },
    {
      tier: 'beastMode',
      name: 'Beast Mode',
      tagline: 'Maximum power',
      emoji: '🚀',
      color: 'text-orange-600',
      borderColor: 'border-orange-200 hover:border-orange-400',
      bgGradient: 'from-orange-50 to-amber-50',
      option: quoteResult.options.beastMode,
    },
  ] : [];

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-600 text-lg">Calculating your perfect energy system...</p>
        <p className="text-gray-400 text-sm mt-2">TrueQuote Engine V2 is analyzing your facility</p>
      </div>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Generate Quote</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => goToStep(3)}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Go Back to Facility Details
        </button>
      </div>
    );
  }

  // === MAIN RENDER ===
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Choose Your Power Level
        </h2>
        <p className="text-gray-600">
          Select the option that best fits your energy goals for{' '}
          <span className="font-semibold text-purple-600">{state.industryName || state.industry}</span>
        </p>
        {quoteResult && (
          <div className="mt-3">
            <TrueQuoteVerifyBadge 
              quoteId={quoteResult.quoteId}
              worksheetData={null}
              variant="compact"
            />
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayOptions.map((opt) => {
          const isSelected = selectedTier === opt.tier;
          const { option } = opt;
          
          return (
            <div
              key={opt.tier}
              onClick={() => selectPowerLevel(opt.tier)}
              className={`
                relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300
                bg-gradient-to-br ${opt.bgGradient}
                ${isSelected ? 'ring-4 ring-purple-400 scale-[1.02]' : opt.borderColor}
                hover:shadow-lg
              `}
            >
              {/* Recommended Badge */}
              {opt.tier === 'perfectFit' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Recommended
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-4">
                <span className="text-3xl">{opt.emoji}</span>
                <h3 className={`text-xl font-bold mt-2 ${opt.color}`}>{opt.name}</h3>
                <p className="text-gray-500 text-sm">{opt.tagline}</p>
              </div>

              {/* System Specs */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Battery className="w-4 h-4" /> BESS
                  </span>
                  <span className="font-semibold text-gray-800">
                    {formatNumber(option.bess.powerKW)} kW / {formatNumber(option.bess.energyKWh)} kWh
                  </span>
                </div>
                
                {option.solar.included && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Sun className="w-4 h-4" /> Solar
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatNumber(option.solar.capacityKW)} kW
                    </span>
                  </div>
                )}
                
                {option.generator.included && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Fuel className="w-4 h-4" /> Generator
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatNumber(option.generator.capacityKW)} kW
                    </span>
                  </div>
                )}
                
                {option.ev.included && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <PlugZap className="w-4 h-4" /> EV Chargers
                    </span>
                    <span className="font-semibold text-gray-800">
                      {option.ev.l2Count + option.ev.dcfcCount + option.ev.ultraFastCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-4" />

              {/* Financials */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Investment</span>
                  <span className="font-semibold">{formatCurrency(option.financials.totalInvestment)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Federal ITC (30%)</span>
                  <span>-{formatCurrency(option.financials.federalITC)}</span>
                </div>
                {stateIncentiveAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>State Incentives</span>
                    <span>-{formatCurrency(stateIncentiveAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold">
                  <span className="text-gray-800">Net Cost</span>
                  <span className={opt.color}>{formatCurrency(option.financials.netCost)}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-4" />

              {/* ROI Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center bg-white/50 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-800">
                    {option.financials.paybackYears.toFixed(1)} yrs
                  </div>
                  <div className="text-xs text-gray-500">Payback</div>
                </div>
                <div className="text-center bg-white/50 rounded-lg p-3">
                  <div className="text-lg font-bold text-green-600">
                    {option.financials.tenYearROI.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">10-Year ROI</div>
                </div>
              </div>

              {/* Annual Savings */}
              <div className="mt-4 text-center bg-white/70 rounded-lg p-3">
                <div className="text-sm text-gray-600">Annual Savings</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(option.financials.annualSavings)}/yr
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Facility Summary */}
      {quoteResult && (
        <div className="bg-gray-50 rounded-xl p-4 mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              <strong>{quoteResult.facility.industryName}</strong> • 
              Peak Demand: {formatNumber(quoteResult.facility.peakDemandKW)} kW • 
              Annual Usage: {formatNumber(Math.round(quoteResult.facility.annualConsumptionKWh / 1000))} MWh
            </span>
            <span className="text-purple-600 font-medium">
              Quote ID: {quoteResult.quoteId}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
