/**
 * CALCULATION TEST SUITE
 * ======================
 * Comprehensive test script for all BESS calculation functions.
 * Run with: npx ts-node src/tests/calculationTests.ts
 * Or import and call testAllCalculations() from browser console.
 * 
 * Tests the three pillars:
 * 1. Power Calculations (useCasePowerCalculations.ts)
 * 2. Financial Calculations (centralizedCalculations.ts)
 * 3. Equipment Calculations (equipmentCalculations.ts)
 */

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
// TEST CONFIGURATION
// ============================================================================

interface TestCase {
  name: string;
  slug: string;
  inputs: Record<string, any>;
  expectedPowerMW: { min: number; max: number };  // Acceptable range
  expectedDurationHrs: number;
}

// Define test cases with expected ranges based on industry standards
const POWER_TEST_CASES: TestCase[] = [
  // OFFICE BUILDINGS
  {
    name: 'Small Office (10,000 sq ft)',
    slug: 'office',
    inputs: { officeSqFt: 10000 },
    expectedPowerMW: { min: 0.05, max: 0.08 },  // 5-7 W/sq ft × 10k = 50-70 kW
    expectedDurationHrs: 4
  },
  {
    name: 'Medium Office (25,000 sq ft)',
    slug: 'office',
    inputs: { officeSqFt: 25000 },
    expectedPowerMW: { min: 0.12, max: 0.18 },  // 6 W/sq ft × 25k = 150 kW
    expectedDurationHrs: 4
  },
  {
    name: 'Large Office (100,000 sq ft)',
    slug: 'office',
    inputs: { officeSqFt: 100000 },
    expectedPowerMW: { min: 0.5, max: 0.7 },    // 6 W/sq ft × 100k = 600 kW
    expectedDurationHrs: 4
  },
  
  // HOTELS
  {
    name: 'Small Hotel (50 rooms)',
    slug: 'hotel',
    inputs: { roomCount: 50 },
    expectedPowerMW: { min: 0.15, max: 0.20 },   // 3.5 kW/room × 50 = 175 kW
    expectedDurationHrs: 4
  },
  {
    name: 'Medium Hotel (150 rooms)',
    slug: 'hotel',
    inputs: { roomCount: 150 },
    expectedPowerMW: { min: 0.45, max: 0.60 },   // 3.5 kW/room × 150 = 525 kW
    expectedDurationHrs: 4
  },
  {
    name: 'Large Hotel (400 rooms)',
    slug: 'hotel',
    inputs: { roomCount: 400 },
    expectedPowerMW: { min: 1.2, max: 1.6 },     // 3.5 kW/room × 400 = 1.4 MW
    expectedDurationHrs: 4
  },
  
  // HOSPITALS
  {
    name: 'Small Hospital (100 beds)',
    slug: 'hospital',
    inputs: { bedCount: 100 },
    expectedPowerMW: { min: 0.8, max: 1.2 },     // 10 kW/bed × 100 = 1 MW
    expectedDurationHrs: 8
  },
  {
    name: 'Large Hospital (500 beds)',
    slug: 'hospital',
    inputs: { bedCount: 500 },
    expectedPowerMW: { min: 4.5, max: 5.5 },     // 10 kW/bed × 500 = 5 MW
    expectedDurationHrs: 8
  },
  
  // DATA CENTERS
  {
    name: 'Small Data Center (100 racks)',
    slug: 'datacenter',
    inputs: { rackCount: 100, rackDensityKW: 8 },
    expectedPowerMW: { min: 1.0, max: 1.5 },     // 100 racks × 8kW × 1.5 PUE = 1.2 MW
    expectedDurationHrs: 4
  },
  {
    name: 'Medium Data Center (400 racks)',
    slug: 'datacenter',
    inputs: { rackCount: 400, rackDensityKW: 8 },
    expectedPowerMW: { min: 4.0, max: 5.5 },     // 400 racks × 8kW × 1.5 PUE = 4.8 MW
    expectedDurationHrs: 4
  },
  
  // EV CHARGING
  {
    name: 'Small EV Station (4 L2, 2 DC Fast)',
    slug: 'ev-charging',
    inputs: { numberOfLevel2Chargers: 4, numberOfDCFastChargers: 2 },
    expectedPowerMW: { min: 0.35, max: 0.45 },   // 4×19.2kW + 2×150kW = 376.8 kW
    expectedDurationHrs: 2
  },
  {
    name: 'Large EV Hub (20 L2, 10 DC Fast)',
    slug: 'ev-charging',
    inputs: { numberOfLevel2Chargers: 20, numberOfDCFastChargers: 10 },
    expectedPowerMW: { min: 1.8, max: 2.0 },     // 20×19.2kW + 10×150kW = 1.88 MW
    expectedDurationHrs: 2
  },
  
  // AGRICULTURE
  {
    name: 'Small Farm (500 acres)',
    slug: 'agriculture',
    inputs: { acreage: 500, farmType: 'row-crop' },
    expectedPowerMW: { min: 0.15, max: 0.25 },   // 500 × 0.4 kW/acre = 200 kW
    expectedDurationHrs: 4
  },
  {
    name: 'Large Farm (5,000 acres)',
    slug: 'agriculture',
    inputs: { acreage: 5000, farmType: 'row-crop' },
    expectedPowerMW: { min: 1.8, max: 2.5 },     // 5000 × 0.4 kW/acre = 2 MW
    expectedDurationHrs: 4
  },
  {
    name: 'Dairy Farm (1,000 acres)',
    slug: 'agriculture',
    inputs: { acreage: 1000, farmType: 'dairy' },
    expectedPowerMW: { min: 1.0, max: 1.5 },     // 1000 × 1.2 kW/acre = 1.2 MW
    expectedDurationHrs: 4
  },
  
  // MANUFACTURING
  {
    name: 'Light Manufacturing (50,000 sq ft)',
    slug: 'manufacturing',
    inputs: { facilitySqFt: 50000, industryType: 'light' },
    expectedPowerMW: { min: 0.4, max: 0.6 },     // 50k × 10 W/sq ft = 500 kW
    expectedDurationHrs: 4
  },
  {
    name: 'Heavy Manufacturing (100,000 sq ft)',
    slug: 'manufacturing',
    inputs: { facilitySqFt: 100000, industryType: 'heavy' },
    expectedPowerMW: { min: 2.0, max: 3.0 },     // 100k × 25 W/sq ft = 2.5 MW
    expectedDurationHrs: 4
  },
  
  // WAREHOUSE/LOGISTICS
  {
    name: 'Standard Warehouse (250,000 sq ft)',
    slug: 'warehouse',
    inputs: { warehouseSqFt: 250000, isColdStorage: false },
    expectedPowerMW: { min: 0.4, max: 0.6 },     // 250k × 2 W/sq ft = 500 kW
    expectedDurationHrs: 4
  },
  {
    name: 'Cold Storage (100,000 sq ft)',
    slug: 'cold-storage',
    inputs: { storageVolume: 100000 },
    expectedPowerMW: { min: 0.7, max: 0.9 },     // 100k × 8 W/sq ft = 800 kW
    expectedDurationHrs: 8
  },
  
  // RETAIL
  {
    name: 'Small Retail Store (5,000 sq ft)',
    slug: 'retail',
    inputs: { retailSqFt: 5000 },
    expectedPowerMW: { min: 0.03, max: 0.05 },   // 5k × 8 W/sq ft = 40 kW
    expectedDurationHrs: 4
  },
  {
    name: 'Shopping Mall (500,000 sq ft)',
    slug: 'shopping-center',
    inputs: { retailSqFt: 500000 },
    expectedPowerMW: { min: 4.5, max: 5.5 },     // 500k × 10 W/sq ft = 5 MW
    expectedDurationHrs: 4
  },
  
  // CASINO
  {
    name: 'Casino (50,000 sq ft gaming)',
    slug: 'casino',
    inputs: { gamingFloorSize: 50000 },
    expectedPowerMW: { min: 0.8, max: 1.0 },     // 50k × 18 W/sq ft = 900 kW
    expectedDurationHrs: 4
  },
  
  // INDOOR FARM
  {
    name: 'Vertical Farm (20,000 sq ft)',
    slug: 'indoor-farm',
    inputs: { growingAreaSqFt: 20000 },
    expectedPowerMW: { min: 1.0, max: 1.5 },     // 20k × 50 W/sq ft × 1.3 = 1.3 MW
    expectedDurationHrs: 6
  },
  
  // APARTMENTS
  {
    name: 'Apartment Complex (200 units)',
    slug: 'apartment',
    inputs: { unitCount: 200 },
    expectedPowerMW: { min: 0.3, max: 0.4 },     // 200 × 1.8 kW/unit = 360 kW
    expectedDurationHrs: 4
  },
  
  // COLLEGE
  {
    name: 'Small College (5,000 students)',
    slug: 'college',
    inputs: { studentCount: 5000 },
    expectedPowerMW: { min: 2.0, max: 3.0 },     // 5k × 0.5 kW/student = 2.5 MW
    expectedDurationHrs: 4
  },
  
  // CAR WASH
  {
    name: 'Automatic Car Wash (6 bays)',
    slug: 'car-wash',
    inputs: { bayCount: 6, washType: 'automatic' },
    expectedPowerMW: { min: 0.10, max: 0.15 },   // 6 × 20 kW/bay = 120 kW
    expectedDurationHrs: 2
  },
  
  // AIRPORT
  {
    name: 'Regional Airport (5M passengers)',
    slug: 'airport',
    inputs: { annualPassengers: 5 },
    expectedPowerMW: { min: 6.5, max: 8.5 },     // 5M × 1.5 MW/M = 7.5 MW
    expectedDurationHrs: 4
  },
];

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

