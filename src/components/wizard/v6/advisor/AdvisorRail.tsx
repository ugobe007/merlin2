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
}

const STEP_LABELS = [
  "Location",
  "Industry",
  "Details",
  "Options",
  "TrueQuote",
  "Results"
];

export function AdvisorRail({ currentStep = 1, totalSteps = 6 }: AdvisorRailProps) {
  const { getCurrent, getWarnings } = useAdvisorPublisher();
  const payload = getCurrent();
  const warnings = getWarnings();

  return (
    <aside className="w-full h-[calc(100vh-120px)] sticky top-6">
      <div className="h-full rounded-2xl border border-slate-700/50 bg-slate-900 overflow-hidden flex flex-col">
        {/* MERLIN IDENTITY HEADER */}
        <div className="px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <img
                src={avatarImg}
                alt="Merlin"
                className="w-12 h-12 rounded-full border-2 border-amber-400/50 shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-amber-300">
                <span className="text-2xl">🧙</span>
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
            </div>
            <div className="flex-1">
              <div className="text-amber-400 font-bold text-base">Merlin</div>
              <div className="text-slate-400 text-xs">AI Energy Advisor</div>
            </div>
            {payload?.mode && <ModeBadge mode={payload.mode} />}
          </div>

          <div className="mt-3">
            <div className="text-base font-semibold text-white leading-snug">
              {payload?.headline || "Answer a few questions to get your TrueQuote™"}
            </div>
            {payload?.subline && <div className="mt-1 text-xs text-slate-300">{payload.subline}</div>}
          </div>
        </div>

        {/* STEP PROGRESS */}
        <div className="px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-400">PROGRESS</div>
            <div className="text-xs text-slate-500">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <div className="space-y-2">
            {STEP_LABELS.slice(0, totalSteps).map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = stepNum === currentStep;
              const isDone = stepNum < currentStep;
              
              return (
                <div
                  key={stepNum}
                  className={`flex items-center gap-2 text-xs transition-all ${
                    isActive
                      ? "text-amber-400"
                      : isDone
                      ? "text-emerald-400"
                      : "text-slate-600"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isActive
                        ? "bg-amber-400/20 border-2 border-amber-400"
                        : isDone
                        ? "bg-emerald-400/20 border border-emerald-400"
                        : "bg-slate-800 border border-slate-700"
                    }`}
                  >
                    {isDone ? "✓" : stepNum}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{label}</div>
                  </div>
                  {isActive && (
                    <div className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                      Current
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-auto">
          <div className="p-5 space-y-3">
            {(payload?.cards || []).map((c) => (
              <AdvisorCard key={c.id} card={c} />
            ))}

            {payload?.mode === "estimate" && payload.disclaimer && (
              <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="text-[11px] font-semibold text-amber-200 mb-1">Estimate disclaimer</div>
                <div className="text-xs text-slate-300 whitespace-pre-line">{payload.disclaimer}</div>
              </div>
            )}

            {warnings.length > 0 && (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV && (
              <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="text-[11px] font-semibold text-red-200 mb-1">Dev warnings</div>
                <ul className="text-xs text-slate-300 list-disc ml-4 space-y-1">
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
