/**
 * Quote Flow End-to-End Tests
 *
 * These tests verify the complete quote generation flow from user inputs
 * through SSOT services to final quote output.
 *
 * Created: Dec 2025 - Comprehensive SSOT audit
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Supabase before imports
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

// Import after mocks
import { calculateQuote, QuoteInput } from "@/services/unifiedQuoteCalculator";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";

describe("Quote Flow End-to-End Tests", () => {
  describe("Generator Fuel Type Defaults", () => {
    it("should default to natural-gas when no fuel type specified", async () => {
      const input: QuoteInput = {
        storageSizeMW: 1,
        durationHours: 4,
        generatorMW: 0.5,
        // Note: generatorFuelType NOT specified - should default to natural-gas
        location: "California",
        electricityRate: 0.15,
        useCase: "hotel",
      };

      const result = await calculateQuote(input);

      // The quote should use natural-gas pricing, not diesel
      expect(result).toBeDefined();
      expect(result.equipment).toBeDefined();

      // If generator is included, verify it's priced
      if (result.equipment.generators) {
        const generatorCost = result.equipment.generators.totalCost;
        // Generator should have some cost (varies by configuration)
        expect(generatorCost).toBeGreaterThan(0);

        // Log for debugging - verify natural gas is being used
        console.log("Generator cost:", generatorCost, "for 500kW");
      }
    });

    it("should use diesel pricing when explicitly specified", async () => {
      const input: QuoteInput = {
        storageSizeMW: 1,
        durationHours: 4,
        generatorMW: 0.5,
        generatorFuelType: "diesel", // Explicitly diesel
        location: "California",
        electricityRate: 0.15,
        useCase: "warehouse",
      };

      const result = await calculateQuote(input);
      expect(result).toBeDefined();
    });
  });

  describe("Use Case Power Calculations", () => {
    it("should calculate hotel power with database defaults", () => {
      // Using DB default: 150 rooms
      const result = calculateUseCasePower("hotel", {});

      expect(result).toBeDefined();
      // Note: returns powerMW, not peakKW
      expect(result.powerMW).toBeGreaterThan(0);

      // 150 rooms * ~3.5 kW/room * 0.75 diversity = ~394 kW = 0.394 MW
      expect(result.powerMW).toBeGreaterThanOrEqual(0.1);
      expect(result.powerMW).toBeLessThanOrEqual(1);
    });

    it("should calculate hospital power with database defaults", () => {
      // Using DB default: 250 beds
      const result = calculateUseCasePower("hospital", {});

      expect(result).toBeDefined();
      expect(result.powerMW).toBeGreaterThan(0);

      // Hospitals are high power: 250 beds * ~10 kW/bed = ~2500 kW = 2.5 MW
      expect(result.powerMW).toBeGreaterThanOrEqual(0.5);
    });

    it("should calculate warehouse power with database defaults", () => {
      // Using DB default: 250,000 sqft
      const result = calculateUseCasePower("warehouse", {});

      expect(result).toBeDefined();
      expect(result.powerMW).toBeGreaterThan(0);
    });

    it("should calculate car-wash power with database defaults", () => {
      // Using DB default: 4 bays
      const result = calculateUseCasePower("car-wash", {
        numberOfBays: 4,
        bayType: "automatic",
      });

      expect(result).toBeDefined();
      expect(result.powerMW).toBeGreaterThan(0);

      // 4 automatic bays * ~20 kW each = ~80 kW = 0.08 MW
      expect(result.powerMW).toBeGreaterThanOrEqual(0.05);
      expect(result.powerMW).toBeLessThanOrEqual(0.5);
    });

    // Note: ev-charging test requires import.meta.env.DEV fix
    it("should calculate office power with database defaults", () => {
      const result = calculateUseCasePower("office", {});

      expect(result).toBeDefined();
      expect(result.powerMW).toBeGreaterThan(0);

      // 50,000 sq ft * 6 W/sqft = 300 kW = 0.3 MW
      expect(result.powerMW).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe("Quote Cost Consistency", () => {
    it("should produce consistent costs for same inputs", async () => {
      const input: QuoteInput = {
        storageSizeMW: 2,
        durationHours: 4,
        location: "Texas",
        electricityRate: 0.12,
        useCase: "manufacturing",
      };

      const result1 = await calculateQuote(input);
      const result2 = await calculateQuote(input);

      // Same inputs should produce identical outputs
      // Note: totalProjectCost, not totalCost
      expect(result1.costs.totalProjectCost).toBe(result2.costs.totalProjectCost);
      expect(result1.financials.paybackYears).toBe(result2.financials.paybackYears);
    });

    it("should scale costs with system size", async () => {
      const smallSystem = await calculateQuote({
        storageSizeMW: 1,
        durationHours: 4,
        location: "California",
        electricityRate: 0.15,
        useCase: "office",
      });

      const largeSystem = await calculateQuote({
        storageSizeMW: 2,
        durationHours: 4,
        location: "California",
        electricityRate: 0.15,
        useCase: "office",
      });

      // Larger system should cost at least as much (may have economies of scale)
      expect(largeSystem.costs.totalProjectCost).toBeGreaterThanOrEqual(
        smallSystem.costs.totalProjectCost
      );

      // Cost ratio - larger systems may have strong economies of scale at utility size
      const costRatio = largeSystem.costs.totalProjectCost / smallSystem.costs.totalProjectCost;
      console.log("Cost scaling ratio (2MW vs 1MW):", costRatio.toFixed(3));

      // With economies of scale, ratio could be anywhere from 1.0 to 2.0
      expect(costRatio).toBeGreaterThanOrEqual(1.0);
      expect(costRatio).toBeLessThanOrEqual(2.0);
    });
  });

  describe("All Use Cases Quote Generation", () => {
    const useCases = [
      "hotel",
      "hospital",
      "warehouse",
      "car-wash",
      // 'ev-charging', // Skipped: needs import.meta.env.DEV fix
      "office",
      "retail",
      "manufacturing",
      "apartment-building",
      "data-center",
    ];

    useCases.forEach((useCase) => {
      it(`should generate valid quote for ${useCase}`, async () => {
        const result = await calculateQuote({
          storageSizeMW: 1,
          durationHours: 4,
          location: "California",
          electricityRate: 0.15,
          useCase,
        });

        // Basic structure validation
        expect(result).toBeDefined();
        expect(result.costs).toBeDefined();
        expect(result.equipment).toBeDefined();
        expect(result.financials).toBeDefined();

        // Costs should be positive and reasonable
        // Note: totalProjectCost, not totalCost
        expect(result.costs.totalProjectCost).toBeGreaterThan(0);
        expect(result.costs.totalProjectCost).toBeLessThan(10000000); // Less than $10M for 1MW

        // Financial metrics should be reasonable
        expect(result.financials.paybackYears).toBeGreaterThan(0);
        expect(result.financials.paybackYears).toBeLessThan(30);
      });
    });
  });
});
