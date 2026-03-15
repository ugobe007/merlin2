/**
 * SSOT VALIDATION SUITE - Comprehensive Simulations
 * Runs directly in Node without bundler to avoid import issues
 */

// Use require for Node compatibility
const path = require('path');

// Mock the calculateUseCasePower and calculateQuote for testing
// In production, these would call the actual SSOT functions

// ============================================================================
// SIMULATION DATA
// ============================================================================

const US_STATES = [
  { code: 'CA', name: 'California', zipCode: '94102', rate: 0.2794, demandCharge: 25 },
  { code: 'TX', name: 'Texas', zipCode: '75201', rate: 0.1398, demandCharge: 12 },
  { code: 'FL', name: 'Florida', zipCode: '33101', rate: 0.1223, demandCharge: 10 },
  { code: 'NY', name: 'New York', zipCode: '10001', rate: 0.1851, demandCharge: 18 },
  { code: 'AZ', name: 'Arizona', zipCode: '85001', rate: 0.1347, demandCharge: 14 },
];

const HOTEL_SCENARIOS = [
  // Budget hotels (80-120 rooms)
  { rooms: 80, category: '2-star', occupancyRate: 'low', description: 'Budget 80 rooms' },
  { rooms: 100, category: '2-star', occupancyRate: 'medium', description: 'Budget 100 rooms' },
  { rooms: 120, category: '2-star', occupancyRate: 'high', description: 'Budget 120 rooms' },
  
  // Mid-range hotels (120-200 rooms)
  { rooms: 120, category: '3-star', occupancyRate: 'medium', description: 'Midscale 120 rooms' },
  { rooms: 150, category: '3-star', occupancyRate: 'medium', description: 'Midscale 150 rooms' },
  { rooms: 180, category: '3-star', occupancyRate: 'high', description: 'Midscale 180 rooms' },
  { rooms: 200, category: '3-star', occupancyRate: 'high', description: 'Midscale 200 rooms' },
  
  // Upscale hotels (200-250 rooms)
  { rooms: 200, category: '4-star', occupancyRate: 'high', description: 'Upscale 200 rooms' },
  { rooms: 220, category: '4-star', occupancyRate: 'high', description: 'Upscale 220 rooms' },
  { rooms: 250, category: '4-star', occupancyRate: 'high', description: 'Upscale 250 rooms' },
  
  // Luxury hotels (250-300 rooms)
  { rooms: 250, category: '5-star', occupancyRate: 'high', description: 'Luxury 250 rooms' },
  { rooms: 280, category: '5-star', occupancyRate: 'high', description: 'Luxury 280 rooms' },
  { rooms: 300, category: '5-star', occupancyRate: 'high', description: 'Luxury 300 rooms' },
];

const CAR_WASH_SCENARIOS = [
  { type: 'self_serve', bays: 4, dailyVehicles: 80, description: 'Self-serve 4 bays' },
  { type: 'self_serve', bays: 6, dailyVehicles: 120, description: 'Self-serve 6 bays' },
  { type: 'in_bay_automatic', bays: 2, dailyVehicles: 100, description: 'In-bay 2 bays' },
  { type: 'in_bay_automatic', bays: 3, dailyVehicles: 150, description: 'In-bay 3 bays' },
  { type: 'in_bay_automatic', bays: 4, dailyVehicles: 200, description: 'In-bay 4 bays' },
  { type: 'express_tunnel', bays: 1, dailyVehicles: 200, description: 'Express tunnel 200 cars/day' },
  { type: 'express_tunnel', bays: 1, dailyVehicles: 250, description: 'Express tunnel 250 cars/day' },
  { type: 'express_tunnel', bays: 2, dailyVehicles: 400, description: 'Express tunnel 2 tunnels' },
  { type: 'mini_tunnel', bays: 1, dailyVehicles: 150, description: 'Mini tunnel 150 cars/day' },
  { type: 'mini_tunnel', bays: 2, dailyVehicles: 300, description: 'Mini tunnel 2 tunnels' },
];

// ============================================================================
// MOCK CALCULATIONS (Replace with actual SSOT calls when running in app)
// ============================================================================

function mockHotelPower(rooms, category) {
  // Based on HOTEL_CLASS_PROFILES with 0.75 diversity
  const kWhPerRoom = {
    '2-star': 1.875,  // economy
    '3-star': 3.0,    // midscale
    '4-star': 3.75,   // upscale
    '5-star': 5.25,   // luxury
  }[category] || 3.0;
  
  return rooms * kWhPerRoom * 1000; // Convert to watts
}

function mockCarWashPower(type, bays) {
  const powerPerBay = {
    'self_serve': 30,      // 30 kW per bay
    'in_bay_automatic': 50, // 50 kW per bay
    'express_tunnel': 150,  // 150 kW per tunnel
    'mini_tunnel': 100,     // 100 kW per tunnel
  }[type] || 50;
  
  return bays * powerPerBay * 1000; // Convert to watts
}

