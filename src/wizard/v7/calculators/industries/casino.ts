import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

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
    // Include hotel + restaurant kW in 'other' so all power is accounted for
    const hotelRestaurantPct = hotelLoadPct + restaurantLoadPct;
    const otherKW = peakLoadKW * Math.max(0.05, otherPct + hotelRestaurantPct);
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
        otherPct: peakLoadKW > 0 ? (otherKW / peakLoadKW) * 100 : Math.max(5, otherPct * 100),
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
