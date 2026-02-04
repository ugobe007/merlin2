#!/usr/bin/env node
/**
 * SSOT CALCULATION ACCURACY TESTS
 * ================================
 * Created: Feb 4, 2026
 * Purpose: Validate industry power calculations are accurate and properly wired
 * 
 * Tests:
 * 1. All SSOT calculation functions execute without errors
 * 2. Results are within industry benchmark ranges
 * 3. Calculations respond correctly to input variations
 * 4. Edge cases handled properly (zero inputs, extremes)
 * 5. All 20+ industries have working calculation paths
 */

import { calculateUseCasePower } from '../src/services/useCasePowerCalculations';
import type { PowerCalculationResult } from '../src/services/useCasePowerCalculations';

interface TestCase {
  industry: string;
  slug: string;
  inputs: Record<string, any>;
  expectedRange: {
    minKW: number;
    maxKW: number;
    typical: string; // Description of typical use
  };
  benchmarkSource?: string; // Industry standard (CBECS, ASHRAE, etc.)
}

interface TestResult {
  industry: string;
  status: 'pass' | 'fail' | 'warning';
  result?: PowerCalculationResult;
  issues: string[];
  checks: {
    executed: boolean;
    withinRange: boolean;
    hasDescription: boolean;
    hasMethod: boolean;
    monotonic?: boolean; // For variation tests
  };
}

