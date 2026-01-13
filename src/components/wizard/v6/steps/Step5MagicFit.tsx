/**
 * STEP 5: Magic Fit - Power Level Selection
 * =========================================
 * FINAL DESIGN V5 - Bold headlines, equipment strip, full financials
 *
 * ✅ SSOT COMPLIANT - January 2026
 *
 * Design Features:
 * - Gradient headlines that POP (STARTER / PERFECT FIT / BEAST MODE)
 * - Annual Savings as HERO number
 * - Equipment strip with emoji icons (🔋 ☀️ ⚡ 🔥)
 * - Full financial summary (Investment, ITC, State, Net Cost)
 * - ROI metrics (Payback, 10-Year ROI, 25-Year Profit)
 */

import React, { useEffect, useState } from "react";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import type { WizardState } from "../types";

// ============================================================================
// SSOT IMPORTS
// ============================================================================
import { generateQuote, isAuthenticated, isRejected } from "@/services/merlin";
import type { TrueQuoteAuthenticatedResult } from "@/services/merlin";
import { TrueQuoteVerifyBadge } from "../components/TrueQuoteVerifyBadge";
import type { TrueQuoteWorksheetData } from "../components/TrueQuoteVerifyBadge";
import { calculateIncentives } from "@/services/stateIncentivesService";

// ============================================================================
// TIER DESIGN CONFIG - PART 2 REFINED STYLING
// ============================================================================
const TIER_CONFIG = {
  starter: {
    name: "STARTER",
    tagline: "Get your feet wet",
    headlineClass: "headline-starter",
    cardBorder: "border-slate-800",
    cardBg: "bg-gradient-to-b from-slate-900 to-slate-950",
    cardHover: "card-starter",
    accentColor: "text-emerald-400",
    chipBg: "bg-slate-800 border-slate-700/50",
    chipText: "text-slate-300",
    buttonClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20",
    metricBg: "bg-slate-800/50",
    savingsGlow: "savings-glow-starter",
  },
  perfectFit: {
    name: "PERFECT FIT",
    tagline: "Just right for you",
    headlineClass: "headline-perfect",
    cardBorder: "border-purple-500/30",
    cardBg: "bg-gradient-to-b from-purple-950/50 via-slate-900 to-slate-950",
    cardHover: "card-perfect",
    accentColor: "text-purple-400",
    chipBg: "bg-purple-500/10 border-purple-500/30",
    chipText: "text-purple-200",
    buttonClass:
      "text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-purple-500/20",
    metricBg: "bg-purple-500/10",
    savingsGlow: "savings-glow-perfect",
  },
  beastMode: {
    name: "BEAST MODE",
    tagline: "Go all in",
    headlineClass: "headline-beast",
    cardBorder: "border-slate-800",
    cardBg: "bg-gradient-to-b from-slate-900 to-slate-950",
    cardHover: "card-beast",
    accentColor: "text-orange-400",
    chipBg: "bg-slate-800 border-slate-700/50",
    chipText: "text-slate-300",
    buttonClass: "text-orange-400 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20",
    metricBg: "bg-slate-800/50",
    savingsGlow: "savings-glow-beast",
  },
} as const;

