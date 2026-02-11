/**
 * ============================================================================
 * WIZARD STEP GATES — SINGLE SOURCE OF TRUTH (Feb 1, 2026)
 * ============================================================================
 *
 * DOCTRINE:
 * - Each step owns exactly ONE question: "Is this step complete?"
 * - Nothing else can block navigation
 * - No pricing, no DB, no defaults, no global invariants
 * - Navigation must NEVER depend on future steps
 *
 * ALLOWED GATES:
 * | Step          | Allowed to block on           |
 * |---------------|-------------------------------|
 * | location      | ZIP OR address only           |
 * | industry      | industry selection only       |
 * | profile       | profile answers only          |
 * | results       | nothing (read-only)           |
 *
 * FORBIDDEN:
 * - Pricing readiness
 * - DB lookups
 * - Defaults applied
 * - Async hydration state
 * - Any cross-step dependencies
 */

export type WizardStepId = "location" | "industry" | "profile" | "results";

export type WizardGateResult = {
  canContinue: boolean;
  reason?: WizardGateReason;
};

export type WizardGateReason =
  | "zip-incomplete"
  | "zip-unconfirmed"
  | "address-incomplete"
  | "industry-missing"
  | "profile-incomplete"
  | "profile-required-missing";


/**
 * Minimal state shape required for gate evaluation.
 * Keep this minimal to prevent scope creep.
 */
export interface WizardGateState {
  // Location step
  location?: {
    zip?: string;
    postalCode?: string;
    formattedAddress?: string;
  } | null;
  locationRawInput?: string;
  locationConfirmed?: boolean;

  // Industry step
  industry?: string | null;

  // Profile step
  step3Answers?: Record<string, unknown>;
  step3Complete?: boolean;
  step3Template?: {
    questions?: Array<{ id: string; required?: boolean }>;
  } | null;
}

// ============================================================================
// STEP 1: LOCATION GATE
// ============================================================================
/**
 * Location step is complete if we have:
 * - A valid ZIP OR a resolved formatted address
 * - PLUS explicit user confirmation (prevents auto-advance)
 *
 * Business is OPTIONAL and does not block navigation.
 */
export function gateLocation(state: WizardGateState): WizardGateResult {
  const raw =
    state.locationRawInput ||
    state.location?.postalCode ||
    state.location?.zip ||
    "";

  const normalizedZip = (raw || "").replace(/\D/g, "");

  // DEV logging only, but avoid WARN spam for "normal typing"
  if (import.meta.env.DEV) {
    console.log("[gateLocation] Checking:", {
      locationRawInput: state.locationRawInput,
      postalCode: state.location?.postalCode,
      zip: state.location?.zip,
      normalizedZip,
      length: normalizedZip.length,
      locationConfirmed: Boolean(state.locationConfirmed),
      hasFormattedAddress: Boolean(state.location?.formattedAddress),
    });
  }

  // Valid ZIP path (US): require confirm
  if (normalizedZip.length >= 5) {
    if (!state.locationConfirmed) {
      if (import.meta.env.DEV) {
        console.log("[gateLocation] ZIP valid but not confirmed");
      }
      return { canContinue: false, reason: "zip-unconfirmed" };
    }
    return { canContinue: true };
  }

  // Address path: allow if address resolved (also requires confirm if you want strict symmetry)
  if (state.location?.formattedAddress) {
    if (!state.locationConfirmed) {
      return { canContinue: false, reason: "address-incomplete" };
    }
    return { canContinue: true };
  }

  // Optional "relaxed gates" override (AI Agent)
  if (typeof window !== "undefined") {
    const relaxed = localStorage.getItem("wizardRelaxedGates");
    const expiry = Number(localStorage.getItem("wizardRelaxedGatesExpiry"));
    if (relaxed === "true" && expiry > Date.now()) {
      if (import.meta.env.DEV) {
        console.warn("[gateLocation] ⚠️ Relaxed gates override active");
      }
      return { canContinue: true };
    }
  }

  return { canContinue: false, reason: "zip-incomplete" };
}

