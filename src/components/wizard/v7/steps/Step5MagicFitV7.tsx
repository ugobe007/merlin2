/**
 * Step 5: MagicFit V7 - 3-Tier System Recommendations
 * 
 * Created: February 10, 2026
 * Updated: February 11, 2026 — Card font fixes, no fuchsia, TrueQuote badge,
 *          equipment summary, improved spacing
 * 
 * Generates 3 optimized system tiers based on:
 * - User's goals from Step 1
 * - Facility profile from Step 3
 * - Add-on interests from Step 4 (solar/generator/ev)
 * 
 * Tiers:
 * - STARTER: Conservative sizing, fast payback
 * - PERFECT FIT ⭐: Balanced recommendation (default)
 * - BEAST MODE: Aggressive sizing, maximum savings
 * 
 * Uses TrueQuote SSOT for all calculations.
 */

import React, { useState, useEffect } from 'react';
import { Check, Loader2, AlertTriangle, Battery, Sun, Fuel, Clock, TrendingUp, DollarSign, Shield } from 'lucide-react';
import type { WizardState as WizardV7State, EnergyGoal, WizardStep, QuoteOutput } from '@/wizard/v7/hooks/useWizardV7';
import { getIndustryMeta } from '@/wizard/v7/industryMeta';
import { TrueQuoteBadgeCanonical } from '@/components/shared/TrueQuoteBadgeCanonical';
import TrueQuoteModal from '@/components/shared/TrueQuoteModal';

// SSOT calculation engine
import { calculateQuote } from '@/services/unifiedQuoteCalculator';
import { useMerlinData } from "@/wizard/v7/memory/useMerlinData";
import type { QuoteResult } from '@/services/unifiedQuoteCalculator';

interface Props {
  state: WizardV7State;
  actions?: {
    goBack?: () => void;
    goToStep?: (step: WizardStep) => void;
    updateQuote?: (quote: Partial<QuoteOutput>) => void;
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
    tagline: 'Save More',
    multiplier: 0.75,
    solarMultiplier: 0.5,
    genMultiplier: 0.8,
    headlineClass: 'text-2xl lg:text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent',
    cardBorder: 'border-slate-700/80',
    cardBg: 'bg-gradient-to-b from-slate-900 to-slate-950',
    accentColor: 'text-emerald-400',
    buttonClass: 'text-emerald-400 bg-transparent border-2 border-emerald-500/30 hover:border-emerald-400/60',
  },
  perfectFit: {
    name: 'PERFECT FIT',
    tagline: 'Best Value ⭐',
    multiplier: 1.0,
    solarMultiplier: 1.0,
    genMultiplier: 1.0,
    headlineClass: 'text-2xl lg:text-3xl font-black tracking-tight bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent',
    cardBorder: 'border-purple-500/60',
    cardBg: 'bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950',
    accentColor: 'text-purple-400',
    buttonClass: 'text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-[0_0_12px_rgba(139,92,246,0.25)]',
  },
  beastMode: {
    name: 'BEAST MODE',
    tagline: 'Full Power',
    multiplier: 1.4,
    solarMultiplier: 1.5,
    genMultiplier: 1.25,
    headlineClass: 'text-2xl lg:text-3xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent',
    cardBorder: 'border-slate-700/80',
    cardBg: 'bg-gradient-to-b from-slate-900 to-slate-950',
    accentColor: 'text-orange-400',
    buttonClass: 'text-orange-400 bg-transparent border-2 border-orange-500/30 hover:border-orange-400/60',
  },
};

interface TierQuote {
  tierKey: TierKey;
  config: TierConfig;
  quote: QuoteResult;
  loading: boolean;
  error: string | null;
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return '$0';
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function safeFixed(value: number | undefined | null, digits: number): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(digits);
}

function getIndustryLabel(slug: string): string {
  return getIndustryMeta(slug).label || slug.replace(/_/g, ' ');
}

