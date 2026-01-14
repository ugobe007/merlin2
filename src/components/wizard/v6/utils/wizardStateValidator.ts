/**
 * Wizard State Validator
 *
 * Validates WizardState before calling TrueQuote engine
 * Ensures all required fields exist and data contracts are satisfied
 *
 * This is the "non-negotiable contract" between UI and Engine
 */

import type { WizardState } from "../types";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  expected: string;
  received: string | null | undefined;
  step: number;
}

export interface ValidationWarning {
  field: string;
  message: string;
  step: number;
}

/**
 * Validate WizardState before Step 5 (MagicFit/TrueQuote)
 *
 * Required fields:
 * - zipCode (Step 1)
 * - state (Step 1)
 * - industry (Step 2)
 * - useCaseData.inputs (Step 3)
 *
 * Optional but recommended:
 * - useCaseData.estimatedAnnualKwh (if pre-calculated)
 * - useCaseData.peakDemandKw (if pre-calculated)
 */
export function validateWizardStateForTrueQuote(state: WizardState): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // ============================================================================
  // STEP 1: Location & Goals
  // ============================================================================
  if (!state.zipCode || state.zipCode.length !== 5) {
    errors.push({
      field: "zipCode",
      expected: "5-digit ZIP code",
      received: state.zipCode || null,
      step: 1,
    });
  }

  if (!state.state) {
    errors.push({
      field: "state",
      expected: "2-letter state code",
      received: state.state || null,
      step: 1,
    });
  }

  if (!state.goals || state.goals.length < 2) {
    errors.push({
      field: "goals",
      expected: "at least 2 energy goals",
      received: `${state.goals?.length || 0} goals`,
      step: 1,
    });
  }

  // ============================================================================
  // STEP 2: Industry
  // ============================================================================
  if (!state.industry) {
    errors.push({
      field: "industry",
      expected: 'industry type (e.g., "car_wash", "hotel")',
      received: state.industry || null,
      step: 2,
    });
  }

  if (!state.industryName) {
    warnings.push({
      field: "industryName",
      message: "industryName not set, will use industry value",
      step: 2,
    });
  }

  // ============================================================================
  // STEP 3: Use Case Data (CRITICAL - This is what TrueQuote reads)
  // ============================================================================
  if (!state.useCaseData) {
    errors.push({
      field: "useCaseData",
      expected: "useCaseData object with inputs",
      received: null,
      step: 3,
    });
  } else {
    // CRITICAL: TrueQuote reads from useCaseData.inputs
    if (!state.useCaseData.inputs || typeof state.useCaseData.inputs !== "object") {
      errors.push({
        field: "useCaseData.inputs",
        expected: "object with question answers (e.g., { facilityType, bayCount, ... })",
        received: state.useCaseData.inputs ? typeof state.useCaseData.inputs : null,
        step: 3,
      });
    } else {
      // Validate that inputs object has at least some keys
      const inputKeys = Object.keys(state.useCaseData.inputs);
      if (inputKeys.length === 0) {
        errors.push({
          field: "useCaseData.inputs",
          expected: "at least one answer",
          received: "empty object",
          step: 3,
        });
      }

      // Industry-specific validation (optional but recommended)
      const inputsRecord = state.useCaseData.inputs as Record<string, unknown>;
      const industryValidation = validateIndustrySpecificInputs(
        state.industry,
        inputsRecord
      );
      errors.push(...industryValidation.errors);
      warnings.push(...industryValidation.warnings);
    }

    // Note: estimatedAnnualKwh and peakDemandKw are now computed by TrueQuote, not stored in useCaseData
    // They will exist in state.calculations after Step 5 runs
  }

  // ============================================================================
  // STEP 4: Preferences (Optional for TrueQuote, but recommended)
  // ============================================================================
  // selectedOptions, customSolarKw, etc. are optional
  // TrueQuote will use defaults if not provided

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Type guard helper for Record<string, unknown>
 */
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/**
 * Validate industry-specific inputs
 * Each industry has required fields that must be present
 */
