/**
 * Pricing Service V4.5 - Unit Tests
 * ==================================
 * Tests for edge cases, validation, and calculation accuracy
 */

import { describe, it, expect, vi } from "vitest";
import {
  calculateSystemCosts,
  calculateAnnualSavings,
  calculateROI,
  calculateMerlinFees,
  calculateFederalITC,
  EQUIPMENT_UNIT_COSTS,
  type EquipmentConfig,
  type SavingsInputs,
} from "../pricingServiceV45";

describe("pricingServiceV45", () => {
  describe("calculateSystemCosts", () => {
    it("should calculate costs for a typical configuration", () => {
      const config: EquipmentConfig = {
        solarKW: 100,
        bessKW: 150,
        bessKWh: 600,
        generatorKW: 200,
        level2Chargers: 2,
      };

      const result = calculateSystemCosts(config);

      expect(result.solarCost).toBeGreaterThan(0);
      expect(result.bessCost).toBeGreaterThan(0);
      expect(result.generatorCost).toBeGreaterThan(0);
      expect(result.totalInvestment).toBeGreaterThan(0);
      expect(result.federalITC).toBeGreaterThan(0);
      expect(result.netInvestment).toBeLessThan(result.totalInvestment);
    });

    it("should throw error for negative equipment quantities", () => {
      const config: EquipmentConfig = {
        solarKW: -100,
      };

      expect(() => calculateSystemCosts(config)).toThrow("Equipment quantities cannot be negative");
    });

    it("should handle zero equipment (minimal system)", () => {
      const config: EquipmentConfig = {
        solarKW: 0,
        bessKW: 0,
        bessKWh: 0,
      };

      const result = calculateSystemCosts(config);

      expect(result.equipmentSubtotal).toBe(0);
      expect(result.siteEngineering).toBeGreaterThan(0); // Still have site costs
      expect(result.totalInvestment).toBeGreaterThan(0); // Merlin fees + site work
    });

    it("should apply correct ITC only to solar and BESS", () => {
      const config: EquipmentConfig = {
        solarKW: 100,
        bessKW: 150,
        bessKWh: 600,
        generatorKW: 200, // Generator NOT ITC eligible
      };

      const result = calculateSystemCosts(config);
      const expectedITC = (result.solarCost + result.bessCost) * 0.3;

      expect(result.federalITC).toBeCloseTo(expectedITC, 0);
    });

    it("should apply tiered margin correctly", () => {
      const smallConfig: EquipmentConfig = { solarKW: 50, bessKW: 50, bessKWh: 200 };
      const mediumConfig: EquipmentConfig = { solarKW: 200, bessKW: 200, bessKWh: 800 };
      const largeConfig: EquipmentConfig = { solarKW: 500, bessKW: 500, bessKWh: 2000 };

      const smallResult = calculateSystemCosts(smallConfig);
      const mediumResult = calculateSystemCosts(mediumConfig);
      const largeResult = calculateSystemCosts(largeConfig);

      // Small projects should have 20% margin
      expect(smallResult.merlinFees.effectiveMargin).toBe(0.2);

      // Medium projects should have 14% margin
      expect(mediumResult.merlinFees.effectiveMargin).toBe(0.14);

      // Large projects should have 13% margin
      expect(largeResult.merlinFees.effectiveMargin).toBe(0.13);
    });
  });

  describe("calculateAnnualSavings", () => {
    const baseInputs: SavingsInputs = {
      bessKW: 150,
      bessKWh: 600,
      solarKW: 100,
      generatorKW: 200,
      evChargers: 2,
      electricityRate: 0.12,
      demandCharge: 15,
      sunHoursPerDay: 5,
      cyclesPerYear: 250,
    };

    it("should calculate positive savings for typical inputs", () => {
      const result = calculateAnnualSavings(baseInputs, 100);

      expect(result.demandChargeSavings).toBeGreaterThan(0);
      expect(result.solarSavings).toBeGreaterThan(0);
      expect(result.grossAnnualSavings).toBeGreaterThan(0);
      expect(result.netAnnualSavings).toBeGreaterThan(0);
      expect(result.netAnnualSavings).toBeLessThan(result.grossAnnualSavings);
    });

    it("should handle TOU arbitrage when enabled", () => {
      const inputsWithTOU: SavingsInputs = {
        ...baseInputs,
        hasTOU: true,
        peakRate: 0.25,
      };

      const resultWithTOU = calculateAnnualSavings(inputsWithTOU, 100);
      const resultWithoutTOU = calculateAnnualSavings(baseInputs, 100);

      expect(resultWithTOU.touArbitrageSavings).toBeGreaterThan(0);
      expect(resultWithoutTOU.touArbitrageSavings).toBe(0);
      expect(resultWithTOU.grossAnnualSavings).toBeGreaterThan(resultWithoutTOU.grossAnnualSavings);
    });

    it("should warn about unrealistic electricity rates", () => {
      const consoleSpy = vi.spyOn(console, "warn");

      const highRateInputs: SavingsInputs = {
        ...baseInputs,
        electricityRate: 5.0, // Unrealistically high
      };

      calculateAnnualSavings(highRateInputs, 100);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unrealistic electricity rate")
      );
    });

    it("should handle zero BESS and solar gracefully", () => {
      const noEquipmentInputs: SavingsInputs = {
        ...baseInputs,
        bessKW: 0,
        solarKW: 0,
      };

      const result = calculateAnnualSavings(noEquipmentInputs, 0);

      expect(result.demandChargeSavings).toBe(0);
      expect(result.solarSavings).toBe(0);
    });

    it("should calculate solar savings proportional to sun hours", () => {
      const highSunInputs: SavingsInputs = {
        ...baseInputs,
        sunHoursPerDay: 7, // Phoenix
      };

      const lowSunInputs: SavingsInputs = {
        ...baseInputs,
        sunHoursPerDay: 3, // Seattle
      };

      const highSunResult = calculateAnnualSavings(highSunInputs, 100);
      const lowSunResult = calculateAnnualSavings(lowSunInputs, 100);

      expect(highSunResult.solarSavings).toBeGreaterThan(lowSunResult.solarSavings);
      expect(highSunResult.solarSavings / lowSunResult.solarSavings).toBeCloseTo(7 / 3, 1);
    });
  });

  describe("calculateROI", () => {
    it("should calculate positive payback for profitable systems", () => {
      const result = calculateROI(500000, 100000);

      expect(result.paybackYears).toBe(5.0);
      expect(result.year1ROI).toBe(20);
      expect(result.roi10Year).toBe(100);
      expect(result.roi25Year).toBe(400);
      expect(result.npv25Year).toBeGreaterThan(0);
    });

    it("should handle zero annual savings gracefully", () => {
      const result = calculateROI(500000, 0);

      expect(result.paybackYears).toBe(999);
      expect(result.year1ROI).toBe(-100);
      expect(result.roi10Year).toBe(-100);
      expect(result.roi25Year).toBe(-100);
    });

    it("should handle negative annual savings", () => {
      const result = calculateROI(500000, -10000);

      expect(result.paybackYears).toBe(999);
      expect(result.year1ROI).toBe(-100);
    });

    it("should handle zero investment gracefully", () => {
      const result = calculateROI(0, 100000);

      expect(result.paybackYears).toBe(999);
      expect(result.npv25Year).toBe(0);
    });

    it("should handle negative investment", () => {
      const result = calculateROI(-100000, 50000);

      expect(result.paybackYears).toBe(999);
      expect(result.year1ROI).toBe(0);
    });

    it("should calculate NPV with proper discounting", () => {
      const result = calculateROI(500000, 100000, 0.05);

      // NPV should be positive but less than simple 25-year savings
      expect(result.npv25Year).toBeGreaterThan(0);
      expect(result.npv25Year).toBeLessThan(100000 * 25 - 500000);
    });
  });

  describe("calculateMerlinFees", () => {
    it("should apply 20% margin for small projects (<$200K)", () => {
      const result = calculateMerlinFees(150000);

      expect(result.effectiveMargin).toBe(0.2);
      expect(result.totalFee).toBe(30000);
    });

    it("should apply 14% margin for medium projects ($200K-$800K)", () => {
      const result = calculateMerlinFees(500000);

      expect(result.effectiveMargin).toBe(0.14);
      expect(result.totalFee).toBe(70000);
    });

    it("should apply 13% margin for large projects (>$800K)", () => {
      const result = calculateMerlinFees(1000000);

      expect(result.effectiveMargin).toBe(0.13);
      expect(result.totalFee).toBe(130000);
    });

    it("should break down fees into components", () => {
      const result = calculateMerlinFees(500000);

      expect(result.designIntelligence).toBeGreaterThan(0);
      expect(result.procurementSourcing).toBeGreaterThan(0);
      expect(result.pmConstruction).toBeGreaterThan(0);
      expect(result.incentiveFiling).toBeGreaterThan(0);

      const sum =
        result.designIntelligence +
        result.procurementSourcing +
        result.pmConstruction +
        result.incentiveFiling;

      expect(sum).toBe(result.totalFee);
    });
  });

  describe("calculateFederalITC", () => {
    it("should calculate 30% ITC for solar and BESS", () => {
      const result = calculateFederalITC({
        solar: 100000,
        bess: 200000,
      });

      expect(result).toBe(90000); // 30% of $300K
    });

    it("should not include generator in ITC", () => {
      const result = calculateFederalITC({
        solar: 100000,
        bess: 200000,
        generator: 100000, // Not eligible
      });

      expect(result).toBe(90000); // Still 30% of $300K (solar + BESS only)
    });

    it("should not include EV charging in ITC", () => {
      const result = calculateFederalITC({
        solar: 100000,
        bess: 200000,
        evCharging: 50000, // Not eligible for ITC (has separate credits)
      });

      expect(result).toBe(90000);
    });

    it("should handle zero eligible equipment", () => {
      const result = calculateFederalITC({
        generator: 100000,
        evCharging: 50000,
      });

      expect(result).toBe(0);
    });
  });

  describe("Edge Cases & Breakpoints", () => {
    it("should handle very small systems (residential scale)", () => {
      const config: EquipmentConfig = {
        solarKW: 5,
        bessKW: 10,
        bessKWh: 20,
      };

      expect(() => calculateSystemCosts(config)).not.toThrow();
    });

    it("should handle maximum viable commercial system", () => {
      const config: EquipmentConfig = {
        solarKW: 9999,
        bessKW: 4999,
        bessKWh: 49999,
        generatorKW: 4999,
      };

      expect(() => calculateSystemCosts(config)).not.toThrow();
    });

    it("should handle margin tier boundaries correctly", () => {
      // Just below 20% tier
      const result1 = calculateSystemCosts({ solarKW: 50, bessKW: 50, bessKWh: 200 });
      expect(result1.merlinFees.effectiveMargin).toBe(0.2);

      // Just above 14% tier threshold
      const result2 = calculateSystemCosts({ solarKW: 150, bessKW: 150, bessKWh: 600 });
      expect(result2.merlinFees.effectiveMargin).toBe(0.14);

      // Just above 13% tier threshold
      const result3 = calculateSystemCosts({ solarKW: 600, bessKW: 600, bessKWh: 2400 });
      expect(result3.merlinFees.effectiveMargin).toBe(0.13);
    });

    it("should handle rounding edge cases", () => {
      const config: EquipmentConfig = {
        solarKW: 100.5555, // Test floating point
        bessKW: 150.7777,
        bessKWh: 600.9999,
      };

      const result = calculateSystemCosts(config);

      // All costs should be integers
      expect(Number.isInteger(result.solarCost)).toBe(true);
      expect(Number.isInteger(result.bessCost)).toBe(true);
      expect(Number.isInteger(result.totalInvestment)).toBe(true);
    });
  });
});
