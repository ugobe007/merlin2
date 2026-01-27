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
import { calculateDataCenter16Q } from "@/services/calculators/dataCenter16QCalculator";
import { calculateHotel16Q } from "@/services/calculators/hotel16QCalculator";
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
    // Adapt canonical inputs → DataCenter16QInput
    const itLoadKW = num(inputs.it_load_kw);
    const peakItKW = num(inputs.peak_it_load_kw);
    const pue = num(inputs.pue);
    const monthlyKwh = num(inputs.monthly_kwh);

    // Map tier from template format to calculator format
    const tierMapping: Record<string, "tier1" | "tier2" | "tier3" | "tier4"> = {
      "Tier I": "tier1",
      "Tier II": "tier2",
      "Tier III": "tier3",
      "Tier IV": "tier4",
      tier1: "tier1",
      tier2: "tier2",
      tier3: "tier3",
      tier4: "tier4",
    };
    const tierStr = str(inputs.tier) ?? "Tier III";
    const dataCenterTier = tierMapping[tierStr] ?? "tier3";

    // Defensive checks (validator should prevent most of this)
    const warnings: string[] = [];
    if (itLoadKW === undefined) warnings.push("Missing it_load_kw");
    if (peakItKW === undefined) warnings.push("Missing peak_it_load_kw");
    if (pue === undefined) warnings.push("Missing pue");
    if (monthlyKwh === undefined) warnings.push("Missing monthly_kwh");

    // Call 16Q calculator
    const result = calculateDataCenter16Q({
      dataCenterTier,
      itLoadKW: itLoadKW ?? 0,
      peakItLoadKW: peakItKW ?? itLoadKW ?? 0,
      avgUtilizationPct: num(inputs.avg_utilization_pct) ?? 0,
      growthPct24mo: num(inputs.growth_pct_24mo) ?? 0,
      powerCapacityKW: num(inputs.power_capacity_kw) ?? 0,
      tier: str(inputs.tier) ?? "Tier III",
      redundancy: str(inputs.redundancy) ?? "N+1",
      requiredRuntimeMin: num(inputs.required_runtime_min) ?? 0,
      generatorPresent: bool(inputs.generator_present) ?? false,
      generatorKW: num(inputs.generator_kw) ?? 0,
      upsPresent: bool(inputs.ups_present) ?? false,
      upsRuntimeMin: num(inputs.ups_runtime_min) ?? 0,
      coolingType: str(inputs.cooling_type) ?? "Other",
      pue: pue ?? 1.0,
      coolingPeakKW: num(inputs.cooling_peak_kw) ?? 0,
      monthlyKwh: monthlyKwh ?? 0,
      demandCharge: bool(inputs.demand_charge) ?? false,
      demandChargeRate: num(inputs.demand_charge_rate) ?? 0,
    });

    // Range sanity checks
    const pueValue = pue ?? 1.5;
    if (pueValue < 1.05 || pueValue > 2.5) {
      warnings.push(`PUE out of normal range: ${pueValue.toFixed(2)} (expected 1.05-2.5)`);
    }
    if (result.peakKW < result.baseLoadKW) {
      warnings.push(
        `Peak load (${result.peakKW} kW) < base load (${result.baseLoadKW} kW) - unusual`
      );
    }
    const expectedMinDaily = result.baseLoadKW * 12;
    if (result.loadProfile.dailyKWh < expectedMinDaily) {
      warnings.push(
        `Daily kWh (${result.loadProfile.dailyKWh}) seems low for base load (expected >${expectedMinDaily.toFixed(0)})`
      );
    }

    // Normalize to CalcRunResult
    return {
      baseLoadKW: result.baseLoadKW,
      peakLoadKW: result.peakKW,
      energyKWhPerDay: result.loadProfile.dailyKWh,
      assumptions: [result.methodology],
      warnings: [...warnings, ...result.warnings],
      raw: result, // Preserve full 16Q output for industry-specific details
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

    const roomCount = num(inputs.room_count);
    const monthlyKwh = num(inputs.monthly_kwh);
    const peakDemandKW = num(inputs.peak_demand_kw);

    if (roomCount === undefined) warnings.push("Missing room_count");
    if (monthlyKwh === undefined) warnings.push("Missing monthly_kwh");
    if (peakDemandKW === undefined) warnings.push("Missing peak_demand_kw");

    // Map simplified template inputs to Hotel16QInput (best effort)
    // Note: Hotel16Q expects ranges like '100-150', but template uses raw numbers
    const roomCountStr = roomCount ? `${Math.floor(roomCount)}` : "100-150";

    // Build amenities array from boolean flags
    const amenities: string[] = [];
    if (bool(inputs.pool_on_site)) amenities.push("pool");
    if (bool(inputs.restaurant_on_site)) amenities.push("restaurant");
    if (bool(inputs.spa_on_site)) amenities.push("spa", "fitness_center");
    if (bool(inputs.laundry_on_site)) amenities.push("laundry_onsite");
    if (num(inputs.conference_sqft) && num(inputs.conference_sqft)! > 0)
      amenities.push("conference_center");
    if (str(inputs.kitchen_type) === "Full commercial") amenities.push("kitchen");

    // Map HVAC types (best effort)
    let hvacSystem: "window_units" | "central_ac" | "vrf_vav" | "geothermal" | "mixed" =
      "central_ac";
    const hvacType = str(inputs.hvac_type);
    if (hvacType === "VRF/Heat pump") hvacSystem = "vrf_vav";
    else if (hvacType === "Chiller plant") hvacSystem = "central_ac";
    else if (hvacType === "Packaged RTU") hvacSystem = "central_ac";

    // Map water heating
    let waterHeating:
      | "electric_tank"
      | "electric_on_demand"
      | "gas"
      | "solar_thermal"
      | "heat_pump" = "electric_tank";
    if (bool(inputs.has_electric_hot_water)) {
      waterHeating = "electric_tank";
    } else {
      waterHeating = "gas";
    }

    // Call 16Q calculator with adapted inputs
    const result = calculateHotel16Q({
      hotelClass: defaulted(
        "hotelClass",
        "midscale",
        assumptions,
        warnings
      ) as unknown as Parameters<typeof calculateHotel16Q>[0]["hotelClass"],
      roomCount: roomCountStr as unknown as Parameters<typeof calculateHotel16Q>[0]["roomCount"],
      electricalServiceSize: defaulted("electricalServiceSize", "1600", assumptions, warnings),
      voltageLevel: defaulted(
        "voltageLevel",
        "480_3phase",
        assumptions,
        warnings
      ) as unknown as Parameters<typeof calculateHotel16Q>[0]["voltageLevel"],
      majorAmenities: amenities,
      hvacSystem,
      waterHeating,
      averageOccupancy: `${num(inputs.occupancy_avg_pct) ?? 70}%` as unknown as Parameters<
        typeof calculateHotel16Q
      >[0]["averageOccupancy"],
      peakSeasonMonths: defaulted("peakSeasonMonths", "7-9", assumptions, warnings),
      operatingHours: defaulted(
        "operatingHours",
        "full_service_24hr",
        assumptions,
        warnings
      ) as unknown as Parameters<typeof calculateHotel16Q>[0]["operatingHours"],
      peakCheckInTime: defaulted(
        "peakCheckInTime",
        "afternoon",
        assumptions,
        warnings
      ) as unknown as Parameters<typeof calculateHotel16Q>[0]["peakCheckInTime"],
      monthlyElectricitySpend: monthlyKwh
        ? `${Math.floor(monthlyKwh * 0.12)}`
        : defaulted("monthlyElectricitySpend", "15000-30000", assumptions, warnings),
      utilityRateStructure: bool(inputs.demand_charge) ? "demand" : "flat",
      backupPowerNeeds: ["emergency_lighting", "fire_safety"],
      outageSensitivity: "high",
      expansionPlans: [],
    });

    return {
      baseLoadKW: result.baseLoadKW,
      peakLoadKW: result.peakKW,
      energyKWhPerDay: result.loadProfile?.dailyKWh,
      assumptions: [...assumptions, ...(result.auditTrail?.map((a) => a.description) ?? [])],
      warnings,
      raw: result,
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

    // Adapter completeness checks
    const bayCount = requireNum(inputs, "bay_count", warnings);
    const carsPerDay = requireNum(inputs, "cars_per_day_avg", warnings);
    const monthlyKwh = requireNum(inputs, "monthly_kwh", warnings);

    // Map wash type
    let carWashType:
      | "self_serve"
      | "automatic_inbay"
      | "conveyor_tunnel"
      | "combination"
      | "other" = "automatic_inbay";
    const washType = str(inputs.wash_type);
    if (washType === "Self-serve bays") carWashType = "self_serve";
    else if (washType === "In-bay automatic") carWashType = "automatic_inbay";
    else if (washType === "Tunnel (single)") carWashType = "conveyor_tunnel";

    // Map bay count to range string
    const bayCountStr =
      bayCount === 1 ? "1" : bayCount! <= 3 ? "2-3" : bayCount! <= 6 ? "4-6" : "7+";

    // Build equipment array
    const equipment: string[] = [];
    if (bool(inputs.dryer_present)) equipment.push("blower_dryer");
    if (bool(inputs.reclaim_system)) equipment.push("reclaim_system");
    if (num(inputs.vacuum_count) && num(inputs.vacuum_count)! > 0) equipment.push("vacuum_system");
    if (bool(inputs.air_compressor_present)) equipment.push("air_compressor");
    if (str(inputs.water_heating_type) === "Electric") equipment.push("water_heater");

    // Call 16Q calculator
    const result = calculateCarWash16Q({
      carWashType,
      bayTunnelCount: bayCountStr as unknown as Parameters<
        typeof calculateCarWash16Q
      >[0]["bayTunnelCount"],
      electricalServiceSize: "400", // Default
      voltageLevel: "208", // Default
      primaryEquipment: equipment,
      largestMotorSize: "<10", // Default
      simultaneousEquipment: "3-4", // Default
      averageWashesPerDay: carsPerDay! < 30 ? "<30" : carsPerDay! < 75 ? "30-75" : "75-150",
      peakHourThroughput: `${num(inputs.cars_per_hour_peak) ?? 25}` as unknown as Parameters<
        typeof calculateCarWash16Q
      >[0]["peakHourThroughput"],
      washCycleDuration: "3-5", // Default
      operatingHours: `${num(inputs.operating_hours_per_day) ?? 12}` as unknown as Parameters<
        typeof calculateCarWash16Q
      >[0]["operatingHours"],
      monthlyElectricitySpend: monthlyKwh ? `${Math.floor(monthlyKwh * 0.12)}` : "3000-7500",
      utilityRateStructure: bool(inputs.demand_charge) ? "demand" : "flat",
      powerQualityIssues: [],
      outageSensitivity: "operations_stop",
      expansionPlans: [],
    });

    return {
      baseLoadKW: result.loadProfile?.baseLoadKW,
      peakLoadKW: result.peakKW,
      energyKWhPerDay: result.loadProfile?.dailyKWh,
      assumptions: result.auditTrail?.map((a) => a.description) ?? [],
      warnings,
      raw: result,
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
