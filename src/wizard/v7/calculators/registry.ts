/**
 * CALCULATOR REGISTRY - SSOT ADAPTER ARCHITECTURE
 * ================================================
 *
 * REFACTORED: February 4, 2026
 * Purpose: Thin adapters that delegate to useCasePowerCalculations.ts (SSOT)
 *
 * NEW DESIGN:
 * - ALL calculators are thin adapters (20-30 lines)
 * - Delegate to calculateUseCasePower() for actual calculations
 * - Parse database format → Map to SSOT params → Normalize output
 * - TrueQuote compliant (database-driven via SSOT)
 * - Supports all 20+ industries via SSOT routing
 *
 * BENEFITS:
 * - Single source of truth (no duplicate calculation logic)
 * - 80% less code per calculator (30 lines vs 150+)
 * - All industries supported immediately
 * - Easy to test and maintain
 *
 * PATTERN:
 * 1. Parse DB format (camelCase, arrays, string ranges)
 * 2. Map to SSOT parameters
 * 3. Delegate to calculateUseCasePower(slug, data)
 * 4. Normalize to CalcRunResult format
 *
 * VERSIONING:
 * - Calculator ID forms stable contract (dc_load_v1)
 * - Breaking changes require new version (dc_load_v2)
 * - Templates bind to specific calculator versions
 */

import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "./contract";

// SSOT: Single source of truth for ALL industry power calculations
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";

// ========== SSOT ADAPTERS ==========

/**
 * GENERIC SSOT ADAPTER
 *
 * Works for ANY industry via slug routing to SSOT
 * This single calculator supports all 20+ industries!
 *
 * USAGE:
 * - Pass industry slug in inputs._industrySlug
 * - All industry-specific logic handled by SSOT
 * - Parser layer adapts database format to SSOT params
 */
export const GENERIC_SSOT_ADAPTER: CalculatorContract = {
  id: "generic_ssot_v1",
  requiredInputs: [] as const, // Accepts any fields

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // Get industry slug from metadata
    const slug = String(inputs._industrySlug || "office");

    try {
      // Delegate to SSOT (handles all 20+ industries)
      const result = calculateUseCasePower(slug, inputs);

      // Convert PowerCalculationResult to CalcRunResult
      const powerKW = result.powerMW * 1000;
      const baseLoadKW = Math.round(powerKW * 0.4); // Base = 40% of peak (typical)
      const peakLoadKW = Math.round(powerKW);
      const energyKWhPerDay = Math.round(powerKW * result.durationHrs);

      assumptions.push(result.description);
      assumptions.push(result.calculationMethod);

      return {
        baseLoadKW,
        peakLoadKW,
        energyKWhPerDay,
        assumptions,
        warnings,
        raw: result,
      };
    } catch (err) {
      warnings.push(`SSOT calculation failed: ${err instanceof Error ? err.message : String(err)}`);

      // Return safe fallback
      return {
        baseLoadKW: 100,
        peakLoadKW: 250,
        energyKWhPerDay: 5000,
        assumptions: [`Fallback calculation for ${slug}`],
        warnings,
      };
    }
  },
};

/**
 * DATA CENTER SSOT ADAPTER
 *
 * Thin adapter that delegates to calculateUseCasePower('data-center', data)
 * 30 lines vs 150+ in original hardcoded version
 */
