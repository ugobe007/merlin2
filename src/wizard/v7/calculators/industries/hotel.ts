import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const HOTEL_LOAD_V1_SSOT: CalculatorContract = {
  id: "hotel_load_v1",
  requiredInputs: ["roomCount", "hotelClass", "occupancyRate"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // 1. Parse inputs — bridge curated config IDs → calculator field names
    // Curated sends: numRooms, hotelCategory, occupancyRate, poolOnSite, restaurantOnSite, spaOnSite, laundryOnSite
    const _rawRoomCount = inputs.roomCount ?? inputs.numRooms;
    const roomCount = _rawRoomCount != null ? Number(_rawRoomCount) || 150 : 150;
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
      hotelAmenities = inputs.hotelAmenities.map(String);
    } else {
      // Pool: curated sends "indoor"/"outdoor"/"both"/"none"; template sends boolean
      const poolVal = inputs.pool_on_site ?? inputs.poolOnSite;
      if (poolVal && poolVal !== "none" && poolVal !== "no")
        hotelAmenities.push("pool");
      // Spa: curated sends "full-spa"/"fitness-only"/"both"/"none"; template sends boolean
      const spaVal = inputs.spa_on_site ?? inputs.spaOnSite;
      if (spaVal && spaVal !== "none" && spaVal !== "no")
        hotelAmenities.push("spa");
      // Restaurant: curated sends "full-service"/"breakfast-only"/"bar-lounge"/"none"
      const restVal = inputs.restaurant_on_site ?? inputs.restaurantOnSite;
      if (restVal && restVal !== "none" && restVal !== "no")
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
        laundryVal !== "no"
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