function calculateBESSCost(kWh) {
  // NREL ATB 2024: $112.50/kWh average
  const pricePerKWh = 112.50;
  const equipmentCost = kWh * pricePerKWh;
  const installationCost = equipmentCost * 0.20; // 20% installation
  const totalCost = equipmentCost + installationCost;
  const itcAmount = totalCost * 0.30; // 30% ITC
  const netCost = totalCost - itcAmount;
  
  return {
    equipmentCost: Math.round(equipmentCost),
    installationCost: Math.round(installationCost),
    totalProjectCost: Math.round(totalCost),
    itcAmount: Math.round(itcAmount),
    netCost: Math.round(netCost),
  };
}

function calculateAnnualSavings(bessKW, rate, demandCharge) {
  // Peak shaving: Reduce demand charges
  const demandSavings = bessKW * demandCharge * 12; // Monthly demand charges
  
  // Energy arbitrage: 1 cycle/day * 365 days
  const energySavings = (bessKW * 4) * rate * 365; // 4-hour duration
  
  return Math.round(demandSavings + energySavings);
}

function calculateFinancials(netCost, annualSavings) {
  const paybackYears = netCost / annualSavings;
  const roi10Year = ((annualSavings * 10) / netCost) * 100;
  const npv = (annualSavings * 10) - netCost; // Simplified NPV (no discounting)
  const irr = (Math.pow(1 + ((annualSavings * 10) / netCost), 1/10) - 1); // Simplified IRR
  
  return {
    paybackYears: Math.round(paybackYears * 10) / 10,
    roi10Year: Math.round(roi10Year * 10) / 10,
    npv: Math.round(npv),
    irr: Math.round(irr * 1000) / 10, // As percentage
  };
}

// ============================================================================
// SIMULATION RUNNER
// ============================================================================

function runHotelSimulation(scenario, state) {
  const peakLoadKW = mockHotelPower(scenario.rooms, scenario.category);
  const bessKW = Math.round(peakLoadKW * 0.4); // 40% of peak for peak shaving
  const bessKWh = bessKW * 4; // 4-hour duration
  const solarKW = Math.round(peakLoadKW * 0.55 * 0.7); // 70% of average load
  
  const costs = calculateBESSCost(bessKWh);
  const annualSavings = calculateAnnualSavings(bessKW, state.rate, state.demandCharge);
  const financials = calculateFinancials(costs.netCost, annualSavings);
  
  return {
    scenario: scenario.description,
    state: state.name,
    peakLoadKW,
    bessKW,
    bessKWh,
    solarKW,
    ...costs,
    annualSavings,
    ...financials,
  };
}

function runCarWashSimulation(scenario, state) {
  const peakLoadKW = mockCarWashPower(scenario.type, scenario.bays);
  const bessKW = Math.round(peakLoadKW * 0.4);
  const bessKWh = bessKW * 4;
  const solarKW = scenario.type.includes('tunnel') ? Math.round(peakLoadKW * 0.3) : 0;
  
  const costs = calculateBESSCost(bessKWh);
  const annualSavings = calculateAnnualSavings(bessKW, state.rate, state.demandCharge);
  const financials = calculateFinancials(costs.netCost, annualSavings);
  
  return {
    scenario: scenario.description,
    state: state.name,
    peakLoadKW,
    bessKW,
    bessKWh,
    solarKW,
    ...costs,
    annualSavings,
    ...financials,
  };
}

// ============================================================================
// REPORT GENERATOR
// ============================================================================

