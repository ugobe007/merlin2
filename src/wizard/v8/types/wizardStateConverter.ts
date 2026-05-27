/**
 * WIZARD STATE → EXPORT CONVERTER
 *
 * Bridges V8 WizardState → WizardExport canonical schema
 * Handles data transformation, provenance tracking, and validation
 *
 * Used by:
 * - Phase 4.2 integration handoff (wizard → quote builder)
 * - Session persistence
 * - Analytics event dispatch
 * - API payloads to dashboard
 */

import {
  exportWizardState,
  canQuoteBuilderConsume,
  hashWizardExport,
  type WizardExport,
} from "./wizardExportSchema";
import type { WizardState } from "../wizardState";

/**
 * Map V8 generator fuel types to export schema enum
 */
function mapGeneratorFuelType(
  fuelType: "diesel" | "natural-gas" | "dual-fuel" | "linear"
): "none" | "diesel" | "ng" | "dual-fuel" {
  switch (fuelType) {
    case "natural-gas":
      return "ng";
    case "diesel":
      return "diesel";
    case "dual-fuel":
      return "dual-fuel";
    case "linear":
      return "diesel"; // Linear gen uses diesel as default in schema
    default:
      return "diesel";
  }
}

/**
 * Convert V8 WizardState to canonical WizardExport
 * Only succeeds when wizard completion is detected (step 6 + tiers ready)
 */
export function convertWizardStateToExport(
  state: WizardState,
  sessionId: string
): WizardExport | null {
  // Require minimum viable state for export
  if (!state.location || !state.intel || !state.tiers) {
    console.warn("⚠️ convertWizardStateToExport: missing required fields for export");
    return null;
  }

  // Tiers are already formatted in state; map them to export schema
  const exportTiers = state.tiers.map((tier, idx) => ({
    label: (["Starter", "Recommended", "Complete"] as const)[idx] ?? "Starter",
    bessKW: tier.bessKW,
    bessKWh: tier.bessKWh,
    solarKW: tier.solarKW,
    generatorKW: tier.generatorKW,
    projectCostNet: tier.netCost,
    annualSavings: tier.annualSavings,
    paybackYears: tier.paybackYears,
    npv: tier.npv,
    irr: tier.roi10Year,
  }));

  // Track data provenance (which fields were user-input vs. auto-detected)
  const provenance = {
    "location.zip": "user_input",
    "intel.utilityRate": state.uploadedBillData ? "user_input" : "auto_detect",
    "profileInputs.baseLoadKW": "user_input",
    "stackGoal.bias": "user_input",
  } as Record<string, "user_input" | "auto_detect" | "fallback" | "calculated">;

  // Collect audit notes (solar exclusion, source limitations, etc.)
  const auditNotes: string[] = [];
  if (state.intel.solarGrade && ["C", "C+", "D"].includes(state.intel.solarGrade)) {
    auditNotes.push(`⚠️ Solar excluded: grade ${state.intel.solarGrade} below B threshold`);
  }
  if (!state.intel.solarFeasible) {
    auditNotes.push("⚠️ Solar not feasible for this location/building");
  }

  // Build export object
  const exported: WizardExport = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    sessionId,
    wizardId: sessionId, // Will be hashed later
    completionPercent: 100,

    // Core inputs (required by quote builder)
    location: {
      zip: state.location.zip,
      city: state.location.city,
      state: state.location.state,
      formattedAddress: state.location.formattedAddress,
      lat: state.location.lat,
      lng: state.location.lng,
      country: state.country === "US" ? "US" : "OTHER",
    },

    // Business (optional)
    business:
      state.business && state.industry
        ? {
            name: state.business.name,
            address: state.business.address,
            formattedAddress: state.business.formattedAddress,
            website: state.business.website,
            industry: state.industry,
            confidence: state.business.confidence,
          }
        : undefined,

    // Intel (required)
    intel: {
      utilityRate: state.intel.utilityRate,
      demandCharge: state.intel.demandCharge,
      utilityProvider: state.intel.utilityProvider,
      peakSunHours: state.intel.peakSunHours,
      solarGrade: state.intel.solarGrade,
      solarFeasible: state.intel.solarFeasible,
      weatherProfile: state.intel.weatherProfile,
      avgTempF: state.intel.avgTempF,
    },

    // Profile (required)
    profileInputs: {
      baseLoadKW: state.baseLoadKW,
      peakLoadKW: state.peakLoadKW,
      criticalLoadPercent:
        state.baseLoadKW > 0 ? (state.criticalLoadKW / state.baseLoadKW) * 100 : 0,
      roofAreaSqFt: undefined, // Not stored in V8 state directly
      generatorFuelType: mapGeneratorFuelType(state.generatorFuelType),
      evChargers:
        state.dcfcChargers > 0 || state.level2Chargers > 0 || state.hpcChargers > 0
          ? {
              level2: state.level2Chargers,
              dcfc50kw: state.dcfcChargers,
              hpc350kw: state.hpcChargers,
            }
          : undefined,
    },

    // Stack goal (optional in export schema, but helpful for provenance)
    stackGoal: {
      bias: "save_more",
    },

    // Energy stack profile (the 3 tiers + scoring)
    energyStack: {
      tiers: exportTiers,
      costStability: 100, // Placeholder; calculated from intel
      gridDependence: 50,
      outrageResilience: 75,
      peakExposure: 80,
      roiEfficiency: state.tiers[1]
        ? (state.tiers[1].annualSavings / state.tiers[1].netCost) * 100
        : 100,
    },

    // Metadata
    provenance,
    auditNotes,

    // Next hop suggestions for quote builder
    suggestedQuoteMode: "advanced_config",
    suggestedAddOns: suggestAddOns(state),
  };

  return exported;
}

