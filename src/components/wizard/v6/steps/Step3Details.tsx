/**
 * Step3Details - COMPLETE REPLACEMENT
 *
 * Drop-in replacement for existing Step3Details.tsx
 * Uses new CompleteStep3 with full backward compatibility
 *
 * This replaces the old questionnaire engine with the new
 * CompleteStep3 system that includes:
 * - 27 comprehensive questions
 * - 12 question types
 * - Conditional logic
 * - Live calculations
 * - Quote generation
 */

import React from "react";
import { Step3Integration } from "../../Step3Integration";
import type { WizardState } from "../types";

interface Step3DetailsProps {
  state: unknown;
  updateState: (updates: any) => void;
  onNext: () => void;
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}

export function Step3Details({ state, updateState, onNext, onBack }: Step3DetailsProps) {
  // Cast state to proper type
  const wizardState = state as WizardState;
  
  // Extract current answers from state
  const initialData = (wizardState.useCaseData?.inputs as Record<string, unknown>) || {};

  return (
    <Step3Integration
      state={wizardState as any}
      updateState={updateState}
      initialData={initialData}
      onComplete={(data) => {
        // Sync answers back to state as user types
        updateState({
          useCaseData: {
            ...wizardState.useCaseData,
            inputs: data,
          },
        });
      }}
      onNext={(quoteData) => {
        // Save complete data and proceed to Step 4
        // Note: 'calculated' and 'timestamp' are not part of useCaseData type
        // TrueQuote is SSOT for calculations (Step 5)
        updateState({
          useCaseData: {
            ...wizardState.useCaseData,
            inputs: quoteData.answers,
          },
        });
        onNext();
      }}
      onBack={onBack}
    />
  );
}

export default Step3Details;
