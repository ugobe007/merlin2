/**
 * WIZARD V8 — STEP 4: MAGICFIT
 * ============================================================================
 * Three savings-optimized configurations with bold visual design
 *
 * Design: STARTER / PERFECT FIT / BEAST MODE
 * Source: Adapted from V6 Step5MagicFit.tsx
 *
 * Features:
 * - Gradient headlines that POP
 * - Annual Savings as HERO number
 * - Equipment strip with emoji icons (🔋 ☀️ ⚡ 🔥)
 * - Full financial summary (Investment, ITC, Net Cost)
 * - ROI metrics (Payback, 10-Year ROI, 25-Year Profit)
 * - Card hover animations + click feedback
 * - Selected state glow
 * ============================================================================
 */

import React from "react";
import type { WizardState, WizardActions } from "../wizardState";
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { calculateSystemCosts, EQUIPMENT_UNIT_COSTS } from "@/services/pricingServiceV45";

// ============================================================================
// TIER DESIGN CONFIG
// ============================================================================
const TIER_CONFIG = {
  0: {
    // ESSENTIAL
    name: "ESSENTIAL",
    tagline: "Core system, right-sized",
    headlineClass: "headline-starter",
    cardBorder: "border-slate-700/60",
    cardBg: "bg-gradient-to-b from-slate-900 to-slate-950",
    cardHover: "card-starter",
    accentColor: "text-emerald-400",
    chipBg: "bg-white/5 border-white/10",
    chipText: "text-slate-300",
    buttonClass:
      "text-emerald-400 bg-transparent border-emerald-500 hover:bg-emerald-500/10 font-bold",
    metricBg: "bg-white/5",
  },
  1: {
    // OPTIMIZED
    name: "OPTIMIZED",
    tagline: "Most popular configuration",
    headlineClass: "headline-perfect",
    cardBorder: "border-emerald-500/35",
    cardBg: "bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950",
    cardHover: "card-perfect",
    accentColor: "text-emerald-400",
    chipBg: "bg-emerald-500/10 border-emerald-500/30",
    chipText: "text-emerald-200",
    buttonClass:
      "text-emerald-400 bg-transparent border-emerald-500 hover:bg-emerald-500/10 font-bold",
    metricBg: "bg-emerald-500/10",
  },
  2: {
    // PREMIUM
    name: "PREMIUM",
    tagline: "Maximum performance",
    headlineClass: "headline-beast",
    cardBorder: "border-slate-700/60",
    cardBg: "bg-gradient-to-b from-slate-900 to-slate-950",
    cardHover: "card-beast",
    accentColor: "text-amber-400",
    chipBg: "bg-white/5 border-white/10",
    chipText: "text-slate-300",
    buttonClass:
      "text-emerald-400 bg-transparent border-emerald-500 hover:bg-emerald-500/10 font-bold",
    metricBg: "bg-white/5",
  },
} as const;

