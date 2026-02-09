/**
 * TRUEQUOTE™ POLICY TAXONOMY
 * ============================
 *
 * Created: February 8, 2026 — Move 5
 *
 * PURPOSE:
 *   Unified event types for all invariant violations, conflicts, and
 *   sanitization actions that occur during Step 3 compute.
 *
 *   Every "thing that happened" during the pipeline is classified into
 *   a persistence-ready PolicyEvent. Dashboards can then show:
 *     - "restaurants frequently hit FLOOR_APPLIED"
 *     - "truck stops often NAN_SANITIZED diesel lanes"
 *     - "office adapters SEMANTIC_CONFLICT on sqft"
 *
 * TAXONOMY:
 *   SSOT_INPUT_MISSING   — Calculator expected a key, adapter didn't provide it → default used
 *   SEMANTIC_CONFLICT     — _rawExtensions overwrites a raw answer (provenance mismatch)
 *   NAN_SANITIZED         — A numeric input was NaN/Infinity → replaced with safe default
 *   RANGE_CLAMPED         — Input was outside expected bounds → clamped to range
 *   FLOOR_APPLIED         — Calculator output was below minimum → floor enforced
 *   BORROWED_SCHEMA       — Schema key differs from canonical slug → borrowed questionnaire
 *   ADAPTER_FALLBACK      — Specialized adapter threw → fell back to generic
 *   CALCULATOR_FALLBACK   — Specialized calculator threw → fell back to generic/fallback
 *   INVARIANT_FAILED      — Envelope invariant check did not pass
 *
 * DESIGN:
 *   - Each PolicyEvent is a plain serializable object (no classes, no methods)
 *   - Events carry enough context for persistence without the full envelope
 *   - The `severity` field drives dashboard alerting (info → warn → error)
 *   - `policyCode` is the enum-like key for aggregation queries
 *
 * USAGE:
 *   import { type PolicyEvent, PolicyCode } from '@/wizard/v7/step3/policyTaxonomy';
 *
 *   // In step3Compute pipeline:
 *   events.push({
 *     policyCode: PolicyCode.NAN_SANITIZED,
 *     severity: 'warn',
 *     field: 'fuelPumps',
 *     detail: 'Input was NaN, defaulted to 12',
 *     industry: 'truck_stop',
 *     calculatorId: 'truck_stop_load_v1',
 *   });
 */

// ============================================================================
// Policy Codes (enum-like for aggregation)
// ============================================================================

/**
 * Canonical policy event codes.
 * These are the GROUP BY keys for telemetry dashboards.
 */
export const PolicyCode = {
  /** Calculator expected a key, adapter didn't provide it → default used */
  SSOT_INPUT_MISSING: "SSOT_INPUT_MISSING",

  /** _rawExtensions overwrites a raw answer (provenance mismatch) */
  SEMANTIC_CONFLICT: "SEMANTIC_CONFLICT",

  /** A numeric input was NaN/Infinity → replaced with safe default */
  NAN_SANITIZED: "NAN_SANITIZED",

  /** Input was outside expected bounds → clamped to range */
  RANGE_CLAMPED: "RANGE_CLAMPED",

  /** Calculator output was below minimum → floor enforced */
  FLOOR_APPLIED: "FLOOR_APPLIED",

  /** Schema key differs from canonical slug → borrowed questionnaire */
  BORROWED_SCHEMA: "BORROWED_SCHEMA",

  /** Specialized adapter threw → fell back to generic */
  ADAPTER_FALLBACK: "ADAPTER_FALLBACK",

  /** Specialized calculator threw → fell back to generic/fallback envelope */
  CALCULATOR_FALLBACK: "CALCULATOR_FALLBACK",

  /** Envelope invariant check did not pass */
  INVARIANT_FAILED: "INVARIANT_FAILED",
} as const;

export type PolicyCodeType = typeof PolicyCode[keyof typeof PolicyCode];

// ============================================================================
// Policy Event (the persistence-ready unit)
// ============================================================================

/**
 * A single policy event emitted during Step 3 compute.
 *
 * Serializable, immutable, carry-all-context.
 */
export type PolicyEvent = {
  /** The classification code (for aggregation) */
  policyCode: PolicyCodeType;

  /** Severity level (drives dashboard alerting) */
  severity: "info" | "warn" | "error";

  /** Which field/key was affected (if applicable) */
  field?: string;

  /** Human-readable description of what happened */
  detail: string;

  /** Industry slug (canonical) */
  industry: string;

  /** Calculator that was running when this event occurred */
  calculatorId: string;

  /** The raw value that was problematic (for debugging) */
  rawValue?: unknown;

  /** The sanitized/corrected value that was used instead */
  resolvedValue?: unknown;

  /** Source of the correction (contract, adapter, invariant rule) */
  source?: string;
};

// ============================================================================
// Policy Event Collector (used during pipeline execution)
// ============================================================================

/**
 * Mutable collector for policy events during a single step3Compute() call.
 *
 * After the pipeline completes, events are frozen onto the envelope.
 * The collector itself is never exposed outside step3Compute.
 */
export class PolicyEventCollector {
  private readonly events: PolicyEvent[] = [];
  private readonly industry: string;
  private readonly calculatorId: string;

  constructor(industry: string, calculatorId: string) {
    this.industry = industry;
    this.calculatorId = calculatorId;
  }

