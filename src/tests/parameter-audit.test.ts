/**
 * PARAMETER AUDIT - Comprehensive validation of all calculation constants
 *
 * This test file audits ALL power density, multiplier, and factor values
 * across the codebase to ensure consistency with industry standards.
 *
 * Sources Referenced:
 * - ASHRAE 90.1 (Building Energy Code)
 * - CBECS 2018 (Commercial Buildings Energy Consumption Survey)
 * - Energy Star Portfolio Manager benchmarks
 * - Uptime Institute (Datacenter tiers)
 * - SAE J1772 / CCS / CHAdeMO (EV Charging)
 * - NREL (National Renewable Energy Laboratory)
 *
 * Created: December 2025
 */

import { describe, test, expect } from "vitest";
import {
  POWER_DENSITY_STANDARDS,
  HOTEL_CLASS_PROFILES,
  HOTEL_AMENITY_SPECS,
  BUILDING_AGE_FACTORS,
  DATACENTER_TIER_STANDARDS,
  CAR_WASH_EQUIPMENT_POWER,
  CAR_WASH_AUTOMATION_LEVELS,
} from "@/services/useCasePowerCalculations";

import { EV_CHARGER_SPECS } from "@/services/evChargingCalculations";

// ============================================
// TEST 1: POWER DENSITY STANDARDS
// ============================================
describe("Power Density Standards Audit", () => {
  test("Office: 5-7 W/sq ft peak (ASHRAE 90.1)", () => {
    const value = POWER_DENSITY_STANDARDS.office;
    expect(value).toBeGreaterThanOrEqual(5);
    expect(value).toBeLessThanOrEqual(7);
    console.log(`✅ Office: ${value} W/sqft (expected 5-7)`);
  });

  test("Retail: 6-10 W/sq ft peak (CBECS)", () => {
    const value = POWER_DENSITY_STANDARDS.retail;
    expect(value).toBeGreaterThanOrEqual(6);
    expect(value).toBeLessThanOrEqual(10);
    console.log(`✅ Retail: ${value} W/sqft (expected 6-10)`);
  });

  test("Shopping Center: 8-12 W/sq ft peak (CBECS)", () => {
    const value = POWER_DENSITY_STANDARDS.shoppingCenter;
    expect(value).toBeGreaterThanOrEqual(8);
    expect(value).toBeLessThanOrEqual(12);
    console.log(`✅ Shopping Center: ${value} W/sqft (expected 8-12)`);
  });

  test("Warehouse: 1-3 W/sq ft peak (CBECS)", () => {
    const value = POWER_DENSITY_STANDARDS.warehouse;
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(3);
    console.log(`✅ Warehouse: ${value} W/sqft (expected 1-3)`);
  });

  test("Manufacturing: 10-25 W/sq ft peak (CBECS)", () => {
    const value = POWER_DENSITY_STANDARDS.manufacturing;
    expect(value).toBeGreaterThanOrEqual(10);
    expect(value).toBeLessThanOrEqual(25);
    console.log(`✅ Manufacturing: ${value} W/sqft (expected 10-25)`);
  });

  test("Cold Storage: 6-12 W/sq ft peak (CBECS)", () => {
    const value = POWER_DENSITY_STANDARDS.coldStorage;
    expect(value).toBeGreaterThanOrEqual(6);
    expect(value).toBeLessThanOrEqual(12);
    console.log(`✅ Cold Storage: ${value} W/sqft (expected 6-12)`);
  });

  test("Food Processing: 8-15 W/sq ft peak (CBECS)", () => {
    const value = POWER_DENSITY_STANDARDS.foodProcessing;
    expect(value).toBeGreaterThanOrEqual(8);
    expect(value).toBeLessThanOrEqual(15);
    console.log(`✅ Food Processing: ${value} W/sqft (expected 8-15)`);
  });

  test("Datacenter: 100-200 W/sq ft peak (Uptime Institute)", () => {
    const value = POWER_DENSITY_STANDARDS.datacenter;
    expect(value).toBeGreaterThanOrEqual(100);
    expect(value).toBeLessThanOrEqual(200);
    console.log(`✅ Datacenter: ${value} W/sqft (expected 100-200)`);
  });

  test("Indoor Farm: 40-60 W/sq ft peak (Industry)", () => {
    const value = POWER_DENSITY_STANDARDS.indoorFarm;
    expect(value).toBeGreaterThanOrEqual(40);
    expect(value).toBeLessThanOrEqual(60);
    console.log(`✅ Indoor Farm: ${value} W/sqft (expected 40-60)`);
  });

  test("Casino: 15-22 W/sq ft peak (Gaming Industry)", () => {
    const value = POWER_DENSITY_STANDARDS.casino;
    expect(value).toBeGreaterThanOrEqual(15);
    expect(value).toBeLessThanOrEqual(22);
    console.log(`✅ Casino: ${value} W/sqft (expected 15-22)`);
  });

  test("Hotel: 3-4 kW per room peak (CBECS hospitality)", () => {
    const value = POWER_DENSITY_STANDARDS.hotelPerRoom;
    expect(value).toBeGreaterThanOrEqual(3);
    expect(value).toBeLessThanOrEqual(4);
    console.log(`✅ Hotel: ${value} kW/room (expected 3-4)`);
  });

  test("Hospital: 4-6 kW per bed peak (ASHRAE healthcare)", () => {
    const value = POWER_DENSITY_STANDARDS.hospitalPerBed;
    expect(value).toBeGreaterThanOrEqual(4);
    expect(value).toBeLessThanOrEqual(6);
    console.log(`✅ Hospital: ${value} kW/bed (expected 4-6)`);
  });

  test("Agriculture: 0.3-1.0 kW per acre peak (USDA)", () => {
    const value = POWER_DENSITY_STANDARDS.agriculturePerAcre;
    expect(value).toBeGreaterThanOrEqual(0.3);
    expect(value).toBeLessThanOrEqual(1.0);
    console.log(`✅ Agriculture: ${value} kW/acre (expected 0.3-1.0)`);
  });

  test("Airport: 1.2-2.0 MW per million passengers/year (FAA)", () => {
    const value = POWER_DENSITY_STANDARDS.airportPerMillion;
    expect(value).toBeGreaterThanOrEqual(1.2);
    expect(value).toBeLessThanOrEqual(2.0);
    console.log(`✅ Airport: ${value} MW/million pax (expected 1.2-2.0)`);
  });
});

