/**
 * SSOT VALIDATION SUITE - Comprehensive Simulations
 * 
 * Purpose: Run hundreds of scenarios across hotel and car wash industries
 * to validate that investment amounts and ROI align with industry expectations.
 * 
 * Created: March 15, 2026
 * Per Vineet's request: "Run a whole bunch of simulations for car wash and hotel"
 * 
 * Output: Markdown report with investment ranges and ROI by scenario
 */

// Direct imports (tsx doesn't support @ alias)
import { calculateUseCasePower } from '../src/services/useCasePowerCalculations.ts';
import { calculateQuote } from '../src/services/unifiedQuoteCalculator.ts';

// ============================================================================
// STATE CONFIGURATIONS
// ============================================================================

const US_STATES = [
  { code: 'CA', name: 'California', zipCode: '94102', rate: 0.2794, demandCharge: 25 }, // Highest rates
  { code: 'TX', name: 'Texas', zipCode: '75201', rate: 0.1398, demandCharge: 12 }, // Mid rates
  { code: 'FL', name: 'Florida', zipCode: '33101', rate: 0.1223, demandCharge: 10 }, // Lower rates
  { code: 'NY', name: 'New York', zipCode: '10001', rate: 0.1851, demandCharge: 18 }, // High rates
  { code: 'AZ', name: 'Arizona', zipCode: '85001', rate: 0.1347, demandCharge: 14 }, // Mid rates
];

// ============================================================================
// HOTEL SCENARIOS (80-300 rooms)
// ============================================================================

const HOTEL_SCENARIOS = [
  // Budget hotels (80-120 rooms)
  { rooms: 80, category: '2-star', occupancyRate: 'low', hasPool: false, hasRestaurant: false, hasSpa: false },
  { rooms: 100, category: '2-star', occupancyRate: 'medium', hasPool: false, hasRestaurant: false, hasSpa: false },
  { rooms: 120, category: '2-star', occupancyRate: 'high', hasPool: false, hasRestaurant: true, hasSpa: false },
  
  // Mid-range hotels (120-200 rooms)
  { rooms: 120, category: '3-star', occupancyRate: 'medium', hasPool: false, hasRestaurant: true, hasSpa: false },
  { rooms: 150, category: '3-star', occupancyRate: 'medium', hasPool: true, hasRestaurant: true, hasSpa: false },
  { rooms: 180, category: '3-star', occupancyRate: 'high', hasPool: true, hasRestaurant: true, hasSpa: false },
  { rooms: 200, category: '3-star', occupancyRate: 'high', hasPool: true, hasRestaurant: true, hasSpa: true },
  
  // Upscale hotels (200-250 rooms)
  { rooms: 200, category: '4-star', occupancyRate: 'high', hasPool: true, hasRestaurant: true, hasSpa: true },
  { rooms: 220, category: '4-star', occupancyRate: 'high', hasPool: true, hasRestaurant: true, hasSpa: true },
  { rooms: 250, category: '4-star', occupancyRate: 'high', hasPool: true, hasRestaurant: true, hasSpa: true },
  
  // Luxury hotels (250-300 rooms)
  { rooms: 250, category: '5-star', occupancyRate: 'high', hasPool: true, hasRestaurant: true, hasSpa: true },
  { rooms: 280, category: '5-star', occupancyRate: 'high', hasPool: true, hasRestaurant: true, hasSpa: true },
  { rooms: 300, category: '5-star', occupancyRate: 'high', hasPool: true, hasRestaurant: true, hasSpa: true },
];

// ============================================================================
// CAR WASH SCENARIOS (Tight range - similar footprint)
// ============================================================================

const CAR_WASH_SCENARIOS = [
  // Self-service (small)
  { type: 'self_serve', bays: 4, dailyVehicles: 80, hasVacuums: true, hasDryers: false },
  { type: 'self_serve', bays: 6, dailyVehicles: 120, hasVacuums: true, hasDryers: false },
  
  // In-bay automatic
  { type: 'in_bay_automatic', bays: 2, dailyVehicles: 100, hasVacuums: true, hasDryers: true },
  { type: 'in_bay_automatic', bays: 3, dailyVehicles: 150, hasVacuums: true, hasDryers: true },
  { type: 'in_bay_automatic', bays: 4, dailyVehicles: 200, hasVacuums: true, hasDryers: true },
  
  // Express tunnel (most common for BESS)
  { type: 'express_tunnel', bays: 1, dailyVehicles: 200, hasVacuums: true, hasDryers: true },
  { type: 'express_tunnel', bays: 1, dailyVehicles: 250, hasVacuums: true, hasDryers: true },
  { type: 'express_tunnel', bays: 2, dailyVehicles: 400, hasVacuums: true, hasDryers: true },
  
  // Mini-tunnel
  { type: 'mini_tunnel', bays: 1, dailyVehicles: 150, hasVacuums: true, hasDryers: true },
  { type: 'mini_tunnel', bays: 2, dailyVehicles: 300, hasVacuums: true, hasDryers: true },
];

