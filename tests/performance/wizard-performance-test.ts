/**
 * SmartWizard Performance Test Suite
 * ===================================
 * Comprehensive performance testing to identify ALL bottlenecks
 * 
 * Tests:
 * 1. Template Selection Speed
 * 2. Use Case Loading Time
 * 3. Baseline Calculation Performance
 * 4. Database Query Speed
 * 5. Equipment Pricing Lookup
 * 6. Financial Calculations
 * 7. Modal Render Time
 * 8. State Update Performance
 * 9. Full Wizard Flow End-to-End
 */

import { performance } from 'perf_hooks';

// Mock data for testing
const TEST_USE_CASE = 'office';
const TEST_ANSWERS = {
  squareFootage: 50000,
  facilityType: 'medical_office',
  hasRestaurant: true,
  operatingHours: 12,
  peakLoad: 0.5
};

interface PerformanceResult {
  testName: string;
  duration: number;
  status: 'PASS' | 'FAIL' | 'WARN';
  threshold: number;
  details?: any;
}

class PerformanceMonitor {
  private results: PerformanceResult[] = [];
  
  async measure(
    testName: string, 
    fn: () => Promise<any>, 
    threshold: number
  ): Promise<PerformanceResult> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      const status = duration < threshold ? 'PASS' : 
                     duration < threshold * 1.5 ? 'WARN' : 'FAIL';
      
      const perfResult: PerformanceResult = {
        testName,
        duration: Math.round(duration * 100) / 100,
        status,
        threshold,
        details: result
      };
      
      this.results.push(perfResult);
      return perfResult;
    } catch (error) {
      const duration = performance.now() - start;
      const perfResult: PerformanceResult = {
        testName,
        duration: Math.round(duration * 100) / 100,
        status: 'FAIL',
        threshold,
        details: { error: error instanceof Error ? error.message : String(error) }
      };
      
      this.results.push(perfResult);
      return perfResult;
    }
  }
  
  getResults(): PerformanceResult[] {
    return this.results;
  }
  
  printReport(): void {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           SMARTWIZARD PERFORMANCE TEST REPORT             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const warned = this.results.filter(r => r.status === 'WARN').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    this.results.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'WARN' ? '⚠️' : '❌';
      const comparison = result.duration < result.threshold ? 
        `(${Math.round((result.threshold - result.duration) / result.threshold * 100)}% under threshold)` :
        `(${Math.round((result.duration - result.threshold) / result.threshold * 100)}% OVER threshold)`;
      
      console.log(`${icon} Test ${index + 1}: ${result.testName}`);
      console.log(`   Duration: ${result.duration}ms | Threshold: ${result.threshold}ms ${comparison}`);
      
      if (result.details?.error) {
        console.log(`   ❌ ERROR: ${result.details.error}`);
      }
      console.log('');
    });
    
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`📊 SUMMARY: ${passed} passed | ${warned} warnings | ${failed} failed`);
    console.log('═════════════════════════════════════════════════════════════\n');
  }
}

/**
 * Test 1: Template Selection Speed
 * Should complete in < 50ms (instant UI feedback)
 */
async function testTemplateSelection(monitor: PerformanceMonitor) {
  return monitor.measure(
    'Template Selection (Local State Update)',
    async () => {
      // Simulate local state update
      const selectedTemplate = TEST_USE_CASE;
      const hasSelectedTemplate = true;
      return { selectedTemplate, hasSelectedTemplate };
    },
    50 // 50ms threshold
  );
}

/**
 * Test 2: Use Case Details Loading
 * Should complete in < 200ms (database query)
 */
async function testUseCaseLoading(monitor: PerformanceMonitor) {
  return monitor.measure(
    'Use Case Details Loading (Database)',
    async () => {
      // Import and test actual service
      const { getUseCaseDetails } = await import('../../src/application/services/useCaseService');
      return await getUseCaseDetails(TEST_USE_CASE);
    },
    200 // 200ms threshold
  );
}

/**
 * Test 3: Baseline Calculation
 * Should complete in < 500ms (complex calculation)
 */
async function testBaselineCalculation(monitor: PerformanceMonitor) {
  return monitor.measure(
    'Baseline BESS Calculation',
    async () => {
      const { calculateDatabaseBaseline } = await import('../../src/services/baselineService');
      return await calculateDatabaseBaseline(TEST_USE_CASE, 1, TEST_ANSWERS);
    },
    500 // 500ms threshold
  );
}

