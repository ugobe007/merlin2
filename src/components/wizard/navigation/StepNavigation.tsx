/**
 * STEP NAVIGATION - Unified navigation for all wizard steps
 * 
 * December 17, 2025 - Per definitive wizard spec
 * 
 * Provides consistent Back/Home/Next buttons for every step.
 * White text on dark backgrounds guaranteed.
 */

import React from 'react';
import { ChevronLeft, ChevronRight, Home, Loader2 } from 'lucide-react';

export interface StepNavigationProps {
  onBack: () => void;
  onHome: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  isLoading?: boolean;
  showContinue?: boolean;
  showBack?: boolean;
  backLabel?: string;
  /** Optional custom continue button (for Generate TrueQuote, etc.) */
  customContinueButton?: React.ReactNode;
}

export function StepNavigation({
  onBack,
  onHome,
  onContinue,
  continueLabel = 'Next Step',
  continueDisabled = false,
  isLoading = false,
  showContinue = true,
  showBack = true,
  backLabel = 'Back',
  customContinueButton,
}: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
      {/* Left side - Back and Home */}
      <div className="flex gap-3">
        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            {backLabel}
          </button>
        )}
        
        <button
          onClick={onHome}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-gray-200 hover:text-white rounded-xl border border-slate-600 transition-all"
        >
          <Home className="w-5 h-5" />
          Home
        </button>
      </div>
      
      {/* Right side - Continue button */}
      {showContinue && (
        customContinueButton || (
          <button
            onClick={onContinue}
            disabled={continueDisabled || isLoading}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {continueLabel}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        )
      )}
    </div>
  );
}

export default StepNavigation;