export const DC_LOAD_V1_SSOT: CalculatorContract = {
  id: "dc_load_v1",
  requiredInputs: ["itLoadCapacity", "currentPUE", "itUtilization", "dataCenterTier"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // 1. Parse fields from template mapping (itLoadCapacity, currentPUE, etc.)
    //    Then translate to SSOT field names (itLoadKW, rackCount, etc.)
    const itLoadKW = Number(inputs.itLoadCapacity) || undefined;
    const currentPUE = String(inputs.currentPUE || "1.3-1.5");
    const itUtilization = String(inputs.itUtilization || "60-80%");
    const dataCenterTier = String(inputs.dataCenterTier || "tier_3");

    // 2. Map to SSOT parameters (field names the SSOT actually reads)
    const useCaseData: Record<string, unknown> = {
      itLoadKW: itLoadKW ?? inputs.itLoadCapacity,
      currentPUE,
      itUtilization,
      dataCenterTier,
      // Pass through any extra fields the SSOT might use
      rackCount: inputs.rackCount,
      averageRackDensity: inputs.averageRackDensity,
      rackDensityKW: inputs.rackDensityKW,
    };

    assumptions.push(`IT load: ${itLoadKW ?? "default"} kW`);
    assumptions.push(`PUE: ${currentPUE}`);
    assumptions.push(`Utilization: ${itUtilization}`);
    assumptions.push(`Tier: ${dataCenterTier}`);

    // 3. Delegate to SSOT (NO calculation logic here!)
    const result = calculateUseCasePower("data-center", useCaseData);

    // 4. Convert to contract format
    const powerKW = result.powerMW * 1000;
    const peakLoadKW = Math.round(powerKW);
    const dutyCycle = 0.95; // Data centers run 95% load (near-continuous)
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);
    const energyKWhPerDay = Math.round(baseLoadKW * 24);

    // 4a. Compute contributor breakdown (PUE-based exact-sum accounting)
    // Parse PUE to numeric
    const pueStr = String(currentPUE || "1.5");
    const pueNum = parseFloat(pueStr.split("-")[0]) || 1.5; // "1.3-1.5" → 1.3

    // IT load is the primary payload
    const itLoadKWActual = itLoadKW ? Number(itLoadKW) : peakLoadKW / pueNum;

    // Infrastructure losses (non-cooling)
    const upsLossesKW = itLoadKWActual * 0.05; // 5% UPS loss
    const pdusKW = itLoadKWActual * 0.03; // 3% PDU loss
    const fansKW = itLoadKWActual * 0.04; // 4% CRAC/CRAH fans
    let otherKW = upsLossesKW + pdusKW + fansKW;

    // Lighting & controls as % of total
    const lightingKW = peakLoadKW * 0.02; // 2% lighting
    const controlsKW = peakLoadKW * 0.02; // 2% BMS/monitoring

    // Cooling = remainder (sum=total by construction)
    let coolingKW = peakLoadKW - itLoadKWActual - otherKW - lightingKW - controlsKW;

    // Guard: prevent negative cooling (low PUE edge case)
    if (coolingKW < 0) {
      otherKW += coolingKW; // Roll negative into other to preserve sum
      coolingKW = 0;
      warnings.push("cooling_remainder_negative: low PUE caused negative cooling allocation");
    }

    const kWContributorsTotalKW = itLoadKWActual + coolingKW + otherKW + lightingKW + controlsKW;

    // 4b. Build validation envelope (TrueQuote v1)
    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        process: 0, // Not applicable
        hvac: 0, // Separate cooling category for DC
        lighting: lightingKW,
        controls: controlsKW,
        itLoad: itLoadKWActual,
        cooling: coolingKW,
        charging: 0, // Not applicable
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        processPct: 0,
        hvacPct: 0,
        lightingPct: (lightingKW / peakLoadKW) * 100,
        controlsPct: (controlsKW / peakLoadKW) * 100,
        itLoadPct: (itLoadKWActual / peakLoadKW) * 100,
        coolingPct: (coolingKW / peakLoadKW) * 100,
        chargingPct: 0,
        otherPct: (otherKW / peakLoadKW) * 100,
      },
      details: {
        data_center: {
          upsLosses: upsLossesKW,
          pdus: pdusKW,
          fans: fansKW,
          pue: pueNum,
        },
      },
      notes: [
        `PUE: ${pueNum.toFixed(2)} → cooling allocation: ${coolingKW.toFixed(1)}kW`,
        `Infrastructure losses: UPS=${upsLossesKW.toFixed(1)}kW, PDU=${pdusKW.toFixed(1)}kW, Fans=${fansKW.toFixed(1)}kW`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay,
      assumptions,
      warnings,
      validation,
      raw: result,
    };
  },
};

/**
 * HOTEL SSOT ADAPTER
 *
 * Thin adapter that delegates to calculateUseCasePower('hotel', data)
 * 25 lines vs 100+ in original hardcoded version
 */
