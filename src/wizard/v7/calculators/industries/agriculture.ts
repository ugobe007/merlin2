import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const AGRICULTURE_LOAD_V1_SSOT: CalculatorContract = {
  id: "agriculture_load_v1",
  requiredInputs: ["acreage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const acreage = Number(inputs.acreage ?? inputs.farmSize ?? inputs.acres) || 500;
    const farmType = String(inputs.farmType ?? "mixed").toLowerCase();
    const irrigationType = String(inputs.irrigationType ?? "center-pivot").toLowerCase();

    // Estimate irrigation kW from type
    const IRRIGATION_KW_MAP: Record<string, number> = {
      "center-pivot": acreage * 0.3,
      "drip-micro": acreage * 0.15,
      "flood-furrow": acreage * 0.1,
      sprinkler: acreage * 0.25,
      none: 0,
      "dry-farm": 0,
    };
    const irrigationKW = IRRIGATION_KW_MAP[irrigationType] || acreage * 0.2;

    const hasProcessing =
      inputs.processing && inputs.processing !== "none" && inputs.processing !== "no";
    const hasDairy =
      inputs.dairyMilking && inputs.dairyMilking !== "none" && inputs.dairyMilking !== "no";
    const hasColdStorage =
      inputs.coldStorage && inputs.coldStorage !== "none" && inputs.coldStorage !== "no";
    const hasGrainDrying =
      inputs.grainDrying && inputs.grainDrying !== "none" && inputs.grainDrying !== "no";

    assumptions.push(`Farm: ${acreage.toLocaleString()} acres (${farmType})`);
    assumptions.push(`Irrigation: ${irrigationType} (~${irrigationKW.toFixed(0)} kW)`);
    if (hasProcessing) assumptions.push(`On-site processing: ${inputs.processing}`);
    if (hasDairy) assumptions.push(`Dairy: ${inputs.dairyMilking}`);

    // ── Delegate to SSOT ───────────────────────────────────────────
    const result = calculateUseCasePower("agriculture", {
      acreage,
      farmSize: acreage,
      irrigationLoad: irrigationKW,
      farmType,
    });
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // ── TrueQuote kW contributor breakdown ─────────────────────────
    // Agriculture: irrigation (40-60%), processing, dairy, storage, buildings
    const irrigationPct = peakLoadKW > 0 ? Math.min(0.6, irrigationKW / peakLoadKW) : 0.4;
    const processingPct = hasProcessing ? 0.15 : 0.05;
    const dairyPct = hasDairy ? 0.1 : 0;
    const coldStoragePct = hasColdStorage ? 0.08 : 0;
    const buildingsPct = 0.1; // barns, offices
    const controlsPct = 0.03;
    const otherPct = Math.max(
      0.04,
      1.0 - irrigationPct - processingPct - dairyPct - coldStoragePct - buildingsPct - controlsPct
    );

    const processKW = peakLoadKW * (irrigationPct + processingPct + dairyPct);
    const hvacKW = peakLoadKW * buildingsPct;
    const lightingKW = peakLoadKW * 0.05; // minimal outdoor
    const coolingKW = peakLoadKW * coldStoragePct;
    const controlsKW = peakLoadKW * controlsPct;
    const otherKW = peakLoadKW * Math.max(0.04, otherPct - 0.05); // subtract lighting
    const kWContributorsTotalKW =
      processKW + hvacKW + lightingKW + coolingKW + controlsKW + otherKW;

    const dutyCycle = 0.4; // Seasonal peaks, irrigation runs 8-12h during growing season
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
        cooling: coolingKW,
        charging: 0,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        hvacPct: buildingsPct * 100,
        lightingPct: 5,
        processPct: (irrigationPct + processingPct + dairyPct) * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: 0,
        coolingPct: coldStoragePct * 100,
        chargingPct: 0,
        otherPct: Math.max(4, (otherPct - 0.05) * 100),
      },
      details: {
        agriculture: {
          acreage,
          farmType,
          irrigationType,
          irrigationKW,
          hasProcessing,
          hasDairy,
          hasColdStorage,
          hasGrainDrying,
        },
      },
      notes: [
        `Agriculture: ${acreage.toLocaleString()} acres (${farmType}) → ${peakLoadKW.toLocaleString()} kW (USDA benchmark)`,
        `Irrigation: ${irrigationType} → ${irrigationKW.toFixed(0)} kW (${(irrigationPct * 100).toFixed(0)}% of peak)`,
        `Seasonal operation, duty cycle: ${dutyCycle}`,
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
 * RESIDENTIAL SSOT ADAPTER
 *
 * Curated fields: homeType, squareFootage, occupants, buildingAge,
 *   hvacType, evCharging, pool, waterHeater, cooking
 * SSOT: calculateUseCasePower("residential", { squareFeet, homeCount })
 * Source: Residential benchmark (5 W/sq ft peak)
 */
