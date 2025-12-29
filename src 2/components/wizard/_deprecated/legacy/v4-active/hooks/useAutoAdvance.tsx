/**
 * USE AUTO ADVANCE HOOK
 * =====================
 * 
 * December 2025 - Requirement F
 * 
 * Automatically advances to the next step when current step is complete.
 * Provides visual feedback before advancing.
 * 
 * Usage:
 * ```tsx
 * const { showingComplete, shouldAutoAdvance } = useAutoAdvance({
 *   isComplete: allFieldsValid,
 *   onAdvance: () => setCurrentSection(s => s + 1),
 *   delay: 600,
 *   enabled: true,
 * });
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';

export interface UseAutoAdvanceOptions {
  /**
   * Whether the current step is complete and ready to advance
   */
  isComplete: boolean;
  
  /**
   * Callback to execute when advancing to next step
   */
  onAdvance: () => void;
  
  /**
   * Delay in ms before auto-advancing (default: 600ms)
   * Gives user visual feedback that step is complete
   */
  delay?: number;
  
  /**
   * Whether auto-advance is enabled (default: true)
   * Can be disabled for specific sections or user preference
   */
  enabled?: boolean;
  
  /**
   * Minimum time user must spend on step before auto-advance (default: 1000ms)
   * Prevents immediate advancement when pre-filled values make step instantly complete
   */
  minimumTimeOnStep?: number;
}

export interface UseAutoAdvanceReturn {
  /**
   * Whether the completion animation should be shown
   */
  showingComplete: boolean;
  
  /**
   * Whether auto-advance should happen (respects all conditions)
   */
  shouldAutoAdvance: boolean;
  
  /**
   * Manually trigger advance (bypasses delay)
   */
  triggerAdvance: () => void;
  
  /**
   * Cancel pending auto-advance
   */
  cancelAdvance: () => void;
  
  /**
   * Time remaining before auto-advance (in ms)
   */
  timeRemaining: number;
}

export function useAutoAdvance({
  isComplete,
  onAdvance,
  delay = 600,
  enabled = true,
  minimumTimeOnStep = 1000,
}: UseAutoAdvanceOptions): UseAutoAdvanceReturn {
  const [showingComplete, setShowingComplete] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasBeenIncomplete, setHasBeenIncomplete] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const stepStartRef = useRef<number>(Date.now());
  const hasAdvancedRef = useRef(false);
  
  // Reset when step changes (enabled changes from false to true)
  useEffect(() => {
    if (enabled) {
      stepStartRef.current = Date.now();
      hasAdvancedRef.current = false;
      setHasBeenIncomplete(false);
      setShowingComplete(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [enabled]);
  
  // Track if step has ever been incomplete (prevents auto-advance on pre-filled steps)
  useEffect(() => {
    if (!isComplete && !hasBeenIncomplete) {
      setHasBeenIncomplete(true);
    }
  }, [isComplete, hasBeenIncomplete]);
  
  // Cancel advance
  const cancelAdvance = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setShowingComplete(false);
    setTimeRemaining(0);
  }, []);
  
  // Manual advance
  const triggerAdvance = useCallback(() => {
    cancelAdvance();
    hasAdvancedRef.current = true;
    onAdvance();
  }, [onAdvance, cancelAdvance]);
  
  // Auto-advance logic
  useEffect(() => {
    // Don't auto-advance if:
    // - Not enabled
    // - Not complete
    // - Already advanced
    // - Step was never incomplete (pre-filled data)
    if (!enabled || !isComplete || hasAdvancedRef.current || !hasBeenIncomplete) {
      return;
    }
    
    // Check minimum time on step
    const timeOnStep = Date.now() - stepStartRef.current;
    if (timeOnStep < minimumTimeOnStep) {
      // Wait until minimum time has passed, then check again
      const remainingTime = minimumTimeOnStep - timeOnStep;
      const minTimeTimer = setTimeout(() => {
        // Re-trigger the effect by updating state
        setShowingComplete(prev => prev);
      }, remainingTime);
      return () => clearTimeout(minTimeTimer);
    }
    
    // Show completion state
    setShowingComplete(true);
    setTimeRemaining(delay);
    
    // Countdown timer for visual feedback
    countdownRef.current = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 100));
    }, 100);
    
    // Auto-advance after delay
    timerRef.current = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setShowingComplete(false);
      setTimeRemaining(0);
      hasAdvancedRef.current = true;
      onAdvance();
    }, delay);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isComplete, enabled, hasBeenIncomplete, delay, minimumTimeOnStep, onAdvance]);
  
  const shouldAutoAdvance = enabled && isComplete && hasBeenIncomplete && !hasAdvancedRef.current;
  
  return {
    showingComplete,
    shouldAutoAdvance,
    triggerAdvance,
    cancelAdvance,
    timeRemaining,
  };
}

// ============================================
// COMPLETION INDICATOR COMPONENT
// ============================================
// Note: React and CheckCircle imports moved to top of file

export interface CompletionIndicatorProps {
  show: boolean;
  message?: string;
  onCancel?: () => void;
}

export function CompletionIndicator({ 
  show, 
  message = "Great! Moving to next step...",
  onCancel,
}: CompletionIndicatorProps) {
  if (!show) return null;
  
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fadeInUp">
      <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 text-white rounded-full shadow-xl shadow-emerald-500/30 font-semibold">
        <CheckCircle className="w-5 h-5 animate-bounce" />
        <span>{message}</span>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// Add the keyframe animation to your global CSS or tailwind config:
// @keyframes fadeInUp {
//   from {
//     opacity: 0;
//     transform: translate(-50%, 10px);
//   }
//   to {
//     opacity: 1;
//     transform: translate(-50%, 0);
//   }
// }
// .animate-fadeInUp {
//   animation: fadeInUp 0.3s ease-out;
// }

export default useAutoAdvance;