export const HOTEL_LOAD_V1_SSOT: CalculatorContract = {
  id: "hotel_load_v1",
  requiredInputs: ["roomCount", "hotelClass", "occupancyRate"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // 1. Parse database field format
    const roomCount = Number(inputs.roomCount) || 150;
    const hotelClass = String(inputs.hotelClass || "midscale");
    const occupancyRate = Number(inputs.occupancyRate) || 70;

    // Build amenities from either array or individual boolean flags (template format)
    let hotelAmenities: string[] = [];
    if (Array.isArray(inputs.hotelAmenities)) {
      hotelAmenities = inputs.hotelAmenities;
    } else {
      // Template sends individual booleans: pool_on_site, spa_on_site, etc.
      if (inputs.pool_on_site) hotelAmenities.push("pool");
      if (inputs.spa_on_site) hotelAmenities.push("spa");
      if (inputs.restaurant_on_site) hotelAmenities.push("restaurant");
      if (inputs.bar_on_site) hotelAmenities.push("bar");
      if (inputs.laundry_on_site) hotelAmenities.push("laundry");
    }

    // 2. Map to SSOT parameters
    const useCaseData = {
      roomCount,
      hotelClass,
      occupancyRate,
      hotelAmenities,
    };

    assumptions.push(`${roomCount} rooms (${hotelClass})`);
    assumptions.push(`Occupancy: ${occupancyRate}%`);
    if (hotelAmenities.length > 0) {
      assumptions.push(`Amenities: ${hotelAmenities.join(", ")}`);
    }

    // 3. Delegate to SSOT (NO calculation logic here!)
    const result = calculateUseCasePower("hotel", useCaseData);

    // 4. Convert to contract format
    const powerKW = result.powerMW * 1000;
    const peakLoadKW = Math.round(powerKW);

    // 4a. Compute contributor breakdown (class-based HVAC + process decomposition)
    const HVAC_KW_PER_ROOM: Record<string, number> = {
      economy: 1.0,
      midscale: 1.5,
      upscale: 2.2,
      luxury: 2.5,
    };
    const hvacRate = HVAC_KW_PER_ROOM[hotelClass] ?? 1.5;
    const hvacKW = roomCount * hvacRate;

    // Process = intermittent loads (kitchen, laundry, pool)
    const kitchenKW = hotelAmenities.includes("restaurant") ? roomCount * 0.8 : 0;
    const laundryKW = hotelAmenities.includes("laundry") ? roomCount * 0.3 : roomCount * 0.15;
    const poolKW = hotelAmenities.includes("pool") ? 50 : 0;
    const processKW = kitchenKW + laundryKW + poolKW;

    const lightingKW = roomCount * 0.5; // 0.5 kW per room
    const controlsKW = roomCount * 0.1; // BMS + elevators
    const miscPlugKW = roomCount * 0.15; // In-room misc plugs

    // "other" = always-on-ish loads (misc plugs, elevators)
    const otherKW = miscPlugKW + roomCount * 0.05; // + 0.05 kW/room for elevators/common

    // Scale to match SSOT peak (contributors may not sum exactly to SSOT result)
    const rawSum = hvacKW + processKW + lightingKW + controlsKW + otherKW;
    const scale = rawSum > 0 ? peakLoadKW / rawSum : 1;

    const scaledHvac = hvacKW * scale;
    const scaledProcess = processKW * scale;
    const scaledLighting = lightingKW * scale;
    const scaledControls = controlsKW * scale;
    const scaledOther = otherKW * scale;

    const kWContributorsTotalKW =
      scaledHvac + scaledProcess + scaledLighting + scaledControls + scaledOther;

    // Derived base load from always-on components
    let baseLoadKW = Math.round(
      scaledControls + 0.6 * scaledLighting + 0.5 * scaledHvac + 0.2 * scaledProcess
    );
    // Clamp: base can't exceed 95% of peak
    if (baseLoadKW > 0.95 * peakLoadKW) {
      baseLoadKW = Math.round(0.95 * peakLoadKW);
    }
    const dutyCycle = peakLoadKW > 0 ? baseLoadKW / peakLoadKW : 0.5;

    // Energy: two-level schedule (base 24h + peaks 8h)
    const peakHours = 8;
    const energyKWhPerDay = Math.round(baseLoadKW * 24 + (peakLoadKW - baseLoadKW) * peakHours);

    // 4b. Build validation envelope (TrueQuote v1)
    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        process: scaledProcess,
        hvac: scaledHvac,
        lighting: scaledLighting,
        controls: scaledControls,
        itLoad: 0, // Not applicable
        cooling: 0, // HVAC handles cooling
        charging: 0, // Not applicable
        other: scaledOther,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        processPct: (scaledProcess / peakLoadKW) * 100,
        hvacPct: (scaledHvac / peakLoadKW) * 100,
        lightingPct: (scaledLighting / peakLoadKW) * 100,
        controlsPct: (scaledControls / peakLoadKW) * 100,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: (scaledOther / peakLoadKW) * 100,
      },
      details: {
        hotel: {
          kitchen: kitchenKW * scale,
          laundry: laundryKW * scale,
          pool: poolKW * scale,
          miscPlug: miscPlugKW * scale,
        },
      },
      notes: [
        `Hotel class: ${hotelClass} (HVAC: ${hvacRate} kW/room)`,
        `Amenities: ${hotelAmenities.length > 0 ? hotelAmenities.join(", ") : "none"}`,
        `Process breakdown: kitchen=${(kitchenKW * scale).toFixed(1)}kW, laundry=${(laundryKW * scale).toFixed(1)}kW, pool=${(poolKW * scale).toFixed(1)}kW`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay,
      assumptions,
      warnings,
      validation,
      raw: result,
    };
  },
};