function validateIndustrySpecificInputs(
  industry: string | undefined,
  inputs: Record<string, unknown>
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!industry) {
    return { errors, warnings };
  }

  // Car Wash specific validation
  if (industry === "car_wash" || industry === "car-wash") {
    if (!inputs.facilityType) {
      errors.push({
        field: "facilityType",
        expected: 'car wash facility type (e.g., "express_tunnel", "in_bay_automatic")',
        received: String(inputs.facilityType ?? null),
        step: 3,
      });
    }

    if (inputs.bayCount === undefined || inputs.bayCount === null) {
      errors.push({
        field: "bayCount",
        expected: "number of bays",
        received: String(inputs.bayCount ?? null),
        step: 3,
      });
    }
  }

  // Hotel specific validation
  if (industry === "hotel") {
    if (!inputs.roomCount && inputs.roomCount !== 0) {
      errors.push({
        field: "roomCount",
        expected: "number of rooms",
        received: String(inputs.roomCount ?? null),
        step: 3,
      });
    }
  }

  // Add more industry-specific validations as needed

  return { errors, warnings };
}

/**
 * Assert WizardState is valid before calling TrueQuote
 * Throws error if validation fails (for use in development)
 */
export function assertWizardStateForTrueQuote(state: WizardState): void {
  const validation = validateWizardStateForTrueQuote(state);

  if (!validation.valid) {
    const errorMessages = validation.errors
      .map((e) => `Step ${e.step}: ${e.field} - Expected ${e.expected}, got ${e.received}`)
      .join("\n");

    throw new Error(
      `WizardState validation failed:\n${errorMessages}\n\n` +
        `This means the UI state is not ready for TrueQuote engine.\n` +
        `Fix: Ensure all required fields are set before Step 5.`
    );
  }

  // Log warnings in development
  if (validation.warnings.length > 0 && process.env.NODE_ENV === "development") {
    console.warn("WizardState validation warnings:", validation.warnings);
  }
}

// ============================================================================
// CONTRACT INVARIANTS (Fail loudly in dev)
// ============================================================================

/**
 * ✅ INVARIANT A: "No derived fields in Step 3 payload"
 *
 * Assert that useCaseData only contains inputs (and maybe meta), but not any derived fields.
 * This prevents a future dev from reintroducing Step 3 calculations "just for convenience."
 *
 * Step 3 contract: Only raw inputs belong in useCaseData.
 * Derived values (annualConsumptionKWh, peakDemandKW) belong in state.calculations (Step 5 SSOT).
 */
export function assertNoDerivedFieldsInStep3(
  state:
    | WizardState
    | { useCaseData?: { inputs?: Record<string, unknown>; [key: string]: unknown } }
): void {
  if (!state.useCaseData) {
    return; // OK - useCaseData doesn't exist yet
  }

  const useCaseData = state.useCaseData;
  const derivedFields = [
    "estimatedAnnualKwh",
    "peakDemandKw",
    "annualConsumptionKWh",
    "peakDemandKW",
  ];
  const foundDerivedFields = isRecord(useCaseData)
    ? derivedFields.filter((field) => field in useCaseData)
    : [];

  if (foundDerivedFields.length > 0) {
    const errorMessage =
      `❌ CONTRACT VIOLATION: Derived fields found in useCaseData (Step 3 payload)\n` +
      `\n` +
      `Found: ${foundDerivedFields.join(", ")}\n` +
      `\n` +
      `Step 3 contract: useCaseData should ONLY contain raw inputs (useCaseData.inputs).\n` +
      `Derived values (${foundDerivedFields.join(", ")}) belong in state.calculations (Step 5 SSOT).\n` +
      `\n` +
      `Fix: Remove derived fields from Step 3. TrueQuote is SSOT for all calculations.`;

    if (process.env.NODE_ENV === "development") {
      console.error(errorMessage);
      throw new Error(errorMessage);
    } else {
      // In production, log but don't throw (graceful degradation)
      console.warn(errorMessage);
    }
  }
}

/**
 * ✅ INVARIANT B: "Engine output must populate calculations"
 *
 * After Step 5 gets TrueQuoteAuthenticatedResult, assert that base values are populated in state.calculations.
 * This ensures the engine/output contract is satisfied.
 *
 * If missing, treat it as an engine/output contract issue, not a UI issue.
 */
