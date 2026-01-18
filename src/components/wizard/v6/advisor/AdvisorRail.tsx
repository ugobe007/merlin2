// src/components/wizard/v6/advisor/AdvisorRail.tsx

import React, { useMemo, useRef } from "react";
import { useAdvisorPublisher } from "./AdvisorPublisher";
import { AdvisorCard } from "./AdvisorCard";
import avatarImg from "@/assets/images/new_small_profile_.png";
import type { IntelligenceContext } from "@/types/intelligence.types";
import type { SiteScoreResult } from "@/services/calculators/siteScoreCalculator";

function ModeBadge({ mode }: { mode: "estimate" | "verified" }) {
  if (mode === "verified") {
    return (
      <span className="text-[11px] px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
        ✅ TrueQuote Verified
      </span>
    );
  }
  return (
    <span className="text-[11px] px-2 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25">
      ⚠️ Estimate
    </span>
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

const STEP_LABELS = ["Location", "Industry", "Details", "Options", "TrueQuote", "Results"];

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

  const canClick = (stepNum: number) => stepNum <= currentStep;

  const zip = context?.location?.zip || "";
  const st = context?.location?.state || "";
  const utilityName = context?.location?.utilityName || "";

  const rate = context?.utility?.rate;
  const demand = context?.utility?.demandCharge;
  const hasTOU = context?.utility?.hasTOU;

  // sun moved to header dials - prefix with _ to mark unused
  const _sun = context?.solar?.sunHours;
  const _solarRating = context?.solar?.rating;

  const weatherProfile = context?.weather?.profile;
  const weatherExtremes = context?.weather?.extremes;

  const arbitrage = context?.opportunities?.arbitrage;

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

  function sentenceCount(s: string) {
    return s
      .split(".")
      .map((x) => x.trim())
      .filter(Boolean).length;
  }

  function looksLikeConstraint(s: string) {
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
    <div className="relative flex flex-col max-h-[calc(100vh-140px)] overflow-hidden">
      {/* KEYLIGHT GLOW */}
      <div className="pointer-events-none absolute top-0 left-0 h-56 w-56 bg-amber-400/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-10 right-0 h-64 w-64 bg-violet-500/10 blur-3xl rounded-full" />

      {/* MERLIN IDENTITY HEADER */}
      <div className="px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <img
              src={avatarImg}
              alt="Merlin"
              className="w-16 h-16 rounded-full border-2 border-amber-400/60 shadow-[0_0_24px_rgba(251,191,36,0.3)]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
              }}
            />
            <div className="hidden w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-amber-300">
              <span className="text-3xl">🧙</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0f1d33] merlin-breathe shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          </div>

          <div className="flex-1">
            <div className="text-amber-400 font-bold text-lg tracking-tight">Merlin</div>
            <div className="text-slate-300/80 text-xs font-medium">AI Energy Advisor</div>
          </div>

          {payload?.mode && <ModeBadge mode={payload.mode} />}
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="text-[15px] font-extrabold text-white leading-snug tracking-tight">
            {payload?.headline || "Answer a few questions to get your TrueQuote™"}
          </div>
          {payload?.subline && (
            <div className="mt-1 text-xs text-slate-200/80 whitespace-pre-line">
              {payload.subline}
            </div>
          )}
        </div>
      </div>

      {/* LOCATION / UTILITY CONTEXT - Tight Professional Layout */}
      <div className="px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
        {/* EMPTY STATE: no ZIP yet */}
        {!zip && !st ? (
          <div className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-transparent p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📍</span>
              <div className="text-sm font-semibold text-white">Enter your location</div>
            </div>
            <div className="text-xs text-slate-300/80 leading-relaxed">
              Merlin will show you verified utility rates, solar potential, and savings
              opportunities for your site.
            </div>
          </div>
        ) : (
          <>
            {/* LOCATION HEADER - Tight single line */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📍</span>
                <div className="text-sm font-bold text-white">
                  {zip} • {st}
                </div>
                {utilityName && (
                  <div className="text-xs text-slate-400 truncate max-w-[120px]">
                    {utilityName}
                  </div>
                )}
              </div>
              {/* Site Score Badge - Compact */}
              {context?.siteScore && (
                <div
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                    context.siteScore.scoreLabel === "exceptional" ||
                    context.siteScore.scoreLabel === "strong"
                      ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-400"
                      : context.siteScore.scoreLabel === "good"
                        ? "bg-amber-500/15 border-amber-400/30 text-amber-300"
                        : "bg-orange-500/15 border-orange-400/30 text-orange-300"
                  }`}
                >
                  {context.siteScore.totalScore}{" "}
                  {context.siteScore.scoreLabel.charAt(0).toUpperCase() +
                    context.siteScore.scoreLabel.slice(1)}
                </div>
              )}
            </div>

            {/* KEY METRICS - 4 tight rows */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-700/30">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-amber-400">⚡</span> Utility Rate
                </span>
                <span className="text-sm font-bold text-white">
                  ${rate?.toFixed(4) || "0.12"}/kWh
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-700/30">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-violet-400">📊</span> Demand Charge
                </span>
                <span className="text-sm font-bold text-white">${demand || 15}/kW</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-700/30">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-sky-400">☀️</span> Solar Hours
                </span>
                <span className="text-sm font-bold text-white">
                  {context?.solar?.sunHours?.toFixed(1) || "5.5"} hrs/day
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-emerald-400">🌡️</span> Climate
                </span>
                <span className="text-xs font-semibold text-white">
                  {weatherProfile || "Moderate"}
                </span>
              </div>
            </div>

            {/* ENERGY SPOTLIGHT - Opportunities at a glance */}
            <div className="rounded-lg border border-fuchsia-400/20 bg-fuchsia-500/5 p-3">
              <div className="text-[10px] font-bold text-fuchsia-300/90 mb-2 flex items-center gap-1.5">
                <span>💡</span> ENERGY SPOTLIGHT
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div
                    className={`text-[11px] font-bold ${
                      demand && demand > 15
                        ? "text-emerald-400"
                        : demand && demand > 10
                          ? "text-amber-300"
                          : "text-slate-400"
                    }`}
                  >
                    {demand && demand > 15 ? "High" : demand && demand > 10 ? "Medium" : "Low"}
                  </div>
                  <div className="text-[9px] text-slate-500">Peak Shaving</div>
                </div>
                <div>
                  <div
                    className={`text-[11px] font-bold ${hasTOU ? "text-emerald-400" : "text-slate-400"}`}
                  >
                    {hasTOU ? "Yes" : "Limited"}
                  </div>
                  <div className="text-[9px] text-slate-500">Arbitrage</div>
                </div>
                <div>
                  <div
                    className={`text-[11px] font-bold ${
                      context?.siteScore?.riskResilience?.score &&
                      context.siteScore.riskResilience.score > 12
                        ? "text-emerald-400"
                        : "text-amber-300"
                    }`}
                  >
                    {context?.siteScore?.riskResilience?.score &&
                    context.siteScore.riskResilience.score > 12
                      ? "Important"
                      : "Possible"}
                  </div>
                  <div className="text-[9px] text-slate-500">Backup</div>
                </div>
              </div>
            </div>

            {/* MERLIN SAYS - One insight only when Site Score available */}
            {context?.siteScore?.merlinSays && (
              <div className="mt-3 p-2.5 bg-amber-500/8 border border-amber-500/15 rounded-lg">
                <div className="text-[11px] text-amber-200/90 leading-relaxed">
                  💬 <span className="font-semibold text-amber-300">Merlin:</span>{" "}
                  {context.siteScore.merlinSays}
                </div>
              </div>
            )}

            {/* CONSTRAINT WARNING (Step 3+) */}
            {constraint && (
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-[0_0_0_1px_rgba(251,191,36,0.12),0_0_18px_rgba(251,191,36,0.06)]">
                <div className="text-[11px] font-semibold text-amber-200 mb-1">Constraint</div>
                <div className="text-xs text-slate-200/80 whitespace-pre-line">{constraint}</div>

                {/* Driver: show the numbers that triggered this constraint */}
                {constraintDriver && (
                  <div className="mt-2 text-[10px] text-slate-300/70">{constraintDriver}</div>
                )}

                {/* DEV: Voice rule validation + config debug */}
                {isDev && (
                  <div className="mt-2 text-[10px] text-slate-400/70">
                    voice: {looksLikeConstraint(constraint) ? "ok" : "BAD"} • sentences:{" "}
                    {sentenceCount(constraint)}
                    {" • "}
                    cfg: solar {solarKW}kW • batt {batteryHours}h • inv {inverterKW}kW • peak{" "}
                    {peakLoadKW}kW • backup {String(backupRequired)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MERLIN'S INSIGHT - Whisper, not interrupt */}
      {insight && (
        <div className="px-5 py-3 border-b border-slate-700/50 flex-shrink-0">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl shadow-[0_0_0_1px_rgba(251,191,36,0.10),0_0_16px_rgba(251,191,36,0.05)]">
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">💡</span>
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-amber-300 mb-1">
                  Merlin's Insight
                </div>
                <div className="text-xs text-slate-200 leading-relaxed">{insight}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP PROGRESS */}
      <div className="px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-slate-300/70">PROGRESS</div>
          <div className="text-xs text-slate-300/50">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        <div className="space-y-2">
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
                className={`w-full flex items-center gap-2 text-xs transition-all text-left ${
                  isActive ? "text-amber-300" : isDone ? "text-emerald-300" : "text-slate-400/40"
                } ${clickable ? "cursor-pointer hover:opacity-95" : "opacity-60 cursor-not-allowed"}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
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
                  <div className="font-medium">{label}</div>
                </div>

                {isActive && (
                  <div className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-200 border border-amber-400/20">
                    Current
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
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
    </div>
  );
}
