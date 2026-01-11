/**
 * Step 3 Integration Layer
 * 
 * Connects the new Complete Step 3 with existing Step3Details
 * Provides smooth migration path and backward compatibility
 */
import React, { useState, useEffect } from 'react';
import { CompleteStep3Component } from './CompleteStep3Component';
import { calculateCompleteQuote } from '@/services/CompleteTrueQuoteEngine';

interface Step3IntegrationProps {
  // Existing props from your current implementation
  state?: {
    industry?: string;
    useCaseData?: Record<string, unknown>;
  };
  updateState?: (updates: any) => void;
  onComplete?: (data: any) => void;
  initialData?: Record<string, any>;
  onBack?: () => void;
  onNext?: (quoteData: any) => void;
}

export function Step3Integration({
  state = {},
  updateState,
  onComplete,
  initialData = {},
  onBack,
  onNext
}: Step3IntegrationProps) {
  const [answers, setAnswers] = useState<Record<string, any>>(
    initialData || (state.useCaseData?.inputs as Record<string, any>) || {}
  );
  const [isComplete, setIsComplete] = useState(false);

  // ============================================================================
  // INTEGRATION HOOKS
  // ============================================================================

  // Sync answers with parent component
  useEffect(() => {
    if (updateState) {
      updateState({
        useCaseData: {
          ...state.useCaseData,
          inputs: answers
        }
      });
    }

    if (onComplete) {
      onComplete(answers);
    }
  }, [answers, updateState, onComplete, state.useCaseData]);

  // Handle completion
  const handleComplete = () => {
    const quote = calculateCompleteQuote(answers);
    
    setIsComplete(true);

    if (onNext) {
      onNext({
        answers,
        quote,
        timestamp: new Date().toISOString()
      });
    } else if (updateState) {
      // If no onNext, just update state with quote
      updateState({
        useCaseData: {
          ...state.useCaseData,
          inputs: answers,
          calculated: quote
        }
      });
    }
  };

  // Handle answers update
  const handleAnswersChange = (newAnswers: Record<string, any>) => {
    setAnswers(newAnswers);
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="relative">
      {/* Complete Step 3 Component */}
      <CompleteStep3Component
        state={state}
        updateState={(updates) => {
          // Update state and sync answers
          if (updateState) {
            updateState(updates);
          }
          // Also update local answers if inputs are in updates
          if (updates.useCaseData?.inputs) {
            setAnswers(updates.useCaseData.inputs as Record<string, any>);
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
              <h2 className="text-3xl font-bold text-white mb-3">
                Step 3 Complete!
              </h2>
              <p className="text-slate-300 mb-6">
                Your car wash energy profile has been analyzed and your custom quote is ready.
              </p>

              {/* Quote Summary */}
              <QuoteSummaryCard answers={answers} />

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
                      onNext({ answers, quote: calculateCompleteQuote(answers) });
                    }
                  }}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
                >
                  Continue to Quote →
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
// QUOTE SUMMARY CARD
// ============================================================================
function QuoteSummaryCard({ answers }: { answers: Record<string, any> }) {
  const quote = calculateCompleteQuote(answers);

  return (
    <div className="grid grid-cols-3 gap-4 p-6 bg-slate-800/50 rounded-xl mb-4">
      <div className="text-center">
        <div className="text-sm text-slate-400 mb-1">System Size</div>
        <div className="text-2xl font-bold text-white">
          {quote.solarSystem.totalSolarKW.toFixed(1)} kW
        </div>
        <div className="text-xs text-slate-500">Solar</div>
      </div>

      <div className="text-center">
        <div className="text-sm text-slate-400 mb-1">Annual Savings</div>
        <div className="text-2xl font-bold text-green-400">
          ${Math.round(quote.totalAnnualSavings).toLocaleString()}
        </div>
        <div className="text-xs text-slate-500">Per year</div>
      </div>

      <div className="text-center">
        <div className="text-sm text-slate-400 mb-1">Payback</div>
        <div className="text-2xl font-bold text-white">
          {quote.combinedPayback.toFixed(1)} yrs
        </div>
        <div className="text-xs text-slate-500">Simple payback</div>
      </div>
    </div>
  );
}

export default Step3Integration;