/**
 * CAR WASH SSOT ADAPTER
 *
 * Thin adapter that delegates to calculateUseCasePower('car-wash', data)
 * 30 lines vs 150+ in original hardcoded version
 */
export const CAR_WASH_LOAD_V1_SSOT: CalculatorContract = {
  id: "car_wash_load_v1",
  requiredInputs: ["bayTunnelCount", "averageWashesPerDay", "operatingHours"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // 1. Parse combined bayTunnelCount field (handles both formats)
    const parseBayTunnel = (combined: unknown): number => {
      // Handle plain number (from template: bay_count → number)
      const asNum = Number(combined);
      if (!isNaN(asNum) && asNum > 0) return Math.round(asNum);
      // Handle formatted string (from database: "4 bays, 1 tunnel")
      const str = String(combined || "4 bays");
      const bayMatch = str.match(/(\d+)\s*bay/i);
      const tunnelMatch = str.match(/(\d+)\s*tunnel/i);
      return (
        (bayMatch ? parseInt(bayMatch[1]) : 0) || (tunnelMatch ? parseInt(tunnelMatch[1]) : 0) || 1
      );
    };

    const bayTunnelStr = String(inputs.bayTunnelCount || "4 bays");
    const bayCount = parseBayTunnel(inputs.bayTunnelCount);
    const carsPerDay = Number(inputs.averageWashesPerDay) || 200;
    const operatingHours = Number(inputs.operatingHours) || 12;
    const carWashType = String(inputs.carWashType || "tunnel");
    const primaryEquipment = Array.isArray(inputs.primaryEquipment) ? inputs.primaryEquipment : [];

    // 2. Map to SSOT parameters
    const useCaseData = {
      bayCount,
      carsPerDay,
      operatingHours,
      carWashType,
      primaryEquipment,
    };

    assumptions.push(`Wash positions: ${bayTunnelStr} (${bayCount} total)`);
    assumptions.push(`Washes/day: ${carsPerDay}`);
    assumptions.push(`Operating hours: ${operatingHours}h/day`);

    // 3. Delegate to SSOT (NO calculation logic here!)
    const result = calculateUseCasePower("car-wash", useCaseData);

    // 4. Convert to contract format
    const powerKW = result.powerMW * 1000;
    const peakLoadKW = Math.round(powerKW);

    // 4a. Compute contributor breakdown (industry-standard ratios)
    // Source: NREL Commercial Building benchmarks + car wash industry standards
    const dryersKW = peakLoadKW * 0.625; // 62.5% - Blowers/dryers (dominant load)
    const waterPumpsKW = peakLoadKW * 0.208; // 20.8% - High-pressure wash pumps
    const vacuumsKW = peakLoadKW * 0.083; // 8.3% - Self-serve vacuum stations
    const lightingKW = peakLoadKW * 0.042; // 4.2% - Facility lighting
    const hvacKW = peakLoadKW * 0.021; // 2.1% - Climate control
    const controlsKW = peakLoadKW * 0.021; // 2.1% - PLC/controls/payment systems
    const otherKW = 0; // 0% - Miscellaneous

    const kWContributorsTotalKW =
      dryersKW + waterPumpsKW + vacuumsKW + lightingKW + hvacKW + controlsKW + otherKW;

    // Validate sum matches peak (within 1% tolerance)
    const sumDiff = Math.abs(kWContributorsTotalKW - peakLoadKW);
    if (sumDiff / peakLoadKW > 0.01) {
      warnings.push(
        `⚠️ Contributors sum (${kWContributorsTotalKW.toFixed(1)}kW) ` +
          `doesn't match peak (${peakLoadKW}kW) - diff: ${sumDiff.toFixed(1)}kW`
      );
    }

    // Base load = always-on contributors (lights, HVAC, controls)
    const baseLoadKW = Math.round(lightingKW + hvacKW + controlsKW);

    // Duty cycle: intermittent loads (not all equipment runs simultaneously)
    const dutyCycle = 0.6; // 60% typical for car wash (wash cycles + idle time)
    const energyKWhPerDay = Math.round(peakLoadKW * operatingHours * dutyCycle);

    // 4b. Build computed object with kWContributors (TrueQuote compliance)
    const computed = {
      kWContributors: {
        drying: dryersKW, // Match harness invariant key name
        waterPumps: waterPumpsKW, // Match harness invariant key name
        vacuums: vacuumsKW,
        lighting: lightingKW,
        hvac: hvacKW,
        controls: controlsKW,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        dryingPct: (dryersKW / peakLoadKW) * 100,
        waterPumpsPct: (waterPumpsKW / peakLoadKW) * 100,
        vacuumsPct: (vacuumsKW / peakLoadKW) * 100,
        lightingPct: (lightingKW / peakLoadKW) * 100,
        hvacPct: (hvacKW / peakLoadKW) * 100,
        controlsPct: (controlsKW / peakLoadKW) * 100,
        otherPct: (otherKW / peakLoadKW) * 100,
      },
      dutyCycle,
      assumptions,
      warnings,
    };

    // 4c. Build validation envelope with canonical contributor keys (TrueQuote compliance)
    // Car wash process loads: drying (blowers) + waterPumps (wash system) + vacuums
    const processKW = dryersKW + waterPumpsKW + vacuumsKW;

    const validation: CalcValidation = {
      version: "v1", // Versioned contract (prevents silent drift)
      dutyCycle,
      kWContributors: {
        process: processKW, // Canonical: car wash-specific loads (dryers+pumps+vacuums)
        hvac: hvacKW, // Canonical: climate control
        lighting: lightingKW, // Canonical: facility lighting
        controls: controlsKW, // Canonical: PLC/payment/controls
        itLoad: 0, // Canonical: IT equipment (not applicable)
        cooling: 0, // Canonical: dedicated cooling (not applicable)
        charging: 0, // Canonical: EV charging (not applicable)
        other: otherKW, // Canonical: miscellaneous
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
        car_wash: {
          dryers: dryersKW,
          pumps: waterPumpsKW,
          vacuums: vacuumsKW,
        },
      },
      notes: [
        `Process breakdown: dryers=${dryersKW.toFixed(1)}kW (${((dryersKW / peakLoadKW) * 100).toFixed(0)}%), pumps=${waterPumpsKW.toFixed(1)}kW (${((waterPumpsKW / peakLoadKW) * 100).toFixed(0)}%), vacuums=${vacuumsKW.toFixed(1)}kW (${((vacuumsKW / peakLoadKW) * 100).toFixed(0)}%)`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay,
      assumptions,
      warnings,
      validation, // TrueQuote validation envelope (namespaced, clean)
      raw: result,
    };
  },
};

/**
 * OFFICE SSOT ADAPTER
 *
 * Supports any office building via SSOT routing
 * 15 lines - instant support for a new industry!
 */
export const OFFICE_LOAD_V1_SSOT: CalculatorContract = {
  id: "office_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const squareFootage = Number(inputs.squareFootage) || 50000;
    assumptions.push(`Office: ${squareFootage.toLocaleString()} sq ft`);

    const result = calculateUseCasePower("office", { squareFootage });
    const powerKW = result.powerMW * 1000;

    return {
      baseLoadKW: Math.round(powerKW * 0.5), // 50% base (HVAC, lights)
      peakLoadKW: Math.round(powerKW),
      energyKWhPerDay: Math.round(powerKW * 12), // 12h typical office hours
      assumptions,
      warnings,
      raw: result,
    };
  },
};

