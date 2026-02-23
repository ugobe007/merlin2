import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const INDOOR_FARM_LOAD_V1_SSOT: CalculatorContract = {
  id: "indoor_farm_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const squareFootage =
      Number(inputs.squareFootage ?? inputs.growingAreaSqFt ?? inputs.sqFt) || 50000;

    // ✅ FIX (Feb 14, 2026): Map button string values → numeric growing levels
    // Curated buttons: '1'/'2-4'/'5-8'/'9+' (NOT plain numbers for ranges)
    const LEVEL_MAP: Record<string, number> = {
      "1": 1,
      "2-4": 3,   // midpoint of 2-4
      "5-8": 6,   // midpoint of 5-8
      "9+": 10,   // conservative estimate for 9+
    };
    const rawLevels = inputs.growingLevels;
    const growingLevels =
      typeof rawLevels === "string" && rawLevels in LEVEL_MAP
        ? LEVEL_MAP[rawLevels]
        : rawLevels != null && Number.isFinite(Number(rawLevels)) && Number(rawLevels) > 0
          ? Number(rawLevels)
          : 1;

    const effectiveGrowArea = squareFootage * Math.max(1, growingLevels);
    const lightingSystem = String(inputs.lightingSystem ?? "led-full-spectrum").toLowerCase();
    const lightSchedule = String(inputs.lightSchedule ?? "18-6").toLowerCase();
    const farmType = String(inputs.farmType ?? "vertical-farm").toLowerCase();

    // LED wattage by lighting type
    const LED_WATTAGE_MAP: Record<string, number> = {
      "led-full-spectrum": 50,
      "led-targeted": 40,
      "led-basic": 30,
      "hps-legacy": 60,
      "hybrid-led-hps": 55,
      fluorescent: 35,
    };
    const ledWattagePerSqFt = LED_WATTAGE_MAP[lightingSystem] || 50;

    assumptions.push(
      `Indoor farm: ${squareFootage.toLocaleString()} sq ft × ${growingLevels} levels (${farmType})`
    );
    assumptions.push(
      `Lighting: ${lightingSystem} @ ${ledWattagePerSqFt} W/sqft, schedule: ${lightSchedule}`
    );

    // ── Delegate to SSOT ───────────────────────────────────────────
    const result = calculateUseCasePower("indoor-farm", {
      growingAreaSqFt: effectiveGrowArea,
      ledWattagePerSqFt,
    });
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // ── TrueQuote kW contributor breakdown ─────────────────────────
    // Indoor farm: LED lighting (50-65%), HVAC/dehumidification (20-30%), irrigation, controls
    const lightingPct = 0.55;
    const hvacDehumidPct = 0.25;
    const irrigationPct = 0.08;
    const controlsPct = 0.05;
    const otherPct = 0.07; // CO2 injection, water treatment, packaging

    const lightingKW = peakLoadKW * lightingPct;
    const hvacKW = peakLoadKW * hvacDehumidPct;
    const processKW = peakLoadKW * irrigationPct;
    const controlsKW = peakLoadKW * controlsPct;
    const otherKW = peakLoadKW * otherPct;
    const kWContributorsTotalKW = lightingKW + hvacKW + processKW + controlsKW + otherKW;

    // Duty cycle: LEDs on 16-18h/day, HVAC always → ~0.80
    const dutyCycle = lightSchedule.includes("24") ? 0.9 : lightSchedule.includes("18") ? 0.8 : 0.7;
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
        hvacPct: hvacDehumidPct * 100,
        lightingPct: lightingPct * 100,
        processPct: irrigationPct * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: otherPct * 100,
      },
      details: {
        indoorFarm: {
          squareFootage,
          growingLevels,
          effectiveGrowArea,
          lightingSystem,
          ledWattagePerSqFt,
          lightSchedule,
          farmType,
        },
      },
      notes: [
        `Indoor farm: ${effectiveGrowArea.toLocaleString()} sq ft grow area → ${peakLoadKW.toLocaleString()} kW (CEA benchmark)`,
        `Lighting-dominant: ${(lightingPct * 100).toFixed(0)}% at ${ledWattagePerSqFt} W/sqft`,
        `Light schedule: ${lightSchedule}, duty cycle: ${dutyCycle}`,
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
 * AGRICULTURE SSOT ADAPTER
 *
 * Curated fields: farmType, acreage, irrigationType, buildingsSqFt,
 *   coldStorage, processing, dairyMilking, grainDrying, evEquipment
 * SSOT: calculateAgriculturePower(acres, irrigationKW, farmType)
 * Source: USDA agricultural peak demand
 */