// ============================================================================
// STEP 2: INDUSTRY GATE
// ============================================================================
/**
 * Industry step is complete if an industry is selected.
 * That's it. No pricing. No DB. No defaults.
 */
export function gateIndustry(state: WizardGateState): WizardGateResult {
  if (!state.industry || state.industry === "auto") {
    return { canContinue: false, reason: "industry-missing" };
  }
  return { canContinue: true };
}

// ============================================================================
// STEP 3: PROFILE GATE
// ============================================================================
/**
 * Profile step is complete if:
 * - step3Complete flag is true, OR
 * - All required questions have answers
 * 
 * Does NOT check:
 * - Pricing readiness
 * - Defaults applied
 * - Quote generation
 */
export function gateProfile(state: WizardGateState): WizardGateResult {
  // Fast path: explicit completion flag
  if (state.step3Complete) {
    return { canContinue: true };
  }

  // Check required questions have answers
  const template = state.step3Template;
  const answers = state.step3Answers || {};

  if (!template?.questions) {
    // No template = can proceed (will show defaults or empty state)
    return { canContinue: true };
  }

  const requiredQuestions = template.questions.filter((q) => q.required);
  const missingRequired = requiredQuestions.filter((q) => {
    const answer = answers[q.id];
    return answer === undefined || answer === null || answer === "";
  });

  if (missingRequired.length > 0) {
    return { canContinue: false, reason: "profile-required-missing" };
  }

  return { canContinue: true };
}

// ============================================================================
// STEP 4: RESULTS GATE
// ============================================================================
/**
 * Results step NEVER blocks. It's read-only.
 * If pricing fails, show a banner. Don't block the wizard.
 */
export function gateResults(): WizardGateResult {
  return { canContinue: true };
}

// ============================================================================
// DISPATCHER — Single entry point for all gate checks
// ============================================================================
export function getGateForStep(
  step: WizardStepId,
  state: WizardGateState
): WizardGateResult {
  switch (step) {
    case "location":
      return gateLocation(state);
    case "industry":
      return gateIndustry(state);
    case "profile":
      return gateProfile(state);
    case "results":
      return gateResults();
    default: {
      // Exhaustive check - TypeScript will catch missing cases
      const _exhaustive: never = step;
      return { canContinue: false };
    }
  }
}

// ============================================================================
// HELPER: Check if step can proceed to next
// ============================================================================
export function canProceedFromStep(
  currentStep: WizardStepId,
  state: WizardGateState
): boolean {
  return getGateForStep(currentStep, state).canContinue;
}

// ============================================================================
// HELPER: Get human-readable gate reason
// ============================================================================
export function getGateReasonMessage(reason: WizardGateReason | undefined): string {
  switch (reason) {
    case "zip-incomplete":
      return "Please enter a valid ZIP code";
    case "zip-unconfirmed":
      return "Click Continue to confirm your ZIP";
    case "address-incomplete":
      return "Please confirm your address";
    case "industry-missing":
      return "Please select an industry";
    case "profile-incomplete":
      return "Please complete the profile questions";
    case "profile-required-missing":
      return "Please answer all required questions";
    default:
      return "";
  }
}

// ============================================================================
// STEP ORDER — For navigation logic
// ============================================================================
export const WIZARD_STEP_ORDER: WizardStepId[] = [
  "location",
  "industry",
  "profile",
  "results",
];

export function getNextStep(currentStep: WizardStepId): WizardStepId | null {
  const currentIndex = WIZARD_STEP_ORDER.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex >= WIZARD_STEP_ORDER.length - 1) {
    return null;
  }
  return WIZARD_STEP_ORDER[currentIndex + 1];
}

export function getPreviousStep(currentStep: WizardStepId): WizardStepId | null {
  const currentIndex = WIZARD_STEP_ORDER.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return WIZARD_STEP_ORDER[currentIndex - 1];
}

export function getStepIndex(step: WizardStepId): number {
  return WIZARD_STEP_ORDER.indexOf(step);
}