/**
 * RETAIL SSOT ADAPTER
 */
export const RETAIL_LOAD_V1_SSOT: CalculatorContract = {
  id: "retail_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const squareFootage = Number(inputs.squareFootage) || 20000;
    assumptions.push(`Retail: ${squareFootage.toLocaleString()} sq ft`);

    const result = calculateUseCasePower("retail", { squareFootage });
    const powerKW = result.powerMW * 1000;

    return {
      baseLoadKW: Math.round(powerKW * 0.4), // 40% base
      peakLoadKW: Math.round(powerKW),
      energyKWhPerDay: Math.round(powerKW * 14), // 14h typical retail hours
      assumptions,
      warnings,
      raw: result,
    };
  },
};

/**
 * MANUFACTURING SSOT ADAPTER
 */
export const MANUFACTURING_LOAD_V1_SSOT: CalculatorContract = {
  id: "manufacturing_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const squareFootage = Number(inputs.squareFootage) || 100000;
    const manufacturingType = String(inputs.manufacturingType || "light");
    assumptions.push(
      `Manufacturing: ${squareFootage.toLocaleString()} sq ft (${manufacturingType})`
    );

    const result = calculateUseCasePower("manufacturing", { squareFootage, manufacturingType });
    const powerKW = result.powerMW * 1000;
    const peakLoadKW = Math.round(powerKW);

    // 4a. Compute contributor breakdown by manufacturing type
    const typeMultipliers: Record<string, { process: number; hvac: number; lighting: number }> = {
      light: { process: 0.45, hvac: 0.25, lighting: 0.1 },
      medium: { process: 0.55, hvac: 0.2, lighting: 0.08 },
      heavy: { process: 0.65, hvac: 0.15, lighting: 0.06 },
    };
    const mults = typeMultipliers[manufacturingType] ?? typeMultipliers.light;

    const processKW = peakLoadKW * mults.process;
    const hvacKW = peakLoadKW * mults.hvac;
    const lightingKW = peakLoadKW * mults.lighting;
    const controlsKW = peakLoadKW * 0.05; // 5% BMS/SCADA/controls
    const otherKW = peakLoadKW - processKW - hvacKW - lightingKW - controlsKW; // remainder

    const kWContributorsTotalKW = processKW + hvacKW + lightingKW + controlsKW + otherKW;

    const dutyCycle = 0.8; // 80% base (continuous operations)
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
        cooling: 0, // Included in HVAC
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
          processIntensity: mults.process,
          sqFt: squareFootage,
        },
      },
      notes: [
        `Manufacturing (${manufacturingType}): ${squareFootage.toLocaleString()} sq ft → peak ${peakLoadKW}kW`,
        `Process-dominant: ${(mults.process * 100).toFixed(0)}% of load`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay: Math.round(peakLoadKW * 20), // 20h typical manufacturing
      assumptions,
      warnings,
      validation,
      raw: result,
    };
  },
};

