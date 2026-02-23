import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const MANUFACTURING_LOAD_V1_SSOT: CalculatorContract = {
  id: "manufacturing_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // --- Core inputs (bridge curated config IDs → calculator field names) ---
    const squareFootage = inputs.squareFootage != null ? (Number(inputs.squareFootage) || 100000) : 100000;
    // Curated: facilityType (light-assembly/heavy-industrial/electronics/food-processing/chemical/pharmaceutical/automotive)
    // Calculator expects: manufacturingType (light/medium/heavy/electronics/food)
    const rawMfgType = String(inputs.manufacturingType || inputs.facilityType || "light");
    const MFG_TYPE_MAP: Record<string, string> = {
      "light-assembly": "light",
      "heavy-industrial": "heavy",
      electronics: "electronics",
      "food-processing": "food",
      chemical: "heavy",
      pharmaceutical: "electronics",
      automotive: "heavy",
      light: "light",
      medium: "medium",
      heavy: "heavy",
      food: "food",
    };
    const manufacturingType = MFG_TYPE_MAP[rawMfgType] || "light";
    // Curated: shifts (single/double/triple/continuous)
    // Calculator expects: shiftPattern (1-shift/2-shift/3-shift)
    const rawShifts = String(inputs.shiftPattern || inputs.shifts || "1-shift");
    const SHIFT_MAP: Record<string, string> = {
      single: "1-shift",
      double: "2-shift",
      triple: "3-shift",
      continuous: "3-shift",
      "1-shift": "1-shift",
      "2-shift": "2-shift",
      "3-shift": "3-shift",
    };
    const shiftPattern = SHIFT_MAP[rawShifts] || "1-shift";

    // Bridge curated equipment booleans to calculator fields
    // compressedAir (curated: yes/no) → hasCompressedAir (bool)
    if (inputs.compressedAir != null && inputs.hasCompressedAir == null) {
      (inputs as Record<string, unknown>).hasCompressedAir =
        inputs.compressedAir === "yes" || inputs.compressedAir === true;
      if (!inputs.compressorHP) (inputs as Record<string, unknown>).compressorHP = 50; // default 50 HP
    }
    // heavyMachinery (curated: yes/no) → hasCNCMachines / hasElectricFurnace
    if (inputs.heavyMachinery != null && inputs.hasCNCMachines == null) {
      (inputs as Record<string, unknown>).hasCNCMachines =
        inputs.heavyMachinery === "yes" || inputs.heavyMachinery === true;
      if (!inputs.cncCount) (inputs as Record<string, unknown>).cncCount = 3; // default
    }
    // refrigeration (curated: yes/no) → hasRefrigeration
    if (inputs.refrigeration != null && inputs.hasRefrigeration == null) {
      (inputs as Record<string, unknown>).hasRefrigeration =
        inputs.refrigeration === "yes" || inputs.refrigeration === true;
    }
    // cleanRoom (curated: yes/no) → cleanRoom (bool)
    if (inputs.cleanRoom != null && typeof inputs.cleanRoom === "string") {
      (inputs as Record<string, unknown>).cleanRoom = inputs.cleanRoom === "yes";
    }
    // processLoads (curated: select like "welding","cnc","packaging","assembly") → processLoads
    if (inputs.processLoads != null && !inputs.hasElectricFurnace) {
      const plRaw = String(inputs.processLoads).toLowerCase();
      if (plRaw.includes("welding") || plRaw.includes("furnace")) {
        (inputs as Record<string, unknown>).hasElectricFurnace = true;
        if (!inputs.furnaceKW) (inputs as Record<string, unknown>).furnaceKW = 100;
      }
    }

    assumptions.push(
      `Manufacturing: ${squareFootage.toLocaleString()} sq ft (${manufacturingType}, ${shiftPattern})`
    );

    // 1. Base load via SSOT
    const result = calculateUseCasePower(
      "manufacturing",
      buildSSOTInput("manufacturing", { squareFootage, manufacturingType })
    );
    const basePowerKW = result.powerMW * 1000;

    // 2. Additive equipment loads
    let equipmentLoadKW = 0;
    const equipmentDetails: string[] = [];

    // Compressed air: 1 HP ≈ 0.75 kW
    const hasCompressedAir = inputs.hasCompressedAir === true || inputs.hasCompressedAir === "true";
    const compressorHP = Number(inputs.compressorHP) || 0;
    if (hasCompressedAir && compressorHP > 0) {
      const compressorKW = compressorHP * 0.75;
      equipmentLoadKW += compressorKW;
      equipmentDetails.push(
        `Compressed air: ${compressorHP}HP @ 0.75kW/HP = ${Math.round(compressorKW)}kW`
      );
    }

    // Electric furnace/oven
    const hasElectricFurnace =
      inputs.hasElectricFurnace === true || inputs.hasElectricFurnace === "true";
    const furnaceKW = Number(inputs.furnaceKW) || 0;
    if (hasElectricFurnace && furnaceKW > 0) {
      equipmentLoadKW += furnaceKW;
      equipmentDetails.push(`Furnace/oven: ${furnaceKW}kW`);
    }

    // CNC machines: ~20kW average each
    const hasCNCMachines = inputs.hasCNCMachines === true || inputs.hasCNCMachines === "true";
    const cncCount = Number(inputs.cncCount) || 0;
    if (hasCNCMachines && cncCount > 0) {
      const cncKW = cncCount * 20;
      equipmentLoadKW += cncKW;
      equipmentDetails.push(`${cncCount} CNC @ 20kW = ${cncKW}kW`);
    }

    // Refrigeration: ~5 kW per 1000 sq ft (if present)
    const hasRefrigeration = inputs.hasRefrigeration === true || inputs.hasRefrigeration === "true";
    if (hasRefrigeration) {
      const refrigKW = Math.round(squareFootage * 0.005); // 5 W/sqft
      equipmentLoadKW += refrigKW;
      equipmentDetails.push(`Refrigeration: ${refrigKW}kW`);
    }

    // Clean room: 3x HVAC multiplier (applied to HVAC share later, add 10% of base here)
    const isCleanRoom = inputs.cleanRoom === true || inputs.cleanRoom === "true";
    if (isCleanRoom) {
      const cleanRoomAdder = Math.round(basePowerKW * 0.1);
      equipmentLoadKW += cleanRoomAdder;
      equipmentDetails.push(`Clean room HVAC adder: ${cleanRoomAdder}kW`);
    }

    // Process cooling: adds ~5% of base
    const hasProcessCooling = inputs.processCooling === true || inputs.processCooling === "true";
    if (hasProcessCooling) {
      const coolingAdder = Math.round(basePowerKW * 0.05);
      equipmentLoadKW += coolingAdder;
      equipmentDetails.push(`Process cooling: ${coolingAdder}kW`);
    }

    if (equipmentDetails.length > 0) {
      assumptions.push(`Equipment: ${equipmentDetails.join(", ")}`);
    }

    // 3. Total peak
    const peakLoadKW = Math.round(basePowerKW + equipmentLoadKW);

    // 4. Contributor breakdown by manufacturing type
    // process share scales with type + equipment
    const typeMultipliers: Record<string, { process: number; hvac: number; lighting: number }> = {
      light: { process: 0.45, hvac: 0.25, lighting: 0.1 },
      medium: { process: 0.55, hvac: 0.2, lighting: 0.08 },
      heavy: { process: 0.65, hvac: 0.15, lighting: 0.06 },
      electronics: { process: 0.5, hvac: 0.3, lighting: 0.07 }, // Higher HVAC for clean rooms
      food: { process: 0.55, hvac: 0.22, lighting: 0.08 },
    };
    const mults = typeMultipliers[manufacturingType] ?? typeMultipliers.light;

    // If there's significant equipment, shift more to process
    const equipPct = equipmentLoadKW / (peakLoadKW || 1);
    const adjustedProcessPct = Math.min(mults.process + equipPct * 0.3, 0.8);

    const processKW = peakLoadKW * adjustedProcessPct;
    const hvacKW = peakLoadKW * mults.hvac;
    const lightingKW = peakLoadKW * mults.lighting;
    const controlsKW = peakLoadKW * 0.05;
    const otherKW = Math.max(0, peakLoadKW - processKW - hvacKW - lightingKW - controlsKW);

    const kWContributorsTotalKW = processKW + hvacKW + lightingKW + controlsKW + otherKW;

    // 5. dutyCycle reflects shiftPattern
    const dutyCycleMap: Record<string, number> = {
      "1-shift": 0.55, // 8h/24h ≈ 0.33 production + 0.22 standby
      "2-shift": 0.75, // 16h/24h ≈ 0.67 production + 0.08 standby
      "3-shift": 0.9, // Near-continuous
    };
    const dutyCycle = dutyCycleMap[shiftPattern] || 0.8;
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);

    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        process: processKW,
        hvac: hvacKW,
        lighting: lightingKW,
        controls: controlsKW,
        itLoad: 0,
        cooling: 0,
        charging: 0,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        processPct: (processKW / peakLoadKW) * 100,
        hvacPct: (hvacKW / peakLoadKW) * 100,
        lightingPct: (lightingKW / peakLoadKW) * 100,
        controlsPct: (controlsKW / peakLoadKW) * 100,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: (otherKW / peakLoadKW) * 100,
      },
      details: {
        manufacturing: {
          type: manufacturingType,
          shiftPattern,
          processIntensity: adjustedProcessPct,
          sqFt: squareFootage,
          equipmentLoadKW,
        },
      },
      notes: [
        `Manufacturing (${manufacturingType}): ${squareFootage.toLocaleString()} sq ft → peak ${peakLoadKW}kW`,
        `Shifts: ${shiftPattern} → dutyCycle=${dutyCycle}`,
        `Process-dominant: ${(adjustedProcessPct * 100).toFixed(0)}% of load`,
        ...(equipmentDetails.length > 0 ? [`Equipment adds ${equipmentLoadKW}kW`] : []),
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
 * HOSPITAL SSOT ADAPTER
 *
 * Supports template-backed flow (hospital.v1.json) with:
 * - hospitalType: community | regional | academic | specialty
 * - operatingHours: limited | extended | 24_7
 * - Imaging equipment: MRI, CT, surgical suites, ICU beds
 * - Sterilization, lab, critical load fraction
 *
 * Base load via calculateHospitalPower (ASHRAE kW/bed), equipment loads additive.
 */
