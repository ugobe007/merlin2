/**
 * BUILD STEP 3 SNAPSHOT - Creates the handoff object for Steps 4 & 5
 * Created: Jan 16, 2026
 *
 * This is the ONLY function that creates Step3Snapshot.
 * Steps 4 & 5 MUST use this snapshot, not raw wizardState.
 */

import type { WizardState } from "../types";
import type { Step3Snapshot } from "./step3Contract";
import { getStep3Missing, computeCompletenessPct, computeConfidencePct } from "./step3Validator";

export function buildStep3Snapshot(state: WizardState): Step3Snapshot {
  const missing = getStep3Missing(state);
  const completenessPct = computeCompletenessPct(missing);
  const confidencePct = computeConfidencePct(state, missing);

  // Extract location data
  const location = {
    zipCode: state.zipCode || "",
    state: state.state || "",
    city: state.city || "",
    electricityRate: state.electricityRate || 0.12,
  };

  // Extract industry data
  const industry = {
    type: state.industry || "",
    name: state.industryName || state.industry || "",
    tier: state.businessSizeTier,
  };

  // Extract facility data
  const inputs = (state.useCaseData?.inputs || {}) as Record<string, any>;

  // ✅ UPGRADE 1: Spread first, normalize second (avoid duplicate keys)
  const facility = {
    ...inputs,
    operatingHours: inputs.operatingHours,
    squareFeet: inputs.squareFootage ?? inputs.squareFeet,
    roomCount: inputs.roomCount,
    bayCount: inputs.bayCount ?? inputs.bays,
    rackCount: inputs.rackCount,
    bedCount: inputs.bedCount,
  };

  // Extract existing infrastructure
  // NOTE: These should ideally come from Step3 inputs if your DB has those fields
  const existingInfrastructure = {
    solarKW: state.customSolarKw || 0,
    generatorKW: state.customGeneratorKw || 0,
    evChargers: {
      L2: { count: state.customEvL2 || 0, powerKW: 7.2 },
      DCFC: { count: state.customEvDcfc || 0, powerKW: 150 },
    },
  };

  // Extract goals
  const goals = {
    primaryGoal: (state.goals || [])[0] || "",
    selectedOptions: state.selectedOptions || [],
    goals: state.goals || [],
  };

  // ✅ UPGRADE 2: Prefer "real" base fields if they exist (fallback to peak)
  const peak = state.calculations?.base?.peakDemandKW ?? 0;
  const annual = state.calculations?.base?.annualConsumptionKWh;

  // Load profile from calculations (SSOT)
  const loadProfile = {
    baseBuildingLoadKW: state.calculations?.base?.baseBuildingLoadKW ?? peak,
    totalPeakDemandKW: peak,
    operatingHours: inputs.operatingHours,
  };

  // Calculated values (Step 4 & 5 read these)
  const calculated = {
    baseBuildingLoadKW: state.calculations?.base?.baseBuildingLoadKW ?? peak,
    totalPeakDemandKW: peak,
    recommendedBatteryKW: Math.round(peak * 0.5),
    recommendedBatteryKWh: Math.round(peak * 0.5 * 4),
    recommendedBackupHours: 4,
    annualConsumptionKWh: annual,
  };

  return {
    location,
    industry,
    facility,
    existingInfrastructure,
    goals,
    useCaseData: state.useCaseData || {},

    missing,
    completenessPct,
    confidencePct,

    loadProfile,
    calculated,
  };
}