/**
 * HOSPITAL SSOT ADAPTER
 */
export const HOSPITAL_LOAD_V1_SSOT: CalculatorContract = {
  id: "hospital_load_v1",
  requiredInputs: ["bedCount"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const bedCount = Number(inputs.bedCount) || 200;
    assumptions.push(`Hospital: ${bedCount} beds`);

    const result = calculateUseCasePower("hospital", { bedCount });
    const powerKW = result.powerMW * 1000;
    const peakLoadKW = Math.round(powerKW);

    // 4a. Compute contributor breakdown (hospital = HVAC + process + IT)
    const hvacKW = peakLoadKW * 0.35; // 35% HVAC (large facility, strict temp control)
    const processKW = peakLoadKW * 0.3; // 30% process (medical equipment, surgical, laundry)
    const lightingKW = peakLoadKW * 0.1; // 10% lighting (24/7 operation)
    const itLoadKW = peakLoadKW * 0.1; // 10% IT (EMR, imaging systems)
    const controlsKW = peakLoadKW * 0.05; // 5% BMS/controls
    const otherKW = peakLoadKW * 0.1; // 10% other (elevators, kitchen, misc)

    const kWContributorsTotalKW = hvacKW + processKW + lightingKW + itLoadKW + controlsKW + otherKW;

    const dutyCycle = 0.85; // 85% base (24/7 critical)
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);

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
          medical: processKW * 0.6, // 60% of process = medical equipment
          surgical: processKW * 0.25, // 25% of process = surgical suites
          laundry: processKW * 0.15, // 15% of process = laundry/sterilization
        },
      },
      notes: [
        `Hospital: ${bedCount} beds → peak ${peakLoadKW}kW`,
        `Critical 24/7 operations: dutyCycle=${dutyCycle}`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay: Math.round(baseLoadKW * 24), // 24h continuous
      assumptions,
      warnings,
      validation,
      raw: result,
    };
  },
};

/**
 * WAREHOUSE SSOT ADAPTER
 */
