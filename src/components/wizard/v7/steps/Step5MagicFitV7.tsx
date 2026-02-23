/**
 * Step 5: MagicFit V7 - 3-Tier System Recommendations
 *
 * Created: February 10, 2026
 * Updated: February 18, 2026 — ZERO-DB-CALL refactor
 *
 * ─── KEY INSIGHT ───
 * Step 4's pricing pipeline (`runPricingSafe`) already computed a full quote
 * and stored it in `state.quote` with `pricingComplete: true`.  That quote
 * is the **PerfectFit (1.0x)** base.  Starter and BeastMode are derived by
 * pure-math scaling — no Supabase calls, no `calculateQuote()` calls.
 *
 * This eliminates:
 * - 3 redundant `calculateQuote()` DB round-trips on mount
 * - The double-render bug (handleSelectTier → updateQuote → useMerlinData
 *   sees new bessKW → fingerprint changes → generateTiers fires AGAIN)
 *
 * Fallback: If `state.quote.pricingComplete` is false (Step 4 pricing failed),
 * we make ONE `calculateQuote()` call for PerfectFit and derive the other two.
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Check, Loader2, AlertTriangle, Battery, Sun, Fuel, Clock, Shield } from "lucide-react";
import type {
  WizardState as WizardV7State,
  EnergyGoal,
  WizardStep,
  QuoteOutput,
} from "@/wizard/v7/hooks/useWizardV7";
import TrueQuoteFinancialModal from "@/components/wizard/v7/shared/TrueQuoteFinancialModal";
import badgeGoldIcon from "@/assets/images/badge_gold_icon.jpg";
import { devLog, devError } from '@/wizard/v7/debug/devLog';

// SSOT calculation engine — only used as fallback when Step 4 pricing is missing
import { calculateQuote } from "@/services/unifiedQuoteCalculator";
import { applyMarginToQuote, getSizingDefaults } from "@/wizard/v7/pricing/pricingBridge";
import { useMerlinData } from "@/wizard/v7/memory/useMerlinData";
import { getFacilityConstraints } from "@/services/useCasePowerCalculations";
import type { QuoteResult } from "@/services/unifiedQuoteCalculator";
import type { TierKey, TierConfig, TierQuote, MarginData, QuoteWithMargin } from "./step5Utils";
import { TIER_CONFIG, formatCurrency, formatNumber, safeFixed, getIndustryLabel, getGoalBasedMultipliers, scaleTier, buildQuoteResultFromState } from "./step5Utils";

interface Props {
  state: WizardV7State;
  actions?: {
    goBack?: () => void;
    goToStep?: (step: WizardStep) => void;
    updateQuote?: (quote: Partial<QuoteOutput>) => void;
  };
}


export default function Step5MagicFitV7({ state, actions }: Props) {
  const [tiers, setTiers] = useState<TierQuote[]>([]);
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);

  // ✅ MERLIN MEMORY: Read cross-step data from Memory first, fall back to state
  const data = useMerlinData(state);

  // ══════════════════════════════════════════════════════════════════════════
  // SNAPSHOT: Freeze all sizing inputs at mount time.
  // handleSelectTier → updateQuote changes state.quote.bessKW, which would
  // change useMerlinData's return value → trigger re-render → re-generation.
  // We snapshot once and use the ref for all tier derivation.
  // ══════════════════════════════════════════════════════════════════════════
  const snapshotRef = useRef<{
    frozen: boolean;
    rawBESSKW: number;
    ssotDuration: number;
    solarKW: number;
    generatorKW: number;
    windKW: number;
    location: string;
    utilityRate: number;
    demandCharge: number;
    industry: string;
    goals: EnergyGoal[];
    addOns: typeof data.addOns;
    roofSolarKW: number; // From solar sizing modal (roof-only portion)
    stateQuote: QuoteOutput | undefined;
    stateQuoteMargin: QuoteOutput["margin"] | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }>({ frozen: false } as any);

  // Only capture on FIRST render (frozen === false)
  if (!snapshotRef.current.frozen) {
    const rawBESSKW =
      data.bessKW > 0 ? data.bessKW : data.peakLoadKW || state?.quote?.peakLoadKW || 200;
    // ✅ FIX Feb 2026: Use industry-specific duration defaults (car wash = 2h, hotel = 4h)
    // instead of hardcoded 4h which doubles energy storage cost for short-duration industries.
    const industryDefaults = getSizingDefaults(data.industry || "commercial");
    const ssotDuration = data.durationHours > 0 ? data.durationHours : industryDefaults.hours;

    snapshotRef.current = {
      frozen: true,
      rawBESSKW,
      ssotDuration,
      solarKW: data.addOns.includeSolar
        ? data.addOns.solarKW > 0
          ? data.addOns.solarKW
          : rawBESSKW * 0.5
        : 0,
      generatorKW: data.addOns.includeGenerator
        ? data.addOns.generatorKW > 0
          ? data.addOns.generatorKW
          : rawBESSKW * 0.75
        : 0,
      windKW: data.addOns.includeWind
        ? data.addOns.windKW > 0
          ? data.addOns.windKW
          : rawBESSKW * 0.3
        : 0,
      location: data.location.state || "CA",
      utilityRate: data.utilityRate || 0.12,
      demandCharge: data.demandCharge || 0,
      industry: data.industry || "commercial",
      goals: data.goals as EnergyGoal[],
      addOns: { ...data.addOns },
      roofSolarKW: Number(
        (state as Record<string, unknown>)?.step3Answers &&
        ((state as Record<string, unknown>).step3Answers as Record<string, unknown>)?.roofSolarKW
      ) || 0,
      stateQuote: state?.quote ? { ...state.quote } : undefined,
      stateQuoteMargin: state?.quote?.margin ? { ...state.quote.margin } : undefined,
    };
  }

  const snap = snapshotRef.current;

  // Apply goal-based intelligence to sizing (from frozen snapshot)
  const goalModifiers = useMemo(
    () => getGoalBasedMultipliers(snap.goals),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Never recompute — goals are frozen at mount
  );

  // ── Stabilize derived sizing from frozen snapshot ──
  const baseBESSKW = snap.rawBESSKW * goalModifiers.bessMultiplier;
  const baseDuration = snap.ssotDuration * goalModifiers.durationMultiplier;

  // Solar: apply goal multiplier BUT cap to physical building constraints
  // Vineet: "Solar 165kW will not fit in an automated car wash" — enforce realistic limits
  const uncappedSolarKW = snap.solarKW * goalModifiers.solarMultiplier;
  const facilityConstraints = getFacilityConstraints(snap.industry);
  const maxPhysicalSolarKW = facilityConstraints?.totalRealisticSolarKW ?? Infinity;
  const baseSolarKW = Math.min(uncappedSolarKW, maxPhysicalSolarKW);
  if (uncappedSolarKW > maxPhysicalSolarKW) {
    devLog(`[Step5 MagicFit] Solar capped from ${Math.round(uncappedSolarKW)} kW to ${maxPhysicalSolarKW} kW (${snap.industry} building constraint)`);
  }

  const baseGeneratorKW = snap.generatorKW * goalModifiers.generatorMultiplier;
  const baseWindKW = snap.windKW * goalModifiers.solarMultiplier;

  // ══════════════════════════════════════════════════════════════════════════
  // TIER GENERATION — runs ONCE on mount, zero DB calls if Step 4 pricing exists
  // ══════════════════════════════════════════════════════════════════════════
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Run exactly ONCE
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    let cancelled = false;

    async function generateTiers() {
      setIsLoading(true);
      setLoadError(null);

      const sq = snap.stateQuote;
      const hasPricing = sq?.pricingComplete === true && (sq.grossCost ?? 0) > 0;

      devLog("[Step5 MagicFit] generateTiers starting (zero-DB-call path)", {
        hasPricingFromStep4: hasPricing,
        baseBESSKW,
        baseDuration,
        baseSolarKW,
        baseGeneratorKW,
        baseWindKW,
        location: snap.location,
        utilityRate: snap.utilityRate,
        demandCharge: snap.demandCharge,
        industry: snap.industry,
        goals: snap.goals,
        stateQuote: sq
          ? {
              grossCost: sq.grossCost,
              annualSavingsUSD: sq.annualSavingsUSD,
              bessKW: sq.bessKW,
              pricingComplete: sq.pricingComplete,
            }
          : null,
      });

      try {
        let baseQuoteResult: QuoteResult;
        let baseMargin: {
          sellPriceTotal: number;
          baseCostTotal: number;
          marginDollars: number;
          marginPercent: number;
          marginBand: string;
          itcRate: number;
          itcAmount: number;
          netCost: number;
        } | null;

        if (hasPricing && sq) {
          // ═══════════════════════════════════════════════════════════════
          // FAST PATH: Build QuoteResult from state.quote (no DB call!)
          // Step 4's runPricingSafe already computed everything we need.
          // ═══════════════════════════════════════════════════════════════
          devLog("[Step5 MagicFit] ✅ Using Step 4 cached quote (zero DB calls)");
          baseQuoteResult = buildQuoteResultFromState(sq, data);

          // Reconstruct margin from state.quote.margin
          const m = snap.stateQuoteMargin;
          baseMargin = m
            ? {
                sellPriceTotal: m.sellPriceTotal,
                baseCostTotal: m.baseCostTotal,
                marginDollars: m.marginDollars,
                marginPercent: m.marginPercent,
                marginBand: m.marginBand,
                itcRate: sq.itcRate ?? 0.3,
                itcAmount: sq.itcAmount ?? m.sellPriceTotal * (sq.itcRate ?? 0.3),
                netCost:
                  m.sellPriceTotal - (sq.itcAmount ?? m.sellPriceTotal * (sq.itcRate ?? 0.3)),
              }
            : null;
        } else {
          // ═══════════════════════════════════════════════════════════════
          // FALLBACK: Step 4 pricing missing — make ONE calculateQuote call
          // for PerfectFit base, then derive others with pure math.
          // ═══════════════════════════════════════════════════════════════
          devLog(
            "[Step5 MagicFit] ⚠️ No Step 4 pricing — falling back to single calculateQuote call"
          );

          const PER_TIER_TIMEOUT_MS = 20_000;
          let timer: ReturnType<typeof setTimeout> | undefined;

          const quotePromise = calculateQuote({
            storageSizeMW: baseBESSKW / 1000,
            durationHours: baseDuration,
            location: snap.location,
            zipCode: "",
            electricityRate: snap.utilityRate,
            demandCharge: snap.demandCharge || undefined,
            useCase: snap.industry.replace(/_/g, "-"),
            solarMW: baseSolarKW / 1000,
            windMW: baseWindKW / 1000,
            generatorMW: baseGeneratorKW / 1000,
            generatorFuelType: (snap.addOns.generatorFuelType || "natural-gas") as
              | "diesel"
              | "natural-gas"
              | "dual-fuel",
            gridConnection: "on-grid",
            batteryChemistry: "lfp",
          });

          const timeoutPromise = new Promise<never>((_, reject) => {
            timer = setTimeout(
              () =>
                reject(
                  new Error(`PerfectFit fallback timed out after ${PER_TIER_TIMEOUT_MS / 1000}s`)
                ),
              PER_TIER_TIMEOUT_MS
            );
          });

          baseQuoteResult = await Promise.race([quotePromise, timeoutPromise]);
          clearTimeout(timer);

          // Apply margin to the fresh quote
          const energyMWh = (baseBESSKW / 1000) * baseDuration;
          const marginResult = applyMarginToQuote(baseQuoteResult, energyMWh);
          const itcRate = baseQuoteResult.benchmarkAudit?.assumptions?.itcRate ?? 0.3;
          const sellPriceTotal = marginResult.sellPriceTotal;
          const itcAmount = sellPriceTotal * itcRate;

          baseMargin = {
            sellPriceTotal,
            baseCostTotal: marginResult.baseCostTotal,
            marginDollars: marginResult.totalMarginDollars,
            marginPercent: marginResult.blendedMarginPercent,
            marginBand: marginResult.marginBandDescription,
            itcRate,
            itcAmount,
            netCost: sellPriceTotal - itcAmount,
          };
        }

        if (cancelled) return;

        // ═══════════════════════════════════════════════════════════════════
        // DERIVE ALL 3 TIERS from the single base using pure math
        // ═══════════════════════════════════════════════════════════════════
        const results: TierQuote[] = [];
        const maxRoofMW = snap.roofSolarKW > 0 ? snap.roofSolarKW / 1000 : undefined;
        // Physical solar cap from INDUSTRY_FACILITY_CONSTRAINTS (prevents oversizing)
        const maxTotalSolarMW = maxPhysicalSolarKW < Infinity ? maxPhysicalSolarKW / 1000 : undefined;
        for (const tierKey of ["starter", "perfectFit", "beastMode"] as const) {
          results.push(
            scaleTier(baseQuoteResult, tierKey, TIER_CONFIG[tierKey], baseDuration, baseMargin, maxRoofMW, maxTotalSolarMW)
          );
        }

        if (!cancelled) {
          devLog(
            "[Step5 MagicFit] All 3 tiers derived (zero extra DB calls):",
            results.map((r) => ({
              tier: r.tierKey,
              annualSavings: r.quote?.financials?.annualSavings,
              totalCost: r.quote?.costs?.totalProjectCost,
              payback: r.quote?.financials?.paybackYears,
            }))
          );
          setTiers(results);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          devError("[Step5 MagicFit] generateTiers failed:", msg);
          setLoadError(msg);
          setIsLoading(false);
        }
      }
    }

    generateTiers();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONCE on mount — all inputs frozen in snapshotRef

  const handleSelectTier = (tierKey: TierKey) => {
    setSelectedTier(tierKey);

    // Store selected tier quote into wizard state so Step 6 Results shows correct numbers
    const tierData = tiers.find((t) => t.tierKey === tierKey);
    if (tierData?.quote && actions?.updateQuote) {
      const eq = tierData.quote.equipment;
      const batt = eq?.batteries;
      const bessKWh = batt ? (batt.unitEnergyMWh ?? 0) * (batt.quantity ?? 0) * 1000 : 0;
      const bessKW = batt ? (batt.unitPowerMW ?? 0) * (batt.quantity ?? 0) * 1000 : 0;
      const solarKW = eq?.solar ? (eq.solar.totalMW ?? 0) * 1000 : 0;
      const genKW = eq?.generators
        ? (eq.generators.unitPowerMW ?? 0) * (eq.generators.quantity ?? 0) * 1000
        : 0;

      // Use margin-adjusted pricing (sell price) when available
      const margin = (tierData.quote as QuoteWithMargin)?._margin;
      const grossCost = margin?.sellPriceTotal ?? tierData.quote.costs?.totalProjectCost ?? 0;
      const itcAmount = margin?.itcAmount ?? grossCost * 0.3;
      const netCost = margin?.netCost ?? grossCost - itcAmount;
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
          : (tierData.quote.financials?.paybackYears ?? 0),
        npv: tierData.quote.financials?.npv ?? undefined,
        irr: tierData.quote.financials?.irr ?? undefined,
        paybackYears: tierData.quote.financials?.paybackYears ?? 0,
        durationHours: baseDuration,
        pricingComplete: true,
        notes: [
          `MagicFit tier: ${TIER_CONFIG[tierKey].name} (${TIER_CONFIG[tierKey].multiplier}x)`,
          ...(margin
            ? [`Margin: ${margin.marginBand} (${(margin.marginPercent * 100).toFixed(1)}%)`]
            : []),
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
              <p className="text-slate-300 text-base font-semibold mb-2">
                Couldn't generate options
              </p>
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
              <p className="text-slate-300 text-base font-medium">
                Generating your custom system options...
              </p>
              <p className="text-slate-500 text-sm mt-2">Analyzing facility profile and goals</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Build equipment summary for the selected tier (or perfectFit as default)
  const _summaryTier = tiers.find((t) => t.tierKey === (selectedTier || "perfectFit"));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* TrueQuote Financial Modal — full ROI, 10yr cashflow, sensitivity */}
      {(() => {
        const modalTier = tiers.find((t) => t.tierKey === (selectedTier || "perfectFit"));
        const mq = modalTier?.quote;
        const mm = (mq as QuoteWithMargin)?._margin;
        return (
          <TrueQuoteFinancialModal
            isOpen={showTrueQuoteModal}
            onClose={() => setShowTrueQuoteModal(false)}
            totalInvestment={mm?.sellPriceTotal ?? mq?.costs?.totalProjectCost ?? 0}
            federalITC={mm?.itcAmount ?? mq?.costs?.taxCredit ?? 0}
            netInvestment={mm?.netCost ?? mq?.costs?.netCost ?? 0}
            annualSavings={mq?.financials?.annualSavings ?? 0}
            bessKWh={
              mq?.equipment?.batteries
                ? (mq.equipment.batteries.unitEnergyMWh ?? 0) *
                  (mq.equipment.batteries.quantity ?? 0) *
                  1000
                : 0
            }
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
            <span className="text-xs font-semibold text-amber-500/70 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Verified
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-snug">
            Every number is sourced. Click to view full financial projection, ROI analysis, and
            payback timeline.
          </p>
        </div>

        {/* Arrow */}
        <div className="shrink-0 text-amber-500/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Inline guidance */}
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-slate-400">
          Three system options for your{" "}
          <span className="text-slate-200 font-medium">{getIndustryLabel(data.industry)}</span>{" "}
          facility
          <span className="text-slate-500"> · sized by Merlin based on your profile and goals</span>
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
          const isRecommended = tier.tierKey === "perfectFit";

          if (tier.error) {
            return (
              <div
                key={tier.tierKey}
                className={`p-5 rounded-xl border ${tier.config.cardBorder} ${tier.config.cardBg}`}
              >
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
          const bessKWh = batteries
            ? (batteries.unitEnergyMWh ?? 0) * (batteries.quantity ?? 0) * 1000
            : 0;
          const bessKW = batteries
            ? (batteries.unitPowerMW ?? 0) * (batteries.quantity ?? 0) * 1000
            : 0;
          const solarKW = quote.equipment?.solar ? (quote.equipment.solar.totalMW ?? 0) * 1000 : 0;
          const genKW = quote.equipment?.generators
            ? (quote.equipment.generators.unitPowerMW ?? 0) *
              (quote.equipment.generators.quantity ?? 0) *
              1000
            : 0;

          return (
            <div
              key={tier.tierKey}
              className={`
                relative rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                ${tier.config.cardBorder} ${tier.config.cardBg}
                ${isSelected ? "ring-2 ring-[#3ECF8E]/50" : ""}
                ${isRecommended && !isSelected ? "ring-1 ring-[#3ECF8E]/20" : ""}
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
                  <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-widest mb-1">
                    Annual Savings
                  </div>
                  <div
                    className={`text-2xl lg:text-3xl font-bold ${tier.config.accentColor} leading-none`}
                  >
                    {formatCurrency(quote.financials?.annualSavings)}
                    <span className="text-sm text-slate-600 font-semibold ml-1">/yr</span>
                  </div>
                </div>

                {/* Equipment Summary */}
                <div className="space-y-1.5 mb-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Equipment
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Battery className="w-3 h-3" /> Battery
                    </span>
                    <span className="text-white font-semibold tabular-nums">
                      {formatNumber(Math.round(bessKWh))} kWh / {formatNumber(Math.round(bessKW))}{" "}
                      kW
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
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Financials
                  </div>
                  {(() => {
                    const m = (quote as QuoteWithMargin)?._margin;
                    const investment = m?.sellPriceTotal ?? quote.costs?.totalProjectCost ?? 0;
                    const itc = m?.itcAmount ?? quote.costs?.taxCredit ?? 0;
                    const net = m?.netCost ?? quote.costs?.netCost ?? 0;
                    return (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Investment</span>
                          <span className="text-white font-semibold tabular-nums">
                            {formatCurrency(investment)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Federal ITC</span>
                          <span className="text-green-400 font-semibold tabular-nums">
                            −{formatCurrency(itc)}
                          </span>
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
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4">
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
                    <div className="text-[10px] text-slate-500 font-medium">5yr ROI</div>
                    <div className={`text-sm font-bold ${tier.config.accentColor}`}>
                      {safeFixed(quote.financials?.roi5Year, 0)}%
                    </div>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  className={`
                    w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all
                    ${tier.config.buttonClass}
                    ${isSelected ? "opacity-100" : "opacity-90 hover:opacity-100"}
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
          <span className="flex items-center gap-1.5">
            <Battery className="w-3 h-3" /> BESS
          </span>
          {data.addOns.includeSolar && (
            <span className="flex items-center gap-1.5">
              <Sun className="w-3 h-3" /> Solar
            </span>
          )}
          {data.addOns.includeGenerator && (
            <span className="flex items-center gap-1.5">
              <Fuel className="w-3 h-3" /> Generator
            </span>
          )}
        </div>
      </div>

      {/* ✅ No in-page footer buttons — the shell's bottom nav handles Back/Continue */}
    </div>
  );
}

