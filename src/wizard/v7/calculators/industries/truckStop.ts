import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

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