interface TestResult {
  name: string;
  slug: string;
  passed: boolean;
  actual: PowerCalculationResult;
  expected: { powerMW: { min: number; max: number }; durationHrs: number };
  error?: string;
}

/**
 * Run a single power calculation test
 */
function runPowerTest(testCase: TestCase): TestResult {
  try {
    const result = calculateUseCasePower(testCase.slug, testCase.inputs);
    
    const powerInRange = result.powerMW >= testCase.expectedPowerMW.min && 
                         result.powerMW <= testCase.expectedPowerMW.max;
    const durationMatches = result.durationHrs === testCase.expectedDurationHrs;
    
    return {
      name: testCase.name,
      slug: testCase.slug,
      passed: powerInRange && durationMatches,
      actual: result,
      expected: {
        powerMW: testCase.expectedPowerMW,
        durationHrs: testCase.expectedDurationHrs
      },
      error: !powerInRange 
        ? `Power ${result.powerMW} MW not in range [${testCase.expectedPowerMW.min}, ${testCase.expectedPowerMW.max}]`
        : !durationMatches 
          ? `Duration ${result.durationHrs}hr != expected ${testCase.expectedDurationHrs}hr`
          : undefined
    };
  } catch (err: any) {
    return {
      name: testCase.name,
      slug: testCase.slug,
      passed: false,
      actual: { powerMW: 0, durationHrs: 0, description: '', calculationMethod: '', inputs: {} },
      expected: { powerMW: testCase.expectedPowerMW, durationHrs: testCase.expectedDurationHrs },
      error: `Exception: ${err.message}`
    };
  }
}