/**
 * Suggest add-ons based on state profile
 */
function suggestAddOns(state: WizardState): string[] {
  const suggestions: string[] = [];

  if (state.evChargers && (state.evChargers.count > 0 || state.wantsEVCharging)) {
    suggestions.push("ev-charging-optimization");
  }

  if (state.wantsGenerator && state.generatorKW > 0) {
    suggestions.push("backup-generator-extended");
  }

  if (state.wantsSolar && state.solarKW === 0) {
    suggestions.push("solar-feasibility-survey");
  }

  return suggestions;
}

/**
 * Diagnostic: Check export readiness and return status
 */
export function checkExportReadiness(state: WizardState): {
  isReady: boolean;
  missingFields: string[];
  readinessPercent: number;
} {
  const requiredFields = [
    { field: "location", check: !!state.location },
    { field: "intel", check: !!state.intel },
    { field: "baseLoadKW", check: state.baseLoadKW > 0 },
    { field: "tiers", check: state.tiers && state.tiers.length >= 3 },
  ];

  const missingFields = requiredFields.filter(({ check }) => !check).map(({ field }) => field);

  const readinessPercent =
    ((requiredFields.length - missingFields.length) / requiredFields.length) * 100;

  return {
    isReady: missingFields.length === 0,
    missingFields,
    readinessPercent: Math.round(readinessPercent),
  };
}

/**
 * Phase 4.2: Export state for quote builder handoff with validation
 *
 * Call this when wizard reaches step 6 (results page).
 * Returns a validated export ready to pass to quote builder or dashboard.
 */
export function prepareWizardHandoff(
  state: WizardState,
  sessionId: string
): {
  success: boolean;
  export?: WizardExport;
  readiness?: ReturnType<typeof checkExportReadiness>;
  errors?: string[];
} {
  // Check readiness
  const readiness = checkExportReadiness(state);
  if (!readiness.isReady) {
    return {
      success: false,
      readiness,
      errors: readiness.missingFields.map((f) => `Missing required field: ${f}`),
    };
  }

  // Convert state
  const exported = convertWizardStateToExport(state, sessionId);
  if (!exported) {
    return {
      success: false,
      errors: ["Failed to convert wizard state"],
    };
  }

  // Validate export schema
  const validation = exportWizardState(exported);
  if (!validation.success) {
    return {
      success: false,
      errors: ["Export schema validation failed", validation.errors?.message || "Unknown error"],
    };
  }

  // Check quote builder compatibility
  const compatibility = canQuoteBuilderConsume(validation.data!);
  if (!compatibility.canConsume) {
    return {
      success: false,
      errors: compatibility.missingFields.map((f) => `Quote builder missing: ${f}`),
    };
  }

  // Generate cache hash
  const exportHash = hashWizardExport(validation.data!);

  return {
    success: true,
    export: {
      ...validation.data!,
      wizardId: `${sessionId}-${exportHash}`,
    },
    readiness,
  };
}
