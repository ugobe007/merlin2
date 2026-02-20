/**
 * MOBILE BOTTOM NAVIGATION
 * Fixed bottom bar for mobile wizard navigation
 * Replaces top nav on small screens (<768px)
 */

import React from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface MobileBottomNavProps {
  currentStep: number;
  totalSteps: number;
  canGoBack: boolean;
  canContinue: boolean;
  onBack: () => void;
  onNext: () => void;
  isLastStep?: boolean;
  nextLabel?: string;
}

export function MobileBottomNav({
  currentStep,
  totalSteps,
  canGoBack,
  canContinue,
  onBack,
  onNext,
  isLastStep = false,
  nextLabel = 'Continue',
}: MobileBottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-white/10 safe-area-inset-bottom">
      {/* Progress Bar */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-[#3ECF8E] to-[#2EA574] transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all min-w-[90px] justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx <= currentStep
                  ? 'w-6 bg-[#3ECF8E]'
                  : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Next/Continue Button */}
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#3ECF8E] text-slate-900 font-bold disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all min-w-[90px] justify-center"
          aria-label={isLastStep ? 'Finish' : nextLabel}
        >
          <span className="text-sm">{isLastStep ? 'Finish' : nextLabel}</span>
          {isLastStep ? (
            <Check className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
