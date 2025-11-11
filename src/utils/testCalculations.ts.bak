// Test utility for centralized calculations
// Usage in browser console: window.testCalculations()

import { getCachedConstants, calculateFinancialMetrics } from '../services/centralizedCalculations';

export async function testCalculations() {
  console.log('🧪 Testing Centralized Calculation Service...\n');
  
  try {
    // 1. Test fetching constants
    console.log('1️⃣ Fetching constants from database...');
    const constants = await getCachedConstants();
    console.log('📊 Constants loaded:', constants);
    console.log('');
    
    // 2. Test calculation
    console.log('2️⃣ Running test calculation (2MW/4hr BESS)...');
    const result = await calculateFinancialMetrics({
      storageSizeMW: 2,
      durationHours: 4,
      solarMW: 0,
      location: 'California',
      electricityRate: 0.15
    });
    
    console.log('💰 Calculation Results:');
    console.log(`   Total Cost: $${result.totalCost.toLocaleString()}`);
    console.log(`   Annual Savings: $${result.annualSavings.toLocaleString()}`);
    console.log(`   ROI: ${result.roi.toFixed(1)}%`);
    console.log(`   Payback: ${result.paybackYears.toFixed(1)} years`);
    console.log(`   ✅ Data Source: ${result.dataSource}`);
    console.log('');
    
    // 3. Show what constants were used
    if (result.dataSource === 'database') {
      console.log('✅ SUCCESS: Using database constants!');
      console.log('📋 Constants used in calculation:');
      console.log(`   - Peak Shaving: ${constants.peakShavingMultiplier} cycles/year`);
      console.log(`   - Demand Charge: $${constants.demandChargeMonthlyPerMW.toLocaleString()}/MW-month`);
      console.log(`   - Grid Services: $${constants.gridServiceRevenuePerMW.toLocaleString()}/MW-year`);
      console.log(`   - Round Trip Efficiency: ${(constants.roundTripEfficiency * 100).toFixed(0)}%`);
      console.log(`   - Federal Tax Credit: ${(constants.federalTaxCreditRate * 100).toFixed(0)}%`);
    } else {
      console.warn('⚠️ WARNING: Using fallback constants (database unavailable)');
    }
    
    return { constants, result, success: true };
    
  } catch (error) {
    console.error('❌ Error testing calculations:', error);
    return { error, success: false };
  }
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testCalculations = testCalculations;
}