export function assertEngineOutputPopulatesCalculations({
  result,
  calculations,
}: {
  result: unknown; // TrueQuoteAuthenticatedResult
  calculations: unknown; // state.calculations (the merged object after commit)
}): void {
  if (!isRecord(result) || !isRecord(result.baseCalculation)) {
    return; // OK - result not yet available
  }

  const base = result.baseCalculation as Record<string, unknown>;
  const requiredFields = [
    {
      key: "annualConsumptionKWh",
      source: "baseCalculation.load.annualConsumptionKWh",
      path: "base.annualConsumptionKWh",
    },
    { key: "peakDemandKW", source: "baseCalculation.load.peakDemandKW", path: "base.peakDemandKW" },
    { key: "utilityRate", source: "baseCalculation.utility.rate", path: "base.utilityRate" },
    {
      key: "demandCharge",
      source: "baseCalculation.utility.demandCharge",
      path: "base.demandCharge",
    },
  ];

  const missingFields = requiredFields.filter((field) => {
    // ✅ COMMIT 3: Check nested structure (calculations.base.*)
    if (!isRecord(calculations) || !isRecord(calculations.base)) {
      return true; // Missing base entirely
    }
    // Check if field exists in calculations.base (nested structure)
    const value = field.path.split(".").reduce((obj: unknown, key: string) => {
      return isRecord(obj) ? obj[key] : undefined;
    }, calculations);
    if (value === undefined || value === null) {
      // Also check if source exists in baseCalculation (should always exist)
      const sourceValue = field.source.split(".").reduce((obj: unknown, key: string) => {
        return isRecord(obj) ? obj[key] : undefined;
      }, base);
      return sourceValue === undefined || sourceValue === null;
    }
    return false;
  });

  if (missingFields.length > 0) {
    const errorMessage =
      `❌ CONTRACT VIOLATION: Engine output did not populate required calculations\n` +
      `\n` +
      `Missing fields: ${missingFields.map((f) => f.key).join(", ")}\n` +
      `\n` +
      `Expected from: ${missingFields.map((f) => f.source).join(", ")}\n` +
      `Expected path: ${missingFields.map((f) => `calculations.${f.path}`).join(", ")}\n` +
      `\n` +
      `This is an ENGINE/OUTPUT contract issue, not a UI issue.\n` +
      `Step 5 must populate state.calculations.base with base values immediately after TrueQuote result.\n` +
      `\n` +
      `Fix: Ensure Step 5 stores base calculation values in state.calculations.base immediately.`;

    if (import.meta.env.DEV) {
      console.error(errorMessage);
      console.error("Quote result:", result);
      console.error("Calculations:", calculations);
      throw new Error(errorMessage);
    } else {
      // In production, log but don't throw (graceful degradation)
      console.warn(errorMessage);
    }
  }
}

/**
 * Log WizardState schema for debugging (ACTIONABLE)
 *
 * Prints step name, version, industry, presence/absence map, and request snapshot keys
 * Answers: "Is this a UI state problem, mapping problem, or engine problem?"
 */
