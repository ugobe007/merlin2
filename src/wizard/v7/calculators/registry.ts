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
    //    Also bridge legacy curated schema fields (capacity MW → itLoadCapacity kW)
    //    Legacy "capacity" is in MW from the curated questionnaire; prefer it when
    //    the user explicitly changed it (non-zero, non-undefined) because the
    //    template-mapped itLoadCapacity may just be the seeded default.
    //
    // Bridge curated config IDs (Feb 2026):
    //   rackDensity (curated: "low"/"medium"/"high"/"ultra-high") → rackDensityKW
    if (inputs.rackDensity != null && inputs.rackDensityKW == null) {
      const rdMap: Record<string, number> = { low: 3, medium: 7, high: 15, "ultra-high": 25 };
      (inputs as Record<string, unknown>).rackDensityKW = rdMap[String(inputs.rackDensity)] ?? 7;
    }
    //   coolingSystem (curated: "air-cooled"/"water-cooled"/"immersion"/"hybrid") → metadata
    //   (no direct calc impact yet — captured in assumptions for TrueQuote audit trail)
    if (inputs.coolingSystem) assumptions.push(`Cooling: ${inputs.coolingSystem}`);
    //   redundancy (curated: "n"/"n+1"/"2n"/"2n+1") → metadata
    if (inputs.redundancy) assumptions.push(`Redundancy: ${inputs.redundancy}`);
    //   requiredRuntime (curated: "15min"/"30min"/"1hr"/"4hr"/"8hr") → metadata
    if (inputs.requiredRuntime) assumptions.push(`Required runtime: ${inputs.requiredRuntime}`);
    //   existingUPS (curated: yes/no) → metadata
    if (inputs.existingUPS) assumptions.push(`Existing UPS: ${inputs.existingUPS}`);
    const legacyCapacityMW = inputs.capacity != null ? Number(inputs.capacity) : undefined;
    const templateItLoadKW =
      inputs.itLoadCapacity != null ? Number(inputs.itLoadCapacity) : undefined;
    // Legacy capacity (MW → kW) takes priority when it's a plausible user entry
    const itLoadKW =
      legacyCapacityMW && legacyCapacityMW > 0
        ? legacyCapacityMW * 1000
        : templateItLoadKW || undefined;
    const currentPUE = String(inputs.currentPUE || inputs.pue || "1.3-1.5");
    const itUtilization = String(inputs.itUtilization || "60-80%");
    const dataCenterTier = String(inputs.dataCenterTier || inputs.uptimeRequirement || "tier_3");

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

    // 1. Parse inputs — bridge curated config IDs → calculator field names
    // Curated sends: numRooms, hotelCategory, occupancyRate, poolOnSite, restaurantOnSite, spaOnSite, laundryOnSite
    const roomCount = Number(inputs.roomCount ?? inputs.numRooms) || 150;
    // Map curated hotelCategory values (1-star..5-star) → calculator values (economy..luxury)
    const rawHotelClass = String(inputs.hotelClass ?? inputs.hotelCategory ?? "midscale");
    const HOTEL_CLASS_MAP: Record<string, string> = {
      "1-star": "economy",
      "2-star": "economy",
      economy: "economy",
      budget: "economy",
      "3-star": "midscale",
      midscale: "midscale",
      standard: "midscale",
      "4-star": "upscale",
      upscale: "upscale",
      premium: "upscale",
      boutique: "upscale",
      "5-star": "luxury",
      luxury: "luxury",
    };
    const hotelClass = HOTEL_CLASS_MAP[rawHotelClass] || rawHotelClass;

    // ✅ FIX (Feb 14, 2026): Map button string values → occupancy %
    // Curated buttons: 'high'/'medium'/'seasonal'/'low' (NOT numbers)
    const OCC_MAP: Record<string, number> = {
      high: 85,      // 75-100% → midpoint 85
      medium: 65,    // 50-75% → midpoint 65
      seasonal: 55,  // Variable → conservative estimate
      low: 40,       // < 50% → 40%
    };
    const rawOcc = inputs.occupancyRate;
    const occupancyRate =
      typeof rawOcc === "string" && rawOcc in OCC_MAP
        ? OCC_MAP[rawOcc]
        : rawOcc != null && Number.isFinite(Number(rawOcc)) && Number(rawOcc) > 0
          ? Number(rawOcc)
          : 70;

    // Build amenities from either array or individual boolean flags
    // Bridge both template format (pool_on_site) and curated format (poolOnSite)
    let hotelAmenities: string[] = [];
    if (Array.isArray(inputs.hotelAmenities)) {
      hotelAmenities = inputs.hotelAmenities;
    } else {
      // Pool: curated sends "indoor"/"outdoor"/"both"/"none"; template sends boolean
      const poolVal = inputs.pool_on_site ?? inputs.poolOnSite;
      if (poolVal && poolVal !== "none" && poolVal !== "no" && poolVal !== false)
        hotelAmenities.push("pool");
      // Spa: curated sends "full-spa"/"fitness-only"/"both"/"none"; template sends boolean
      const spaVal = inputs.spa_on_site ?? inputs.spaOnSite;
      if (spaVal && spaVal !== "none" && spaVal !== "no" && spaVal !== false)
        hotelAmenities.push("spa");
      // Restaurant: curated sends "full-service"/"breakfast-only"/"bar-lounge"/"none"
      const restVal = inputs.restaurant_on_site ?? inputs.restaurantOnSite;
      if (restVal && restVal !== "none" && restVal !== "no" && restVal !== false)
        hotelAmenities.push("restaurant");
      // Bar: curated restaurantOnSite="bar-lounge" also implies bar
      const barVal = inputs.bar_on_site ?? inputs.barOnSite;
      if (barVal || restVal === "bar-lounge") hotelAmenities.push("bar");
      // Laundry: curated sends "full"/"partial"/"outsourced"
      const laundryVal = inputs.laundry_on_site ?? inputs.laundryOnSite;
      if (
        laundryVal &&
        laundryVal !== "outsourced" &&
        laundryVal !== "none" &&
        laundryVal !== "no" &&
        laundryVal !== false
      )
        hotelAmenities.push("laundry");
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

    // Bridge curated config IDs → calculator field names
    // Curated sends: tunnelOrBayCount, dailyVehicles, facilityType, operatingHours
    const rawBayTunnel = inputs.bayTunnelCount ?? inputs.tunnelOrBayCount;
    const bayTunnelStr = String(rawBayTunnel || "4 bays");
    const bayCount = parseBayTunnel(rawBayTunnel);
    const carsPerDay = Number(inputs.averageWashesPerDay ?? inputs.dailyVehicles) || 200;
    const operatingHours = Number(inputs.operatingHours) || 12;
    // Curated facilityType values: express_tunnel, mini_tunnel, in_bay_automatic, self_serve
    // Calculator expects: tunnel, automatic, selfService, fullService
    const rawWashType = String(inputs.carWashType ?? inputs.facilityType ?? "tunnel");
    const WASH_TYPE_MAP: Record<string, string> = {
      express_tunnel: "tunnel",
      mini_tunnel: "tunnel",
      tunnel: "tunnel",
      in_bay_automatic: "automatic",
      automatic: "automatic",
      self_serve: "selfService",
      selfService: "selfService",
      full_service: "fullService",
      fullService: "fullService",
    };
    const carWashType = WASH_TYPE_MAP[rawWashType] || rawWashType;
    const primaryEquipment = Array.isArray(inputs.primaryEquipment) ? inputs.primaryEquipment : [];

    // 2. Map to SSOT parameters (use buildSSOTInput for field name safety)
    const useCaseData = buildSSOTInput("car_wash", { bayTunnelCount: bayCount });
    // Pass through extra fields SSOT may read
    Object.assign(useCaseData, {
      carsPerDay,
      operatingHours,
      carWashType,
      primaryEquipment,
    });

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

    // Bridge curated config fields → scale multiplier
    // retailType: grocery/department/specialty/big-box/convenience/pharmacy
    const retailType = String(inputs.retailType || "general");
    const RETAIL_MULTIPLIER: Record<string, number> = {
      grocery: 1.5, // Heavy refrigeration
      department: 1.1, // Extensive lighting
      specialty: 0.9, // Smaller, focused
      "big-box": 1.2, // Large warehouse-style
      convenience: 1.3, // Small but dense (refrigeration)
      pharmacy: 1.0,
      general: 1.0,
    };
    const retailMult = RETAIL_MULTIPLIER[retailType] || 1.0;

    // refrigerationLevel: none/light/moderate/heavy → adjust W/sqft
    const refLevel = String(inputs.refrigerationLevel || "light");
    const REFRIG_ADDER: Record<string, number> = { none: 0, light: 0, moderate: 2, heavy: 5 };
    const refrigAdder = REFRIG_ADDER[refLevel] || 0;

    const effectiveWattsPerSqFt = 8 * retailMult + refrigAdder;
    assumptions.push(
      `Retail (${retailType}): ${squareFootage.toLocaleString()} sq ft @ ${effectiveWattsPerSqFt.toFixed(1)} W/sqft (CBECS 2018 adj.)`
    );

    // Capture curated fields in audit trail
    if (inputs.operatingHours) assumptions.push(`Hours: ${inputs.operatingHours}`);
    if (inputs.lightingType) assumptions.push(`Lighting: ${inputs.lightingType}`);
    if (inputs.cookingOnSite) assumptions.push(`Cooking on-site: ${inputs.cookingOnSite}`);
    if (inputs.parkingLot) assumptions.push(`Parking lot: ${inputs.parkingLot}`);
    if (inputs.evChargers) assumptions.push(`EV chargers: ${inputs.evChargers}`);

    const result = calculateUseCasePower("retail", buildSSOTInput("retail", { squareFootage }));
    // Apply retail type and refrigeration multiplier
    const rawPeakKW = result.powerMW * 1000;
    const peakLoadKW = Math.round(rawPeakKW * retailMult + (squareFootage * refrigAdder) / 1000);

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

    // --- Core inputs (bridge curated config IDs → calculator field names) ---
    const squareFootage = Number(inputs.squareFootage) || 100000;
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
export const HOSPITAL_LOAD_V1_SSOT: CalculatorContract = {
  id: "hospital_load_v1",
  requiredInputs: ["bedCount"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // --- Core inputs (bridge curated config IDs → calculator field names) ---
    const bedCount = Number(inputs.bedCount) || 200;
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
    // Bridge curated: warehouseType (ambient/cold-storage/freezer/mixed) → isColdStorage
    let isColdStorage = inputs.isColdStorage === true || inputs.isColdStorage === "true";
    if (!isColdStorage && inputs.warehouseType != null) {
      const whType = String(inputs.warehouseType).toLowerCase();
      isColdStorage = whType.includes("cold") || whType.includes("freezer");
    }
    // Bridge curated: refrigeration (yes/no) → also implies cold storage behavior
    if (!isColdStorage && (inputs.refrigeration === "yes" || inputs.refrigeration === true)) {
      isColdStorage = true;
    }
    // Capture rich curated inputs as assumptions for audit trail
    if (inputs.ceilingHeight) assumptions.push(`Ceiling height: ${inputs.ceilingHeight}`);
    if (inputs.dockDoors) assumptions.push(`Dock doors: ${inputs.dockDoors}`);
    if (inputs.materialHandling) assumptions.push(`Material handling: ${inputs.materialHandling}`);
    if (inputs.automationLevel) assumptions.push(`Automation: ${inputs.automationLevel}`);
    if (inputs.operatingHours) assumptions.push(`Operating hours: ${inputs.operatingHours}`);
    if (inputs.evFleet) assumptions.push(`EV fleet: ${inputs.evFleet}`);

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

    // Bridge curated config IDs → calculator field names
    // Curated sends: level2Chargers, dcFastChargers, dcFastPower, level2Power, siteDemandCap
    const level2Chargers = inputs.level2Chargers != null ? Number(inputs.level2Chargers) : 12;
    const rawDcfc = inputs.dcfcChargers ?? inputs.dcFastChargers;
    const dcfcChargers = rawDcfc != null ? Number(rawDcfc) : 8;
    const hpcChargers = inputs.hpcChargers != null ? Number(inputs.hpcChargers) : 0;
    const rawL2Power = inputs.level2PowerKW ?? inputs.level2Power;
    const level2KWEach = rawL2Power != null ? Number(rawL2Power) : 7.2;
    const rawSiteCap = inputs.siteDemandCapKW ?? inputs.siteDemandCap;
    const siteDemandCapKW = rawSiteCap != null ? Number(rawSiteCap) : 0;

    assumptions.push(
      `EV Charging: ${level2Chargers} Level 2 (${level2KWEach}kW), ` +
        `${dcfcChargers} DCFC (150kW)` +
        (hpcChargers > 0 ? `, ${hpcChargers} HPC (250kW)` : "")
    );

    // Route through SSOT (handles concurrency internally)
    // Use buildSSOTInput to map adapter field names → SSOT field names
    // (dcfcChargers → numberOfDCFastChargers, level2Chargers → numberOfLevel2Chargers)
    const evSSOTInput = buildSSOTInput("ev_charging", { level2Chargers, dcfcChargers });
    const result = calculateUseCasePower("ev-charging", evSSOTInput);
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

    const rawSeatingCapacity =
      inputs.seatingCapacity != null ? Number(inputs.seatingCapacity) : 100;
    const seatingCapacity =
      Number.isFinite(rawSeatingCapacity) && rawSeatingCapacity > 0 ? rawSeatingCapacity : 100;
    if (!inputs.seatingCapacity || !Number.isFinite(Number(inputs.seatingCapacity))) {
      assumptions.push("Default: 100 seats (no user input)");
    }

    // Restaurant type (from adapter _rawExtensions or direct input)
    const restaurantType = String(
      inputs.restaurantType || inputs.subType || "full-service"
    ).toLowerCase();

    // ── Per-seat peak demand intensity by type (CBECS 2018 + PG&E Commercial Kitchen studies) ─
    // Full facility peak demand: cooking, hood exhaust, HVAC (makeup air), refrigeration,
    // dishwashing, lighting, POS/controls. Based on CBECS median EUI ~200 kBtu/sqft/yr
    // at ~20 sqft/seat → converted to peak electrical demand.
    const INTENSITY_MAP: Record<string, number> = {
      "fast-food": 200, // Quick-service: fryers + grills + drive-thru HVAC
      fast_food: 200,
      "quick-service": 200,
      cafe: 120, // Espresso machines, display cases, minimal cooking
      casual: 350, // Mid-range kitchen + full HVAC + bar
      "full-service": 450, // Full kitchen + hood exhaust + dining HVAC + dishwasher
      full_service: 450,
      "fine-dining": 550, // Intense kitchen + ambience + wine storage + extensive HVAC
      fine_dining: 550,
      "food-hall": 250, // Shared kitchen infrastructure, multiple vendors
      food_hall: 250,
      buffet: 500, // Steam tables + large refrigeration + high HVAC
    };
    const wattsPerSeat = INTENSITY_MAP[restaurantType] ?? 450;

    // ── Base load from seating capacity ────────────────────────────────────
    const seatingLoadKW = (seatingCapacity * wattsPerSeat) / 1000;

    // ── Kitchen base load (scales with restaurant size, not just seats) ────
    // Even a tiny restaurant has fixed kitchen infrastructure:
    // Walk-in cooler (~3kW), hood exhaust (~2kW), dishwasher (~5kW), hot water (~3kW)
    const kitchenBaseKW =
      seatingCapacity <= 50 ? 15 : seatingCapacity <= 100 ? 25 : seatingCapacity <= 200 ? 40 : 60;

    // ── Peak load = max(kitchen base, seating load) ───────────────────────
    // Even a 20-seat fine dining has significant kitchen infrastructure
    const peakKW = Math.round(Math.max(kitchenBaseKW, seatingLoadKW));

    assumptions.push(
      `Restaurant (${restaurantType}): ${seatingCapacity} seats × ${wattsPerSeat} W/seat = ${seatingLoadKW.toFixed(1)}kW, kitchen base ${kitchenBaseKW}kW → peak ${peakKW}kW`
    );

    // ── Contributor breakdown (CBECS 2018 food service) ───────────────────
    const processKW = peakKW * 0.4; // Kitchen: cooking, hood exhaust, dishwashing
    const hvacKW = peakKW * 0.22; // Makeup air + dining HVAC (higher due to kitchen heat)
    const coolingKW = peakKW * 0.18; // Walk-in cooler + reach-in + wine storage
    const lightingKW = peakKW * 0.1; // Dining ambience + kitchen task lighting
    const controlsKW = peakKW * 0.05; // POS, hood controls, fire suppression
    const otherKW = peakKW * 0.05; // Hot water, restrooms, signage

    const kWContributorsTotalKW =
      processKW + hvacKW + coolingKW + lightingKW + controlsKW + otherKW;

    // Restaurant: ~14h active (lunch + dinner), refrigeration overnight
    const dutyCycleMap: Record<string, number> = {
      "fast-food": 0.55,
      fast_food: 0.55,
      "quick-service": 0.55,
      cafe: 0.4,
      casual: 0.45,
      "full-service": 0.45,
      full_service: 0.45,
      "fine-dining": 0.35,
      fine_dining: 0.35, // Dinner-only service
      buffet: 0.5,
    };
    const dutyCycle = dutyCycleMap[restaurantType] ?? 0.45;
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
        hvacPct: peakKW > 0 ? (hvacKW / peakKW) * 100 : 0,
        lightingPct: peakKW > 0 ? (lightingKW / peakKW) * 100 : 0,
        processPct: peakKW > 0 ? (processKW / peakKW) * 100 : 0,
        controlsPct: peakKW > 0 ? (controlsKW / peakKW) * 100 : 0,
        itLoadPct: 0,
        coolingPct: peakKW > 0 ? (coolingKW / peakKW) * 100 : 0,
        chargingPct: 0,
        otherPct: peakKW > 0 ? (otherKW / peakKW) * 100 : 0,
      },
      details: {
        restaurant: {
          seats: seatingCapacity,
          restaurantType,
          wattsPerSeat,
          kitchenBaseKW,
          seatingLoadKW,
          kitchenLoadKW: processKW,
          refrigerationKW: coolingKW,
        },
      },
      notes: [
        `Restaurant (${restaurantType}): ${seatingCapacity} seats → peak ${peakKW}kW`,
        `Kitchen-dominant: 40% cooking + 18% refrigeration (CBECS food service)`,
        `Kitchen base load: ${kitchenBaseKW}kW (hood exhaust, walk-in, dishwasher)`,
        `Duty cycle: ${dutyCycle} (${restaurantType} service hours)`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW: peakKW,
      energyKWhPerDay: Math.round(baseLoadKW * 24),
      assumptions,
      warnings,
      validation,
      raw: { seatingCapacity, restaurantType, wattsPerSeat, kitchenBaseKW, peakKW },
    };
  },
};

