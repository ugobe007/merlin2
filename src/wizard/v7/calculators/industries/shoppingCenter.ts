import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const SHOPPING_CENTER_LOAD_V1_SSOT: CalculatorContract = {
  id: "shopping_center_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const squareFootage = Number(inputs.squareFootage ?? inputs.sqFt) || 100000;
    if (!inputs.squareFootage && !inputs.sqFt) {
      assumptions.push("Default: 100,000 sq ft (no user input)");
    }

    assumptions.push(
      `Shopping Center: ${squareFootage.toLocaleString()} sq ft @ 10 W/sqft (CBECS mall peak)`
    );

    // Capture curated fields in audit trail
    if (inputs.retailType) assumptions.push(`Retail type: ${inputs.retailType}`);
    if (inputs.operatingHours) assumptions.push(`Hours: ${inputs.operatingHours}`);

    const result = calculateUseCasePower(
      "shopping-center",
      buildSSOTInput("shopping_center", { squareFootage })
    );
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // Contributor breakdown (CBECS mall benchmark)
    const hvacKW = peakLoadKW * 0.35;
    const lightingKW = peakLoadKW * 0.3;
    const processKW = peakLoadKW * 0.15;
    const controlsKW = peakLoadKW * 0.05;
    const otherKW = peakLoadKW * 0.15;
    const kWContributorsTotalKW = hvacKW + lightingKW + processKW + controlsKW + otherKW;

    const dutyCycle = 0.45;
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);

    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        hvac: hvacKW,
        lighting: lightingKW,
        process: processKW,
        controls: controlsKW,
        itLoad: 0,
        cooling: 0,
        charging: 0,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        hvacPct: 35,
        lightingPct: 30,
        processPct: 15,
        controlsPct: 5,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: 15,
      },
      details: {
        shoppingCenter: {
          squareFootage,
          wattsPerSqFt: 10,
        },
      },
      notes: [
        `Shopping Center: ${squareFootage.toLocaleString()} sq ft → ${peakLoadKW.toLocaleString()} kW (CBECS 10 W/sqft)`,
        `Duty cycle: ${dutyCycle} (14h retail + overnight base load)`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay: Math.round(baseLoadKW * 24),
      assumptions,
      warnings,
      validation,
      raw: result,
    };
  },
};

// ══════════════════════════════════════════════════════
// MICROGRID SSOT ADAPTER
// ══════════════════════════════════════════════════════

/**
 * MICROGRID SSOT ADAPTER
 *
 * CalcValidation v1 envelope with contributor breakdown.
 * SSOT: calculateUseCasePower("microgrid", { sqFt, level2Chargers, dcFastChargers })
 *   → EV charger path (if chargers specified) OR sqft path (8 W/sqft mixed loads)
 *
 * Contributor model (sqft path):
 *   hvac (25%) — Mixed-use building HVAC
 *   lighting (15%) — Standard commercial
 *   process (25%) — Mixed loads, manufacturing, specialty
 *   controls (10%) — Microgrid controller, SCADA, BMS
 *   charging (10%) — EV or fleet charging
 *   other (15%) — Resilience loads, community services
 */
