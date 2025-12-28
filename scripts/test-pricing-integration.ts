#!/usr/bin/env npx tsx

/**
 * PRICING TIER INTEGRATION TEST
 * ==============================
 * 
 * Tests that pricingTierService integration works correctly in equipmentCalculations
 * 
 * Run: npx tsx scripts/test-pricing-integration.ts
 */

import { calculateEquipmentBreakdown } from '../packages/core/src/calculations/index';

async function testPricingIntegration() {
  console.log('🧪 Testing Pricing Tier Integration\n');
  console.log('═'.repeat(70));
  console.log('');

  // Test 1: Small commercial BESS system (should use commercial tier)
  console.log('📊 Test 1: Small Commercial BESS (0.5 MW, 4hr)');
  console.log('─'.repeat(50));
  try {
    const small = await calculateEquipmentBreakdown(
      0.5,   // 0.5 MW = 500 kW (commercial tier)
      4,     // 4 hours
      0,     // no solar
      0,     // no wind
      0,     // no generator
      undefined,
      'on-grid',
      'California'
    );
    
    console.log(`✅ Battery pricing source: ${small.batteries?.pricingTierSource || 'N/A'}`);
    console.log(`   Total battery cost: $${small.batteries?.totalCost?.toLocaleString() || 'N/A'}`);
    console.log(`   Price per kWh: $${small.batteries?.costPerKWh?.toFixed(2) || 'N/A'}/kWh`);
    console.log('');
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    console.log('');
  }

  // Test 2: Medium utility BESS system (should use utility 3-10 MW tier)
  console.log('📊 Test 2: Medium Utility BESS (5 MW, 4hr)');
  console.log('─'.repeat(50));
  try {
    const medium = await calculateEquipmentBreakdown(
      5.0,   // 5 MW = 5000 kW (utility 3-10 MW tier)
      4,     // 4 hours
      0,     // no solar
      0,     // no wind
      0,     // no generator
      undefined,
      'on-grid',
      'California'
    );
    
    console.log(`✅ Battery pricing source: ${medium.batteries?.pricingTierSource || 'N/A'}`);
    console.log(`   Total battery cost: $${medium.batteries?.totalCost?.toLocaleString() || 'N/A'}`);
    console.log(`   Price per kWh: $${medium.batteries?.costPerKWh?.toFixed(2) || 'N/A'}/kWh`);
    console.log('');
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
    console.log('');
  }

  // Test 3: Large utility BESS system (should use utility 10-50 MW tier)
  console.log('📊 Test 3: Large Utility BESS (25 MW, 4hr)');
  console.log('─'.repeat(50));
  try {
    const large = await calculateEquipmentBreakdown(
      25.0,  // 25 MW = 25000 kW (utility 10-50 MW tier)
      4,     // 4 hours
      0,     // no solar
      0,     // no wind
      0,     // no generator
      undefined,
      'on-grid',
      'California'
    );
    
    console.log(`✅ Battery pricing source: ${large.batteries?.pricingTierSource || 'N/A'}`);
    console.log(`   Total battery cost: $${large.batteries?.totalCost?.toLocaleString() || 'N/A'}`);
    console.log(`   Price per kWh: $${large.batteries?.costPerKWh?.toFixed(2) || 'N/A'}/kWh`);
    console.log('');
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
    console.log('');
  }

  // Test 4: Solar pricing integration
  console.log('📊 Test 4: Solar Pricing (2.5 MW - Commercial tier)');
  console.log('─'.repeat(50));
  try {
    const solar = await calculateEquipmentBreakdown(
      1.0,   // 1 MW battery
      4,     // 4 hours
      2.5,   // 2.5 MW solar = 2500 kW (commercial solar tier)
      0,     // no wind
      0,     // no generator
      undefined,
      'on-grid',
      'California'
    );
    
    console.log(`✅ Solar pricing source: ${solar.solar?.priceCategory || 'N/A'}`);
    console.log(`   Total solar cost: $${solar.solar?.totalCost?.toLocaleString() || 'N/A'}`);
    console.log(`   Cost per watt: $${solar.solar?.costPerWatt?.toFixed(3) || 'N/A'}/W`);
    console.log('');
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
    console.log('');
  }

  // Test 5: Utility-scale solar (should use utility solar tier)
  console.log('📊 Test 5: Utility Solar Pricing (10 MW - Utility tier)');
  console.log('─'.repeat(50));
  try {
    const utilitySolar = await calculateEquipmentBreakdown(
      1.0,   // 1 MW battery
      4,     // 4 hours
      10.0,  // 10 MW solar = 10000 kW (utility solar tier)
      0,     // no wind
      0,     // no generator
      undefined,
      'on-grid',
      'California'
    );
    
    console.log(`✅ Solar pricing source: ${utilitySolar.solar?.priceCategory || 'N/A'}`);
    console.log(`   Total solar cost: $${utilitySolar.solar?.totalCost?.toLocaleString() || 'N/A'}`);
    console.log(`   Cost per watt: $${utilitySolar.solar?.costPerWatt?.toFixed(3) || 'N/A'}/W`);
    console.log('');
  } catch (error) {
    console.error('❌ Test 5 failed:', error);
    console.log('');
  }

  console.log('═'.repeat(70));
  console.log('✅ Pricing Tier Integration Test Complete');
  console.log('');
  console.log('📝 Notes:');
  console.log('   - Pricing source should show "database_pricing_tier" or config key if database is used');
  console.log('   - Pricing source should show "market_intelligence_fallback" if database unavailable');
  console.log('   - Price per kWh should decrease for larger systems (economies of scale)');
  console.log('   - Solar cost per watt should be lower for utility-scale systems');
}

// Run tests
testPricingIntegration().catch(console.error);

