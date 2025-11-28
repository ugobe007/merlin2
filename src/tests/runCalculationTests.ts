#!/usr/bin/env npx ts-node

/**
 * CALCULATION TEST RUNNER
 * =======================
 * Run with: npm run test:calculations
 * Or: npx ts-node src/tests/runCalculationTests.ts
 * 
 * This script tests all calculation functions outside the browser.
 */

// Import the calculation functions directly
import {
  calculateUseCasePower,
  calculateOfficePower,
  calculateHotelPower,
  calculateHospitalPower,
  calculateDatacenterPower,
  calculateEVChargingPower,
  calculateAirportPower,
  calculateManufacturingPower,
  calculateWarehousePower,
  calculateRetailPower,
  calculateShoppingCenterPower,
  calculateAgriculturePower,
  calculateCasinoPower,
  calculateIndoorFarmPower,
  calculateApartmentPower,
  calculateCollegePower,
  calculateCarWashPower,
  POWER_DENSITY_STANDARDS,
  type PowerCalculationResult
} from '../services/useCasePowerCalculations';

// ============================================================================
// TEST CASES
// ============================================================================

interface TestCase {
  name: string;
  slug: string;
  inputs: Record<string, any>;
  expectedPowerMW: { min: number; max: number };
  expectedDurationHrs: number;
}

