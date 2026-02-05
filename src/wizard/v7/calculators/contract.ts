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
 * Normalized calculator output
 *
 * MINIMUM: QuoteEngine/Freeze layer can rely on baseLoadKW + peakLoadKW
 * OPTIONAL: energyKWhPerDay, assumptions, warnings for audit trail
 * TRUEQUOTE: dutyCycle, kWContributors, computed for validation harness
 * RAW: Escape hatch for industry-specific outputs (PUE, redundancy, etc.)
 */
export type CalcRunResult = {
  /** Average/baseline load in kW */
  baseLoadKW?: number;

  /** Peak/maximum load in kW */
  peakLoadKW?: number;

  /** Daily energy consumption in kWh */
  energyKWhPerDay?: number;

  /** Duty cycle [0, 1] - fraction of time at peak (TrueQuote validation) */
  dutyCycle?: number;

  /** kW breakdown by contributor (TrueQuote validation) */
  kWContributors?: Record<string, number>;

  /** Computed object with detailed breakdown (TrueQuote validation) */
  computed?: {
    dutyCycle?: number;
    kWContributors?: Record<string, number>;
    kWContributorsTotalKW?: number;
    kWContributorShares?: Record<string, number>;
    assumptions?: string[];
    warnings?: string[];
  };

  /** Assumptions made by calculator (for audit trail) */
  assumptions?: string[];

  /** Warnings about input quality or missing data */
  warnings?: string[];

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
