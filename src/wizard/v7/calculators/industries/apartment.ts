import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const APARTMENT_LOAD_V1_SSOT: CalculatorContract = {
  id: "apartment_load_v1",
  requiredInputs: ["unitCount"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const _rawUnitCount = inputs.unitCount ?? inputs.numUnits ?? inputs.units;
    const unitCount = _rawUnitCount != null ? (Number(_rawUnitCount) || 400) : 400;

    // ✅ FIX (Feb 14, 2026): Map button string values → numeric sq ft
    // Curated buttons: 'studio'(<600)/'1br'(600-900)/'2br'(900-1200)/'large'(1200+)
    const UNIT_SIZE_MAP: Record<string, number> = {
      studio: 450,   // midpoint of <600
      "1br": 750,    // midpoint of 600-900
      "2br": 1050,   // midpoint of 900-1200
      large: 1400,   // conservative estimate for 1200+
    };
    const rawUnitSize = inputs.avgUnitSize;
    const avgUnitSize =
      typeof rawUnitSize === "string" && rawUnitSize in UNIT_SIZE_MAP
        ? UNIT_SIZE_MAP[rawUnitSize]
        : rawUnitSize != null && Number.isFinite(Number(rawUnitSize)) && Number(rawUnitSize) > 0
          ? Number(rawUnitSize)
          : 900;
    const propertyType = String(inputs.propertyType ?? "mid-rise").toLowerCase();
    const hasElevators =
      inputs.elevators && inputs.elevators !== "none" && inputs.elevators !== "no";
    const hasPool = inputs.commonAmenities && String(inputs.commonAmenities).includes("pool");

    assumptions.push(`${unitCount} units @ ${avgUnitSize} avg sq ft (${propertyType})`);
    if (hasElevators) assumptions.push(`Elevators: ${inputs.elevators}`);
    if (inputs.hvacType) assumptions.push(`HVAC: ${inputs.hvacType}`);

    // ── Delegate to SSOT ───────────────────────────────────────────
    const result = calculateUseCasePower("apartment", { unitCount, numUnits: unitCount });
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // ── TrueQuote kW contributor breakdown ─────────────────────────
    // Apartments: per-unit HVAC, lighting, plug loads, common areas, elevators
    const hvacPct = 0.4;
    const lightingPct = 0.15;
    const plugLoadsPct = 0.2;
    const commonAreaPct = 0.1; // lobby, hallways, laundry
    const elevatorPct = hasElevators ? 0.08 : 0;
    const controlsPct = 0.03;
    const otherPct = Math.max(
      0.04,
      1.0 - hvacPct - lightingPct - plugLoadsPct - commonAreaPct - elevatorPct - controlsPct
    );

    const hvacKW = peakLoadKW * hvacPct;
    const lightingKW = peakLoadKW * lightingPct;
    const processKW = peakLoadKW * (plugLoadsPct + commonAreaPct + elevatorPct);
    const controlsKW = peakLoadKW * controlsPct;
    const otherKW = peakLoadKW * otherPct;
    const kWContributorsTotalKW = hvacKW + lightingKW + processKW + controlsKW + otherKW;

    const dutyCycle = 0.55; // Residential peaks morning + evening
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
        processPct: (plugLoadsPct + commonAreaPct + elevatorPct) * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: otherPct * 100,
      },
      details: {
        apartment: { unitCount, avgUnitSize, propertyType, hasElevators, hasPool },
      },
      notes: [
        `Apartments: ${unitCount} units × 1.8 kW/unit → ${peakLoadKW.toLocaleString()} kW (RECS benchmark)`,
        `HVAC: ${hvacPct * 100}%, Plug loads: ${plugLoadsPct * 100}%, Common: ${commonAreaPct * 100}%`,
        `Residential duty cycle: ${dutyCycle} (morning/evening peaks)`,
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
 * COLLEGE/UNIVERSITY SSOT ADAPTER
 *
 * Curated fields: institutionType, campusSqFt, enrollment, buildingAge,
 *   researchLabs, studentHousing, dataCenterHPC, athleticFacilities, evChargers
 * SSOT: calculateCollegePower(studentCount)
 * Source: AASHE higher education benchmark (0.5 kW/student)
 */