const TEST_CASES: TestCase[] = [
  // OFFICE
  { name: 'Small Office (10,000 sq ft)', slug: 'office', inputs: { officeSqFt: 10000 }, expectedPowerMW: { min: 0.05, max: 0.08 }, expectedDurationHrs: 4 },
  { name: 'Medium Office (25,000 sq ft)', slug: 'office', inputs: { officeSqFt: 25000 }, expectedPowerMW: { min: 0.12, max: 0.18 }, expectedDurationHrs: 4 },
  { name: 'Large Office (100,000 sq ft)', slug: 'office', inputs: { officeSqFt: 100000 }, expectedPowerMW: { min: 0.5, max: 0.7 }, expectedDurationHrs: 4 },
  
  // HOTEL
  { name: 'Small Hotel (50 rooms)', slug: 'hotel', inputs: { roomCount: 50 }, expectedPowerMW: { min: 0.15, max: 0.20 }, expectedDurationHrs: 4 },
  { name: 'Medium Hotel (150 rooms)', slug: 'hotel', inputs: { roomCount: 150 }, expectedPowerMW: { min: 0.45, max: 0.60 }, expectedDurationHrs: 4 },
  { name: 'Large Hotel (400 rooms)', slug: 'hotel', inputs: { roomCount: 400 }, expectedPowerMW: { min: 1.2, max: 1.6 }, expectedDurationHrs: 4 },
  
  // HOSPITAL
  { name: 'Small Hospital (100 beds)', slug: 'hospital', inputs: { bedCount: 100 }, expectedPowerMW: { min: 0.8, max: 1.2 }, expectedDurationHrs: 8 },
  { name: 'Large Hospital (500 beds)', slug: 'hospital', inputs: { bedCount: 500 }, expectedPowerMW: { min: 4.5, max: 5.5 }, expectedDurationHrs: 8 },
  
  // DATA CENTER
  { name: 'Small DC (100 racks)', slug: 'datacenter', inputs: { rackCount: 100, rackDensityKW: 8 }, expectedPowerMW: { min: 1.0, max: 1.5 }, expectedDurationHrs: 4 },
  { name: 'Medium DC (400 racks)', slug: 'datacenter', inputs: { rackCount: 400, rackDensityKW: 8 }, expectedPowerMW: { min: 4.0, max: 5.5 }, expectedDurationHrs: 4 },
  
  // EV CHARGING
  { name: 'Small EV (4 L2, 2 DC)', slug: 'ev-charging', inputs: { numberOfLevel2Chargers: 4, numberOfDCFastChargers: 2 }, expectedPowerMW: { min: 0.35, max: 0.45 }, expectedDurationHrs: 2 },
  { name: 'Large EV Hub (20 L2, 10 DC)', slug: 'ev-charging', inputs: { numberOfLevel2Chargers: 20, numberOfDCFastChargers: 10 }, expectedPowerMW: { min: 1.8, max: 2.0 }, expectedDurationHrs: 2 },
  
  // AGRICULTURE
  { name: 'Small Farm (500 acres)', slug: 'agriculture', inputs: { acreage: 500, farmType: 'row-crop' }, expectedPowerMW: { min: 0.15, max: 0.25 }, expectedDurationHrs: 4 },
  { name: 'Large Farm (5,000 acres)', slug: 'agriculture', inputs: { acreage: 5000, farmType: 'row-crop' }, expectedPowerMW: { min: 1.8, max: 2.5 }, expectedDurationHrs: 4 },
  
  // MANUFACTURING
  { name: 'Light Mfg (50k sq ft)', slug: 'manufacturing', inputs: { facilitySqFt: 50000, industryType: 'light' }, expectedPowerMW: { min: 0.4, max: 0.6 }, expectedDurationHrs: 4 },
  { name: 'Heavy Mfg (100k sq ft)', slug: 'manufacturing', inputs: { facilitySqFt: 100000, industryType: 'heavy' }, expectedPowerMW: { min: 2.0, max: 3.0 }, expectedDurationHrs: 4 },
  
  // WAREHOUSE
  { name: 'Warehouse (250k sq ft)', slug: 'warehouse', inputs: { warehouseSqFt: 250000 }, expectedPowerMW: { min: 0.4, max: 0.6 }, expectedDurationHrs: 4 },
  { name: 'Cold Storage (100k sq ft)', slug: 'cold-storage', inputs: { storageVolume: 100000 }, expectedPowerMW: { min: 0.7, max: 0.9 }, expectedDurationHrs: 8 },
  
  // RETAIL
  { name: 'Small Retail (5k sq ft)', slug: 'retail', inputs: { retailSqFt: 5000 }, expectedPowerMW: { min: 0.03, max: 0.05 }, expectedDurationHrs: 4 },
  { name: 'Shopping Mall (500k sq ft)', slug: 'shopping-center', inputs: { retailSqFt: 500000 }, expectedPowerMW: { min: 4.5, max: 5.5 }, expectedDurationHrs: 4 },
  
  // CASINO
  { name: 'Casino (50k gaming)', slug: 'casino', inputs: { gamingFloorSize: 50000 }, expectedPowerMW: { min: 0.8, max: 1.0 }, expectedDurationHrs: 4 },
  
  // INDOOR FARM
  { name: 'Vertical Farm (20k sq ft)', slug: 'indoor-farm', inputs: { growingAreaSqFt: 20000 }, expectedPowerMW: { min: 1.0, max: 1.5 }, expectedDurationHrs: 6 },
  
  // APARTMENTS
  { name: 'Apartments (200 units)', slug: 'apartment', inputs: { unitCount: 200 }, expectedPowerMW: { min: 0.3, max: 0.4 }, expectedDurationHrs: 4 },
  
  // COLLEGE
  { name: 'College (5k students)', slug: 'college', inputs: { studentCount: 5000 }, expectedPowerMW: { min: 2.0, max: 3.0 }, expectedDurationHrs: 4 },
  
  // CAR WASH
  { name: 'Car Wash (6 bays)', slug: 'car-wash', inputs: { bayCount: 6, washType: 'automatic' }, expectedPowerMW: { min: 0.10, max: 0.15 }, expectedDurationHrs: 2 },
  
  // AIRPORT
  { name: 'Airport (5M passengers)', slug: 'airport', inputs: { annualPassengers: 5 }, expectedPowerMW: { min: 6.5, max: 8.5 }, expectedDurationHrs: 4 },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

function runTests(): void {
  console.log('═'.repeat(70));
  console.log('   MERLIN BESS CALCULATION TEST SUITE');
  console.log('═'.repeat(70));
  console.log('');
  
  // Print standards
  console.log('📊 POWER DENSITY STANDARDS:');
  console.log('─'.repeat(40));
  Object.entries(POWER_DENSITY_STANDARDS).forEach(([key, value]) => {
    console.log(`   ${key.padEnd(20)} ${value}`);
  });
  console.log('');
  
  // Run tests
  console.log('🧪 RUNNING TESTS:');
  console.log('─'.repeat(70));
  
  let passed = 0;
  let failed = 0;
  const failures: { test: TestCase; result: PowerCalculationResult; error: string }[] = [];
  
  for (const test of TEST_CASES) {
    const result = calculateUseCasePower(test.slug, test.inputs);
    
    const powerOK = result.powerMW >= test.expectedPowerMW.min && result.powerMW <= test.expectedPowerMW.max;
    const durationOK = result.durationHrs === test.expectedDurationHrs;
    
    if (powerOK && durationOK) {
      passed++;
      console.log(`✅ ${test.name}`);
      console.log(`   ${result.powerMW.toFixed(3)} MW [${test.expectedPowerMW.min}-${test.expectedPowerMW.max}] | ${result.durationHrs}hr`);
    } else {
      failed++;
      const error = !powerOK 
        ? `Power ${result.powerMW.toFixed(3)} not in [${test.expectedPowerMW.min}, ${test.expectedPowerMW.max}]`
        : `Duration ${result.durationHrs} != ${test.expectedDurationHrs}`;
      
      failures.push({ test, result, error });
      console.log(`❌ ${test.name}`);
      console.log(`   ERROR: ${error}`);
      console.log(`   Got: ${result.powerMW.toFixed(3)} MW, ${result.durationHrs}hr`);
      console.log(`   Method: ${result.calculationMethod}`);
    }
    console.log('');
  }
  
  // Summary
  console.log('═'.repeat(70));
  console.log(`   RESULTS: ${passed}/${passed + failed} tests passed`);
  console.log('═'.repeat(70));
  
  if (failed > 0) {
    console.log('\n⚠️  FAILED TESTS:');
    failures.forEach(f => {
      console.log(`   • ${f.test.name}: ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All calculation tests passed!');
    process.exit(0);
  }
}

// Run
runTests();