/**
 * Analyze user's energy goals and return sizing multipliers
 * 
 * Goals influence:
 * - BESS capacity (backup_power, energy_independence → larger)
 * - Duration (backup_power → longer)
 * - Solar sizing (reduce_carbon, energy_independence → more solar)
 * - Generator sizing (backup_power → larger backup)
 */
function getGoalBasedMultipliers(goals: EnergyGoal[]) {
  const modifiers = {
    bessMultiplier: 1.0,
    durationMultiplier: 1.0,
    solarMultiplier: 1.0,
    generatorMultiplier: 1.0,
    recommendedTier: 'perfectFit' as TierKey,
    goalHints: [] as string[],
  };

  // No goals selected → return defaults
  if (goals.length === 0) {
    return modifiers;
  }

  // GOAL: Lower Bills → optimize for cost, smaller system
  if (goals.includes('lower_bills')) {
    modifiers.bessMultiplier *= 0.9; // Slightly smaller BESS
    modifiers.solarMultiplier *= 1.1; // More solar = more savings
    modifiers.recommendedTier = 'starter';
    modifiers.goalHints.push('Optimized for fast payback with solar self-consumption');
  }

  // GOAL: Backup Power → larger capacity, longer duration
  if (goals.includes('backup_power')) {
    modifiers.bessMultiplier *= 1.15; // 15% larger BESS
    modifiers.durationMultiplier *= 1.5; // 6 hours instead of 4
    modifiers.generatorMultiplier *= 1.2; // Larger backup generator
    modifiers.recommendedTier = 'perfectFit';
    modifiers.goalHints.push('Extended duration for reliable backup power');
  }

  // GOAL: Reduce Carbon → maximize renewables
  if (goals.includes('reduce_carbon')) {
    modifiers.solarMultiplier *= 1.4; // Much more solar
    modifiers.bessMultiplier *= 1.1; // Larger battery to store solar
    modifiers.generatorMultiplier *= 0.7; // Smaller/no generator
    modifiers.goalHints.push('Maximize solar + storage for zero-carbon operation');
  }

  // GOAL: Energy Independence → go big on everything
  if (goals.includes('energy_independence')) {
    modifiers.bessMultiplier *= 1.3; // Much larger BESS
    modifiers.solarMultiplier *= 1.5; // Maximum solar
    modifiers.generatorMultiplier *= 1.3; // Full backup capability
    modifiers.durationMultiplier *= 1.25; // 5 hours
    modifiers.recommendedTier = 'beastMode';
    modifiers.goalHints.push('Oversized system for true grid independence');
  }

  // GOAL: Reduce Demand Charges → optimize for peak shaving
  if (goals.includes('reduce_demand_charges')) {
    modifiers.bessMultiplier *= 1.05; // Slightly larger for peaks
    modifiers.solarMultiplier *= 0.9; // Less solar, more battery focus
    modifiers.goalHints.push('Sized for aggressive peak demand reduction');
  }

  return modifiers;
}

