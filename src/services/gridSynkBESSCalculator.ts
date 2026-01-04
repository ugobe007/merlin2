/**
 * GRID-SYNK BESS CALCULATOR
 * =========================
 *
 * Industry-standard BESS sizing calculations based on Grid-Synk methodology.
 * BESS is auto-calculated based on peak demand and duration - NOT user-adjustable.
 *
 * Key Principles:
 * - BESS power is calculated from peak demand × application ratio
 * - BESS capacity is calculated from power × duration ÷ efficiency factors
 * - Users can adjust duration, but not directly edit kW/kWh
 *
 * Source: Grid-Synk BESS Calculator (https://grid-synk.com)
 *
 * @created December 2025
 */

import type { BESSApplication } from "@/types/compareConfig";

// ============================================================================
// TYPES
// ============================================================================

export interface BESSCalculationInputs {
  peakDemandKW: number;
  durationHours: number;
  application: BESSApplication | string;
}

export interface BESSCalculationResult {
  batteryKW: number;
  batteryKWh: number;
  usableKWh: number;
  formula: string;
  source: string;
  factors: {
    ratio: number;
    dod: number;
    staticEfficiency: number;
    cycleEfficiency: number;
    combinedEfficiency: number;
  };
}

// ============================================================================
// GRID-SYNK EFFICIENCY FACTORS
// ============================================================================

/**
 * Grid-Synk standard efficiency factors for BESS sizing.
 * These account for real-world losses in battery systems.
 */
export const GRID_SYNK_FACTORS = {
  /** Depth of Discharge - typical safe operating range */
  DoD: 0.9,

  /** Static efficiency - self-discharge, BMS standby losses */
  staticEfficiency: 0.9,

  /** Cycle efficiency - PCS conversion, internal resistance */
  cycleEfficiency: 0.95,

  /** Combined efficiency = DoD × Static × Cycle */
  get combinedEfficiency() {
    return this.DoD * this.staticEfficiency * this.cycleEfficiency;
  },
};

// ============================================================================
// BESS-TO-PEAK RATIOS BY APPLICATION
// ============================================================================

/**
 * BESS power sizing ratios by application type.
 * These determine what percentage of peak demand the BESS should cover.
 *
 * Sources:
 * - Peak Shaving: IEEE 4538388, MDPI Energies 11(8):2048
 * - Backup: IEEE 446-1995 (Orange Book)
 * - TOU Optimization: Industry practice
 * - Solar Consumption: NREL ATB 2024 PV-Plus-Battery
 * - EV Charging: Industry practice for demand management
 * - Grid Independence: NREL microgrid standards
 */
export const BESS_RATIOS: Record<string, number> = {
  "peak-shaving": 0.4,
  peak_shaving: 0.4,
  backup: 0.7,
  backup_power: 0.7,
  "tou-optimization": 0.5,
  energy_arbitrage: 0.5,
  "solar-consumption": 0.6,
  renewable_integration: 0.6,
  "ev-charging": 0.5,
  "grid-independence": 1.0,
  "demand-response": 0.5,
  demand_response: 0.5,
  "frequency-regulation": 0.3,
  frequency_regulation: 0.3,
  load_shifting: 0.5,
  stacked: 0.6,
  // Default
  default: 0.5,
};

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate BESS sizing using Grid-Synk methodology.
 *
 * @param inputs - Peak demand, duration, and application type
 * @returns Calculated BESS power, capacity, and formula explanation
 *
 * @example
 * ```typescript
 * const result = calculateBESS({
 *   peakDemandKW: 548,
 *   durationHours: 4,
 *   application: 'peak-shaving',
 * });
 * // Returns: { batteryKW: 219, batteryKWh: 1140, ... }
 * ```
 */
export function calculateBESS(inputs: BESSCalculationInputs): BESSCalculationResult {
  const { peakDemandKW, durationHours, application } = inputs;

  // Normalize application string
  const normalizedApp = application.toLowerCase().replace(/[_\s]/g, "-");

  // Step 1: Determine BESS power based on application
  const ratio = BESS_RATIOS[normalizedApp] || BESS_RATIOS[application] || BESS_RATIOS["default"];
  const batteryKW = Math.round(peakDemandKW * ratio);

  // Step 2: Calculate usable capacity (what the battery needs to deliver)
  const usableKWh = batteryKW * durationHours;

  // Step 3: Apply Grid-Synk efficiency factors to get required capacity
  // Required = Usable / (DoD × Static × Cycle)
  const combinedEfficiency =
    GRID_SYNK_FACTORS.DoD * GRID_SYNK_FACTORS.staticEfficiency * GRID_SYNK_FACTORS.cycleEfficiency;
  const batteryKWh = Math.round(usableKWh / combinedEfficiency);

  // Build formula string for transparency
  const formula = `${batteryKW} kW × ${durationHours} hr ÷ ${(combinedEfficiency * 100).toFixed(1)}% = ${batteryKWh.toLocaleString()} kWh`;

  return {
    batteryKW,
    batteryKWh,
    usableKWh,
    formula,
    source: "Grid-Synk BESS Calculator (https://grid-synk.com)",
    factors: {
      ratio,
      dod: GRID_SYNK_FACTORS.DoD,
      staticEfficiency: GRID_SYNK_FACTORS.staticEfficiency,
      cycleEfficiency: GRID_SYNK_FACTORS.cycleEfficiency,
      combinedEfficiency,
    },
  };
}

// ============================================================================
// RECALCULATION HELPERS
// ============================================================================

/**
 * Recalculate BESS when duration changes.
 * Power stays the same (based on peak demand), but capacity scales with duration.
 */
export function recalculateBESSForDuration(
  peakDemandKW: number,
  newDurationHours: number,
  application: string
): BESSCalculationResult {
  return calculateBESS({
    peakDemandKW,
    durationHours: newDurationHours,
    application: application as BESSApplication,
  });
}

/**
 * Get the BESS ratio for a given application.
 */
export function getBESSRatio(application: string): number {
  const normalizedApp = application.toLowerCase().replace(/[_\s]/g, "-");
  return BESS_RATIOS[normalizedApp] || BESS_RATIOS[application] || BESS_RATIOS["default"];
}

/**
 * Get human-readable explanation of BESS sizing.
 */
export function getBESSExplanation(inputs: BESSCalculationInputs): string {
  const result = calculateBESS(inputs);
  const ratio = result.factors.ratio;

  return `
    Based on your peak demand of ${inputs.peakDemandKW} kW and ${inputs.application} application:
    
    1. BESS Power = Peak × ${(ratio * 100).toFixed(0)}% = ${result.batteryKW} kW
    2. Usable Capacity = ${result.batteryKW} kW × ${inputs.durationHours} hr = ${result.usableKWh.toLocaleString()} kWh
    3. Required Capacity = ${result.usableKWh.toLocaleString()} kWh ÷ ${(result.factors.combinedEfficiency * 100).toFixed(1)}% = ${result.batteryKWh.toLocaleString()} kWh
    
    The ${(result.factors.combinedEfficiency * 100).toFixed(1)}% efficiency factor accounts for:
    - ${(result.factors.dod * 100).toFixed(0)}% Depth of Discharge
    - ${(result.factors.staticEfficiency * 100).toFixed(0)}% Static Efficiency (self-discharge, BMS)
    - ${(result.factors.cycleEfficiency * 100).toFixed(0)}% Cycle Efficiency (PCS, internal resistance)
  `.trim();
}

export default calculateBESS;
