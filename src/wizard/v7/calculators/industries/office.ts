import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const OFFICE_LOAD_V1_SSOT: CalculatorContract = {
  id: "office_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // --- Core input ---
    const squareFootage = inputs.squareFootage != null ? (Number(inputs.squareFootage) || 50000) : 50000;
    if (!inputs.squareFootage) {
      assumptions.push("Default: 50,000 sq ft (no user input)");
    }

    // --- Template-enriched inputs (bridge curated config IDs → calculator fields) ---
    // Curated buildingClass: class-a/class-b/class-c/flex → officeType: corporate/tech/medical/standard
    const rawOfficeType = String(inputs.officeType ?? inputs.buildingClass ?? "corporate");
    const OFFICE_TYPE_MAP: Record<string, string> = {
      "class-a": "corporate",
      "class-b": "standard",
      "class-c": "standard",
      flex: "tech",
      corporate: "corporate",
      tech: "tech",
      medical: "medical",
      standard: "standard",
    };
    const officeType = OFFICE_TYPE_MAP[rawOfficeType] || rawOfficeType;
    // Curated floors: "1-3"/"4-10"/"11-25"/"25+" → numeric floorCount
    const rawFloors = inputs.floorCount ?? inputs.floors;
    const FLOOR_MAP: Record<string, number> = {
      "1-3": 2,
      "4-10": 7,
      "11-25": 18,
      "25+": 30,
    };
    const _floorCount =
      typeof rawFloors === "string" && FLOOR_MAP[rawFloors]
        ? FLOOR_MAP[rawFloors]
        : Number(rawFloors) || 0;
    const lightingType = String(inputs.lightingType || "");
    const hasServerRoom =
      inputs.hasServerRoom === true ||
      inputs.hasServerRoom === "true" ||
      inputs.serverRoom === "yes" ||
      inputs.serverRoom === true;
    const serverRoomKW = hasServerRoom ? Number(inputs.serverRoomKW) || 20 : 0;
    // Curated floors → derive elevator count if not explicitly set
    const elevatorCount =
      Number(inputs.elevatorCount) || (_floorCount >= 4 ? Math.ceil(_floorCount / 5) : 0);
    const evChargersCount = Number(inputs.evChargersCount ?? inputs.evChargers) || 0;
    const evChargerPowerKW = Number(inputs.evChargerPowerKW) || 7.2;
    // Bridge curated hvacSystem + buildingAge → hvacAgeYears
    // Curated hvacSystem: central-chiller/vrf/rooftop/mixed
    // Curated buildingAge: new/renovated/aging
    const rawHvacAge = Number(inputs.hvacAgeYears);
    const buildingAge = String(inputs.buildingAge || "");
    const hvacAgeYears =
      !isNaN(rawHvacAge) && rawHvacAge > 0
        ? rawHvacAge
        : buildingAge === "aging"
          ? 25
          : buildingAge === "renovated"
            ? 8
            : buildingAge === "new"
              ? 2
              : 0;

    // --- Base power from SSOT ---
    const result = calculateUseCasePower("office", buildSSOTInput("office", { squareFootage }));
    const basePowerKW = result.powerMW * 1000; // 6 W/sqft

    assumptions.push(`Office: ${squareFootage.toLocaleString()} sq ft @ 6 W/sqft (ASHRAE 90.1)`);

    // --- Additive loads ---
    let additiveKW = 0;
    const additiveDetails: string[] = [];

    // Server room: direct IT load + ~50% cooling overhead
    let serverTotalKW = 0;
    if (serverRoomKW > 0) {
      serverTotalKW = serverRoomKW * 1.5; // IT + cooling
      additiveKW += serverTotalKW;
      additiveDetails.push(
        `Server room: ${serverRoomKW}kW IT × 1.5 PUE = ${Math.round(serverTotalKW)}kW`
      );
    }

    // Elevators: ~30 kW each peak demand (traction type)
    let elevatorKW = 0;
    if (elevatorCount > 0) {
      elevatorKW = elevatorCount * 30;
      additiveKW += elevatorKW;
      additiveDetails.push(
        `${elevatorCount} elevator${elevatorCount > 1 ? "s" : ""}: ${elevatorKW}kW`
      );
    }

    // EV chargers
    let evKW = 0;
    if (evChargersCount > 0) {
      evKW = evChargersCount * evChargerPowerKW * 0.7; // 70% concurrency
      additiveKW += evKW;
      additiveDetails.push(
        `${evChargersCount} EV @ ${evChargerPowerKW}kW × 0.7 = ${Math.round(evKW)}kW`
      );
    }

    if (additiveDetails.length > 0) {
      assumptions.push(`Additive loads: ${additiveDetails.join(", ")}`);
    }

    // --- Total peak ---
    const peakLoadKW = Math.round(basePowerKW + additiveKW);

    // --- Contributor breakdown ---
    // Start with CBECS 2018 base percentages (of basePowerKW, not total)
    let hvacPct = 0.4;
    let lightingPct = 0.25;
    let processPct = 0.2;
    const controlsPct = 0.05;

    // LED lighting reduces lighting share by ~40% (DOE SSL program)
    const isLED = lightingType.toLowerCase().includes("led");
    if (isLED) {
      lightingPct *= 0.6; // 25% → 15%
      hvacPct += 0.04; // Recaptured as HVAC (less heat rejection)
    }

    // Tech offices: higher plug load density
    if (officeType === "tech") {
      processPct *= 1.5; // 20% → 30%
      lightingPct *= 0.8; // Slightly less (open plan)
    } else if (officeType === "medical") {
      processPct *= 1.2; // Diagnostic equipment
    }

    // HVAC age penalty: >15 years adds ~20% inefficiency (DOE commercial)
    if (hvacAgeYears > 15) {
      hvacPct *= 1.2;
    }

    // Normalize base percentages so they always sum to exactly 1.0
    // (tech office + aging HVAC can inflate sum to ~1.08 before normalization)
    const rawBasePctSum = hvacPct + lightingPct + processPct + controlsPct;
    if (rawBasePctSum > 1.0) {
      const normFactor = 1.0 / rawBasePctSum;
      hvacPct *= normFactor;
      lightingPct *= normFactor;
      processPct *= normFactor;
      // controlsPct stays fixed at 0.05 (small enough to absorb)
    }
    const basePctSum = hvacPct + lightingPct + processPct + controlsPct;
    const otherBasePct = Math.max(0, 1 - basePctSum); // Remainder

    const hvacKW = basePowerKW * hvacPct;
    const lightingKW = basePowerKW * lightingPct;
    const processKW = basePowerKW * processPct;
    const controlsKW = basePowerKW * controlsPct;
    const otherBaseKW = basePowerKW * otherBasePct;

    // Additive loads go to specific contributors
    const itLoadKW = serverRoomKW; // IT equipment only (no cooling)
    const coolingKW = serverRoomKW > 0 ? serverRoomKW * 0.5 : 0; // Server cooling
    const chargingKW = evKW;
    const otherKW = otherBaseKW + elevatorKW; // Base remainder + elevators

    const kWContributorsTotalKW =
      hvacKW + lightingKW + processKW + controlsKW + itLoadKW + coolingKW + chargingKW + otherKW;

    // Office hours: ~12h active, base load ~50% (HVAC standby + security + servers)
    const dutyCycle = hasServerRoom ? 0.55 : 0.5; // Servers run 24/7
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);

    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        hvac: hvacKW,
        lighting: lightingKW,
        process: processKW,
        controls: controlsKW,
        itLoad: itLoadKW,
        cooling: coolingKW,
        charging: chargingKW,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        hvacPct: peakLoadKW > 0 ? (hvacKW / peakLoadKW) * 100 : 0,
        lightingPct: peakLoadKW > 0 ? (lightingKW / peakLoadKW) * 100 : 0,
        processPct: peakLoadKW > 0 ? (processKW / peakLoadKW) * 100 : 0,
        controlsPct: peakLoadKW > 0 ? (controlsKW / peakLoadKW) * 100 : 0,
        itLoadPct: peakLoadKW > 0 ? (itLoadKW / peakLoadKW) * 100 : 0,
        coolingPct: peakLoadKW > 0 ? (coolingKW / peakLoadKW) * 100 : 0,
        chargingPct: peakLoadKW > 0 ? (chargingKW / peakLoadKW) * 100 : 0,
        otherPct: peakLoadKW > 0 ? (otherKW / peakLoadKW) * 100 : 0,
      },
      details: {
        office: {
          sqFt: squareFootage,
          wattsPerSqFt: 6.0,
          officeType,
          serverRoomKW,
          elevatorKW,
          evKW: Math.round(evKW),
          additiveKW: Math.round(additiveKW),
        },
      },
      notes: [
        `Office: ${squareFootage.toLocaleString()} sq ft → base ${Math.round(basePowerKW)}kW + additive ${Math.round(additiveKW)}kW = ${peakLoadKW}kW`,
        `HVAC-dominant: ${Math.round(hvacPct * 100)}% of base load (CBECS 2018${hvacAgeYears > 15 ? ", +20% age penalty" : ""})`,
        isLED
          ? `LED lighting: 40% reduction vs fluorescent (DOE SSL)`
          : `Fluorescent/mixed lighting`,
        `Duty cycle: ${dutyCycle} (${hasServerRoom ? "server room adds overnight load" : "12h active day"})`,
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
 * RETAIL SSOT ADAPTER
 *
 * CalcValidation v1 envelope with contributor breakdown.
 * SSOT: calculateUseCasePower("retail", { squareFootage }) → 8 W/sqft (CBECS 2018)
 *
 * Contributor model:
 *   lighting (35%) - Dominant in retail (display + accent + signage)
 *   hvac (30%) - High due to customer traffic / door openings
 *   process (15%) - POS, refrigeration (if grocery), security cameras
 *   controls (5%) - BMS, security, fire
 *   other (15%) - Signage, escalators, loading dock
 */