// ============================================================================
// CUSTOM STYLES
// ============================================================================
const customStyles = `
  /* Card hover transitions + CLICK FEEDBACK */
  .card-starter, .card-perfect, .card-beast {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-starter:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.18);
  }
  
  .card-starter:active {
    transform: translateY(-1px) scale(0.99);
    box-shadow: 0 10px 20px -10px rgba(16, 185, 129, 0.25);
  }
  
  .card-perfect:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.22);
  }
  
  .card-perfect:active {
    transform: translateY(-1px) scale(0.99);
    box-shadow: 0 10px 20px -10px rgba(16, 185, 129, 0.28);
  }
  
  .card-beast:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 40px -15px rgba(249, 115, 22, 0.18);
  }
  
  .card-beast:active {
    transform: translateY(-1px) scale(0.99);
    box-shadow: 0 10px 20px -10px rgba(249, 115, 22, 0.25);
  }
  
  /* SELECTED STATE GLOW — static, no pulse */
  .card-selected {
    box-shadow: 0 0 28px 0px rgba(16, 185, 129, 0.22);
  }
  
  /* CHECKMARK ANIMATION — gentle fade in */
  .checkmark-appear {
    animation: checkmarkFade 0.25s ease-out;
  }
  
  @keyframes checkmarkFade {
    0% { transform: scale(0.7); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  /* SAVINGS NUMBER — simple fade in */
  @keyframes savingsFade {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  .savings-number {
    animation: savingsFade 0.4s ease-out;
  }
  
  /* STARTER */
  .headline-starter {
    background: linear-gradient(135deg, #3ECF8E 0%, #2aad70 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  /* OPTIMIZED */
  .headline-perfect {
    background: linear-gradient(135deg, #3ECF8E 0%, #3ECF8E 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  /* PREMIUM */
  .headline-beast {
    background: linear-gradient(135deg, #F59E0B 0%, #d97706 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  /* Savings glow effects */
  .savings-glow-starter {
    text-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  }
  
  .savings-glow-perfect {
    text-shadow: 0 0 20px rgba(168, 85, 247, 0.25);
  }
  
  .savings-glow-beast {
    text-shadow: 0 0 20px rgba(249, 115, 22, 0.2);
  }
  
  /* Equipment chip styling - PROMINENT */
  .equipment-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    border-width: 2px !important;
  }
  
  .equipment-chip span:first-child {
    font-size: 16px;
  }
  
  .recommended-glow {
    opacity: 0.85;
  }
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
  actions: WizardActions;
}

export default function Step4V8({ state, actions }: Props) {
  const { tiers, tiersStatus, selectedTierIndex } = state;
  const [loadingStep, setLoadingStep] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [selectionConfirmation, setSelectionConfirmation] = React.useState<string | null>(null);
  const [expandedCostBreakdown, setExpandedCostBreakdown] = React.useState<number | null>(null);

  // Log only when tiersStatus changes, not on every render
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[Step4V8] State:", {
        tiersStatus,
        selectedTierIndex,
        hasTiers: !!tiers,
        tierCount: tiers?.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiersStatus]);

  // Track tier selection changes (debug only)
  React.useEffect(() => {
    if (import.meta.env.DEV && selectedTierIndex !== null) {
      console.log("[Step4V8] selectedTierIndex changed to:", selectedTierIndex);
    }
  }, [selectedTierIndex]);

  // Keyboard navigation for tiers
  React.useEffect(() => {
    if (!tiers) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (selectedTierIndex === null || selectedTierIndex === 0) {
          actions.selectTier(0);
        } else {
          actions.selectTier((selectedTierIndex - 1) as 0 | 1 | 2);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedTierIndex === null || selectedTierIndex === 2) {
          actions.selectTier(2);
        } else {
          actions.selectTier((selectedTierIndex + 1) as 0 | 1 | 2);
        }
      } else if (e.key === "Enter" && selectedTierIndex !== null) {
        e.preventDefault();
        actions.goToStep(6);
      } else if (e.key === "1") {
        e.preventDefault();
        actions.selectTier(0);
      } else if (e.key === "2") {
        e.preventDefault();
        actions.selectTier(1);
      } else if (e.key === "3") {
        e.preventDefault();
        actions.selectTier(2);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedTierIndex, tiers, actions]);

  // Loading steps for status bar
  const loadingSteps = [
    "Analyzing facility power profile...",
    "Sizing battery & solar arrays...",
    "Calculating equipment costs...",
    "Applying ITC tax credits...",
    "Running 25-year financial model...",
    "Generating 3 optimized tiers...",
  ];
  const loadingStepCount = loadingSteps.length;

  // Simulate progress during loading
  React.useEffect(() => {
    if (tiersStatus !== "fetching") return;

    setLoadingStep(0);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2; // Progress bar moves 2% every 50ms = ~2.5 seconds total
      });
    }, 50);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= loadingStepCount - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 400); // Change step every 400ms

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [tiersStatus, loadingStepCount]);

  React.useEffect(() => {
    if (selectedTierIndex === null || !tiers) {
      setSelectionConfirmation(null);
      return;
    }

    const selectedName = TIER_CONFIG[selectedTierIndex].name;
    setSelectionConfirmation(`${selectedName} selected. Continue when you're ready.`);

    const timeout = window.setTimeout(() => {
      setSelectionConfirmation(null);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [selectedTierIndex, tiers]);

  // === LOADING STATE ===
  if (tiersStatus === "fetching") {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-2xl mx-auto">
        {/* Spinner */}
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-6" />

        {/* Main message */}
        <h3 className="text-xl font-semibold text-white mb-2">Generating Your MagicFit Options</h3>
        <p className="text-slate-400 mb-8">Building 3 optimized configurations for your facility</p>

        {/* Progress bar */}
        <div className="w-full space-y-3">
          {/* Bar container */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current step */}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-emerald-400 font-medium">{loadingSteps[loadingStep]}</p>
          </div>

          {/* Step indicators */}
          <div className="grid grid-cols-6 gap-2 mt-4">
            {loadingSteps.map((step, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx <= loadingStep ? "bg-emerald-500" : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Percentage */}
          <p className="text-center text-slate-500 text-sm mt-2">
            {Math.round(progress)}% complete
          </p>
        </div>
      </div>
    );
  }

  // === ERROR STATE ===
  if (tiersStatus === "error" || !tiers) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-300 mb-2">Unable to Generate Tiers</h3>
        <p className="text-red-400/80 mb-6">
          {tiersStatus === "error"
            ? "Failed to calculate configurations"
            : "No tier data available"}
        </p>
        <button
          onClick={() => actions.goBack()}
          className="px-6 py-3 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-all border border-red-500/30"
        >
          Go Back
        </button>
      </div>
    );
  }

  // === MAIN RENDER ===
  return (
    <div className="space-y-8">
      {/* Inject custom styles */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {/* Header */}
      <div className="text-center">
        <p className="text-emerald-500/60 uppercase tracking-[0.3em] text-xs font-medium mb-3">
          MagicFit™ — 3 Configurations
        </p>
        <h1
          className="text-2xl md:text-3xl font-bold text-white mb-3"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Select Your Configuration
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          {selectedTierIndex === null
            ? "Each configuration is sized to your facility profile. Select one to continue."
            : "Selection confirmed. Review the details and click \"See your quote\" to proceed."}
        </p>
        {selectedTierIndex === null && (
          <div className="mt-3 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg inline-block">
            <p className="text-purple-300 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Select your preferred configuration to continue
            </p>
          </div>
        )}
        {selectionConfirmation && (
          <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-500/12 px-5 py-3 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-emerald-200">{selectionConfirmation}</p>
          </div>
        )}
      </div>

      {/* Cards Grid - Horizontal layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full px-2 md:px-4">
        {tiers.map((tier, index) => {
          const tierIndex = index as 0 | 1 | 2;
          const config = TIER_CONFIG[tierIndex];
          const isSelected = selectedTierIndex === tierIndex;
          const isPerfectFit = tierIndex === 1;

          // Use real financials from SSOT + margin policy
          const totalInvestment = tier.grossCost;
          const federalITC = tier.itcAmount;
          const netCost = tier.netCost;
          const twentyFiveYearProfit = tier.annualSavings * 25 - netCost;
          const tenYearROI = tier.roi10Year;

          return (
            <div
              key={tierIndex}
              onClick={() => {
                actions.selectTier(tierIndex);
              }}
              className={`
                relative rounded-2xl overflow-hidden cursor-pointer
                ${config.cardBg} border-2 ${config.cardHover}
                ${isSelected ? "border-emerald-500/60 card-selected" : config.cardBorder}
                ${isPerfectFit && !isSelected ? "shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)]" : ""}
                transition-all duration-300
              `}
            >
              {/* SELECTED CHECKMARK BADGE */}
              {isSelected && (
                <div className="absolute top-4 right-4 z-20 checkmark-appear">
                  <div className="bg-emerald-500 rounded-full p-1.5 shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* SELECTION OVERLAY */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/6 via-transparent to-transparent pointer-events-none" />
              )}

              {/* BEST VALUE Banner (Perfect Fit only) */}
              {isPerfectFit && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/70 recommended-glow" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-b-lg text-[10px] font-bold tracking-wider shadow-sm">
                      RECOMMENDED
                    </div>
                  </div>
                </>
              )}

              {/* Top Section - Responsive padding */}
              <div className={`p-3 md:p-4 ${isPerfectFit ? "pt-7 md:pt-8" : ""}`}>
                {/* HEADLINE */}
                <div className="text-center mb-2 md:mb-3">
                  <h2
                    className={`text-2xl md:text-3xl font-black tracking-tight ${config.headlineClass}`}
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

                {/* HERO: Annual Savings - Responsive sizing */}
                <div className="text-center py-2 md:py-3">
                  <p
                    className={`text-[10px] uppercase tracking-widest mb-1 ${isPerfectFit ? "text-purple-400/50" : "text-slate-500"}`}
                  >
                    Annual Savings
                  </p>
                  <p
                    className={`text-3xl md:text-4xl font-bold ${config.accentColor} savings-number`}
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    {formatCurrency(tier.annualSavings)}
                  </p>
                </div>

                {/* Equipment Strip */}
                <div className="mb-3">
                  <p
                    className={`text-[10px] uppercase tracking-widest mb-2 text-center ${isPerfectFit ? "text-purple-400/50" : "text-slate-500"}`}
                  >
                    System Configuration
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {/* BESS - Always shown */}
                    <div className={`equipment-chip ${config.chipBg} border`}>
                      <span>🔋</span>
                      <span className={config.chipText}>
                        {tier.bessKWh >= 1000
                          ? `${Math.round(tier.bessKWh / 1000)} MWh`
                          : `${Math.round(tier.bessKWh)} kWh`}{" "}
                        BESS
                      </span>
                    </div>

                    {/* Solar */}
                    {tier.solarKW >= 1 && (
                      <div className={`equipment-chip ${config.chipBg} border`}>
                        <span>☀️</span>
                        <span className={config.chipText}>{Math.round(tier.solarKW)} kW Solar</span>
                      </div>
                    )}

                    {/* EV Chargers */}
                    {tier.evChargerKW >= 1 && (
                      <div className={`equipment-chip ${config.chipBg} border`}>
                        <span>⚡</span>
                        <span className={config.chipText}>
                          {state.level2Chargers + state.dcfcChargers + state.hpcChargers} EV
                          Chargers
                        </span>
                      </div>
                    )}

                    {/* Generator */}
                    {tier.generatorKW >= 1 && (
                      <div className={`equipment-chip ${config.chipBg} border`}>
                        <span>🔥</span>
                        <span className={config.chipText}>
                          {Math.round(tier.generatorKW)} kW Generator
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Summary - Responsive padding and spacing */}
              <div
                className={`border-t p-3 md:p-4 ${isPerfectFit ? "bg-slate-950/60 border-purple-500/20" : "bg-slate-950/80 border-slate-800"}`}
              >
                <p
                  className={`text-[10px] uppercase tracking-widest mb-2 text-center ${isPerfectFit ? "text-purple-400/50" : "text-slate-500"}`}
                >
                  Financial Summary
                </p>

                <div className="space-y-1.5 text-xs md:text-sm mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Total Investment</span>
                    <span className="text-slate-300 font-medium">
                      {formatCurrency(totalInvestment)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-500">Federal ITC (30%)</span>
                    <span className="text-emerald-400 font-medium">
                      −{formatCurrency(federalITC)}
                    </span>
                  </div>
                  <div
                    className={`h-px my-2 ${isPerfectFit ? "bg-purple-500/20" : "bg-white/5"}`}
                  />
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-white">Net Cost</span>
                    <span
                      className={`text-base md:text-lg ${config.accentColor}`}
                      style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                      {formatCurrency(netCost)}
                    </span>
                  </div>
                </div>

                {/* ROI Metrics - Responsive grid */}
                <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-3">
                  <div className={`text-center p-1.5 md:p-2 rounded-lg ${config.metricBg}`}>
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Payback
                    </p>
                    <p className={`text-base md:text-lg font-bold ${config.accentColor}`}>
                      {tier.paybackYears.toFixed(1)}y
                    </p>
                  </div>
                  <div className={`text-center p-1.5 md:p-2 rounded-lg ${config.metricBg}`}>
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      10-Yr ROI
                    </p>
                    <p className={`text-base md:text-lg font-bold ${config.accentColor}`}>
                      {tenYearROI.toFixed(0)}%
                    </p>
                  </div>
                  <div className={`text-center p-1.5 md:p-2 rounded-lg ${config.metricBg}`}>
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      25-Yr Gain
                    </p>
                    <p className={`text-base md:text-lg font-bold ${config.accentColor}`}>
                      {formatCurrency(twentyFiveYearProfit)}
                    </p>
                  </div>
                </div>

                {/* V4.5 Cost Breakdown - Expandable */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCostBreakdown(
                      expandedCostBreakdown === tierIndex ? null : tierIndex
                    );
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 mb-2 rounded-lg transition-all ${
                    isPerfectFit
                      ? "bg-purple-500/10 hover:bg-purple-500/15"
                      : "bg-white/5 hover:bg-white/8"
                  }`}
                >
                  <span className="text-sm text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    Detailed Cost Breakdown
                  </span>
                  {expandedCostBreakdown === tierIndex ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Expanded Cost Details */}
                {expandedCostBreakdown === tierIndex &&
                  (() => {
                    // Calculate v4.5 detailed costs for this tier
                    const v45Costs = calculateSystemCosts({
                      solarKW: tier.solarKW,
                      bessKW: tier.bessKW,
                      bessKWh: tier.bessKWh,
                      generatorKW: tier.generatorKW,
                      level2Chargers: state.level2Chargers || 0,
                      dcfcChargers: state.dcfcChargers || 0,
                      hpcChargers: state.hpcChargers || 0,
                    });

                    return (
                      <div
                        className={`mb-3 p-3 rounded-lg space-y-2 text-xs ${
                          isPerfectFit
                            ? "bg-purple-950/30 border border-purple-500/20"
                            : "bg-slate-900/50 border border-slate-700/30"
                        }`}
                      >
                        {/* Equipment Costs */}
                        <div className="pb-2 border-b border-slate-700/50">
                          <p className="text-[11px] uppercase tracking-wider text-emerald-400 mb-1.5 font-bold">
                            Equipment Costs
                          </p>
                          {v45Costs.solarCost > 0 && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1">
                                <span className="text-amber-400">☀️</span>
                                <span>
                                  Solar PV ({tier.solarKW.toFixed(0)}kW @ $
                                  {EQUIPMENT_UNIT_COSTS.solar.pricePerWatt}/W)
                                </span>
                              </span>
                              <span className="font-medium">
                                {formatCurrency(v45Costs.solarCost)}
                              </span>
                            </div>
                          )}
                          {v45Costs.bessCost > 0 && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1">
                                <span>🔋</span>
                                <span>BESS + Hybrid Inverter ({tier.bessKWh.toFixed(0)}kWh)</span>
                              </span>
                              <span className="font-medium">
                                {formatCurrency(v45Costs.bessCost)}
                              </span>
                            </div>
                          )}
                          {v45Costs.generatorCost > 0 && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1">
                                <span className="text-orange-400">🔥</span>
                                <span>Generator ({tier.generatorKW.toFixed(0)}kW)</span>
                              </span>
                              <span className="font-medium">
                                {formatCurrency(v45Costs.generatorCost)}
                              </span>
                            </div>
                          )}
                          {v45Costs.evChargingCost > 0 && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1">
                                <span className="text-cyan-400">⚡</span>
                                <span>EV Chargers</span>
                              </span>
                              <span className="font-medium">
                                {formatCurrency(v45Costs.evChargingCost)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-slate-200 font-semibold mt-1.5 pt-1.5 border-t border-slate-700/30">
                            <span>Equipment Subtotal</span>
                            <span>{formatCurrency(v45Costs.equipmentSubtotal)}</span>
                          </div>
                        </div>

                        {/* Site Work & Soft Costs */}
                        <div className="pb-2 border-b border-slate-700/50">
                          <p className="text-[11px] uppercase tracking-wider text-emerald-400 mb-1.5 font-bold">
                            Site Work & Soft Costs
                          </p>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Site Engineering & Construction</span>
                            <span className="font-medium">
                              {formatCurrency(v45Costs.siteEngineering)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Construction Contingency (7.5%)</span>
                            <span className="font-medium">
                              {formatCurrency(v45Costs.constructionContingency)}
                            </span>
                          </div>
                        </div>

                        {/* Merlin AI Services */}
                        <div className="pb-2 border-b border-slate-700/50">
                          <p className="text-[11px] uppercase tracking-wider text-emerald-400 mb-1.5 font-bold">
                            Merlin AI Services
                          </p>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>◈ Design Intelligence</span>
                            <span className="font-medium">
                              {formatCurrency(v45Costs.merlinFees.designIntelligence)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Procurement & Sourcing</span>
                            <span className="font-medium">
                              {formatCurrency(v45Costs.merlinFees.procurementSourcing)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>PM & Construction Oversight</span>
                            <span className="font-medium">
                              {formatCurrency(v45Costs.merlinFees.pmConstruction)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Incentive Filing</span>
                            <span className="font-medium">
                              {formatCurrency(v45Costs.merlinFees.incentiveFiling)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-200 font-semibold mt-1.5 pt-1.5 border-t border-slate-700/30">
                            <span>Total Merlin Fee</span>
                            <span>{formatCurrency(v45Costs.merlinFees.totalFee)}</span>
                          </div>
                        </div>

                        {/* Annual Operating Reserves */}
                        <div className="pb-2">
                          <p className="text-[11px] uppercase tracking-wider text-emerald-400 mb-1.5 font-bold">
                            Annual Operating Reserves
                          </p>
                          <div className="flex justify-between items-center text-amber-300">
                            <span>Insurance + Inverter + BESS Reserves</span>
                            <span className="font-medium">
                              -{formatCurrency(v45Costs.annualReserves)}/yr
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500 mt-1 italic">
                            Deducted from gross annual savings for honest TCO
                          </p>
                        </div>

                        {/* Pricing Notes */}
                        <div
                          className={`p-2 rounded text-[10px] ${
                            isPerfectFit ? "bg-purple-900/20" : "bg-slate-800/50"
                          }`}
                        >
                          <p className="text-slate-400 leading-relaxed">
                            <span className="font-semibold text-slate-300">V4.5 Pricing:</span> NREL
                            ATB 2024, tiered margin (20%→14%→13%), 7.5% contingency, honest
                            reserves. Payback {tier.paybackYears.toFixed(1)}yr includes all costs.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                {/* Select Button with Visual Confirmation */}
                <button
                  onClick={() => actions.selectTier(tierIndex)}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.18em] transition-all border-2 ${
                    isSelected
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 border-emerald-300 text-slate-950 shadow-[0_0_28px_rgba(16,185,129,0.4)] scale-[0.99]"
                      : config.buttonClass
                  }`}
                >
                  {isSelected ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Confirmed
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <span>{`Choose ${config.name}`}</span>
                      <span className="text-lg leading-none">→</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
