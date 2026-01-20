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
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-blue-500/20 shadow-[0_8px_32px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(147,197,253,0.15)]">
      {/* GLASSMORPHIC AMBIENT GLOW - More blue */}
      <div className="pointer-events-none absolute top-0 left-0 h-56 w-56 bg-gradient-to-br from-blue-400/30 via-cyan-500/20 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute top-20 right-0 h-64 w-64 bg-gradient-to-bl from-indigo-500/25 via-violet-500/20 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-20 left-10 h-48 w-48 bg-gradient-to-tr from-blue-500/20 via-cyan-400/15 to-transparent blur-2xl rounded-full" />

      {/* MERLIN IDENTITY HEADER */}
      <div className="px-6 py-5 border-b border-blue-500/20 flex-shrink-0 bg-gradient-to-r from-blue-900/40 via-slate-900/50 to-indigo-900/40">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <img
              src={avatarImg}
              alt="Merlin"
              className="w-20 h-20 rounded-full border-2 border-cyan-400/60 shadow-[0_0_24px_rgba(34,211,238,0.4),0_0_48px_rgba(147,51,234,0.2)]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
              }}
            />
            <div className="hidden w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center border-2 border-cyan-300">
              <span className="text-4xl">🧙</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 merlin-breathe shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
          </div>

          <div className="flex-1">
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 font-bold text-xl tracking-tight">
              Merlin
            </div>
            <div className="text-slate-300/80 text-sm font-medium">AI Energy Advisor</div>
          </div>

          {payload?.mode && <ModeBadge mode={payload.mode} />}
        </div>

        <div className="mt-4 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-800/50 to-violet-500/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-sm">
          <div className="text-base font-extrabold text-white leading-snug tracking-tight line-clamp-2">
            {payload?.headline || "Let's maximize your energy savings."}
          </div>
          {payload?.subline && (
            <div className="mt-2 text-sm text-slate-200/80 whitespace-pre-line line-clamp-3">
              {payload.subline}
            </div>
          )}
        </div>
      </div>

      {/* STEP PROGRESS */}
      <div className="px-6 py-5 border-b border-blue-500/20 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-blue-300/90">PROGRESS</div>
          <div className="text-sm text-blue-200/70">
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

      {/* LOCATION / UTILITY CONTEXT - Simplified */}
      <div className="px-6 py-4 border-b border-blue-500/20 flex-shrink-0">
        {/* EMPTY STATE: no ZIP yet */}
        {!zip && !st ? (
          <div className="rounded-lg border border-blue-500/25 bg-blue-500/10 p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <div className="text-sm text-blue-200">Enter your location to see savings</div>
            </div>
          </div>
        ) : (
          <>
            {/* LOCATION + SITE SCORE - Compact */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <div className="text-base font-bold text-white">
                  {zip} • {st}
                </div>
              </div>
              {context?.siteScore && (
                <div
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    context.siteScore.scoreLabel === "exceptional" ||
                    context.siteScore.scoreLabel === "strong"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : context.siteScore.scoreLabel === "good"
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-orange-500/15 text-orange-300"
                  }`}
                >
                  {context.siteScore.totalScore}{" "}
                  {context.siteScore.scoreLabel.charAt(0).toUpperCase() +
                    context.siteScore.scoreLabel.slice(1)}
                </div>
              )}
            </div>

            {/* Utility context line */}
            <div className="mt-2 text-xs text-blue-200/80">
              {context?.location?.utilityName ? context.location.utilityName : "Utility territory"}{" "}
              {context?.location?.city ? `• ${context.location.city}` : ""}
            </div>

            {/* MERLIN SAYS - One insight when Site Score available */}
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
              <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="text-[11px] font-semibold text-amber-200 mb-1">⚠️ Heads up</div>
                <div className="text-xs text-slate-200/80">{constraint}</div>
                {constraintDriver && (
                  <div className="mt-1.5 text-[10px] text-slate-400">{constraintDriver}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MERLIN'S INSIGHT - Only show if we have one */}
      {insight && (
        <div className="px-5 py-3 border-b border-blue-500/20 flex-shrink-0">
          <div className="p-2.5 bg-blue-500/10 border border-blue-400/25 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-sm">💡</span>
              <div className="text-xs text-blue-100 leading-relaxed">{insight}</div>
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
    </div>
  );
}
