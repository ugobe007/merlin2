/**
 * CALCULATOR REGISTRY
 * ===================
 *
 * Created: January 26, 2026
 * Purpose: Registry of all calculator contracts with adapters
 *
 * DESIGN:
 * - Option A: 16Q calculators (primary path - clean, fast iteration)
 * - Option B: SSOT power calcs (fallback - backward compat, sanity check)
 * - Contract layer makes both look identical to orchestrator
 *
 * ADAPTERS:
 * - Wrap existing calculators with CalculatorContract interface
 * - Coerce inputs safely (num, bool, str helpers)
 * - Normalize outputs to CalcRunResult
 * - Preserve raw outputs for industry-specific details
 *
 * VERSIONING:
 * - Calculator ID forms stable contract (dc_load_v1)
 * - Breaking changes require new version (dc_load_v2)
 * - Templates bind to specific calculator versions
 */

import type { CalculatorContract, CalcInputs, CalcRunResult } from "./contract";

// Option A: 16Q calculators (preferred)
import { calculateCarWash16Q } from "@/services/calculators/carWash16QCalculator";

// Option B: SSOT power calcs (backward compat / fallback)
import { calculateDatacenterPower } from "@/services/useCasePowerCalculations";

// ========== TYPE COERCION HELPERS ==========

/**
 * Safely coerce to number
 * @returns number | undefined (never NaN)
 */
function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * Safely coerce to boolean
 * @returns boolean | undefined
 */
function bool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  return undefined;
}

/**
 * Safely coerce to string
 * @returns string | undefined
 */
function str(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  return undefined;
}

/**
 * Require numeric input with warning if missing/invalid
 * @returns number (0 if missing)
 */
function requireNum(inputs: CalcInputs, key: string, warnings: string[]): number {
  const v = inputs[key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    warnings.push(`Missing/invalid numeric input: ${key}`);
    return 0;
  }
  return v;
}

/**
 * Track defaulted values as assumptions + warnings
 * @returns the default value
 */
function defaulted(
  label: string,
  value: string,
  assumptions: string[],
  warnings: string[]
): string {
  assumptions.push(`${label}: defaulted to ${value}`);
  warnings.push(`Defaulted: ${label}=${value}`);
  return value;
}

// ========== CALCULATOR CONTRACTS ==========

/**
 * DATA CENTER LOAD V1 (16Q Calculator)
 *
 * PRIMARY PATH: Uses dataCenter16QCalculator.ts
 * INPUTS: 18 questions covering power, redundancy, cooling, tariffs
 * OUTPUTS: baseLoadKW, peakLoadKW, energyKWhPerDay + raw details
 */
export const DC_LOAD_V1_16Q: CalculatorContract = {
  id: "dc_load_v1",
  requiredInputs: [
    "it_load_kw",
    "peak_it_load_kw",
    "avg_utilization_pct",
    "growth_pct_24mo",
    "power_capacity_kw",
    "tier",
    "redundancy",
    "required_runtime_min",
    "generator_present",
    "ups_present",
    "cooling_type",
    "pue",
    "cooling_peak_kw",
    "monthly_kwh",
    "demand_charge",
    "demand_charge_rate",
  ] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // USE ACTUAL DATABASE FIELDS (TrueQuote Policy)
    // Database has: itLoadCapacity (string), currentPUE (string), itUtilization (string)
    const itLoadCapacity = str(inputs.itLoadCapacity) || "500-1000";
    const currentPUE = str(inputs.currentPUE) || "1.3-1.5";
    const itUtilization = str(inputs.itUtilization) || "60-80%";
    const dataCenterTier = str(inputs.dataCenterTier) || "tier_3";

    // Parse IT load capacity range to midpoint
    const parseITLoad = (range: string): number => {
      const map: Record<string, number> = {
        "100-500": 300,
        "500-1000": 750,
        "1000-2500": 1750,
        "2500-5000": 3750,
        "5000+": 7500,
      };
      return map[range] || 750; // Default to 750 kW
    };

    // Parse PUE range to midpoint
    const parsePUE = (range: string): number => {
      const map: Record<string, number> = {
        "<1.3": 1.2,
        "1.3-1.5": 1.4,
        "1.5-1.8": 1.65,
        "1.8-2.0": 1.9,
        ">2.0": 2.2,
      };
      return map[range] || 1.5; // Default to 1.5
    };

    // Parse utilization % to decimal
    const parseUtilization = (range: string): number => {
      const map: Record<string, number> = {
        "<40%": 0.35,
        "40-60%": 0.5,
        "60-80%": 0.7,
        "80-95%": 0.875,
        ">95%": 0.975,
      };
      return map[range] || 0.7; // Default to 70%
    };

    const itLoadKW = parseITLoad(itLoadCapacity);
    const pue = parsePUE(currentPUE);
    const utilization = parseUtilization(itUtilization);

    // Calculate loads
    const baseLoadKW = Math.round(itLoadKW * utilization);
    const peakLoadKW = Math.round(itLoadKW * pue); // Peak IT × PUE
    const energyKWhPerDay = Math.round(baseLoadKW * 24);

    assumptions.push(`IT load: ${itLoadCapacity} kW (using ${itLoadKW} kW midpoint)`);
    assumptions.push(`Utilization: ${itUtilization} (using ${Math.round(utilization * 100)}%)`);
    assumptions.push(`PUE: ${currentPUE} (using ${pue.toFixed(2)})`);
    assumptions.push(`Tier: ${dataCenterTier}`);

    // Sanity checks
    if (pue < 1.05 || pue > 2.5) {
      warnings.push(`PUE out of normal range: ${pue.toFixed(2)}`);
    }
    if (peakLoadKW < baseLoadKW) {
      warnings.push(`Peak (${peakLoadKW} kW) < base (${baseLoadKW} kW)`);
    }

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay,
      assumptions,
      warnings,
      raw: { itLoadCapacity, currentPUE, itUtilization, itLoadKW, pue, utilization },
    };
  },
};

