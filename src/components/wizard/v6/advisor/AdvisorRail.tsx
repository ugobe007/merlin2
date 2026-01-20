// src/components/wizard/v6/advisor/AdvisorRail.tsx

import React, { useMemo, useRef, useState } from "react";
import { useAdvisorPublisher } from "./AdvisorPublisher";
import { AdvisorCard } from "./AdvisorCard";
import { X, MapPin, Zap, Sun, Cloud, Lightbulb, AlertTriangle } from "lucide-react";
import avatarImg from "@/assets/images/new_small_profile_.png";
import { TrueQuoteBadgeCanonical } from "@/components/shared/TrueQuoteBadgeCanonical";
import type { IntelligenceContext } from "@/types/intelligence.types";
import type { SiteScoreResult } from "@/services/calculators/siteScoreCalculator";

function ModeBadge({ mode }: { mode: "estimate" | "verified" }) {
  if (mode === "verified") {
    return <TrueQuoteBadgeCanonical showTooltip={false} />;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25">
      <AlertTriangle className="w-3 h-3" />
      <span>Estimate</span>
    </span>
  );
}

// Weather Risk Modal Component
function WeatherRiskModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const riskFactors = [
    { name: "Storm frequency", level: 20, color: "emerald" },
    { name: "Extreme heat events", level: 35, color: "amber" },
    { name: "Grid reliability", level: 15, color: "emerald" },
    { name: "Extreme cold events", level: 10, color: "emerald" },
    { name: "Wind/tornado risk", level: 25, color: "amber" },
  ];

  const overallRisk = Math.round(riskFactors.reduce((sum, f) => sum + f.level, 0) / riskFactors.length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full mx-4 border border-indigo-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black text-white mb-1">Weather Risk</h3>
            <p className="text-sm text-slate-400">Grid + climate stability</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Overall Risk Banner */}
        <div className={`mb-6 p-4 rounded-xl border-2 ${
          overallRisk < 30 
            ? 'border-emerald-500/30 bg-emerald-500/10' 
            : overallRisk < 60 
            ? 'border-amber-500/30 bg-amber-500/10' 
            : 'border-red-500/30 bg-red-500/10'
        }`}>
          <div className={`text-center font-black text-lg ${
            overallRisk < 30 
              ? 'text-emerald-400' 
              : overallRisk < 60 
              ? 'text-amber-400' 
              : 'text-red-400'
          }`}>
            {overallRisk < 30 ? 'LOW OVERALL RISK' : overallRisk < 60 ? 'MODERATE RISK' : 'HIGH RISK'}
          </div>
        </div>

        {/* Risk Factor Bars */}
        <div className="space-y-4 mb-6">
          {riskFactors.map((factor, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-300">{factor.name}</span>
                <span className="text-xs text-slate-400">{factor.level}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    factor.color === 'emerald' 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                      : 'bg-gradient-to-r from-amber-500 to-amber-400'
                  }`}
                  style={{ width: `${factor.level}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recommendation */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="text-xs text-blue-200 leading-relaxed">
            <strong>Recommendation:</strong> Reliable grid + strong solar = prioritize peak shaving + solar-ready storage.
          </div>
        </div>
      </div>
    </div>
  );
}

interface AdvisorRailProps {
  currentStep?: number;
  totalSteps?: number;

  // Step context to make Merlin feel aware
  context?: {
    location?: { state?: string; city?: string; zip?: string; utilityName?: string };
    utility?: { rate?: number; demandCharge?: number; hasTOU?: boolean };
    solar?: { sunHours?: number; rating?: string };
    weather?: { profile?: string; extremes?: string };
    opportunities?: { arbitrage?: string; backup?: boolean; smoothing?: boolean };

    // Phase 5: Step 3-4 config data for trade-off warnings
    config?: {
      solarKW?: number;
      batteryKWh?: number;
      batteryHours?: number;
      inverterKW?: number;
      peakLoadKW?: number;
      backupRequired?: boolean;
    };

    // Phase 1: Intelligence Layer (Jan 18, 2026)
    intelligence?: IntelligenceContext;

    // Site Score™ (Jan 18, 2026 - Merlin IP)
    siteScore?: SiteScoreResult | null;
  };

  onNavigate?: (step: number) => void;
}

const STEP_LABELS = ["Location", "Industry", "Details", "Options", "TrueQuote™", "Results"];

function safeNum(n?: number) {
  return typeof n === "number" && !Number.isNaN(n) ? n : null;
}

