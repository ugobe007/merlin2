/**
 * RECALC WIZARD CALCULATED - Single deterministic calculation entry point
 * Created: Jan 16, 2026
 *
 * This is the ONLY function that updates state.calculations.base
 * Call this whenever Step 3 inputs change (debounced).
 */

import type { WizardState } from "../types";

/**
 * Calculate EV charger load from infrastructure
 */
function _calculateEVChargerLoad(evChargers: unknown): number {
  if (!evChargers) return 0;

  const chargers = evChargers as Record<string, unknown>;
  let totalKW = 0;

  // Level 2 chargers (7.2 kW each)
  const l2Obj = chargers.L2 as Record<string, unknown> | undefined;
  const l2Count = Number(l2Obj?.count || chargers.level2Count || 0);
  totalKW += l2Count * 7.2;

  // DCFC chargers (150 kW each)
  const dcfcObj = chargers.DCFC as Record<string, unknown> | undefined;
  const dcfcCount = Number(dcfcObj?.count || chargers.dcfcCount || 0);
  totalKW += dcfcCount * 150;

  return totalKW;
}

/**
 * Estimate base building load from industry + facility data
 * TODO: Replace with industry-specific calculations from useCasePowerCalculations.ts
 */
function estimateBaseBuildingLoad(state: WizardState): number {
  const industry = (state.industry || "").toLowerCase();
  const inputs = (state.useCaseData?.inputs || {}) as Record<string, unknown>;

  // Hotel
  if (industry.includes("hotel")) {
    const rooms = Number(inputs.roomCount || 0);
    return rooms * 2.5; // ~2.5 kW per room average
  }

  // Car wash
  if (industry.includes("car wash")) {
    const bays = Number(inputs.bayCount || inputs.bays || 0);
    return bays * 15; // ~15 kW per bay
  }

  // Data center
  if (industry.includes("data center")) {
    const racks = Number(inputs.rackCount || 0);
    return racks * 5; // ~5 kW per rack
  }

  // Hospital
  if (industry.includes("hospital")) {
    const beds = Number(inputs.bedCount || 0);
    return beds * 3; // ~3 kW per bed
  }

  // Generic fallback: square footage
  const sqft = Number(inputs.squareFootage || inputs.squareFeet || 0);
  return sqft * 0.015; // ~15 W per sqft (typical commercial)
}

/**
 * Recalculate all derived values
 * This is the SINGLE SOURCE OF TRUTH for calculations
 */
export function recalcWizardCalculated(state: WizardState): WizardState["calculations"] {
  // Calculate loads
  const existingEVLoadKW = 0; // TODO: Calculate from state.facilityDetails.existingEV if needed

  // New EV load from goals
  const newEVLoadKW = state.selectedOptions?.includes("ev")
    ? (state.customEvL2 || 0) * 7.2 + (state.customEvDcfc || 0) * 150
    : 0;

  // Base building load
  const baseBuildingLoadKW = estimateBaseBuildingLoad(state);

  // Total peak demand
  const totalPeakDemandKW = baseBuildingLoadKW + existingEVLoadKW + newEVLoadKW;

  // Recommended battery sizing (simple heuristic - replace with SSOT logic)
  const recommendedBatteryKW = Math.max(0, Math.round(totalPeakDemandKW * 0.5));
  const recommendedBackupHours = 4; // Default
  const _recommendedBatteryKWh = Math.max(
    0,
    Math.round(recommendedBatteryKW * recommendedBackupHours)
  );

  // Annual consumption estimate
  const inputs = (state.useCaseData?.inputs || {}) as Record<string, unknown>;
  const operatingHours = Number(inputs.operatingHours || 8760); // Default to full year
  const annualConsumptionKWh = Math.round(baseBuildingLoadKW * operatingHours * 0.7); // 70% capacity factor

  // Utility costs
  const utilityRate = state.electricityRate || 0.12;
  const demandCharge = 15; // Default demand charge $/kW/month

  return {
    base: {
      ...state.calculations?.base,
      peakDemandKW: totalPeakDemandKW,
      annualConsumptionKWh,
      utilityRate,
      demandCharge,
    },
    selected: state.calculations?.selected || {
      bessKW: 0,
      bessKWh: 0,
      solarKW: 0,
      evChargers: 0,
      generatorKW: 0,
      totalInvestment: 0,
      annualSavings: 0,
      paybackYears: 0,
      tenYearROI: 0,
      federalITC: 0,
      netInvestment: 0,
    },
  };
}
