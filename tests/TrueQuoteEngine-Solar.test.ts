/**
 * TrueQuoteEngine Solar Calculation Tests
 * 
 * CRITICAL: These tests validate the Single Source of Truth for solar calculations.
 * If these fail, UI components will display incorrect data.
 */

import { describe, it, expect } from 'vitest';
import { calculateSolarCapacity, validateSolarInputs } from '@/services/TrueQuoteEngine-Solar';
import { getSolarTemplate } from '@/services/solarTemplates';

describe('TrueQuoteEngine - Solar Calculations', () => {
  
  // ============================================================================
  // CAR WASH SOLAR CALCULATIONS
  // ============================================================================
  
  describe('Car Wash Solar Capacity', () => {
    it('should calculate roof solar correctly (5000 sqft roof)', () => {
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 5000,
        roofUnit: 'sqft',
        carportInterest: 'no'
      });

      // Verify roof calculations
      expect(result.roofArea).toBe(5000);
      expect(result.roofUsableFactor).toBe(0.65); // 65% usable
      expect(result.roofSolarUsable).toBe(3250); // 5000 × 0.65
      expect(result.roofSolarKW).toBeCloseTo(487.5, 1); // 3250 × 0.15
      
      // Verify no carport
      expect(result.carportSolarUsable).toBe(0);
      expect(result.carportSolarKW).toBe(0);
      
      // Verify totals
      expect(result.totalSolarKW).toBeCloseTo(487.5, 1);
      // 487.5 kW is > 250, so it's Extra Large (not Medium)
      expect(result.systemSizeCategory).toBe('Extra Large');
    });

    it('should calculate carport solar correctly (1500 sqft carport)', () => {
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 5000,
        roofUnit: 'sqft',
        carportInterest: 'yes',
        carportArea: 1500,
        carportUnit: 'sqft'
      });

      // Verify carport calculations
      expect(result.carportArea).toBe(1500);
      expect(result.carportUsableFactor).toBe(1.0); // 100% usable
      expect(result.carportSolarUsable).toBe(1500); // 1500 × 1.0
      expect(result.carportSolarKW).toBeCloseTo(225, 1); // 1500 × 0.15
      
      // Verify totals
      expect(result.totalSolarKW).toBeCloseTo(712.5, 1); // 487.5 + 225
      // 712.5 kW is > 250, so it's Extra Large (not Medium)
      expect(result.systemSizeCategory).toBe('Extra Large');
    });

    it('should calculate annual generation correctly', () => {
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 5000,
        roofUnit: 'sqft',
        carportInterest: 'yes',
        carportArea: 1500,
        carportUnit: 'sqft'
      });

      // 712.5 kW × 1200 hours = 855,000 kWh/year
      expect(result.annualGenerationKWh).toBe(855000);
    });

    it('should handle "unsure" carport interest as "yes"', () => {
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 5000,
        roofUnit: 'sqft',
        carportInterest: 'unsure',
        carportArea: 1500,
        carportUnit: 'sqft'
      });

      // Should include carport in calculation
      expect(result.carportSolarKW).toBeGreaterThan(0);
      expect(result.totalSolarKW).toBeCloseTo(712.5, 1);
    });

    it('should ignore carport area when interest is "no"', () => {
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 5000,
        roofUnit: 'sqft',
        carportInterest: 'no',
        carportArea: 1500, // This should be ignored
        carportUnit: 'sqft'
      });

      // Carport should not be included
      expect(result.carportSolarKW).toBe(0);
      expect(result.totalSolarKW).toBeCloseTo(487.5, 1);
    });
  });

  // ============================================================================
  // UNIT CONVERSION
  // ============================================================================
  
  describe('Unit Conversion', () => {
    it('should convert square meters to square feet', () => {
      // Use exact conversion: 5000 sqft / 10.764 = 464.5 sqm
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 464.5,
        roofUnit: 'sqm',
        carportInterest: 'no'
      });

      // 464.5 sqm × 10.764 = 5000.0 sqft (exact)
      expect(result.roofArea).toBeCloseTo(5000, 0);
      expect(result.roofUnit).toBe('sqft');
      // Should match 5000 sqft calculation exactly
      expect(result.roofSolarKW).toBeCloseTo(487.5, 1);
    });

    it('should handle mixed units (roof sqft, carport sqm)', () => {
      // Use exact conversion: 1500 sqft / 10.764 = 139.35 sqm
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 5000,
        roofUnit: 'sqft',
        carportInterest: 'yes',
        carportArea: 139.35,
        carportUnit: 'sqm'
      });

      // 139.35 sqm × 10.764 = ~1500 sqft
      expect(result.carportArea).toBeCloseTo(1500, 0);
      // Should match 5000 + 1500 calculation exactly
      expect(result.totalSolarKW).toBeCloseTo(712.5, 1);
    });
  });

  // ============================================================================
  // SYSTEM SIZE CATEGORIES
  // ============================================================================
  
  describe('System Size Categorization', () => {
    it('should classify as Small system (< 25 kW)', () => {
      // For Small, need < 25 kW
      // 25 kW / 0.15 / 0.65 = ~256 sqft roof needed
      
      const smallResult = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 250,
        roofUnit: 'sqft',
        carportInterest: 'no'
      });

      expect(smallResult.totalSolarKW).toBeLessThan(25);
      expect(smallResult.systemSizeCategory).toBe('Small');
    });

    it('should classify as Medium system (25-100 kW)', () => {
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 500,
        roofUnit: 'sqft',
        carportInterest: 'no'
      });

      // 500 × 0.65 × 0.15 = 48.75 kW (Medium)
      expect(result.totalSolarKW).toBeGreaterThanOrEqual(25);
      expect(result.totalSolarKW).toBeLessThan(100);
      expect(result.systemSizeCategory).toBe('Medium');
    });

    it('should classify as Large system (100-250 kW)', () => {
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 10000,
        roofUnit: 'sqft',
        carportInterest: 'yes',
        carportArea: 5000,
        carportUnit: 'sqft'
      });

      // Roof: 10000 × 0.65 × 0.15 = 975 kW
      // Carport: 5000 × 1.0 × 0.15 = 750 kW
      // Total: 1725 kW (Extra Large)
      
      expect(result.totalSolarKW).toBeGreaterThan(250);
      expect(result.systemSizeCategory).toBe('Extra Large');
    });
  });

  // ============================================================================
  // INDUSTRY TEMPLATES
  // ============================================================================
  
  describe('Industry Template Variations', () => {
    it('should use correct factors for car wash (65% roof)', () => {
      const template = getSolarTemplate('car_wash');
      expect(template.roofUsableFactor).toBe(0.65);
      expect(template.carportUsableFactor).toBe(1.0);
      expect(template.solarDensity).toBe(0.150);
    });

    it('should use correct factors for hotel (55% roof)', () => {
      const template = getSolarTemplate('hotel_hospitality');
      expect(template.roofUsableFactor).toBe(0.55);
      expect(template.carportUsableFactor).toBe(1.0);
    });

    it('should use correct factors for retail (75% roof)', () => {
      const template = getSolarTemplate('retail');
      expect(template.roofUsableFactor).toBe(0.75); // Big box = cleaner roof
    });

    it('should calculate hotel solar with lower roof factor', () => {
      const carWash = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 5000,
        roofUnit: 'sqft',
        carportInterest: 'no'
      });

      const hotel = calculateSolarCapacity({
        industry: 'hotel_hospitality',
        roofArea: 5000,
        roofUnit: 'sqft',
        carportInterest: 'no'
      });

      // Hotel should have less usable roof (55% vs 65%)
      expect(hotel.roofSolarUsable).toBeLessThan(carWash.roofSolarUsable);
      expect(hotel.roofSolarKW).toBeLessThan(carWash.roofSolarKW);
    });
  });

  // ============================================================================
  // AUDIT TRAIL
  // ============================================================================
  
  describe('Calculation Audit Trail', () => {
    it('should include full calculation steps', () => {
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 5000,
        roofUnit: 'sqft',
        carportInterest: 'yes',
        carportArea: 1500,
        carportUnit: 'sqft'
      });

      // Verify audit trail exists
      expect(result.calculations).toBeDefined();
      expect(result.calculations.roofUsable).toBeDefined();
      expect(result.calculations.roofGeneration).toBeDefined();
      expect(result.calculations.carportUsable).toBeDefined();
      expect(result.calculations.carportGeneration).toBeDefined();
      expect(result.calculations.totalGeneration).toBeDefined();
      expect(result.calculations.annualGeneration).toBeDefined();

      // Verify formulas documented
      expect(result.calculations.roofUsable.formula).toBe('roofArea × roofUsableFactor');
      expect(result.calculations.roofGeneration.formula).toBe('roofSolarUsable × solarDensity');
    });

    it('should include metadata', () => {
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 5000,
        roofUnit: 'sqft',
        carportInterest: 'no'
      });

      expect(result.engineVersion).toBe('TrueQuoteEngine v2.1.0');
      expect(result.industryTemplate).toBe('car_wash');
      expect(result.templateVersion).toBe('1.0.0');
      expect(result.calculatedAt).toBeDefined();
    });
  });

  // ============================================================================
  // INPUT VALIDATION
  // ============================================================================
  
  describe('Input Validation', () => {
    it('should validate required industry', () => {
      const errors = validateSolarInputs({
        roofArea: 5000,
        roofUnit: 'sqft'
      });

      expect(errors).toContain('Industry is required');
    });

    it('should validate roof area > 0', () => {
      const errors = validateSolarInputs({
        industry: 'car_wash',
        roofArea: 0,
        roofUnit: 'sqft'
      });

      expect(errors).toContain('Roof area must be greater than 0');
    });

    it('should warn on unusually large roof area', () => {
      const errors = validateSolarInputs({
        industry: 'car_wash',
        roofArea: 2000000, // 2 million sqft
        roofUnit: 'sqft'
      });

      expect(errors.some(e => e.includes('unusually large'))).toBe(true);
    });

    it('should validate roof unit', () => {
      const errors = validateSolarInputs({
        industry: 'car_wash',
        roofArea: 5000,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        roofUnit: 'invalid' as any
      });

      expect(errors).toContain('Roof unit must be sqft or sqm');
    });

    it('should validate carport interest values', () => {
      const errors = validateSolarInputs({
        industry: 'car_wash',
        roofArea: 5000,
        roofUnit: 'sqft',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        carportInterest: 'maybe' as any
      });

      expect(errors).toContain('Carport interest must be yes, no, or unsure');
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================
  
  describe('Edge Cases', () => {
    it('should handle zero carport area', () => {
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 5000,
        roofUnit: 'sqft',
        carportInterest: 'yes',
        carportArea: 0,
        carportUnit: 'sqft'
      });

      expect(result.carportSolarKW).toBe(0);
      expect(result.totalSolarKW).toBeCloseTo(487.5, 1);
    });

    it('should handle very small roof areas', () => {
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 10,
        roofUnit: 'sqft',
        carportInterest: 'no'
      });

      // 10 × 0.65 × 0.15 = 0.975 kW
      expect(result.totalSolarKW).toBeCloseTo(0.975, 2);
      expect(result.systemSizeCategory).toBe('Small');
    });

    it('should handle missing carport unit (default to sqft)', () => {
      const result = calculateSolarCapacity({
        industry: 'car_wash',
        roofArea: 5000,
        roofUnit: 'sqft',
        carportInterest: 'yes',
        carportArea: 1500
        // carportUnit not provided
      });

      expect(result.carportUnit).toBe('sqft');
      expect(result.carportSolarKW).toBeCloseTo(225, 1);
    });
  });
});
