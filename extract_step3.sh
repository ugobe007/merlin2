#!/bin/bash
# Op1b: Extract useWizardStep3 - Surgical removal script

FILE="src/wizard/v7/hooks/useWizardV7.ts"

# Step 1: Add import after useWizardLocation
sed -i '' '/import { useWizardLocation } from ".\/useWizardLocation";/a\
import { useWizardStep3 } from "./useWizardStep3";
' "$FILE"

# Step 2: Remove lines 2523-2702 (Step 3 callbacks before runPricingSafe)
# Add marker comment first
sed -i '' '2522a\
\
  // ============================================================\
  // Step 3: Extracted to useWizardStep3 hook (Op1b - Feb 22, 2026)\
  // ============================================================\
  // Extracted 15 functions (~440 lines):\
  // - Answer: setStep3Answer, setStep3Answers, applyIntelPatch, resetToDefaults\
  // - FSM: markDefaultsApplied, goToNextPart, goToPrevPart, setPartIndex, hasDefaultsApplied\
  // - Defaults: partHasAnyDefaults, canApplyDefaults, canResetToDefaults, getDefaultForQuestion\
  // - Submission: submitStep3, submitStep3Partial\
  // Hook invocation added before goToStep (see below)\
' "$FILE"

# Now delete the old functions (lines 2523-2702 become 2534-2713 after insert)
sed -i '' '2534,2713d' "$FILE"

# Step 3: Remove lines 3374-3698 (submitStep3 + submitStep3Partial)
# First find new line numbers after first deletion
# Original 3374 - (2713-2534+1=180 deleted) = 3374-180 = 3194
sed -i '' '3194,3518d' "$FILE"

# Step 4: Add hook invocation before goToStep
# Original line 3699 - 180 (first delete) - 325 (second delete) = 3194
sed -i '' '3193a\
\
  // ============================================================\
  // Step 3: Hook Invocation (Op1b - Feb 22, 2026)\
  // ============================================================\
  const step3Actions = useWizardStep3({\
    state: {\
      step: state.step,\
      industry: state.industry,\
      step3Answers: state.step3Answers,\
      step3AnswersMeta: state.step3AnswersMeta,\
      step3Template: state.step3Template || undefined,\
      step3DefaultsAppliedParts: state.step3DefaultsAppliedParts,\
      locationIntel: state.locationIntel || undefined,\
      businessCard: state.businessCard || undefined,\
      location: state.location || undefined,\
      locationConfirmed: state.locationConfirmed,\
      goalsConfirmed: state.goalsConfirmed,\
      step3Complete: state.step3Complete,\
      pricingStatus: state.pricingStatus,\
      step4AddOns: state.step4AddOns,\
    },\
    dispatch: dispatch as any, // eslint-disable-line @typescript-eslint/no-explicit-any\
    api,\
    clearError,\
    setError,\
    abortOngoing,\
    setStep,\
    runPricingSafe,\
    buildMinimalLocationFromZip,\
  });\
' "$FILE"

echo "✅ Step 3 callbacks extracted"
echo "📊 Checking line count..."
wc -l "$FILE"
