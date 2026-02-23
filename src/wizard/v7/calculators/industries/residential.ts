import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const RESIDENTIAL_LOAD_V1_SSOT: CalculatorContract = {
  id: "residential_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const squareFootage = Number(inputs.squareFootage ?? inputs.sqFt ?? inputs.homeSize) || 2000;
    const homeType = String(inputs.homeType ?? "single-family").toLowerCase();
    const occupants = Number(inputs.occupants) || 4;
    const hasEV = inputs.evCharging && inputs.evCharging !== "none" && inputs.evCharging !== "no";
    const hasPool = inputs.pool && inputs.pool !== "none" && inputs.pool !== "no";
    const hvacType = String(inputs.hvacType ?? "central-ac").toLowerCase();

    assumptions.push(
      `Home: ${squareFootage.toLocaleString()} sq ft ${homeType}, ${occupants} occupants`
    );
    assumptions.push(`HVAC: ${hvacType}`);
    if (hasEV) assumptions.push(`EV charging: ${inputs.evCharging}`);
    if (hasPool) assumptions.push(`Pool: ${inputs.pool}`);

    // ── Delegate to SSOT ───────────────────────────────────────────
    const result = calculateUseCasePower("residential", {
      squareFeet: squareFootage,
      sqFt: squareFootage,
      homeSize: squareFootage,
      homeCount: 1,
      units: 1,
    });
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // ── TrueQuote kW contributor breakdown ─────────────────────────
    // Residential: HVAC (45-50%), plug loads, lighting, EV, pool
    const hvacPct = 0.45;
    const lightingPct = 0.1;
    const plugLoadsPct = 0.15; // appliances, cooking, water heater
    const evPct = hasEV ? 0.15 : 0;
    const poolPct = hasPool ? 0.08 : 0;
    const controlsPct = 0.02;
    const otherPct = Math.max(
      0.05,
      1.0 - hvacPct - lightingPct - plugLoadsPct - evPct - poolPct - controlsPct
    );

    const hvacKW = peakLoadKW * hvacPct;
    const lightingKW = peakLoadKW * lightingPct;
    const processKW = peakLoadKW * plugLoadsPct;
    const chargingKW = peakLoadKW * evPct;
    const controlsKW = peakLoadKW * controlsPct;
    const otherKW = peakLoadKW * (otherPct + poolPct);
    const kWContributorsTotalKW =
      hvacKW + lightingKW + processKW + chargingKW + controlsKW + otherKW;

    const dutyCycle = 0.35; // Residential: evening peaks, low daytime
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
        processPct: plugLoadsPct * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: evPct * 100,
        otherPct: (otherPct + poolPct) * 100,
      },
      details: {
        residential: { squareFootage, homeType, occupants, hvacType, hasEV, hasPool },
      },
      notes: [
        `Residential: ${squareFootage.toLocaleString()} sq ft → ${peakLoadKW.toLocaleString()} kW (5 W/sqft benchmark)`,
        `HVAC: ${hvacPct * 100}%, Plug loads: ${plugLoadsPct * 100}%${hasEV ? `, EV: ${evPct * 100}%` : ""}`,
        `Residential duty cycle: ${dutyCycle} (evening peaks)`,
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
 * GOVERNMENT SSOT ADAPTER
 *
 * Curated fields: facilityType, squareFootage, buildingAge, campusOrStandalone,
 *   criticalOperations, operatingHours, dataCenter, evFleet
 * SSOT: calculateGovernmentPower(sqFt)
 * Source: FEMP public building benchmark (1.5 W/sq ft)
 */