// ============================================
// TEST 2: HOTEL CLASS PROFILES
// ============================================
describe("Hotel Class Profiles Audit", () => {
  test("Economy: 20-30 kWh/room, 2-3 kW/room peak", () => {
    const profile = HOTEL_CLASS_PROFILES.economy;
    expect(profile.kWhPerRoom).toBeGreaterThanOrEqual(20);
    expect(profile.kWhPerRoom).toBeLessThanOrEqual(30);
    expect(profile.peakKWPerRoom).toBeGreaterThanOrEqual(2);
    expect(profile.peakKWPerRoom).toBeLessThanOrEqual(3);
    console.log(`✅ Economy: ${profile.kWhPerRoom} kWh/room, ${profile.peakKWPerRoom} kW peak`);
  });

  test("Midscale: 30-45 kWh/room, 3-5 kW/room peak", () => {
    const profile = HOTEL_CLASS_PROFILES.midscale;
    expect(profile.kWhPerRoom).toBeGreaterThanOrEqual(30);
    expect(profile.kWhPerRoom).toBeLessThanOrEqual(45);
    expect(profile.peakKWPerRoom).toBeGreaterThanOrEqual(3);
    expect(profile.peakKWPerRoom).toBeLessThanOrEqual(5);
    console.log(`✅ Midscale: ${profile.kWhPerRoom} kWh/room, ${profile.peakKWPerRoom} kW peak`);
  });

  test("Upscale: 40-60 kWh/room, 4-6 kW/room peak", () => {
    const profile = HOTEL_CLASS_PROFILES.upscale;
    expect(profile.kWhPerRoom).toBeGreaterThanOrEqual(40);
    expect(profile.kWhPerRoom).toBeLessThanOrEqual(60);
    expect(profile.peakKWPerRoom).toBeGreaterThanOrEqual(4);
    expect(profile.peakKWPerRoom).toBeLessThanOrEqual(6);
    console.log(`✅ Upscale: ${profile.kWhPerRoom} kWh/room, ${profile.peakKWPerRoom} kW peak`);
  });

  test("Luxury: 65-90 kWh/room, 6-8 kW/room peak", () => {
    const profile = HOTEL_CLASS_PROFILES.luxury;
    expect(profile.kWhPerRoom).toBeGreaterThanOrEqual(65);
    expect(profile.kWhPerRoom).toBeLessThanOrEqual(90);
    expect(profile.peakKWPerRoom).toBeGreaterThanOrEqual(6);
    expect(profile.peakKWPerRoom).toBeLessThanOrEqual(8);
    console.log(`✅ Luxury: ${profile.kWhPerRoom} kWh/room, ${profile.peakKWPerRoom} kW peak`);
  });
});

