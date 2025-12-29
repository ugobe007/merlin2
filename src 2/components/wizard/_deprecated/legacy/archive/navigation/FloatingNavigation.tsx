/**
 * FLOATING NAVIGATION - Mid-page navigation buttons
 * 
 * December 18, 2025
 * 
 * Provides sticky floating Back/Next buttons that follow the user
 * as they scroll through long wizard steps.
 */

import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export interface FloatingNavigationProps {
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  isLoading?: boolean;
  showBack?: boolean;
  backLabel?: string;
}

export function FloatingNavigation({
  onBack,
  onContinue,
  continueLabel = 'Next',
  continueDisabled = false,
  isLoading = false,
  showBack = true,
  backLabel = 'Back',
}: FloatingNavigationProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 p-2 border border-gray-200">
        {/* Back Button */}
        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-bold rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            {backLabel}
          </button>
        )}
        
        {/* Continue Button */}
        <button
          onClick={onContinue}
          disabled={continueDisabled || isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6700b6] to-[#060F76] hover:from-[#7800d4] hover:to-[#0815a0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
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
      </div>
    </div>
  );
}

export default FloatingNavigation;