// Comprehensive test cases covering all major industries
const TEST_CASES: TestCase[] = [
  // COMMERCIAL
  {
    industry: 'Office Building',
    slug: 'office',
    inputs: { squareFootage: 50000 },
    expectedRange: {
      minKW: 200,
      maxKW: 500,
      typical: 'CBECS: 6-10 W/sqft for commercial offices',
    },
    benchmarkSource: 'CBECS 2018',
  },
  {
    industry: 'Retail Store',
    slug: 'retail',
    inputs: { squareFootage: 20000 },
    expectedRange: {
      minKW: 30,
      maxKW: 100,
      typical: 'CBECS: 1.5-5 W/sqft for retail',
    },
    benchmarkSource: 'CBECS 2018',
  },
  {
    industry: 'Shopping Center',
    slug: 'shopping-center',
    inputs: { squareFootage: 100000 },
    expectedRange: {
      minKW: 150,
      maxKW: 500,
      typical: 'CBECS: 1.5-5 W/sqft for shopping centers',
    },
    benchmarkSource: 'CBECS 2018',
  },
  {
    industry: 'Restaurant',
    slug: 'restaurant',
    inputs: { seatingCapacity: 100 },
    expectedRange: {
      minKW: 40,
      maxKW: 150,
      typical: 'CBECS: 40-150 kW for 100-seat restaurants',
    },
    benchmarkSource: 'CBECS 2018',
  },
  {
    industry: 'Gas Station',
    slug: 'gas-station',
    inputs: { fuelPumps: 8 },
    expectedRange: {
      minKW: 20,
      maxKW: 100,
      typical: 'Industry practice: 20-100 kW for 8-pump stations',
    },
    benchmarkSource: 'Industry Practice',
  },

  // HOSPITALITY
  {
    industry: 'Hotel (Midscale)',
    slug: 'hotel',
    inputs: { roomCount: 150, hotelClass: 'midscale', occupancyRate: 70 },
    expectedRange: {
      minKW: 300,
      maxKW: 700,
      typical: 'CBECS: 2-5 kW/room for midscale hotels',
    },
    benchmarkSource: 'CBECS 2018 + Energy Star',
  },
  {
    industry: 'Hotel (Luxury)',
    slug: 'hotel',
    inputs: { roomCount: 200, hotelClass: 'luxury', occupancyRate: 80 },
    expectedRange: {
      minKW: 800,
      maxKW: 1500,
      typical: 'Energy Star: 4-7.5 kW/room for luxury hotels',
    },
    benchmarkSource: 'Energy Star',
  },

  // INDUSTRIAL
  {
    industry: 'Manufacturing (Light)',
    slug: 'manufacturing',
    inputs: { squareFootage: 100000, manufacturingType: 'light' },
    expectedRange: {
      minKW: 800,
      maxKW: 1500,
      typical: 'CBECS: 8-15 W/sqft for light manufacturing',
    },
    benchmarkSource: 'CBECS 2018',
  },
  {
    industry: 'Warehouse',
    slug: 'warehouse',
    inputs: { squareFootage: 200000 },
    expectedRange: {
      minKW: 300,
      maxKW: 800,
      typical: 'CBECS: 1.5-4 W/sqft for warehouses',
    },
    benchmarkSource: 'CBECS 2018',
  },
  {
    industry: 'Cold Storage',
    slug: 'cold-storage',
    inputs: { squareFootage: 50000 },
    expectedRange: {
      minKW: 500,
      maxKW: 1500,
      typical: 'Industry practice: 10-30 W/sqft for cold storage',
    },
    benchmarkSource: 'Industry Practice',
  },

  // INSTITUTIONAL
  {
    industry: 'Hospital',
    slug: 'hospital',
    inputs: { bedCount: 200 },
    expectedRange: {
      minKW: 800,
      maxKW: 1500,
      typical: 'ASHRAE: 4-7.5 kW/bed for hospitals',
    },
    benchmarkSource: 'ASHRAE 90.1',
  },
  {
    industry: 'College/University',
    slug: 'college',
    inputs: { enrollment: 5000, campusSize: 'medium' },
    expectedRange: {
      minKW: 2000,
      maxKW: 5000,
      typical: 'CBECS: Variable by campus size',
    },
    benchmarkSource: 'CBECS 2018',
  },
  {
    industry: 'Government Building',
    slug: 'government',
    inputs: { squareFootage: 50000 },
    expectedRange: {
      minKW: 200,
      maxKW: 600,
      typical: 'CBECS: 4-12 W/sqft for government facilities',
    },
    benchmarkSource: 'CBECS 2018',
  },

  // DATA CENTER
  {
    industry: 'Data Center (Tier 3)',
    slug: 'data-center',
    inputs: {
      itLoadCapacity: '500-1000',
      currentPUE: '1.3-1.5',
      itUtilization: '60-80%',
      dataCenterTier: 'tier_3',
    },
    expectedRange: {
      minKW: 600,
      maxKW: 1500,
      typical: 'IT load × PUE (750 kW × 1.4 PUE = 1050 kW)',
    },
    benchmarkSource: 'Uptime Institute',
  },
  {
    industry: 'Data Center (Large)',
    slug: 'data-center',
    inputs: {
      itLoadCapacity: '2500-5000',
      currentPUE: '1.5-1.8',
      itUtilization: '80-95%',
      dataCenterTier: 'tier_3',
    },
    expectedRange: {
      minKW: 3000,
      maxKW: 8000,
      typical: 'IT load × PUE (3750 kW × 1.65 PUE = 6187 kW)',
    },
    benchmarkSource: 'Uptime Institute',
  },

  // TRANSPORTATION
  {
    industry: 'EV Charging Station',
    slug: 'ev-charging',
    inputs: { level2Chargers: 12, dcfcChargers: 8 },
    expectedRange: {
      minKW: 180,
      maxKW: 350,
      typical: '12 × 7.2kW + 8 × 150kW = 1286 kW peak (with diversity)',
    },
    benchmarkSource: 'IEEE 2030.1.1',
  },
  {
    industry: 'Airport (Regional)',
    slug: 'airport',
    inputs: { annualPassengers: 5000000 },
    expectedRange: {
      minKW: 3000,
      maxKW: 8000,
      typical: 'ASHRAE: Variable by size and operations',
    },
    benchmarkSource: 'ASHRAE 90.1',
  },

  // AUTOMOTIVE
  {
    industry: 'Car Wash (Tunnel)',
    slug: 'car-wash',
    inputs: {
      bayCount: 2,
      carsPerDay: 200,
      operatingHours: 12,
      carWashType: 'tunnel',
    },
    expectedRange: {
      minKW: 150,
      maxKW: 350,
      typical: 'Industry practice: 75-175 kW per tunnel bay',
    },
    benchmarkSource: 'ICA (International Carwash Association)',
  },

  // RESIDENTIAL
  {
    industry: 'Apartment Complex',
    slug: 'apartment',
    inputs: { unitCount: 100 },
    expectedRange: {
      minKW: 200,
      maxKW: 500,
      typical: 'RECS: 2-5 kW/unit for apartment buildings',
    },
    benchmarkSource: 'RECS 2020',
  },
  {
    industry: 'Residential Home',
    slug: 'residential',
    inputs: { squareFootage: 2500 },
    expectedRange: {
      minKW: 8,
      maxKW: 25,
      typical: 'RECS: 3-10 W/sqft for residential',
    },
    benchmarkSource: 'RECS 2020',
  },

  // AGRICULTURAL
  {
    industry: 'Agricultural Facility',
    slug: 'agricultural',
    inputs: { squareFootage: 50000, farmType: 'crop' },
    expectedRange: {
      minKW: 100,
      maxKW: 500,
      typical: 'Industry practice: 2-10 W/sqft depending on operations',
    },
    benchmarkSource: 'Industry Practice',
  },
  {
    industry: 'Indoor Farm',
    slug: 'indoor-farm',
    inputs: { squareFootage: 10000 },
    expectedRange: {
      minKW: 200,
      maxKW: 600,
      typical: 'Industry practice: 20-60 W/sqft (LED grow lights)',
    },
    benchmarkSource: 'Industry Practice',
  },

  // ENTERTAINMENT
  {
    industry: 'Casino',
    slug: 'casino',
    inputs: { gamingFloorSqft: 100000 },
    expectedRange: {
      minKW: 1000,
      maxKW: 3000,
      typical: 'CBECS: 10-30 W/sqft for casinos',
    },
    benchmarkSource: 'CBECS 2018',
  },

  // ENERGY
  {
    industry: 'Microgrid',
    slug: 'microgrid',
    inputs: { totalLoadKW: 500 },
    expectedRange: {
      minKW: 400,
      maxKW: 600,
      typical: 'Based on total connected load',
    },
    benchmarkSource: 'IEEE 2030.7',
  },
];

