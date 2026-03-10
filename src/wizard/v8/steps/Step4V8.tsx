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
import { Loader2, AlertTriangle } from "lucide-react";

// ============================================================================
// TIER DESIGN CONFIG
// ============================================================================
const TIER_CONFIG = {
  0: {
    // STARTER
    name: "STARTER",
    tagline: "Get your feet wet",
    headlineClass: "headline-starter",
    cardBorder: "border-slate-800",
    cardBg: "bg-gradient-to-b from-slate-900 to-slate-950",
    cardHover: "card-starter",
    accentColor: "text-emerald-400",
    chipBg: "bg-white/5 border-white/10",
    chipText: "text-slate-300",
    buttonClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20",
    metricBg: "bg-white/5",
    savingsGlow: "savings-glow-starter",
  },
  1: {
    // PERFECT FIT
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
  2: {
    // BEAST MODE
    name: "BEAST MODE",
    tagline: "Go all in",
    headlineClass: "headline-beast",
    cardBorder: "border-slate-800",
    cardBg: "bg-gradient-to-b from-slate-900 to-slate-950",
    cardHover: "card-beast",
    accentColor: "text-orange-400",
    chipBg: "bg-white/5 border-white/10",
    chipText: "text-slate-300",
    buttonClass: "text-orange-400 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20",
    metricBg: "bg-white/5",
    savingsGlow: "savings-glow-beast",
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
    transform: translateY(-6px);
    box-shadow: 0 40px 80px -20px rgba(16, 185, 129, 0.3);
  }
  
  .card-starter:active {
    transform: translateY(-2px) scale(0.98);
    box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.4);
  }
  
  .card-perfect:hover {
    transform: translateY(-6px);
    box-shadow: 0 40px 80px -20px rgba(168, 85, 247, 0.4);
  }
  
  .card-perfect:active {
    transform: translateY(-2px) scale(0.98);
    box-shadow: 0 20px 40px -15px rgba(168, 85, 247, 0.5);
  }
  
  .card-beast:hover {
    transform: translateY(-6px);
    box-shadow: 0 40px 80px -20px rgba(249, 115, 22, 0.35);
  }
  
  .card-beast:active {
    transform: translateY(-2px) scale(0.98);
    box-shadow: 0 20px 40px -15px rgba(249, 115, 22, 0.45);
  }
  
  /* SELECTED STATE GLOW */
  .card-selected {
    animation: selectedPulse 2s ease-in-out infinite;
  }
  
  @keyframes selectedPulse {
    0%, 100% { box-shadow: 0 0 40px 0px rgba(168, 85, 247, 0.5); }
    50% { box-shadow: 0 0 60px 5px rgba(168, 85, 247, 0.7); }
  }
  
  /* CHECKMARK ANIMATION */
  .checkmark-appear {
    animation: checkmarkBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  @keyframes checkmarkBounce {
    0% { transform: scale(0) rotate(-45deg); opacity: 0; }
    50% { transform: scale(1.2) rotate(0deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  
  /* SAVINGS NUMBER POP */
  @keyframes savingsPop {
    0% { transform: scale(0.9); opacity: 0; }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .savings-number {
    animation: savingsPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
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
  
  /* Pulse glow animation for recommended banner */
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  
  .recommended-glow {
    animation: pulse-glow 2s ease-in-out infinite;
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
  const loadingStepCount = loadingSteps.length;

  // Loading steps for status bar
  const loadingSteps = [
    "Analyzing facility power profile...",
    "Sizing battery & solar arrays...",
    "Calculating equipment costs...",
    "Applying ITC tax credits...",
    "Running 25-year financial model...",
    "Generating 3 optimized tiers...",
  ];

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
        <Loader2 className="w-16 h-16 text-purple-400 animate-spin mb-6" />

        {/* Main message */}
        <h3 className="text-2xl font-bold text-white mb-2">Generating Your MagicFit Options</h3>
        <p className="text-slate-400 mb-8">Building 3 optimized configurations for your facility</p>

        {/* Progress bar */}
        <div className="w-full space-y-3">
          {/* Bar container */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current step */}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <p className="text-purple-300 font-medium animate-pulse">{loadingSteps[loadingStep]}</p>
          </div>

          {/* Step indicators */}
          <div className="grid grid-cols-6 gap-2 mt-4">
            {loadingSteps.map((step, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx <= loadingStep ? "bg-purple-500" : "bg-slate-700"
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
          onClick={() => actions.goToStep(3)}
          className="px-6 py-3 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-all border border-red-500/30"
        >
          Go Back to Profile
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
        <p className="text-purple-400 uppercase tracking-[0.3em] text-sm font-medium mb-3">
          Step 4 of 5
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold text-white mb-3"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Pick Your Power
        </h1>
        <p className="text-slate-400 text-lg">
          {selectedTierIndex === null
            ? "Click a configuration to select it"
            : "Three configurations optimized for savings"}
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

      {/* Cards Grid - Responsive with proper spacing */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 w-full px-2 md:px-4">
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
              onClick={() => actions.selectTier(tierIndex)}
              className={`
                relative rounded-2xl overflow-hidden cursor-pointer
                ${config.cardBg} border-2 ${config.cardHover}
                ${isSelected ? "border-purple-500 card-selected" : config.cardBorder}
                ${isPerfectFit ? "shadow-[0_0_60px_-15px_rgba(168,85,247,0.4)]" : ""}
                transition-all duration-300
              `}
            >
              {/* SELECTED CHECKMARK BADGE */}
              {isSelected && (
                <div className="absolute top-4 right-4 z-20 checkmark-appear">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full p-3 shadow-lg shadow-emerald-500/50">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* SELECTION GLOW OVERLAY */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none" />
              )}

              {/* BEST VALUE Banner (Perfect Fit only) */}
              {isPerfectFit && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 recommended-glow" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-1.5 rounded-b-lg text-[10px] font-bold tracking-wider shadow-lg shadow-purple-500/30">
                      ⭐ BEST VALUE
                    </div>
                  </div>
                </>
              )}

              {/* Top Section - Responsive padding */}
              <div className={`p-4 md:p-5 ${isPerfectFit ? "pt-8 md:pt-9" : ""}`}>
                {/* HEADLINE */}
                <div className="text-center mb-3 md:mb-4">
                  <h2
                    className={`text-3xl md:text-4xl font-black tracking-tight ${config.headlineClass}`}
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
                <div className="text-center py-3 md:py-4">
                  <p
                    className={`text-[10px] uppercase tracking-widest mb-1 ${isPerfectFit ? "text-purple-400/50" : "text-slate-500"}`}
                  >
                    Annual Savings
                  </p>
                  <p
                    className={`text-4xl md:text-5xl font-bold ${config.accentColor} ${config.savingsGlow} savings-number`}
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    {formatCurrency(tier.annualSavings)}
                  </p>
                </div>

                {/* Equipment Strip */}
                <div className="mb-4">
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
                        {Math.round(tier.bessKWh / 1000)} MWh BESS
                      </span>
                    </div>

                    {/* Solar */}
                    {tier.solarKW && tier.solarKW > 0 && (
                      <div className={`equipment-chip ${config.chipBg} border`}>
                        <span>☀️</span>
                        <span className={config.chipText}>{Math.round(tier.solarKW)} kW Solar</span>
                      </div>
                    )}

                    {/* EV Chargers */}
                    {tier.evChargerKW && tier.evChargerKW > 0 && (
                      <div className={`equipment-chip ${config.chipBg} border`}>
                        <span>⚡</span>
                        <span className={config.chipText}>
                          {state.level2Chargers + state.dcfcChargers + state.hpcChargers} EV
                          Chargers
                        </span>
                      </div>
                    )}

                    {/* Generator */}
                    {tier.generatorKW && tier.generatorKW > 0 && (
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
                className={`border-t p-4 md:p-5 ${isPerfectFit ? "bg-slate-950/60 border-purple-500/20" : "bg-slate-950/80 border-slate-800"}`}
              >
                <p
                  className={`text-[10px] uppercase tracking-widest mb-3 text-center ${isPerfectFit ? "text-purple-400/50" : "text-slate-500"}`}
                >
                  Financial Summary
                </p>

                <div className="space-y-2 text-xs md:text-sm mb-4">
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
                <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-4">
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
                    <div className="flex items-center justify-center gap-2">
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

      {/* Bottom Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={() => actions.goBack()}
          className="px-6 py-3 bg-white/5 text-slate-300 rounded-xl hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2"
        >
          ← Back
        </button>
        <button
          onClick={() => actions.goToStep(5)}
          disabled={selectedTierIndex === null}
          className={`
            px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg
            flex items-center gap-3
            ${
              selectedTierIndex === null
                ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/20 hover:scale-105 active:scale-95"
            }
          `}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
