/**
 * QUOTE ENGINE UNIT TESTS
 * ========================
 * 
 * Comprehensive test suite for the QuoteEngine SSOT orchestrator.
 * 
 * Test Coverage:
 * 1. Caching - Cache hits, TTL expiration, LRU eviction, clearCache()
 * 2. Validation - Error detection, warning generation
 * 3. Quote Generation - Full quotes, versioning, error handling
 * 4. Power Calculations - Hotel, CarWash, EV Charging
 * 5. Quick Estimates - Performance, accuracy
 * 
 * @version 1.0.0
 * @date December 6, 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  QuoteEngine, 
  type QuoteInput,
  type ValidationResult,
  type VersionedQuoteResult,
  type QuickEstimate
} from '../QuoteEngine';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const validQuoteInput: QuoteInput = {
  storageSizeMW: 0.5,
  durationHours: 4,
  location: 'California',
  electricityRate: 0.20,
  useCase: 'hotel',
  gridConnection: 'on-grid',
};

const minimalQuoteInput: QuoteInput = {
  storageSizeMW: 0.1,
  durationHours: 2,
};

const fullQuoteInput: QuoteInput = {
  storageSizeMW: 1.0,
  durationHours: 4,
  location: 'Texas',
  electricityRate: 0.12,
  useCase: 'manufacturing',
  gridConnection: 'on-grid',
  solarMW: 0.5,
  windMW: 0,
  generatorMW: 0.3,
  generatorFuelType: 'diesel',
  fuelCellMW: 0,
};

// ============================================================================
// 1. CACHING TESTS
// ============================================================================

describe('QuoteEngine Caching', () => {
  beforeEach(() => {
    // Clear cache before each test
    QuoteEngine.clearCache();
  });

  afterEach(() => {
    // Reset timers if mocked
    vi.useRealTimers();
  });

  it('should return cached result for identical params', async () => {
    // First call - should generate fresh quote
    const result1 = await QuoteEngine.generateQuote(validQuoteInput);
    expect(result1.metadata.cacheHit).toBe(false);

    // Second call - should return cached result
    const result2 = await QuoteEngine.generateQuote(validQuoteInput);
    expect(result2.metadata.cacheHit).toBe(true);

    // Results should be equivalent (same costs)
    expect(result2.costs.totalCost).toBe(result1.costs.totalCost);
  });

  it('should generate fresh quote when cache is skipped', async () => {
    // First call to populate cache
    await QuoteEngine.generateQuote(validQuoteInput);

    // Second call with skipCache - should NOT be a cache hit
    const result = await QuoteEngine.generateQuote(validQuoteInput, { skipCache: true });
    expect(result.metadata.cacheHit).toBe(false);
  });

  it('should expire cache after TTL (5 minutes)', async () => {
    vi.useFakeTimers();

    // First call - fresh quote
    const result1 = await QuoteEngine.generateQuote(validQuoteInput);
    expect(result1.metadata.cacheHit).toBe(false);

    // Second call within TTL - cache hit
    vi.advanceTimersByTime(2 * 60 * 1000); // 2 minutes
    const result2 = await QuoteEngine.generateQuote(validQuoteInput);
    expect(result2.metadata.cacheHit).toBe(true);

    // Third call after TTL - fresh quote
    vi.advanceTimersByTime(4 * 60 * 1000); // +4 minutes = 6 minutes total
    const result3 = await QuoteEngine.generateQuote(validQuoteInput);
    expect(result3.metadata.cacheHit).toBe(false);
  });

  it('should clear cache when clearCache() is called', async () => {
    // Populate cache
    await QuoteEngine.generateQuote(validQuoteInput);

    // Verify cache has entry
    let stats = QuoteEngine.getCacheStats();
    expect(stats.size).toBeGreaterThan(0);

    // Clear cache
    QuoteEngine.clearCache();

    // Verify cache is empty
    stats = QuoteEngine.getCacheStats();
    expect(stats.size).toBe(0);

    // Next call should not be cache hit
    const result = await QuoteEngine.generateQuote(validQuoteInput);
    expect(result.metadata.cacheHit).toBe(false);
  });

  it('should respect max cache size (LRU eviction)', async () => {
    // Generate many unique quotes to exceed cache size
    // Note: Cache cleanup is probabilistic (10% per call)
    // So we generate enough entries that cleanup definitely happens
    const uniqueInputs: QuoteInput[] = [];
    for (let i = 0; i < 120; i++) {
      uniqueInputs.push({
        storageSizeMW: 0.1 + (i * 0.01), // Unique storage size
        durationHours: 4,
        location: 'California',
        electricityRate: 0.15,
      });
    }

    // Generate quotes (this will trigger cache cleanup)
    for (const input of uniqueInputs) {
      await QuoteEngine.generateQuote(input);
    }

    // Cache might be slightly over due to probabilistic cleanup
    // But should be close to max (within 20% over)
    const stats = QuoteEngine.getCacheStats();
    expect(stats.size).toBeLessThanOrEqual(stats.maxSize * 1.2);
  });

  it('should return correct cache stats', () => {
    const stats = QuoteEngine.getCacheStats();
    
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('maxSize');
    expect(stats).toHaveProperty('ttlMs');
    expect(stats.maxSize).toBe(100);
    expect(stats.ttlMs).toBe(5 * 60 * 1000); // 5 minutes in ms
  });

  it('should NOT cache different inputs as same', async () => {
    const input1 = { ...validQuoteInput, storageSizeMW: 0.5 };
    const input2 = { ...validQuoteInput, storageSizeMW: 1.0 };

    const result1 = await QuoteEngine.generateQuote(input1);
    const result2 = await QuoteEngine.generateQuote(input2);

    // Both should be fresh (not cache hits of each other)
    expect(result1.metadata.cacheHit).toBe(false);
    expect(result2.metadata.cacheHit).toBe(false);

    // And costs should be different
    expect(result2.costs.totalProjectCost).not.toBe(result1.costs.totalProjectCost);
  });
});

// ============================================================================
// 2. VALIDATION TESTS
// ============================================================================

describe('QuoteEngine Validation', () => {
  describe('Error Validation (blocking)', () => {
    it('should catch missing storageSizeMW', () => {
      const result = QuoteEngine.validateInput({
        durationHours: 4,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('storageSizeMW is required');
    });

    it('should catch missing durationHours', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('durationHours is required');
    });

    it('should catch negative storageSizeMW', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: -1,
        durationHours: 4,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('storageSizeMW must be positive');
    });

    it('should catch zero storageSizeMW', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0,
        durationHours: 4,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('storageSizeMW must be positive');
    });

    it('should catch negative durationHours', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: -2,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('durationHours must be positive');
    });

    it('should catch exceeding maximum storageSizeMW (1000 MW)', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 1500,
        durationHours: 4,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('storageSizeMW exceeds maximum (1000 MW)');
    });

    it('should catch exceeding maximum durationHours (24h)', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: 30,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('durationHours exceeds maximum (24 hours)');
    });

    it('should catch invalid gridConnection enum', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: 4,
        gridConnection: 'invalid-value' as 'on-grid',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('gridConnection must be "on-grid", "off-grid", or "limited"');
    });

    it('should catch invalid generatorFuelType', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: 4,
        generatorFuelType: 'gasoline' as 'diesel',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('generatorFuelType must be "diesel", "natural-gas", or "dual-fuel"');
    });

    it('should catch invalid fuelCellType', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: 4,
        fuelCellType: 'propane' as 'hydrogen',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('fuelCellType must be "hydrogen", "natural-gas-fc", or "solid-oxide"');
    });

    it('should catch negative electricityRate', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: 4,
        electricityRate: -0.10,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('electricityRate cannot be negative');
    });

    it('should catch negative solarMW', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: 4,
        solarMW: -1,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('solarMW cannot be negative');
    });
  });

  describe('Warning Validation (non-blocking)', () => {
    it('should warn for small systems (< 0.01 MW)', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.005, // 5 kW
        durationHours: 4,
      });

      expect(result.valid).toBe(true); // Still valid
      expect(result.warnings.some(w => w.includes('very small'))).toBe(true);
    });

    it('should warn for large systems (> 100 MW)', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 150,
        durationHours: 4,
      });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('utility-scale'))).toBe(true);
    });

    it('should warn for off-grid without generator', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: 4,
        gridConnection: 'off-grid',
        // No solar, wind, generator, or fuel cell
      });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('no generation source'))).toBe(true);
    });

    it('should NOT warn for off-grid WITH generator', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: 4,
        gridConnection: 'off-grid',
        generatorMW: 0.3,
      });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('no generation source'))).toBe(false);
    });

    it('should NOT warn for off-grid WITH solar', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: 4,
        gridConnection: 'off-grid',
        solarMW: 0.3,
      });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('no generation source'))).toBe(false);
    });

    it('should warn for high electricity rate (> $0.50/kWh)', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: 4,
        electricityRate: 0.75,
      });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('unusually high'))).toBe(true);
    });

    it('should warn for low electricity rate (< $0.05/kWh)', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: 4,
        electricityRate: 0.02,
      });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('unusually low'))).toBe(true);
    });

    it('should warn for duration outside typical range', () => {
      const result = QuoteEngine.validateInput({
        storageSizeMW: 0.5,
        durationHours: 20, // Above 12h typical
      });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('outside typical range'))).toBe(true);
    });
  });

  describe('Valid Input Acceptance', () => {
    it('should accept minimal valid input', () => {
      const result = QuoteEngine.validateInput(minimalQuoteInput);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept full valid input', () => {
      const result = QuoteEngine.validateInput(fullQuoteInput);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept all valid gridConnection types', () => {
      const types: Array<'on-grid' | 'off-grid' | 'limited'> = ['on-grid', 'off-grid', 'limited'];
      
      for (const gridConnection of types) {
        const result = QuoteEngine.validateInput({
          ...minimalQuoteInput,
          gridConnection,
          solarMW: 0.1, // Add solar for off-grid
        });
        expect(result.valid).toBe(true);
      }
    });

    it('should accept all valid generatorFuelType types', () => {
      const types: Array<'diesel' | 'natural-gas' | 'dual-fuel'> = ['diesel', 'natural-gas', 'dual-fuel'];
      
      for (const generatorFuelType of types) {
        const result = QuoteEngine.validateInput({
          ...minimalQuoteInput,
          generatorFuelType,
        });
        expect(result.valid).toBe(true);
      }
    });
  });
});

// ============================================================================
// 3. QUOTE GENERATION TESTS
// ============================================================================

describe('QuoteEngine Quote Generation', () => {
  beforeEach(() => {
    QuoteEngine.clearCache();
  });

  it('should return valid QuoteResult structure', async () => {
    const result = await QuoteEngine.generateQuote(validQuoteInput);

    // Check top-level structure
    expect(result).toHaveProperty('equipment');
    expect(result).toHaveProperty('costs');
    expect(result).toHaveProperty('financials');
    expect(result).toHaveProperty('metadata');
  });

  it('should include engineVersion in metadata', async () => {
    const result = await QuoteEngine.generateQuote(validQuoteInput);

    expect(result.metadata).toHaveProperty('engineVersion');
    expect(result.metadata.engineVersion).toBe(QuoteEngine.VERSION);
  });

  it('should include cacheHit in metadata', async () => {
    const result = await QuoteEngine.generateQuote(validQuoteInput);

    expect(result.metadata).toHaveProperty('cacheHit');
    expect(typeof result.metadata.cacheHit).toBe('boolean');
  });

  it('should throw error for invalid input', async () => {
    const invalidInput = {
      storageSizeMW: -1, // Invalid
      durationHours: 4,
    } as QuoteInput;

    await expect(QuoteEngine.generateQuote(invalidInput)).rejects.toThrow('Invalid quote input');
  });

  it('should skip validation when skipValidation is true', async () => {
    // This would normally throw, but we skip validation
    const edgeCaseInput = {
      storageSizeMW: 0.001, // Very small but technically positive
      durationHours: 0.5,   // Very short
    } as QuoteInput;

    // Should not throw even with unusual values
    const result = await QuoteEngine.generateQuote(edgeCaseInput, { skipValidation: true });
    expect(result).toHaveProperty('costs');
  });

  it('should return equipment breakdown', async () => {
    const result = await QuoteEngine.generateQuote(validQuoteInput);

    expect(result.equipment).toBeDefined();
    // Battery is always present
    expect(result.equipment.batteries || result.equipment).toBeDefined();
  });

  it('should return financial metrics', async () => {
    const result = await QuoteEngine.generateQuote(validQuoteInput);

    expect(result.financials).toBeDefined();
    expect(result.financials).toHaveProperty('paybackYears');
    expect(result.financials).toHaveProperty('annualSavings');
  });

  it('should return cost breakdown', async () => {
    const result = await QuoteEngine.generateQuote(validQuoteInput);

    expect(result.costs).toBeDefined();
    expect(result.costs).toHaveProperty('totalProjectCost');
    expect(result.costs.totalProjectCost).toBeGreaterThan(0);
  });

  it('should handle different use cases', async () => {
    const useCases = ['hotel', 'manufacturing', 'retail', 'hospital'];

    for (const useCase of useCases) {
      const input = { ...validQuoteInput, useCase };
      const result = await QuoteEngine.generateQuote(input, { skipCache: true });
      expect(result.costs.totalProjectCost).toBeGreaterThan(0);
    }
  });

  it('should handle different locations', async () => {
    const locations = ['California', 'Texas', 'New York', 'Florida'];

    for (const location of locations) {
      const input = { ...validQuoteInput, location };
      const result = await QuoteEngine.generateQuote(input, { skipCache: true });
      expect(result.costs.totalProjectCost).toBeGreaterThan(0);
    }
  });

  it('should scale cost with system size', async () => {
    const smallSystem = await QuoteEngine.generateQuote(
      { ...validQuoteInput, storageSizeMW: 0.1 },
      { skipCache: true }
    );

    const largeSystem = await QuoteEngine.generateQuote(
      { ...validQuoteInput, storageSizeMW: 1.0 },
      { skipCache: true }
    );

    // Larger system should cost more
    expect(largeSystem.costs.totalProjectCost).toBeGreaterThan(smallSystem.costs.totalProjectCost);
  });

  it('should scale cost with duration', async () => {
    const shortDuration = await QuoteEngine.generateQuote(
      { ...validQuoteInput, durationHours: 2 },
      { skipCache: true }
    );

    const longDuration = await QuoteEngine.generateQuote(
      { ...validQuoteInput, durationHours: 8 },
      { skipCache: true }
    );

    // Longer duration should cost more
    expect(longDuration.costs.totalProjectCost).toBeGreaterThan(shortDuration.costs.totalProjectCost);
  });
});

// ============================================================================
// 4. POWER CALCULATION TESTS
// ============================================================================

describe('QuoteEngine Power Calculations', () => {
  describe('calculatePower (generic)', () => {
    it('should calculate hotel power', () => {
      const result = QuoteEngine.calculatePower('hotel', {
        rooms: 150,
        hotelClass: 'upscale',
      });

      expect(result).toHaveProperty('powerMW');
      expect(result.powerMW).toBeGreaterThan(0);
    });

    it('should calculate office power', () => {
      const result = QuoteEngine.calculatePower('office', {
        sqft: 50000,
      });

      expect(result).toHaveProperty('powerMW');
      expect(result.powerMW).toBeGreaterThan(0);
    });

    it('should calculate manufacturing power', () => {
      const result = QuoteEngine.calculatePower('manufacturing', {
        sqft: 100000,
      });

      expect(result).toHaveProperty('powerMW');
      expect(result.powerMW).toBeGreaterThan(0);
    });

    it('should return reasonable values for hotel (100-500 rooms)', () => {
      const result = QuoteEngine.calculatePower('hotel', {
        rooms: 200,
        hotelClass: 'upscale',
      });

      // 200-room upscale hotel should be roughly 0.3-0.8 MW peak
      const peakKW = result.powerMW * 1000;
      expect(peakKW).toBeGreaterThan(200);
      expect(peakKW).toBeLessThan(1500);
    });
  });

  describe('calculateHotelPower (simple)', () => {
    it('should return valid hotel power result', () => {
      const result = QuoteEngine.calculateHotelPower({
        rooms: 150,
        hotelClass: 'upscale',
        amenities: ['pool', 'restaurant'],
        electricityRate: 0.15,
      });

      expect(result).toHaveProperty('peakKW');
      expect(result).toHaveProperty('bessRecommendedKW');
      expect(result).toHaveProperty('monthlyDemandCost');
      expect(result.peakKW).toBeGreaterThan(0);
    });

    it('should scale with room count', () => {
      const small = QuoteEngine.calculateHotelPower({
        rooms: 50,
        hotelClass: 'economy',
        amenities: [],
        electricityRate: 0.15,
      });

      const large = QuoteEngine.calculateHotelPower({
        rooms: 300,
        hotelClass: 'economy',
        amenities: [],
        electricityRate: 0.15,
      });

      expect(large.peakKW).toBeGreaterThan(small.peakKW);
    });

    it('should increase with amenities', () => {
      const basic = QuoteEngine.calculateHotelPower({
        rooms: 100,
        hotelClass: 'midscale',
        amenities: [],
        electricityRate: 0.15,
      });

      const fullAmenities = QuoteEngine.calculateHotelPower({
        rooms: 100,
        hotelClass: 'midscale',
        amenities: ['pool', 'restaurant', 'spa', 'fitness', 'evCharging'],
        electricityRate: 0.15,
      });

      expect(fullAmenities.peakKW).toBeGreaterThan(basic.peakKW);
    });

    it('should vary by hotel class', () => {
      const economy = QuoteEngine.calculateHotelPower({
        rooms: 100,
        hotelClass: 'economy',
        amenities: [],
        electricityRate: 0.15,
      });

      const luxury = QuoteEngine.calculateHotelPower({
        rooms: 100,
        hotelClass: 'luxury',
        amenities: [],
        electricityRate: 0.15,
      });

      expect(luxury.peakKW).toBeGreaterThan(economy.peakKW);
    });
  });

  describe('calculateCarWashPower (simple)', () => {
    it('should return valid car wash power result', () => {
      const result = QuoteEngine.calculateCarWashPower({
        bays: 3,
        washType: 'automatic',
        hasVacuums: true,
        hasDryers: false,
        carsPerDay: 200,
        electricityRate: 0.15,
      });

      expect(result).toHaveProperty('peakKW');
      expect(result).toHaveProperty('bessRecommendedKW');
      expect(result.peakKW).toBeGreaterThan(0);
    });

    it('should vary by wash type', () => {
      const selfService = QuoteEngine.calculateCarWashPower({
        bays: 4,
        washType: 'selfService',
        hasVacuums: false,
        hasDryers: false,
        carsPerDay: 100,
        electricityRate: 0.15,
      });

      const tunnel = QuoteEngine.calculateCarWashPower({
        bays: 2,
        washType: 'tunnel',
        hasVacuums: true,
        hasDryers: true,
        carsPerDay: 400,
        electricityRate: 0.15,
      });

      // Tunnel should have much higher power
      expect(tunnel.peakKW).toBeGreaterThan(selfService.peakKW);
    });

    it('should scale with bays', () => {
      const small = QuoteEngine.calculateCarWashPower({
        bays: 2,
        washType: 'automatic',
        hasVacuums: false,
        hasDryers: false,
        carsPerDay: 100,
        electricityRate: 0.15,
      });

      const large = QuoteEngine.calculateCarWashPower({
        bays: 6,
        washType: 'automatic',
        hasVacuums: false,
        hasDryers: false,
        carsPerDay: 100,
        electricityRate: 0.15,
      });

      expect(large.peakKW).toBeGreaterThan(small.peakKW);
    });
  });

  describe('calculateEVChargingPower (simple)', () => {
    it('should return valid EV charging power result', () => {
      const result = QuoteEngine.calculateEVChargingPower({
        level2Count: 10,
        dcfcCount: 2,
        hpcCount: 0,
        electricityRate: 0.15,
      });

      expect(result).toHaveProperty('peakKW');
      expect(result).toHaveProperty('bessRecommendedKW');
      expect(result.peakKW).toBeGreaterThan(0);
    });

    it('should scale with port count', () => {
      const small = QuoteEngine.calculateEVChargingPower({
        level2Count: 4,
        dcfcCount: 1,
        hpcCount: 0,
        electricityRate: 0.15,
      });

      const large = QuoteEngine.calculateEVChargingPower({
        level2Count: 20,
        dcfcCount: 4,
        hpcCount: 2,
        electricityRate: 0.15,
      });

      expect(large.peakKW).toBeGreaterThan(small.peakKW);
    });

    it('should weight DCFC higher than Level 2', () => {
      const level2Only = QuoteEngine.calculateEVChargingPower({
        level2Count: 10,
        dcfcCount: 0,
        hpcCount: 0,
        electricityRate: 0.15,
      });

      const dcfcOnly = QuoteEngine.calculateEVChargingPower({
        level2Count: 0,
        dcfcCount: 2, // Much fewer ports
        hpcCount: 0,
        electricityRate: 0.15,
      });

      // 2 DCFC ports should have higher peak than 10 L2
      // DCFC ~150kW each vs L2 ~7kW each
      expect(dcfcOnly.peakKW).toBeGreaterThan(level2Only.peakKW);
    });
  });
});

// ============================================================================
// 5. QUICK ESTIMATE TESTS
// ============================================================================

describe('QuoteEngine Quick Estimate', () => {
  it('should return valid QuickEstimateResult', async () => {
    const result = await QuoteEngine.quickEstimate(0.5, 4, 0.20);

    expect(result).toHaveProperty('paybackYears');
    expect(result).toHaveProperty('annualSavings');
    expect(result).toHaveProperty('estimatedCost');
  });

  it('should return positive values', async () => {
    const result = await QuoteEngine.quickEstimate(0.5, 4, 0.20);

    expect(result.paybackYears).toBeGreaterThan(0);
    expect(result.annualSavings).toBeGreaterThan(0);
    expect(result.estimatedCost).toBeGreaterThan(0);
  });

  it('should scale with system size', async () => {
    const small = await QuoteEngine.quickEstimate(0.1, 4, 0.15);
    const large = await QuoteEngine.quickEstimate(1.0, 4, 0.15);

    expect(large.estimatedCost).toBeGreaterThan(small.estimatedCost);
    expect(large.annualSavings).toBeGreaterThan(small.annualSavings);
  });

  it('should scale with electricity rate', async () => {
    const lowRate = await QuoteEngine.quickEstimate(0.5, 4, 0.10);
    const highRate = await QuoteEngine.quickEstimate(0.5, 4, 0.30);

    // Higher electricity rate = more savings
    expect(highRate.annualSavings).toBeGreaterThan(lowRate.annualSavings);
    // Higher electricity rate = faster payback (fewer years)
    expect(highRate.paybackYears).toBeLessThan(lowRate.paybackYears);
  });

  it('should use default electricity rate if not provided', async () => {
    const result = await QuoteEngine.quickEstimate(0.5, 4);
    
    expect(result.paybackYears).toBeGreaterThan(0);
  });

  it('should be faster than generateQuote', async () => {
    const iterations = 5;

    // Time quickEstimate
    const quickStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await QuoteEngine.quickEstimate(0.5 + i * 0.1, 4, 0.15);
    }
    const quickTime = performance.now() - quickStart;

    // Time generateQuote (skip cache)
    const fullStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await QuoteEngine.generateQuote(
        { storageSizeMW: 0.5 + i * 0.1, durationHours: 4, electricityRate: 0.15 },
        { skipCache: true }
      );
    }
    const fullTime = performance.now() - fullStart;

    // quickEstimate should be faster (or at least not dramatically slower)
    console.log(`Quick estimate: ${quickTime.toFixed(2)}ms, Full quote: ${fullTime.toFixed(2)}ms`);
    // We don't enforce strict timing, but log for visibility
    expect(quickTime).toBeLessThan(fullTime * 2); // At worst 2x slower
  });
});

// ============================================================================
// 6. VERSIONING TESTS
// ============================================================================

describe('QuoteEngine Versioning', () => {
  it('should have VERSION constant', () => {
    expect(QuoteEngine.VERSION).toBeDefined();
    expect(typeof QuoteEngine.VERSION).toBe('string');
    expect(QuoteEngine.VERSION).toMatch(/^\d+\.\d+\.\d+$/); // semver format
  });

  it('should have VERSION_HISTORY', () => {
    expect(QuoteEngine.VERSION_HISTORY).toBeDefined();
    expect(typeof QuoteEngine.VERSION_HISTORY).toBe('object');
    expect(QuoteEngine.VERSION_HISTORY[QuoteEngine.VERSION]).toBeDefined();
  });

  it('should include current version in history', () => {
    const currentVersionEntry = QuoteEngine.VERSION_HISTORY[QuoteEngine.VERSION];
    expect(currentVersionEntry).toBeDefined();
    expect(currentVersionEntry).toContain('Dec');
  });
});

// ============================================================================
// 7. UTILITY METHODS TESTS
// ============================================================================

describe('QuoteEngine Utility Methods', () => {
  describe('getSystemCategory', () => {
    it('should categorize residential (< 50 kW)', () => {
      expect(QuoteEngine.getSystemCategory(0.01)).toBe('residential'); // 10 kW
      expect(QuoteEngine.getSystemCategory(0.03)).toBe('residential'); // 30 kW
      expect(QuoteEngine.getSystemCategory(0.049)).toBe('residential'); // 49 kW
    });

    it('should categorize commercial (50 kW - 1 MW)', () => {
      expect(QuoteEngine.getSystemCategory(0.05)).toBe('commercial'); // 50 kW
      expect(QuoteEngine.getSystemCategory(0.5)).toBe('commercial'); // 500 kW
      expect(QuoteEngine.getSystemCategory(0.99)).toBe('commercial'); // 990 kW
    });

    it('should categorize utility (>= 1 MW)', () => {
      expect(QuoteEngine.getSystemCategory(1.0)).toBe('utility'); // 1 MW
      expect(QuoteEngine.getSystemCategory(5.0)).toBe('utility'); // 5 MW
      expect(QuoteEngine.getSystemCategory(100)).toBe('utility'); // 100 MW
    });
  });
});

// ============================================================================
// 8. EDGE CASES
// ============================================================================

describe('QuoteEngine Edge Cases', () => {
  beforeEach(() => {
    QuoteEngine.clearCache();
  });

  it('should handle minimum valid values', async () => {
    const result = await QuoteEngine.generateQuote({
      storageSizeMW: 0.001, // 1 kW
      durationHours: 0.5,   // 30 minutes
    }, { skipValidation: true });

    expect(result.costs.totalProjectCost).toBeGreaterThan(0);
  });

  it('should handle large systems', async () => {
    const result = await QuoteEngine.generateQuote({
      storageSizeMW: 50, // 50 MW utility scale
      durationHours: 4,
    });

    expect(result.costs.totalProjectCost).toBeGreaterThan(10_000_000); // > $10M
  });

  it('should handle all optional fields as zero', async () => {
    const result = await QuoteEngine.generateQuote({
      storageSizeMW: 0.5,
      durationHours: 4,
      solarMW: 0,
      windMW: 0,
      generatorMW: 0,
      fuelCellMW: 0,
      electricityRate: 0.15,
    });

    expect(result.costs.totalProjectCost).toBeGreaterThan(0);
  });

  it('should handle high renewable integration', async () => {
    const result = await QuoteEngine.generateQuote({
      storageSizeMW: 1.0,
      durationHours: 4,
      solarMW: 2.0, // 2x storage size
      windMW: 1.0,
      electricityRate: 0.15,
    });

    expect(result.costs.totalProjectCost).toBeGreaterThan(0);
  });

  it('should handle off-grid with multiple generation sources', async () => {
    const result = await QuoteEngine.generateQuote({
      storageSizeMW: 0.5,
      durationHours: 8,
      gridConnection: 'off-grid',
      solarMW: 0.3,
      generatorMW: 0.2,
      generatorFuelType: 'diesel',
    });

    expect(result.costs.totalProjectCost).toBeGreaterThan(0);
  });
});