/**
 * TRUCK STOP / TRAVEL CENTER SSOT ADAPTER (Feb 2026)
 *
 * CalcValidation v1 envelope with contributor breakdown.
 * Dedicated calculator — does NOT borrow from gas_station.
 *
 * LOAD MODEL (Love's / Pilot J class):
 *   Diesel fueling:   lanes × 2.5 kW  + DEF dispensing
 *   C-store HVAC:     sqft × 5 W/sqft (high due to frequent door openings)
 *   Refrigeration:    sqft × 2 W/sqft (walk-in coolers, freezers, beverage)
 *   Canopy lighting:  lanes × 1.5 kW  + parking × 0.05 kW
 *   Shore power:      spots × 2 kW × utilization (IdleAire standard)
 *   Showers:          25 kW (water heating + ventilation)
 *   Laundry:          15 kW (commercial washers/dryers)
 *   Restaurant/Deli:  40-60 kW (kitchen + prep + walk-in)
 *   Controls:         5 kW (POS, tank monitors, CAT scale, security)
 *
 * Typical ranges: small 80-150 kW, medium 180-300 kW, large 250-450 kW
 *
 * Sources: NACS Convenience Store benchmark, IdleAire shore power specs,
 *          ASHRAE Commercial HVAC standards
 */
export const TRUCK_STOP_LOAD_V1_SSOT: CalculatorContract = {
  id: "truck_stop_load_v1",
  requiredInputs: ["fuelPumps"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // Core sizing inputs (from curated config button values or direct numbers)
    // fuelPumps comes as 'small'|'medium'|'large'|'mega' from buttons
    const PUMP_MAP: Record<string, number> = {
      small: 6,    // Small truck stop
      medium: 12,  // Standard truck stop
      large: 20,   // Large travel center
      mega: 30,    // Major travel plaza
    };
    const rawPumpsInput = inputs.fuelPumps;
    const rawDieselLanes =
      typeof rawPumpsInput === "string" && rawPumpsInput in PUMP_MAP
        ? PUMP_MAP[rawPumpsInput]
        : rawPumpsInput != null && Number.isFinite(Number(rawPumpsInput)) && Number(rawPumpsInput) > 0
          ? Number(rawPumpsInput)
          : 12;
    const dieselLanes = rawDieselLanes;
    const rawCStoreSqFt = inputs.cStoreSqFt != null ? Number(inputs.cStoreSqFt) : 5000;
    const cStoreSqFt = Number.isFinite(rawCStoreSqFt) && rawCStoreSqFt > 0 ? rawCStoreSqFt : 5000;
    const rawParkingSpots =
      inputs.truckParkingSpots != null ? Number(inputs.truckParkingSpots) : 80;
    const parkingSpots =
      Number.isFinite(rawParkingSpots) && rawParkingSpots > 0 ? rawParkingSpots : 80;
    const stationType = String(inputs.stationType || "truck-stop");

    // Bridge curated button values for boolean fields
    const hasShowers = inputs.hasShowers !== false && inputs.hasShowers !== "false" && inputs.hasShowers !== "no" && inputs.hasShowers !== "none";
    const hasLaundry = inputs.hasLaundry !== false && inputs.hasLaundry !== "false" && inputs.hasLaundry !== "no" && inputs.hasLaundry !== "none";
    const hasRestaurant = inputs.hasRestaurant !== false && inputs.hasRestaurant !== "false" && inputs.hasRestaurant !== "no" && inputs.hasRestaurant !== "none";
    // carWash: curated buttons are 'tunnel'|'automatic'|'self-service'|'none'
    const cwVal = inputs.carWash ?? inputs.hasCarWash;
    const hasCarWash = cwVal != null
      ? cwVal !== "none" && cwVal !== "no" && cwVal !== false && cwVal !== "false"
      : false;

    if (!inputs.fuelPumps || (typeof rawPumpsInput === "string" && !(rawPumpsInput in PUMP_MAP) && !Number.isFinite(Number(rawPumpsInput)))) {
      assumptions.push("Default: 12 diesel lanes (no user input)");
    }

    // ── kW contributors (bottom-up engineering model) ──────────────────

    // 1. Diesel fueling infrastructure (2.5 kW/lane including DEF)
    const fuelingKW = dieselLanes * 2.5;
    assumptions.push(`Diesel fueling: ${dieselLanes} lanes × 2.5 kW = ${fuelingKW.toFixed(0)}kW`);

    // 2. C-store HVAC (5 W/sqft — high due to frequent door openings, makeup air)
    const hvacKW = cStoreSqFt * 0.005;
    assumptions.push(
      `C-store HVAC: ${cStoreSqFt.toLocaleString()} sqft × 5 W/sqft = ${hvacKW.toFixed(0)}kW`
    );

    // 3. Refrigeration (2 W/sqft — walk-in coolers, beverage, freezers, ice machines)
    const refrigerationKW = cStoreSqFt * 0.002;
    assumptions.push(
      `Refrigeration: ${cStoreSqFt.toLocaleString()} sqft × 2 W/sqft = ${refrigerationKW.toFixed(0)}kW`
    );

    // 4. Canopy + lot lighting (1.5 kW/lane + 0.05 kW/parking spot)
    const lightingKW = dieselLanes * 1.5 + parkingSpots * 0.05;
    assumptions.push(`Lighting: canopy + lot = ${lightingKW.toFixed(0)}kW`);

    // 5. Shore power / idle reduction (2 kW/spot × 10% utilization)
    const shorePowerKW = parkingSpots * 2 * 0.1;
    if (parkingSpots > 0) {
      assumptions.push(
        `Shore power: ${parkingSpots} spots × 2kW × 10% util = ${shorePowerKW.toFixed(0)}kW`
      );
    }

    // 6. Showers (25 kW — commercial water heaters + exhaust ventilation)
    const showerKW = hasShowers ? 25 : 0;
    if (hasShowers) assumptions.push("Shower facilities: 25kW (water heating + ventilation)");

    // 7. Laundry (15 kW — commercial washers/dryers)
    const laundryKW = hasLaundry ? 15 : 0;
    if (hasLaundry) assumptions.push("Laundry: 15kW (commercial washers/dryers)");

    // 8. Restaurant/Deli (scales with truck stop size)
    let restaurantKW = 0;
    if (hasRestaurant) {
      // Small stops: 40kW (deli/sub shop), large: 60kW (full restaurant w/ kitchen)
      restaurantKW = dieselLanes >= 16 ? 60 : 40;
      assumptions.push(`Restaurant/Deli: ${restaurantKW}kW (kitchen + prep + walk-in cooler)`);
    }

    // 9. Car wash (optional)
    const carWashKW = hasCarWash ? 25 : 0;
    if (hasCarWash) assumptions.push("Truck/car wash: 25kW");

    // 10. Controls (POS, tank monitors, CAT scale, security cameras, payment)
    const controlsKW = 5;

    // ── Total peak ─────────────────────────────────────────────────────
    const rawPeakKW =
      fuelingKW +
      hvacKW +
      refrigerationKW +
      lightingKW +
      shorePowerKW +
      showerKW +
      laundryKW +
      restaurantKW +
      carWashKW +
      controlsKW;

    // Apply diversity factor: not all loads peak simultaneously
    const diversityFactor = 0.85;
    const peakLoadKW = Math.round(rawPeakKW * diversityFactor);

    assumptions.push(
      `Raw sum: ${rawPeakKW.toFixed(0)}kW × ${diversityFactor} diversity = ${peakLoadKW}kW`
    );

    // ── Duty cycle (24/7 operation, ~65% average utilization) ──────────
    const dutyCycle = 0.65;
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);

    // ── Contributor breakdown (attribute kW to canonical categories) ────
    // "process" = fueling + showers + laundry + restaurant + car wash
    const processKW = fuelingKW + showerKW + laundryKW + restaurantKW + carWashKW;
    const totalRaw = processKW + hvacKW + refrigerationKW + lightingKW + shorePowerKW + controlsKW;
    // Scale all contributors down by diversity factor to match peakLoadKW
    const scaleFactor = totalRaw > 0 ? peakLoadKW / totalRaw : 1;

    const scaledProcess = processKW * scaleFactor;
    const scaledHvac = hvacKW * scaleFactor;
    const scaledCooling = refrigerationKW * scaleFactor;
    const scaledLighting = lightingKW * scaleFactor;
    const scaledOther = (shorePowerKW + controlsKW) * scaleFactor;

    const kWContributorsTotalKW =
      scaledProcess + scaledHvac + scaledCooling + scaledLighting + scaledOther;

    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        hvac: scaledHvac,
        lighting: scaledLighting,
        process: scaledProcess,
        controls: controlsKW * scaleFactor,
        itLoad: 0,
        cooling: scaledCooling,
        charging: 0,
        other: shorePowerKW * scaleFactor,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        hvacPct: peakLoadKW > 0 ? (scaledHvac / peakLoadKW) * 100 : 0,
        lightingPct: peakLoadKW > 0 ? (scaledLighting / peakLoadKW) * 100 : 0,
        processPct: peakLoadKW > 0 ? (scaledProcess / peakLoadKW) * 100 : 0,
        controlsPct: peakLoadKW > 0 ? ((controlsKW * scaleFactor) / peakLoadKW) * 100 : 0,
        itLoadPct: 0,
        coolingPct: peakLoadKW > 0 ? (scaledCooling / peakLoadKW) * 100 : 0,
        chargingPct: 0,
        otherPct: peakLoadKW > 0 ? ((shorePowerKW * scaleFactor) / peakLoadKW) * 100 : 0,
      },
      details: {
        truck_stop: {
          dieselLanes,
          cStoreSqFt,
          parkingSpots,
          hasShowers,
          hasLaundry,
          hasRestaurant,
          hasCarWash,
          fuelingKW,
          hvacKW,
          refrigerationKW,
          lightingKW,
          shorePowerKW,
          restaurantKW,
          diversityFactor,
        },
      },
      notes: [
        `Truck Stop: ${dieselLanes} diesel lanes, ${cStoreSqFt.toLocaleString()} sqft c-store → ${peakLoadKW}kW peak`,
        `Amenities: ${[hasShowers && "showers", hasLaundry && "laundry", hasRestaurant && "restaurant", hasCarWash && "car wash"].filter(Boolean).join(", ") || "none"}`,
        `Shore power: ${parkingSpots} truck parking spots (${shorePowerKW.toFixed(0)}kW @ 10% utilization)`,
        `Duty cycle: ${dutyCycle} (24/7 operation)`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay: Math.round(baseLoadKW * 24),
      assumptions,
      warnings,
      validation,
      raw: { dieselLanes, cStoreSqFt, parkingSpots, stationType, peakLoadKW },
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

    // Bridge curated config field names → calculator field names
    // Curated buttons use string values that need semantic mapping:
    //   fuelPumps: 'small'|'medium'|'large'|'mega' → actual pump counts
    //   convenienceStore: 'full'|'limited'|'none' → boolean
    //   carWash: 'tunnel'|'automatic'|'self-service'|'none' → boolean
    //   foodService: 'full-kitchen'|'quick-serve'|'coffee-only'|'none' → boolean
    //   evChargers: 'dcfc-multiple'|'dcfc-few'|'l2-only'|'planned'|'none' → count

    // ── fuelPumps: button string → pump count ──────────────────────────
    const PUMP_MAP: Record<string, number> = {
      small: 3,    // 2-4 dispensers
      medium: 8,   // 6-10 dispensers
      large: 16,   // 12-20 dispensers
      mega: 24,    // 20+ dispensers
    };
    const rawPumps = inputs.fuelPumps;
    const fuelPumps =
      typeof rawPumps === "string" && rawPumps in PUMP_MAP
        ? PUMP_MAP[rawPumps]
        : rawPumps != null && Number.isFinite(Number(rawPumps)) && Number(rawPumps) > 0
          ? Number(rawPumps)
          : 8;

    // ── convenienceStore: button string → boolean ──────────────────────
    // Curated: 'full'|'limited'|'none' (NOT 'yes'/'no')
    const csVal = inputs.convenienceStore;
    const hasConvenienceStore =
      csVal != null
        ? csVal !== "none" && csVal !== "no" && csVal !== false && csVal !== "false"
        : inputs.hasConvenienceStore !== false && inputs.hasConvenienceStore !== "false";

    // ── carWash: button string → boolean ───────────────────────────────
    // Curated: 'tunnel'|'automatic'|'self-service'|'none'
    const cwVal = inputs.carWash;
    const hasCarWash =
      cwVal != null
        ? cwVal !== "none" && cwVal !== "no" && cwVal !== false && cwVal !== "false"
        : inputs.hasCarWash === true || inputs.hasCarWash === "true";

    // ── foodService: button string → boolean ───────────────────────────
    const hasFood =
      inputs.foodService != null
        ? String(inputs.foodService) !== "none" && inputs.foodService !== false
        : false;

    // ── evChargers: button string → charger count ──────────────────────
    const EV_MAP: Record<string, number> = {
      "dcfc-multiple": 6,  // 4+ DC fast chargers
      "dcfc-few": 2,       // 1-3 DC fast chargers
      "l2-only": 4,        // Level 2 chargers
      planned: 0,          // Not yet installed
      none: 0,
    };
    const rawEV = inputs.evChargers;
    const evChargerCount =
      typeof rawEV === "string" && rawEV in EV_MAP
        ? EV_MAP[rawEV]
        : rawEV != null && Number.isFinite(Number(rawEV)) && Number(rawEV) > 0
          ? Number(rawEV)
          : 0;

    const hasLEDSignage = inputs.signage === "led-digital" || inputs.signage === "large";
    const stationType = String(
      inputs.stationType || (hasConvenienceStore ? "with-cstore" : "gas-only")
    );

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
    const ssotPeakLoadKW = Math.round(result.powerMW * 1000);

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

    // EV chargers (if present from curated config)
    let evChargingKW = 0;
    if (evChargerCount > 0) {
      evChargingKW = evChargerCount * 7.2; // L2 chargers typical
      assumptions.push(`EV chargers: ${evChargerCount} × 7.2kW = ${evChargingKW.toFixed(0)}kW`);
    }

    // Food service (from curated config)
    let foodServiceKW = 0;
    if (hasFood) {
      foodServiceKW = String(inputs.foodService) === "full-restaurant" ? 40 : 20; // deli vs restaurant
      assumptions.push(`Food service: ${foodServiceKW}kW (${inputs.foodService})`);
    }

    // LED signage (from curated config)
    const signageKW = hasLEDSignage ? 3 : 1;

    // ✅ FIX (Feb 14, 2026): Add-on loads (carWash, EV, food) are NOT in the
    // SSOT's gas-station model. Add them ON TOP of the SSOT peak, not scaled into it.
    const addOnKW = carWashKW + evChargingKW + foodServiceKW;
    const peakLoadKW = ssotPeakLoadKW + addOnKW;

    const controlsKW = peakLoadKW * 0.05; // POS, tank monitors, payment

    // Build contributor breakdown matching total peakLoadKW
    // SSOT portion (pumps + store) is scaled to match ssotPeakLoadKW
    const ssotContributorSum =
      pumpKW + canopyLightingKW + cstoreHvacKW + refrigerationKW + signageKW;
    const ssotScale =
      ssotContributorSum > 0 && ssotPeakLoadKW > 0 ? ssotPeakLoadKW / ssotContributorSum : 1;

    const scaledPumps = pumpKW * ssotScale;
    const scaledLighting = (canopyLightingKW + signageKW) * ssotScale;
    const scaledHvac = cstoreHvacKW * ssotScale;
    const scaledCooling = refrigerationKW * ssotScale;
    // Add-on loads are NOT scaled — they're real measured loads
    const scaledCarWash = carWashKW;
    const scaledControls = controlsKW;
    const scaledCharging = evChargingKW;
    const scaledFood = foodServiceKW;
    // Ensure "other" is always non-zero for TrueQuote contributor requirements
    // If the sum of known contributors exceeds peakLoadKW, clamp and redistribute
    const knownContributorsSum =
      scaledPumps + scaledLighting + scaledHvac + scaledCooling +
      scaledCarWash + scaledCharging + scaledFood + scaledControls;
    const minOther = Math.max(1, peakLoadKW * 0.02); // At least 1 kW for misc (security, POS backup)
    const scaledOther = Math.max(minOther, peakLoadKW - knownContributorsSum);

    // Normalize so total matches peakLoadKW exactly
    const rawTotal = knownContributorsSum + scaledOther;
    const normFactor = peakLoadKW > 0 && rawTotal > 0 ? peakLoadKW / rawTotal : 1;

    // Apply normalization so contributors sum exactly to peakLoadKW
    const nPumps = scaledPumps * normFactor;
    const nLighting = scaledLighting * normFactor;
    const nHvac = scaledHvac * normFactor;
    const nCooling = scaledCooling * normFactor;
    const nControls = scaledControls * normFactor;
    const nCarWash = scaledCarWash * normFactor;
    const nCharging = scaledCharging * normFactor;
    const nFood = scaledFood * normFactor;
    const nOther = scaledOther * normFactor;

    const kWContributorsTotalKW =
      nPumps + nLighting + nHvac + nCooling + nControls +
      nCarWash + nCharging + nFood + nOther;

    assumptions.push(
      `Gas Station (${stationType}): ${fuelPumps} pumps${hasConvenienceStore ? " + C-store" : ""}${hasCarWash ? " + car wash" : ""}${evChargerCount > 0 ? ` + ${evChargerCount} EV` : ""} → ${peakLoadKW}kW (NACS benchmark)`
    );

    // Gas stations: ~20h active, pumps/lights nearly 24/7
    const dutyCycle = 0.55;
    const baseLoadKW = Math.round(peakLoadKW * dutyCycle);

    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        hvac: nHvac,
        lighting: nLighting,
        process: nPumps + nFood, // Fuel dispensing + food service = process
        controls: nControls,
        itLoad: 0,
        cooling: nCooling,
        charging: nCharging,
        other: nCarWash + nOther,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        hvacPct: peakLoadKW > 0 ? (nHvac / peakLoadKW) * 100 : 0,
        lightingPct: peakLoadKW > 0 ? (nLighting / peakLoadKW) * 100 : 0,
        processPct: peakLoadKW > 0 ? ((nPumps + nFood) / peakLoadKW) * 100 : 0,
        controlsPct: peakLoadKW > 0 ? (nControls / peakLoadKW) * 100 : 0,
        itLoadPct: 0,
        coolingPct: peakLoadKW > 0 ? (nCooling / peakLoadKW) * 100 : 0,
        chargingPct: peakLoadKW > 0 ? (nCharging / peakLoadKW) * 100 : 0,
        otherPct: peakLoadKW > 0 ? ((nCarWash + nOther) / peakLoadKW) * 100 : 0,
      },
      details: {
        gas_station: {
          pumps: fuelPumps,
          stationType,
          hasConvenienceStore,
          hasCarWash,
          hasFood,
          evChargerCount,
          hasLEDSignage,
          pumpKW: scaledPumps,
          cstoreKW: scaledHvac + scaledCooling,
          evChargingKW: scaledCharging,
          foodServiceKW: scaledFood,
        },
      },
      notes: [
        `Gas Station (${stationType}): ${fuelPumps} pumps → ${peakLoadKW}kW`,
        hasConvenienceStore ? `C-store adds HVAC + refrigeration` : `No convenience store`,
        evChargerCount > 0
          ? `${evChargerCount} EV chargers (${scaledCharging.toFixed(0)}kW)`
          : `No EV chargers`,
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

// ========== 9 NEW DEDICATED ADAPTERS (Feb 14, 2026) ==========
// Replacing generic_ssot_v1 fallback with proper field bridges + TrueQuote envelopes

/**
 * AIRPORT SSOT ADAPTER
 *
 * Curated fields: airportClass, annualPassengers, terminalSqFt, terminals,
 *   jetBridges, parkingStructure, groundTransport, evChargers, cargoFacility
 * SSOT: calculateAirportPower(annualPassengersMillions)
 * Source: FAA/industry airport benchmarks
 */
export const AIRPORT_LOAD_V1_SSOT: CalculatorContract = {
  id: "airport_load_v1",
  requiredInputs: ["annualPassengers"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const rawPassengers = Number(inputs.annualPassengers ?? inputs.annual_passengers) || 1000000;
    const annualPassengersMillions =
      rawPassengers >= 1000 ? rawPassengers / 1000000 : rawPassengers;
    const terminalSqFt = Number(inputs.terminalSqFt) || 500000;
    const jetBridges = Number(inputs.jetBridges) || 10;

    const rawClass = String(inputs.airportClass ?? "medium-regional").toLowerCase();
    const AIRPORT_CLASS_MAP: Record<string, string> = {
      "small-regional": "Small Regional",
      "medium-regional": "Medium Regional",
      "large-regional": "Large Regional",
      "major-hub": "Major Hub",
      "mega-hub": "Mega Hub",
    };
    const classification = AIRPORT_CLASS_MAP[rawClass] || "Medium Regional";

    assumptions.push(`${annualPassengersMillions.toFixed(1)}M passengers/year (${classification})`);
    assumptions.push(`Terminal: ${terminalSqFt.toLocaleString()} sq ft, ${jetBridges} jet bridges`);
    if (inputs.cargoFacility && inputs.cargoFacility !== "none")
      assumptions.push(`Cargo: ${inputs.cargoFacility}`);
    if (inputs.evChargers && inputs.evChargers !== "none")
      assumptions.push(`EV chargers: ${inputs.evChargers}`);

    // ── Delegate to SSOT ───────────────────────────────────────────
    const result = calculateUseCasePower("airport", { annualPassengers: rawPassengers });
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // ── TrueQuote kW contributor breakdown ─────────────────────────
    // Airport loads: terminal HVAC, lighting, jet bridges, baggage, ground transport
    const terminalHvacPct = 0.35;
    const terminalLightingPct = 0.15;
    const jetBridgePct = 0.12;
    const baggagePct = 0.1;
    const groundTransportPct = 0.08;
    const controlsPct = 0.05;
    const otherPct = 0.15; // parking, cargo, retail

    const hvacKW = peakLoadKW * terminalHvacPct;
    const lightingKW = peakLoadKW * terminalLightingPct;
    const processKW = peakLoadKW * (jetBridgePct + baggagePct + groundTransportPct);
    const controlsKW = peakLoadKW * controlsPct;
    const otherKW = peakLoadKW * otherPct;
    const kWContributorsTotalKW = hvacKW + lightingKW + processKW + controlsKW + otherKW;

    const dutyCycle = 0.75; // Airports run 18-20+ hours/day
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
        hvacPct: terminalHvacPct * 100,
        lightingPct: terminalLightingPct * 100,
        processPct: (jetBridgePct + baggagePct + groundTransportPct) * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: otherPct * 100,
      },
      details: {
        airport: { annualPassengersMillions, terminalSqFt, jetBridges, classification },
      },
      notes: [
        `Airport: ${annualPassengersMillions.toFixed(1)}M pax → ${peakLoadKW.toLocaleString()} kW peak (FAA benchmark)`,
        `Process: jet bridges (${(jetBridgePct * 100).toFixed(0)}%) + baggage (${(baggagePct * 100).toFixed(0)}%) + ground (${(groundTransportPct * 100).toFixed(0)}%)`,
        `Terminal HVAC: ${terminalHvacPct * 100}%, Lighting: ${terminalLightingPct * 100}%`,
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
 * CASINO SSOT ADAPTER
 *
 * Curated fields: casinoType, gamingFloorSqft, totalPropertySqFt, hotelRooms,
 *   restaurants, entertainmentVenues, poolSpa, parkingGarage, evChargers
 * SSOT: calculateCasinoPower(gamingFloorSqFt)
 * Source: Gaming industry peak demand (18 W/sq ft)
 */
export const CASINO_LOAD_V1_SSOT: CalculatorContract = {
  id: "casino_load_v1",
  requiredInputs: ["gamingFloorSqft"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const gamingFloorSqft =
      Number(
        inputs.gamingFloorSqft ??
          inputs.gamingFloorSqFt ??
          inputs.gamingFloorSize ??
          inputs.gamingSpaceSqFt
      ) || 100000;
    const totalPropertySqFt = Number(inputs.totalPropertySqFt) || gamingFloorSqft * 2;

    // ✅ FIX (Feb 14, 2026): Map button string values → numeric hotel room count
    // Curated buttons: 'none'/'small'/'medium'/'large'/'mega' (NOT numbers)
    const HOTEL_ROOM_MAP: Record<string, number> = {
      none: 0,
      small: 250,    // < 500 rooms → midpoint
      medium: 1000,  // 500-1,500 rooms → midpoint
      large: 2250,   // 1,500-3,000 rooms → midpoint
      mega: 4000,    // 3,000+ rooms
    };
    const rawRooms = inputs.hotelRooms;
    const hotelRooms =
      typeof rawRooms === "string" && rawRooms in HOTEL_ROOM_MAP
        ? HOTEL_ROOM_MAP[rawRooms]
        : rawRooms != null && Number.isFinite(Number(rawRooms))
          ? Number(rawRooms)
          : 0;

    // ✅ FIX (Feb 14, 2026): Map button string values → numeric restaurant count
    // Curated buttons: '1-3'/'4-8'/'9-15'/'15+' (NOT numbers)
    const RESTAURANT_MAP: Record<string, number> = {
      "1-3": 2,
      "4-8": 6,
      "9-15": 12,
      "15+": 20,
    };
    const rawRest = inputs.restaurants;
    const restaurants =
      typeof rawRest === "string" && rawRest in RESTAURANT_MAP
        ? RESTAURANT_MAP[rawRest]
        : rawRest != null && Number.isFinite(Number(rawRest)) && Number(rawRest) > 0
          ? Number(rawRest)
          : 0;

    const casinoType = String(inputs.casinoType ?? "full-resort").toLowerCase();

    assumptions.push(`Gaming floor: ${gamingFloorSqft.toLocaleString()} sq ft (${casinoType})`);
    if (hotelRooms > 0) assumptions.push(`Hotel: ${hotelRooms} rooms`);
    if (restaurants > 0) assumptions.push(`Restaurants: ${restaurants}`);
    if (inputs.entertainmentVenues && inputs.entertainmentVenues !== "none")
      assumptions.push(`Entertainment: ${inputs.entertainmentVenues}`);

    // ── Delegate to SSOT ───────────────────────────────────────────
    const result = calculateUseCasePower("casino", { gamingFloorSqFt: gamingFloorSqft });
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // ── TrueQuote kW contributor breakdown ─────────────────────────
    // Casino: gaming floor (machines+lighting), HVAC (24/7), hotel, restaurants, entertainment
    const gamingMachinesPct = 0.3;
    const hvacPct = 0.25;
    const lightingPct = 0.15;
    const hotelLoadPct = hotelRooms > 0 ? 0.1 : 0;
    const restaurantLoadPct = restaurants > 0 ? 0.05 : 0;
    const controlsPct = 0.05;
    const otherPct =
      1.0 -
      gamingMachinesPct -
      hvacPct -
      lightingPct -
      hotelLoadPct -
      restaurantLoadPct -
      controlsPct;

    const processKW = peakLoadKW * gamingMachinesPct;
    const hvacKW = peakLoadKW * hvacPct;
    const lightingKW = peakLoadKW * lightingPct;
    const controlsKW = peakLoadKW * controlsPct;
    const otherKW = peakLoadKW * Math.max(0.05, otherPct);
    const kWContributorsTotalKW = processKW + hvacKW + lightingKW + controlsKW + otherKW;

    const dutyCycle = 0.9; // Casinos run 24/7
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
        processPct: gamingMachinesPct * 100,
        hvacPct: hvacPct * 100,
        lightingPct: lightingPct * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: Math.max(5, otherPct * 100),
      },
      details: {
        casino: { gamingFloorSqft, totalPropertySqFt, hotelRooms, restaurants, casinoType },
      },
      notes: [
        `Casino: ${gamingFloorSqft.toLocaleString()} sq ft gaming → ${peakLoadKW.toLocaleString()} kW (18 W/sqft benchmark)`,
        `Gaming machines: ${gamingMachinesPct * 100}%, HVAC: ${hvacPct * 100}%, Lighting: ${lightingPct * 100}%`,
        `24/7 operation, duty cycle: ${dutyCycle}`,
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
 * APARTMENT SSOT ADAPTER
 *
 * Curated fields: propertyType, unitCount, avgUnitSize, buildingAge,
 *   hvacType, commonAmenities, laundry, evChargers, elevators
 * SSOT: calculateApartmentPower(unitCount)
 * Source: RECS multifamily benchmark (1.8 kW/unit)
 */
export const APARTMENT_LOAD_V1_SSOT: CalculatorContract = {
  id: "apartment_load_v1",
  requiredInputs: ["unitCount"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const unitCount = Number(inputs.unitCount ?? inputs.numUnits ?? inputs.units) || 400;

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
export const COLLEGE_LOAD_V1_SSOT: CalculatorContract = {
  id: "college_load_v1",
  requiredInputs: ["enrollment"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const enrollment = Number(inputs.enrollment ?? inputs.studentCount ?? inputs.students) || 15000;
    const campusSqFt = Number(inputs.campusSqFt) || 0;
    const institutionType = String(inputs.institutionType ?? "university").toLowerCase();
    const hasResearchLabs =
      inputs.researchLabs && inputs.researchLabs !== "none" && inputs.researchLabs !== "no";
    const hasStudentHousing =
      inputs.studentHousing && inputs.studentHousing !== "none" && inputs.studentHousing !== "no";
    const hasDataCenter =
      inputs.dataCenterHPC && inputs.dataCenterHPC !== "none" && inputs.dataCenterHPC !== "no";

    assumptions.push(`${enrollment.toLocaleString()} students (${institutionType})`);
    if (campusSqFt > 0) assumptions.push(`Campus: ${campusSqFt.toLocaleString()} sq ft`);
    if (hasResearchLabs) assumptions.push(`Research labs: ${inputs.researchLabs}`);
    if (hasStudentHousing) assumptions.push(`Housing: ${inputs.studentHousing}`);
    if (hasDataCenter) assumptions.push(`Data center/HPC: ${inputs.dataCenterHPC}`);

    // ── Delegate to SSOT ───────────────────────────────────────────
    const result = calculateUseCasePower("college", { studentCount: enrollment, enrollment });
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // ── TrueQuote kW contributor breakdown ─────────────────────────
    // College: classrooms, labs, housing, dining, athletics, IT
    const hvacPct = 0.3;
    const lightingPct = 0.15;
    const labsPct = hasResearchLabs ? 0.15 : 0.05;
    const housingPct = hasStudentHousing ? 0.12 : 0;
    const itPct = hasDataCenter ? 0.1 : 0.05;
    const controlsPct = 0.05;
    const otherPct = Math.max(
      0.08,
      1.0 - hvacPct - lightingPct - labsPct - housingPct - itPct - controlsPct
    );

    const hvacKW = peakLoadKW * hvacPct;
    const lightingKW = peakLoadKW * lightingPct;
    const processKW = peakLoadKW * (labsPct + housingPct);
    const controlsKW = peakLoadKW * controlsPct;
    const itLoadKW = peakLoadKW * itPct;
    const otherKW = peakLoadKW * otherPct;
    const kWContributorsTotalKW = hvacKW + lightingKW + processKW + controlsKW + itLoadKW + otherKW;

    const dutyCycle = 0.5; // Campus: heavy daytime, light evenings/weekends
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
        cooling: 0,
        charging: 0,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        hvacPct: hvacPct * 100,
        lightingPct: lightingPct * 100,
        processPct: (labsPct + housingPct) * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: itPct * 100,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: otherPct * 100,
      },
      details: {
        college: {
          enrollment,
          campusSqFt,
          institutionType,
          hasResearchLabs,
          hasStudentHousing,
          hasDataCenter,
        },
      },
      notes: [
        `College: ${enrollment.toLocaleString()} students × 0.5 kW → ${peakLoadKW.toLocaleString()} kW (AASHE benchmark)`,
        `Labs: ${(labsPct * 100).toFixed(0)}%, Housing: ${(housingPct * 100).toFixed(0)}%, IT: ${(itPct * 100).toFixed(0)}%`,
        `Campus duty cycle: ${dutyCycle} (daytime-heavy, light weekends)`,
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
 * COLD STORAGE SSOT ADAPTER
 *
 * Curated fields: facilityType, squareFootage, temperatureZones, dockDoors,
 *   compressorSystem, operatingHours, defrostCycles, materialHandling, throughput
 * SSOT: calculateUseCasePower("cold-storage", ...) → calculateWarehousePower(sqFt, true)
 * Source: CBECS cold storage benchmark (8 W/sq ft refrigerated)
 */
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
export const GOVERNMENT_LOAD_V1_SSOT: CalculatorContract = {
  id: "government_load_v1",
  requiredInputs: ["squareFootage"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // ── Bridge curated → SSOT fields ───────────────────────────────
    const squareFootage =
      Number(inputs.squareFootage ?? inputs.buildingSqFt ?? inputs.sqFt) || 75000;
    const facilityType = String(inputs.facilityType ?? "office-building").toLowerCase();
    const campusOrStandalone = String(inputs.campusOrStandalone ?? "standalone").toLowerCase();
    const hasCriticalOps =
      inputs.criticalOperations &&
      inputs.criticalOperations !== "none" &&
      inputs.criticalOperations !== "no";
    const hasDataCenter =
      inputs.dataCenter && inputs.dataCenter !== "none" && inputs.dataCenter !== "no";
    const hasEVFleet = inputs.evFleet && inputs.evFleet !== "none" && inputs.evFleet !== "no";
    const operatingHours = String(inputs.operatingHours ?? "standard").toLowerCase();

    assumptions.push(`Government: ${squareFootage.toLocaleString()} sq ft (${facilityType})`);
    assumptions.push(`Configuration: ${campusOrStandalone}, hours: ${operatingHours}`);
    if (hasCriticalOps) assumptions.push(`Critical operations: ${inputs.criticalOperations}`);
    if (hasDataCenter) assumptions.push(`Data center: ${inputs.dataCenter}`);
    if (hasEVFleet) assumptions.push(`EV fleet: ${inputs.evFleet}`);

    // ── Delegate to SSOT ───────────────────────────────────────────
    const result = calculateUseCasePower("government", {
      squareFeet: squareFootage,
      buildingSqFt: squareFootage,
      sqFt: squareFootage,
    });
    const peakLoadKW = Math.round(result.powerMW * 1000);

    // ── TrueQuote kW contributor breakdown ─────────────────────────
    // Government: similar to office but higher security/IT loads
    const hvacPct = 0.35;
    const lightingPct = 0.15;
    const itPct = hasDataCenter ? 0.15 : 0.08;
    const securityPct = hasCriticalOps ? 0.1 : 0.05;
    const evFleetPct = hasEVFleet ? 0.08 : 0;
    const controlsPct = 0.05;
    const otherPct = Math.max(
      0.05,
      1.0 - hvacPct - lightingPct - itPct - securityPct - evFleetPct - controlsPct
    );

    const hvacKW = peakLoadKW * hvacPct;
    const lightingKW = peakLoadKW * lightingPct;
    const itLoadKW = peakLoadKW * itPct;
    const processKW = peakLoadKW * securityPct;
    const chargingKW = peakLoadKW * evFleetPct;
    const controlsKW = peakLoadKW * controlsPct;
    const otherKW = peakLoadKW * otherPct;
    const kWContributorsTotalKW =
      hvacKW + lightingKW + itLoadKW + processKW + chargingKW + controlsKW + otherKW;

    // Duty cycle: standard office hours unless 24/7 ops
    const is24x7 =
      operatingHours.includes("24") || operatingHours.includes("always") || hasCriticalOps;
    const dutyCycle = is24x7 ? 0.7 : 0.45;
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
        cooling: 0,
        charging: chargingKW,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        hvacPct: hvacPct * 100,
        lightingPct: lightingPct * 100,
        processPct: securityPct * 100,
        controlsPct: controlsPct * 100,
        itLoadPct: itPct * 100,
        coolingPct: 0,
        chargingPct: evFleetPct * 100,
        otherPct: otherPct * 100,
      },
      details: {
        government: {
          squareFootage,
          facilityType,
          campusOrStandalone,
          hasCriticalOps,
          hasDataCenter,
          hasEVFleet,
          operatingHours,
        },
      },
      notes: [
        `Government: ${squareFootage.toLocaleString()} sq ft → ${peakLoadKW.toLocaleString()} kW (FEMP 1.5 W/sqft)`,
        `IT: ${(itPct * 100).toFixed(0)}%, Security: ${(securityPct * 100).toFixed(0)}%${hasEVFleet ? `, EV fleet: ${(evFleetPct * 100).toFixed(0)}%` : ""}`,
        `Duty cycle: ${dutyCycle} (${is24x7 ? "24/7 operations" : "standard business hours"})`,
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
  // Generic adapter — ONLY for "other"/"auto"/"unknown" industries
  // All real industries MUST have dedicated adapters with TrueQuote envelopes
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
  [TRUCK_STOP_LOAD_V1_SSOT.id]: TRUCK_STOP_LOAD_V1_SSOT,
  [GAS_STATION_LOAD_V1_SSOT.id]: GAS_STATION_LOAD_V1_SSOT,

  // NEW: 9 dedicated adapters replacing generic fallback (Feb 14, 2026)
  [AIRPORT_LOAD_V1_SSOT.id]: AIRPORT_LOAD_V1_SSOT,
  [CASINO_LOAD_V1_SSOT.id]: CASINO_LOAD_V1_SSOT,
  [APARTMENT_LOAD_V1_SSOT.id]: APARTMENT_LOAD_V1_SSOT,
  [COLLEGE_LOAD_V1_SSOT.id]: COLLEGE_LOAD_V1_SSOT,
  [COLD_STORAGE_LOAD_V1_SSOT.id]: COLD_STORAGE_LOAD_V1_SSOT,
  [INDOOR_FARM_LOAD_V1_SSOT.id]: INDOOR_FARM_LOAD_V1_SSOT,
  [AGRICULTURE_LOAD_V1_SSOT.id]: AGRICULTURE_LOAD_V1_SSOT,
  [RESIDENTIAL_LOAD_V1_SSOT.id]: RESIDENTIAL_LOAD_V1_SSOT,
  [GOVERNMENT_LOAD_V1_SSOT.id]: GOVERNMENT_LOAD_V1_SSOT,
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
