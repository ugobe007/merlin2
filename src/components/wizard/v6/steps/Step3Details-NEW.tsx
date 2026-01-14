/**
 * Step3Details - COMPLETE REPLACEMENT
 * 
 * Drop-in replacement for existing Step3Details.tsx
 * Uses new CompleteStep3 with full backward compatibility
 */

import React from 'react';
import { Step3Integration } from '../../Step3Integration';

interface Step3DetailsProps {
  state: any;
  updateState: (updates: any) => void;
  onNext: () => void;
  onBack?: () => void;
}

export function Step3Details({
  state,
  updateState,
  onNext,
  onBack
}: Step3DetailsProps) {
  // Extract current answers from state
  const initialData = (state.useCaseData?.inputs as Record<string, any>) || {};

  return (
    <Step3Integration
      state={state}
      updateState={updateState}
      initialData={initialData}
      onComplete={(data) => {
        // Sync answers back to state
        updateState({
          useCaseData: {
            ...state.useCaseData,
            inputs: data
          }
        });
      }}
      onNext={(quoteData) => {
        // Save complete data and proceed
        // Note: TrueQuote is SSOT for calculations (Step 5)
        updateState({
          useCaseData: {
            ...state.useCaseData,
            inputs: quoteData.answers,
          }
        });
        onNext();
      }}
      onBack={onBack}
    />
  );
}

export default Step3Details;