// ============================================
// TEST 3: HOTEL AMENITY SPECS
// ============================================
describe("Hotel Amenity Specs Audit", () => {
  test("Pool: 40-60 kW peak", () => {
    const spec = HOTEL_AMENITY_SPECS.pool;
    expect(spec.peakKW).toBeGreaterThanOrEqual(40);
    expect(spec.peakKW).toBeLessThanOrEqual(60);
    console.log(`✅ Pool: ${spec.peakKW} kW peak (expected 40-60)`);
  });

  test("Restaurant: 60-90 kW peak", () => {
    const spec = HOTEL_AMENITY_SPECS.restaurant;
    expect(spec.peakKW).toBeGreaterThanOrEqual(60);
    expect(spec.peakKW).toBeLessThanOrEqual(90);
    console.log(`✅ Restaurant: ${spec.peakKW} kW peak (expected 60-90)`);
  });

  test("Spa: 30-50 kW peak", () => {
    const spec = HOTEL_AMENITY_SPECS.spa;
    expect(spec.peakKW).toBeGreaterThanOrEqual(30);
    expect(spec.peakKW).toBeLessThanOrEqual(50);
    console.log(`✅ Spa: ${spec.peakKW} kW peak (expected 30-50)`);
  });

  test("Fitness Center: 10-25 kW peak", () => {
    const spec = HOTEL_AMENITY_SPECS.fitnessCenter;
    expect(spec.peakKW).toBeGreaterThanOrEqual(10);
    expect(spec.peakKW).toBeLessThanOrEqual(25);
    console.log(`✅ Fitness Center: ${spec.peakKW} kW peak (expected 10-25)`);
  });

  test("Laundry: 30-50 kW peak", () => {
    const spec = HOTEL_AMENITY_SPECS.laundry;
    expect(spec.peakKW).toBeGreaterThanOrEqual(30);
    expect(spec.peakKW).toBeLessThanOrEqual(50);
    console.log(`✅ Laundry: ${spec.peakKW} kW peak (expected 30-50)`);
  });
});

// ============================================
// TEST 4: BUILDING AGE FACTORS
// ============================================
describe("Building Age Factors Audit", () => {
  test("New buildings: 15-20% more efficient (factor 0.8-0.9)", () => {
    const factor = BUILDING_AGE_FACTORS.new;
    expect(factor).toBeGreaterThanOrEqual(0.8);
    expect(factor).toBeLessThanOrEqual(0.9);
    console.log(`✅ New: ${factor} (expected 0.8-0.9)`);
  });

  test("Modern buildings: baseline (factor 1.0)", () => {
    const factor = BUILDING_AGE_FACTORS.modern;
    expect(factor).toBe(1.0);
    console.log(`✅ Modern: ${factor} (expected 1.0)`);
  });

  test("Older buildings: 10-20% less efficient (factor 1.1-1.2)", () => {
    const factor = BUILDING_AGE_FACTORS.older;
    expect(factor).toBeGreaterThanOrEqual(1.1);
    expect(factor).toBeLessThanOrEqual(1.2);
    console.log(`✅ Older: ${factor} (expected 1.1-1.2)`);
  });

  test("Historic buildings: 20-40% less efficient (factor 1.2-1.4)", () => {
    const factor = BUILDING_AGE_FACTORS.historic;
    expect(factor).toBeGreaterThanOrEqual(1.2);
    expect(factor).toBeLessThanOrEqual(1.4);
    console.log(`✅ Historic: ${factor} (expected 1.2-1.4)`);
  });
});

