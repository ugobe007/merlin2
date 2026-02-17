/**
 * TrueQuote Engine - Configuration Validation Test
 * 
 * Tests 4-5 key use cases to verify updated industry configurations
 * match industry standards and produce accurate calculations.
 * 
 * Date: January 7, 2026
 */

import { describe, it, expect } from 'vitest';
import { calculateTrueQuote, type TrueQuoteInput } from '@/services/TrueQuoteEngine';

describe('TrueQuote Engine - Configuration Validation', () => {
  
  const baseInput: Omit<TrueQuoteInput, 'industry'> = {
    location: {
      zipCode: '89101',
      state: 'NV',
    },
    options: {
      solarEnabled: false,
      evChargingEnabled: false,
      generatorEnabled: false,
    },
  };

  // ============================================================================
  // TEST CASE 1: TRUCK STOP (Recently Fixed)
  // ============================================================================
  describe('1. Heavy Duty Truck Stop', () => {
    it('should recognize truck stop industry and calculate correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'heavy_duty_truck_stop',
          subtype: 'default',
          facilityData: {
            peakDemandKW: 3500, // Pre-calculated from truck stop calculator
            serviceBays: 4,
            mcsChargers: 2,
            dcfcChargers: 10,
            level2Chargers: 20,
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      // Should recognize the industry (no "Unknown industry type" error)
      expect(result).toBeDefined();
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      
      // BESS should be calculated: 3500kW × 0.5 multiplier = 1750kW
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
      expect(result.results.bess.energyKWh).toBeGreaterThan(0);
      
      // Duration should be 6 hours for truck stops
      expect(result.results.bess.durationHours).toBe(6);
      
      // Generator should be required for truck stops
      expect(result.results.generator?.required).toBe(true);
      
      console.log('✅ Truck Stop:', {
        peakDemand: result.results.peakDemandKW,
        bessKW: result.results.bess.powerKW,
        bessKWh: result.results.bess.energyKWh,
        generatorKW: result.results.generator?.capacityKW,
      });
    });

    it('should handle truck stop with pre-calculated peakDemandKW', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'heavy_duty_truck_stop',
          subtype: 'default',
          facilityData: {
            peakDemandKW: 2500, // From calculateTruckStopLoad
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      // Should use the pre-calculated value
      expect(result.results.peakDemandKW).toBeGreaterThanOrEqual(2500);
      
      // BESS sizing: 2500kW × 0.5 = 1250kW, × 6hrs = 7500kWh
      expect(result.results.bess.powerKW).toBeGreaterThan(1000);
      expect(result.results.bess.energyKWh).toBeGreaterThan(5000);
    });
  });

  // ============================================================================
  // TEST CASE 2: AIRPORT (Newly Added Config)
  // ============================================================================
  describe('2. Airport', () => {
    it('should calculate small regional airport correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'airport',
          subtype: 'smallRegional',
          facilityData: {
            peakDemandKW: 3000, // Pre-calculated from calculateAirportPower (0.5M passengers)
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result).toBeDefined();
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      
      // Small regional: 50% BESS multiplier, 2hr duration
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
      expect(result.results.bess.durationHours).toBe(2);
      
      // Generator required for airports
      expect(result.results.generator?.required).toBe(true);
      
      console.log('✅ Airport (Small Regional):', {
        peakDemand: result.results.peakDemandKW,
        bessKW: result.results.bess.powerKW,
        bessKWh: result.results.bess.energyKWh,
      });
    });

    it('should calculate major hub airport correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'airport',
          subtype: 'majorHub',
          facilityData: {
            peakDemandKW: 100000, // 100MW for major hub (e.g., 30M passengers)
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThanOrEqual(100000);
      
      // Major hub: 50% multiplier, 2hr duration
      // BESS: 100MW × 0.5 = 50MW, × 2hrs = 100MWh
      expect(result.results.bess.powerKW).toBeGreaterThan(10000);
      expect(result.results.bess.energyKWh).toBeGreaterThan(10000);
      
      console.log('✅ Airport (Major Hub):', {
        peakDemand: result.results.peakDemandKW,
        bessKW: result.results.bess.powerKW,
        bessKWh: result.results.bess.energyKWh,
      });
    });
  });

  // ============================================================================
  // TEST CASE 3: MANUFACTURING (Corrected Power Density)
  // ============================================================================
  describe('3. Manufacturing (Corrected: 15.0 W/sqft)', () => {
    it('should calculate manufacturing facility with correct power density', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'manufacturing',
          subtype: 'heavyAssembly',
          facilityData: {
            facilitySqFt: 100000, // 100,000 sq ft facility
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result).toBeDefined();
      
      // Should calculate: 100,000 sqft × 15.0 W/sqft = 1,500,000W = 1,500kW
      expect(result.results.peakDemandKW).toBeCloseTo(1500, 50); // Allow some variance for modifiers
      
      // BESS: 1500kW × 0.45 (heavyAssembly) = 675kW, × 4hrs = 2,700kWh
      expect(result.results.bess.powerKW).toBeGreaterThan(500);
      expect(result.results.bess.energyKWh).toBeGreaterThan(2000);
      
      console.log('✅ Manufacturing (100k sqft):', {
        peakDemand: result.results.peakDemandKW,
        expectedRange: '1450-1550 kW',
        bessKW: result.results.bess.powerKW,
        bessKWh: result.results.bess.energyKWh,
      });
    });

    it('should handle manufacturing with large motors modifier', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'manufacturing',
          subtype: 'processChemical',
          facilityData: {
            facilitySqFt: 50000,
            largeLoads: true, // Triggers 1.2x modifier
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      // Base: 50,000 × 15.0 = 750kW
      // With modifier: 750kW × 1.2 = 900kW
      expect(result.results.peakDemandKW).toBeGreaterThan(800);
      
      console.log('✅ Manufacturing (with modifier):', {
        peakDemand: result.results.peakDemandKW,
        bessKW: result.results.bess.powerKW,
      });
    });
  });

  // ============================================================================
  // TEST CASE 4: RETAIL (Corrected Power Density)
  // ============================================================================
  describe('4. Retail (Corrected: 8.0 W/sqft)', () => {
    it('should calculate retail store with correct power density', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'retail',
          subtype: 'largeGrocery',
          facilityData: {
            facilitySqFt: 50000, // 50,000 sq ft grocery store
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result).toBeDefined();
      
      // Should calculate: 50,000 sqft × 8.0 W/sqft = 400,000W = 400kW
      expect(result.results.peakDemandKW).toBeCloseTo(400, 50);
      
      // BESS: 400kW × 0.45 (largeGrocery) = 180kW, × 4hrs = 720kWh
      expect(result.results.bess.powerKW).toBeGreaterThan(100);
      expect(result.results.bess.energyKWh).toBeGreaterThan(400);
      
      console.log('✅ Retail (50k sqft):', {
        peakDemand: result.results.peakDemandKW,
        expectedRange: '350-450 kW',
        bessKW: result.results.bess.powerKW,
        bessKWh: result.results.bess.energyKWh,
      });
    });

    it('should handle retail with walk-in freezer modifier', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'retail',
          subtype: 'largeGrocery',
          facilityData: {
            facilitySqFt: 40000,
            walkInFreezer: true, // Triggers 1.2x modifier
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      // Base: 40,000 × 8.0 = 320kW
      // With modifier: 320kW × 1.2 = 384kW
      expect(result.results.peakDemandKW).toBeGreaterThan(350);
      
      console.log('✅ Retail (with freezer):', {
        peakDemand: result.results.peakDemandKW,
        bessKW: result.results.bess.powerKW,
      });
    });
  });

  // ============================================================================
  // TEST CASE 5: GAS STATION (Newly Added Config)
  // ============================================================================
  describe('5. Gas Station', () => {
    it('should calculate gas station with convenience store correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'gas_station',
          subtype: 'with-cstore',
          facilityData: {
            peakDemandKW: 50, // Pre-calculated: 10 dispensers × 1.5kW + 15kW store = 30kW base, ~50kW peak
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result).toBeDefined();
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      
      // BESS: 50kW × 0.4 = 20kW, × 4hrs = 80kWh
      expect(result.results.bess.powerKW).toBeGreaterThan(10);
      expect(result.results.bess.energyKWh).toBeGreaterThan(40);
      
      // Generator not required for standard gas stations (may be undefined)
      expect(result.results.generator?.required).not.toBe(true);
      
      console.log('✅ Gas Station (with C-store):', {
        peakDemand: result.results.peakDemandKW,
        bessKW: result.results.bess.powerKW,
        bessKWh: result.results.bess.energyKWh,
      });
    });

    it('should handle truck stop subtype (different from heavy_duty_truck_stop)', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'gas_station',
          subtype: 'truck-stop',
          facilityData: {
            peakDemandKW: 200, // Large truck stop gas station
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result).toBeDefined();
      
      // Truck stop subtype: 50% multiplier, 6hr duration, generator required
      expect(result.results.bess.durationHours).toBe(6);
      expect(result.results.generator?.required).toBe(true);
      
      console.log('✅ Gas Station (Truck Stop):', {
        peakDemand: result.results.peakDemandKW,
        bessKW: result.results.bess.powerKW,
        duration: result.results.bess.durationHours,
      });
    });
  });

  // ============================================================================
  // ADDITIONAL VALIDATION: HOTEL (Corrected Per-Room Value)
  // ============================================================================
  describe('6. Hotel (Corrected: 3500W/room)', () => {
    it('should calculate hotel with correct per-room power', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'hotel',
          subtype: 'upscale',
          facilityData: {
            roomCount: 200, // 200-room hotel
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result).toBeDefined();
      
      // Should calculate: 200 rooms × 3500W = 700,000W = 700kW
      // But upscale hotels have modifiers, so allow range
      expect(result.results.peakDemandKW).toBeGreaterThan(600);
      expect(result.results.peakDemandKW).toBeLessThan(900);
      
      // BESS: ~700kW × 0.5 (upscale) = 350kW, × 4hrs = 1400kWh
      expect(result.results.bess.powerKW).toBeGreaterThan(200);
      expect(result.results.bess.energyKWh).toBeGreaterThan(800);
      
      console.log('✅ Hotel (200 rooms, upscale):', {
        peakDemand: result.results.peakDemandKW,
        expectedRange: '600-900 kW (with modifiers)',
        bessKW: result.results.bess.powerKW,
        bessKWh: result.results.bess.energyKWh,
      });
    });
  });

  // ============================================================================
  // CONFIGURATION ACCURACY CHECKS
  // ============================================================================
  describe('Configuration Accuracy Validation', () => {
    it('should use correct power density for office (6.0 W/sqft)', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'office',
          subtype: 'midRise',
          facilityData: {
            facilitySqFt: 100000, // 100,000 sq ft office
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      // Should calculate: 100,000 × 6.0 = 600kW
      expect(result.results.peakDemandKW).toBeCloseTo(600, 50);
      
      console.log('✅ Office Power Density Check:', {
        calculated: result.results.peakDemandKW,
        expected: '550-650 kW',
        wattsPerSqft: '6.0 (corrected from 0.6)',
      });
    });

    it('should use correct power density for warehouse (2.0 W/sqft)', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'warehouse',
          subtype: 'general',
          facilityData: {
            facilitySqFt: 200000, // 200,000 sq ft warehouse
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      // Should calculate: 200,000 × 2.0 = 400kW
      expect(result.results.peakDemandKW).toBeCloseTo(400, 50);
      
      console.log('✅ Warehouse Power Density Check:', {
        calculated: result.results.peakDemandKW,
        expected: '350-450 kW',
        wattsPerSqft: '2.0 (corrected from 0.2)',
      });
    });

    it('should use correct power density for government (1.5 W/sqft)', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'government',
          subtype: 'default',
          facilityData: {
            facilitySqFt: 50000, // 50,000 sq ft government building
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      // Should calculate: 50,000 × 1.5 = 75kW
      expect(result.results.peakDemandKW).toBeCloseTo(75, 20);
      
      console.log('✅ Government Power Density Check:', {
        calculated: result.results.peakDemandKW,
        expected: '65-85 kW',
        wattsPerSqft: '1.5 (corrected from 6.0)',
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING & EDGE CASES
  // ============================================================================
  describe('Error Handling', () => {
    it('should throw error for unknown industry type', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'unknown-industry-xyz',
          subtype: 'default',
          facilityData: {},
        },
      };

      expect(() => calculateTrueQuote(input)).toThrow(/Unknown industry type/);
    });

    it('should handle missing facility data gracefully', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'retail',
          subtype: 'convenienceStore',
          facilityData: {}, // No square footage
        },
      };

      // Should not throw, but may return 0 or default values
      const result = calculateTrueQuote(input);
      expect(result).toBeDefined();
    });
  });
});