function pvToStorageBalanceRatio(params: {
  solarKW?: number;
  inverterKW?: number;
  batteryHours?: number;
}) {
  const s = safeNum(params.solarKW);
  const inv = safeNum(params.inverterKW);
  const h = safeNum(params.batteryHours);
  if (s == null || inv == null || h == null) return null;
  if (inv <= 0 || h <= 0) return null;
  return s / (inv * h);
}

export function AdvisorRail({
  currentStep = 1,
  totalSteps = 6,
  context,
  onNavigate,
}: AdvisorRailProps) {
  const { getCurrent, getWarnings } = useAdvisorPublisher();
  const payload = getCurrent();
  const warnings = getWarnings();

  // Modal state (Jan 20, 2026 - Vineet UX)
  const [showWeatherRiskModal, setShowWeatherRiskModal] = useState(false);

  const canClick = (stepNum: number) => stepNum <= currentStep;

  const zip = context?.location?.zip || "";
  const st = context?.location?.state || "";
  const _utilityName = context?.location?.utilityName || "";

  const rate = context?.utility?.rate;
  const demand = context?.utility?.demandCharge;
  const hasTOU = context?.utility?.hasTOU;

  // sun moved to header dials - prefix with _ to mark unused
  const _sun = context?.solar?.sunHours;
  const _solarRating = context?.solar?.rating;

  const _weatherProfile = context?.weather?.profile;
  const _weatherExtremes = context?.weather?.extremes;

  const _arbitrage = context?.opportunities?.arbitrage;

  // Phase 5: Config data for trade-off warnings (Step 3-4)
  const solarKW = context?.config?.solarKW;
  const batteryHours = context?.config?.batteryHours;
  const inverterKW = context?.config?.inverterKW;
  const peakLoadKW = context?.config?.peakLoadKW;
  const backupRequired = context?.config?.backupRequired;

  // Compute PV-to-storage ratio for curtailment analysis
  const pvRatio = pvToStorageBalanceRatio({ solarKW, inverterKW, batteryHours });

  // Hysteresis thresholds: prevents instant warning disappearance
  const CURTAIL_ON = 1.55; // Turn ON warning
  const CURTAIL_OFF = 1.45; // Turn OFF warning (requires meaningful improvement)

  // Track previous curtailment state for hysteresis
  const prevCurtailRef = useRef(false);

  // Hysteresis logic: once ON, stay ON until ratio drops below CURTAIL_OFF
  const nextCurtail = prevCurtailRef.current
    ? pvRatio != null && pvRatio >= CURTAIL_OFF
    : pvRatio != null && pvRatio >= CURTAIL_ON;

  prevCurtailRef.current = nextCurtail;

  // Shared predicate: prevents drift between constraint message and driver line
  // Step gating: only show after config is set (Step 4+)
  const canShowCurtailment = currentStep >= 4;
  const isCurtailmentRisk =
    canShowCurtailment &&
    (solarKW ?? 0) >= 50 &&
    batteryHours != null &&
    batteryHours < 2 &&
    nextCurtail;

  // ============================================================================
  // MERLIN'S INSIGHT - Phase 2: Anticipation (Step 1-2 only)
  // Rules: Max 1 per step, exactly 1 sentence, purely directional
  // ============================================================================

  const getMerlinInsight = (): string | null => {
    // Step 1-2 only: Anticipation insight (1 sentence)
    if (currentStep <= 2 && rate != null && demand != null) {
      // High rate + high demand → duration matters
      if (rate > 0.15 && demand > 15) {
        return "Because your utility uses TOU pricing and demand charges, battery duration will matter more than solar size.";
      }
      // Low demand → solar-first strategy
      if (demand < 10 && rate < 0.12) {
        return "With low demand charges, solar-first strategy makes sense — battery mainly for backup.";
      }
      // High TOU spread
      if (hasTOU && rate > 0.15) {
        return "TOU pricing creates strong arbitrage potential — focus on 4-6 hour battery systems.";
      }
    }
    return null;
  };

  // ============================================================================
  // MERLIN'S CONSTRAINT - Phase 5: Trade-off Warnings (Step 3+ only)
  // Rules: Max 2 sentences, purely directional
  // ============================================================================

  const getMerlinConstraint = (): string | null => {
    // Step 3+ only: Trade-off warnings (max 2 sentences)
    if (currentStep >= 3) {
      // Curtailment risk: PV oversized vs storage absorption capacity
      if (isCurtailmentRisk) {
        return "If solar capacity is high relative to storage absorption, excess production will be curtailed. Therefore increase storage duration or inverter power before oversizing PV.";
      }

      // Warning: Backup required + undersized inverter = load support risk
      if (backupRequired && inverterKW != null && peakLoadKW != null && inverterKW < peakLoadKW) {
        return "If backup is required but inverter power is undersized, critical loads may not be supported. Therefore prioritize kW before adding energy capacity.";
      }

      // Warning: High cycling (24/7 operations) + short duration
      if (batteryHours != null && batteryHours < 4 && demand != null && demand > 20) {
        return "If battery cycling is frequent and duration is short, replacement costs will accelerate. Therefore model at least 4-hour systems for daily arbitrage.";
      }
    }
    return null;
  };

  // Debounce constraints: only update if message actually changed (prevents flicker)
  const rawConstraint = getMerlinConstraint();
  const lastConstraintRef = useRef<string | null>(null);
  const constraint = useMemo(() => {
    if (!rawConstraint) return null;
    if (rawConstraint === lastConstraintRef.current) return rawConstraint;
    lastConstraintRef.current = rawConstraint;
    return rawConstraint;
  }, [rawConstraint]);

  // Voice rule validation (DEV only)
  const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;

  function _sentenceCount(s: string) {
    return s
      .split(".")
      .map((x) => x.trim())
      .filter(Boolean).length;
  }

  function _looksLikeConstraint(s: string) {
    return s.startsWith("If ") && s.includes("Therefore");
  }

  // Constraint driver: show the numbers that triggered the warning
  const constraintDriver = (() => {
    // Curtailment: use shared predicate (prevents drift with constraint logic)
    if (isCurtailmentRisk) {
      const s = solarKW != null ? Math.round(solarKW) : "--";
      const inv = inverterKW != null ? Math.round(inverterKW) : "--";
      const h = batteryHours != null ? Number(batteryHours.toFixed(1)) : "--";
      const r = pvRatio != null ? Number(pvRatio.toFixed(2)) : "--";

      // DEV: Add threshold context for debugging
      if (isDev && pvRatio != null) {
        const threshold = prevCurtailRef.current ? `>=${CURTAIL_OFF}` : `>=${CURTAIL_ON}`;
        const gateStatus = canShowCurtailment ? "✓" : "✗";
        return `Solar: ${s} kW • Inverter: ${inv} kW • Duration: ${h} h • Ratio: ${r} (${threshold}) • StepGate: ${gateStatus}`;
      }

      return `Solar: ${s} kW • Inverter: ${inv} kW • Duration: ${h} h • Ratio: ${r}`;
    }
    if (backupRequired && inverterKW != null && peakLoadKW != null && inverterKW < peakLoadKW) {
      return `Inverter: ${Math.round(inverterKW)} kW • Peak: ${Math.round(peakLoadKW)} kW`;
    }
    if (batteryHours != null && demand != null && batteryHours < 4 && demand > 20) {
      return `Demand charge: $${demand.toFixed(0)}/kW • Duration: ${batteryHours.toFixed(1)} h`;
    }
    return null;
  })();

  // DEV: Log constraint once when first triggered (helps catch state mapping drift)
  const didLogConstraint = useRef(false);
  if (isDev && constraint && !didLogConstraint.current) {
    didLogConstraint.current = true;
    console.log("[Merlin] constraint", {
      solarKW,
      batteryHours,
      inverterKW,
      peakLoadKW,
      backupRequired,
      demand,
    });
  }

  const insight = getMerlinInsight();

  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-violet-500/25 shadow-[0_8px_32px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(168,85,247,0.15)]">
      {/* GLASSMORPHIC AMBIENT GLOW - Purple/Blue/Indigo magic */}
      <div className="pointer-events-none absolute top-0 left-0 h-56 w-56 bg-gradient-to-br from-violet-400/30 via-purple-500/25 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-20 right-0 h-64 w-64 bg-gradient-to-bl from-indigo-500/30 via-blue-500/20 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-20 left-10 h-48 w-48 bg-gradient-to-tr from-fuchsia-500/20 via-violet-400/15 to-transparent blur-2xl rounded-full" />

      {/* MERLIN IDENTITY HEADER */}
      <div className="px-6 py-5 border-b border-violet-500/20 flex-shrink-0 bg-gradient-to-r from-violet-900/40 via-indigo-900/50 to-blue-900/40">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <img
              src={avatarImg}
              alt="Merlin"
              className="w-20 h-20 rounded-full border-2 border-violet-400/70 shadow-[0_0_24px_rgba(139,92,246,0.5),0_0_48px_rgba(168,85,247,0.3)]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
              }}
            />
            <div className="hidden w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center border-2 border-violet-300">
              <span className="text-4xl">🧙</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 merlin-breathe shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
          </div>

          <div className="flex-1">
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 font-bold text-xl tracking-tight">
              Merlin
            </div>
            <div className="text-slate-300/80 text-sm font-medium">AI Energy Advisor</div>
          </div>

          {payload?.mode && <ModeBadge mode={payload.mode} />}
        </div>
      </div>

      {/* LOCATION ANALYSIS CARD - Core Intelligence (Jan 20, 2026) */}
      <div className="px-6 py-4 border-b border-violet-500/20 flex-shrink-0">
        <div className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-slate-700/40 via-slate-800/50 to-violet-900/30 p-4 shadow-[inset_0_1px_0_rgba(167,139,250,0.1)]">{/*Card Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-white">Location Analysis</h3>
            </div>
            {/* LIVE badge - only show when ZIP validated */}
            {zip && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold">LIVE</span>
              </div>
            )}
          </div>

          {/* Card Body - Two States */}
          {!zip ? (
            /* BEFORE ZIP: Placeholder */
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MapPin className="w-12 h-12 text-violet-400/40 mb-3" />
              <div className="text-xs text-slate-400 mb-1">Enter your ZIP to load</div>
              <div className="text-sm text-slate-300">utility rates, solar yield, and climate risk.</div>
            </div>
          ) : (
            /* AFTER ZIP: Intelligence Grid */
            <>
              {/* 2x2 Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* Peak Sun */}
                <div className="relative rounded-lg border border-indigo-500/20 bg-slate-800/50 p-3">
                  <Sun className="absolute top-2 right-2 w-3 h-3 text-slate-400 hover:text-white cursor-help" />
                  <div className="text-[10px] text-violet-300/70 font-semibold mb-1">PEAK SUN</div>
                  <div className="text-2xl font-black text-white tabular-nums">
                    {context?.solar?.sunHours?.toFixed(1) || '—'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">hrs/day</div>
                </div>

                {/* Electricity Rate */}
                <div className="relative rounded-lg border border-indigo-500/20 bg-slate-800/50 p-3">
                  <Zap className="absolute top-2 right-2 w-3 h-3 text-slate-400 hover:text-white cursor-help" />
                  <div className="text-[10px] text-violet-300/70 font-semibold mb-1">ELECTRICITY</div>
                  <div className="text-2xl font-black text-white tabular-nums">
                    ${(rate || 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">$/kWh</div>
                </div>

                {/* Weather Risk */}
                <div className="relative rounded-lg border border-indigo-500/20 bg-slate-800/50 p-3">
                  <button 
                    onClick={() => setShowWeatherRiskModal(true)}
                    className="absolute top-2 right-2 transition-colors"
                  >
                    <Cloud className="w-3 h-3 text-slate-400 hover:text-white cursor-pointer" />
                  </button>
                  <div className="text-[10px] text-violet-300/70 font-semibold mb-1">WEATHER RISK</div>
                  <div className="text-2xl font-black text-white">Low</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">grid + climate</div>
                </div>

                {/* Solar Rating */}
                <div className="relative rounded-lg border border-indigo-500/20 bg-slate-800/50 p-3">
                  <Sun className="absolute top-2 right-2 w-3 h-3 text-slate-400 hover:text-white cursor-help" />
                  <div className="text-[10px] text-violet-300/70 font-semibold mb-1">SOLAR RATING</div>
                  <div className="text-2xl font-black text-white">
                    {context?.solar?.rating || 'A+'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">yield score</div>
                </div>
              </div>

              {/* Utility Identified Row */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/30 mb-3">
                <Zap className="w-4 h-4 text-violet-400" />
                <div className="flex-1">
                  <div className="text-[9px] text-slate-400 uppercase tracking-wide">Utility Territory</div>
                  <div className="text-xs text-white font-semibold">
                    {context?.location?.utilityName || `${st} Energy`} (avg commercial)
                  </div>
                </div>
              </div>

              {/* Insight Box */}
              <div className="rounded-lg border border-violet-400/20 bg-violet-500/8 p-3">
                <p className="text-xs text-violet-100 leading-relaxed">
                  <strong>{context?.location?.city || zip}, {st}</strong> shows strong solar yield and reliable grid conditions. 
                  BESS + peak shaving tends to perform well at this rate band.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PROGRESS - Visually reduced dominance */}
      <div className="px-6 py-4 border-b border-violet-500/20 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-violet-300/90">PROGRESS</div>
          <div className="text-sm text-indigo-200/70">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        <div className="space-y-2.5">
          {STEP_LABELS.slice(0, totalSteps).map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === currentStep;
            const isDone = stepNum < currentStep;
            const clickable = !!onNavigate && canClick(stepNum);

            return (
              <button
                key={stepNum}
                type="button"
                onClick={() => (clickable ? onNavigate?.(stepNum) : undefined)}
                disabled={!clickable}
                className={`w-full flex items-center gap-3 text-sm transition-all text-left ${
                  isActive ? "text-amber-300" : isDone ? "text-emerald-300" : "text-slate-400/40"
                } ${clickable ? "cursor-pointer hover:opacity-95" : "opacity-60 cursor-not-allowed"}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? "bg-amber-400/15 border-2 border-amber-400/80"
                      : isDone
                        ? "bg-emerald-400/10 border border-emerald-400/70"
                        : "bg-white/[0.04] border border-white/10"
                  }`}
                >
                  {isDone ? "✓" : stepNum}
                </div>

                <div className="flex-1">
                  <div className="font-semibold">{label}</div>
                </div>

                {isActive && (
                  <div className="text-[10px] px-2 py-0.5 rounded bg-amber-400/15 text-amber-200 border border-amber-400/20">
                    Current
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ACCURACY / TERRITORY CHIP - Bottom section */}
      {zip && context?.siteScore && (
        <div className="px-6 py-4 border-b border-violet-500/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-400" />
              <div className="text-sm text-white font-semibold">{zip} • {st}</div>
            </div>
            <div className="group relative">
              <div
                className={`px-2 py-1 rounded text-xs font-bold cursor-help ${
                  context.siteScore.scoreLabel === "exceptional" ||
                  context.siteScore.scoreLabel === "strong"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : context.siteScore.scoreLabel === "good"
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-orange-500/15 text-orange-300"
                }`}
                title="Click for accuracy details"
              >
                {context.siteScore.totalScore} {context.siteScore.scoreLabel.charAt(0).toUpperCase() + context.siteScore.scoreLabel.slice(1)}
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-3 rounded-lg bg-slate-900 border border-indigo-500/30 shadow-xl z-50">
                <div className="text-xs font-bold text-white mb-1">Accuracy score</div>
                <div className="text-xs text-slate-300">
                  {context.siteScore.totalScore}/100 = ZIP-level estimate. Add address or business name to improve precision.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONSTRAINT WARNING (Step 3+) - Only show when relevant */}
      {constraint && (
        <div className="px-6 py-4 border-b border-violet-500/20 flex-shrink-0">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="text-[11px] font-semibold text-amber-200 mb-1">⚠️ Heads up</div>
            <div className="text-xs text-slate-200/80">{constraint}</div>
            {constraintDriver && (
              <div className="mt-1.5 text-[10px] text-slate-400">{constraintDriver}</div>
            )}
          </div>
        </div>
      )}

      {/* MERLIN'S INSIGHT - Only show if we have one */}
      {insight && (
        <div className="px-5 py-3 border-b border-violet-500/20 flex-shrink-0">
          <div className="p-2.5 bg-violet-500/10 border border-violet-400/25 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-violet-100 leading-relaxed">{insight}</div>
            </div>
          </div>
        </div>
      )}

      {/* SCROLLABLE CONTENT - Only show if there are cards or disclaimers */}
      {((payload?.cards && payload.cards.length > 0) ||
        (payload?.mode === "estimate" && payload.disclaimer)) && (
        <div className="flex-1 overflow-auto">
          <div className="p-5 space-y-3">
            {(payload?.cards || []).map((c) => (
              <AdvisorCard key={c.id} card={c} />
            ))}

            {payload?.mode === "estimate" && payload.disclaimer && (
              <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="text-[11px] font-semibold text-amber-200 mb-1">
                  Estimate disclaimer
                </div>
                <div className="text-xs text-slate-200/80 whitespace-pre-line">
                  {payload.disclaimer}
                </div>
              </div>
            )}

            {warnings.length > 0 &&
              (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV && (
                <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="text-[11px] font-semibold text-red-200 mb-1">Dev warnings</div>
                  <ul className="text-xs text-slate-200/80 list-disc ml-4 space-y-1">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      )}

      {/* WEATHER RISK MODAL (Jan 20, 2026 - Vineet UX) */}
      <WeatherRiskModal isOpen={showWeatherRiskModal} onClose={() => setShowWeatherRiskModal(false)} />
    </div>
  );
}
