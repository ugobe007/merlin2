/**
 * CALCULATOR CONTRACT LAYER
 * =========================
 *
 * Created: January 26, 2026
 * Purpose: Unified contract interface for all calculator implementations
 *
 * DESIGN:
 * - Templates bind to calculator.id (stable, versioned)
 * - Contract enforces requiredInputs (validator checks at build time)
 * - Compute returns normalized outputs (baseLoadKW, peakLoadKW, etc.)
 * - Raw escape hatch preserves industry-specific details
 *
 * PATTERNS:
 * - 16Q calculators (primary): Clean, fast iteration, template-driven
 * - SSOT power calcs (fallback): Backward compat, sanity check, coarse estimates
 * - Both patterns look identical to orchestrator via contract layer
 */

export type CalcScalar = number | string | boolean | null;
export type CalcInputs = Record<string, CalcScalar | CalcScalar[]>;

/**
 * Canonical contributor keys across all industries
 * 
 * Use these standard keys to avoid invariant drift:
 * - hvac: HVAC/climate control
 * - lighting: Facility lighting
 * - controls: PLC/controls/BMS/payment systems
 * - process: Industry-specific process loads (dryers, pumps, ovens, etc.)
 * - itLoad: IT equipment (data centers)
 * - cooling: Dedicated cooling (separate from HVAC)
 * - charging: EV charging equipment
 * - other: Miscellaneous loads
 */
export type ContributorKeys =
  | 'hvac'
  | 'lighting'
  | 'controls'
  | 'process'
  | 'itLoad'
  | 'cooling'
  | 'charging'
  | 'other';

/**
 * TrueQuote validation envelope
 * 
 * Namespaced container for validation-specific fields.
 * Keeps calculator contract "product clean" while enabling harness validation.
 */
export type CalcValidation = {
  /** Schema version (for drift detection) */
  version: "v1";

  /** Duty cycle [0, 1.25] - fraction of time at peak */
  dutyCycle?: number;

  /** kW breakdown by canonical contributor keys (ALWAYS use these 8 keys) */
  kWContributors?: Record<ContributorKeys, number>;

  /** Sum of all contributors (for sanity checking) */
  kWContributorsTotalKW?: number;

  /** Percentage shares of each contributor */
  kWContributorShares?: Record<string, number>;

  /** Industry-specific forensic details (sub-breakdowns) */
  details?: {
    car_wash?: { dryers?: number; pumps?: number; vacuums?: number };
    hotel?: { rooms?: number; kitchen?: number; laundry?: number; pool?: number };
    data_center?: { upsLosses?: number; pdus?: number; fans?: number };
    ev_charging?: { chargers?: number; siteAux?: number };
    [industry: string]: Record<string, number> | undefined;
  };

  /** Validation notes (non-blocking observations) */
  notes?: string[];
};

/**
 * Normalized calculator output
 *
 * MINIMUM: QuoteEngine/Freeze layer can rely on baseLoadKW + peakLoadKW
 * OPTIONAL: energyKWhPerDay, assumptions, warnings for audit trail
 * VALIDATION: TrueQuote validation envelope (harness-only, namespaced)
 * RAW: Escape hatch for industry-specific outputs (PUE, redundancy, etc.)
 */
export type CalcRunResult = {
  /** Average/baseline load in kW */
  baseLoadKW?: number;

  /** Peak/maximum load in kW */
  peakLoadKW?: number;

  /** Daily energy consumption in kWh */
  energyKWhPerDay?: number;

  /** Assumptions made by calculator (for audit trail) */
  assumptions?: string[];

  /** Warnings about input quality or missing data */
  warnings?: string[];

  /** TrueQuote validation envelope (optional, harness-only) */
  validation?: CalcValidation;

  /** Raw industry-specific outputs (PUE, redundancy, etc.) */
  raw?: unknown;
};

/**
 * Calculator Contract
 *
 * STABLE: id + requiredInputs form immutable contract
 * VERSIONED: Change id if contract changes (dc_load_v2, etc.)
 * VALIDATED: Templates must satisfy requiredInputs or fail at build time
 */
export type CalculatorContract = {
  /** Stable ID used by templates (e.g., "dc_load_v1") */
  id: string;

  /** Canonical input keys required by this calculator (NOT question IDs) */
  requiredInputs: readonly string[];

  /** Optional: keys that are allowed but not required */
  optionalInputs?: readonly string[];

  /** Runs the calculator with mapped inputs */
  compute: (inputs: CalcInputs) => CalcRunResult;
};
