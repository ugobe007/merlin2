/**
 * Test Pricing Tier Service
 * Tests the new size-based pricing tier functionality
 * 
 * Usage: tsx scripts/test-pricing-tiers.ts
 */

import { getPricingTier, getSizeUnits, getAllPricingTiers } from '../src/services/pricingTierService';

async function testPricingTiers() {
  console.log('🧪 Testing Pricing Tier Service\n');
  console.log('='.repeat(60));

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: BESS Utility Scale - 5 MW (5,000 kW)
  console.log('\n📊 Test 1: BESS Utility Scale - 5 MW (5,000 kW)');
  try {
    const result = await getPricingTier('bess', 5000, null, 'mid');
    if (result) {
      console.log(`✅ Found pricing tier: ${result.tier.config_key}`);
      console.log(`   Price (mid): $${result.price}/${result.unit}`);
      console.log(`   Size range: ${result.tier.size_min_kw}-${result.tier.size_max_kw || '∞'} kW`);
      console.log(`   Source: ${result.tier.data_source}`);
      console.log(`   Confidence: ${result.tier.confidence_level}`);
      
      // Verify it's in the 3-10 MW range
      if (result.tier.size_min_kw === 3000 && result.tier.size_max_kw === 10000) {
        passedTests++;
        console.log('   ✅ Correct tier (3-10 MW)');
      } else {
        failedTests++;
        console.log(`   ❌ Wrong tier (expected 3-10 MW, got ${result.tier.size_min_kw}-${result.tier.size_max_kw} kW)`);
      }
      
      // Verify price is in expected range ($101-125/kWh, mid = $110/kWh)
      if (result.price >= 100 && result.price <= 130) {
        passedTests++;
        console.log('   ✅ Price in expected range');
      } else {
        failedTests++;
        console.log(`   ❌ Price out of range (expected ~$110/kWh, got $${result.price}/kWh)`);
      }
    } else {
      failedTests++;
      console.log('❌ No pricing tier found');
    }
  } catch (error) {
    failedTests++;
    console.log(`❌ Error: ${error}`);
  }

  // Test 2: BESS Utility Scale - 25 MW (25,000 kW)
  console.log('\n📊 Test 2: BESS Utility Scale - 25 MW (25,000 kW)');
  try {
    const result = await getPricingTier('bess', 25000, null, 'mid');
    if (result) {
      console.log(`✅ Found pricing tier: ${result.tier.config_key}`);
      console.log(`   Price (mid): $${result.price}/${result.unit}`);
      console.log(`   Size range: ${result.tier.size_min_kw}-${result.tier.size_max_kw || '∞'} kW`);
      
      // Verify it's in the 10-50 MW range
      if (result.tier.size_min_kw === 10000 && result.tier.size_max_kw === 50000) {
        passedTests++;
        console.log('   ✅ Correct tier (10-50 MW)');
      } else {
        failedTests++;
        console.log(`   ❌ Wrong tier (expected 10-50 MW, got ${result.tier.size_min_kw}-${result.tier.size_max_kw} kW)`);
      }
    } else {
      failedTests++;
      console.log('❌ No pricing tier found');
    }
  } catch (error) {
    failedTests++;
    console.log(`❌ Error: ${error}`);
  }

  // Test 3: BESS Utility Scale - 100 MW (should use MWh, 100 MWh at 1 hour)
  console.log('\n📊 Test 3: BESS Utility Scale - 100 MW (100 MWh)');
  try {
    const result = await getPricingTier('bess', null, 100, 'mid');
    if (result) {
      console.log(`✅ Found pricing tier: ${result.tier.config_key}`);
      console.log(`   Price (mid): $${result.price}/${result.unit}`);
      console.log(`   Size range: ${result.tier.size_min_kw}-${result.tier.size_max_kw || '∞'} kW`);
      
      // Should be 50+ MW tier
      if (result.tier.size_min_kw === 50000 && result.tier.size_max_kw === null) {
        passedTests++;
        console.log('   ✅ Correct tier (50+ MW)');
      } else {
        failedTests++;
        console.log(`   ❌ Wrong tier (expected 50+ MW, got ${result.tier.size_min_kw}-${result.tier.size_max_kw} kW)`);
      }
    } else {
      failedTests++;
      console.log('❌ No pricing tier found');
    }
  } catch (error) {
    failedTests++;
    console.log(`❌ Error: ${error}`);
  }

  // Test 4: BESS Commercial - 300 kWh (300 kW at 1 hour)
  console.log('\n📊 Test 4: BESS Commercial - 300 kWh');
  try {
    const result = await getPricingTier('bess', 300, null, 'mid');
    if (result) {
      console.log(`✅ Found pricing tier: ${result.tier.config_key}`);
      console.log(`   Price (mid): $${result.price}/${result.unit}`);
      console.log(`   Size range: ${result.tier.size_min_kw}-${result.tier.size_max_kw || '∞'} kW`);
      
      // Should be 100-500 kWh tier
      if (result.tier.size_min_kw === 100 && (result.tier.size_max_kw === null || result.tier.size_max_kw >= 500)) {
        passedTests++;
        console.log('   ✅ Correct tier (100-500 kWh commercial)');
      } else {
        failedTests++;
        console.log(`   ❌ Wrong tier (expected 100-500 kWh, got ${result.tier.size_min_kw}-${result.tier.size_max_kw} kW)`);
      }
      
      // Verify price is around $325/kWh (mid for commercial)
      if (result.price >= 300 && result.price <= 350) {
        passedTests++;
        console.log('   ✅ Price in expected range (~$325/kWh)');
      } else {
        failedTests++;
        console.log(`   ❌ Price out of range (expected ~$325/kWh, got $${result.price}/kWh)`);
      }
    } else {
      failedTests++;
      console.log('❌ No pricing tier found');
    }
  } catch (error) {
    failedTests++;
    console.log(`❌ Error: ${error}`);
  }

  // Test 5: Solar PV Utility - 10 MW (10,000 kW)
  console.log('\n📊 Test 5: Solar PV Utility - 10 MW (10,000 kW)');
  try {
    const result = await getPricingTier('solar', 10000, null, 'mid');
    if (result) {
      console.log(`✅ Found pricing tier: ${result.tier.config_key}`);
      console.log(`   Price (mid): $${result.price}/${result.unit}`);
      console.log(`   Size range: ${result.tier.size_min_kw}-${result.tier.size_max_kw || '∞'} kW`);
      
      // Should be utility scale (≥5 MW)
      if (result.tier.size_min_kw === 5000) {
        passedTests++;
        console.log('   ✅ Correct tier (≥5 MW utility)');
      } else {
        failedTests++;
        console.log(`   ❌ Wrong tier (expected ≥5 MW, got ${result.tier.size_min_kw} kW)`);
      }
      
      // Verify price is around $0.65/W (validated quote)
      if (result.price >= 0.60 && result.price <= 0.70) {
        passedTests++;
        console.log('   ✅ Price in expected range (~$0.65/W)');
      } else {
        failedTests++;
        console.log(`   ❌ Price out of range (expected ~$0.65/W, got $${result.price}/W)`);
      }
    } else {
      failedTests++;
      console.log('❌ No pricing tier found');
    }
  } catch (error) {
    failedTests++;
    console.log(`❌ Error: ${error}`);
  }

  // Test 6: All price levels
  console.log('\n📊 Test 6: All Price Levels (5 MW BESS)');
  try {
    const levels: Array<'low' | 'low_plus' | 'mid' | 'mid_plus' | 'high'> = ['low', 'low_plus', 'mid', 'mid_plus', 'high'];
    const results = await Promise.all(
      levels.map(level => getPricingTier('bess', 5000, null, level))
    );
    
    if (results.every(r => r !== null)) {
      console.log('✅ All price levels returned results:');
      results.forEach((result, index) => {
        if (result) {
          console.log(`   ${levels[index]}: $${result.price}/kWh`);
        }
      });
      
      // Verify prices are in ascending order
      const prices = results.map(r => r?.price || 0);
      const isAscending = prices.every((price, index) => index === 0 || prices[index - 1] <= price);
      if (isAscending) {
        passedTests++;
        console.log('   ✅ Prices in ascending order (low < low+ < mid < mid+ < high)');
      } else {
        failedTests++;
        console.log('   ❌ Prices not in ascending order');
      }
    } else {
      failedTests++;
      console.log('❌ Some price levels failed');
    }
  } catch (error) {
    failedTests++;
    console.log(`❌ Error: ${error}`);
  }

  // Test 7: Get all pricing tiers for BESS
  console.log('\n📊 Test 7: Get All BESS Pricing Tiers');
  try {
    const tiers = await getAllPricingTiers('bess');
    console.log(`✅ Found ${tiers.length} pricing tiers:`);
    tiers.forEach(tier => {
      console.log(`   - ${tier.config_key}: ${tier.size_min_kw}-${tier.size_max_kw || '∞'} kW, $${(tier.config_data as any).price_mid}/${(tier.config_data as any).price_unit}`);
    });
    
    if (tiers.length >= 5) {
      passedTests++;
      console.log('   ✅ Found expected number of tiers (≥5)');
    } else {
      failedTests++;
      console.log(`   ❌ Expected ≥5 tiers, got ${tiers.length}`);
    }
  } catch (error) {
    failedTests++;
    console.log(`❌ Error: ${error}`);
  }

  // Test 8: Size units helper
  console.log('\n📊 Test 8: Size Units Helper');
  try {
    const test1 = getSizeUnits(5); // 5 MW
    console.log(`   5 MW: ${test1.sizeKW} kW, useMWh: ${test1.useMWh}, unit: ${test1.recommendedUnit}`);
    if (!test1.useMWh && test1.sizeKW === 5000) {
      passedTests++;
      console.log('   ✅ 5 MW correctly uses kW');
    } else {
      failedTests++;
    }

    const test2 = getSizeUnits(100); // 100 MW
    console.log(`   100 MW: ${test2.sizeKW} kW, useMWh: ${test2.useMWh}, unit: ${test2.recommendedUnit}`);
    if (test2.useMWh && test2.sizeMWh === 100) {
      passedTests++;
      console.log('   ✅ 100 MW correctly uses MWh');
    } else {
      failedTests++;
    }
  } catch (error) {
    failedTests++;
    console.log(`❌ Error: ${error}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Total: ${passedTests + failedTests}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.');
    process.exit(1);
  }
}

// Run tests
testPricingTiers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});