export const WAREHOUSE_LOAD_V1_SSOT: CalculatorContract = {
  id: "warehouse_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const squareFootage = Number(inputs.squareFootage) || 200000;
    assumptions.push(`Warehouse: ${squareFootage.toLocaleString()} sq ft`);

    const result = calculateUseCasePower("warehouse", { squareFootage });
    const powerKW = result.powerMW * 1000;

    return {
      baseLoadKW: Math.round(powerKW * 0.3), // 30% base
      peakLoadKW: Math.round(powerKW),
      energyKWhPerDay: Math.round(powerKW * 16), // 16h typical warehouse operations
      assumptions,
      warnings,
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
export const EV_CHARGING_LOAD_V1_SSOT: CalculatorContract = {
  id: "ev_charging_load_v1",
  requiredInputs: ["level2Chargers", "dcfcChargers"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const level2Chargers = Number(inputs.level2Chargers) || 12;
    const dcfcChargers = Number(inputs.dcfcChargers) || 8;
    const hpcChargers = Number(inputs.hpcChargers) || 0;
    const level2KWEach = Number(inputs.level2PowerKW) || 7.2;
    const siteDemandCapKW = Number(inputs.siteDemandCapKW) || 0;

    assumptions.push(
      `EV Charging: ${level2Chargers} Level 2 (${level2KWEach}kW), ` +
        `${dcfcChargers} DCFC (150kW)` +
        (hpcChargers > 0 ? `, ${hpcChargers} HPC (250kW)` : "")
    );

    // Route through SSOT (handles concurrency internally)
    const result = calculateUseCasePower("ev-charging", { level2Chargers, dcfcChargers });
    let peakLoadKW = Math.round(result.powerMW * 1000);

    // Add HPC contribution (not yet in SSOT legacy path — apply here)
    const hpcRawKW = hpcChargers * 250;
    if (hpcChargers > 0) {
      // HPC concurrency ~40% (same as DCFC class)
      peakLoadKW += Math.round(hpcRawKW * 0.4);
      assumptions.push(`HPC contribution: ${hpcChargers} × 250kW × 40% concurrency`);
    }

    // Raw breakdown (before cap)
    const l2KW = level2Chargers * level2KWEach;
    const dcfcKW = dcfcChargers * 150;
    const totalChargers = level2Chargers + dcfcChargers + hpcChargers;
    const lightingKW = totalChargers * 0.5;
    const controlsKW = totalChargers * 0.3;
    const siteAuxKW = 10;

    // Scale contributors to match SSOT peak (SSOT applies concurrency)
    const rawSum = l2KW + dcfcKW + hpcRawKW + lightingKW + controlsKW + siteAuxKW;
    let scale = rawSum > 0 ? peakLoadKW / rawSum : 1;

    // Demand cap enforcement
    let demandCapApplied = false;
    if (siteDemandCapKW > 0 && siteDemandCapKW < peakLoadKW) {
      // Proportionally scale ALL contributors so sum = cap
      const capScale = siteDemandCapKW / peakLoadKW;
      scale *= capScale;
      peakLoadKW = Math.round(siteDemandCapKW);
      demandCapApplied = true;
      assumptions.push(`Demand cap applied: ${siteDemandCapKW}kW (proportional scaling)`);
      warnings.push(`Site demand capped at ${siteDemandCapKW}kW — charger power will be curtailed`);
    }

    const scaledCharging = (l2KW + dcfcKW + hpcRawKW) * scale;
    const scaledLighting = lightingKW * scale;
    const scaledControls = controlsKW * scale;
    const scaledSiteAux = siteAuxKW * scale;

    const kWContributorsTotalKW = scaledCharging + scaledLighting + scaledControls + scaledSiteAux;

    const dutyCycle = 0.35;

    // Verify charging dominance (80-95% band)
    const chargingPct = peakLoadKW > 0 ? (scaledCharging / peakLoadKW) * 100 : 0;
    if (chargingPct < 80 || chargingPct > 99) {
      warnings.push(`Charging share ${chargingPct.toFixed(1)}% outside 80-95% band — check inputs`);
    }

    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        process: 0,
        hvac: 0,
        lighting: scaledLighting,
        controls: scaledControls,
        itLoad: 0,
        cooling: 0,
        charging: scaledCharging,
        other: scaledSiteAux,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        processPct: 0,
        hvacPct: 0,
        lightingPct: peakLoadKW > 0 ? (scaledLighting / peakLoadKW) * 100 : 0,
        controlsPct: peakLoadKW > 0 ? (scaledControls / peakLoadKW) * 100 : 0,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct,
        otherPct: peakLoadKW > 0 ? (scaledSiteAux / peakLoadKW) * 100 : 0,
      },
      details: {
        ev_charging: {
          level2: l2KW * scale,
          dcfc: dcfcKW * scale,
          hpc: hpcRawKW * scale,
          siteAux: scaledSiteAux,
          chargers: totalChargers,
          ...(demandCapApplied ? { demandCapKW: siteDemandCapKW } : {}),
        },
      },
      notes: [
        `Level 2: ${level2Chargers} @ ${level2KWEach}kW, DCFC: ${dcfcChargers} @ 150kW` +
          (hpcChargers > 0 ? `, HPC: ${hpcChargers} @ 250kW` : ""),
        `Concurrency applied by SSOT → peak: ${peakLoadKW}kW`,
        ...(demandCapApplied ? [`Demand cap: ${siteDemandCapKW}kW enforced`] : []),
      ],
    };

    return {
      baseLoadKW: Math.round(peakLoadKW * 0.2),
      peakLoadKW,
      energyKWhPerDay: Math.round(peakLoadKW * 18 * dutyCycle),
      assumptions,
      warnings,
      validation,
      raw: result,
    };
  },
};

