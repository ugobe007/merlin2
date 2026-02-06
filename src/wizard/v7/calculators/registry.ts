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
import { calculateUseCasePower, calculateHospitalPower } from "@/services/useCasePowerCalculations";

// Centralized field-name resolver (Phase 2A: prevents silent default fallback)
import { buildSSOTInput } from "./ssotInputAliases";

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
    const _computed = {
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
 * Template-backed (office.v1.json) with additive loads.
 * SSOT: calculateUseCasePower("office", ...) → 6 W/sqft base (ASHRAE 90.1)
 *
 * Base power from SSOT (sqft-driven), then enriched with:
 * - Server room IT load (additive)
 * - Elevator demand (additive)
 * - EV charger load (additive)
 * - Lighting type modifier (LED reduces lighting share)
 * - Office type modifier (tech offices have higher plug loads)
 *
 * Contributor model (CBECS 2018 commercial office):
 *   hvac (40% base) - Primary load, affected by HVAC age
 *   lighting (25% base, reduced if LED) - Overhead + task
 *   process (20% base, elevated for tech) - Plug loads (computers, monitors)
 *   itLoad - Server room (additive, not percentage-based)
 *   controls (5%) - BMS, security, fire panel
 *   charging - EV chargers (additive)
 *   other - Elevators + common areas (additive + remainder)
 */
export const OFFICE_LOAD_V1_SSOT: CalculatorContract = {
  id: "office_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // --- Core input ---
    const squareFootage = Number(inputs.squareFootage) || 50000;
    if (!inputs.squareFootage) {
      assumptions.push("Default: 50,000 sq ft (no user input)");
    }

    // --- Template-enriched inputs (optional, backward-compatible) ---
    const officeType = String(inputs.officeType || "corporate");
    const _floorCount = Number(inputs.floorCount) || 0;
    const lightingType = String(inputs.lightingType || "");
    const hasServerRoom = inputs.hasServerRoom === true || inputs.hasServerRoom === "true";
    const serverRoomKW = hasServerRoom ? Number(inputs.serverRoomKW) || 20 : 0;
    const elevatorCount = Number(inputs.elevatorCount) || 0;
    const evChargersCount = Number(inputs.evChargersCount) || 0;
    const evChargerPowerKW = Number(inputs.evChargerPowerKW) || 7.2;
    const hvacAgeYears = Number(inputs.hvacAgeYears) || 0;

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

    // Normalize base percentages so they sum to basePowerKW contribution
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
export const RETAIL_LOAD_V1_SSOT: CalculatorContract = {
  id: "retail_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const squareFootage = Number(inputs.squareFootage) || 20000;
    if (!inputs.squareFootage) {
      assumptions.push("Default: 20,000 sq ft (no user input)");
    }
    assumptions.push(`Retail: ${squareFootage.toLocaleString()} sq ft @ 8 W/sqft (CBECS 2018)`);

    const result = calculateUseCasePower("retail", buildSSOTInput("retail", { squareFootage }));
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // Contributor breakdown (CBECS 2018 retail)
    const lightingKW = peakLoadKW * 0.35;
    const hvacKW = peakLoadKW * 0.3;
    const processKW = peakLoadKW * 0.15; // POS, coolers, display electronics
    const controlsKW = peakLoadKW * 0.05;
    const otherKW = peakLoadKW * 0.15; // signage, escalators, loading

    const kWContributorsTotalKW = lightingKW + hvacKW + processKW + controlsKW + otherKW;

    // Retail hours: ~14h active, base load ~40% (security lighting, some HVAC)
    const dutyCycle = 0.45;
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
        hvacPct: 30,
        lightingPct: 35,
        processPct: 15,
        controlsPct: 5,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: 15,
      },
      details: {
        retail: {
          sqFt: squareFootage,
          wattsPerSqFt: 8.0,
        },
      },
      notes: [
        `Retail: ${squareFootage.toLocaleString()} sq ft → peak ${peakLoadKW}kW`,
        `Lighting-dominant: 35% of load (CBECS 2018 retail)`,
        `Duty cycle: ${dutyCycle} (14h active, some overnight)`,
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
 * MANUFACTURING SSOT ADAPTER
 *
 * Supports template-backed flow (manufacturing.v1.json) with:
 * - manufacturingType: light | medium | heavy | electronics | food
 * - shiftPattern: 1-shift | 2-shift | 3-shift (modulates dutyCycle)
 * - Equipment loads: compressed air, furnaces, CNC machines, refrigeration
 * - Environment: clean room, process cooling
 *
 * SSOT rules: process share scales with type+shifts, dutyCycle reflects shiftPattern
 */
export const MANUFACTURING_LOAD_V1_SSOT: CalculatorContract = {
  id: "manufacturing_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // --- Core inputs ---
    const squareFootage = Number(inputs.squareFootage) || 100000;
    const manufacturingType = String(inputs.manufacturingType || "light");
    const shiftPattern = String(inputs.shiftPattern || "1-shift");

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
export const HOSPITAL_LOAD_V1_SSOT: CalculatorContract = {
  id: "hospital_load_v1",
  requiredInputs: ["bedCount"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // --- Core inputs ---
    const bedCount = Number(inputs.bedCount) || 200;
    const hospitalType =
      (inputs.hospitalType as "community" | "regional" | "academic" | "specialty") || "regional";
    const operatingHours = (inputs.operatingHours as "limited" | "extended" | "24_7") || "24_7";

    assumptions.push(`Hospital: ${bedCount} beds, ${hospitalType}, ${operatingHours}`);

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
    const hvacPct = 0.35;
    const processPct = Math.min(0.3 + (equipmentLoadKW / peakLoadKW) * 0.5, 0.55); // process rises with equipment
    const itPct = 0.1;
    const lightingPct = 0.1;
    const controlsPct = 0.05;
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
    const criticalLoadPct = Number(inputs.criticalLoadPct) || 0.85;

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
export const WAREHOUSE_LOAD_V1_SSOT: CalculatorContract = {
  id: "warehouse_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const squareFootage = Number(inputs.squareFootage) || 200000;
    const isColdStorage = inputs.isColdStorage === true || inputs.isColdStorage === "true";

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
 *
 * CalcValidation v1 envelope with contributor breakdown.
 * NOTE: SSOT calculateUseCasePower("restaurant") has no dedicated handler,
 * so we compute directly from seating capacity using industry standards.
 *
 * Industry benchmark: 30-50 W per seat (full-service), 15-25 W (fast food)
 * Source: Energy Star Portfolio Manager, CBECS 2018 food service
 *
 * Contributor model:
 *   process (45%) - Kitchen cooking (ranges, fryers, grills, ovens)
 *   hvac (20%) - Kitchen exhaust makeup air is significant
 *   cooling (15%) - Walk-in coolers, reach-in refrigeration (mapped to cooling)
 *   lighting (10%) - Dining room + kitchen + exterior
 *   controls (5%) - POS, hood controls, fire suppression
 *   other (5%) - Dishwashing, hot water, misc
 */
export const RESTAURANT_LOAD_V1_SSOT: CalculatorContract = {
  id: "restaurant_load_v1",
  requiredInputs: ["seatingCapacity"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const seatingCapacity = Number(inputs.seatingCapacity) || 100;
    if (!inputs.seatingCapacity) {
      assumptions.push("Default: 100 seats (no user input)");
    }

    // Full-service restaurant: ~40 W/seat (Energy Star Portfolio Manager)
    // Fast food: ~20 W/seat — we'll default to full-service
    const wattsPerSeat = 40;
    const peakLoadKW = Math.max(
      30,
      Math.round(((seatingCapacity * wattsPerSeat) / 1000) * 1000) / 1000
    );
    // Round to whole kW
    const peakKW = Math.round(peakLoadKW);

    assumptions.push(
      `Restaurant: ${seatingCapacity} seats @ ${wattsPerSeat} W/seat = ${peakKW}kW (Energy Star)`
    );

    // Contributor breakdown (CBECS 2018 food service)
    const processKW = peakKW * 0.45; // Kitchen equipment
    const hvacKW = peakKW * 0.2; // Makeup air + dining HVAC
    const coolingKW = peakKW * 0.15; // Walk-in + reach-in refrigeration
    const lightingKW = peakKW * 0.1;
    const controlsKW = peakKW * 0.05; // POS, hood controls
    const otherKW = peakKW * 0.05; // Dishwashing, hot water

    const kWContributorsTotalKW =
      processKW + hvacKW + coolingKW + lightingKW + controlsKW + otherKW;

    // Restaurant: 14h active (lunch + dinner service), some overnight for refrigeration
    const dutyCycle = 0.45;
    const baseLoadKW = Math.round(peakKW * dutyCycle);

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
        hvacPct: 20,
        lightingPct: 10,
        processPct: 45,
        controlsPct: 5,
        itLoadPct: 0,
        coolingPct: 15,
        chargingPct: 0,
        otherPct: 5,
      },
      details: {
        restaurant: {
          seats: seatingCapacity,
          wattsPerSeat,
          kitchenLoadKW: processKW,
          refrigerationKW: coolingKW,
        },
      },
      notes: [
        `Restaurant: ${seatingCapacity} seats → peak ${peakKW}kW`,
        `Kitchen-dominant: 45% cooking + 15% refrigeration (CBECS food service)`,
        `Duty cycle: ${dutyCycle} (lunch+dinner service hours)`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW: peakKW,
      energyKWhPerDay: Math.round(baseLoadKW * 24),
      assumptions,
      warnings,
      validation,
      raw: { seatingCapacity, wattsPerSeat, peakKW },
    };
  },
};

/**
 * GAS STATION SSOT ADAPTER
 *
 * CalcValidation v1 envelope with contributor breakdown.
 * SSOT: calculateGasStationPower(dispenserCount, hasConvenienceStore, stationType)
 *
 * Contributor model:
 *   process (varies) - Fuel pumps (1.5-2.5 kW each) — small but critical
 *   lighting (varies) - Canopy lighting is significant (24/7)
 *   hvac (varies) - C-store HVAC (if present)
 *   cooling (varies) - C-store refrigeration (coolers, freezers)
 *   controls (5%) - POS, tank monitoring, payment systems
 *   other (varies) - Car wash, air/vacuum, signage
 */
export const GAS_STATION_LOAD_V1_SSOT: CalculatorContract = {
  id: "gas_station_load_v1",
  requiredInputs: ["fuelPumps"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    const fuelPumps = Number(inputs.fuelPumps) || 8;
    const hasConvenienceStore =
      inputs.hasConvenienceStore !== false && inputs.hasConvenienceStore !== "false";
    const hasCarWash = inputs.hasCarWash === true || inputs.hasCarWash === "true";

    if (!inputs.fuelPumps) {
      assumptions.push("Default: 8 fuel pumps (no user input)");
    }

    const result = calculateUseCasePower(
      "gas-station",
      buildSSOTInput("gas_station", {
        fuelPumps,
        hasConvenienceStore,
        stationType: hasConvenienceStore ? "with-cstore" : "gas-only",
      })
    );
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // Build contributor breakdown based on facility configuration
    const pumpKW = fuelPumps * 1.5;
    const canopyLightingKW = fuelPumps * 1.0; // ~1 kW per pump position for canopy
    let cstoreHvacKW = 0;
    let refrigerationKW = 0;
    let carWashKW = 0;

    if (hasConvenienceStore) {
      cstoreHvacKW = 8; // ~3000 sqft c-store
      refrigerationKW = 5; // Walk-in cooler + reach-in
      assumptions.push(`C-store: HVAC ${cstoreHvacKW}kW + refrigeration ${refrigerationKW}kW`);
    }

    if (hasCarWash) {
      carWashKW = 15; // Single-bay auto wash
      assumptions.push(`Car wash: ${carWashKW}kW`);
    }

    const controlsKW = peakLoadKW * 0.05; // POS, tank monitors, payment

    // Scale contributors to match SSOT peak (SSOT may include store load)
    const rawSum =
      pumpKW + canopyLightingKW + cstoreHvacKW + refrigerationKW + carWashKW + controlsKW;
    const scale = rawSum > 0 && peakLoadKW > 0 ? peakLoadKW / rawSum : 1;

    const scaledPumps = pumpKW * scale;
    const scaledLighting = canopyLightingKW * scale;
    const scaledHvac = cstoreHvacKW * scale;
    const scaledCooling = refrigerationKW * scale;
    const scaledCarWash = carWashKW * scale;
    const scaledControls = controlsKW * scale;
    const scaledOther = Math.max(
      0,
      peakLoadKW -
        scaledPumps -
        scaledLighting -
        scaledHvac -
        scaledCooling -
        scaledCarWash -
        scaledControls
    );

    const kWContributorsTotalKW =
      scaledPumps +
      scaledLighting +
      scaledHvac +
      scaledCooling +
      scaledControls +
      scaledCarWash +
      scaledOther;

    assumptions.push(
      `Gas Station: ${fuelPumps} pumps${hasConvenienceStore ? " + C-store" : ""}${hasCarWash ? " + car wash" : ""} → ${peakLoadKW}kW (NACS benchmark)`
    );

    // Gas stations: ~20h active, pumps/lights nearly 24/7
    const dutyCycle = 0.55;
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);

    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        hvac: scaledHvac,
        lighting: scaledLighting,
        process: scaledPumps, // Fuel dispensing = process
        controls: scaledControls,
        itLoad: 0,
        cooling: scaledCooling,
        charging: 0,
        other: scaledCarWash + scaledOther,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        hvacPct: peakLoadKW > 0 ? (scaledHvac / peakLoadKW) * 100 : 0,
        lightingPct: peakLoadKW > 0 ? (scaledLighting / peakLoadKW) * 100 : 0,
        processPct: peakLoadKW > 0 ? (scaledPumps / peakLoadKW) * 100 : 0,
        controlsPct: peakLoadKW > 0 ? (scaledControls / peakLoadKW) * 100 : 0,
        itLoadPct: 0,
        coolingPct: peakLoadKW > 0 ? (scaledCooling / peakLoadKW) * 100 : 0,
        chargingPct: 0,
        otherPct: peakLoadKW > 0 ? ((scaledCarWash + scaledOther) / peakLoadKW) * 100 : 0,
      },
      details: {
        gas_station: {
          pumps: fuelPumps,
          hasConvenienceStore,
          hasCarWash,
          pumpKW: scaledPumps,
          cstoreKW: scaledHvac + scaledCooling,
        },
      },
      notes: [
        `Gas Station: ${fuelPumps} pumps → ${peakLoadKW}kW`,
        hasConvenienceStore ? `C-store adds HVAC + refrigeration` : `No convenience store`,
        `Duty cycle: ${dutyCycle} (near-24/7 canopy lighting + pumps)`,
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