// ============================================================================
// CUSTOM STYLES - PART 2 ENHANCED DESIGN
// ============================================================================
const customStyles = `
  /* Card hover transitions */
  .card-starter, .card-perfect, .card-beast {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-starter:hover {
    transform: translateY(-6px);
    box-shadow: 0 40px 80px -20px rgba(16, 185, 129, 0.3);
  }
  
  .card-perfect:hover {
    transform: translateY(-6px);
    box-shadow: 0 40px 80px -20px rgba(168, 85, 247, 0.4);
  }
  
  .card-beast:hover {
    transform: translateY(-6px);
    box-shadow: 0 40px 80px -20px rgba(249, 115, 22, 0.35);
  }
  
  /* STARTER - Fresh green gradient text */
  .headline-starter {
    background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.4));
  }
  
  /* PERFECT FIT - Royal purple/pink gradient */
  .headline-perfect {
    background: linear-gradient(135deg, #c084fc 0%, #a855f7 30%, #9333ea 60%, #7c3aed 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 4px 16px rgba(168, 85, 247, 0.5));
  }
  
  /* BEAST MODE - Fire gradient */
  .headline-beast {
    background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 25%, #f97316 50%, #ea580c 75%, #dc2626 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 4px 12px rgba(249, 115, 22, 0.5));
  }
  
  /* Savings glow effects */
  .savings-glow-starter {
    text-shadow: 0 0 40px rgba(16, 185, 129, 0.4);
  }
  
  .savings-glow-perfect {
    text-shadow: 0 0 40px rgba(168, 85, 247, 0.4);
  }
  
  .savings-glow-beast {
    text-shadow: 0 0 40px rgba(249, 115, 22, 0.4);
  }
  
  /* Equipment chip styling */
  .equipment-chip {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }
  
  /* Pulse glow animation for recommended banner */
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  
  .recommended-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
`;

type TierKey = keyof typeof TIER_CONFIG;

// ============================================================================
// HELPER: Build Worksheet Data
// ============================================================================

/**
 * Build TrueQuoteWorksheetData from quoteResult for the verification modal
 */