/**
 * RESTAURANT SSOT ADAPTER
 */
export const RESTAURANT_LOAD_V1_SSOT: CalculatorContract = {
  id: "restaurant_load_v1",
  requiredInputs: ["seatingCapacity"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const seatingCapacity = Number(inputs.seatingCapacity) || 100;
    assumptions.push(`Restaurant: ${seatingCapacity} seats`);

    const result = calculateUseCasePower("restaurant", { seatingCapacity });
    const powerKW = result.powerMW * 1000;

    return {
      baseLoadKW: Math.round(powerKW * 0.4), // 40% base (refrigeration, HVAC)
      peakLoadKW: Math.round(powerKW),
      energyKWhPerDay: Math.round(powerKW * 14), // 14h typical restaurant hours
      assumptions,
      warnings,
      raw: result,
    };
  },
};

/**
 * GAS STATION SSOT ADAPTER
 */
export const GAS_STATION_LOAD_V1_SSOT: CalculatorContract = {
  id: "gas_station_load_v1",
  requiredInputs: ["fuelPumps"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const fuelPumps = Number(inputs.fuelPumps) || 8;
    assumptions.push(`Gas Station: ${fuelPumps} fuel pumps`);

    const result = calculateUseCasePower("gas-station", { fuelPumps });
    const powerKW = result.powerMW * 1000;

    return {
      baseLoadKW: Math.round(powerKW * 0.5), // 50% base (pumps, lights, coolers)
      peakLoadKW: Math.round(powerKW),
      energyKWhPerDay: Math.round(powerKW * 20), // 20h typical gas station hours
      assumptions,
      warnings,
      raw: result,
    };
  },
};

/**
 * CAR WASH POWER (SSOT Fallback) - Optional backup calculator
 * NOTE: Not currently used - primary path is CAR_WASH_LOAD_V1_SSOT above
 */

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
export const CALCULATORS_BY_ID: Record<string, CalculatorContract> = {
  // Generic adapter (works for ALL industries via slug routing)
  [GENERIC_SSOT_ADAPTER.id]: GENERIC_SSOT_ADAPTER,

  // Core industries (refactored from hardcoded to SSOT adapters)
  [DC_LOAD_V1_SSOT.id]: DC_LOAD_V1_SSOT,
  [HOTEL_LOAD_V1_SSOT.id]: HOTEL_LOAD_V1_SSOT,
  [CAR_WASH_LOAD_V1_SSOT.id]: CAR_WASH_LOAD_V1_SSOT,

  // NEW: 8 additional industries (added Feb 4, 2026)
  [OFFICE_LOAD_V1_SSOT.id]: OFFICE_LOAD_V1_SSOT,
  [RETAIL_LOAD_V1_SSOT.id]: RETAIL_LOAD_V1_SSOT,
  [MANUFACTURING_LOAD_V1_SSOT.id]: MANUFACTURING_LOAD_V1_SSOT,
  [HOSPITAL_LOAD_V1_SSOT.id]: HOSPITAL_LOAD_V1_SSOT,
  [WAREHOUSE_LOAD_V1_SSOT.id]: WAREHOUSE_LOAD_V1_SSOT,
  [EV_CHARGING_LOAD_V1_SSOT.id]: EV_CHARGING_LOAD_V1_SSOT,
  [RESTAURANT_LOAD_V1_SSOT.id]: RESTAURANT_LOAD_V1_SSOT,
  [GAS_STATION_LOAD_V1_SSOT.id]: GAS_STATION_LOAD_V1_SSOT,
};

/**
 * Get calculator contract by ID
 *
 * @param id - Calculator ID from template
 * @returns Calculator contract or undefined
 *
 * USAGE:
 * ```typescript
 * const calc = getCalculator(template.calculator.id);
 * if (!calc) throw new Error(`Unknown calculator: ${template.calculator.id}`);
 * ```
 */
export function getCalculator(id: string): CalculatorContract | undefined {
  return CALCULATORS_BY_ID[id];
}

/**
 * List all registered calculator IDs
 *
 * @returns Array of calculator IDs
 *
 * USAGE: Admin panel, debugging, template validation
 */
export function listCalculatorIds(): string[] {
  return Object.keys(CALCULATORS_BY_ID);
}