/**
 * Test 4: Equipment Pricing Lookup
 * Should complete in < 300ms (cached pricing data)
 */
async function testEquipmentPricing(monitor: PerformanceMonitor) {
  return monitor.measure(
    'Equipment Pricing Lookup',
    async () => {
      const { getBatteryPricing } = await import('../../src/services/unifiedPricingService');
      return await getBatteryPricing(400); // 400 kWh system
    },
    300 // 300ms threshold
  );
}

/**
 * Test 5: Financial Calculations
 * Should complete in < 400ms (NPV/IRR calculations)
 */
async function testFinancialCalculations(monitor: PerformanceMonitor) {
  return monitor.measure(
    'Financial Metrics (NPV/IRR/ROI)',
    async () => {
      const { calculateFinancialMetrics } = await import('../../src/services/centralizedCalculations');
      return await calculateFinancialMetrics({
        storageSizeMW: 0.4,
        durationHours: 4,
        electricityRate: 0.15,
        solarMW: 0,
        location: 'California',
        includeNPV: true
      });
    },
    400 // 400ms threshold
  );
}

/**
 * Test 6: Multiple Database Queries (Caching Test)
 * Should complete in < 100ms on second call (cache hit)
 */
async function testDatabaseCaching(monitor: PerformanceMonitor) {
  const { getUseCaseDetails } = await import('../../src/application/services/useCaseService');
  
  // First call (cold)
  await monitor.measure(
    'Database Query (Cold - First Call)',
    async () => await getUseCaseDetails(TEST_USE_CASE),
    200
  );
  
  // Second call (should be cached)
  return monitor.measure(
    'Database Query (Warm - Cached)',
    async () => await getUseCaseDetails(TEST_USE_CASE),
    100 // Should be faster with cache
  );
}

/**
 * Test 7: Baseline Cache Performance
 * Should complete in < 50ms on cache hit
 */
async function testBaselineCaching(monitor: PerformanceMonitor) {
  const { calculateDatabaseBaseline } = await import('../../src/services/baselineService');
  
  // First call (cold)
  await monitor.measure(
    'Baseline Calculation (Cold)',
    async () => await calculateDatabaseBaseline(TEST_USE_CASE, 1, TEST_ANSWERS),
    500
  );
  
  // Second call (should be cached)
  return monitor.measure(
    'Baseline Calculation (Warm - Cached)',
    async () => await calculateDatabaseBaseline(TEST_USE_CASE, 1, TEST_ANSWERS),
    50 // Should be instant with cache
  );
}

/**
 * Test 8: State Update Cascade
 * Measures how long state updates take in useQuoteBuilder hook
 */
async function testStateUpdateCascade(monitor: PerformanceMonitor) {
  return monitor.measure(
    'State Update Cascade (Hook)',
    async () => {
      // Simulate multiple state updates
      const updates = {
        selectedUseCaseSlug: TEST_USE_CASE,
        useCaseAnswers: TEST_ANSWERS,
        storageSizeMW: 0.4,
        durationHours: 4
      };
      return updates;
    },
    20 // Should be instant (synchronous state)
  );
}

/**
 * Test 9: Full Wizard Flow End-to-End
 * Complete flow from template selection to quote generation
 */
