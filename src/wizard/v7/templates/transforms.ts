/**
 * TEMPLATE TRANSFORM FUNCTIONS
 * =============================
 *
 * Created: January 26, 2026
 * Purpose: Named transform functions for template mapping rules
 *
 * DESIGN:
 * - Transforms keep business logic OUT of UI components
 * - Named transforms are explicit (not anonymous lambdas)
 * - Context includes full answers object for conditional logic
 * - Idempotent: same inputs → same outputs (no side effects)
 *
 * COMMON PATTERNS:
 * - Conditional nulling (ifDemandChargeElseZero)
 * - Type coercion (toNumber, yesNoToBool)
 * - Normalization (emptyToUndefined)
 * - Default values (handled by calculator, not transforms)
 */

import type { TemplateQuestion } from "./types";

export type TransformFn = (
  value: unknown,
  ctx: {
    /** Full answers object for conditional logic */
    answers: Record<string, unknown>;

    /** Question metadata (optional, for validation hints) */
    question?: TemplateQuestion;
  }
) => unknown;

/**
 * Transform Registry
 *
 * NAMING: camelCase, descriptive (ifXElseY, toType, normalizeX)
 * STABLE: Transform names form part of template contract
 * VERSIONED: If transform logic changes, create new name (ifDemandChargeElseZero_v2)
 */
export const TRANSFORMS: Record<string, TransformFn> = {
  /**
   * Conditional zero: If boolean gate question is false, force value to 0
   *
   * USE CASE: demand_charge_rate should be 0 if demand_charge is false
   *
   * EXAMPLE:
   * answers = { demand_charge: false, demand_charge_rate: 25 }
   * transform: "ifDemandChargeElseZero"
   * result: 0 (ignores 25 because gate is false)
   */
  ifDemandChargeElseZero: (value, ctx) => {
    const enabled = ctx.answers["demand_charge"] === true;
    if (!enabled) return 0;
    // If enabled but missing/invalid, leave as-is and let validator/runtime warn
    return value;
  },

  /**
   * Normalize empty strings to undefined
   *
   * USE CASE: Text inputs that user leaves blank should be undefined (not "")
   */
  emptyToUndefined: (value) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  },

  /**
   * Coerce to number safely
   *
   * USE CASE: String numbers from URL params or legacy data
   * RETURNS: number | undefined (never NaN)
   */
  toNumber: (value) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    if (typeof value === "string") {
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  },

  /**
   * Convert "Yes"/"No" strings to boolean
   *
   * USE CASE: Legacy templates that stored boolean as select
   * RETURNS: true | false | original value (preserves boolean inputs)
   */
  yesNoToBool: (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const v = value.trim().toLowerCase();
      if (v === "yes") return true;
      if (v === "no") return false;
    }
    return value;
  },

  /**
   * Default to zero if missing/invalid
   *
   * USE CASE: Optional numeric inputs that calculator expects as 0 (not undefined)
   */
  defaultZero: (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  },

  /**
   * Percent to decimal (85 → 0.85)
   *
   * USE CASE: UI shows percentages, calculator expects decimals
   * NOTE: Does NOT divide by 100 if already decimal (0.85 stays 0.85)
   */
  percentToDecimal: (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      // If already decimal (< 1), leave as-is
      if (value > 0 && value < 1) return value;
      // Otherwise assume percentage
      return value / 100;
    }
    if (typeof value === "string") {
      const n = Number(value);
      if (Number.isFinite(n)) {
        if (n > 0 && n < 1) return n;
        return n / 100;
      }
    }
    return undefined;
  },

  /**
   * Infer hotel class from kitchen type (template proxy)
   *
   * USE CASE: Hotel template has no direct "hotelClass" question but
   * kitchen_type is a strong proxy for hotel tier.
   *
   * MAPPING:
   * - "None" / "Light prep" → "economy"
   * - "Full commercial"     → "upscale"
   * - default               → "midscale"
   *
   * NOTE: This is a best-effort heuristic. The calculator adapter
   * also defaults to "midscale" if hotelClass is unrecognized.
   */
  inferHotelClass: (value) => {
    const v = String(value || "")
      .toLowerCase()
      .trim();
    if (v === "none" || v === "light prep") return "economy";
    if (v === "full commercial") return "upscale";
    return "midscale";
  },
};

/**
 * Apply a transform by name
 *
 * SAFETY: Unknown transform names return value unchanged (warn in console)
 * EXTENSION: Add new transforms to TRANSFORMS registry above
 */
export function applyTransform(
  transformName: string,
  value: unknown,
  ctx: { answers: Record<string, unknown>; question?: TemplateQuestion }
): unknown {
  const fn = TRANSFORMS[transformName];
  if (!fn) {
    console.warn(`[transforms] Unknown transform: ${transformName}`);
    return value;
  }
  return fn(value, ctx);
}