/**
 * DATA CENTER POWER (SSOT Fallback)
 *
 * FALLBACK PATH: Uses useCasePowerCalculations.ts
 * INPUTS: Minimal (just it_load_kw)
 * OUTPUTS: Coarse power estimate for sanity check
 *
 * USE CASE: Backward compatibility, quick estimates, cross-validation
 */
export const DC_POWER_SSOT: CalculatorContract = {
  id: "dc_power_ssot_v1",
  requiredInputs: ["it_load_kw"] as const,
  compute: (inputs: CalcInputs): CalcRunResult => {
    const itLoadKW = num(inputs.it_load_kw) ?? 0;

    // Call SSOT calculator (coarse estimate)
    const powerKW = calculateDatacenterPower(itLoadKW, {});

    return {
      baseLoadKW: powerKW,
      peakLoadKW: powerKW, // SSOT doesn't differentiate base/peak
      raw: { powerKW },
    };
  },
};

/**
 * HOTEL LOAD V1 (16Q Calculator)
 *
 * PRIMARY PATH: Uses hotel16QCalculator.ts
 * INPUTS: 18 questions covering rooms, amenities, HVAC, tariffs
 * OUTPUTS: baseLoadKW, peakLoadKW, energyKWhPerDay + raw details
 *
 * NOTE: Type casts required to adapt between template numeric inputs
 * and 16Q calculator's string range expectations (e.g., "100-150")
 */
export const HOTEL_LOAD_V1_16Q: CalculatorContract = {
  id: "hotel_load_v1",
  requiredInputs: [
    "room_count",
    "occupancy_avg_pct",
    "occupancy_peak_pct",
    "laundry_on_site",
    "kitchen_type",
    "restaurant_on_site",
    "bar_on_site",
    "pool_on_site",
    "spa_on_site",
    "conference_sqft",
    "hvac_type",
    "has_electric_hot_water",
    "monthly_kwh",
    "peak_demand_kw",
    "demand_charge",
    "demand_charge_rate",
  ] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const assumptions: string[] = [];
    const warnings: string[] = [];

    // USE ACTUAL DATABASE FIELDS (TrueQuote Policy)
    // Database has: roomCount (number), hotelAmenities (array), occupancyRate (number)
    const roomCount = num(inputs.roomCount) || 150;
    const occupancyRate = num(inputs.occupancyRate) || 70;
    const hotelClass = str(inputs.hotelClass) || "midscale";
    const hotelAmenities = Array.isArray(inputs.hotelAmenities) ? inputs.hotelAmenities : [];

    // Base load per room (lighting, TV, mini-fridge)
    const baseLoadPerRoom = 0.5; // kW per room

    // Peak load per room varies by hotel class
    const peakLoadPerRoomByClass: Record<string, number> = {
      economy: 2.5,
      midscale: 3.5,
      upscale: 4.5,
      luxury: 6.0,
    };
    const peakLoadPerRoom = peakLoadPerRoomByClass[hotelClass] || 3.5;

    // Base load = rooms + common areas
    let baseLoadKW = roomCount * baseLoadPerRoom;
    baseLoadKW += 20; // Lighting
    baseLoadKW += 15; // Elevators
    baseLoadKW += 10; // IT/POS

    // Peak load = occupied rooms + amenities
    const occupancyPct = occupancyRate / 100;
    let peakLoadKW = roomCount * occupancyPct * peakLoadPerRoom;
    peakLoadKW += baseLoadKW;

    // Parse amenities from array
    const amenitiesStr = hotelAmenities
      .map((a) => str(a) || "")
      .join(",")
      .toLowerCase();

    if (amenitiesStr.includes("laundry")) {
      peakLoadKW += 50;
      assumptions.push("Laundry: +50 kW");
    }
    if (amenitiesStr.includes("pool") || amenitiesStr.includes("swimming")) {
      peakLoadKW += 30;
      assumptions.push("Pool: +30 kW");
    }
    if (amenitiesStr.includes("spa") || amenitiesStr.includes("fitness")) {
      peakLoadKW += 25;
      assumptions.push("Spa/Fitness: +25 kW");
    }
    if (amenitiesStr.includes("restaurant") || amenitiesStr.includes("kitchen")) {
      peakLoadKW += 60;
      assumptions.push("Restaurant: +60 kW");
    }
    if (amenitiesStr.includes("bar") || amenitiesStr.includes("lounge")) {
      peakLoadKW += 15;
      assumptions.push("Bar: +15 kW");
    }
    if (amenitiesStr.includes("conference") || amenitiesStr.includes("meeting")) {
      peakLoadKW += 40;
      assumptions.push("Conference: +40 kW");
    }

    // Round values
    baseLoadKW = Math.round(baseLoadKW);
    peakLoadKW = Math.round(peakLoadKW);

    // Daily energy
    const avgLoadKW = baseLoadKW + roomCount * occupancyPct * peakLoadPerRoom * 0.6;
    const energyKWhPerDay = Math.round(avgLoadKW * 24);

    assumptions.push(`${roomCount} rooms (${hotelClass})`);
    assumptions.push(`Occupancy: ${occupancyRate}%`);
    assumptions.push(`Peak: ${peakLoadPerRoom} kW/room`);

    // Sanity checks
    if (peakLoadKW < baseLoadKW) {
      warnings.push(`Peak < base load`);
    }
    const kWhPerRoom = energyKWhPerDay / roomCount;
    if (kWhPerRoom < 20 || kWhPerRoom > 150) {
      warnings.push(`Energy/room: ${Math.round(kWhPerRoom)} kWh/day`);
    }

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay,
      assumptions,
      warnings,
      raw: { roomCount, occupancyRate, hotelClass, amenities: hotelAmenities },
    };
  },
};

