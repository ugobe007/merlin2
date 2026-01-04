/**
 * TIER III DATA CENTER VALIDATION
 * ================================
 * Quick test to validate calculation results against known benchmark
 * 
 * BENCHMARK: 400-rack Tier III Data Center
 * Expected values based on industry standards:
 * - Peak Demand: ~3,200 kW (400 racks × 8 kW/rack)
 * - BESS Power: ~1,600 kW (50% of peak for demand management)
 * - BESS Energy: ~6,400 kWh (4-hour duration)
 * - Generator: REQUIRED (Tier III = 99.982% uptime)
 */

function validateDataCenterQuote() {
  console.log('\n' + '='.repeat(60));
  console.log('🏢 TIER III DATA CENTER VALIDATION');
  console.log('='.repeat(60));
  
  // Expected values for 400-rack Tier III
  const BENCHMARK = {
    rackCount: 400,
    tier: 'tier_3',
    kWPerRack: 8,  // Typical Tier III
    pue: 1.4,      // Power Usage Effectiveness
    
    // Calculated expectations
    get itLoad() { return this.rackCount * this.kWPerRack },           // 3,200 kW
    get totalLoad() { return this.itLoad * this.pue },                  // 4,480 kW
    get bessMultiplier() { return 0.5 },                                // 50% of peak
    get bessDuration() { return 4 },                                    // 4 hours
    get expectedBessKW() { return Math.round(this.itLoad * this.bessMultiplier) },  // 1,600 kW
    get expectedBessKWh() { return this.expectedBessKW * this.bessDuration },       // 6,400 kWh
    get generatorRequired() { return true },                            // Always for Tier III
    get expectedGeneratorKW() { return Math.round(this.itLoad * 1.25) } // 4,000 kW (125% of IT load)
  };
  
  console.log('\n📐 BENCHMARK VALUES (400-rack Tier III):');
  console.log(`   IT Load: ${BENCHMARK.itLoad.toLocaleString()} kW`);
  console.log(`   Total Load (PUE ${BENCHMARK.pue}): ${BENCHMARK.totalLoad.toLocaleString()} kW`);
  console.log(`   Expected BESS Power: ${BENCHMARK.expectedBessKW.toLocaleString()} kW`);
  console.log(`   Expected BESS Energy: ${BENCHMARK.expectedBessKWh.toLocaleString()} kWh`);
  console.log(`   Expected Generator: ${BENCHMARK.expectedGeneratorKW.toLocaleString()} kW (REQUIRED)`);
  
  // Try to get actual values from wizard
  const state = window.getMerlinState ? window.getMerlinState() : null;
  
  if (!state) {
    console.log('\n❌ Could not find wizard state.');
    console.log('   Run testMerlinDataFlow() first or check you are on Step 5/6.');
    return;
  }
  
  console.log('\n📊 ACTUAL VALUES FROM WIZARD:');
  
  const actual = {
    bessKW: state.calculations?.bessKW || 0,
    bessKWh: state.calculations?.bessKWh || 0,
    generatorKW: state.calculations?.generatorKW || 0,
    solarKW: state.calculations?.solarKW || 0,
  };
  
  console.log(`   BESS Power: ${actual.bessKW.toLocaleString()} kW`);
  console.log(`   BESS Energy: ${actual.bessKWh.toLocaleString()} kWh`);
  console.log(`   Generator: ${actual.generatorKW.toLocaleString()} kW`);
  console.log(`   Solar: ${actual.solarKW.toLocaleString()} kW`);
  
  // Calculate deviations
  console.log('\n🔍 DEVIATION ANALYSIS:');
  
  const deviations = [];
  
  // BESS Power
  const bessPowerDev = actual.bessKW === 0 ? 100 : 
    Math.abs((actual.bessKW - BENCHMARK.expectedBessKW) / BENCHMARK.expectedBessKW * 100);
  const bessPowerStatus = actual.bessKW === 0 ? '❌ CRITICAL' : 
    bessPowerDev < 15 ? '✅ OK' : bessPowerDev < 50 ? '⚠️ WARNING' : '❌ CRITICAL';
  console.log(`   BESS Power: ${bessPowerStatus}`);
  console.log(`     Expected: ${BENCHMARK.expectedBessKW.toLocaleString()} kW`);
  console.log(`     Actual: ${actual.bessKW.toLocaleString()} kW`);
  console.log(`     Deviation: ${bessPowerDev.toFixed(1)}%`);
  if (bessPowerStatus.includes('❌')) deviations.push('BESS Power');
  
  // BESS Energy
  const bessEnergyDev = actual.bessKWh === 0 ? 100 :
    Math.abs((actual.bessKWh - BENCHMARK.expectedBessKWh) / BENCHMARK.expectedBessKWh * 100);
  const bessEnergyStatus = actual.bessKWh === 0 ? '❌ CRITICAL' :
    bessEnergyDev < 15 ? '✅ OK' : bessEnergyDev < 50 ? '⚠️ WARNING' : '❌ CRITICAL';
  console.log(`   BESS Energy: ${bessEnergyStatus}`);
  console.log(`     Expected: ${BENCHMARK.expectedBessKWh.toLocaleString()} kWh`);
  console.log(`     Actual: ${actual.bessKWh.toLocaleString()} kWh`);
  console.log(`     Deviation: ${bessEnergyDev.toFixed(1)}%`);
  if (bessEnergyStatus.includes('❌')) deviations.push('BESS Energy');
  
  // Generator
  const hasGenerator = actual.generatorKW > 0;
  const generatorStatus = hasGenerator ? '✅ OK' : '❌ CRITICAL (REQUIRED for Tier III)';
  console.log(`   Generator: ${generatorStatus}`);
  console.log(`     Expected: ${BENCHMARK.expectedGeneratorKW.toLocaleString()} kW (REQUIRED)`);
  console.log(`     Actual: ${actual.generatorKW.toLocaleString()} kW`);
  if (!hasGenerator) deviations.push('Generator Missing');
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 VALIDATION RESULT');
  console.log('='.repeat(60));
  
  if (deviations.length === 0) {
    console.log('✅ PASS - All calculations within acceptable range');
  } else {
    console.log(`❌ FAIL - ${deviations.length} critical issue(s):`);
    deviations.forEach(d => console.log(`   • ${d}`));
    
    console.log('\n💡 ROOT CAUSE LIKELY:');
    if (actual.bessKW === 0 && actual.bessKWh === 0) {
      console.log('   The calculation engine is not receiving rack count or tier data.');
      console.log('   Check: state.useCaseData.rackCount and state.useCaseData.tier');
      
      const rackCount = state.useCaseData?.rackCount || state.facilityDetails?.rackCount;
      const tier = state.useCaseData?.tier || state.facilityDetails?.tier;
      
      console.log(`\n   Current values in state:`);
      console.log(`     rackCount: ${rackCount || 'MISSING'}`);
      console.log(`     tier: ${tier || 'MISSING'}`);
      
      if (!rackCount) {
        console.log('\n   🔧 FIX NEEDED: Step3Details.tsx must capture rackCount');
      }
      if (!tier) {
        console.log('   🔧 FIX NEEDED: Step3Details.tsx must capture tier selection');
      }
    }
  }
  
  console.log('\n');
}

// Add to window
window.validateDataCenterQuote = validateDataCenterQuote;

console.log('🏢 Data Center Validation loaded!');
console.log('   Run: validateDataCenterQuote()');
