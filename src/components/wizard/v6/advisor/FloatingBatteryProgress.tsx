// src/components/wizard/v6/advisor/FloatingBatteryProgress.tsx

import React from 'react';

interface FloatingBatteryProgressProps {
  /** Current wizard step (1-6) */
  currentStep: number;
  /** Optional navigation callback */
  onNavigate?: (step: number) => void;
}

/**
 * Floating MERLIN Battery Progress Widget
 * Position: Top right of wizard panel (not screen top, wizard panel top)
 * Always visible, not buried in scrollable AdvisorRail content
 */
export function FloatingBatteryProgress({ currentStep, onNavigate }: FloatingBatteryProgressProps) {
  const steps = [
    { number: 1, label: 'Location', short: 'M', color: '#1e40af' },  // Dark blue
    { number: 2, label: 'Industry', short: 'E', color: '#2563eb' },  // Blue
    { number: 3, label: 'Details', short: 'R', color: '#3b82f6' },   // Bright blue
    { number: 4, label: 'Options', short: 'L', color: '#06b6d4' },   // Cyan-blue
    { number: 5, label: 'TrueQuote™', short: 'I', color: '#22d3ee' },// Cyan
    { number: 6, label: 'Results', short: 'N', color: '#06b6d4' }    // Bright cyan
  ];

  // Fill percentage: 0% → 100% as we progress through 6 steps
  const fillPercent = ((currentStep - 1) / 5) * 100;

  // Build gradient stops for each letter
  const gradientStops = steps
    .map((step, idx) => {
      const position = (idx / 5) * 100;
      return `${step.color} ${position}%`;
    })
    .join(', ');

  // Only allow navigation to completed steps
  const clickable = (stepNum: number) => stepNum <= currentStep;

  return (
    <div className="group fixed top-1/2 -translate-y-1/2 right-6 z-40 flex items-center gap-3 animate-fade-in">
      {/* Battery Container */}
      <div className="relative w-10 h-32 bg-slate-900/90 border-2 border-cyan-400/70 rounded-lg shadow-[0_0_24px_rgba(6,182,212,0.4)] backdrop-blur-sm">
        {/* Battery Terminal */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-cyan-400/70 rounded-t-sm" />
        
        {/* Fill - Animated gradient from bottom to top */}
        <div 
          className="absolute bottom-0 left-0 right-0 rounded-b-md transition-all duration-700 ease-out"
          style={{
            height: `${fillPercent}%`,
            background: `linear-gradient(to top, ${gradientStops})`,
            boxShadow: '0 0 16px rgba(34, 211, 238, 0.6), inset 0 0 12px rgba(34, 211, 238, 0.3)'
          }}
        />

        {/* Step Letters (M-E-R-L-I-N) with cyan backglow */}
        <div className="absolute inset-0 flex flex-col justify-around py-2">
          {steps.map((step) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            const canClick = clickable(step.number);
            
            return (
              <button
                key={step.number}
                onClick={() => canClick ? onNavigate?.(step.number) : undefined}
                disabled={!canClick}
                className={`text-xs font-black transition-all duration-300 ${
                  isActive 
                    ? 'text-white scale-110 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]' 
                    : isCompleted 
                      ? 'text-cyan-300 hover:scale-105 cursor-pointer drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' 
                      : 'text-slate-500 cursor-not-allowed'
                } ${canClick ? 'hover:bg-cyan-500/20 rounded' : ''}`}
                style={{
                  textShadow: isActive ? '0 0 16px rgba(6, 182, 212, 0.8), 0 0 24px rgba(6, 182, 212, 0.5)' : 
                              isCompleted ? '0 0 10px rgba(6, 182, 212, 0.6)' : 'none'
                }}
                title={`${step.label}${canClick ? ' - click to navigate' : ''}`}
              >
                {step.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Panel - Appears on hover - MINIMAL */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-900/95 border border-cyan-400/50 rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm min-w-[100px]">
        <div className="text-[10px] text-cyan-300 font-semibold mb-1">MERLIN</div>
        {onNavigate && (
          <div className="text-[9px] text-slate-400">Click letters to navigate</div>
        )}
      </div>
    </div>
  );
}
