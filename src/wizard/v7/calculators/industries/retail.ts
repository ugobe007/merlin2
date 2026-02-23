import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const RETAIL_LOAD_V1_SSOT: CalculatorContract = {
  id: "retail_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const squareFootage = Number(inputs.squareFootage) || 20000;
    if (!inputs.squareFootage) {
      assumptions.push("Default: 20,000 sq ft (no user input)");
    }

    // Bridge curated config fields → scale multiplier
    // retailType: grocery/department/specialty/big-box/convenience/pharmacy
    const retailType = String(inputs.retailType || "general");
    const RETAIL_MULTIPLIER: Record<string, number> = {
      grocery: 1.5, // Heavy refrigeration
      department: 1.1, // Extensive lighting
      specialty: 0.9, // Smaller, focused
      "big-box": 1.2, // Large warehouse-style
      convenience: 1.3, // Small but dense (refrigeration)
      pharmacy: 1.0,
      general: 1.0,
    };
    const retailMult = RETAIL_MULTIPLIER[retailType] || 1.0;

    // refrigerationLevel: none/light/moderate/heavy → adjust W/sqft
    const refLevel = String(inputs.refrigerationLevel || "light");
    const REFRIG_ADDER: Record<string, number> = { none: 0, light: 0, moderate: 2, heavy: 5 };
    const refrigAdder = REFRIG_ADDER[refLevel] || 0;

    const effectiveWattsPerSqFt = 8 * retailMult + refrigAdder;
    assumptions.push(
      `Retail (${retailType}): ${squareFootage.toLocaleString()} sq ft @ ${effectiveWattsPerSqFt.toFixed(1)} W/sqft (CBECS 2018 adj.)`
    );

    // Capture curated fields in audit trail
    if (inputs.operatingHours) assumptions.push(`Hours: ${inputs.operatingHours}`);
    if (inputs.lightingType) assumptions.push(`Lighting: ${inputs.lightingType}`);
    if (inputs.cookingOnSite) assumptions.push(`Cooking on-site: ${inputs.cookingOnSite}`);
    if (inputs.parkingLot) assumptions.push(`Parking lot: ${inputs.parkingLot}`);
    if (inputs.evChargers) assumptions.push(`EV chargers: ${inputs.evChargers}`);

    const result = calculateUseCasePower("retail", buildSSOTInput("retail", { squareFootage }));
    // Apply retail type and refrigeration multiplier
    const rawPeakKW = result.powerMW * 1000;
    const peakLoadKW = Math.round(rawPeakKW * retailMult + (squareFootage * refrigAdder) / 1000);

    // Contributor breakdown (CBECS 2018 retail)
    const lightingKW = peakLoadKW * 0.35;
    const hvacKW = peakLoadKW * 0.3;
    const processKW = peakLoadKW * 0.15; // POS, coolers, display electronics
    const controlsKW = peakLoadKW * 0.05;
    const otherKW = peakLoadKW * 0.15; // signage, escalators, loading

    const kWContributorsTotalKW = lightingKW + hvacKW + processKW + controlsKW + otherKW;

    // Retail hours: ~14h active, base load ~40% (security lighting, some HVAC)
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
        hvacPct: 30,
        lightingPct: 35,
        processPct: 15,
        controlsPct: 5,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: 15,
      },
      details: {
        retail: {
          sqFt: squareFootage,
          wattsPerSqFt: 8.0,
        },
      },
      notes: [
        `Retail: ${squareFootage.toLocaleString()} sq ft → peak ${peakLoadKW}kW`,
        `Lighting-dominant: 35% of load (CBECS 2018 retail)`,
        `Duty cycle: ${dutyCycle} (14h active, some overnight)`,
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

/**
 * MANUFACTURING SSOT ADAPTER
 *
 * Supports template-backed flow (manufacturing.v1.json) with:
 * - manufacturingType: light | medium | heavy | electronics | food
 * - shiftPattern: 1-shift | 2-shift | 3-shift (modulates dutyCycle)
 * - Equipment loads: compressed air, furnaces, CNC machines, refrigeration
 * - Environment: clean room, process cooling
 *
 * SSOT rules: process share scales with type+shifts, dutyCycle reflects shiftPattern
 */