export function logWizardStateSchema(state: WizardState): void {
  console.group("📋 Step 5 Preflight: WizardState Schema Validation");

  // Step name
  console.log("📍 Step:", "Step 5 (MagicFit/TrueQuote)");

  // State version (if available from buffer)
  // Note: State version is in buffer metadata, not in state itself
  console.log("📦 State Version:", "1.0.0 (current)");

  // Industry
  console.log("🏭 Industry:", {
    industry: state.industry || "MISSING",
    industryName: state.industryName || "MISSING",
  });

  // Presence/absence map (boolean per key) - CRITICAL for debugging
  console.log("✅ Presence Map (Required Fields):", {
    zipCode: !!state.zipCode,
    state: !!state.state,
    industry: !!state.industry,
    useCaseData: !!state.useCaseData,
    "useCaseData.inputs": !!state.useCaseData?.inputs,
    "useCaseData.inputs (non-empty)": !!(
      state.useCaseData?.inputs && Object.keys(state.useCaseData.inputs).length > 0
    ),
    calculations: !!state.calculations,
    "calculations.base": !!state.calculations?.base,
    "calculations.base.annualConsumptionKWh": !!state.calculations?.base?.annualConsumptionKWh,
    "calculations.base.peakDemandKW": !!state.calculations?.base?.peakDemandKW,
  });

  // Location details
  console.log("📍 Location:", {
    zipCode: state.zipCode || "MISSING",
    state: state.state || "MISSING",
    city: state.city || "MISSING",
  });

  // UseCaseData details (what TrueQuote reads)
  console.log("📊 UseCaseData (TrueQuote Inputs):", {
    hasUseCaseData: !!state.useCaseData,
    hasInputs: !!state.useCaseData?.inputs,
    inputKeys: state.useCaseData?.inputs ? Object.keys(state.useCaseData.inputs) : [],
    inputCount: state.useCaseData?.inputs ? Object.keys(state.useCaseData.inputs).length : 0,
    // Note: estimatedAnnualKwh and peakDemandKw should NOT exist here (Step 3 no longer computes)
    // These should only exist in state.calculations (Step 5 SSOT)
    hasOldDerivedValues: !!(
      state.useCaseData &&
      ("estimatedAnnualKwh" in state.useCaseData || "peakDemandKw" in state.useCaseData)
    ),
  });

  // Request snapshot keys (what will be sent to TrueQuote)
  // This answers: "Will mapping function send correct structure?"
  const requestSnapshot = {
    "facility.industry": state.industry || "MISSING",
    "facility.useCaseData": !!state.useCaseData,
    "facility.useCaseData.inputs": !!state.useCaseData?.inputs,
    "facility.useCaseData.inputs.keys": state.useCaseData?.inputs
      ? Object.keys(state.useCaseData.inputs)
      : [],
  };
  console.log("🔗 Request Snapshot (MerlinRequest.facility.useCaseData.inputs):", requestSnapshot);

  // Preferences
  console.log("⚙️ Preferences:", {
    selectedOptions: state.selectedOptions || [],
    customSolarKw: state.customSolarKw || "NOT SET",
    customGeneratorKw: state.customGeneratorKw || "NOT SET",
  });

  // Calculations (Step 5 SSOT)
  console.log("💾 Calculations (Step 5 SSOT):", {
    hasCalculations: !!state.calculations,
    annualConsumptionKWh: state.calculations?.base?.annualConsumptionKWh || "NOT SET (will be computed)",
    peakDemandKW: state.calculations?.base?.peakDemandKW || "NOT SET (will be computed)",
    utilityRate: state.calculations?.base?.utilityRate || "NOT SET (will be computed)",
    demandCharge: state.calculations?.base?.demandCharge || "NOT SET (will be computed)",
    selectedPowerLevel: state.selectedPowerLevel || "NOT SET (user will select)",
  });

  console.groupEnd();
}

export default validateWizardStateForTrueQuote;

// ============================================================================
// INVARIANT C: MagicFit vs SSOT Separation
// ============================================================================

/**
 * Runtime invariant: If calculations exist, MagicFit must be "read-only"
 *
 * This prevents accidental mixing of MagicFit estimates with SSOT data.
 *
 * Rules:
 * - If state.calculations != null, any UI showing "Final" must read from calculations, not magicFit
 * - If state.magicFit exists, it must be labeled isEstimate: true
 * - MagicFit must never be written to calculations
 */
export function assertMagicFitSSOTSeparation(state: WizardState): void {
  if (import.meta.env.DEV) {
    // Rule 1: If calculations exist, MagicFit should be frozen/read-only
    if (state.calculations !== null && state.magicFit !== undefined) {
      if (state.magicFit.isEstimate !== true) {
        throw new Error(
          "Invariant C violation: magicFit.isEstimate must be true. " +
            "MagicFit is always an estimate, never SSOT."
        );
      }
    }

    // Rule 2: MagicFit must never be assigned to calculations
    // This is a type-level check, but we can verify at runtime too
    // (TypeScript should prevent this, but runtime check is extra safety)

    // Rule 3: If both exist, calculations takes precedence for "Final" displays
    // This is enforced by UI logic, not here, but we document it
  }
}

/**
 * Check if MagicFit should be displayed (read-only) or hidden
 *
 * @returns true if MagicFit should be shown (as estimate), false if calculations exist (use SSOT)
 */
export function shouldShowMagicFitEstimate(state: WizardState): boolean {
  // If TrueQuote has run, hide MagicFit or show as "Original estimate" only
  if (state.calculations !== null) {
    return false; // Use SSOT calculations instead
  }

  // If MagicFit exists and is marked as estimate, show it
  if (state.magicFit !== undefined && state.magicFit.isEstimate === true) {
    return true;
  }

  return false;
}
