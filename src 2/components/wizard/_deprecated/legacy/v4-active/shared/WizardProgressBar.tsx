/**
 * WIZARD PROGRESS BAR
 * ===================
 * 
 * Clean progress indicator at top of wizard
 * Shows current step, completed steps, and progress bar
 */

import React from 'react';
import { Check } from 'lucide-react';

interface WizardProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
}

export function WizardProgressBar({
  currentStep,
  totalSteps,
  stepNames,
}: WizardProgressBarProps) {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 bg-[rgba(26,26,46,0.95)] backdrop-blur-[10px] border-b border-white/10 px-6 py-4 z-[1000]">
      <div className="max-w-[900px] mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-3">
          {stepNames.map((name, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStep + 1;
            const isCompleted = stepNum < currentStep + 1;

            return (
              <React.Fragment key={index}>
                <div className={`flex items-center gap-2 text-[13px] transition-all ${
                  isActive ? 'text-white' : isCompleted ? 'text-[#4ADE80]' : 'text-white/40'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white'
                      : isCompleted
                        ? 'bg-[#4ADE80] text-[#0a2a20]'
                        : 'bg-white/10 text-white/60'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                  </div>
                  <span className="hidden sm:inline">{name}</span>
                </div>
                {index < stepNames.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-2 transition-all ${
                    isCompleted ? 'bg-[#4ADE80]' : 'bg-white/10'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4ADE80] to-[#22D3EE] rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