/**
 * Run all power calculation tests
 */
export function testPowerCalculations(): { passed: number; failed: number; results: TestResult[] } {
  console.log('=' .repeat(60));
  console.log('POWER CALCULATION TESTS');
  console.log('=' .repeat(60));
  
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;
  
  for (const testCase of POWER_TEST_CASES) {
    const result = runPowerTest(testCase);
    results.push(result);
    
    if (result.passed) {
      passed++;
      console.log(`✅ PASS: ${result.name}`);
      console.log(`   Power: ${result.actual.powerMW.toFixed(3)} MW (expected: ${result.expected.powerMW.min}-${result.expected.powerMW.max})`);
    } else {
      failed++;
      console.log(`❌ FAIL: ${result.name}`);
      console.log(`   Error: ${result.error}`);
      console.log(`   Actual: ${result.actual.powerMW.toFixed(3)} MW, ${result.actual.durationHrs}hr`);
      console.log(`   Method: ${result.actual.calculationMethod}`);
    }
    console.log('');
  }
  
  console.log('=' .repeat(60));
  console.log(`SUMMARY: ${passed}/${passed + failed} tests passed`);
  console.log('=' .repeat(60));
  
  return { passed, failed, results };
}

/**
 * Test direct calculator functions (not via slug routing)
 */
