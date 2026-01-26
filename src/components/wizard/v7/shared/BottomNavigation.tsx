/**
 * Bottom Navigation (DOCKED / IN-LAYOUT)
 *
 * Fixes:
 * - NOT fixed-positioned (no overlay, no overlap)
 * - Sits inside your wizard container like a real product footer
 * - Stable padding + border + backdrop blur
 * - Step indicator in the center
 */

import React from "react";

interface BottomNavigationProps {
  currentStep: number; // 1..7
  goBack: () => void;
  goNext: () => void;
  canProceed: () => boolean;
}

const stepNames = ["Location", "Goals", "Industry", "Details", "Options", "System", "Quote"];

export default function BottomNavigation({
  currentStep,
  goBack,
  goNext,
  canProceed,
}: BottomNavigationProps) {
  const backDisabled = currentStep === 1;
  const nextDisabled = !canProceed();

  const backLabel = backDisabled ? "Back" : `Back to ${stepNames[currentStep - 2]}`;
  const nextLabel = currentStep < 7 ? `Continue to ${stepNames[currentStep]}` : "Finish";

  return (
    <div className="shrink-0 border-t border-white/10 bg-slate-950/40 backdrop-blur-md">
      <div className="px-10 py-5">
        <div className="grid grid-cols-3 items-center gap-6">
          {/* LEFT: Back */}
          <div className="flex justify-start">
            <button
              onClick={goBack}
              disabled={backDisabled}
              className={[
                "px-6 py-3 rounded-xl text-sm font-semibold transition-all border",
                backDisabled
                  ? "bg-white/5 border-white/10 text-slate-500 cursor-not-allowed opacity-60"
                  : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20",
              ].join(" ")}
            >
              ← {backLabel}
            </button>
          </div>

          {/* CENTER: Step Dots */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex gap-1.5 mb-2">
              {Array.from({ length: 7 }, (_, i) => {
                const stepNum = i + 1;
                const isDone = stepNum < currentStep;
                const isActive = stepNum === currentStep;

                const barClass = isDone
                  ? "bg-emerald-500/80"
                  : isActive
                    ? "bg-violet-500/90"
                    : "bg-white/10";

                return <div key={i} className={`w-8 h-1 rounded-full ${barClass}`} />;
              })}
            </div>
            <div className="text-xs text-slate-500">
              Step <span className="text-slate-300 font-semibold">{currentStep}</span> of 7
            </div>
          </div>

          {/* RIGHT: Continue */}
          <div className="flex justify-end">
            <button
              onClick={goNext}
              disabled={nextDisabled}
              className={[
                "px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg border",
                nextDisabled
                  ? "bg-slate-800/40 border-white/10 text-slate-500 cursor-not-allowed opacity-60"
                  : "bg-gradient-to-r from-violet-600 to-indigo-700 border-violet-400/30 text-white hover:from-violet-500 hover:to-indigo-600 hover:shadow-xl",
              ].join(" ")}
            >
              {nextLabel} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