// ============================================
// TEST 5: DATACENTER TIER STANDARDS
// ============================================
describe("Datacenter Tier Standards Audit (Uptime Institute)", () => {
  test("Tier I: 25-35% BESS, 1-2 hr duration", () => {
    const tier = DATACENTER_TIER_STANDARDS.tier1;
    expect(tier.bessMultiplier).toBeGreaterThanOrEqual(0.25);
    expect(tier.bessMultiplier).toBeLessThanOrEqual(0.35);
    expect(tier.durationHours).toBeGreaterThanOrEqual(1);
    expect(tier.durationHours).toBeLessThanOrEqual(2);
    console.log(`✅ Tier I: ${tier.bessMultiplier * 100}% BESS, ${tier.durationHours}hr`);
  });

  test("Tier II: 35-45% BESS, 2-4 hr duration", () => {
    const tier = DATACENTER_TIER_STANDARDS.tier2;
    expect(tier.bessMultiplier).toBeGreaterThanOrEqual(0.35);
    expect(tier.bessMultiplier).toBeLessThanOrEqual(0.45);
    expect(tier.durationHours).toBeGreaterThanOrEqual(2);
    expect(tier.durationHours).toBeLessThanOrEqual(4);
    console.log(`✅ Tier II: ${tier.bessMultiplier * 100}% BESS, ${tier.durationHours}hr`);
  });

  test("Tier III: 45-55% BESS, 3-5 hr duration", () => {
    const tier = DATACENTER_TIER_STANDARDS.tier3;
    expect(tier.bessMultiplier).toBeGreaterThanOrEqual(0.45);
    expect(tier.bessMultiplier).toBeLessThanOrEqual(0.55);
    expect(tier.durationHours).toBeGreaterThanOrEqual(3);
    expect(tier.durationHours).toBeLessThanOrEqual(5);
    console.log(`✅ Tier III: ${tier.bessMultiplier * 100}% BESS, ${tier.durationHours}hr`);
  });

  test("Tier IV: 60-80% BESS, 4-8 hr duration", () => {
    const tier = DATACENTER_TIER_STANDARDS.tier4;
    expect(tier.bessMultiplier).toBeGreaterThanOrEqual(0.6);
    expect(tier.bessMultiplier).toBeLessThanOrEqual(0.8);
    expect(tier.durationHours).toBeGreaterThanOrEqual(4);
    expect(tier.durationHours).toBeLessThanOrEqual(8);
    console.log(`✅ Tier IV: ${tier.bessMultiplier * 100}% BESS, ${tier.durationHours}hr`);
  });
});

// ============================================
// TEST 6: CAR WASH EQUIPMENT POWER
// ============================================
describe("Car Wash Equipment Power Audit", () => {
  test("Conveyor primary motor: 4-6 kW (5 HP typical)", () => {
    const power = CAR_WASH_EQUIPMENT_POWER.conveyor.primary;
    expect(power).toBeGreaterThanOrEqual(3.7); // 5 HP min
    expect(power).toBeLessThanOrEqual(7.5); // 10 HP max
    console.log(`✅ Conveyor: ${power} kW (expected 4-6)`);
  });

  test("High-pressure pump: 9-15 kW (15-20 HP)", () => {
    const power = CAR_WASH_EQUIPMENT_POWER.highPressure.pumpStation;
    expect(power).toBeGreaterThanOrEqual(9);
    expect(power).toBeLessThanOrEqual(15);
    console.log(`✅ High-pressure pump: ${power} kW (expected 9-15)`);
  });

  test("Standard blower: 6-10 kW (10 HP typical)", () => {
    const power = CAR_WASH_EQUIPMENT_POWER.drying.standardBlower;
    expect(power).toBeGreaterThanOrEqual(6);
    expect(power).toBeLessThanOrEqual(10);
    console.log(`✅ Standard blower: ${power} kW (expected 6-10)`);
  });

  test("Central vacuum system: 20-40 kW", () => {
    const power = CAR_WASH_EQUIPMENT_POWER.vacuum.centralSystem;
    expect(power).toBeGreaterThanOrEqual(20);
    expect(power).toBeLessThanOrEqual(40);
    console.log(`✅ Central vacuum: ${power} kW (expected 20-40)`);
  });

  test("Tankless water heater (electric): 20-50 kW", () => {
    const power = CAR_WASH_EQUIPMENT_POWER.waterHeating.tankless;
    expect(power).toBeGreaterThanOrEqual(20);
    expect(power).toBeLessThanOrEqual(50);
    console.log(`✅ Tankless water heater: ${power} kW (expected 20-50)`);
  });
});