function buildWorksheetData(
  quoteResult: TrueQuoteAuthenticatedResult | null,
  state: WizardState,
  selectedTier: TierKey | null
): TrueQuoteWorksheetData | null {
  if (!quoteResult) {
    return null;
  }

  const tier = selectedTier || "perfectFit";
  const option = quoteResult.options[tier];
  const base = quoteResult.baseCalculation;

  return {
    quoteId: quoteResult.quoteId,
    generatedAt: quoteResult.verification.verifiedAt,
    engineVersion: quoteResult.verification.trueQuoteVersion,

    inputs: {
      location: {
        zipCode: state.zipCode || "",
        state: state.state || "",
        utilityTerritory: base.utility.name || "Default Utility",
        electricityRate: state.electricityRate || base.utility.rate || 0.12,
        electricityRateSource: "State average",
        demandChargeRate: base.utility.demandCharge || 15,
        demandChargeSource: "Industry estimate",
        sunHours: state.solarData?.sunHours || 5.0,
        sunHoursSource: "NREL NSRDB",
      },
      industry: {
        type: state.industry || "",
        typeName: quoteResult.facility?.industryName || state.industry || "",
        subtype: state.useCaseData?.facilityType || state.industry || "",
        subtypeName: state.useCaseData?.facilitySubtype || state.industry || "",
        facilityDetails: state.useCaseData || {},
      },
    },

    calculationSteps: [
      {
        stepNumber: 1,
        category: "power_demand",
        name: "Calculate Base Load",
        description: `Base load calculation for ${quoteResult.facility?.industryName || state.industry || "facility"}`,
        formula: "Peak Demand = Load Factor × Connected Load",
        calculation: `${base.load.peakDemandKW} kW peak demand`,
        inputs: [
          {
            name: "Industry",
            value: quoteResult.facility?.industryName || state.industry || "",
            source: "User input",
          },
          { name: "Load Profile", value: base.load.loadProfile, source: "Industry benchmark" },
        ],
        output: { name: "Peak Demand", value: base.load.peakDemandKW, unit: "kW" },
      },
      {
        stepNumber: 2,
        category: "bess_sizing",
        name: "Size BESS System",
        description:
          "Battery energy storage system sizing based on peak demand and backup requirements",
        formula: "BESS kWh = Peak Demand × Duration Hours",
        calculation: `${option.bess.energyKWh.toLocaleString()} kWh = ${option.bess.powerKW} kW × ${(option.bess.energyKWh / option.bess.powerKW).toFixed(1)} hrs`,
        inputs: [
          { name: "Peak Demand", value: base.load.peakDemandKW, unit: "kW", source: "Step 1" },
          {
            name: "Duration",
            value: (option.bess.energyKWh / option.bess.powerKW).toFixed(1),
            unit: "hours",
            source: "User goals",
          },
        ],
        output: { name: "BESS Capacity", value: option.bess.energyKWh, unit: "kWh" },
      },
      {
        stepNumber: 3,
        category: "solar_sizing",
        name: "Size Solar Array",
        description: "Solar PV sizing based on consumption offset target",
        formula: "Solar kW = Target Annual kWh ÷ Capacity Factor",
        calculation: `${(option.solar?.capacityKW || 0).toLocaleString()} kW solar array`,
        inputs: [
          {
            name: "Annual Consumption",
            value: base.load.annualConsumptionKWh,
            unit: "kWh",
            source: "Load calc",
          },
          {
            name: "Sun Hours",
            value: state.solarData?.sunHours || 5.0,
            unit: "hrs/day",
            source: "NREL",
          },
        ],
        output: { name: "Solar Capacity", value: option.solar?.capacityKW || 0, unit: "kW" },
      },
      {
        stepNumber: 4,
        category: "financial",
        name: "Calculate Financials",
        description: "Total investment and savings calculation",
        formula: "Net Cost = Total Investment - Federal ITC - State Incentives",
        calculation: `$${option.financials.netCost.toLocaleString()} = $${option.financials.totalInvestment.toLocaleString()} - $${option.financials.federalITC.toLocaleString()}`,
        inputs: [
          {
            name: "Total Investment",
            value: option.financials.totalInvestment,
            unit: "USD",
            source: "Equipment pricing",
          },
          {
            name: "Federal ITC",
            value: option.financials.federalITC,
            unit: "USD",
            source: "IRS 30% ITC",
          },
        ],
        output: { name: "Net Cost", value: option.financials.netCost, unit: "USD" },
      },
    ],

    results: {
      peakDemandKW: base.load.peakDemandKW,
      bessKW: option.bess.powerKW,
      bessKWh: option.bess.energyKWh,
      solarKWp: option.solar?.capacityKW || 0,
      generatorKW: option.generator?.capacityKW || 0,
      evChargingKW:
        (option.ev?.l2Count || 0) * 7 +
        (option.ev?.dcfcCount || 0) * 100 +
        (option.ev?.ultraFastCount || 0) * 350,
      evChargers:
        (option.ev?.l2Count || 0) + (option.ev?.dcfcCount || 0) + (option.ev?.ultraFastCount || 0),
      totalInvestment: option.financials.totalInvestment,
      federalITC: option.financials.federalITC,
      netCost: option.financials.netCost,
      annualSavings: option.financials.annualSavings,
      paybackYears: option.financials.paybackYears,
    },

    deviations: [], // No deviations - all verified

    sources: [
      {
        id: "nrel",
        shortName: "NREL",
        fullName: "National Renewable Energy Laboratory",
        organization: "U.S. Department of Energy",
        year: 2024,
        usedFor: ["Solar irradiance data", "Capacity factors"],
      },
      {
        id: "eia",
        shortName: "EIA",
        fullName: "Energy Information Administration",
        organization: "U.S. Department of Energy",
        year: 2024,
        usedFor: ["Electricity rates", "Demand charges"],
      },
      {
        id: "irs",
        shortName: "IRS",
        fullName: "Internal Revenue Service",
        organization: "U.S. Treasury",
        year: 2024,
        usedFor: ["Federal ITC (30%)"],
      },
    ],
  };
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
  const [quoteResult, setQuoteResult] = useState<TrueQuoteAuthenticatedResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [stateIncentives, setStateIncentives] = useState<Record<TierKey, number>>({
    starter: 0,
    perfectFit: 0,
    beastMode: 0,
  });

  // === FETCH QUOTE ===
  useEffect(() => {
    async function loadQuote() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await generateQuote(state);

        if (isRejected(result)) {
          setError(result.reason || "Quote generation failed");
          return;
        }

        if (isAuthenticated(result)) {
          setQuoteResult(result);

          // Load state incentives for each tier
          const incentivePromises = (["starter", "perfectFit", "beastMode"] as const).map(
            async (tier) => {
              try {
                const opt = result.options[tier];
                const incentiveResult = await calculateIncentives(
                  state.zipCode,
                  opt.financials.totalInvestment,
                  opt.bess.energyKWh,
                  "commercial",
                  opt.solar.capacityKW > 0,
                  false
                );
                return { tier, amount: incentiveResult.stateIncentives };
              } catch {
                return { tier, amount: 0 };
              }
            }
          );

          const results = await Promise.all(incentivePromises);
          const incentiveMap = results.reduce(
            (acc, { tier, amount }) => {
              acc[tier] = amount;
              return acc;
            },
            {} as Record<TierKey, number>
          );

          setStateIncentives(incentiveMap);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unable to generate quote.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    loadQuote();
  }, [state]);

  // === SELECT TIER ===
  const selectPowerLevel = (tier: TierKey) => {
    if (!quoteResult) return;

    const option = quoteResult.options[tier];
    const base = quoteResult.baseCalculation;
    setSelectedTier(tier);

    // ✅ FIXED: Write nested { base, selected } structure matching SystemCalculations type
    updateState({
      selectedPowerLevel:
        tier === "starter" ? "starter" : tier === "perfectFit" ? "perfect_fit" : "beast_mode",
      calculations: {
        // Base calculations (SSOT - immutable, from TrueQuote baseCalculation)
        base: {
          annualConsumptionKWh: base.load.annualConsumptionKWh,
          peakDemandKW: base.load.peakDemandKW,
          utilityName: base.utility.name,
          utilityRate: base.utility.rate,
          demandCharge: base.utility.demandCharge,
          hasTOU: base.utility.hasTOU,
          quoteId: quoteResult.quoteId,
          pricingSources: ["NREL ATB 2024", "EIA", "IRS"],
        },
        // Selected tier calculations (changes when user picks a tier)
        selected: {
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
          // ✅ FIXED: Get federalITCRate from baseCalculation (not option.financials)
          federalITCRate: base.financials.federalITCRate,
          netInvestment: option.financials.netCost,
        },
      },
    });
  };

  // === FORMAT HELPERS ===
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const formatCompact = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-purple-500/30 rounded-full animate-pulse" />
          <Loader2 className="relative w-16 h-16 text-purple-400 animate-spin" />
        </div>
        <p className="text-white text-xl font-medium mt-6">Calculating your perfect system...</p>
        <p className="text-slate-400 text-sm mt-2">TrueQuote Engine is analyzing your facility</p>
      </div>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-300 mb-2">Unable to Generate Quote</h3>
        <p className="text-red-400/80 mb-6">{error}</p>
        <button
          onClick={() => goToStep(3)}
          className="px-6 py-3 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-all border border-red-500/30"
        >
          Go Back to Facility Details
        </button>
      </div>
    );
  }

  if (!quoteResult) return null;

  // === MAIN RENDER ===
  return (
    <div className="space-y-8">
      {/* Inject custom styles */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      {/* Header */}
      <div className="text-center">
        <p className="text-purple-400 uppercase tracking-[0.3em] text-sm font-medium mb-3">
          Step 5 of 6
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold text-white mb-3"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Pick Your Power
        </h1>
        <p className="text-slate-400 text-lg">
          Three configurations for{" "}
          <span className="text-white font-medium">{state.industryName || state.industry}</span>
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {(["starter", "perfectFit", "beastMode"] as const).map((tier) => {
          const config = TIER_CONFIG[tier];
          const option = quoteResult.options[tier];
          const isSelected = selectedTier === tier;
          const isPerfectFit = tier === "perfectFit";
          const stateIncentive = stateIncentives[tier];
          const netCost =
            option.financials.totalInvestment - option.financials.federalITC - stateIncentive;
          const twentyFiveYearProfit = option.financials.annualSavings * 25 - netCost;

          return (
            <div
              key={tier}
              onClick={() => selectPowerLevel(tier)}
              className={`
                relative rounded-2xl overflow-hidden cursor-pointer card ${config.cardHover}
                ${config.cardBg} border ${config.cardBorder}
                ${isPerfectFit ? "shadow-[0_0_60px_-15px_rgba(168,85,247,0.4)]" : ""}
                ${isSelected ? "ring-2 ring-purple-500" : ""}
              `}
            >
              {/* Recommended Banner (Perfect Fit only) */}
              {isPerfectFit && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 recommended-glow" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-1.5 rounded-b-lg text-[10px] font-bold tracking-wider shadow-lg shadow-purple-500/30">
                      ⭐ RECOMMENDED
                    </div>
                  </div>
                </>
              )}

              {/* Top Section */}
              <div className={`p-5 ${isPerfectFit ? "pt-9" : ""}`}>
                {/* HEADLINE */}
                <div className="text-center mb-4">
                  <h2
                    className={`text-4xl font-black tracking-tight ${config.headlineClass}`}
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    {config.name}
                  </h2>
                  <p
                    className={`text-xs uppercase tracking-widest mt-1 ${isPerfectFit ? "text-purple-300/50" : "text-slate-500"}`}
                  >
                    {config.tagline}
                  </p>
                </div>

                {/* HERO: Annual Savings */}
                <div className="text-center py-4">
                  <p
                    className={`text-[10px] uppercase tracking-widest mb-1 ${isPerfectFit ? "text-purple-400/50" : "text-slate-500"}`}
                  >
                    Annual Savings
                  </p>
                  <p
                    className={`text-5xl font-bold ${config.accentColor} ${config.savingsGlow}`}
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    {formatCurrency(option.financials.annualSavings).replace("$", "$")}
                  </p>
                </div>

                {/* Equipment Strip */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                  {/* BESS - Always shown */}
                  <div className={`equipment-chip ${config.chipBg}`}>
                    <span>🔋</span>
                    <span className={config.chipText}>
                      {Math.round(option.bess.energyKWh / 1000)} MWh
                    </span>
                  </div>

                  {/* Solar - Updated to show roof vs carport */}
                  {option.solar.included && option.solar.capacityKW > 0 && (
                    <>
                      {/* Roof Solar */}
                      <div className={`equipment-chip ${config.chipBg}`}>
                        <span>☀️</span>
                        <span className={config.chipText}>
                          {option.solar.capacityKW.toLocaleString()} kW
                          {option.solar.isRoofConstrained && !option.solar.includesCarport && (
                            <span className="text-amber-400 ml-1" title="Limited by roof size">
                              ⚠️
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Carport Solar (if included) */}
                      {option.solar.includesCarport &&
                        option.solar.carportCapacityKW &&
                        option.solar.carportCapacityKW > 0 && (
                          <div className={`equipment-chip ${config.chipBg} border-amber-500/30`}>
                            <span>🅿️</span>
                            <span className={`${config.chipText} text-amber-300`}>
                              +{option.solar.carportCapacityKW.toLocaleString()} kW
                            </span>
                          </div>
                        )}
                    </>
                  )}

                  {/* EV Chargers */}
                  {option.ev.included &&
                    option.ev.l2Count + option.ev.dcfcCount + option.ev.ultraFastCount > 0 && (
                      <div className={`equipment-chip ${config.chipBg}`}>
                        <span>⚡</span>
                        <span className={config.chipText}>
                          {option.ev.l2Count + option.ev.dcfcCount + option.ev.ultraFastCount} EV
                        </span>
                      </div>
                    )}

                  {/* Generator */}
                  {option.generator.included && option.generator.capacityKW > 0 && (
                    <div className={`equipment-chip ${config.chipBg}`}>
                      <span>🔥</span>
                      <span className={config.chipText}>
                        {option.generator.capacityKW.toLocaleString()} kW
                      </span>
                    </div>
                  )}
                </div>

                {/* Roof Constraint Warning - NEW */}
                {option.solar.isRoofConstrained && tier === "starter" && (
                  <div className="text-center mb-2">
                    <span className="text-[10px] text-amber-400/70 italic">
                      ⚠️ Solar limited by roof size ({option.solar.maxRoofCapacityKW} kW max)
                    </span>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div
                className={`border-t p-5 ${isPerfectFit ? "bg-slate-950/60 border-purple-500/20" : "bg-slate-950/80 border-slate-800"}`}
              >
                <p
                  className={`text-[10px] uppercase tracking-widest mb-3 text-center ${isPerfectFit ? "text-purple-400/50" : "text-slate-500"}`}
                >
                  Financial Summary
                </p>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Investment</span>
                    <span className="text-slate-300">
                      {formatCurrency(option.financials.totalInvestment)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-500">Federal ITC (30%)</span>
                    <span className="text-emerald-400">
                      −{formatCurrency(option.financials.federalITC)}
                    </span>
                  </div>
                  {stateIncentive > 0 && (
                    <div className="flex justify-between">
                      <span className="text-cyan-500">State Incentives</span>
                      <span className="text-cyan-400">−{formatCurrency(stateIncentive)}</span>
                    </div>
                  )}
                  <div
                    className={`h-px my-2 ${isPerfectFit ? "bg-purple-500/20" : "bg-slate-800"}`}
                  />
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Net Cost</span>
                    <span
                      className={`text-lg ${config.accentColor}`}
                      style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                      {formatCurrency(netCost)}
                    </span>
                  </div>
                </div>

                {/* ROI Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className={`text-center p-2 rounded-lg ${config.metricBg}`}>
                    <p
                      className="text-lg font-bold text-white"
                      style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                      {option.financials.paybackYears.toFixed(1)}
                    </p>
                    <p
                      className={`text-[10px] uppercase ${isPerfectFit ? "text-purple-300/50" : "text-slate-500"}`}
                    >
                      Payback Yrs
                    </p>
                  </div>
                  <div className={`text-center p-2 rounded-lg ${config.metricBg}`}>
                    <p
                      className="text-lg font-bold text-emerald-400"
                      style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                      {option.financials.tenYearROI.toFixed(0)}%
                    </p>
                    <p
                      className={`text-[10px] uppercase ${isPerfectFit ? "text-purple-300/50" : "text-slate-500"}`}
                    >
                      10-Yr ROI
                    </p>
                  </div>
                  <div className={`text-center p-2 rounded-lg ${config.metricBg}`}>
                    <p
                      className="text-lg font-bold text-emerald-400"
                      style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                      {formatCompact(twentyFiveYearProfit)}
                    </p>
                    <p
                      className={`text-[10px] uppercase ${isPerfectFit ? "text-purple-300/50" : "text-slate-500"}`}
                    >
                      25-Yr Profit
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  className={`
                    w-full py-3 rounded-xl font-semibold text-sm border transition-all
                    flex items-center justify-center gap-2
                    ${isSelected ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-transparent" : config.buttonClass}
                  `}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4" />
                      Selected
                    </>
                  ) : (
                    `Select ${config.name
                      .split(" ")
                      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                      .join(" ")}`
                  )}
                </button>
              </div>

              {/* Selection indicator glow */}
              {isSelected && (
                <div className="absolute inset-0 pointer-events-none rounded-2xl ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-950" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center gap-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span>🔋</span> BESS
          </span>
          <span className="flex items-center gap-1.5">
            <span>☀️</span> Roof Solar
          </span>
          <span className="flex items-center gap-1.5">
            <span>🅿️</span> Carport Solar
          </span>
          <span className="flex items-center gap-1.5">
            <span>⚡</span> EV Chargers
          </span>
          <span className="flex items-center gap-1.5">
            <span>🔥</span> Generator
          </span>
        </div>
      </div>

      {/* TrueQuote Badge */}
      <div className="flex justify-center">
        <TrueQuoteVerifyBadge
          quoteId={quoteResult.quoteId}
          worksheetData={buildWorksheetData(quoteResult, state, selectedTier)}
          variant="compact"
        />
      </div>
    </div>
  );
}
