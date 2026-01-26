/**
 * STEP 3 CONTRACT - The handoff object between Steps 3→4→5
 * Created: Jan 16, 2026
 * Updated: Jan 24, 2026 - Contract-based validator integration
 *
 * This is the SINGLE SOURCE OF TRUTH for what Step 3 produces
 * and what Steps 4 & 5 consume.
 */

/**
 * Contract keys for missing field validation.
 * These map directly to Step3Snapshot paths.
 */
export type Step3MissingKey =
  | "location.zipCode"
  | "location.state"
  | "industry.type"
  | "facility.operatingHours"
  | "facility.squareFeet"
  | "facility.roomCount"
  | "facility.bayCount"
  | "facility.rackCount"
  | "facility.bedCount"
  | "facility.fuelPumpCount"
  | "facility.dcfcChargerCount"
  | "goals.primaryGoal"
  | "calculated.loadAnchor";

export interface LoadProfile {
  baseBuildingLoadKW: number;
  totalPeakDemandKW: number;
  operatingHours?: number;
}

/**
 * Step3Snapshot - The validated, derived state from Step 3
 *
 * Steps 4 & 5 ONLY read from this snapshot, never from raw wizardState
 */
export interface Step3Snapshot {
  // Raw inputs from wizard
  location: {
    zipCode: string;
    state: string;
    city: string;
    electricityRate: number;
  };

  industry: {
    type: string;
    name: string;
    tier?: string;
  };

  facility: {
    operatingHours?: number;
    squareFeet?: number;
    roomCount?: number;
    bayCount?: number;
    rackCount?: number;
    bedCount?: number;
    [key: string]: unknown;
  };

  existingInfrastructure: {
    solarKW?: number;
    generatorKW?: number;
    evChargers?: unknown;
    [key: string]: unknown;
  };

  goals: {
    primaryGoal: string;
    selectedOptions: string[];
    [key: string]: unknown;
  };

  useCaseData: Record<string, unknown>;

  // Validation status
  missing: Step3MissingKey[];
  completenessPct: number;
  confidencePct: number;
  warnings?: string[]; // Non-blocking issues (e.g., "peak_fallback_applied")

  // Derived load profile (minimum needed for Step 4 & Step 5)
  loadProfile: LoadProfile;

  // Calculated values (from SSOT calculations)
  calculated: {
    baseBuildingLoadKW: number;
    totalPeakDemandKW: number;
    recommendedBatteryKW: number;
    recommendedBatteryKWh: number;
    recommendedBackupHours?: number;
    existingEVLoadKW?: number;
    newEVLoadKW?: number;
    annualConsumptionKWh?: number;
    [key: string]: unknown;
  };
}
