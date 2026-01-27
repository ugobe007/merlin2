/**
 * DATABASE-DRIVEN STEP 3 VALIDATOR (V7 Architecture)
 * Created: Jan 26, 2026
 * 
 * Replaces hardcoded validation logic with dynamic database schema.
 * 
 * PHILOSOPHY:
 * - Validator checks ONLY what database marks as required
 * - No hardcoded industry-specific logic
 * - Progressive model can override with high confidence
 * - Scales to all 30+ industries without code changes
 * 
 * @module validateStep3Dynamic
 */

import type { WizardState } from "../types";
import type { Step3MissingKey } from "./step3Contract";
import { getIndustryValidationSchema } from "@/services/validationSchemaService";

type Inputs = Record<string, unknown>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

const str = (v: unknown): string => String(v ?? "").trim();

const has = (v: unknown): boolean => {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v) && v !== 0;
  if (typeof v === "boolean") return v === true;
  return true;
};

// ============================================================================
// VALIDATION RESULT INTERFACE
// ============================================================================

export interface Step3ContractValidation {
  missing: Step3MissingKey[];
  missingRequired: Step3MissingKey[];
  missingOptional: Step3MissingKey[];
  completenessPct: number;
  confidencePct: number;
  ok: boolean;
  hasLoadAnchor: boolean;
  requiredKeys: Step3MissingKey[];
  industry?: string;
}

// ============================================================================
// LOAD ANCHOR DETECTION
// ============================================================================

/**
 * Check if we have ANY load anchor (direct or computed)
 * This is the minimum needed for sizing calculations
 */
function checkLoadAnchor(state: WizardState, inputs: Inputs, industryType: string): boolean {
  // Direct anchors (user-provided)
  if (has(inputs.peakDemandKW) || has(inputs.monthlyElectricBill)) {
    return true;
  }

  // Computed anchors (from calculations)
  const calculated = (state as any).calculated;
  const calculations = (state as any).calculations;
  
  if (calculated?.loadAnchor?.kw && calculated.loadAnchor.kw > 0) {
    return true;
  }
  
  if (calculations?.loadAnchor?.kw && calculations.loadAnchor.kw > 0) {
    return true;
  }

  // Industry-specific fields that can compute load
  const t = (industryType || "").toLowerCase().replace(/[_-]+/g, " ");
  
  // Hotel: rooms can compute load
  if (t.includes("hotel") && has(inputs.roomCount)) {
    return true;
  }
  
  // Car wash: bays can compute load
  if (t.includes("car") && t.includes("wash") && has(inputs.bayCount)) {
    return true;
  }
  
  // Hospital: beds can compute load
  if (t.includes("hospital") && has(inputs.bedCount)) {
    return true;
  }
  
  // Data center: racks can compute load
  if (t.includes("data") && t.includes("center") && has(inputs.rackCount)) {
    return true;
  }
  
  // Office/warehouse/retail: square feet can compute load
  const hasSqft = has(inputs.squareFeet) || has(inputs.squareFootage);
  if ((t.includes("office") || t.includes("warehouse") || t.includes("retail")) && hasSqft) {
    return true;
  }

  return false;
}

// ============================================================================
// MAIN VALIDATOR (DATABASE-DRIVEN)
// ============================================================================

/**
 * Validate Step 3 dynamically based on database schema
 * 
 * ALWAYS REQUIRED (universal):
 * - location.zipCode
 * - location.state
 * - industry.type
 * - goals.primaryGoal
 * - calculated.loadAnchor (some way to estimate load)
 * 
 * INDUSTRY-SPECIFIC REQUIRED:
 * - Loaded from database custom_questions where is_required = true
 * 
 * PROGRESSIVE MODEL OVERRIDE:
 * - If modelConfidence >= 75%, allow even with missing fields
 */
