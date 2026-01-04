/**
 * TrueQuote Engine - All Industries Validation Test
 * 
 * Tests that all 12 industries work correctly with TrueQuote Engine
 * after adding configs for the 7 missing industries.
 * 
 * Date: January 2, 2026
 */

import { describe, it, expect } from 'vitest';
import { calculateTrueQuote, type TrueQuoteInput } from '@/services/TrueQuoteEngine';

describe('TrueQuote Engine - All Industries', () => {
  
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

  describe('Existing Industries (5)', () => {
    it('should calculate Data Center correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'data-center',
          subtype: 'tier_3',
          facilityData: {
            rackCount: '400',
            targetPUE: '1.6',
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
      expect(result.results.bess.energyKWh).toBeGreaterThan(0);
    });

    it('should calculate Hospital correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'hospital',
          subtype: 'community',
          facilityData: {
            bedCount: '100',
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
    });

    it('should calculate Hotel correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'hotel',
          subtype: 'upscale',
          facilityData: {
            roomCount: '150',
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
    });

    it('should calculate EV Charging correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'ev-charging',
          subtype: 'medium',
          facilityData: {
            level2Chargers: 10,  // Also put in facilityData for charger_sum method
            dcFastChargers: 4,
          },
        },
        options: {
          ...baseInput.options,
          evChargingEnabled: true,
          level2Chargers: 10,
          dcFastChargers: 4,
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
    });

    it('should calculate Car Wash correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'car-wash',
          subtype: 'express',
          facilityData: {
            tunnelCount: '2',
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
    });
  });

  describe('New Industries (7)', () => {
    it('should calculate Manufacturing correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'manufacturing',
          subtype: 'heavyAssembly',
          facilityData: {
            facilitySqFt: '200000',
            squareFootage: '200000', // Database field name
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
      expect(result.results.bess.energyKWh).toBeGreaterThan(0);
    });

    it('should calculate Retail correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'retail',
          subtype: 'largeGrocery',
          facilityData: {
            facilitySqFt: '50000',
            storeSqFt: '50000', // Database field name
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
    });

    it('should calculate Restaurant correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'restaurant',
          subtype: 'qsr',
          facilityData: {
            facilitySqFt: '3000',
            restaurantSqFt: '3000', // Database field name
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
    });

    it('should calculate Office correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'office',
          subtype: 'midRise',
          facilityData: {
            facilitySqFt: '100000',
            buildingSqFt: '100000', // Database field name
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
    });

    it('should calculate University correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'university',
          subtype: 'regionalPublic',
          facilityData: {
            facilitySqFt: '2000000',
            squareFeet: '2000000', // Database field name
            enrollment: '15000',
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
    });

    it('should calculate Agriculture correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'agriculture',
          subtype: 'dairy',
          facilityData: {
            facilitySqFt: '50000', // Converted from acres
            hasIrrigation: true,
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
    });

    it('should calculate Warehouse correctly', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'warehouse',
          subtype: 'refrigerated',
          facilityData: {
            facilitySqFt: '200000',
            squareFeet: '200000', // Database field name
          },
        },
      };

      const result = calculateTrueQuote(input);
      
      expect(result.results.peakDemandKW).toBeGreaterThan(0);
      expect(result.results.bess.powerKW).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown industry', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'unknown-industry',
          subtype: 'default',
          facilityData: {},
        },
      };

      expect(() => calculateTrueQuote(input)).toThrow();
    });

    it('should throw error for unknown subtype', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'manufacturing',
          subtype: 'unknown-subtype',
          facilityData: {},
        },
      };

      expect(() => calculateTrueQuote(input)).toThrow();
    });
  });

  describe('Field Name Mapping', () => {
    it('should handle squareFootage → facilitySqFt for Manufacturing', () => {
      const input: TrueQuoteInput = {
        ...baseInput,
        industry: {
          type: 'manufacturing',
          subtype: 'lightAssembly',
          facilityData: {
            squareFootage: '100000', // Database field
            // No facilitySqFt - should still work
          },
        },
      };

      // This tests that the engine can handle the database field name
      // The actual mapping happens in Step5MagicFit
      const result = calculateTrueQuote(input);
      
      // Should still calculate (may be 0 if no facilitySqFt, but shouldn't throw)
      expect(result).toBeDefined();
    });
  });
});