export default function Step5MagicFitV7({ state, actions }: Props) {
  const [tiers, setTiers] = useState<TierQuote[]>([]);
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);

  // ✅ MERLIN MEMORY: Read cross-step data from Memory first, fall back to state
  const data = useMerlinData(state);

  // Get base sizing from Memory (profile.peakLoadKW) or state.quote
  const rawBESSKW = data.peakLoadKW || 1000; // fallback to 1 MW
  
  // Apply goal-based intelligence to sizing
  const goalModifiers = getGoalBasedMultipliers(data.goals as EnergyGoal[]);
  
  const baseBESSKW = rawBESSKW * goalModifiers.bessMultiplier;
  const baseDuration = 4 * goalModifiers.durationMultiplier;
  const baseBESSKWh = baseBESSKW * baseDuration;
  const baseSolarKW = data.addOns.includeSolar ? baseBESSKW * 0.5 * goalModifiers.solarMultiplier : 0;
  const baseGeneratorKW = data.addOns.includeGenerator ? baseBESSKW * 0.75 * goalModifiers.generatorMultiplier : 0;

  useEffect(() => {
    let cancelled = false;

    async function generateTiers() {
      setIsLoading(true);
      setLoadError(null);

      console.log('[Step5 MagicFit] generateTiers starting', {
        rawBESSKW,
        baseBESSKW,
        baseDuration,
        baseSolarKW,
        baseGeneratorKW,
        location: data.location.state,
        utilityRate: data.utilityRate,
        industry: data.industry,
        goals: data.goals,
      });
      
      // Timeout safety: if calculateQuote hangs, fail after 15s
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Quote calculation timed out after 15s')), 15000)
      );

      try {
        const tierPromises = (['starter', 'perfectFit', 'beastMode'] as const).map(async (tierKey) => {
          const config = TIER_CONFIG[tierKey];
          
          try {
            // Apply tier multipliers to base sizing
            const bessKW = baseBESSKW * config.multiplier;
            const solarKW = baseSolarKW * config.solarMultiplier;
            const generatorKW = baseGeneratorKW * config.genMultiplier;

            console.log(`[Step5 MagicFit] Calling calculateQuote for ${tierKey}`, {
              storageSizeMW: bessKW / 1000,
              durationHours: baseDuration,
              solarMW: solarKW / 1000,
              generatorMW: generatorKW / 1000,
            });

            // Call SSOT calculateQuote with tier-specific sizing
            const quote = await calculateQuote({
              storageSizeMW: bessKW / 1000,
              durationHours: baseDuration,
              location: data.location.state || 'CA',
              zipCode: data.location.zip || '',
              electricityRate: data.utilityRate || 0.12,
              useCase: data.industry,
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

            console.log(`[Step5 MagicFit] ${tierKey} quote result:`, {
              annualSavings: quote?.financials?.annualSavings,
              totalCost: quote?.costs?.totalProjectCost,
              payback: quote?.financials?.paybackYears,
            });

            return {
              tierKey,
              config,
              quote,
              loading: false,
              error: null,
            };
          } catch (err) {
            console.error(`[Step5 MagicFit] ${tierKey} failed:`, err);
            return {
              tierKey,
              config,
              quote: null as unknown as QuoteResult,
              loading: false,
              error: err instanceof Error ? err.message : 'Failed to generate quote',
            };
          }
        });

        const results = await Promise.race([
          Promise.all(tierPromises),
          timeoutPromise,
        ]) as TierQuote[];

        if (!cancelled) {
          console.log('[Step5 MagicFit] All tiers generated:', results.map(r => ({
            tier: r.tierKey,
            hasQuote: !!r.quote,
            error: r.error,
          })));
          setTiers(results);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          console.error('[Step5 MagicFit] generateTiers failed:', msg);
          setLoadError(msg);
          setIsLoading(false);
        }
      }
    }

    generateTiers();
    return () => { cancelled = true; };
  }, [baseBESSKW, baseBESSKWh, baseSolarKW, baseGeneratorKW, baseDuration, data.location.state, data.utilityRate, data.industry]);

  const handleSelectTier = (tierKey: TierKey) => {
    setSelectedTier(tierKey);
    
    // Store selected tier quote into wizard state so Step 6 Results shows correct numbers
    const tierData = tiers.find(t => t.tierKey === tierKey);
    if (tierData?.quote && actions?.updateQuote) {
      const eq = tierData.quote.equipment;
      const batt = eq?.batteries;
      const bessKWh = batt ? (batt.unitEnergyMWh ?? 0) * (batt.quantity ?? 0) * 1000 : 0;
      const bessKW = batt ? (batt.unitPowerMW ?? 0) * (batt.quantity ?? 0) * 1000 : 0;
      const solarKW = eq?.solar ? (eq.solar.totalMW ?? 0) * 1000 : 0;
      const genKW = eq?.generators ? (eq.generators.unitPowerMW ?? 0) * (eq.generators.quantity ?? 0) * 1000 : 0;
      actions.updateQuote({
        bessKWh,
        bessKW,
        solarKW,
        generatorKW: genKW,
        capexUSD: tierData.quote.costs?.totalProjectCost ?? 0,
        annualSavingsUSD: tierData.quote.financials?.annualSavings ?? 0,
        roiYears: tierData.quote.financials?.paybackYears ?? 0,
        npv: tierData.quote.financials?.npv ?? undefined,
        irr: tierData.quote.financials?.irr ?? undefined,
        paybackYears: tierData.quote.financials?.paybackYears ?? 0,
        durationHours: baseDuration,
        pricingComplete: true,
        notes: [`MagicFit tier: ${TIER_CONFIG[tierKey].name} (${TIER_CONFIG[tierKey].multiplier}x)`],
      });
    }
    
    // ✅ FEB 2026: No auto-advance — user confirms by clicking Next in bottom nav
  };

  if (isLoading || tiers.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          {loadError ? (
            <>
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
              <p className="text-slate-300 text-base font-semibold mb-2">Couldn't generate options</p>
              <p className="text-slate-500 text-sm mb-4">{loadError}</p>
              <button
                onClick={actions?.goBack}
                className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Options
              </button>
            </>
          ) : (
            <>
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-base font-semibold">Generating your custom system options...</p>
              <p className="text-slate-500 text-sm mt-2">Analyzing facility profile + goals</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Build equipment summary for the selected tier (or perfectFit as default)
  const _summaryTier = tiers.find(t => t.tierKey === (selectedTier || 'perfectFit'));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* TrueQuote Modal */}
      <TrueQuoteModal
        isOpen={showTrueQuoteModal}
        onClose={() => setShowTrueQuoteModal(false)}
        mode="about"
      />

      {/* Inline guidance */}
      <div className="space-y-2.5">
        <p className="text-sm leading-relaxed text-slate-400">
          Three system options for your{" "}
          <span className="text-slate-200 font-medium">{getIndustryLabel(data.industry)}</span> facility
          <span className="text-slate-500">{" "}· sized by Merlin based on your profile and goals</span>
        </p>

        {/* Goal-based sizing hints */}
        {goalModifiers.goalHints.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {goalModifiers.goalHints.map((hint, idx) => (
              <span key={idx} className="text-xs text-purple-400/80">
                ✨ {hint}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tier Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.tierKey;
          const isRecommended = tier.tierKey === 'perfectFit';
          
          if (tier.error) {
            return (
              <div key={tier.tierKey} className={`p-5 rounded-xl border ${tier.config.cardBorder} ${tier.config.cardBg}`}>
                <h3 className={tier.config.headlineClass}>{tier.config.name}</h3>
                <div className="flex items-center gap-2 text-red-400 mt-4 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Error: {tier.error}</span>
                </div>
              </div>
            );
          }

          if (!tier.quote) return null;

          const quote = tier.quote;
          const batteries = quote.equipment?.batteries;
          const bessKWh = batteries ? (batteries.unitEnergyMWh ?? 0) * (batteries.quantity ?? 0) * 1000 : 0;
          const bessKW = batteries ? (batteries.unitPowerMW ?? 0) * (batteries.quantity ?? 0) * 1000 : 0;
          const solarKW = quote.equipment?.solar ? (quote.equipment.solar.totalMW ?? 0) * 1000 : 0;
          const genKW = quote.equipment?.generators ? (quote.equipment.generators.unitPowerMW ?? 0) * (quote.equipment.generators.quantity ?? 0) * 1000 : 0;
          
          return (
            <div
              key={tier.tierKey}
              className={`
                relative rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                ${tier.config.cardBorder} ${tier.config.cardBg}
                ${isSelected ? 'ring-2 ring-purple-400/60 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : ''}
                ${isRecommended && !isSelected ? 'ring-1 ring-purple-500/30 shadow-[0_0_16px_rgba(139,92,246,0.1)]' : ''}
              `}
              onClick={() => handleSelectTier(tier.tierKey)}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
              )}

              <div className="p-5">
                {/* Recommended tag */}
                {isRecommended && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 rounded-full text-purple-300 text-[11px] font-bold mb-3">
                    ⭐ Recommended
                  </div>
                )}

                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-7 h-7 border-2 border-purple-400 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-purple-400" />
                  </div>
                )}

                {/* Tier Name + Tagline */}
                <h3 className={`${tier.config.headlineClass} mb-1 leading-tight`}>
                  {tier.config.name}
                </h3>
                <p className="text-slate-500 text-xs font-medium mb-4">{tier.config.tagline}</p>

                {/* Annual Savings - HERO */}
                <div className="mb-4 p-3 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                  <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-widest mb-1">Annual Savings</div>
                  <div className={`text-2xl lg:text-3xl font-black ${tier.config.accentColor} leading-none`}>
                    {formatCurrency(quote.financials?.annualSavings)}
                    <span className="text-sm text-slate-600 font-semibold ml-1">/yr</span>
                  </div>
                </div>

                {/* Equipment Summary */}
                <div className="space-y-1.5 mb-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Equipment</div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Battery className="w-3 h-3" /> Battery
                    </span>
                    <span className="text-white font-semibold tabular-nums">
                      {formatNumber(Math.round(bessKWh))} kWh / {formatNumber(Math.round(bessKW))} kW
                    </span>
                  </div>
                  
                  {(batteries?.quantity ?? 0) > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3 h-3" /> Duration
                      </span>
                      <span className="text-white font-semibold tabular-nums">
                      {safeFixed(baseDuration, 1)} hours
                      </span>
                    </div>
                  )}
                  
                  {solarKW > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Sun className="w-3 h-3" /> Solar
                      </span>
                      <span className="text-white font-semibold tabular-nums">
                        {formatNumber(Math.round(solarKW))} kW
                      </span>
                    </div>
                  )}
                  
                  {genKW > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Fuel className="w-3 h-3" /> Generator
                      </span>
                      <span className="text-white font-semibold tabular-nums">
                        {formatNumber(Math.round(genKW))} kW
                      </span>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="space-y-1.5 mb-4 pb-4 border-b border-white/[0.06]">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Financials</div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Investment</span>
                    <span className="text-white font-semibold tabular-nums">{formatCurrency(quote.costs?.totalProjectCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Federal ITC</span>
                    <span className="text-green-400 font-semibold tabular-nums">−{formatCurrency(quote.costs?.taxCredit)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white">Net Cost</span>
                    <span className="text-white tabular-nums">{formatCurrency(quote.costs?.netCost)}</span>
                  </div>
                </div>

                {/* ROI Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">Payback</div>
                    <div className={`text-sm font-black ${tier.config.accentColor}`}>
                      {safeFixed(quote.financials?.paybackYears, 1)}y
                    </div>
                  </div>
                  <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">10yr ROI</div>
                    <div className={`text-sm font-black ${tier.config.accentColor}`}>
                      {safeFixed(quote.financials?.roi10Year, 0)}%
                    </div>
                  </div>
                  <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">25yr ROI</div>
                    <div className={`text-sm font-black ${tier.config.accentColor}`}>
                      {safeFixed(quote.financials?.roi25Year, 0)}%
                    </div>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  className={`
                    w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all
                    ${tier.config.buttonClass}
                    ${isSelected ? 'opacity-100' : 'opacity-90 hover:opacity-100'}
                  `}
                >
                  {isSelected ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Selected
                    </span>
                  ) : (
                    `Select ${tier.config.name}`
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* TrueQuote Badge — clickable, opens proof modal */}
      <div className="flex justify-center">
        <TrueQuoteBadgeCanonical
          onClick={() => setShowTrueQuoteModal(true)}
          showTooltip={true}
        />
      </div>

      {/* Equipment Legend */}
      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><Battery className="w-3 h-3" /> BESS</span>
          {data.addOns.includeSolar && <span className="flex items-center gap-1.5"><Sun className="w-3 h-3" /> Solar</span>}
          {data.addOns.includeGenerator && <span className="flex items-center gap-1.5"><Fuel className="w-3 h-3" /> Generator</span>}
        </div>
      </div>

      {/* ✅ No in-page footer buttons — the shell's bottom nav handles Back/Continue */}
    </div>
  );
}
