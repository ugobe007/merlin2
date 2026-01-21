// src/components/wizard/v6/advisor/MerlinBatteryProgress.tsx

import React from 'react';

interface MerlinBatteryProgressProps {
  currentStep: number; // 1-6
  onNavigate?: (step: number) => void;
}

/**
 * MERLIN Battery Progress Widget
 * Compact vertical battery that spells M-E-R-L-I-N (6 letters for 6 steps)
 * Fills bottom-to-top with blue-to-cyan gradient
 * Each letter is clickable to navigate to that step (if completed)
 */
export function MerlinBatteryProgress({ currentStep, onNavigate }: MerlinBatteryProgressProps) {
  // M-E-R-L-I-N (6 letters for 6 steps) - Ordered from top to bottom
  const steps = [
    { number: 1, label: 'Location', short: 'M', color: '#1e40af' },      // Dark blue
    { number: 2, label: 'Industry', short: 'E', color: '#2563eb' },      // Blue
    { number: 3, label: 'Details', short: 'R', color: '#3b82f6' },       // Bright blue
    { number: 4, label: 'Options', short: 'L', color: '#06b6d4' },       // Cyan-blue
    { number: 5, label: 'TrueQuote™', short: 'I', color: '#22d3ee' },    // Cyan
    { number: 6, label: 'Results', short: 'N', color: '#06b6d4' }         // Bright cyan
  ];

  // Calculate fill percentage (Step 1 = 0%, Step 6 = 100%)
  const fillPercentage = ((currentStep - 1) / 5) * 100;

  // Build gradient stops for the fill (bottom to top: M dark blue → N bright cyan)
  const gradientStops = steps.map((step, index) => {
    const percentage = (index / 5) * 100;
    return `${step.color} ${percentage}%`;
  }).join(', ');

  const canNavigate = (stepNum: number) => {
    return !!onNavigate && stepNum <= currentStep;
  };

  return (
    <div className="flex items-center gap-4">
      {/* Battery Container */}
      <div className="relative w-10 h-32 bg-slate-800/90 backdrop-blur-sm rounded-lg border-2 border-slate-600/50 overflow-hidden shadow-lg">
        {/* Battery Fill (from bottom to top, like charging) */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
          style={{
            height: `${fillPercentage}%`,
            background: `linear-gradient(to top, ${gradientStops})`,
            boxShadow: `0 0 20px rgba(34, 211, 238, 0.4), inset 0 0 10px rgba(255,255,255,0.15)`,
            filter: `drop-shadow(0 0 6px rgba(34, 211, 238, 0.3))`
          }}
        />

        {/* Step Labels - M-E-R-L-I-N (clickable if completed) */}
        <div className="absolute inset-0 flex flex-col">
          {steps.map((step, index) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            const clickable = canNavigate(step.number);
            const stepHeight = 100 / 6;

            return (
              <React.Fragment key={step.number}>
                <button
                  onClick={() => clickable ? onNavigate?.(step.number) : undefined}
                  disabled={!clickable}
                  className={`
                    flex-1 flex items-center justify-center relative
                    transition-all duration-300
                    ${clickable ? 'cursor-pointer hover:bg-cyan-500/20' : 'cursor-default'}
                    ${isActive ? 'bg-cyan-500/20' : isCompleted ? 'bg-cyan-500/10' : ''}
                  `}
                  style={{ minHeight: `${stepHeight}%` }}
                  title={`${step.label}${clickable ? ' (click to navigate)' : ''}`}
                  type="button"
                >
                  <div
                    className={`
                      w-full h-full flex items-center justify-center text-xs font-bold
                      transition-all duration-300
                      ${isActive ? 'text-cyan-200 scale-110' : isCompleted ? 'text-cyan-300' : 'text-slate-500'}
                    `}
                  >
                    {step.short}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-700/50" />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Info - Compact */}
      <div className="flex-1">
        <div className="text-sm font-bold text-violet-300/90 mb-1">PROGRESS</div>
        <div className="text-sm text-indigo-200/70 mb-2">
          Step {currentStep} of 6
        </div>
        <div className="text-xs text-slate-400">
          {steps[currentStep - 1]?.label}
        </div>
        {onNavigate && (
          <div className="text-[10px] text-slate-500 mt-1">
            Click letters to navigate
          </div>
        )}
      </div>

      {/* Battery Terminal (top - positive terminal) */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-slate-600 rounded-t border-2 border-slate-700 border-b-0" />
    </div>
  );
}
