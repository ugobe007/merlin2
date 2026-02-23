import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

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