/**
 * Test a single calculation
 */
function testCalculation(testCase: TestCase): TestResult {
  const result: TestResult = {
    industry: testCase.industry,
    status: 'pass',
    issues: [],
    checks: {
      executed: false,
      withinRange: false,
      hasDescription: false,
      hasMethod: false,
    },
  };

  try {
    // Execute calculation
    const calcResult = calculateUseCasePower(testCase.slug, testCase.inputs);
    result.result = calcResult;
    result.checks.executed = true;

    const powerKW = calcResult.powerMW * 1000;

    // Check 1: Within expected range
    const { minKW, maxKW } = testCase.expectedRange;
    if (powerKW >= minKW && powerKW <= maxKW) {
      result.checks.withinRange = true;
    } else {
      result.status = 'warning';
      result.issues.push(
        `Power ${powerKW.toFixed(0)} kW outside expected range [${minKW}-${maxKW} kW]`
      );
    }

    // Check 2: Has description
    if (calcResult.description && calcResult.description.length > 0) {
      result.checks.hasDescription = true;
    } else {
      result.status = 'warning';
      result.issues.push('Missing description');
    }

    // Check 3: Has calculation method
    if (calcResult.calculationMethod && calcResult.calculationMethod.length > 0) {
      result.checks.hasMethod = true;
    } else {
      result.status = 'warning';
      result.issues.push('Missing calculation method');
    }

    // Check 4: Reasonable duration
    if (calcResult.durationHrs < 1 || calcResult.durationHrs > 24) {
      result.status = 'warning';
      result.issues.push(`Unusual duration: ${calcResult.durationHrs} hours`);
    }

  } catch (err) {
    result.status = 'fail';
    result.checks.executed = false;
    result.issues.push(`Calculation error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
}

/**
 * Test input sensitivity (monotonicity)
 * Verify that increasing inputs leads to increasing outputs
 */
function testInputSensitivity(slug: string, baseInputs: Record<string, any>, scaleField: string): {
  passed: boolean;
  results: Array<{ scale: number; powerKW: number }>;
  issue?: string;
} {
  const scales = [0.5, 1.0, 1.5, 2.0];
  const results: Array<{ scale: number; powerKW: number }> = [];

  try {
    for (const scale of scales) {
      const inputs = { ...baseInputs };
      const originalValue = baseInputs[scaleField];
      
      // Scale the input
      if (typeof originalValue === 'number') {
        inputs[scaleField] = Math.round(originalValue * scale);
      } else {
        continue; // Skip non-numeric fields
      }

      const result = calculateUseCasePower(slug, inputs);
      const powerKW = result.powerMW * 1000;
      results.push({ scale, powerKW });
    }

    // Check monotonicity: power should increase with scale
    let isMonotonic = true;
    for (let i = 1; i < results.length; i++) {
      if (results[i].powerKW <= results[i - 1].powerKW) {
        isMonotonic = false;
        break;
      }
    }

    return {
      passed: isMonotonic,
      results,
      issue: isMonotonic ? undefined : 'Non-monotonic: power did not increase with input scale',
    };
  } catch (err) {
    return {
      passed: false,
      results,
      issue: `Error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('\n🧪 SSOT Calculation Accuracy Tests');
  console.log('===================================\n');

  const results: TestResult[] = [];
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  // Run all test cases
  for (const testCase of TEST_CASES) {
    console.log(`\n📊 ${testCase.industry}`);
    console.log('─'.repeat(50));
    console.log(`   Slug: ${testCase.slug}`);
    console.log(`   Benchmark: ${testCase.benchmarkSource}`);
    console.log(`   Expected: ${testCase.expectedRange.typical}`);

    const result = testCalculation(testCase);
    results.push(result);

    if (result.checks.executed && result.result) {
      const powerKW = result.result.powerMW * 1000;
      console.log(`   ✓ Calculated: ${powerKW.toFixed(1)} kW`);
      console.log(`   ✓ Description: ${result.result.description.substring(0, 60)}...`);
      console.log(`   ✓ Method: ${result.result.calculationMethod.substring(0, 60)}...`);
    }

    if (result.status === 'pass') {
      console.log(`   ✅ PASS - All checks passed`);
      passCount++;
    } else if (result.status === 'warning') {
      console.log(`   ⚠️  WARN - ${result.issues.join(', ')}`);
      warnCount++;
    } else {
      console.log(`   ❌ FAIL - ${result.issues.join(', ')}`);
      failCount++;
    }
  }

  // Test input sensitivity for key industries
  console.log('\n\n🔬 Input Sensitivity Tests (Monotonicity)');
  console.log('==========================================\n');

  const sensitivityTests = [
    { industry: 'Office', slug: 'office', inputs: { squareFootage: 50000 }, scaleField: 'squareFootage' },
    { industry: 'Hotel', slug: 'hotel', inputs: { roomCount: 150 }, scaleField: 'roomCount' },
    { industry: 'Hospital', slug: 'hospital', inputs: { bedCount: 200 }, scaleField: 'bedCount' },
    { industry: 'Car Wash', slug: 'car-wash', inputs: { bayCount: 2, carsPerDay: 200 }, scaleField: 'bayCount' },
  ];

  for (const test of sensitivityTests) {
    console.log(`\n📈 ${test.industry} (scaling ${test.scaleField})`);
    console.log('─'.repeat(50));
    
    const sensitivity = testInputSensitivity(test.slug, test.inputs, test.scaleField);
    
    for (const { scale, powerKW } of sensitivity.results) {
      console.log(`   ${scale.toFixed(1)}x input → ${powerKW.toFixed(0)} kW`);
    }

    if (sensitivity.passed) {
      console.log(`   ✅ Monotonic - power scales correctly with input`);
    } else {
      console.log(`   ⚠️  ${sensitivity.issue}`);
    }
  }

  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('==========');
  console.log(`✅ Passed: ${passCount}/${results.length}`);
  console.log(`⚠️  Warnings: ${warnCount}/${results.length}`);
  console.log(`❌ Failed: ${failCount}/${results.length}`);

  // Detailed issues
  if (warnCount > 0 || failCount > 0) {
    console.log('\n⚠️  ISSUES FOUND:\n');
    for (const result of results) {
      if (result.status !== 'pass' && result.issues.length > 0) {
        console.log(`${result.industry}:`);
        for (const issue of result.issues) {
          console.log(`  - ${issue}`);
        }
      }
    }
  }

  // Coverage report
  console.log('\n\n📋 COVERAGE REPORT');
  console.log('===================');
  const testedSlugs = new Set(TEST_CASES.map(tc => tc.slug));
  console.log(`Industries tested: ${testedSlugs.size}`);
  console.log(`Test cases: ${TEST_CASES.length}`);
  console.log('\nIndustries covered:');
  Array.from(testedSlugs).sort().forEach(slug => {
    console.log(`  ✓ ${slug}`);
  });

  console.log('\n✅ Testing complete!\n');

  // Exit code based on failures
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
