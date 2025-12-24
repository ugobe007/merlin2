/**
 * WIZARD BOTTOM NAVIGATION
 * =========================
 * 
 * Clean bottom navigation bar with Back/Continue buttons
 * Shows current step status
 * Supports progress ring for Step 3
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProgressRing } from './ProgressRing';

interface WizardBottomNavProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  forwardLabel?: string;
  // Step 3 specific props
  answeredCount?: number;
  totalQuestions?: number;
}

export function WizardBottomNav({
  currentStep,
  totalSteps,
  stepName,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  forwardLabel = 'Continue',
  answeredCount,
  totalQuestions,
}: WizardBottomNavProps) {
  const showProgressRing = currentStep === 2 && answeredCount !== undefined && totalQuestions !== undefined;
  const progressPercent = showProgressRing && totalQuestions > 0 
    ? (answeredCount! / totalQuestions!) * 100 
    : 0;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[rgba(15,23,42,0.98)] backdrop-blur-[10px] border-t border-white/8 px-6 py-3.5 z-[1000]">
      <div className="max-w-[700px] mx-auto flex items-center justify-between">
        {/* Left: Progress (Step 3) or Status */}
        {showProgressRing ? (
          <div className="flex items-center gap-3">
            <ProgressRing progress={progressPercent} size={44} />
            <div className="text-[13px] text-white/60">
              <strong className="text-white">{answeredCount}</strong> of {totalQuestions} questions
            </div>
          </div>
        ) : (
          <div className="text-sm text-white/60">
            Step <strong className="text-[#4ADE80]">{currentStep + 1}</strong> of {totalSteps} — <span>{stepName}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-2.5">
          {canGoBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white/8 hover:bg-white/12 text-white/70 hover:text-white rounded-[10px] text-[14px] font-semibold transition-all flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            onClick={onForward}
            disabled={!canGoForward}
            className={`px-6 py-3 rounded-[10px] text-[14px] font-semibold transition-all flex items-center gap-1.5 ${
              canGoForward
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-2 border-emerald-400 hover:border-emerald-500 shadow-lg hover:shadow-[0_4px_16px_rgba(16,185,129,0.5)] text-white font-bold'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {forwardLabel}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

