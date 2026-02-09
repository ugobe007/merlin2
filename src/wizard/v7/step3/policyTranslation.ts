/**
 * POLICY TRANSLATION LAYER — Founder-Friendly Messages
 * =====================================================
 *
 * Created: February 8, 2026 — Move 7
 *
 * PURPOSE:
 *   Translates raw PolicyCode events into user-facing messages.
 *   - Full fidelity preserved in telemetry (policyEvents[] unchanged)
 *   - Step 4 shows ONLY showInUI === true events
 *   - Internal hygiene events (NAN_SANITIZED) stay invisible
 *
 * DESIGN:
 *   PolicyCode → { template, severity, showInUI }
 *   template(event) → string  (uses event.field / event.rawValue / event.resolvedValue)
 *
 * USAGE:
 *   import { translatePolicyEvents, type UserFacingPolicyEvent } from '@/wizard/v7/step3/policyTranslation';
 *
 *   const userEvents = translatePolicyEvents(envelope.policyEvents);
 *   // Only events with showInUI === true, translated to plain English
 */

import { PolicyCode, type PolicyEvent, type PolicyCodeType } from "./policyTaxonomy";

// ============================================================================
// Types
// ============================================================================

export type UserSeverity = "info" | "warn" | "error";

export type UserFacingPolicyEvent = {
  /** The original policy code (for debugging if needed) */
  code: PolicyCodeType;

  /** Founder-friendly message (plain English, no jargon) */
  message: string;

  /** Visual severity for UI treatment */
  severity: UserSeverity;

  /** Original raw event (for dev tools / telemetry, never shown to user) */
  _raw: PolicyEvent;
};

// ============================================================================
// Translation Table
// ============================================================================

type TranslationEntry = {
  /** Template function: (event) → user-facing message string */
  template: (event: PolicyEvent) => string;
  /** Override severity for UI (may differ from raw event severity) */
  uiSeverity: UserSeverity;
  /** Whether to show this event to founders in Step 4 */
  showInUI: boolean;
};

const TRANSLATION_TABLE: Record<PolicyCodeType, TranslationEntry> = {
  [PolicyCode.SSOT_INPUT_MISSING]: {
    template: (e) => {
      const field = e.field ?? "a required input";
      const fallback = e.resolvedValue != null ? ` (using default: ${e.resolvedValue})` : "";
      return `Missing ${humanizeField(field)}${fallback}. Complete your profile for better accuracy.`;
    },
    uiSeverity: "info",
    showInUI: true,
  },

  [PolicyCode.SEMANTIC_CONFLICT]: {
    template: (e) => {
      const field = e.field ?? "an input";
      return `Resolved a conflict in ${humanizeField(field)} — using the most reliable data available.`;
    },
    uiSeverity: "info",
    showInUI: true, // Soft show — aggregated in Step 4 when affecting sizing fields
  },

  [PolicyCode.NAN_SANITIZED]: {
    template: () => "Cleaned up an invalid input value.",
    uiSeverity: "info",
    showInUI: false, // Internal hygiene — never show
  },

  [PolicyCode.RANGE_CLAMPED]: {
    template: (e) => {
      const field = e.field ?? "a value";
      const raw = e.rawValue;
      const resolved = e.resolvedValue;
      if (raw != null && resolved != null) {
        return `Adjusted ${humanizeField(field)} from ${raw} to ${resolved} to fit the typical range.`;
      }
      return `Adjusted ${humanizeField(field)} to fit the typical range.`;
    },
    uiSeverity: "info",
    showInUI: true,
  },

  [PolicyCode.FLOOR_APPLIED]: {
    template: (e) => {
      const floorKW = e.resolvedValue ?? "minimum";
      return `System size floored to ${floorKW} kW — the minimum for reliable operation.`;
    },
    uiSeverity: "info",
    showInUI: true,
  },

  [PolicyCode.BORROWED_SCHEMA]: {
    template: (e) => {
      const schema = e.resolvedValue ?? "a related industry";
      return `Used the ${humanizeField(String(schema))} questionnaire to estimate your load profile.`;
    },
    uiSeverity: "info",
    showInUI: true,
  },

  [PolicyCode.ADAPTER_FALLBACK]: {
    template: () =>
      "Used a general facility model for your load profile. Results are directionally correct.",
    uiSeverity: "warn",
    showInUI: true,
  },

  [PolicyCode.CALCULATOR_FALLBACK]: {
    template: () =>
      "Used a general calculation engine. Your industry-specific model wasn't available.",
    uiSeverity: "warn",
    showInUI: true,
  },

  [PolicyCode.INVARIANT_FAILED]: {
    template: (e) => {
      const rule = e.field ?? "a check";
      return `Quality check "${humanizeField(rule)}" flagged — results may need review.`;
    },
    uiSeverity: "warn",
    showInUI: true,
  },
};

