/**
 * Step3Details - V6 Questionnaire Step
 *
 * Uses CompleteStep3 via Step3Integration for:
 * - 27 comprehensive questions
 * - 12 question types
 * - Conditional logic
 * - Live calculations
 * - Quote generation
 *
 * Updated Jan 24, 2026: Removed ProgressiveModelPanel (battery sizing micro-prompts)
 * per user feedback - users want full questionnaire without extra panels.
 */

import React, { useMemo } from "react";
import { Step3Integration } from "../../Step3Integration";
import type { WizardState } from "../types";

interface Step3DetailsProps {
  state: WizardState; // ✅ FIX: no more unknown
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void; // UI hint only (SSOT gating lives in WizardV6 snapshot)
}

export function Step3Details({
  state,
  updateState,
  onNext,
  onBack,
  onValidityChange,
}: Step3DetailsProps) {
  // Extract current answers from state (stable memo)
  const initialData = useMemo(
    () => ((state.useCaseData?.inputs as Record<string, unknown>) || {}),
    [state.useCaseData?.inputs]
  );

  return (
    <div className="space-y-6">
      {/* ========================================================================
          STEP 3 QUESTIONNAIRE - Industry-specific questions
          Note: Step3Integration has slightly different types due to legacy API
          eslint-disable @typescript-eslint/no-explicit-any - Type coercion needed
          ======================================================================== */}
      <Step3Integration
        // Legacy API mismatch: keep coercion local
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state={state as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateState={updateState as any}
        initialData={initialData}
        onComplete={(data) => {
          // Sync answers back to state as user types
          updateState({
            useCaseData: {
              ...state.useCaseData,
              inputs: data as Record<string, unknown>,
            },
          });
        }}
        onNext={(quoteData) => {
          // Save complete data and proceed to Step 4
          updateState({
            useCaseData: {
              ...state.useCaseData,
              inputs: quoteData.answers,
            },
          });
          onNext();
        }}
        onBack={onBack}
        onValidityChange={onValidityChange}
      />
    </div>
  );
}

export default Step3Details;
