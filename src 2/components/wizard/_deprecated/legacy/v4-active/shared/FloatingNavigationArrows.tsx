/**
 * FLOATING NAVIGATION ARROWS
 * ===========================
 * 
 * Apple-like floating navigation buttons.
 * Left arrow: Go back (always visible if not first step)
 * Right arrow: Advance to next step (lights up when ready)
 * 
 * Position: Fixed, mid-screen, elegant
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface FloatingNavigationArrowsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  backLabel?: string;
  forwardLabel?: string;
}

export function FloatingNavigationArrows({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  backLabel = 'Back',
  forwardLabel = 'Continue',
}: FloatingNavigationArrowsProps) {
  return (
    <>
      {/* Left Arrow - Back */}
      {canGoBack && (
        <button
          onClick={onBack}
          className="fixed left-6 top-1/2 -translate-y-1/2 z-50 
                     w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm
                     border-2 border-gray-200 shadow-xl
                     flex items-center justify-center
                     hover:bg-white hover:border-indigo-300 hover:shadow-2xl
                     transition-all duration-200
                     group"
          aria-label={backLabel}
        >
          <ChevronLeft className="w-7 h-7 text-gray-700 group-hover:text-indigo-600 transition-colors" />
        </button>
      )}
      
      {/* Right Arrow - Forward */}
      <button
        onClick={onForward}
        disabled={!canGoForward}
        className={`fixed right-6 top-1/2 -translate-y-1/2 z-50 
                    w-14 h-14 rounded-full backdrop-blur-sm
                    border shadow-lg
                    flex items-center justify-center
                    transition-all duration-200
                    group
                    ${
                      canGoForward
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-2 border-emerald-400/50 hover:from-emerald-600 hover:to-teal-600 hover:border-emerald-500 hover:shadow-xl hover:shadow-[0_8px_24px_rgba(16,185,129,0.4)] hover:scale-110'
                        : 'bg-gray-200/50 border-gray-300 cursor-not-allowed'
                    }`}
        aria-label={forwardLabel}
      >
        <ChevronRight className={`w-7 h-7 transition-colors ${
          canGoForward
            ? 'text-white group-hover:text-white'
            : 'text-gray-400'
        }`} />
      </button>
      
    </>
  );
}

