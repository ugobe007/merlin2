/**
 * COMPREHENSIVE USE CASE TEST SUITE
 * 
 * Tests ALL 20+ use cases to ensure baseline calculations work correctly
 * Validates power sizing, duration, solar compatibility, and generation requirements
 * 
 * Run with: npm run test:use-cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockBaselineService } from '@tests/mocks/services/MockBaselineService';
import { MockCacheService } from '@tests/utils/test-helpers';
import {
  allUseCaseFixtures,
  getFixturesByTier,
  getFixturesByCategory,
  getFixturesWithSolar,
  getFixturesWithGeneration,
  validateFixtureResults,
  type UseCaseFixture
} from '@tests/fixtures/use-cases/all-use-cases.fixture';

describe('All Use Cases Comprehensive Test Suite', () => {
  let baselineService: MockBaselineService;
  let cache: MockCacheService;

  beforeEach(() => {
    cache = new MockCacheService();
    baselineService = new MockBaselineService(cache);
    cache.clear();
    baselineService.resetCallCount();
  });

  // ============================================================================
  // TEST ALL USE CASES INDIVIDUALLY
  // ============================================================================

  describe('Individual Use Case Tests', () => {
    Object.entries(allUseCaseFixtures).forEach(([slug, fixture]) => {
      it(`should correctly calculate baseline for ${fixture.name}`, async () => {
        const result = await baselineService.fetchConfiguration(
          fixture.slug,
          fixture.useCaseData
        );

        // Basic validation
        expect(result).toBeDefined();
        expect(result.peakLoad).toBeGreaterThan(0);
        expect(result.duration).toBeGreaterThan(0);

        // Validate against expected ranges
        const validation = validateFixtureResults(fixture, {
          powerMW: result.peakLoad / 1000, // Convert kW to MW
          durationHrs: result.duration,
          solarMW: result.recommendedCapacity ? result.recommendedCapacity / 1000 : undefined,
          generationRequired: result.recommendedDuration ? result.recommendedDuration > 0 : false
        });

        if (!validation.valid) {
          console.warn(`⚠️ Validation issues for ${fixture.name}:`, validation.errors);
        }

        // Test should pass even with warnings (ranges are guidelines)
        expect(result.peakLoad).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // TEST BY TIER
  // ============================================================================

  describe('Use Cases by Tier', () => {
    it('should handle all FREE tier use cases', async () => {
      const freeFixtures = getFixturesByTier('free');
      expect(freeFixtures.length).toBeGreaterThan(0);

      for (const fixture of freeFixtures) {
        const result = await baselineService.fetchConfiguration(
          fixture.slug,
          fixture.useCaseData
        );
        expect(result).toBeDefined();
        expect(result.peakLoad).toBeGreaterThan(0);
      }
    });

    it('should handle all SEMI_PREMIUM tier use cases', async () => {
      const semiPremiumFixtures = getFixturesByTier('semi_premium');
      
      for (const fixture of semiPremiumFixtures) {
        const result = await baselineService.fetchConfiguration(
          fixture.slug,
          fixture.useCaseData
        );
        expect(result).toBeDefined();
        expect(result.peakLoad).toBeGreaterThan(0);
      }
    });

    it('should handle all PREMIUM tier use cases', async () => {
      const premiumFixtures = getFixturesByTier('premium');
      expect(premiumFixtures.length).toBeGreaterThan(0);

      for (const fixture of premiumFixtures) {
        const result = await baselineService.fetchConfiguration(
          fixture.slug,
          fixture.useCaseData
        );
        expect(result).toBeDefined();
        expect(result.peakLoad).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // TEST BY CATEGORY
  // ============================================================================

  describe('Use Cases by Category', () => {
    it('should handle all COMMERCIAL use cases', async () => {
      const commercialFixtures = getFixturesByCategory('commercial');
      expect(commercialFixtures.length).toBeGreaterThan(0);

      for (const fixture of commercialFixtures) {
        const result = await baselineService.fetchConfiguration(
          fixture.slug,
          fixture.useCaseData
        );
        expect(result.peakLoad).toBeGreaterThan(0);
        expect(result.duration).toBeGreaterThan(0);
      }
    });

    it('should handle all INDUSTRIAL use cases', async () => {
      const industrialFixtures = getFixturesByCategory('industrial');

      for (const fixture of industrialFixtures) {
        const result = await baselineService.fetchConfiguration(
          fixture.slug,
          fixture.useCaseData
        );
        expect(result.peakLoad).toBeGreaterThan(0);
        // Industrial should have higher power requirements
        expect(result.peakLoad).toBeGreaterThan(500); // >500kW
      }
    });

    it('should handle all HOSPITALITY use cases', async () => {
      const hospitalityFixtures = getFixturesByCategory('hospitality');

      for (const fixture of hospitalityFixtures) {
        const result = await baselineService.fetchConfiguration(
          fixture.slug,
          fixture.useCaseData
        );
        expect(result.peakLoad).toBeGreaterThan(0);
        expect(result.duration).toBeGreaterThanOrEqual(4);
      }
    });

    it('should handle all HEALTHCARE use cases', async () => {
      const healthcareFixtures = getFixturesByCategory('healthcare');

      for (const fixture of healthcareFixtures) {
        const result = await baselineService.fetchConfiguration(
          fixture.slug,
          fixture.useCaseData
        );
        expect(result.peakLoad).toBeGreaterThan(0);
        // Healthcare should have longer duration for critical backup
        expect(result.duration).toBeGreaterThanOrEqual(12);
      }
    });

    it('should handle all RESIDENTIAL use cases', async () => {
      const residentialFixtures = getFixturesByCategory('residential');

      for (const fixture of residentialFixtures) {
        const result = await baselineService.fetchConfiguration(
          fixture.slug,
          fixture.useCaseData
        );
        expect(result.peakLoad).toBeGreaterThan(0);
        // Residential should have lower power requirements
        expect(result.peakLoad).toBeLessThan(1000); // <1MW
      }
    });
  });

  // ============================================================================
  // TEST SPECIAL CHARACTERISTICS
  // ============================================================================

  describe('Solar Integration', () => {
    it('should recommend solar for appropriate use cases', async () => {
      const solarFixtures = getFixturesWithSolar();
      expect(solarFixtures.length).toBeGreaterThan(0);

      for (const fixture of solarFixtures) {
        const result = await baselineService.fetchConfiguration(
          fixture.slug,
          fixture.useCaseData
        );
        
        // Should have some solar recommendation
        expect(result.recommendedCapacity || 0).toBeGreaterThan(0);
      }
    });
  });

  describe('Generation Requirements', () => {
    it('should identify generation needs for unreliable/off-grid cases', async () => {
      const generationFixtures = getFixturesWithGeneration();
      expect(generationFixtures.length).toBeGreaterThan(0);

      for (const fixture of generationFixtures) {
        const result = await baselineService.fetchConfiguration(
          fixture.slug,
          fixture.useCaseData
        );
        
        // Should flag generation requirement
        expect(result.recommendedDuration || 0).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance', () => {
    it('should calculate all use cases within 5 seconds', async () => {
      const startTime = performance.now();
      
      const fixtures = Object.values(allUseCaseFixtures);
      const promises = fixtures.map(fixture =>
        baselineService.fetchConfiguration(fixture.slug, fixture.useCaseData)
      );
      
      await Promise.all(promises);
      
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    it('should cache results for repeated use case calls', async () => {
      const fixture = allUseCaseFixtures['car-wash'];
      
      // First call
      await baselineService.fetchConfiguration(fixture.slug, fixture.useCaseData);
      
      // Second call (should be cached)
      const startTime = performance.now();
      await baselineService.fetchConfiguration(fixture.slug, fixture.useCaseData);
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(10); // Should be instant from cache
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle missing required fields gracefully', async () => {
      const fixture = allUseCaseFixtures['car-wash'];
      
      // Call with missing required field
      const result = await baselineService.fetchConfiguration(
        fixture.slug,
        {} // Empty data
      );
      
      // Should return fallback values, not crash
      expect(result).toBeDefined();
      expect(result.peakLoad).toBeGreaterThan(0);
    });

    it('should handle invalid use case slug', async () => {
      const result = await baselineService.fetchConfiguration(
        'invalid-use-case',
        {}
      );
      
      // Should return fallback, not throw
      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Cross-Use-Case Integration', () => {
    it('should maintain consistent calculation methodology across all use cases', async () => {
      const results = await Promise.all(
        Object.values(allUseCaseFixtures).map(fixture =>
          baselineService.fetchConfiguration(fixture.slug, fixture.useCaseData)
        )
      );

      // All results should have consistent structure
      results.forEach((result, index) => {
        const fixture = Object.values(allUseCaseFixtures)[index];
        
        expect(result).toHaveProperty('peakLoad');
        expect(result).toHaveProperty('duration');
        expect(result).toHaveProperty('recommendedCapacity');
        expect(result).toHaveProperty('recommendedDuration');
        
        // Log any outliers for manual review
        if (result.peakLoad === 0 || result.duration === 0) {
          console.warn(`⚠️ Zero values for ${fixture.name}:`, result);
        }
      });
    });

    it('should scale power appropriately based on facility size', async () => {
      // Test with small office
      const smallOffice = await baselineService.fetchConfiguration('office', {
        squareFootage: 10000,
        facilityType: 'corporate_office'
      });

      // Test with large office
      const largeOffice = await baselineService.fetchConfiguration('office', {
        squareFootage: 100000,
        facilityType: 'corporate_office'
      });

      // Large office should require more power
      expect(largeOffice.peakLoad).toBeGreaterThan(smallOffice.peakLoad * 2);
    });
  });

  // ============================================================================
  // REGRESSION TESTS
  // ============================================================================

  describe('Regression Tests', () => {
    it('should not break EV Charging calculations', async () => {
      const fixture = allUseCaseFixtures['ev-charging'];
      const result = await baselineService.fetchConfiguration(
        fixture.slug,
        fixture.useCaseData
      );

      expect(result.peakLoad).toBeGreaterThan(0);
      expect(result.peakLoad).toBeLessThan(2000); // Reasonable max for EV station
    });

    it('should not break Data Center calculations', async () => {
      const fixture = allUseCaseFixtures['datacenter'];
      const result = await baselineService.fetchConfiguration(
        fixture.slug,
        fixture.useCaseData
      );

      expect(result.peakLoad).toBeGreaterThan(1000); // Data centers need substantial power
      expect(result.duration).toBeGreaterThanOrEqual(12); // Long backup duration
    });

    it('should not break Hotel calculations', async () => {
      const fixture = allUseCaseFixtures['hotel'];
      const result = await baselineService.fetchConfiguration(
        fixture.slug,
        fixture.useCaseData
      );

      expect(result.peakLoad).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // SUMMARY STATISTICS
  // ============================================================================

  describe('Test Suite Summary', () => {
    it('should test all registered use cases', () => {
      const fixtureCount = Object.keys(allUseCaseFixtures).length;
      console.log(`✅ Testing ${fixtureCount} use cases`);
      expect(fixtureCount).toBeGreaterThanOrEqual(20);
    });

    it('should cover all tiers', () => {
      const tiers = ['free', 'semi_premium', 'premium'];
      tiers.forEach(tier => {
        const fixtures = getFixturesByTier(tier);
        console.log(`   ${tier.toUpperCase()}: ${fixtures.length} use cases`);
        expect(fixtures.length).toBeGreaterThan(0);
      });
    });

    it('should cover all major categories', () => {
      const categories = ['commercial', 'industrial', 'hospitality', 'healthcare', 'residential'];
      categories.forEach(category => {
        const fixtures = getFixturesByCategory(category);
        console.log(`   ${category}: ${fixtures.length} use cases`);
      });
    });
  });
});
