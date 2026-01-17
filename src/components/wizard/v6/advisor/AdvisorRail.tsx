// src/components/wizard/v6/advisor/AdvisorRail.tsx

import React, { useMemo, useRef } from "react";
import { useAdvisorPublisher } from "./AdvisorPublisher";
import { AdvisorCard } from "./AdvisorCard";
import avatarImg from "@/assets/images/new_small_profile_.png";

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
  };

  onNavigate?: (step: number) => void;
}

const STEP_LABELS = ["Location", "Industry", "Details", "Options", "TrueQuote", "Results"];

function fmtMoney(n?: number) {
  if (n == null || Number.isNaN(n)) return "--";
  return `$${n.toFixed(2)}`;
}

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

  const sun = context?.solar?.sunHours;
  const solarRating = context?.solar?.rating;

  const weatherProfile = context?.weather?.profile;
  const weatherExtremes = context?.weather?.extremes;

  const arbitrage = context?.opportunities?.arbitrage;

  // Phase 5: Config data for trade-off warnings (Step 3-4)
  const solarKW = context?.config?.solarKW;
  const batteryHours = context?.config?.batteryHours;
  const inverterKW = context?.config?.inverterKW;
  const peakLoadKW = context?.config?.peakLoadKW;
  const backupRequired = context?.config?.backupRequired;

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
      const pvRatio = pvToStorageBalanceRatio({ solarKW, inverterKW, batteryHours });

      // Heuristic: short duration + PV-to-storage imbalance (ratio > 1.5)
      // Minimum 50kW solar to prevent ratio spam on tiny systems
      if (
        (solarKW ?? 0) >= 50 &&
        batteryHours != null &&
        batteryHours < 2 &&
        pvRatio != null &&
        pvRatio > 1.5
      ) {
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
    const pvRatio = pvToStorageBalanceRatio({ solarKW, inverterKW, batteryHours });

    // Curtailment: minimum 50kW solar to prevent ratio spam on tiny systems
    if (
      (solarKW ?? 0) >= 50 &&
      batteryHours != null &&
      batteryHours < 2 &&
      pvRatio != null &&
      pvRatio > 1.5
    ) {
      const s = Math.round(solarKW ?? 0);
      const inv = Math.round(inverterKW ?? 0);
      const h = Number(batteryHours.toFixed(1));
      const r = Number(pvRatio.toFixed(2));
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
    <aside className="w-full h-[calc(100vh-120px)] sticky top-0">
      <div className="h-full rounded-2xl border border-white/10 bg-[#0f1d33]/70 backdrop-blur overflow-hidden flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        {/* MERLIN IDENTITY HEADER */}
        <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <img
                src={avatarImg}
                alt="Merlin"
                className="w-14 h-14 rounded-full border-2 border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
                }}
              />
              <div className="hidden w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-amber-300">
                <span className="text-2xl">🧙</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0f1d33] merlin-breathe shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>

            <div className="flex-1">
              <div className="text-amber-400 font-bold text-lg tracking-tight">Merlin</div>
              <div className="text-slate-300/80 text-xs font-medium">AI Energy Advisor</div>
            </div>

            {payload?.mode && <ModeBadge mode={payload.mode} />}
          </div>

          <div className="mt-3">
            <div className="text-base font-semibold text-white leading-snug">
              {payload?.headline || "Answer a few questions to get your TrueQuote™"}
            </div>
            {payload?.subline && (
              <div className="mt-1 text-xs text-slate-200/80">{payload.subline}</div>
            )}
          </div>
        </div>

        {/* LOCATION / UTILITY CONTEXT */}
        <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="text-xs font-semibold text-slate-300/70 mb-3">LOCATION SNAPSHOT</div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[10px] text-slate-300/70">ZIP</div>
              <div className="text-sm font-semibold text-white">{zip || "--"}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[10px] text-slate-300/70">STATE</div>
              <div className="text-sm font-semibold text-white">{st || "--"}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[10px] text-slate-300/70">UTILITY RATE</div>
              <div className="text-sm font-semibold text-white">
                {rate != null ? `${fmtMoney(rate)}/kWh` : "--"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[10px] text-slate-300/70">PEAK SUN</div>
              <div className="text-sm font-semibold text-white">
                {sun != null ? `${sun.toFixed(1)} hrs/day` : "--"}
              </div>
            </div>
          </div>

          {(utilityName || weatherProfile || weatherExtremes) && (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[10px] text-slate-300/70">PROFILE</div>
              <div className="mt-1 space-y-1 text-xs text-slate-200/80">
                {utilityName && (
                  <div>
                    Utility: <span className="text-white font-semibold">{utilityName}</span>
                  </div>
                )}
                {weatherProfile && (
                  <div>
                    Weather: <span className="text-white font-semibold">{weatherProfile}</span>
                  </div>
                )}
                {weatherExtremes && (
                  <div>
                    Extremes: <span className="text-white font-semibold">{weatherExtremes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-[10px] text-slate-300/70">OPPORTUNITIES</div>
            <div className="mt-1 space-y-2">
              {/* Arbitrage with reasoning */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-300">Energy Arbitrage</span>
                  <span className="text-[11px] font-semibold text-amber-300">
                    {arbitrage || (hasTOU ? "Medium" : "Low")}
                  </span>
                </div>
                {hasTOU && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    TOU pricing detected — storage can shift off-peak energy to peak hours
                  </div>
                )}
              </div>

              {/* Backup with reasoning */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-300">Backup Power</span>
                  <span className="text-[11px] font-semibold text-emerald-300">
                    {context?.opportunities?.backup ? "High" : "Possible"}
                  </span>
                </div>
                {context?.opportunities?.backup && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Critical operations benefit from resilient backup systems
                  </div>
                )}
              </div>

              {/* Peak shaving with reasoning */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-300">Peak Shaving</span>
                  <span className="text-[11px] font-semibold text-blue-300">
                    {context?.opportunities?.smoothing ? "High" : "Possible"}
                  </span>
                </div>
                {demand != null && demand > 15 && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    High demand charges (${demand.toFixed(0)}/kW) — battery can reduce peaks
                  </div>
                )}
              </div>

              {/* Solar rating with reasoning */}
              {solarRating && sun != null && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300">Solar Potential</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        sun > 5.5
                          ? "text-yellow-300"
                          : sun > 4.5
                            ? "text-amber-300"
                            : "text-orange-300"
                      }`}
                    >
                      {solarRating}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {sun.toFixed(1)} sun hrs/day — {sun > 5 ? "excellent" : "good"} conditions for
                    PV + storage pairing
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CONSTRAINT WARNING (Step 3+) */}
          {constraint && (
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
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

          {/* PHASE 6: Merlin presence cue (context-aware but still quiet) */}
          <div className="mt-3 text-[10px] text-slate-400/60 italic">
            {(() => {
              if (currentStep <= 2) return "Merlin is watching: rates, demand charges, solar yield";
              if (currentStep <= 4)
                return "Merlin is watching: curtailment, inverter limits, cycling";
              return "Merlin is watching: payback drivers, constraints, sensitivity";
            })()}
          </div>
        </div>

        {/* MERLIN'S INSIGHT - Whisper, not interrupt */}
        {insight && (
          <div className="px-5 py-3 border-b border-white/10 flex-shrink-0">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
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
        <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
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
                          : "bg-white/5 border border-white/10"
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
    </aside>
  );
}