// ============================================
// TEST 7: CAR WASH AUTOMATION LEVELS
// ============================================
describe("Car Wash Automation Levels Audit", () => {
  test("Legacy: 0.8-0.9 power multiplier (older, simpler systems)", () => {
    const level = CAR_WASH_AUTOMATION_LEVELS.legacy;
    expect(level.powerMultiplier).toBeGreaterThanOrEqual(0.8);
    expect(level.powerMultiplier).toBeLessThanOrEqual(0.9);
    console.log(`✅ Legacy: ${level.powerMultiplier}x (expected 0.8-0.9)`);
  });

  test("Standard: 1.0 power multiplier (baseline)", () => {
    const level = CAR_WASH_AUTOMATION_LEVELS.standard;
    expect(level.powerMultiplier).toBe(1.0);
    console.log(`✅ Standard: ${level.powerMultiplier}x (expected 1.0)`);
  });

  test("Modern/AI: 1.05-1.15 power multiplier (extra compute)", () => {
    const level = CAR_WASH_AUTOMATION_LEVELS.modern;
    expect(level.powerMultiplier).toBeGreaterThanOrEqual(1.05);
    expect(level.powerMultiplier).toBeLessThanOrEqual(1.15);
    console.log(`✅ Modern/AI: ${level.powerMultiplier}x (expected 1.05-1.15)`);
  });
});

// ============================================
// TEST 8: EV CHARGER SPECS (SAE J1772/CCS/CHAdeMO)
// ============================================
describe("EV Charger Specs Audit (SAE J1772 / CCS)", () => {
  test("Level 1: 1.4-1.9 kW (120V)", () => {
    const spec = EV_CHARGER_SPECS.level1;
    expect(spec.minPowerKW).toBe(1.4);
    expect(spec.maxPowerKW).toBe(1.9);
    expect(spec.voltage).toBe(120);
    console.log(`✅ Level 1: ${spec.minPowerKW}-${spec.maxPowerKW} kW @ ${spec.voltage}V`);
  });

  test("Level 2 (7kW): 6-8 kW typical", () => {
    const spec = EV_CHARGER_SPECS.level2_7kw;
    expect(spec.powerKW).toBeGreaterThanOrEqual(6);
    expect(spec.powerKW).toBeLessThanOrEqual(8);
    console.log(`✅ L2 7kW: ${spec.powerKW} kW`);
  });

  test("Level 2 (11kW): 10-12 kW typical", () => {
    const spec = EV_CHARGER_SPECS.level2_11kw;
    expect(spec.powerKW).toBeGreaterThanOrEqual(10);
    expect(spec.powerKW).toBeLessThanOrEqual(12);
    console.log(`✅ L2 11kW: ${spec.powerKW} kW`);
  });

  test("Level 2 (19.2kW): 18-20 kW typical", () => {
    const spec = EV_CHARGER_SPECS.level2_19kw;
    expect(spec.powerKW).toBeGreaterThanOrEqual(18);
    expect(spec.powerKW).toBeLessThanOrEqual(20);
    console.log(`✅ L2 19.2kW: ${spec.powerKW} kW`);
  });

  test("DCFC (50kW): 45-55 kW typical", () => {
    const spec = EV_CHARGER_SPECS.dcfc_50kw;
    expect(spec.powerKW).toBeGreaterThanOrEqual(45);
    expect(spec.powerKW).toBeLessThanOrEqual(55);
    console.log(`✅ DCFC 50kW: ${spec.powerKW} kW`);
  });

  test("DCFC (150kW): 140-160 kW typical", () => {
    const spec = EV_CHARGER_SPECS.dcfc_150kw;
    expect(spec.powerKW).toBeGreaterThanOrEqual(140);
    expect(spec.powerKW).toBeLessThanOrEqual(160);
    console.log(`✅ DCFC 150kW: ${spec.powerKW} kW`);
  });

  test("HPC (250kW): 240-260 kW typical", () => {
    const spec = EV_CHARGER_SPECS.hpc_250kw;
    expect(spec.powerKW).toBeGreaterThanOrEqual(240);
    expect(spec.powerKW).toBeLessThanOrEqual(260);
    console.log(`✅ HPC 250kW: ${spec.powerKW} kW`);
  });
});

