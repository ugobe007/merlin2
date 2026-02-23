import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const COLD_STORAGE_LOAD_V1_SSOT: CalculatorContract = {
  id: "cold_storage_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const squareFootage = Number(inputs.squareFootage ?? inputs.sqFt) || 20000;
    const temperatureZones = String(inputs.temperatureZones ?? "frozen-and-cooled").toLowerCase();

    // ✅ FIX (Feb 14, 2026): Map button string values → numeric dock door count
    // Curated buttons: 'small'(1-5)/'medium'(6-15)/'large'(15-30)/'mega'(30+)
    const DOCK_MAP: Record<string, number> = {
      small: 3,    // midpoint of 1-5
      medium: 10,  // midpoint of 6-15
      large: 22,   // midpoint of 15-30
      mega: 40,    // conservative estimate for 30+
    };
    const rawDocks = inputs.dockDoors;
    const dockDoors =
      typeof rawDocks === "string" && rawDocks in DOCK_MAP
        ? DOCK_MAP[rawDocks]
        : rawDocks != null && Number.isFinite(Number(rawDocks)) && Number(rawDocks) > 0
          ? Number(rawDocks)
          : 4;
    const compressorSystem = String(inputs.compressorSystem ?? "industrial-rack").toLowerCase();
    const facilityType = String(inputs.facilityType ?? "distribution").toLowerCase();

    // Determine if there's a frozen zone (higher load)
    const hasFrozen = temperatureZones.includes("frozen") || temperatureZones.includes("deep");

    assumptions.push(`Cold storage: ${squareFootage.toLocaleString()} sq ft (${facilityType})`);
    assumptions.push(`Zones: ${temperatureZones}, ${dockDoors} dock doors`);
    assumptions.push(`Compressor: ${compressorSystem}`);

    // ── Delegate to SSOT ───────────────────────────────────────────
    const result = calculateUseCasePower("cold-storage", {
      squareFeet: squareFootage,
      sqFt: squareFootage,
    });
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // ── TrueQuote kW contributor breakdown ─────────────────────────
    // Cold storage: refrigeration-dominant (60-70%), plus HVAC, lighting, material handling
    const refrigerationPct = hasFrozen ? 0.7 : 0.6;
    const hvacPct = 0.05; // Minimal — refrigeration handles most climate
    const lightingPct = 0.08;
    const materialHandlingPct = 0.1; // Forklifts, conveyors, dock equipment
    const defrostPct = 0.05;
    const controlsPct = 0.04;
    const otherPct = Math.max(
      0.03,
      1.0 -
        refrigerationPct -
        hvacPct -
        lightingPct -
        materialHandlingPct -
        defrostPct -
        controlsPct
    );

    const coolingKW = peakLoadKW * refrigerationPct;
    const hvacKW = peakLoadKW * hvacPct;
    const lightingKW = peakLoadKW * lightingPct;
    const processKW = peakLoadKW * (materialHandlingPct + defrostPct);
    const controlsKW = peakLoadKW * controlsPct;
    const otherKW = peakLoadKW * otherPct;
    const kWContributorsTotalKW =
      coolingKW + hvacKW + lightingKW + processKW + controlsKW + otherKW;

    const dutyCycle = 0.85; // Cold storage runs compressors 24/7
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
        hvacPct: hvacPct * 100,
        lightingPct: lightingPct * 100,
        processPct: (materialHandlingPct + defrostPct) * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: 0,
        coolingPct: refrigerationPct * 100,
        chargingPct: 0,
        otherPct: otherPct * 100,
      },
      details: {
        coldStorage: {
          squareFootage,
          temperatureZones,
          hasFrozen,
          dockDoors,
          compressorSystem,
          facilityType,
        },
      },
      notes: [
        `Cold storage: ${squareFootage.toLocaleString()} sq ft → ${peakLoadKW.toLocaleString()} kW (CBECS 8 W/sqft)`,
        `Refrigeration-dominant: ${(refrigerationPct * 100).toFixed(0)}% (${hasFrozen ? "frozen+cooled" : "cooled only"})`,
        `24/7 compressor operation, duty cycle: ${dutyCycle}`,
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
 * INDOOR FARM SSOT ADAPTER
 *
 * Curated fields: farmType, squareFootage, growingLevels, cropType,
 *   lightingSystem, lightSchedule, hvacDehumidification, irrigationSystem, waterTreatment
 * SSOT: calculateIndoorFarmPower(growingAreaSqFt, ledWattagePerSqFt)
 * Source: CEA industry peak demand (LED + 30% HVAC)
 */