/**
 * CAR WASH LOAD V1 (16Q Calculator)
 *
 * PRIMARY PATH: Uses carWash16QCalculator.ts
 * INPUTS: 18 questions covering wash type, equipment, throughput, tariffs
 * OUTPUTS: baseLoadKW, peakLoadKW, energyKWhPerDay + raw details
 *
 * NOTE: Type casts required to adapt between template numeric inputs
 * and 16Q calculator's string range expectations
 */
export const CAR_WASH_LOAD_V1_16Q: CalculatorContract = {
  id: "car_wash_load_v1",
  requiredInputs: [
    "wash_type",
    "bay_count",
    "tunnel_length_ft",
    "cars_per_day_avg",
    "cars_per_hour_peak",
    "operating_hours_per_day",
    "days_per_week",
    "dryer_present",
    "dryer_kw",
    "water_heating_type",
    "uses_hot_water",
    "reclaim_system",
    "vacuum_count",
    "vacuum_kw_each",
    "monthly_kwh",
    "peak_demand_kw",
    "demand_charge",
    "demand_charge_rate",
  ] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // Extract all input values
    const bayCount = requireNum(inputs, "bay_count", warnings) || 1;
    const carsPerDay = requireNum(inputs, "cars_per_day_avg", warnings) || 200;
    const carsPerHour = requireNum(inputs, "cars_per_hour_peak", warnings) || 30;
    const operatingHoursPerDay = requireNum(inputs, "operating_hours_per_day", warnings) || 12;
    const daysPerWeek = requireNum(inputs, "days_per_week", warnings) || 7;
    const monthlyKwh = requireNum(inputs, "monthly_kwh", warnings);
    const dryerKW = requireNum(inputs, "dryer_kw", warnings) || 40;
    const vacuumCount = requireNum(inputs, "vacuum_count", warnings) || 8;
    const vacuumKWEach = requireNum(inputs, "vacuum_kw_each", warnings) || 2.5;
    const waterHeatingType = str(inputs.water_heating_type) || "gas";
    const usesHotWater = bool(inputs.uses_hot_water);
    const reclaimSystem = bool(inputs.reclaim_system);

    // DIRECT BOTTOM-UP CALCULATION (not bucketed)
    // This is more accurate than the 16Q calculator's bucketed approach

    // Base loads (always running)
    let baseLoadKW = 0;
    baseLoadKW += 5; // Lighting
    baseLoadKW += 2; // POS/Controls
    if (reclaimSystem) baseLoadKW += 10; // RO system

    // Peak loads (equipment that runs during washes)
    let peakLoadKW = baseLoadKW;

    // Wash equipment (scales with bay count)
    peakLoadKW += 30 * bayCount; // High-pressure pumps (30 kW per bay)
    peakLoadKW += 15 * bayCount; // Conveyors/rollers (15 kW per bay)

    // Dryer load (from direct input)
    if (bool(inputs.dryer_present)) {
      peakLoadKW += dryerKW;
      assumptions.push(`Dryer load: ${dryerKW} kW from equipment specs`);
    }

    // Vacuum load (from direct input)
    const totalVacuumKW = vacuumCount * vacuumKWEach;
    peakLoadKW += totalVacuumKW;
    assumptions.push(
      `Vacuum load: ${vacuumCount} stations × ${vacuumKWEach} kW = ${totalVacuumKW} kW`
    );

    // Water heating (if electric)
    if (waterHeatingType === "Electric" && usesHotWater) {
      const heaterKW = 50 * bayCount; // 50 kW per bay for electric heaters
      peakLoadKW += heaterKW;
      assumptions.push(`Electric water heating: ${heaterKW} kW`);
    }

    // Calculate duty cycle and daily energy
    const washesPerDay = carsPerDay;
    const avgCycleDuration = 4; // minutes (reasonable for tunnel/automatic)
    const dutyCycle = (washesPerDay * avgCycleDuration) / (operatingHoursPerDay * 60);
    const clampedDutyCycle = Math.min(0.95, Math.max(0.1, dutyCycle)); // 10-95%

    const energyKWhPerDay = peakLoadKW * clampedDutyCycle * operatingHoursPerDay;

    assumptions.push(
      `Duty cycle: ${Math.round(clampedDutyCycle * 100)}% based on ${washesPerDay} washes/day`
    );
    assumptions.push(
      `Daily operation: ${operatingHoursPerDay} hours/day, ${daysPerWeek} days/week`
    );

    // For validation, still call 16Q calculator but don't use its load values
    const result16Q = calculateCarWash16Q({
      carWashType:
        str(inputs.wash_type) === "Tunnel (single)" ? "conveyor_tunnel" : "automatic_inbay",
      bayTunnelCount: (bayCount === 1
        ? "1"
        : bayCount <= 3
          ? "2-3"
          : bayCount <= 6
            ? "4-6"
            : "7+") as "1" | "2-3" | "4-6" | "7+",
      electricalServiceSize: "400",
      voltageLevel: "208",
      primaryEquipment: bool(inputs.dryer_present)
        ? ["blower_dryer", "vacuum_system"]
        : ["vacuum_system"],
      largestMotorSize: "<10",
      simultaneousEquipment: "3-4",
      averageWashesPerDay: (carsPerDay < 30
        ? "<30"
        : carsPerDay < 75
          ? "30-75"
          : carsPerDay < 150
            ? "75-150"
            : carsPerDay < 300
              ? "150-300"
              : "300+") as "<30" | "30-75" | "75-150" | "150-300" | "300+",
      peakHourThroughput: (carsPerHour < 10
        ? "<10"
        : carsPerHour < 25
          ? "10-25"
          : carsPerHour < 50
            ? "25-50"
            : "50+") as "<10" | "10-25" | "25-50" | "50+",
      washCycleDuration: "3-5",
      operatingHours: (operatingHoursPerDay < 8
        ? "<8"
        : operatingHoursPerDay <= 12
          ? "8-12"
          : operatingHoursPerDay <= 18
            ? "12-18"
            : "18-24") as "<8" | "8-12" | "12-18" | "18-24",
      monthlyElectricitySpend: monthlyKwh ? `${Math.floor(monthlyKwh * 0.12)}` : "3000-7500",
      utilityRateStructure: bool(inputs.demand_charge) ? "demand" : "flat",
      powerQualityIssues: [],
      outageSensitivity: "operations_stop",
      expansionPlans: [],
    });

    return {
      baseLoadKW: Math.round(baseLoadKW),
      peakLoadKW: Math.round(peakLoadKW),
      energyKWhPerDay: Math.round(energyKWhPerDay),
      assumptions,
      warnings,
      raw: { ...result16Q, directCalculation: true },
    };
  },
};

// ========== REGISTRY ==========

/**
 * Calculator Registry
 *
 * LOOKUP: Templates use calculator.id to find contract
 * VALIDATION: validator.ts ensures template matches contract
 * EXECUTION: orchestrator calls contract.compute(inputs)
 */
export const CALCULATORS_BY_ID: Record<string, CalculatorContract> = {
  [DC_LOAD_V1_16Q.id]: DC_LOAD_V1_16Q,
  [DC_POWER_SSOT.id]: DC_POWER_SSOT,
  [HOTEL_LOAD_V1_16Q.id]: HOTEL_LOAD_V1_16Q,
  [CAR_WASH_LOAD_V1_16Q.id]: CAR_WASH_LOAD_V1_16Q,
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
