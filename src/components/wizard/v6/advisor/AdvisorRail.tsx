// src/components/wizard/v6/advisor/AdvisorRail.tsx

import React from "react";
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
  };

  onNavigate?: (step: number) => void;
}

const STEP_LABELS = ["Location", "Industry", "Details", "Options", "TrueQuote", "Results"];

function fmtMoney(n?: number) {
  if (n == null || Number.isNaN(n)) return "--";
  return `$${n.toFixed(2)}`;
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
  const city = context?.location?.city || "";
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
            {payload?.subline && <div className="mt-1 text-xs text-slate-200/80">{payload.subline}</div>}
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
              <div className="text-sm font-semibold text-white">{rate != null ? `${fmtMoney(rate)}/kWh` : "--"}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[10px] text-slate-300/70">PEAK SUN</div>
              <div className="text-sm font-semibold text-white">{sun != null ? `${sun.toFixed(1)} hrs/day` : "--"}</div>
            </div>
          </div>

          {(utilityName || weatherProfile || weatherExtremes) && (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[10px] text-slate-300/70">PROFILE</div>
              <div className="mt-1 space-y-1 text-xs text-slate-200/80">
                {utilityName && <div>Utility: <span className="text-white font-semibold">{utilityName}</span></div>}
                {weatherProfile && <div>Weather: <span className="text-white font-semibold">{weatherProfile}</span></div>}
                {weatherExtremes && <div>Extremes: <span className="text-white font-semibold">{weatherExtremes}</span></div>}
              </div>
            </div>
          )}

          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-[10px] text-slate-300/70">OPPORTUNITIES</div>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="text-[11px] px-2 py-1 rounded-md border border-white/10 bg-white/5 text-slate-200">
                Arbitrage: <span className="font-semibold">{arbitrage || (hasTOU ? "Medium" : "Low")}</span>
              </span>
              <span className="text-[11px] px-2 py-1 rounded-md border border-white/10 bg-white/5 text-slate-200">
                Backup: <span className="font-semibold">{context?.opportunities?.backup ? "High" : "Possible"}</span>
              </span>
              <span className="text-[11px] px-2 py-1 rounded-md border border-white/10 bg-white/5 text-slate-200">
                Smoothing: <span className="font-semibold">{context?.opportunities?.smoothing ? "High" : "Possible"}</span>
              </span>

              {demand != null && (
                <span className="text-[11px] px-2 py-1 rounded-md border border-white/10 bg-white/5 text-slate-200">
                  Demand: <span className="font-semibold">{fmtMoney(demand)}/kW</span>
                </span>
              )}

              {solarRating && (
                <span className="text-[11px] px-2 py-1 rounded-md border border-white/10 bg-white/5 text-slate-200">
                  Solar: <span className="font-semibold">{solarRating}</span>
                </span>
              )}
            </div>
          </div>
        </div>

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
                <div className="text-[11px] font-semibold text-amber-200 mb-1">Estimate disclaimer</div>
                <div className="text-xs text-slate-200/80 whitespace-pre-line">{payload.disclaimer}</div>
              </div>
            )}

            {warnings.length > 0 && (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV && (
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
