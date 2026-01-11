import React from 'react';

interface FloatingBatteryIconProps {
  currentStep: number; // 1-6 in overall wizard
}

/**
 * Floating Battery Progress Icon
 * Compact, floating version for upper right corner
 * Shows M-E-R-L-I-N progress vertically
 */
export function FloatingBatteryIcon({ currentStep }: FloatingBatteryIconProps) {
  // M-E-R-L-I-N (6 letters for 6 steps) - Ordered from top to bottom
  // Using shades of blue to cyan gradient for progress visualization
  const steps = [
    { number: 1, label: 'Location', short: 'M', color: '#1e40af' },      // Dark blue (start)
    { number: 2, label: 'Industry', short: 'E', color: '#2563eb' },      // Blue
    { number: 3, label: 'Details', short: 'R', color: '#3b82f6' },       // Bright blue
    { number: 4, label: 'Options', short: 'L', color: '#06b6d4' },       // Cyan-blue
    { number: 5, label: 'System', short: 'I', color: '#22d3ee' },        // Cyan
    { number: 6, label: 'Quote', short: 'N', color: '#06b6d4' }          // Bright cyan (end)
  ];

  // Calculate fill percentage (Step 1 = 0%, Step 6 = 100%)
  const fillPercentage = ((currentStep - 1) / 5) * 100;

  // Get step color - use blue-to-cyan gradient based on progress
  const getStepColor = (step: number) => {
    if (step < currentStep) {
      // Completed steps use their assigned blue-to-cyan gradient color
      return steps.find(s => s.number === step)?.color || '#3b82f6';
    }
    if (step === currentStep) {
      // Current step uses bright blue
      return '#3b82f6';
    }
    // Upcoming steps are gray
    return '#475569';
  };

  // Build gradient stops for the fill (bottom to top: M dark blue → N bright cyan)
  // The gradient should always show the blue-to-cyan progression, using each step's base color
  const gradientStops = steps.map((step, index) => {
    const percentage = (index / 5) * 100;
    // Use the step's base color for the gradient to show consistent blue-to-cyan progression
    return `${step.color} ${percentage}%`;
  }).join(', ');

  return (
    <div className="fixed right-6 z-40 flex flex-col items-center" style={{ top: '250px' }}>
      {/* Battery Container - Compact Size */}
      <div className="relative w-12 h-32 bg-slate-800/90 backdrop-blur-sm rounded-lg border-2 border-slate-600 overflow-hidden shadow-2xl">
        {/* Battery Fill (from bottom to top, like charging) */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
          style={{
            height: `${fillPercentage}%`,
            background: `linear-gradient(to top, ${gradientStops})`,
            boxShadow: `0 0 20px ${getStepColor(currentStep)}60, inset 0 0 10px rgba(255,255,255,0.15)`,
            filter: `drop-shadow(0 0 6px ${getStepColor(currentStep)}40)`
          }}
        />
        
        {/* Step Labels - M-E-R-L-I-N */}
        <div className="absolute inset-0 flex flex-col">
          {steps.map((step, index) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            const stepHeight = 100 / 6;

            return (
              <React.Fragment key={step.number}>
                <div
                  className={`
                    flex-1 flex items-center justify-center relative
                    transition-all duration-300
                    ${isActive
                      ? 'bg-cyan-500/20'
                      : isCompleted
                      ? 'bg-cyan-500/10'
                      : ''
                    }
                  `}
                  style={{ minHeight: `${stepHeight}%` }}
                >
                  <div
                    className={`
                      w-full h-full flex items-center justify-center text-xs font-bold
                      transition-all duration-300
                      ${isActive
                        ? 'text-cyan-200 scale-110'
                        : isCompleted
                        ? 'text-cyan-300'
                        : 'text-slate-500'
                      }
                    `}
                    title={step.label}
                  >
                    {step.short}
                  </div>
                  {index < steps.length - 1 &&
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-700/50" />
                  }
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      
      {/* Battery Terminal (top - positive terminal) */}
      <div className="w-4 h-2 bg-slate-600 rounded-t border-2 border-slate-700 border-b-0 -mt-1" />
      
      {/* Step Label - Compact */}
      <div className="mt-2 text-center">
        <div className="text-xs font-bold text-white">
          {currentStep}/6
        </div>
      </div>
    </div>
  );
}