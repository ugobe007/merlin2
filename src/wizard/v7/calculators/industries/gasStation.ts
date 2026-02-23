import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

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
