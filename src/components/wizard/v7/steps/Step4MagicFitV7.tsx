/**
 * Step 4: MagicFit V7 - 3-Tier System Recommendations
 * 
 * Created: February 10, 2026
 * 
 * Generates 3 optimized system tiers based on:
 * - User's goals from Step 1
 * - Facility profile from Step 3
 * - Add-on interests from Step 3.5 (solar/generator/ev)
 * 
 * Tiers:
 * - STARTER: Conservative sizing, fast payback
 * - PERFECT FIT ⭐: Balanced recommendation (default)
 * - BEAST MODE: Aggressive sizing, maximum savings
 * 
 * Uses TrueQuote SSOT for all calculations.
 */

import React, { useState, useEffect } from 'react';
import { Check, Loader2, AlertTriangle, Zap } from 'lucide-react';
import type { WizardState as WizardV7State } from '@/wizard/v7/hooks/useWizardV7';

// SSOT calculation engine
import { calculateQuote } from '@/services/unifiedQuoteCalculator';
import type { QuoteResult } from '@/services/unifiedQuoteCalculator';

interface Props {
  state: WizardV7State;
  actions?: {
    goBack?: () => void;
    goToStep?: (step: 'location' | 'industry' | 'profile' | 'results') => void;
  };
}

type TierKey = 'starter' | 'perfectFit' | 'beastMode';

interface TierConfig {
  name: string;
  tagline: string;
  multiplier: number; // BESS sizing multiplier vs base
  solarMultiplier: number; // Solar sizing vs base
  genMultiplier: number; // Generator sizing vs base
  headlineClass: string;
  cardBorder: string;
  cardBg: string;
  accentColor: string;
  buttonClass: string;
}

const TIER_CONFIG: Record<TierKey, TierConfig> = {
  starter: {
    name: 'STARTER',
    tagline: 'Get your feet wet',
    multiplier: 0.75, // 75% of calculated BESS
    solarMultiplier: 0.5, // Modest solar
    genMultiplier: 0.8, // Conservative generator
    headlineClass: 'text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent',
    cardBorder: 'border-slate-700',
    cardBg: 'bg-gradient-to-b from-slate-900 to-slate-950',
    accentColor: 'text-emerald-400',
    buttonClass: 'text-emerald-400 bg-emerald-500/10 border-2 border-emerald-500/30 hover:bg-emerald-500/20',
  },
  perfectFit: {
    name: 'PERFECT FIT',
    tagline: 'Just right for you ⭐',
    multiplier: 1.0, // 100% of calculated BESS
    solarMultiplier: 1.0, // Balanced solar
    genMultiplier: 1.0, // Recommended generator
    headlineClass: 'text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent',
    cardBorder: 'border-purple-500/50',
    cardBg: 'bg-gradient-to-b from-purple-950/50 via-slate-900 to-slate-950',
    accentColor: 'text-purple-400',
    buttonClass: 'text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-purple-500/30',
  },
  beastMode: {
    name: 'BEAST MODE',
    tagline: 'Go all in',
    multiplier: 1.4, // 140% of calculated BESS
    solarMultiplier: 1.5, // Aggressive solar
    genMultiplier: 1.25, // Oversized generator
    headlineClass: 'text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text text-transparent',
    cardBorder: 'border-slate-700',
    cardBg: 'bg-gradient-to-b from-slate-900 to-slate-950',
    accentColor: 'text-orange-400',
    buttonClass: 'text-orange-400 bg-orange-500/10 border-2 border-orange-500/30 hover:bg-orange-500/20',
  },
};

