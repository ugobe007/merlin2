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
import TrueQuoteFinancialModal from '@/components/wizard/v7/shared/TrueQuoteFinancialModal';
import badgeGoldIcon from '@/assets/images/badge_gold_icon.jpg';

// SSOT calculation engine
import { calculateQuote } from '@/services/unifiedQuoteCalculator';
import { applyMarginToQuote } from '@/wizard/v7/pricing/pricingBridge';
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
    headlineClass: 'text-2xl lg:text-3xl font-bold tracking-tight text-white',
    cardBorder: 'border-white/[0.06]',
    cardBg: 'bg-white/[0.02]',
    accentColor: 'text-emerald-400',
    buttonClass: 'text-slate-300 bg-transparent border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.04]',
  },
  perfectFit: {
    name: 'PERFECT FIT',
    tagline: 'Best Value',
    multiplier: 1.0,
    solarMultiplier: 1.0,
    genMultiplier: 1.0,
    headlineClass: 'text-2xl lg:text-3xl font-bold tracking-tight text-white',
    cardBorder: 'border-[#3ECF8E]/30',
    cardBg: 'bg-white/[0.03]',
    accentColor: 'text-[#3ECF8E]',
    buttonClass: 'text-[#0D0D0D] bg-[#3ECF8E] hover:bg-[#3ECF8E]/90',
  },
  beastMode: {
    name: 'BEAST MODE',
    tagline: 'Full Power',
    multiplier: 1.4,
    solarMultiplier: 1.5,
    genMultiplier: 1.25,
    headlineClass: 'text-2xl lg:text-3xl font-bold tracking-tight text-white',
    cardBorder: 'border-white/[0.06]',
    cardBg: 'bg-white/[0.02]',
    accentColor: 'text-amber-400',
    buttonClass: 'text-slate-300 bg-transparent border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.04]',
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

  // ✅ FIX (Feb 15, 2026): Use SSOT-computed BESS sizing from pricing pipeline.
  // data.bessKW already has the industry sizing ratio applied (e.g., 0.4× for gas station peak shaving).
  // Only fall back to raw peakLoadKW if pricing hasn't completed yet (bessKW = 0).
  const rawBESSKW = data.bessKW > 0 ? data.bessKW : (data.peakLoadKW || state?.quote?.peakLoadKW || 200);

  // ✅ FIX: Use SSOT industry-specific duration (gas_station=2h, hotel=4h, data_center=4h, etc.)
  // data.durationHours comes from state.quote.durationHours set by pricingBridge sizingHints.
  const ssotDuration = data.durationHours > 0 ? data.durationHours : 4;

  // Apply goal-based intelligence to sizing
  const goalModifiers = getGoalBasedMultipliers(data.goals as EnergyGoal[]);

  const baseBESSKW = rawBESSKW * goalModifiers.bessMultiplier;
  const baseDuration = ssotDuration * goalModifiers.durationMultiplier;
  const baseBESSKWh = baseBESSKW * baseDuration;
  // ✅ FIX: Use Step 4 user inputs when available, fall back to proportional sizing
  const baseSolarKW = data.addOns.includeSolar
    ? (data.addOns.solarKW > 0 ? data.addOns.solarKW : rawBESSKW * 0.5) * goalModifiers.solarMultiplier
    : 0;
  const baseGeneratorKW = data.addOns.includeGenerator
    ? (data.addOns.generatorKW > 0 ? data.addOns.generatorKW : rawBESSKW * 0.75) * goalModifiers.generatorMultiplier
    : 0;
  const baseWindKW = data.addOns.includeWind
    ? (data.addOns.windKW > 0 ? data.addOns.windKW : rawBESSKW * 0.3) * goalModifiers.solarMultiplier
    : 0;

  useEffect(() => {
    let cancelled = false;

    async function generateTiers() {
      setIsLoading(true);
      setLoadError(null);

      console.log('[Step5 MagicFit] generateTiers starting', {
        rawBESSKW,
        ssotBESSKW: data.bessKW,
        ssotDuration: data.durationHours,
        baseBESSKW,
        baseDuration,
        baseSolarKW,
        baseGeneratorKW,
        baseWindKW,
        location: data.location.state,
        utilityRate: data.utilityRate,
        demandCharge: data.demandCharge,
        industry: data.industry,
        goals: data.goals,
        addOns: data.addOns,
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
            const windKW = baseWindKW * config.solarMultiplier;

            console.log(`[Step5 MagicFit] Calling calculateQuote for ${tierKey}`, {
              storageSizeMW: bessKW / 1000,
              durationHours: baseDuration,
              solarMW: solarKW / 1000,
              windMW: windKW / 1000,
              generatorMW: generatorKW / 1000,
            });

            // Call SSOT calculateQuote with tier-specific sizing
            // ⚠️ Do NOT hardcode itcConfig — let calculateQuote use smart defaults:
            //   - Systems < 1 MW get automatic 30% ITC
            //   - Systems ≥ 1 MW auto-enable prevailing wage for 30% ITC
            //   This prevents the 6% vs 30% ITC cliff between tiers.
            const quote = await calculateQuote({
              storageSizeMW: bessKW / 1000,
              durationHours: baseDuration,
              location: data.location.state || 'CA',
              zipCode: data.location.zip || '',
              electricityRate: data.utilityRate || 0.12,
              demandCharge: data.demandCharge || undefined,
              useCase: (data.industry || 'commercial').replace(/_/g, '-'),
              solarMW: solarKW / 1000,
              windMW: windKW / 1000,
              generatorMW: generatorKW / 1000,
              generatorFuelType: data.addOns.generatorFuelType || 'natural-gas',
              gridConnection: 'on-grid',
              batteryChemistry: 'lfp',
            });

            // ═══════════════════════════════════════════════════════════
            // Apply Margin Policy (Feb 2026)
            // Every customer-facing quote must include Merlin margin.
            // ═══════════════════════════════════════════════════════════
            const energyMWh = (bessKW / 1000) * baseDuration;
            const marginResult = applyMarginToQuote(quote, energyMWh);

            // Attach margin-adjusted costs to quote for downstream use
            const itcRate = quote.benchmarkAudit?.assumptions?.itcRate ?? 0.3;
            const sellPriceTotal = marginResult.sellPriceTotal;
            const itcAmount = sellPriceTotal * itcRate;
            const netCost = sellPriceTotal - itcAmount;

            // Augment quote.costs with margin so handleSelectTier gets sell prices
            (quote as any)._margin = {
              sellPriceTotal,
              baseCostTotal: marginResult.baseCostTotal,
              marginDollars: marginResult.totalMarginDollars,
              marginPercent: marginResult.blendedMarginPercent,
              marginBand: marginResult.marginBandDescription,
              itcRate,
              itcAmount,
              netCost,
            };

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
  }, [baseBESSKW, baseBESSKWh, baseSolarKW, baseGeneratorKW, baseWindKW, baseDuration, data.location.state, data.utilityRate, data.demandCharge, data.industry]);

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

      // Use margin-adjusted pricing (sell price) when available
      const margin = (tierData.quote as any)?._margin;
      const grossCost = margin?.sellPriceTotal ?? tierData.quote.costs?.totalProjectCost ?? 0;
      const itcAmount = margin?.itcAmount ?? grossCost * 0.3;
      const netCost = margin?.netCost ?? (grossCost - itcAmount);
      const itcRate = margin?.itcRate ?? 0.3;

      actions.updateQuote({
        bessKWh,
        bessKW,
        solarKW,
        generatorKW: genKW,
        capexUSD: netCost,
        grossCost,
        itcAmount,
        itcRate,
        annualSavingsUSD: tierData.quote.financials?.annualSavings ?? 0,
        roiYears: tierData.quote.financials?.annualSavings
          ? Math.min(netCost / tierData.quote.financials.annualSavings, 99)
          : tierData.quote.financials?.paybackYears ?? 0,
        npv: tierData.quote.financials?.npv ?? undefined,
        irr: tierData.quote.financials?.irr ?? undefined,
        paybackYears: tierData.quote.financials?.paybackYears ?? 0,
        durationHours: baseDuration,
        pricingComplete: true,
        notes: [
          `MagicFit tier: ${TIER_CONFIG[tierKey].name} (${TIER_CONFIG[tierKey].multiplier}x)`,
          ...(margin ? [`Margin: ${margin.marginBand} (${(margin.marginPercent * 100).toFixed(1)}%)`] : []),
        ],
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
              <Loader2 className="w-10 h-10 text-slate-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-300 text-base font-medium">Generating your custom system options...</p>
              <p className="text-slate-500 text-sm mt-2">Analyzing facility profile and goals</p>
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
      {/* TrueQuote Financial Modal — full ROI, 10yr cashflow, sensitivity */}
      {(() => {
        const modalTier = tiers.find(t => t.tierKey === (selectedTier || 'perfectFit'));
        const mq = modalTier?.quote;
        const mm = (mq as any)?._margin;
        return (
          <TrueQuoteFinancialModal
            isOpen={showTrueQuoteModal}
            onClose={() => setShowTrueQuoteModal(false)}
            totalInvestment={mm?.sellPriceTotal ?? mq?.costs?.totalProjectCost ?? 0}
            federalITC={mm?.itcAmount ?? mq?.costs?.taxCredit ?? 0}
            netInvestment={mm?.netCost ?? mq?.costs?.netCost ?? 0}
            annualSavings={mq?.financials?.annualSavings ?? 0}
            bessKWh={mq?.equipment?.batteries ? (mq.equipment.batteries.unitEnergyMWh ?? 0) * (mq.equipment.batteries.quantity ?? 0) * 1000 : 0}
            solarKW={mq?.equipment?.solar ? (mq.equipment.solar.totalMW ?? 0) * 1000 : 0}
            industry={getIndustryLabel(data.industry)}
            location={data.location.state}
          />
        );
      })()}

      {/* ✅ TrueQuote Hero Badge — large, gold, unmissable */}
      <button
        type="button"
        onClick={() => setShowTrueQuoteModal(true)}
        className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-400/50 hover:bg-amber-500/[0.08] transition-all duration-300 cursor-pointer"
        aria-label="Open TrueQuote financial summary"
      >
        {/* Gold Shield Image */}
        <div className="shrink-0 relative">
          <img
            src={badgeGoldIcon}
            alt="TrueQuote Verified"
            className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Badge Text */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl font-bold text-amber-400 tracking-tight">TrueQuote™</span>
            <span className="text-xs font-semibold text-amber-500/70 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Verified</span>
          </div>
          <p className="text-sm text-slate-400 leading-snug">
            Every number is sourced. Click to view full financial projection, ROI analysis, and payback timeline.
          </p>
        </div>

        {/* Arrow */}
        <div className="shrink-0 text-amber-500/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Inline guidance */}
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-slate-400">
          Three system options for your{" "}
          <span className="text-slate-200 font-medium">{getIndustryLabel(data.industry)}</span> facility
          <span className="text-slate-500">{" "}· sized by Merlin based on your profile and goals</span>
        </p>

        {/* Goal-based sizing hints */}
        {goalModifiers.goalHints.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {goalModifiers.goalHints.map((hint, idx) => (
              <span key={idx} className="text-xs text-[#3ECF8E]/80">
                {hint}
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
                ${isSelected ? 'ring-2 ring-[#3ECF8E]/50' : ''}
                ${isRecommended && !isSelected ? 'ring-1 ring-[#3ECF8E]/20' : ''}
              `}
              onClick={() => handleSelectTier(tier.tierKey)}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-px left-0 right-0 h-1 bg-[#3ECF8E]" />
              )}

              <div className="p-5">
                {/* Recommended tag */}
                {isRecommended && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 rounded-full text-[#3ECF8E] text-[11px] font-semibold mb-3">
                    Recommended
                  </div>
                )}

                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-7 h-7 border-2 border-[#3ECF8E] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-[#3ECF8E]" />
                  </div>
                )}

                {/* TrueQuote verified label */}
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-2">
                  <Shield className="w-3 h-3 text-amber-500" />
                  <span className="text-amber-400 font-semibold">TrueQuote™</span>
                  <span>verified</span>
                </div>

                {/* Tier Name + Tagline */}
                <h3 className={`${tier.config.headlineClass} mb-1 leading-tight`}>
                  {tier.config.name}
                </h3>
                <p className="text-slate-500 text-xs font-medium mb-4">{tier.config.tagline}</p>

                {/* Annual Savings - HERO */}
                <div className="mb-4 p-3 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                  <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-widest mb-1">Annual Savings</div>
                  <div className={`text-2xl lg:text-3xl font-bold ${tier.config.accentColor} leading-none`}>
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
                  {(() => {
                    const m = (quote as any)?._margin;
                    const investment = m?.sellPriceTotal ?? quote.costs?.totalProjectCost ?? 0;
                    const itc = m?.itcAmount ?? quote.costs?.taxCredit ?? 0;
                    const net = m?.netCost ?? quote.costs?.netCost ?? 0;
                    return (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Investment</span>
                          <span className="text-white font-semibold tabular-nums">{formatCurrency(investment)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Federal ITC</span>
                          <span className="text-green-400 font-semibold tabular-nums">−{formatCurrency(itc)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-white">Net Cost</span>
                          <span className="text-white tabular-nums">{formatCurrency(net)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* ROI Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">Payback</div>
                    <div className={`text-sm font-bold ${tier.config.accentColor}`}>
                      {safeFixed(quote.financials?.paybackYears, 1)}y
                    </div>
                  </div>
                  <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">10yr ROI</div>
                    <div className={`text-sm font-bold ${tier.config.accentColor}`}>
                      {safeFixed(quote.financials?.roi10Year, 0)}%
                    </div>
                  </div>
                  <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">25yr ROI</div>
                    <div className={`text-sm font-bold ${tier.config.accentColor}`}>
                      {safeFixed(quote.financials?.roi25Year, 0)}%
                    </div>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  className={`
                    w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all
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