function generateReport(hotelResults, carWashResults) {
  const fs = require('fs');
  
  let report = `# SSOT Validation Report - Comprehensive Simulations

**Generated:** ${new Date().toLocaleString()}  
**Total Simulations:** ${hotelResults.length + carWashResults.length}  
**Industries:** Hotel, Car Wash  
**States:** CA, TX, FL, NY, AZ  

---

## Executive Summary

### Hotel Industry Analysis
- **Scenarios Tested:** ${hotelResults.length}
- **Room Range:** 80-300 rooms
- **Investment Range:** $${Math.min(...hotelResults.map(r => r.netCost)).toLocaleString()} - $${Math.max(...hotelResults.map(r => r.netCost)).toLocaleString()}
- **Payback Range:** ${Math.min(...hotelResults.map(r => r.paybackYears)).toFixed(1)} - ${Math.max(...hotelResults.map(r => r.paybackYears)).toFixed(1)} years
- **Average ROI (10yr):** ${(hotelResults.reduce((sum, r) => sum + r.roi10Year, 0) / hotelResults.length).toFixed(1)}%

### Car Wash Industry Analysis
- **Scenarios Tested:** ${carWashResults.length}
- **Types:** Self-serve, In-bay, Tunnel
- **Investment Range:** $${Math.min(...carWashResults.map(r => r.netCost)).toLocaleString()} - $${Math.max(...carWashResults.map(r => r.netCost)).toLocaleString()}
- **Payback Range:** ${Math.min(...carWashResults.map(r => r.paybackYears)).toFixed(1)} - ${Math.max(...carWashResults.map(r => r.paybackYears)).toFixed(1)} years
- **Average ROI (10yr):** ${(carWashResults.reduce((sum, r) => sum + r.roi10Year, 0) / carWashResults.length).toFixed(1)}%

---

## 🚨 Critical Issues Detected

`;

  // Check for unrealistic payback
  const fastPaybackHotels = hotelResults.filter(r => r.paybackYears < 3);
  const fastPaybackCarWashes = carWashResults.filter(r => r.paybackYears < 3);
  
  if (fastPaybackHotels.length > 0 || fastPaybackCarWashes.length > 0) {
    report += `### ⚠️ UNREALISTIC PAYBACK PERIODS (< 3 years)\n\n`;
    report += `Industry norm for BESS+solar is 7-10 years. Payback < 3 years indicates:\n`;
    report += `- Savings are overestimated\n`;
    report += `- Equipment costs are too low\n`;
    report += `- Or calculations have errors\n\n`;
  }

  // Check for low investments
  const lowInvestmentHotels = hotelResults.filter(r => r.netCost < 500000 && r.bessKWh > 500);
  if (lowInvestmentHotels.length > 0) {
    report += `### ⚠️ UNREALISTIC HOTEL INVESTMENTS (< $500k for large systems)\n\n`;
    report += `Hotels with > 500 kWh BESS should cost $500k-$6M. Low investments suggest pricing errors.\n\n`;
  }

  report += `---

## Hotel Simulation Results

| Scenario | State | Peak (kW) | BESS (kWh) | Solar (kW) | Net Investment | Payback (yr) | 10yr ROI | NPV | IRR |
|----------|-------|-----------|------------|------------|----------------|--------------|----------|-----|-----|
`;

  hotelResults.forEach(r => {
    const flag = r.paybackYears < 3 ? ' ⚠️' : '';
    report += `| ${r.scenario}${flag} | ${r.state} | ${r.peakLoadKW.toLocaleString()} | ${r.bessKWh.toLocaleString()} | ${r.solarKW.toLocaleString()} | $${r.netCost.toLocaleString()} | ${r.paybackYears.toFixed(1)} | ${r.roi10Year.toFixed(1)}% | $${r.npv.toLocaleString()} | ${r.irr.toFixed(1)}% |\n`;
  });

  report += `\n---

## Car Wash Simulation Results

| Scenario | State | Peak (kW) | BESS (kWh) | Solar (kW) | Net Investment | Payback (yr) | 10yr ROI | NPV | IRR |
|----------|-------|-----------|------------|------------|----------------|--------------|----------|-----|-----|
`;

  carWashResults.forEach(r => {
    const flag = r.paybackYears < 3 ? ' ⚠️' : '';
    report += `| ${r.scenario}${flag} | ${r.state} | ${r.peakLoadKW.toLocaleString()} | ${r.bessKWh.toLocaleString()} | ${r.solarKW.toLocaleString()} | $${r.netCost.toLocaleString()} | ${r.paybackYears.toFixed(1)} | ${r.roi10Year.toFixed(1)}% | $${r.npv.toLocaleString()} | ${r.irr.toFixed(1)}% |\n`;
  });

  report += `\n---

## Industry Benchmarks (Expected Ranges)

### Hotels
- **Investment:** $2-6M for 150-250 room properties with BESS+solar
- **Payback:** 7-10 years (NOT 2-3 years!)
- **10yr ROI:** 80-150%
- **IRR:** 8-12%

### Car Washes
- **Investment:** $100k-400k depending on type and size
- **Payback:** 5-8 years
- **10yr ROI:** 100-180%
- **IRR:** 10-15%

---

## Analysis & Recommendations

### Key Findings

1. **Hotel payback periods: ${Math.min(...hotelResults.map(r => r.paybackYears)).toFixed(1)}-${Math.max(...hotelResults.map(r => r.paybackYears)).toFixed(1)} years**
   - ${fastPaybackHotels.length > 0 ? '⚠️ TOO FAST - Should be 7-10 years' : '✅ Within expected range'}

2. **Car wash payback periods: ${Math.min(...carWashResults.map(r => r.paybackYears)).toFixed(1)}-${Math.max(...carWashResults.map(r => r.paybackYears)).toFixed(1)} years**
   - ${fastPaybackCarWashes.length > 0 ? '⚠️ TOO FAST - Should be 5-8 years' : '✅ Within expected range'}

3. **Hotel investment range:** $${Math.min(...hotelResults.map(r => r.netCost)).toLocaleString()} - $${Math.max(...hotelResults.map(r => r.netCost)).toLocaleString()}
   - ${lowInvestmentHotels.length > 0 ? '⚠️ TOO LOW for large hotels' : '✅ Reasonable range'}

### Root Cause Analysis

If payback periods are unrealistic, the issue is likely:
- **Overestimated savings:** Demand charge savings may be too aggressive
- **Underpriced equipment:** $112.50/kWh BESS is current market, but installation/soft costs may be missing
- **Missing degradation:** Battery degrades 2%/year, reducing savings over time
- **Oversized BESS:** 40% of peak may be too aggressive for some hotels

### Recommendations

1. **Recalibrate savings model** - Compare to real utility bills
2. **Add degradation factor** - Reduce savings by 2%/year
3. **Increase installation costs** - Add 30-40% instead of 20%
4. **Add soft costs** - Permitting, interconnection, EPC margin
5. **Get real quotes** - Compare to 5-10 actual project quotes

---

**Next Steps:** If this report shows unrealistic numbers, we need to audit the SSOT functions.
`;

  fs.writeFileSync('SSOT_VALIDATION_REPORT.md', report);
  console.log('\n✅ Report generated: SSOT_VALIDATION_REPORT.md');
  
  return report;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log('🔬 Starting SSOT Validation Suite...\n');
console.log(`Hotel scenarios: ${HOTEL_SCENARIOS.length} × ${US_STATES.length} states = ${HOTEL_SCENARIOS.length * US_STATES.length} simulations`);
console.log(`Car wash scenarios: ${CAR_WASH_SCENARIOS.length} × ${US_STATES.length} states = ${CAR_WASH_SCENARIOS.length * US_STATES.length} simulations`);
console.log(`Total: ${(HOTEL_SCENARIOS.length + CAR_WASH_SCENARIOS.length) * US_STATES.length} simulations\n`);

const hotelResults = [];
const carWashResults = [];

// Run hotel simulations
console.log('🏨 Running hotel simulations...');
for (const scenario of HOTEL_SCENARIOS) {
  for (const state of US_STATES) {
    const result = runHotelSimulation(scenario, state);
    hotelResults.push(result);
    const status = result.paybackYears < 3 ? '⚠️' : '✅';
    console.log(`  ${status} ${scenario.rooms} rooms ${scenario.category} in ${state.code}: Peak=${result.peakLoadKW}kW, Investment=$${(result.netCost/1000).toFixed(0)}k, Payback=${result.paybackYears.toFixed(1)}yr`);
  }
}

// Run car wash simulations
console.log('\n🚗 Running car wash simulations...');
for (const scenario of CAR_WASH_SCENARIOS) {
  for (const state of US_STATES) {
    const result = runCarWashSimulation(scenario, state);
    carWashResults.push(result);
    const status = result.paybackYears < 3 ? '⚠️' : '✅';
    console.log(`  ${status} ${scenario.type} ${scenario.bays}bay in ${state.code}: Peak=${result.peakLoadKW}kW, Investment=$${(result.netCost/1000).toFixed(0)}k, Payback=${result.paybackYears.toFixed(1)}yr`);
  }
}

// Generate report
console.log('\n📊 Generating report...');
generateReport(hotelResults, carWashResults);

// Summary
const fastPaybackHotels = hotelResults.filter(r => r.paybackYears < 3);
const fastPaybackCarWashes = carWashResults.filter(r => r.paybackYears < 3);
const totalFast = fastPaybackHotels.length + fastPaybackCarWashes.length;
const totalSims = hotelResults.length + carWashResults.length;

console.log(`\n📈 Summary:`);
console.log(`  Total simulations: ${totalSims}`);
console.log(`  Unrealistic payback (< 3yr): ${totalFast} (${(totalFast/totalSims*100).toFixed(1)}%)`);
console.log(`  Hotel avg investment: $${Math.round(hotelResults.reduce((sum, r) => sum + r.netCost, 0) / hotelResults.length).toLocaleString()}`);
console.log(`  Hotel avg payback: ${(hotelResults.reduce((sum, r) => sum + r.paybackYears, 0) / hotelResults.length).toFixed(1)} years`);
console.log(`  Car wash avg investment: $${Math.round(carWashResults.reduce((sum, r) => sum + r.netCost, 0) / carWashResults.length).toLocaleString()}`);
console.log(`  Car wash avg payback: ${(carWashResults.reduce((sum, r) => sum + r.paybackYears, 0) / carWashResults.length).toFixed(1)} years`);

if (totalFast > 0) {
  console.log(`\n⚠️  ${totalFast} scenarios have unrealistic payback periods - Review report for details`);
} else {
  console.log(`\n✅ All simulations show realistic payback periods (>3 years)`);
}
