/**
 * Validation script for West London EV Hub calculation
 */

import { 
  calculateEVHubPower, 
  calculateEVHubCosts, 
  calculateEVHubBESSSize,
  WEST_LONDON_EV_HUB_CONFIG
} from '../src/services/evChargingCalculations';

console.log('='.repeat(70));
console.log('WEST LONDON EV HUB VALIDATION');
console.log('='.repeat(70));

// Configuration from the quote
const config = WEST_LONDON_EV_HUB_CONFIG;
console.log('\n📋 CONFIGURATION (from West London Quote):');
console.log('  100 × 7 kW L2 = 700 kW');
console.log('  20 × 150 kW DCFC = 3,000 kW');
console.log('  16 × 350 kW HPC = 5,600 kW');
console.log('  ---');
console.log('  Expected Total: 9,300 kW = 9.3 MW');

// Calculate power
const power = calculateEVHubPower(config, 70);
console.log('\n⚡ POWER CALCULATION:');
console.log(`  Total Power: ${power.totalPowerKW.toLocaleString()} kW (${power.totalPowerMW.toFixed(1)} MW)`);
console.log(`  Peak Demand (70% concurrency): ${power.peakDemandKW.toLocaleString()} kW (${power.peakDemandMW.toFixed(1)} MW)`);
console.log(`  Description: ${power.description}`);

// Calculate costs
const costs = calculateEVHubCosts(config);
console.log('\n💰 COST CALCULATION (USD):');
console.log(`  Hardware: $${costs.hardwareCostUSD.toLocaleString()}`);
console.log(`  Installation: $${costs.installationCostUSD.toLocaleString()}`);
console.log(`  Make-ready: $${costs.makeReadyCostUSD.toLocaleString()}`);
console.log(`  Networking: $${costs.networkingCostUSD.toLocaleString()}`);
console.log(`  Contingency (10%): $${costs.contingencyUSD.toLocaleString()}`);
console.log(`  ---`);
console.log(`  TOTAL EV CHARGERS: $${costs.totalCostUSD.toLocaleString()}`);

// Convert to GBP for comparison
const fxRate = 0.7407;
const gbpTotal = costs.totalCostUSD * fxRate;
console.log(`\n🇬🇧 GBP (at £0.7407/USD):`);
console.log(`  TOTAL: £${gbpTotal.toLocaleString()}`);
console.log(`  Quote shows: £5,684,132`);

// Calculate BESS recommendation
const bess = calculateEVHubBESSSize(power);
console.log('\n🔋 BESS RECOMMENDATION:');
console.log(`  Our calculation: ${bess.recommendedPowerMW.toFixed(1)} MW / ${bess.recommendedEnergyMWh.toFixed(1)} MWh`);
console.log(`  Quote spec: 3 MW / 10 MWh (actual, for longer duration/full backup)`);
console.log(`  Reasoning: ${bess.reasoning}`);

console.log('\n' + '='.repeat(70));
console.log('KEY INSIGHT: Our BESS recommendation is for peak shaving only.');
console.log('The quote uses 3 MW / 10 MWh for FULL off-grid capability.');
console.log('='.repeat(70));