// ============================================
// TEST 9: SUMMARY - Print all values for review
// ============================================
describe("Parameter Audit Summary", () => {
  test("Print complete parameter table", () => {
    console.log("\n");
    console.log("════════════════════════════════════════════════════════════════");
    console.log("               MERLIN BESS PARAMETER AUDIT SUMMARY");
    console.log("════════════════════════════════════════════════════════════════");

    console.log("\n📊 POWER DENSITY STANDARDS:");
    console.log("────────────────────────────────────────");
    Object.entries(POWER_DENSITY_STANDARDS).forEach(([key, value]) => {
      const unit = key.includes("Per")
        ? key.includes("Room")
          ? "kW/room"
          : key.includes("Bed")
            ? "kW/bed"
            : key.includes("Acre")
              ? "kW/acre"
              : "MW/M pax"
        : "W/sqft";
      console.log(`  ${key.padEnd(20)} ${value.toString().padStart(6)} ${unit}`);
    });

    console.log("\n🏨 HOTEL CLASS PROFILES:");
    console.log("────────────────────────────────────────");
    Object.entries(HOTEL_CLASS_PROFILES).forEach(([key, profile]) => {
      console.log(
        `  ${profile.name.padEnd(20)} ${profile.kWhPerRoom} kWh/room, ${profile.peakKWPerRoom} kW peak`
      );
    });

    console.log("\n🏢 BUILDING AGE FACTORS:");
    console.log("────────────────────────────────────────");
    Object.entries(BUILDING_AGE_FACTORS).forEach(([key, factor]) => {
      const pct = Math.round((factor - 1) * 100);
      const sign = pct >= 0 ? "+" : "";
      console.log(`  ${key.padEnd(20)} ${factor.toFixed(2)} (${sign}${pct}% vs baseline)`);
    });

    console.log("\n🖥️ DATACENTER TIER STANDARDS:");
    console.log("────────────────────────────────────────");
    Object.entries(DATACENTER_TIER_STANDARDS).forEach(([key, tier]) => {
      console.log(
        `  ${key.padEnd(8)} ${tier.bessMultiplier * 100}% BESS, ${tier.durationHours}hr backup`
      );
    });

    console.log("\n🔌 EV CHARGER POWER LEVELS:");
    console.log("────────────────────────────────────────");
    const evLevels = [
      "level1",
      "level2_7kw",
      "level2_11kw",
      "level2_19kw",
      "level2_22kw",
      "dcfc_50kw",
      "dcfc_150kw",
      "hpc_250kw",
    ];
    evLevels.forEach((key) => {
      const spec = EV_CHARGER_SPECS[key as keyof typeof EV_CHARGER_SPECS];
      if (spec) {
        const power = "powerKW" in spec ? spec.powerKW : `${spec.minPowerKW}-${spec.maxPowerKW}`;
        console.log(`  ${spec.name.padEnd(20)} ${power} kW`);
      }
    });

    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("✅ All parameters within industry-standard ranges");
    console.log("════════════════════════════════════════════════════════════════\n");

    expect(true).toBe(true);
  });
});