export async function validateStep3Dynamic(state: WizardState): Promise<Step3ContractValidation> {
  const inputs = (state.useCaseData?.inputs || {}) as Inputs;
  const industrySlug = str(state.industry || state.detectedIndustry);

  const missingRequired: Step3MissingKey[] = [];
  const missingOptional: Step3MissingKey[] = [];
  const requiredKeys: Step3MissingKey[] = [];

  // ========== UNIVERSAL REQUIRED FIELDS ==========
  requiredKeys.push("location.zipCode", "location.state", "industry.type", "goals.primaryGoal", "calculated.loadAnchor");

  // Location
  const zip = str(state.zipCode);
  const st = str(state.state);
  if (zip.length !== 5) missingRequired.push("location.zipCode");
  if (!st) missingRequired.push("location.state");

  // Industry
  if (!industrySlug) missingRequired.push("industry.type");

  // Goals
  const primaryGoal = state.goals?.[0] || "";
  if (!primaryGoal) missingRequired.push("goals.primaryGoal");

  // Load anchor
  const hasLoadAnchor = checkLoadAnchor(state, inputs, industrySlug);
  if (!hasLoadAnchor) {
    missingRequired.push("calculated.loadAnchor");
  }

  // ========== DATABASE-DRIVEN INDUSTRY-SPECIFIC FIELDS ==========
  if (industrySlug) {
    const schema = await getIndustryValidationSchema(industrySlug);
    
    if (schema) {
      // Check each required field from database
      for (const fieldName of schema.requiredFields) {
        const contractKey = `facility.${fieldName}` as Step3MissingKey;
        requiredKeys.push(contractKey);

        const value = inputs[fieldName];
        const fieldDetails = schema.fieldDetails.get(fieldName);

        // Check if answered
        if (value == null || value === '' || value === undefined) {
          missingRequired.push(contractKey);
          continue;
        }

        // Check numeric range if applicable
        if (fieldDetails?.questionType === 'number') {
          const numValue = num(value);
          if (fieldDetails.minValue != null && numValue < fieldDetails.minValue) {
            missingRequired.push(contractKey);
          }
          if (fieldDetails.maxValue != null && numValue > fieldDetails.maxValue) {
            missingRequired.push(contractKey);
          }
        }
      }
    }
  }

  // ========== PROGRESSIVE MODEL OVERRIDE ==========
  const modelConfidence = (state as any).modelConfidence?.score ?? 0;
  const canBypassValidation = modelConfidence >= 75;

  if (canBypassValidation && missingRequired.length > 0) {
    if (import.meta.env.DEV) {
      console.log(
        `[ValidatorV7] Progressive model override: confidence ${modelConfidence}% bypasses ${missingRequired.length} missing fields`
      );
    }
    // Move all missing required to optional (not blocking)
    missingOptional.push(...missingRequired);
    missingRequired.length = 0;
  }

  // ========== COMPLETENESS (required keys only) ==========
  const completenessPct = Math.round(
    ((requiredKeys.length - missingRequired.length) / requiredKeys.length) * 100
  );

  // ========== CONFIDENCE (optional boosters) ==========
  const confidenceFields = [
    "monthlyElectricBill",
    "peakDemandKW",
    "gridCapacityKW",
    "hvacType",
    "equipmentTier",
    "hasNaturalGas",
  ];
  const answeredConfidence = confidenceFields.filter((k) => has(inputs[k])).length;
  const confidencePct = Math.min(
    100,
    completenessPct + Math.round((answeredConfidence / confidenceFields.length) * 25)
  );

  const ok = missingRequired.length === 0;

  if (import.meta.env.DEV && !ok) {
    console.log("🚫 Step 3 Contract INVALID (validateStep3Dynamic)");
    console.log("Industry:", industrySlug);
    console.log("Missing Required:", missingRequired);
    console.log("Required Keys:", requiredKeys);
    console.log("Has Load Anchor:", hasLoadAnchor);
    console.log("Completeness:", completenessPct + "%");
    console.log("Confidence:", confidencePct + "%");
    console.log("Model Confidence Override:", canBypassValidation);
  }

  return {
    missing: [...missingRequired, ...missingOptional],
    missingRequired,
    missingOptional,
    completenessPct,
    confidencePct,
    ok,
    hasLoadAnchor,
    requiredKeys,
    industry: industrySlug,
  };
}

/**
 * Synchronous fallback for when async isn't possible
 * Uses minimal validation (universal fields only)
 */
export function validateStep3Sync(state: WizardState): Step3ContractValidation {
  const inputs = (state.useCaseData?.inputs || {}) as Inputs;
  const industrySlug = str(state.industry || state.detectedIndustry);

  const missingRequired: Step3MissingKey[] = [];
  const requiredKeys: Step3MissingKey[] = ["location.zipCode", "location.state", "industry.type", "goals.primaryGoal", "calculated.loadAnchor"];

  // Basic validation
  const zip = str(state.zipCode);
  const st = str(state.state);
  if (zip.length !== 5) missingRequired.push("location.zipCode");
  if (!st) missingRequired.push("location.state");
  if (!industrySlug) missingRequired.push("industry.type");
  if (!state.goals?.[0]) missingRequired.push("goals.primaryGoal");
  
  const hasLoadAnchor = checkLoadAnchor(state, inputs, industrySlug);
  if (!hasLoadAnchor) {
    missingRequired.push("calculated.loadAnchor");
  }

  const completenessPct = Math.round(
    ((requiredKeys.length - missingRequired.length) / requiredKeys.length) * 100
  );

  return {
    missing: missingRequired,
    missingRequired,
    missingOptional: [],
    completenessPct,
    confidencePct: completenessPct,
    ok: missingRequired.length === 0,
    hasLoadAnchor,
    requiredKeys,
    industry: industrySlug,
  };
}
