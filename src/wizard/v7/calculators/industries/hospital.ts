import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower, calculateHospitalPower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const HOSPITAL_LOAD_V1_SSOT: CalculatorContract = {
  id: "hospital_load_v1",
  requiredInputs: ["bedCount"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // --- Core inputs (bridge curated config IDs → calculator field names) ---
    const bedCount = inputs.bedCount != null ? (Number(inputs.bedCount) || 200) : 200;
    // Curated config: facilityType (community-hospital/regional-medical/academic/specialty)
    // Calculator expects: hospitalType (community/regional/academic/specialty)
    const rawHospType = String(inputs.hospitalType || inputs.facilityType || "regional");
    const hospitalType = rawHospType.replace(/-hospital|-medical/g, "") as
      | "community"
      | "regional"
      | "academic"
      | "specialty";
    // Curated config: operatingRooms (count string like "1-5","6-10","11-20","20+")
    // Calculator expects: operatingHours — hospitals are 24/7 by default
    const operatingHours = (inputs.operatingHours as "limited" | "extended" | "24_7") || "24_7";

    assumptions.push(`Hospital: ${bedCount} beds, ${hospitalType}, ${operatingHours}`);

    // --- Bridge curated question IDs to equipment fields ---
    // operatingRooms → surgicalSuites (curated uses count categories)
    if (inputs.operatingRooms != null && inputs.surgicalSuites == null) {
      const orRaw = String(inputs.operatingRooms);
      const orMatch = orRaw.match(/(\d+)/);
      (inputs as Record<string, unknown>).surgicalSuites = orMatch ? parseInt(orMatch[1]) : 4;
    }
    // imagingEquipment → hasMRI / hasCT (curated is multi-select: "mri","ct","both","none")
    if (inputs.imagingEquipment != null) {
      const imgRaw = String(inputs.imagingEquipment).toLowerCase();
      if (inputs.hasMRI == null)
        (inputs as Record<string, unknown>).hasMRI = imgRaw.includes("mri") || imgRaw === "both";
      if (inputs.hasCT == null)
        (inputs as Record<string, unknown>).hasCT = imgRaw.includes("ct") || imgRaw === "both";
    }
    // criticalSystems → criticalLoadPct (curated: "life-safety","all-critical","partial","standard")
    if (inputs.criticalSystems != null && inputs.criticalLoadPct == null) {
      const csRaw = String(inputs.criticalSystems).toLowerCase();
      (inputs as Record<string, unknown>).criticalLoadPct =
        csRaw === "all-critical"
          ? 1.0
          : csRaw === "life-safety"
            ? 0.85
            : csRaw === "partial"
              ? 0.65
              : 0.5;
    }
    // dataCenter → hasLab (curated: yes/no for on-site data center/HIS)
    if (inputs.dataCenter != null && inputs.hasLab == null) {
      (inputs as Record<string, unknown>).hasLab =
        inputs.dataCenter === true || inputs.dataCenter === "yes";
    }
    // laundryOnSite → hasSterilization (curated: yes/no — hospitals with laundry usually have sterilization)
    if (inputs.laundryOnSite != null && inputs.hasSterilization == null) {
      (inputs as Record<string, unknown>).hasSterilization =
        inputs.laundryOnSite === true || inputs.laundryOnSite === "yes";
    }

    // 1. Base load via SSOT calculateHospitalPower (accepts hospitalType + operatingHours)
    const baseResult = calculateHospitalPower(bedCount, hospitalType, operatingHours);
    const basePowerKW = baseResult.powerMW * 1000;

    // 2. Additive equipment loads (ASHRAE healthcare standards)
    let equipmentLoadKW = 0;
    const equipmentDetails: string[] = [];

    // Surgical suites: ~40 kW each (lighting, equipment, HVAC)
    const surgicalSuites = Number(inputs.surgicalSuites) || 0;
    if (surgicalSuites > 0) {
      const surgicalPower = surgicalSuites * 40;
      equipmentLoadKW += surgicalPower;
      equipmentDetails.push(`${surgicalSuites} surgical suites @ 40kW`);
    }

    // MRI: ~100 kW each (magnet + cooling)
    const hasMRI = inputs.hasMRI === true || inputs.hasMRI === "true";
    const mriCount = Number(inputs.mriCount) || (hasMRI ? 1 : 0);
    if (mriCount > 0) {
      const mriPower = mriCount * 100;
      equipmentLoadKW += mriPower;
      equipmentDetails.push(`${mriCount} MRI @ 100kW`);
    }

    // CT: ~100 kW each
    const hasCT = inputs.hasCT === true || inputs.hasCT === "true";
    const ctCount = Number(inputs.ctCount) || (hasCT ? 1 : 0);
    if (ctCount > 0) {
      const ctPower = ctCount * 100;
      equipmentLoadKW += ctPower;
      equipmentDetails.push(`${ctCount} CT @ 100kW`);
    }

    // ICU beds: +2 kW each (monitors, ventilators, infusion)
    const icuBeds = Number(inputs.icuBeds) || 0;
    if (icuBeds > 0) {
      const icuPower = icuBeds * 2;
      equipmentLoadKW += icuPower;
      equipmentDetails.push(`${icuBeds} ICU beds @ 2kW`);
    }

    // Sterilization department: ~75 kW (autoclaves, washers)
    const hasSterilization = inputs.hasSterilization === true || inputs.hasSterilization === "true";
    if (hasSterilization) {
      equipmentLoadKW += 75;
      equipmentDetails.push("Central sterilization @ 75kW");
    }

    // Lab: ~50 kW (refrigeration, analyzers, centrifuges)
    const hasLab = inputs.hasLab === true || inputs.hasLab === "true";
    if (hasLab) {
      equipmentLoadKW += 50;
      equipmentDetails.push("Clinical lab @ 50kW");
    }

    if (equipmentDetails.length > 0) {
      assumptions.push(`Equipment: ${equipmentDetails.join(", ")}`);
    }

    // 3. Total peak
    const peakLoadKW = Math.round(basePowerKW + equipmentLoadKW);

    // 4. Contributor breakdown (percentages of total, not just base)
    // SSOT rule: HVAC + process/critical + IT should never smear equally
    let hvacPct = 0.35;
    let processPct = Math.min(0.3 + (equipmentLoadKW / peakLoadKW) * 0.5, 0.55); // process rises with equipment
    let itPct = 0.1;
    let lightingPct = 0.1;
    const controlsPct = 0.05;

    // Normalize: when processPct is high, total can exceed 1.0 (up to 1.15).
    // Redistribute so all percentages sum to exactly 1.0.
    const rawSum = hvacPct + processPct + itPct + lightingPct + controlsPct;
    if (rawSum > 1.0) {
      const normFactor = (1.0 - controlsPct) / (rawSum - controlsPct);
      hvacPct *= normFactor;
      processPct *= normFactor;
      itPct *= normFactor;
      lightingPct *= normFactor;
    }
    const otherPct = Math.max(0.0, 1.0 - hvacPct - processPct - itPct - lightingPct - controlsPct);

    const hvacKW = peakLoadKW * hvacPct;
    const processKW = peakLoadKW * processPct;
    const itLoadKW = peakLoadKW * itPct;
    const lightingKW = peakLoadKW * lightingPct;
    const controlsKW = peakLoadKW * controlsPct;
    const otherKW = peakLoadKW * otherPct;

    const kWContributorsTotalKW = hvacKW + processKW + itLoadKW + lightingKW + controlsKW + otherKW;

    // Duty cycle depends on operating hours
    const dutyCycleMap: Record<string, number> = {
      "24_7": 0.85,
      extended: 0.65,
      limited: 0.4,
    };
    const dutyCycle = dutyCycleMap[operatingHours] || 0.85;
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);

    // Critical load (NEC 517 / NFPA 99)
    const criticalLoadPct = inputs.criticalLoadPct != null ? Number(inputs.criticalLoadPct) : 0.85;

    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        process: processKW,
        hvac: hvacKW,
        lighting: lightingKW,
        controls: controlsKW,
        itLoad: itLoadKW,
        cooling: 0, // Included in HVAC for hospitals
        charging: 0,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        processPct: (processKW / peakLoadKW) * 100,
        hvacPct: (hvacKW / peakLoadKW) * 100,
        lightingPct: (lightingKW / peakLoadKW) * 100,
        controlsPct: (controlsKW / peakLoadKW) * 100,
        itLoadPct: (itLoadKW / peakLoadKW) * 100,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: (otherKW / peakLoadKW) * 100,
      },
      details: {
        hospital: {
          hospitalType,
          operatingHours,
          basePowerKW,
          equipmentLoadKW,
          medical: processKW * 0.6,
          surgical: processKW * 0.25,
          laundry: processKW * 0.15,
          criticalLoadPct,
          criticalLoadKW: Math.round(peakLoadKW * criticalLoadPct),
        },
      },
      notes: [
        `Hospital: ${bedCount} beds (${hospitalType}, ${operatingHours}) → peak ${peakLoadKW}kW`,
        `Critical: ${Math.round(criticalLoadPct * 100)}% = ${Math.round(peakLoadKW * criticalLoadPct)}kW (NEC 517)`,
        ...(equipmentDetails.length > 0
          ? [`Equipment adds ${equipmentLoadKW}kW: ${equipmentDetails.join(", ")}`]
          : []),
        `dutyCycle=${dutyCycle}`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay: Math.round(baseLoadKW * 24),
      assumptions,
      warnings,
      validation,
      raw: baseResult,
    };
  },
};

/**
 * WAREHOUSE SSOT ADAPTER
 *
 * CalcValidation v1 envelope with contributor breakdown.
 * SSOT: calculateUseCasePower("warehouse", { squareFootage }) → 2 W/sqft (CBECS)
 *
 * Contributor model:
 *   lighting (40%) - High bay LED, often dominant in warehouses
 *   hvac (15%) - Minimal in standard warehouse (high ceilings, dock doors)
 *   process (25%) - Material handling (forklifts, conveyors, dock levelers)
 *   controls (5%) - WMS, barcode scanners, security
 *   other (15%) - Dock doors, compactors, charging stations
 */