// ============================================================================
// Field Name Humanizer
// ============================================================================

const FIELD_LABELS: Record<string, string> = {
  bayCount: "Bay Count",
  bayTunnelCount: "Bay/Tunnel Count",
  roomCount: "Room Count",
  bedCount: "Bed Count",
  squareFootage: "Square Footage",
  officeSqFt: "Office Square Footage",
  facilitySqFt: "Facility Square Footage",
  itLoadCapacity: "IT Load Capacity",
  numberOfLevel2Chargers: "Level 2 Chargers",
  numberOfDCFastChargers: "DC Fast Chargers",
  level2Chargers: "Level 2 Chargers",
  dcfcChargers: "DC Fast Chargers",
  fuelPumps: "Fuel Pumps",
  dieselLanes: "Diesel Lanes",
  seatCount: "Seating Capacity",
  operatingHours: "Operating Hours",
  peakLoadKW: "Peak Load",
  averageWashesPerDay: "Daily Washes",
  hotelClass: "Hotel Class",
  manufacturingType: "Manufacturing Type",
  occupancyRate: "Occupancy Rate",
  // Invariant rules
  "peak >= avg": "Peak ≥ Average Load",
  "contributors ≈ peak": "Load Contributors Sum",
  "duty cycle range": "Duty Cycle Range",
  "energy consistency": "Energy Consistency",
};

/**
 * Convert camelCase/snake_case field names to human-readable labels.
 */
function humanizeField(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  // camelCase → "Camel Case"
  return field
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^\s+/, "")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Translate raw policy events into user-facing messages.
 *
 * @param events - Raw policy events from LoadProfileEnvelope.policyEvents
 * @returns Only events where showInUI === true, translated to plain English.
 *          Preserves order. Deduplicates by (code + field) key.
 */
export function translatePolicyEvents(
  events: readonly PolicyEvent[]
): readonly UserFacingPolicyEvent[] {
  const seen = new Set<string>();
  const result: UserFacingPolicyEvent[] = [];

  for (const event of events) {
    const entry = TRANSLATION_TABLE[event.policyCode];
    if (!entry || !entry.showInUI) continue;

    // Deduplicate by code + field
    const dedupeKey = `${event.policyCode}::${event.field ?? ""}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    result.push({
      code: event.policyCode,
      message: entry.template(event),
      severity: entry.uiSeverity,
      _raw: event,
    });
  }

  return result;
}

/**
 * Get the max severity from a set of user-facing events.
 * Useful for determining the overall banner tone in Step 4.
 *
 * Precedence: error > warn > info
 */
export function maxUserSeverity(
  events: readonly UserFacingPolicyEvent[]
): UserSeverity {
  if (events.some((e) => e.severity === "error")) return "error";
  if (events.some((e) => e.severity === "warn")) return "warn";
  return "info";
}

/**
 * Quick check: does this event set have any user-visible events?
 * Use to conditionally render the policy events section in Step 4.
 */
export function hasVisiblePolicyEvents(
  events: readonly PolicyEvent[]
): boolean {
  return events.some((e) => {
    const entry = TRANSLATION_TABLE[e.policyCode];
    return entry?.showInUI === true;
  });
}

/**
 * Aggregate multiple SEMANTIC_CONFLICT events into one soft message.
 * Returns null if there are no SEMANTIC_CONFLICT events.
 *
 * Why: Showing "Resolved conflict in X / Resolved conflict in Y / ..."
 * for every field is noisy. Instead, show one aggregated info message.
 */
export function aggregateSemanticConflicts(
  events: readonly UserFacingPolicyEvent[]
): UserFacingPolicyEvent | null {
  const conflicts = events.filter((e) => e.code === PolicyCode.SEMANTIC_CONFLICT);
  if (conflicts.length === 0) return null;
  if (conflicts.length === 1) return conflicts[0];

  // Collect field names from all conflicts
  const fields = conflicts
    .map((e) => e._raw.field)
    .filter(Boolean)
    .map((f) => humanizeField(f!));

  const fieldList = fields.length > 0
    ? fields.length <= 3
      ? fields.join(", ")
      : `${fields.slice(0, 2).join(", ")} and ${fields.length - 2} other${fields.length - 2 > 1 ? "s" : ""}`
    : "some inputs";

  return {
    code: PolicyCode.SEMANTIC_CONFLICT,
    message: `Resolved conflicts in ${fieldList} — using the most reliable data available.`,
    severity: "info",
    _raw: conflicts[0]._raw, // Use first event as representative
  };
}
