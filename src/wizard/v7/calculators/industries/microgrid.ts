import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const MICROGRID_LOAD_V1_SSOT: CalculatorContract = {
  id: "microgrid_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const squareFootage = Number(inputs.squareFootage ?? inputs.sqFt ?? inputs.facilitySize) || 50000;
    const level2Chargers = inputs.level2Chargers != null ? Number(inputs.level2Chargers) : 0;
    const dcfcChargers = inputs.dcfcChargers != null ? Number(inputs.dcfcChargers) : 0;

    const hasEVChargers = level2Chargers > 0 || dcfcChargers > 0;

    if (hasEVChargers) {
      assumptions.push(
        `Microgrid with EV: ${level2Chargers} L2 + ${dcfcChargers} DCFC chargers`
      );
    } else {
      assumptions.push(
        `Microgrid: ${squareFootage.toLocaleString()} sq ft @ 8 W/sqft (mixed-load benchmark)`
      );
    }

    const result = calculateUseCasePower(
      "microgrid",
      buildSSOTInput("microgrid", { squareFootage, level2Chargers, dcfcChargers })
    );
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // Contributor breakdown depends on path
    let hvacPct: number, lightingPct: number, processPct: number;
    let controlsPct: number, chargingPct: number, otherPct: number;

    if (hasEVChargers) {
      // EV-heavy microgrid
      hvacPct = 0.1;
      lightingPct = 0.05;
      processPct = 0.05;
      controlsPct = 0.1;
      chargingPct = 0.6;
      otherPct = 0.1;
    } else {
      // Building/campus microgrid
      hvacPct = 0.25;
      lightingPct = 0.15;
      processPct = 0.25;
      controlsPct = 0.1;
      chargingPct = 0;
      otherPct = 0.25;
    }

    const hvacKW = peakLoadKW * hvacPct;
    const lightingKW = peakLoadKW * lightingPct;
    const processKW = peakLoadKW * processPct;
    const controlsKW = peakLoadKW * controlsPct;
    const chargingKW = peakLoadKW * chargingPct;
    const otherKW = peakLoadKW * otherPct;
    const kWContributorsTotalKW =
      hvacKW + lightingKW + processKW + controlsKW + chargingKW + otherKW;

    // Microgrids run 24/7 for resilience
    const dutyCycle = 0.65;
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
        charging: chargingKW,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        hvacPct: hvacPct * 100,
        lightingPct: lightingPct * 100,
        processPct: processPct * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: chargingPct * 100,
        otherPct: otherPct * 100,
      },
      details: {
        microgrid: {
          squareFootage,
          level2Chargers,
          dcfcChargers,
          hasEVChargers,
          wattsPerSqFt: hasEVChargers ? "EV-driven" : 8,
        },
      },
      notes: [
        `Microgrid: ${peakLoadKW.toLocaleString()} kW peak (${hasEVChargers ? "EV charger" : "8 W/sqft"} model)`,
        `Duty cycle: ${dutyCycle} (24/7 resilience operation)`,
        hasEVChargers
          ? `Charging dominant: ${level2Chargers} L2 + ${dcfcChargers} DCFC`
          : `Mixed-load: ${squareFootage.toLocaleString()} sq ft`,
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

// ========== REGISTRY ==========

/**
 * Calculator Registry
 *
 * REFACTORED: February 4, 2026 - All calculators now thin SSOT adapters
 *
 * ARCHITECTURE CHANGE:
 * - Previous: Hardcoded calculation logic (150+ lines per calculator)
 * - New: Thin adapters that delegate to useCasePowerCalculations.ts (20-30 lines)
 * - Benefits: Single source of truth, 80% less code, TrueQuote compliant
 *
 * COVERAGE:
 * - Generic adapter: Works for ALL 20+ industries via slug routing
 * - Industry-specific adapters: 11 industries with optimized parsing
 * - Future industries: Just add thin adapter or use generic
 *
 * LOOKUP: Templates use calculator.id to find contract
 * VALIDATION: validator.ts ensures template matches contract
 * EXECUTION: orchestrator calls contract.compute(inputs)
 */