// ============================================================================
// SIMULATION RUNNER
// ============================================================================

interface SimulationResult {
  scenario: string;
  state: string;
  peakLoadKW: number;
  bessKW: number;
  bessKWh: number;
  solarKW: number;
  generatorKW: number;
  equipmentCost: number;
  installationCost: number;
  totalProjectCost: number;
  itcAmount: number;
  netCost: number;
  annualSavings: number;
  paybackYears: number;
  roi10Year: number;
  npv: number;
  irr: number;
  error?: string;
}

async function runHotelSimulation(
  scenario: typeof HOTEL_SCENARIOS[0],
  state: typeof US_STATES[0]
): Promise<SimulationResult> {
  try {
    // Step 1: Calculate power requirements using SSOT
    const answers = {
      numRooms: scenario.rooms,
      hotelCategory: scenario.category,
      occupancyRate: scenario.occupancyRate,
      poolOnSite: scenario.hasPool,
      restaurantOnSite: scenario.hasRestaurant,
      spaOnSite: scenario.hasSpa,
    };
    
    const powerResult = calculateUseCasePower('hotel', answers);
    const peakLoadKW = powerResult.powerMW * 1000;
    
    if (peakLoadKW === 0) {
      return {
        scenario: `Hotel ${scenario.rooms} rooms ${scenario.category}`,
        state: state.name,
        peakLoadKW: 0,
        bessKW: 0,
        bessKWh: 0,
        solarKW: 0,
        generatorKW: 0,
        equipmentCost: 0,
        installationCost: 0,
        totalProjectCost: 0,
        itcAmount: 0,
        netCost: 0,
        annualSavings: 0,
        paybackYears: 0,
        roi10Year: 0,
        npv: 0,
        irr: 0,
        error: '⚠️ POWER CALCULATION RETURNED 0 - FIELD NAME MISMATCH?',
      };
    }
    
    // Step 2: Size BESS (peak shaving use case: 40% of peak)
    const bessKW = Math.round(peakLoadKW * 0.4);
    const bessKWh = bessKW * 4; // 4-hour duration
    
    // Step 3: Size solar (70% of average load for self-consumption)
    const avgLoadKW = peakLoadKW * 0.55; // 55% average load factor for hotels
    const solarKW = Math.round(avgLoadKW * 0.7);
    
    // Step 4: Generator (25% of hotels have backup generator)
    const generatorKW = scenario.rooms >= 150 ? Math.round(peakLoadKW * 0.5) : 0;
    
    // Step 5: Calculate quote using SSOT
    const quote = await calculateQuote({
      storageSizeMW: bessKW / 1000,
      durationHours: 4,
      solarMW: solarKW / 1000,
      generatorMW: generatorKW / 1000,
      generatorFuelType: 'natural-gas',
      location: state.code,
      zipCode: state.zipCode,
      electricityRate: state.rate,
      useCase: 'hotel',
      gridConnection: 'on-grid',
    });
    
    return {
      scenario: `Hotel ${scenario.rooms} rooms ${scenario.category}`,
      state: state.name,
      peakLoadKW: Math.round(peakLoadKW),
      bessKW,
      bessKWh,
      solarKW,
      generatorKW,
      equipmentCost: quote.costs.equipmentCost,
      installationCost: quote.costs.installationCost,
      totalProjectCost: quote.costs.totalProjectCost,
      itcAmount: quote.costs.itcAmount,
      netCost: quote.costs.netCost,
      annualSavings: quote.financials.annualSavings,
      paybackYears: quote.financials.paybackYears,
      roi10Year: quote.financials.roi10Year,
      npv: quote.financials.npv || 0,
      irr: quote.financials.irr || 0,
    };
  } catch (error) {
    return {
      scenario: `Hotel ${scenario.rooms} rooms ${scenario.category}`,
      state: state.name,
      peakLoadKW: 0,
      bessKW: 0,
      bessKWh: 0,
      solarKW: 0,
      generatorKW: 0,
      equipmentCost: 0,
      installationCost: 0,
      totalProjectCost: 0,
      itcAmount: 0,
      netCost: 0,
      annualSavings: 0,
      paybackYears: 0,
      roi10Year: 0,
      npv: 0,
      irr: 0,
      error: `ERROR: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function runCarWashSimulation(
  scenario: typeof CAR_WASH_SCENARIOS[0],
  state: typeof US_STATES[0]
): Promise<SimulationResult> {
  try {
    // Step 1: Calculate power requirements using SSOT
    const answers = {
      facilityType: scenario.type,
      tunnelOrBayCount: scenario.bays,
      dailyVehicles: scenario.dailyVehicles,
      hasVacuums: scenario.hasVacuums,
      hasDryers: scenario.hasDryers,
    };
    
    const powerResult = calculateUseCasePower('car-wash', answers);
    const peakLoadKW = powerResult.powerMW * 1000;
    
    if (peakLoadKW === 0) {
      return {
        scenario: `Car Wash ${scenario.type} ${scenario.bays} bays`,
        state: state.name,
        peakLoadKW: 0,
        bessKW: 0,
        bessKWh: 0,
        solarKW: 0,
        generatorKW: 0,
        equipmentCost: 0,
        installationCost: 0,
        totalProjectCost: 0,
        itcAmount: 0,
        netCost: 0,
        annualSavings: 0,
        paybackYears: 0,
        roi10Year: 0,
        npv: 0,
        irr: 0,
        error: '⚠️ POWER CALCULATION RETURNED 0 - FIELD NAME MISMATCH?',
      };
    }
    
    // Step 2: Size BESS (peak shaving: 40% of peak)
    const bessKW = Math.round(peakLoadKW * 0.4);
    const bessKWh = bessKW * 4;
    
    // Step 3: Solar (if roof space available - assume 50% of car washes have solar potential)
    const solarKW = scenario.type === 'express_tunnel' || scenario.type === 'mini_tunnel' 
      ? Math.round(peakLoadKW * 0.3) // Tunnel washes have good roof space
      : 0; // Self-serve and in-bay don't typically have enough roof
    
    // Step 4: Generator (rare for car washes - only for critical operations)
    const generatorKW = 0;
    
    // Step 5: Calculate quote using SSOT
    const quote = await calculateQuote({
      storageSizeMW: bessKW / 1000,
      durationHours: 4,
      solarMW: solarKW / 1000,
      generatorMW: 0,
      location: state.code,
      zipCode: state.zipCode,
      electricityRate: state.rate,
      useCase: 'car-wash',
      gridConnection: 'on-grid',
    });
    
    return {
      scenario: `Car Wash ${scenario.type} ${scenario.bays} bays`,
      state: state.name,
      peakLoadKW: Math.round(peakLoadKW),
      bessKW,
      bessKWh,
      solarKW,
      generatorKW,
      equipmentCost: quote.costs.equipmentCost,
      installationCost: quote.costs.installationCost,
      totalProjectCost: quote.costs.totalProjectCost,
      itcAmount: quote.costs.itcAmount,
      netCost: quote.costs.netCost,
      annualSavings: quote.financials.annualSavings,
      paybackYears: quote.financials.paybackYears,
      roi10Year: quote.financials.roi10Year,
      npv: quote.financials.npv || 0,
      irr: quote.financials.irr || 0,
    };
  } catch (error) {
    return {
      scenario: `Car Wash ${scenario.type} ${scenario.bays} bays`,
      state: state.name,
      peakLoadKW: 0,
      bessKW: 0,
      bessKWh: 0,
      solarKW: 0,
      generatorKW: 0,
      equipmentCost: 0,
      installationCost: 0,
      totalProjectCost: 0,
      itcAmount: 0,
      netCost: 0,
      annualSavings: 0,
      paybackYears: 0,
      roi10Year: 0,
      npv: 0,
      irr: 0,
      error: `ERROR: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ============================================================================
// REPORT GENERATOR
// ============================================================================

function generateMarkdownReport(hotelResults: SimulationResult[], carWashResults: SimulationResult[]): string {
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
- **Categories:** 2-star to 5-star
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

  // Check for 0 values
  const zeroHotels = hotelResults.filter(r => r.peakLoadKW === 0 || r.bessKW === 0);
  const zeroCarWashes = carWashResults.filter(r => r.peakLoadKW === 0 || r.bessKW === 0);
  
  if (zeroHotels.length > 0 || zeroCarWashes.length > 0) {
    report += `### ⚠️ POWER CALCULATION FAILURES\n\n`;
    if (zeroHotels.length > 0) {
      report += `**Hotels with 0 power:** ${zeroHotels.length}/${hotelResults.length} scenarios\n`;
      zeroHotels.forEach(r => {
        report += `- ${r.scenario} in ${r.state}: ${r.error || 'Power = 0'}\n`;
      });
    }
    if (zeroCarWashes.length > 0) {
      report += `**Car washes with 0 power:** ${zeroCarWashes.length}/${carWashResults.length} scenarios\n`;
      zeroCarWashes.forEach(r => {
        report += `- ${r.scenario} in ${r.state}: ${r.error || 'Power = 0'}\n`;
      });
    }
    report += `\n`;
  }
  
  // Check for unrealistic payback
  const fastPaybackHotels = hotelResults.filter(r => r.paybackYears > 0 && r.paybackYears < 3);
  const fastPaybackCarWashes = carWashResults.filter(r => r.paybackYears > 0 && r.paybackYears < 3);
  
  if (fastPaybackHotels.length > 0 || fastPaybackCarWashes.length > 0) {
    report += `### ⚠️ UNREALISTIC PAYBACK PERIODS (< 3 years)\n\n`;
    report += `Industry norm for BESS+solar is 7-10 years. Payback < 3 years is suspiciously good.\n\n`;
    if (fastPaybackHotels.length > 0) {
      report += `**Hotels:** ${fastPaybackHotels.length} scenarios\n`;
      fastPaybackHotels.forEach(r => {
        report += `- ${r.scenario} in ${r.state}: ${r.paybackYears.toFixed(1)} years (Investment: $${r.netCost.toLocaleString()})\n`;
      });
    }
    if (fastPaybackCarWashes.length > 0) {
      report += `**Car Washes:** ${fastPaybackCarWashes.length} scenarios\n`;
      fastPaybackCarWashes.forEach(r => {
        report += `- ${r.scenario} in ${r.state}: ${r.paybackYears.toFixed(1)} years (Investment: $${r.netCost.toLocaleString()})\n`;
      });
    }
    report += `\n`;
  }

  // Check for unrealistic investment amounts
  const lowInvestmentHotels = hotelResults.filter(r => r.netCost > 0 && r.netCost < 500000);
  if (lowInvestmentHotels.length > 0) {
    report += `### ⚠️ UNREALISTIC HOTEL INVESTMENTS (< $500k)\n\n`;
    report += `Hotels typically need $2-6M for BESS+solar. Investments < $500k are too low.\n\n`;
    lowInvestmentHotels.forEach(r => {
      report += `- ${r.scenario} in ${r.state}: $${r.netCost.toLocaleString()} (BESS: ${r.bessKWh} kWh, Solar: ${r.solarKW} kW)\n`;
    });
    report += `\n`;
  }

  report += `---

## Hotel Simulation Results

| Scenario | State | Peak (kW) | BESS (kWh) | Solar (kW) | Net Investment | Payback (yr) | 10yr ROI | NPV | IRR |
|----------|-------|-----------|------------|------------|----------------|--------------|----------|-----|-----|
`;

  hotelResults.forEach(r => {
    const flag = r.peakLoadKW === 0 || r.paybackYears < 3 ? ' ⚠️' : '';
    report += `| ${r.scenario}${flag} | ${r.state} | ${r.peakLoadKW.toLocaleString()} | ${r.bessKWh.toLocaleString()} | ${r.solarKW.toLocaleString()} | $${r.netCost.toLocaleString()} | ${r.paybackYears.toFixed(1)} | ${r.roi10Year.toFixed(1)}% | $${r.npv.toLocaleString()} | ${(r.irr * 100).toFixed(1)}% |\n`;
  });

  report += `\n---

## Car Wash Simulation Results

| Scenario | State | Peak (kW) | BESS (kWh) | Solar (kW) | Net Investment | Payback (yr) | 10yr ROI | NPV | IRR |
|----------|-------|-----------|------------|------------|----------------|--------------|----------|-----|-----|
`;

  carWashResults.forEach(r => {
    const flag = r.peakLoadKW === 0 || r.paybackYears < 3 ? ' ⚠️' : '';
    report += `| ${r.scenario}${flag} | ${r.state} | ${r.peakLoadKW.toLocaleString()} | ${r.bessKWh.toLocaleString()} | ${r.solarKW.toLocaleString()} | $${r.netCost.toLocaleString()} | ${r.paybackYears.toFixed(1)} | ${r.roi10Year.toFixed(1)}% | $${r.npv.toLocaleString()} | ${(r.irr * 100).toFixed(1)}% |\n`;
  });

  report += `\n---

## Industry Benchmarks (Expected Ranges)

### Hotels
- **Investment:** $2-6M for 150-250 room properties with BESS+solar
- **Payback:** 7-10 years (not 2-3 years!)
- **10yr ROI:** 80-150%
- **IRR:** 8-12%

### Car Washes
- **Investment:** $100k-400k depending on type and size
- **Payback:** 5-8 years
- **10yr ROI:** 100-180%
- **IRR:** 10-15%

---

## Recommendations

1. **Fix 0 power calculations** - Field name mismatches between wizard and SSOT
2. **Verify equipment pricing** - Are we using NREL ATB 2024 prices or placeholders?
3. **Audit savings calculations** - Annual savings may be overestimated
4. **Add sanity checks** - Payback < 3 years should trigger warning
5. **Compare to real projects** - Need 5-10 real-world quotes to calibrate

---

**Next Steps:** Review flagged scenarios and compare against real project quotes.
`;

  return report;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🔬 Starting SSOT Validation Suite...\n');
  console.log(`Running ${HOTEL_SCENARIOS.length} hotel scenarios across ${US_STATES.length} states = ${HOTEL_SCENARIOS.length * US_STATES.length} simulations`);
  console.log(`Running ${CAR_WASH_SCENARIOS.length} car wash scenarios across ${US_STATES.length} states = ${CAR_WASH_SCENARIOS.length * US_STATES.length} simulations`);
  console.log(`Total: ${(HOTEL_SCENARIOS.length + CAR_WASH_SCENARIOS.length) * US_STATES.length} simulations\n`);
  
  const hotelResults: SimulationResult[] = [];
  const carWashResults: SimulationResult[] = [];
  
  // Run hotel simulations
  console.log('🏨 Running hotel simulations...');
  for (const scenario of HOTEL_SCENARIOS) {
    for (const state of US_STATES) {
      const result = await runHotelSimulation(scenario, state);
      hotelResults.push(result);
      const status = result.peakLoadKW === 0 ? '❌ ZERO' : result.paybackYears < 3 ? '⚠️ FAST' : '✅';
      console.log(`  ${status} ${scenario.rooms} rooms ${scenario.category} in ${state.code}: Peak=${result.peakLoadKW}kW, Investment=$${(result.netCost/1000).toFixed(0)}k, Payback=${result.paybackYears.toFixed(1)}yr`);
    }
  }
  
  // Run car wash simulations
  console.log('\n🚗 Running car wash simulations...');
  for (const scenario of CAR_WASH_SCENARIOS) {
    for (const state of US_STATES) {
      const result = await runCarWashSimulation(scenario, state);
      carWashResults.push(result);
      const status = result.peakLoadKW === 0 ? '❌ ZERO' : result.paybackYears < 3 ? '⚠️ FAST' : '✅';
      console.log(`  ${status} ${scenario.type} ${scenario.bays}bay in ${state.code}: Peak=${result.peakLoadKW}kW, Investment=$${(result.netCost/1000).toFixed(0)}k, Payback=${result.paybackYears.toFixed(1)}yr`);
    }
  }
  
  // Generate report
  console.log('\n📊 Generating report...');
  const report = generateMarkdownReport(hotelResults, carWashResults);
  
  // Write to file
  const fs = await import('fs/promises');
  const reportPath = 'SSOT_VALIDATION_REPORT.md';
  await fs.writeFile(reportPath, report);
  console.log(`\n✅ Report generated: ${reportPath}`);
  
  // Summary
  const totalSims = hotelResults.length + carWashResults.length;
  const zeroCount = hotelResults.filter(r => r.peakLoadKW === 0).length + carWashResults.filter(r => r.peakLoadKW === 0).length;
  const fastPaybackCount = hotelResults.filter(r => r.paybackYears > 0 && r.paybackYears < 3).length + carWashResults.filter(r => r.paybackYears > 0 && r.paybackYears < 3).length;
  
  console.log(`\n📈 Summary:`);
  console.log(`  Total simulations: ${totalSims}`);
  console.log(`  Zero power issues: ${zeroCount} (${(zeroCount/totalSims*100).toFixed(1)}%)`);
  console.log(`  Unrealistic payback: ${fastPaybackCount} (${(fastPaybackCount/totalSims*100).toFixed(1)}%)`);
  
  if (zeroCount > 0 || fastPaybackCount > 0) {
    console.log(`\n⚠️  ISSUES DETECTED - Review report for details`);
  } else {
    console.log(`\n✅ All simulations passed validation`);
  }
}

// Run simulations
main().catch(console.error);
