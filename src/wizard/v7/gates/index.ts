/**
 * Wizard Step Gates — Public API
 */
export {
  // Types
  type WizardStepId,
  type WizardGateResult,
  type WizardGateReason,
  type WizardGateState,
  
  // Gate functions
  gateLocation,
  gateIndustry,
  gateProfile,
  gateOptions,
  gateMagicFit,
  gateResults,
  
  // Dispatcher
  getGateForStep,
  
  // Helpers
  canProceedFromStep,
  getGateReasonMessage,
  
  // Step order
  WIZARD_STEP_ORDER,
  getNextStep,
  getPreviousStep,
  getStepIndex,
} from "./wizardStepGates";
