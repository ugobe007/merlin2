/**
 * Browser-Based Performance Test
 * ================================
 * Paste this into browser console while app is running
 * Measures REAL performance of actual functions
 */

(async function testPerformance() {
  console.log('🚀 SmartWizard Performance Test\n');
  console.log('═══════════════════════════════════════\n');
  
  const results = [];
  
  const measure = async (name, fn) => {
    console.time(name);
    const start = performance.now();
    try {
      await fn();
      const duration = Math.round(performance.now() - start);
      console.timeEnd(name);
      const status = duration < 200 ? '✅' : duration < 500 ? '⚠️' : '❌';
      results.push({ name, duration, status });
      console.log(`${status} ${duration}ms\n`);
    } catch (error) {
      console.timeEnd(name);
      console.error(`❌ ERROR: ${error.message}\n`);
      results.push({ name, duration: 0, status: '❌ ERROR' });
    }
  };
  
  // Import services from the running application
  // NOTE: These paths work when pasted in browser console on localhost:5178
  const { calculateDatabaseBaseline } = await import('/src/services/baselineService.ts');
  const { getBatteryPricing } = await import('/src/services/unifiedPricingService.ts');
  const { calculateFinancialMetrics } = await import('/src/services/centralizedCalculations.ts');
  
  // Test 1: Baseline Calculation
  await measure('Baseline Calculation', async () => {
    await calculateDatabaseBaseline('office', 1, {
      squareFootage: 50000,
      facilityType: 'medical_office',
      hasRestaurant: true
    });
  });
  
  // Test 2: Equipment Pricing
  await measure('Equipment Pricing', async () => {
    await getBatteryPricing(400, 1, 0);
  });
  
  // Test 3: Financial Calculations (Simple)
  await measure('Financial Calc (Simple)', async () => {
    await calculateFinancialMetrics({
      storageSizeMW: 0.4,
      durationHours: 4,
      electricityRate: 0.15,
      solarMW: 0,
      location: 'California',
      includeNPV: false
    });
  });
  
  // Test 4: Financial Calculations (Full NPV)
  await measure('Financial Calc (NPV/IRR)', async () => {
    await calculateFinancialMetrics({
      storageSizeMW: 0.4,
      durationHours: 4,
      electricityRate: 0.15,
      solarMW: 0,
      location: 'California',
      includeNPV: true
    });
  });
  
  // Summary
  console.log('═══════════════════════════════════════');
  console.log('📊 RESULTS:\n');
  console.table(results);
  
  const total = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`\n⏱️  Total: ${total}ms`);
  
  const bottlenecks = results.filter(r => r.duration > 500);
  if (bottlenecks.length > 0) {
    console.log('\n🔴 BOTTLENECKS (>500ms):');
    bottlenecks.forEach(b => console.log(`   ${b.name}: ${b.duration}ms`));
  }
  
  console.log('\n═══════════════════════════════════════');
})();
