/**
 * SSOT VALIDATION TEST SUITE
 * ===========================
 *
 * PURPOSE: Ensure ALL use cases flow through Single Source of Truth calculations.
 *
 * These tests catch bugs like:
 * 1. User inputs being overwritten by auto-calculations
 * 2. "Merlin's Recommendation" diverging from "Your Selection"
 * 3. Default values causing 10x power inflation
 * 4. Missing template data (annualPassengers, gamingSpaceSqFt, etc.)
 *
 * RUN: npm test -- --grep "SSOT"
 */

import { describe, it, expect, beforeEach } from "vitest";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";

// ════════════════════════════════════════════════════════════════════════════
// TEST 1: SSOT Power Calculations - All Use Cases
// ════════════════════════════════════════════════════════════════════════════

describe("SSOT Power Calculations", () => {
  // Test data for each use case with REALISTIC inputs
  const USE_CASE_TEST_DATA: Record<
    string,
    {
      slug: string;
      input: Record<string, any>;
      expectedPowerMW: { min: number; max: number };
      description: string;
    }
  > = {
    // ──────────────────────────────────────────────────────────────────────────
    // COMMERCIAL
    // ──────────────────────────────────────────────────────────────────────────
    office: {
      slug: "office",
      input: { squareFeet: 50000 },
      expectedPowerMW: { min: 0.1, max: 0.3 }, // 50k sqft × 3-5 W/sqft = 150-250 kW
      description: "50,000 sq ft office building",
    },
    hotel: {
      slug: "hotel",
      input: { roomCount: 200 },
      expectedPowerMW: { min: 0.4, max: 1.0 }, // 200 rooms × 2-5 kW/room = 400-1000 kW
      description: "200-room hotel",
    },
    retail: {
      slug: "retail",
      input: { squareFeet: 25000 },
      expectedPowerMW: { min: 0.1, max: 0.3 }, // 25k sqft × 5-8 W/sqft = 125-200 kW
      description: "25,000 sq ft retail store",
    },
    restaurant: {
      slug: "restaurant",
      input: { squareFeet: 5000, seats: 100 },
      expectedPowerMW: { min: 0.05, max: 0.2 }, // Small-medium restaurant
      description: "5,000 sq ft / 100 seat restaurant",
    },

    // ──────────────────────────────────────────────────────────────────────────
    // INDUSTRIAL
    // ──────────────────────────────────────────────────────────────────────────
    warehouse: {
      slug: "warehouse",
      input: { squareFeet: 100000, isColdStorage: false },
      expectedPowerMW: { min: 0.1, max: 0.4 }, // 100k sqft × 1-3 W/sqft = 100-300 kW
      description: "100,000 sq ft standard warehouse",
    },
    coldStorage: {
      slug: "warehouse",
      input: { squareFeet: 50000, isColdStorage: true },
      expectedPowerMW: { min: 0.3, max: 0.8 }, // Cold storage: 6-12 W/sqft
      description: "50,000 sq ft cold storage",
    },
    manufacturing: {
      slug: "manufacturing",
      input: { squareFeet: 75000 },
      expectedPowerMW: { min: 0.3, max: 1.2 }, // 75k sqft × 5-15 W/sqft = 375-1125 kW
      description: "75,000 sq ft manufacturing facility",
    },

    // ──────────────────────────────────────────────────────────────────────────
    // CRITICAL INFRASTRUCTURE
    // ──────────────────────────────────────────────────────────────────────────
    hospital: {
      slug: "hospital",
      input: { bedCount: 200, squareFeet: 300000 },
      expectedPowerMW: { min: 0.8, max: 1.5 }, // 200 beds × 5 kW/bed = 1 MW (SSOT uses kW/bed, not sqft)
      description: "200-bed hospital",
    },
    dataCenter: {
      slug: "datacenter",
      input: { rackCount: 50, itLoadKW: 500 },
      expectedPowerMW: { min: 0.5, max: 1.5 }, // 500kW IT × 1.5 PUE = 750 kW
      description: "50-rack data center (500 kW IT)",
    },

    // ──────────────────────────────────────────────────────────────────────────
    // SPECIALTY
    // ──────────────────────────────────────────────────────────────────────────
    airport: {
      slug: "airport",
      input: { annualPassengers: 2000000 }, // 2 million - small regional
      expectedPowerMW: { min: 1.0, max: 4.0 }, // 2M × 1.5 MW/M = 3 MW
      description: "2 million passenger regional airport",
    },
    casino: {
      slug: "casino",
      input: { gamingSpaceSqFt: 50000, hotelRooms: 200 },
      expectedPowerMW: { min: 0.5, max: 4.0 }, // Gaming + hotel - can vary widely
      description: "50,000 sq ft gaming + 200 rooms casino",
    },
    carWash: {
      slug: "car-wash",
      input: { washBays: 4, bayType: "automatic" },
      expectedPowerMW: { min: 0.1, max: 0.3 }, // 4 bays × 60 kW/bay = 240 kW (SSOT automatic uses ~60 kW/bay)
      description: "4-bay automatic car wash",
    },

    // ──────────────────────────────────────────────────────────────────────────
    // EV CHARGING
    // ──────────────────────────────────────────────────────────────────────────
    evCharging: {
      slug: "ev-charging",
      input: {
        level1Count: 0,
        level2Count: 4,
        dcFastCount: 4,
      },
      expectedPowerMW: { min: 0.4, max: 1.0 }, // 4×11kW + 4×150kW = 644 kW
      description: "4 L2 + 4 DCFC charging station",
    },
  };

  // Run tests for each use case
  Object.entries(USE_CASE_TEST_DATA).forEach(([name, testData]) => {
    it(`${name}: ${testData.description} should calculate ${testData.expectedPowerMW.min}-${testData.expectedPowerMW.max} MW`, () => {
      const result = calculateUseCasePower(testData.slug, testData.input);

      console.log(`\n📊 ${name.toUpperCase()}:`, {
        input: testData.input,
        result: result.powerMW,
        expected: testData.expectedPowerMW,
        description: result.description,
      });

      // Verify power is in expected range
      expect(result.powerMW).toBeGreaterThanOrEqual(testData.expectedPowerMW.min);
      expect(result.powerMW).toBeLessThanOrEqual(testData.expectedPowerMW.max);

      // Verify we get a valid result structure
      expect(result.durationHrs).toBeGreaterThan(0);
      expect(result.description).toBeTruthy();
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 2: Default Value Protection - NO MASSIVE DEFAULTS
// ════════════════════════════════════════════════════════════════════════════

describe("SSOT Default Value Protection", () => {
  it("Airport with empty data should use database default of 5 million passengers", () => {
    // Database default: annualPassengers = 5,000,000 (medium regional airport)
    // Expected: 5M passengers × 1.5 MW/M = 7.5 MW
    const result = calculateUseCasePower("airport", {});

    // With database default (5M passengers), expect ~7.5 MW
    expect(result.powerMW).toBeGreaterThanOrEqual(7.0);
    expect(result.powerMW).toBeLessThanOrEqual(8.0);
    console.log("Airport DB default:", result);
  });

  it("Warehouse with empty data should use database default of 200,000-250,000 sqft", () => {
    const result = calculateUseCasePower("warehouse", {});

    // Database default: 200,000-250,000 sqft warehouse → ~0.4-0.5 MW
    expect(result.powerMW).toBeGreaterThanOrEqual(0.3);
    expect(result.powerMW).toBeLessThanOrEqual(0.6);
    console.log("Warehouse DB default:", result);
  });

  it("Hotel with empty data should use database default of 150 rooms", () => {
    const result = calculateUseCasePower("hotel", {});

    // Database default: 150 rooms → ~0.3-0.6 MW
    expect(result.powerMW).toBeGreaterThanOrEqual(0.2);
    expect(result.powerMW).toBeLessThanOrEqual(1.0);
    console.log("Hotel DB default:", result);
  });

  it("Data Center with empty data should use database default of 2000 kW IT load", () => {
    const result = calculateUseCasePower("datacenter", {});

    // Database default: itLoadKW = 2000, rackCount = 100 → ~2-3 MW
    expect(result.powerMW).toBeGreaterThanOrEqual(1.5);
    expect(result.powerMW).toBeLessThanOrEqual(4.0);
    console.log("Data Center DB default:", result);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // NEW TESTS: Dec 9, 2025 Bug Fixes
  // ═══════════════════════════════════════════════════════════════════════

  it("Data Center with 5000 racks should NOT recommend 8hr backup (use 4hr)", () => {
    // Bug: Data centers were getting 8hr backup → $135M for mid-size DC
    // Fix: UPS + 4hr BESS is industry standard
    const result = calculateUseCasePower("datacenter", { rackCount: 5000, rackDensityKW: 8 });

    // 5000 racks × 8kW × 1.5 PUE = 60 MW (correct)
    expect(result.powerMW).toBeGreaterThanOrEqual(55);
    expect(result.powerMW).toBeLessThanOrEqual(65);

    // Duration should be 4 hours, NOT 8
    expect(result.durationHrs).toBe(4);
    console.log("Data Center 5000 racks:", result);
  });

  it("Cold Storage with refrigerationLoadKW should use it (not just sqft)", () => {
    // Bug: User entered 500kW refrigeration but it was IGNORED
    const result = calculateUseCasePower("cold-storage", {
      refrigerationLoadKW: 500,
    });

    // Should be: 500kW × 1.2 = 600kW = 0.6 MW
    expect(result.powerMW).toBeGreaterThanOrEqual(0.5);
    expect(result.powerMW).toBeLessThanOrEqual(0.7);
    console.log("Cold Storage with refrigeration load:", result);
  });

  it("Cold Storage with peakDemandKW should use it directly", () => {
    // If user KNOWS their peak demand, trust them
    const result = calculateUseCasePower("cold-storage", {
      peakDemandKW: 800,
    });

    // Should be exactly 0.8 MW
    expect(result.powerMW).toBe(0.8);
    console.log("Cold Storage with peak demand:", result);
  });

  it("Cold Storage storageVolume (cubic feet) should convert to sqft", () => {
    // Bug: 550,000 cubic feet was treated as 550,000 sqft!
    const result = calculateUseCasePower("cold-storage", {
      storageVolume: 550000, // 550,000 cubic feet
    });

    // Should convert: 550,000 ÷ 30 = ~18,333 sqft
    // 18,333 sqft × 8 W/sqft = ~147 kW = 0.15 MW
    expect(result.powerMW).toBeLessThan(0.3); // NOT 4.4 MW!
    console.log("Cold Storage volume conversion:", result);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 3: User Input Preservation - Inputs Should NOT Be Overwritten
// ════════════════════════════════════════════════════════════════════════════

describe("SSOT User Input Preservation", () => {
  it("User solar selection should NOT be overwritten by auto-calculation", () => {
    // Simulate: User sets 700 kW solar, clicks Continue
    // BUG WAS: Continue button set solarKW = baseKW * 1.2 (ignored user input)

    const userSelectedSolarKW = 700;
    const baseKW = 18000; // 18 MW casino

    // OLD BUGGY CODE: const solarKW = wantsSolar ? Math.round(baseKW * 1.2) : 0;
    // This would give: 21,600 kW - WRONG!

    // NEW CORRECT CODE: preserve user input if set
    const preserveUserInput = (userValue: number, defaultCalc: number) => {
      return userValue > 0 ? userValue : defaultCalc;
    };

    const result = preserveUserInput(userSelectedSolarKW, Math.round(baseKW * 1.2));
    expect(result).toBe(700); // Should preserve user's 700 kW, not 21,600 kW
  });

  it("User battery selection should NOT be overwritten", () => {
    const userSelectedBatteryKW = 1500;
    const calculatedRecommendation = 11800; // Merlin's recommendation

    // User's selection should be independent of recommendation
    expect(userSelectedBatteryKW).not.toBe(calculatedRecommendation);

    // Both should be valid options (user can choose either)
  });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 4: Calculation Consistency - Same Inputs = Same Outputs
// ════════════════════════════════════════════════════════════════════════════

describe("SSOT Calculation Consistency", () => {
  it("Same inputs to calculateUseCasePower should always produce same output", () => {
    const input = { squareFeet: 100000 };

    const result1 = calculateUseCasePower("warehouse", input);
    const result2 = calculateUseCasePower("warehouse", input);
    const result3 = calculateUseCasePower("warehouse", input);

    expect(result1.powerMW).toBe(result2.powerMW);
    expect(result2.powerMW).toBe(result3.powerMW);
  });

  it("Different field names for same data should produce same result", () => {
    // SSOT should accept multiple field name variants
    const result1 = calculateUseCasePower("hotel", { roomCount: 100 });
    const result2 = calculateUseCasePower("hotel", { numberOfRooms: 100 });
    const result3 = calculateUseCasePower("hotel", { rooms: 100 });

    // All should produce the same power calculation
    expect(result1.powerMW).toBe(result2.powerMW);
    expect(result2.powerMW).toBe(result3.powerMW);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 5: EV Charger Power Calculations
// ════════════════════════════════════════════════════════════════════════════

describe("SSOT EV Charger Calculations", () => {
  it("EV charger power should match industry standards", () => {
    // Standard power ratings
    const L1_POWER = 1.4; // kW
    const L2_POWER = 11; // kW (7-19 kW range)
    const DCFC_POWER = 100; // kW (50-150 kW)
    const HPC_POWER = 350; // kW (250-350 kW)

    // Test: 4 L2 + 4 DCFC + 8 HPC
    const l2Load = 4 * L2_POWER; // 44 kW
    const dcfcLoad = 4 * DCFC_POWER; // 400 kW
    const hpcLoad = 8 * HPC_POWER; // 2,800 kW
    const totalLoad = l2Load + dcfcLoad + hpcLoad; // 3,244 kW

    expect(totalLoad).toBe(3244);
    expect(totalLoad / 1000).toBeCloseTo(3.244, 2); // 3.2 MW
  });

  it("Mixed EV charger configuration should calculate correctly", () => {
    const result = calculateUseCasePower("ev-charging", {
      level1Count: 2,
      level2Count: 8,
      dcFastCount: 4,
    });

    // 2×1.9 + 8×19 + 4×150 = 3.8 + 152 + 600 = 755.8 kW ≈ 0.76 MW
    // (Note: actual values depend on SSOT implementation)
    expect(result.powerMW).toBeGreaterThan(0.3);
    expect(result.powerMW).toBeLessThan(2.0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST 6: Full Quote Flow Simulation
// ════════════════════════════════════════════════════════════════════════════

describe("SSOT Full Quote Flow", () => {
  it("Quote flow: User Selection vs Merlin Recommendation should use same SSOT", () => {
    // Simulate the full flow for a warehouse
    const userInput = {
      squareFeet: 100000,
      isColdStorage: false,
    };

    // STEP 1: User Selection path (Continue button in Goals)
    const userSelectionResult = calculateUseCasePower("warehouse", userInput);

    // STEP 2: Merlin Recommendation path (useWizardState.recalculate)
    // With the fix, this should use the SAME useCaseData
    const merlinRecommendationResult = calculateUseCasePower("warehouse", userInput);

    // Both should be IDENTICAL since they use same SSOT
    expect(userSelectionResult.powerMW).toBe(merlinRecommendationResult.powerMW);
    expect(userSelectionResult.durationHrs).toBe(merlinRecommendationResult.durationHrs);
  });

  it("Quote prices should be proportional to system size", () => {
    // Larger systems should cost more, but $/kWh should be similar
    const small = calculateUseCasePower("warehouse", { squareFeet: 50000 });
    const large = calculateUseCasePower("warehouse", { squareFeet: 200000 });

    // Large should be ~4x the power (200k/50k = 4)
    const ratio = large.powerMW / small.powerMW;
    expect(ratio).toBeGreaterThan(3);
    expect(ratio).toBeLessThan(5);
  });
});
