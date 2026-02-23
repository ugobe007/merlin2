import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const WAREHOUSE_LOAD_V1_SSOT: CalculatorContract = {
  id: "warehouse_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const squareFootage = inputs.squareFootage != null ? (Number(inputs.squareFootage) || 200000) : 200000;
    // Bridge curated: warehouseType (ambient/cold-storage/freezer/mixed) → isColdStorage
    let isColdStorage = inputs.isColdStorage === true || inputs.isColdStorage === "true";
    if (!isColdStorage && inputs.warehouseType != null) {
      const whType = String(inputs.warehouseType).toLowerCase();
      isColdStorage = whType.includes("cold") || whType.includes("freezer");
    }
    // Bridge curated: refrigeration (yes/no) → also implies cold storage behavior
    if (!isColdStorage && (inputs.refrigeration === "yes" || inputs.refrigeration === true)) {
      isColdStorage = true;
    }
    // Capture rich curated inputs as assumptions for audit trail
    if (inputs.ceilingHeight) assumptions.push(`Ceiling height: ${inputs.ceilingHeight}`);
    if (inputs.dockDoors) assumptions.push(`Dock doors: ${inputs.dockDoors}`);
    if (inputs.materialHandling) assumptions.push(`Material handling: ${inputs.materialHandling}`);
    if (inputs.automationLevel) assumptions.push(`Automation: ${inputs.automationLevel}`);
    if (inputs.operatingHours) assumptions.push(`Operating hours: ${inputs.operatingHours}`);
    if (inputs.evFleet) assumptions.push(`EV fleet: ${inputs.evFleet}`);

    if (!inputs.squareFootage) {
      assumptions.push("Default: 200,000 sq ft (no user input)");
    }

    const wattsPerSqFt = isColdStorage ? 8.0 : 2.0;
    assumptions.push(
      `${isColdStorage ? "Cold Storage" : "Warehouse"}: ${squareFootage.toLocaleString()} sq ft @ ${wattsPerSqFt} W/sqft (CBECS)`
    );

    const result = calculateUseCasePower(
      "warehouse",
      buildSSOTInput("warehouse", {
        squareFootage,
        isColdStorage,
      })
    );
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // Contributor breakdown varies: cold storage is refrigeration-dominant
    let lightingPct: number, hvacPct: number, processPct: number, otherPct: number;
    if (isColdStorage) {
      // Cold storage: refrigeration compressors dominate
      lightingPct = 0.1;
      hvacPct = 0.1;
      processPct = 0.65; // Refrigeration compressors
      otherPct = 0.1;
    } else {
      // Standard warehouse: lighting-dominant
      lightingPct = 0.4;
      hvacPct = 0.15;
      processPct = 0.25; // Material handling
      otherPct = 0.15;
    }
    const controlsPct = 0.05;

    const lightingKW = peakLoadKW * lightingPct;
    const hvacKW = peakLoadKW * hvacPct;
    const processKW = peakLoadKW * processPct;
    const controlsKW = peakLoadKW * controlsPct;
    const otherKW = peakLoadKW * otherPct;

    const kWContributorsTotalKW = lightingKW + hvacKW + processKW + controlsKW + otherKW;

    // Warehouse: 16h active (2 shifts typical), low overnight
    const dutyCycle = isColdStorage ? 0.85 : 0.35;
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
        hvacPct: hvacPct * 100,
        lightingPct: lightingPct * 100,
        processPct: processPct * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: otherPct * 100,
      },
      details: {
        warehouse: {
          sqFt: squareFootage,
          wattsPerSqFt,
          isColdStorage,
        },
      },
      notes: [
        `${isColdStorage ? "Cold Storage" : "Warehouse"}: ${squareFootage.toLocaleString()} sq ft → peak ${peakLoadKW}kW`,
        isColdStorage
          ? `Refrigeration-dominant: 65% of load (compressor cycling)`
          : `Lighting-dominant: 40% of load (high-bay LED)`,
        `Duty cycle: ${dutyCycle} (${isColdStorage ? "near-continuous refrigeration" : "daytime operations"})`,
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
 * EV CHARGING SSOT ADAPTER
 *
 * Accepts: level2Chargers, dcfcChargers, hpcChargers (optional),
 *          siteDemandCapKW (optional), level2PowerKW (optional)
 *
 * Charger power ratings:
 *   Level 2: 7.2 kW default (configurable: 7.2/11/19.2/22)
 *   DCFC: 150 kW
 *   HPC: 250 kW
 *
 * SSOT: Routes through calculateUseCasePower("ev-charging", ...)
 * Demand cap: If siteDemandCapKW > 0 AND < computed peak, proportionally
 *   scales ALL contributors so sum = cap (preserves forensic breakdown).
 */
