/**
 * Step 3 Integration Layer
 *
 * Connects the new Complete Step 3 with existing Step3Details
 * Provides smooth migration path and backward compatibility
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { CompleteStep3Component } from "./CompleteStep3Component";
import { assertNoDerivedFieldsInStep3 } from "./v6/utils/wizardStateValidator";
// ✅ REMOVED: calculateCompleteQuote import
// Step 3 no longer computes derived values - TrueQuote is SSOT (Option A - Recommended)
// import { calculateCompleteQuote } from '@/services/CompleteTrueQuoteEngine';

type WizardStep3State = {
  industry?: string;
  useCaseData?: Record<string, unknown> & {
    inputs?: Record<string, unknown>;
  };
};

interface Step3IntegrationProps {
  state?: WizardStep3State;
  updateState?: (updates: Partial<WizardStep3State>) => void;
  onComplete?: (data: unknown) => void;
  initialData?: Record<string, unknown>;
  onBack?: () => void;
  onNext?: (quoteData: { answers: Record<string, unknown>; timestamp: string }) => void;
}

export function Step3Integration({
  state = {},
  updateState,
  onComplete,
  initialData = {},
  onBack,
  onNext,
}: Step3IntegrationProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => {
    const fromInitial = initialData && Object.keys(initialData).length > 0 ? initialData : null;

    const fromState = (state.useCaseData?.inputs as Record<string, unknown>) ?? null;

    return fromInitial ?? fromState ?? {};
  });
  const [isComplete, setIsComplete] = useState(false);

  // ============================================================================
  // INTEGRATION HOOKS
  // ============================================================================

  // Sync answers with parent component (debounced to prevent infinite loops)
  const prevAnswersRef = useRef<Record<string, unknown>>(answers);
  useEffect(() => {
    // Only update if answers actually changed (deep comparison)
    const answersChanged = JSON.stringify(prevAnswersRef.current) !== JSON.stringify(answers);

    if (answersChanged && updateState) {
      prevAnswersRef.current = answers;
      updateState({
        useCaseData: {
          ...state.useCaseData,
          inputs: answers,
        },
      });
    }
  }, [answers, updateState, state.useCaseData]);

  // Handle completion
  const handleComplete = () => {
    // ✅ OPTION A (RECOMMENDED): Step 3 only stores raw inputs
    // TrueQuote is SSOT for derived values (estimatedAnnualKwh, peakDemandKw)
    // These will be computed by TrueQuoteEngineV2 in Step 5

    setIsComplete(true);

    // ✅ INVARIANT A: Build the next state and assert no derived fields
    const nextState = {
      ...state,
      useCaseData: {
        ...state.useCaseData,
        inputs: answers,
        // NOTE: estimatedAnnualKwh and peakDemandKw will be computed by TrueQuote in Step 5
        // This ensures TrueQuote is the single source of truth for all calculations
      },
    };

    // ✅ CONTRACT INVARIANT A: Block any attempt to persist derived fields into useCaseData
    // Validates the actual next state you intend to commit
    if (import.meta.env.DEV) {
      assertNoDerivedFieldsInStep3(nextState);
    }

    // Update state with ONLY raw inputs (no derived calculations)
    if (updateState) {
      updateState({
        useCaseData: nextState.useCaseData,
      });
    }

    // Call onComplete if provided
    onComplete?.(nextState.useCaseData);

    if (onNext) {
      onNext({
        answers,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Handle answers update (memoized to prevent infinite loops)
  const handleAnswersChange = useCallback(
    (newAnswers: Record<string, unknown>) => {
      // Only update if answers actually changed
      const answersChanged = JSON.stringify(answers) !== JSON.stringify(newAnswers);
      if (answersChanged) {
        setAnswers(newAnswers);
      }
    },
    [answers]
  );

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="relative">
      {/* Complete Step 3 Component */}
      <CompleteStep3Component
        state={state}
        updateState={(updates: Partial<WizardStep3State>) => {
          // Update state and sync answers
          if (updateState) {
            updateState(updates);
          }
          // Also update local answers if inputs are in updates
          if (
            updates.useCaseData &&
            "inputs" in updates.useCaseData &&
            updates.useCaseData.inputs
          ) {
            setAnswers(updates.useCaseData.inputs as Record<string, unknown>);
          }
        }}
        initialAnswers={answers}
        onAnswersChange={handleAnswersChange}
        onComplete={handleComplete}
        onBack={onBack}
        onNext={() => {
          // This will be handled by handleComplete
          handleComplete();
        }}
      />

      {/* Overlay for completion state */}
      {isComplete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="max-w-2xl p-8 bg-slate-900 rounded-2xl border-2 border-green-500 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-3">Step 3 Complete!</h2>
              <p className="text-slate-300 mb-6">
                Your car wash energy profile has been analyzed and your custom quote is ready.
              </p>

              {/* NOTE: Quote summary removed - TrueQuote will compute in Step 5 */}
              <p className="text-slate-400 mb-6">
                Your answers have been saved. Click Continue to proceed to Step 4.
              </p>

              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={() => setIsComplete(false)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Review Answers
                </button>
                <button
                  onClick={() => {
                    if (onNext) {
                      // ✅ Only pass raw answers - TrueQuote will compute in Step 5
                      onNext({ answers, timestamp: new Date().toISOString() });
                    }
                  }}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
                >
                  Continue to Step 4 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// QUOTE SUMMARY CARD - REMOVED
// ============================================================================
// ✅ REMOVED: QuoteSummaryCard component
// Step 3 no longer computes derived values - TrueQuote is SSOT
// Quote summary will be shown in Step 5 after TrueQuote computes results

export default Step3Integration;