  /** Add a policy event */
  push(
    policyCode: PolicyCodeType,
    severity: PolicyEvent["severity"],
    detail: string,
    extras?: Partial<Pick<PolicyEvent, "field" | "rawValue" | "resolvedValue" | "source">>
  ): void {
    this.events.push({
      policyCode,
      severity,
      detail,
      industry: this.industry,
      calculatorId: this.calculatorId,
      ...extras,
    });
  }

  /** Convenience: emit SSOT_INPUT_MISSING */
  missingInput(field: string, defaultUsed: unknown): void {
    this.push(PolicyCode.SSOT_INPUT_MISSING, "warn", `Missing required input "${field}", using default`, {
      field,
      resolvedValue: defaultUsed,
      source: "calculator-contract",
    });
  }

  /** Convenience: emit SEMANTIC_CONFLICT */
  conflict(field: string, rawValue: unknown, adapterValue: unknown): void {
    this.push(PolicyCode.SEMANTIC_CONFLICT, "warn", `Adapter overrides raw answer for "${field}"`, {
      field,
      rawValue,
      resolvedValue: adapterValue,
      source: "adapter",
    });
  }

  /** Convenience: emit NAN_SANITIZED */
  nanSanitized(field: string, rawValue: unknown, fallback: unknown): void {
    this.push(PolicyCode.NAN_SANITIZED, "warn", `NaN/Infinity sanitized for "${field}"`, {
      field,
      rawValue,
      resolvedValue: fallback,
      source: "nan-guard",
    });
  }

  /** Convenience: emit RANGE_CLAMPED */
  rangeClamped(field: string, rawValue: unknown, clampedTo: number, range: [number, number]): void {
    this.push(PolicyCode.RANGE_CLAMPED, "info", `"${field}" clamped from ${rawValue} to ${clampedTo} (range: ${range[0]}-${range[1]})`, {
      field,
      rawValue,
      resolvedValue: clampedTo,
      source: "calculator-contract",
    });
  }

  /** Convenience: emit FLOOR_APPLIED */
  floorApplied(floorKW: number, rawKW: number): void {
    this.push(PolicyCode.FLOOR_APPLIED, "info", `Output floored from ${rawKW.toFixed(0)}kW to ${floorKW}kW`, {
      field: "peakLoadKW",
      rawValue: rawKW,
      resolvedValue: floorKW,
      source: "calculator-contract",
    });
  }

  /** Convenience: emit BORROWED_SCHEMA */
  borrowedSchema(canonicalSlug: string, schemaKey: string): void {
    this.push(PolicyCode.BORROWED_SCHEMA, "info", `"${canonicalSlug}" borrows schema from "${schemaKey}"`, {
      field: "schemaKey",
      rawValue: canonicalSlug,
      resolvedValue: schemaKey,
      source: "industry-catalog",
    });
  }

  /** Convenience: emit ADAPTER_FALLBACK */
  adapterFallback(adapterSlug: string, error: string): void {
    this.push(PolicyCode.ADAPTER_FALLBACK, "error", `Adapter "${adapterSlug}" threw: ${error}. Using generic.`, {
      source: "self-healing",
    });
  }

  /** Convenience: emit CALCULATOR_FALLBACK */
  calculatorFallback(calculatorId: string, error: string): void {
    this.push(PolicyCode.CALCULATOR_FALLBACK, "error", `Calculator "${calculatorId}" threw: ${error}. Using fallback.`, {
      source: "self-healing",
    });
  }

  /** Convenience: emit INVARIANT_FAILED */
  invariantFailed(rule: string, detail: string): void {
    this.push(PolicyCode.INVARIANT_FAILED, "warn", `Invariant "${rule}" failed: ${detail}`, {
      field: rule,
      source: "invariant-check",
    });
  }

  /** Freeze and return all events (immutable copy) */
  seal(): readonly PolicyEvent[] {
    return Object.freeze([...this.events]);
  }

  /** Get count by severity */
  countBySeverity(severity: PolicyEvent["severity"]): number {
    return this.events.filter((e) => e.severity === severity).length;
  }

  /** Get count by policy code */
  countByCode(code: PolicyCodeType): number {
    return this.events.filter((e) => e.policyCode === code).length;
  }

  /** Whether any events were collected */
  get hasEvents(): boolean {
    return this.events.length > 0;
  }

  /** Total event count */
  get length(): number {
    return this.events.length;
  }
}

// ============================================================================
// Summary helpers (for dashboard aggregation)
// ============================================================================

/**
 * Summarize policy events for quick dashboard display.
 *
 * Example output:
 *   { SSOT_INPUT_MISSING: 2, NAN_SANITIZED: 1, BORROWED_SCHEMA: 1 }
 */
export function summarizePolicyEvents(
  events: readonly PolicyEvent[]
): Record<PolicyCodeType, number> {
  const summary = {} as Record<PolicyCodeType, number>;
  for (const code of Object.values(PolicyCode)) {
    const count = events.filter((e) => e.policyCode === code).length;
    if (count > 0) {
      summary[code] = count;
    }
  }
  return summary;
}

/**
 * Filter policy events by severity threshold.
 * 'info' returns all; 'warn' returns warn + error; 'error' returns only errors.
 */
export function filterBySeverity(
  events: readonly PolicyEvent[],
  minSeverity: PolicyEvent["severity"]
): readonly PolicyEvent[] {
  const severityOrder = { info: 0, warn: 1, error: 2 };
  const threshold = severityOrder[minSeverity];
  return events.filter((e) => severityOrder[e.severity] >= threshold);
}
