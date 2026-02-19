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

import { devWarn } from '../debug/devLog';

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

  /**
   * Map template wash type labels to SSOT-expected slugs
   *
   * USE CASE: Car wash template offers human-readable options
   * ("Self-serve bays", "Tunnel (single)", etc.) but the SSOT
   * calculateCarWashPower() expects machine slugs ("self-service",
   * "tunnel", "automatic", etc.).
   *
   * MAPPING:
   * - "In-bay automatic"  → "automatic"
   * - "Tunnel (single)"   → "tunnel"
   * - "Self-serve bays"   → "self-service"
   * - "Detail shop"       → "full-service"
   * - default             → "tunnel" (most common for BESS customers)
   */
  mapWashType: (value) => {
    const v = String(value || "")
      .toLowerCase()
      .trim();
    if (v.includes("self-serve") || v.includes("self-service")) return "self-service";
    if (v.includes("in-bay") || v.includes("automatic")) return "automatic";
    if (v.includes("tunnel")) return "tunnel";
    if (v.includes("detail") || v.includes("full-service")) return "full-service";
    return "tunnel"; // Default for BESS customers
  },

  /**
   * Map hospital type display labels to SSOT-expected slugs
   *
   * SSOT: calculateHospitalPower(bedCount, hospitalType, operatingHours)
   * hospitalType: "community" | "regional" | "academic" | "specialty"
   */
  mapHospitalType: (value) => {
    const v = String(value || "")
      .toLowerCase()
      .trim();
    if (v.includes("community")) return "community";
    if (v.includes("academic") || v.includes("teaching")) return "academic";
    if (
      v.includes("specialty") ||
      v.includes("cardiac") ||
      v.includes("trauma") ||
      v.includes("cancer")
    )
      return "specialty";
    return "regional"; // Most common
  },

  /**
   * Map operating hours display labels to SSOT-expected slugs
   *
   * SSOT: calculateHospitalPower(bedCount, hospitalType, operatingHours)
   * operatingHours: "limited" | "extended" | "24_7"
   */
  mapOperatingHours: (value) => {
    const v = String(value || "")
      .toLowerCase()
      .trim();
    if (v.includes("limited") || v.includes("8 am") || v.includes("outpatient")) return "limited";
    if (v.includes("extended") || v.includes("6 am")) return "extended";
    return "24_7"; // Default for hospitals
  },

  /**
   * Map manufacturing type display labels to SSOT-expected slugs
   *
   * SSOT: calculateManufacturingPower(sqFt, industryType)
   * industryType: "light" | "medium" | "heavy" | "electronics" | "food"
   */
  mapManufacturingType: (value) => {
    const v = String(value || "")
      .toLowerCase()
      .trim();
    if (v.includes("light") || v.includes("assembly")) return "light";
    if (v.includes("heavy") || v.includes("foundry") || v.includes("steel") || v.includes("glass"))
      return "heavy";
    if (v.includes("electronics") || v.includes("clean room")) return "electronics";
    if (v.includes("food")) return "food";
    return "medium"; // Default: machining, fabrication
  },

  /**
   * Map shift pattern display labels to adapter-expected slugs
   *
   * Used by: manufacturing adapter for dutyCycle calculation
   * "1-shift" | "2-shift" | "3-shift"
   */
  mapShiftPattern: (value) => {
    const v = String(value || "")
      .toLowerCase()
      .trim();
    if (v.includes("3") || v.includes("24")) return "3-shift";
    if (v.includes("2") || v.includes("16")) return "2-shift";
    if (v.includes("1") || v.includes("single") || v.includes("8")) return "1-shift";
    return "1-shift"; // Default
  },

  /**
   * Map office type display labels to adapter-expected slugs
   *
   * Used by: office adapter for occupant density + plug load profiling
   * "small-professional" | "corporate" | "government" | "tech" | "medical"
   *
   * Office type affects plug load density (CBECS 2018):
   * - Tech: 50% higher plug loads (monitors, workstations)
   * - Medical: 20% higher (diagnostic equipment)
   * - Government: standard
   * - Small professional: lower density
   */
  mapOfficeType: (value) => {
    const v = String(value || "")
      .toLowerCase()
      .trim();
    if (
      v.includes("small") ||
      v.includes("professional") ||
      v.includes("dental") ||
      v.includes("cpa")
    )
      return "small-professional";
    if (v.includes("tech") || v.includes("high-density") || v.includes("open floor")) return "tech";
    if (v.includes("government") || v.includes("municipal")) return "government";
    if (v.includes("medical")) return "medical";
    return "corporate"; // Default: multi-tenant corporate
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
    devWarn(`[transforms] Unknown transform: ${transformName}`);
    return value;
  }
  return fn(value, ctx);
}