interface TierQuote {
  tierKey: TierKey;
  config: TierConfig;
  quote: QuoteResult;
  loading: boolean;
  error: string | null;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function Step4MagicFitV7({ state, actions }: Props) {
  const [tiers, setTiers] = useState<TierQuote[]>([]);
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get base sizing from Step 3 results (stored in state after profile calculation)
  const baseBESSKW = state.peakLoadKW || 1000; // fallback to 1 MW
  const baseBESSKWh = baseBESSKW * 4; // 4-hour duration default
  const baseSolarKW = state.includeSolar ? baseBESSKW * 0.5 : 0; // 50% of BESS if solar selected
  const baseGeneratorKW = state.includeGenerator ? baseBESSKW * 0.75 : 0; // 75% of BESS if gen selected

  useEffect(() => {
    async function generateTiers() {
      setIsLoading(true);
      
      const tierPromises = (['starter', 'perfectFit', 'beastMode'] as const).map(async (tierKey) => {
        const config = TIER_CONFIG[tierKey];
        
        try {
          // Apply tier multipliers to base sizing
          const bessKW = baseBESSKW * config.multiplier;
          const bessKWh = baseBESSKWh * config.multiplier;
          const solarKW = baseSolarKW * config.solarMultiplier;
          const generatorKW = baseGeneratorKW * config.genMultiplier;

          // Call SSOT calculateQuote with tier-specific sizing
          const quote = await calculateQuote({
            storageSizeMW: bessKW / 1000,
            durationHours: 4,
            location: state.location?.state || 'CA',
            zipCode: state.location?.zipCode || '',
            electricityRate: state.locationIntel?.electricityRate || 0.12,
            useCase: state.industry,
            solarMW: solarKW / 1000,
            generatorMW: generatorKW / 1000,
            generatorFuelType: 'natural-gas',
            gridConnection: 'on-grid',
            batteryChemistry: 'lfp',
            itcConfig: {
              prevailingWage: false,
              apprenticeship: false,
              energyCommunity: false,
              domesticContent: false,
            },
          });

          return {
            tierKey,
            config,
            quote,
            loading: false,
            error: null,
          };
        } catch (err) {
          return {
            tierKey,
            config,
            quote: null as any,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to generate quote',
          };
        }
      });

      const results = await Promise.all(tierPromises);
      setTiers(results);
      setIsLoading(false);
    }

    generateTiers();
  }, [baseBESSKW, baseBESSKWh, baseSolarKW, baseGeneratorKW, state.location, state.locationIntel, state.industry]);

  const handleSelectTier = (tierKey: TierKey) => {
    setSelectedTier(tierKey);
    
    // Store selected tier in state and navigate to results
    // updateState({ selectedTier: tierKey });
    
    // Navigate to results step
    setTimeout(() => {
      if (actions?.goToStep) {
        actions.goToStep('results');
      }
    }, 500);
  };

  if (isLoading || tiers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Generating your custom system options...</p>
          <p className="text-slate-500 text-sm mt-2">Analyzing your facility profile + goals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-6">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-semibold">MagicFit™ Recommendations</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            Choose Your Power Level
          </h1>
          
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Based on your {state.industry} facility profile and {state.goals.length > 0 ? 'energy goals' : 'requirements'}, 
            here are 3 optimized system configurations. Pick the one that fits your budget and ambition.
          </p>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {tiers.map((tier) => {
            const isSelected = selectedTier === tier.tierKey;
            const isRecommended = tier.tierKey === 'perfectFit';
            
            if (tier.error) {
              return (
                <div key={tier.tierKey} className={`p-6 rounded-2xl border ${tier.config.cardBorder} ${tier.config.cardBg}`}>
                  <h3 className={tier.config.headlineClass}>{tier.config.name}</h3>
                  <div className="flex items-center gap-2 text-red-400 mt-4">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Error: {tier.error}</span>
                  </div>
                </div>
              );
            }

            if (!tier.quote) return null;

            const quote = tier.quote;
            
            return (
              <div
                key={tier.tierKey}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                  ${tier.config.cardBorder} ${tier.config.cardBg}
                  ${isSelected ? 'ring-4 ring-purple-500/50 scale-105' : 'hover:scale-102'}
                  ${isRecommended && !isSelected ? 'ring-2 ring-purple-500/30' : ''}
                `}
                onClick={() => handleSelectTier(tier.tierKey)}
              >
                {/* Recommended Badge */}
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-sm font-bold shadow-lg">
                    ⭐ Recommended
                  </div>
                )}

                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Tier Name */}
                <h3 className={`${tier.config.headlineClass} mb-2`}>
                  {tier.config.name}
                </h3>
                <p className="text-slate-400 text-sm mb-6">{tier.config.tagline}</p>

                {/* Annual Savings - HERO */}
                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-slate-400 text-sm mb-1">Annual Savings</div>
                  <div className={`text-4xl font-black ${tier.config.accentColor}`}>
                    {formatCurrency(quote.financials.annualSavings)}
                    <span className="text-xl text-slate-500">/yr</span>
                  </div>
                </div>

                {/* Equipment Strip */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">🔋 Battery</span>
                    <span className="text-white font-semibold">
                      {formatNumber(quote.equipment.batteryKWh)} kWh / {formatNumber(quote.equipment.batteryKW)} kW
                    </span>
                  </div>
                  
                  {state.includeSolar && quote.equipment.solarKW > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">☀️ Solar</span>
                      <span className="text-white font-semibold">
                        {formatNumber(quote.equipment.solarKW)} kW
                      </span>
                    </div>
                  )}
                  
                  {state.includeGenerator && quote.equipment.generatorKW > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">⚡ Generator</span>
                      <span className="text-white font-semibold">
                        {formatNumber(quote.equipment.generatorKW)} kW
                      </span>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="space-y-2 mb-6 pb-6 border-b border-slate-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Investment</span>
                    <span className="text-white font-semibold">{formatCurrency(quote.costs.totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Federal ITC (30%)</span>
                    <span className="text-green-400 font-semibold">−{formatCurrency(quote.costs.federalTaxCredit)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-white">Net Cost</span>
                    <span className="text-white">{formatCurrency(quote.costs.netCost)}</span>
                  </div>
                </div>

                {/* ROI Metrics */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Payback Period</span>
                    <span className={`font-semibold ${tier.config.accentColor}`}>
                      {quote.financials.paybackYears.toFixed(1)} years
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">10-Year ROI</span>
                    <span className={`font-semibold ${tier.config.accentColor}`}>
                      {quote.financials.roi10Year.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">25-Year Profit</span>
                    <span className={`font-semibold ${tier.config.accentColor}`}>
                      {formatCurrency((quote.financials.annualSavings * 25) - quote.costs.netCost)}
                    </span>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  className={`
                    w-full py-3 px-6 rounded-xl font-bold text-base transition-all
                    ${tier.config.buttonClass}
                    ${isSelected ? 'opacity-100' : 'opacity-90 hover:opacity-100'}
                  `}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-5 h-5 inline mr-2" />
                      Selected
                    </>
                  ) : (
                    `Select ${tier.config.name}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={actions?.goBack}
            className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          
          {selectedTier && (
            <button
              onClick={() => handleSelectTier(selectedTier)}
              className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            >
              Continue with {TIER_CONFIG[selectedTier].name} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