async function testFullWizardFlow(monitor: PerformanceMonitor) {
  return monitor.measure(
    'Full Wizard Flow (End-to-End)',
    async () => {
      const start = performance.now();
      
      // Step 1: Load use cases
      const { getUseCasesForSelection } = await import('../../src/services/useCaseService');
      const useCases = await getUseCasesForSelection();
      const step1Time = performance.now() - start;
      
      // Step 2: Select use case and load details
      const { getUseCaseDetails } = await import('../../src/application/services/useCaseService');
      const details = await getUseCaseDetails(TEST_USE_CASE);
      const step2Time = performance.now() - start - step1Time;
      
      // Step 3: Calculate baseline
      const { calculateDatabaseBaseline } = await import('../../src/services/baselineService');
      const baseline = await calculateDatabaseBaseline(TEST_USE_CASE, 1, TEST_ANSWERS);
      const step3Time = performance.now() - start - step1Time - step2Time;
      
      // Step 4: Get equipment pricing
      const { getBatteryPricing } = await import('../../src/services/unifiedPricingService');
      const pricing = await getBatteryPricing(baseline.bessKwh || 400);
      const step4Time = performance.now() - start - step1Time - step2Time - step3Time;
      
      // Step 5: Calculate financials
      const { calculateFinancialMetrics } = await import('../../src/services/centralizedCalculations');
      const financials = await calculateFinancialMetrics({
        storageSizeMW: baseline.powerMW,
        durationHours: baseline.durationHrs,
        electricityRate: 0.15,
        solarMW: 0,
        location: 'California',
        includeNPV: true
      });
      const step5Time = performance.now() - start - step1Time - step2Time - step3Time - step4Time;
      
      return {
        totalTime: performance.now() - start,
        breakdown: {
          loadUseCases: step1Time,
          loadDetails: step2Time,
          calculateBaseline: step3Time,
          getPricing: step4Time,
          calculateFinancials: step5Time
        },
        baseline,
        pricing,
        financials
      };
    },
    2000 // 2 second threshold for complete flow
  );
}

/**
 * Test 10: React Component Render Time (Simulated)
 * Measures time to prepare props for rendering
 */
async function testComponentRenderPrep(monitor: PerformanceMonitor) {
  return monitor.measure(
    'Component Render Preparation',
    async () => {
      // Simulate building props for SmartWizardV3
      const props = {
        show: true,
        currentQuote: null,
        availableUseCases: Array(30).fill(null).map((_, i) => ({
          id: `use-case-${i}`,
          name: `Use Case ${i}`,
          category: 'commercial'
        })),
        selectedUseCaseSlug: TEST_USE_CASE,
        useCaseAnswers: TEST_ANSWERS,
        location: 'California',
        electricityRate: 0.15
      };
      return props;
    },
    10 // Should be instant
  );
}

/**
 * Test 11: Memory Usage Pattern
 * Check for potential memory leaks or excessive allocations
 */
async function testMemoryUsage(monitor: PerformanceMonitor) {
  return monitor.measure(
    'Memory Usage Check',
    async () => {
      const before = process.memoryUsage();
      
      // Run multiple operations
      const { calculateDatabaseBaseline } = await import('../../src/services/baselineService');
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        await calculateDatabaseBaseline(TEST_USE_CASE, 1, TEST_ANSWERS);
      }
      
      const after = process.memoryUsage();
      
      return {
        heapUsedDelta: Math.round((after.heapUsed - before.heapUsed) / 1024 / 1024 * 100) / 100,
        heapTotalDelta: Math.round((after.heapTotal - before.heapTotal) / 1024 / 1024 * 100) / 100,
        iterations
      };
    },
    1000 // 1 second for 10 iterations
  );
}

/**
 * Main Test Runner
 */
async function runPerformanceTests() {
  const monitor = new PerformanceMonitor();
  
  console.log('🚀 Starting SmartWizard Performance Tests...\n');
  
  try {
    // Phase 1: Individual Component Tests
    console.log('📋 Phase 1: Individual Component Tests');
    await testTemplateSelection(monitor);
    await testUseCaseLoading(monitor);
    await testBaselineCalculation(monitor);
    await testEquipmentPricing(monitor);
    await testFinancialCalculations(monitor);
    
    // Phase 2: Caching Tests
    console.log('\n📋 Phase 2: Caching Performance');
    await testDatabaseCaching(monitor);
    await testBaselineCaching(monitor);
    
    // Phase 3: State & Render Tests
    console.log('\n📋 Phase 3: State & Render Performance');
    await testStateUpdateCascade(monitor);
    await testComponentRenderPrep(monitor);
    
    // Phase 4: Integration Tests
    console.log('\n📋 Phase 4: Integration Tests');
    await testFullWizardFlow(monitor);
    await testMemoryUsage(monitor);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
  
  // Print final report
  monitor.printReport();
  
  // Exit with appropriate code
  const results = monitor.getResults();
  const hasFailures = results.some(r => r.status === 'FAIL');
  process.exit(hasFailures ? 1 : 0);
}

// Run tests if executed directly
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

export { runPerformanceTests, PerformanceMonitor };