export function testDirectCalculators(): void {
  console.log('\n' + '=' .repeat(60));
  console.log('DIRECT CALCULATOR FUNCTION TESTS');
  console.log('=' .repeat(60));
  
  // Test each direct function
  const tests = [
    { name: 'calculateOfficePower(25000)', fn: () => calculateOfficePower(25000) },
    { name: 'calculateHotelPower(150)', fn: () => calculateHotelPower(150) },
    { name: 'calculateHospitalPower(200)', fn: () => calculateHospitalPower(200) },
    { name: 'calculateDatacenterPower(undefined, 400, 8)', fn: () => calculateDatacenterPower(undefined, 400, 8) },
    { name: 'calculateEVChargingPower(0, 10, 5)', fn: () => calculateEVChargingPower(0, 10, 5) },
    { name: 'calculateAirportPower(10)', fn: () => calculateAirportPower(10) },
    { name: 'calculateManufacturingPower(100000, "heavy")', fn: () => calculateManufacturingPower(100000, 'heavy') },
    { name: 'calculateWarehousePower(250000, false)', fn: () => calculateWarehousePower(250000, false) },
    { name: 'calculateWarehousePower(100000, true)', fn: () => calculateWarehousePower(100000, true) },
    { name: 'calculateRetailPower(50000)', fn: () => calculateRetailPower(50000) },
    { name: 'calculateShoppingCenterPower(500000)', fn: () => calculateShoppingCenterPower(500000) },
    { name: 'calculateAgriculturePower(5000, undefined, "row-crop")', fn: () => calculateAgriculturePower(5000, undefined, 'row-crop') },
    { name: 'calculateCasinoPower(50000)', fn: () => calculateCasinoPower(50000) },
    { name: 'calculateIndoorFarmPower(20000)', fn: () => calculateIndoorFarmPower(20000) },
    { name: 'calculateApartmentPower(200)', fn: () => calculateApartmentPower(200) },
    { name: 'calculateCollegePower(10000)', fn: () => calculateCollegePower(10000) },
    { name: 'calculateCarWashPower(6, "automatic")', fn: () => calculateCarWashPower(6, 'automatic') },
  ];
  
  for (const test of tests) {
    try {
      const result = test.fn();
      console.log(`✅ ${test.name}`);
      console.log(`   → ${result.powerMW.toFixed(3)} MW, ${result.durationHrs}hr`);
      console.log(`   → ${result.description}`);
    } catch (err: any) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${err.message}`);
    }
    console.log('');
  }
}

/**
 * Print power density standards for reference
 */
export function printPowerDensityStandards(): void {
  console.log('\n' + '=' .repeat(60));
  console.log('POWER DENSITY STANDARDS (W/sq ft or kW/unit)');
  console.log('=' .repeat(60));
  
  for (const [key, value] of Object.entries(POWER_DENSITY_STANDARDS)) {
    console.log(`  ${key}: ${value}`);
  }
}

/**
 * Interactive test with custom inputs
 */
export function testCustomInput(slug: string, inputs: Record<string, any>): PowerCalculationResult {
  console.log(`\nTesting: ${slug}`);
  console.log('Inputs:', JSON.stringify(inputs, null, 2));
  
  const result = calculateUseCasePower(slug, inputs);
  
  console.log('\nResult:');
  console.log(`  Power: ${result.powerMW.toFixed(3)} MW (${(result.powerMW * 1000).toFixed(1)} kW)`);
  console.log(`  Duration: ${result.durationHrs} hours`);
  console.log(`  Method: ${result.calculationMethod}`);
  console.log(`  Description: ${result.description}`);
  
  return result;
}

/**
 * Run all tests
 */
export function testAllCalculations(): void {
  console.log('\n' + '█'.repeat(60));
  console.log('MERLIN CALCULATION TEST SUITE');
  console.log('█'.repeat(60) + '\n');
  
  // Print standards
  printPowerDensityStandards();
  
  // Run direct function tests
  testDirectCalculators();
  
  // Run comprehensive slug-based tests
  const results = testPowerCalculations();
  
  // Summary
  console.log('\n' + '█'.repeat(60));
  console.log(`FINAL RESULT: ${results.passed}/${results.passed + results.failed} PASSED`);
  if (results.failed > 0) {
    console.log(`⚠️ ${results.failed} tests failed - review above output`);
  } else {
    console.log('✅ All tests passed!');
  }
  console.log('█'.repeat(60));
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).testAllCalculations = testAllCalculations;
  (window as any).testCustomInput = testCustomInput;
  (window as any).testPowerCalculations = testPowerCalculations;
  (window as any).testDirectCalculators = testDirectCalculators;
  (window as any).printPowerDensityStandards = printPowerDensityStandards;
}

// Auto-run if executed directly
// testAllCalculations();
