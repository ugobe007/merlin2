/**
 * COMPREHENSIVE CALCULATION AUDIT
 * 
 * Tests all industries to identify calculation errors:
 * - Data flow (Step 3 → TrueQuote Engine)
 * - Unit errors (kWh vs MW)
 * - Solar/EV inclusion
 * - Industry template math
 * 
 * Run: npx tsx scripts/comprehensive-calculation-audit.ts
 */

import { calculateTrueQuote } from '../src/services/TrueQuoteEngine';

// Note: This audit tests TrueQuote Engine calculations directly,
// no database connection needed

// Test cases for each industry
const TEST_CASES = [
  {
    name: 'Data Center - Tier 3',
    industry: 'data-center',
    subtype: 'tier_3',
    facilityData: {
      rackCount: 150000,
      powerUsageEffectiveness: 1.6,
    },
    expectedPeakMW: 1200, // 150k racks × 5kW × 1.6 PUE = 1,200 MW
    expectedBessMW: 600, // 50% of peak = 600 MW
    expectedBessMWh: 2400, // 600 MW × 4 hours = 2,400 MWh
    options: { solarEnabled: false, generatorEnabled: true }
  },
  {
    name: 'Hotel - 450 rooms, high-end',
    industry: 'hotel',
    subtype: 'upscale',
    facilityData: {
      roomCount: 450,
    },
    expectedPeakMW: 2.5, // ~5.5 kW per room for upscale = 2.475 MW
    expectedBessMW: 1.24, // 50% of peak
    expectedBessMWh: 4.96, // 1.24 MW × 4 hours
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Car Wash - 4 bays',
    industry: 'car-wash',
    subtype: 'express',
    facilityData: {
      bayCount: 4,
    },
    expectedPeakMW: 0.2, // 4 bays × 50 kW = 200 kW = 0.2 MW
    expectedBessMW: 0.08, // 40% of peak = 80 kW = 0.08 MW
    expectedBessMWh: 0.32, // 0.08 MW × 4 hours = 0.32 MWh
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Hospital - 200 beds',
    industry: 'hospital',
    subtype: 'regional',
    facilityData: {
      bedCount: 200,
    },
    expectedPeakMW: 2.0, // 200 beds × 10 kW = 2,000 kW = 2 MW
    expectedBessMW: 1.0, // 50% of peak
    expectedBessMWh: 4.0, // 1 MW × 4 hours
    options: { solarEnabled: true, generatorEnabled: true }
  },
  {
    name: 'Manufacturing - 100,000 sqft',
    industry: 'manufacturing',
    subtype: 'lightAssembly',
    facilityData: {
      squareFeet: 100000,
    },
    expectedPeakMW: 0.5, // 100k sqft × 5 W/sqft = 500 kW = 0.5 MW
    expectedBessMW: 0.2, // 40% of peak
    expectedBessMWh: 0.8, // 0.2 MW × 4 hours
    options: { solarEnabled: true, generatorEnabled: false }
  },
];

interface AuditResult {
  testCase: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  actual: {
    peakDemandKW: number;
    bessPowerKW: number;
    bessEnergyKWh: number;
    solarKWp?: number;
    generatorKW?: number;
  };
  expected: {
    peakDemandMW: number;
    bessMW: number;
    bessMWh: number;
  };
}

async function auditCalculation(testCase: typeof TEST_CASES[0]): Promise<AuditResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Build TrueQuote input
  const input = {
    location: {
      zipCode: '89101', // Las Vegas for testing
    },
    industry: {
      type: testCase.industry,
      subtype: testCase.subtype,
      facilityData: testCase.facilityData,
    },
    options: testCase.options,
  };

  try {
    const result = calculateTrueQuote(input);

    const peakDemandKW = result.results.peakDemandKW;
    const bessPowerKW = result.results.bess.powerKW;
    const bessEnergyKWh = result.results.bess.energyKWh;

    // Convert to MW/MWh for comparison
    const peakDemandMW = peakDemandKW / 1000;
    const bessMW = bessPowerKW / 1000;
    const bessMWh = bessEnergyKWh / 1000;

    // Check peak demand (allow 20% tolerance)
    const peakTolerance = testCase.expectedPeakMW * 0.2;
    if (Math.abs(peakDemandMW - testCase.expectedPeakMW) > peakTolerance) {
      errors.push(
        `Peak demand mismatch: expected ~${testCase.expectedPeakMW.toFixed(1)} MW, got ${peakDemandMW.toFixed(1)} MW`
      );
    }

    // Check BESS power (allow 20% tolerance)
    const bessPowerTolerance = testCase.expectedBessMW * 0.2;
    if (Math.abs(bessMW - testCase.expectedBessMW) > bessPowerTolerance) {
      errors.push(
        `BESS power mismatch: expected ~${testCase.expectedBessMW.toFixed(2)} MW, got ${bessMW.toFixed(2)} MW`
      );
    }

    // Check BESS energy (allow 20% tolerance)
    const bessEnergyTolerance = testCase.expectedBessMWh * 0.2;
    if (Math.abs(bessMWh - testCase.expectedBessMWh) > bessEnergyTolerance) {
      errors.push(
        `BESS energy mismatch: expected ~${testCase.expectedBessMWh.toFixed(2)} MWh, got ${bessMWh.toFixed(2)} MWh`
      );
    }

    // Check solar inclusion
    if (testCase.options.solarEnabled) {
      if (!result.results.solar || result.results.solar.capacityKWp === 0) {
        errors.push('Solar was enabled but not included in results');
      } else {
        warnings.push(`Solar included: ${result.results.solar.capacityKWp} kWp`);
      }
    }

    // Check generator inclusion (if required)
    if (testCase.options.generatorEnabled) {
      if (!result.results.generator || result.results.generator.capacityKW === 0) {
        errors.push('Generator was enabled but not included in results');
      } else {
        warnings.push(`Generator included: ${result.results.generator.capacityKW} kW`);
      }
    }

    // Check for zero values (critical error)
    if (peakDemandKW === 0) {
      errors.push('CRITICAL: Peak demand is 0 - data flow issue (inputs not reaching TrueQuote Engine)');
    }
    if (bessPowerKW === 0) {
      errors.push('CRITICAL: BESS power is 0 - calculation failure');
    }
    if (bessEnergyKWh === 0) {
      errors.push('CRITICAL: BESS energy is 0 - calculation failure');
    }

    return {
      testCase: testCase.name,
      passed: errors.length === 0,
      errors,
      warnings,
      actual: {
        peakDemandKW,
        bessPowerKW,
        bessEnergyKWh,
        solarKWp: result.results.solar?.capacityKWp,
        generatorKW: result.results.generator?.capacityKW,
      },
      expected: {
        peakDemandMW: testCase.expectedPeakMW,
        bessMW: testCase.expectedBessMW,
        bessMWh: testCase.expectedBessMWh,
      },
    };
  } catch (error) {
    return {
      testCase: testCase.name,
      passed: false,
      errors: [`Exception: ${error instanceof Error ? error.message : String(error)}`],
      warnings: [],
      actual: {
        peakDemandKW: 0,
        bessPowerKW: 0,
        bessEnergyKWh: 0,
      },
      expected: {
        peakDemandMW: testCase.expectedPeakMW,
        bessMW: testCase.expectedBessMW,
        bessMWh: testCase.expectedBessMWh,
      },
    };
  }
}

async function main() {
  console.log('🔍 COMPREHENSIVE CALCULATION AUDIT\n');
  console.log(`Testing ${TEST_CASES.length} industries...\n`);

  const results: AuditResult[] = [];

  for (const testCase of TEST_CASES) {
    console.log(`Testing: ${testCase.name}...`);
    const result = await auditCalculation(testCase);
    results.push(result);

    if (result.passed) {
      console.log(`  ✅ PASSED`);
    } else {
      console.log(`  ❌ FAILED (${result.errors.length} errors)`);
      result.errors.forEach(err => console.log(`    - ${err}`));
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach(warn => console.log(`    ⚠️  ${warn}`));
    }
    console.log();
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Errors: ${totalErrors}\n`);

  if (failed > 0) {
    console.log('FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`\n${r.testCase}:`);
      r.errors.forEach(err => console.log(`  ❌ ${err}`));
      console.log(`  Expected: Peak ${r.expected.peakDemandMW.toFixed(1)} MW, BESS ${r.expected.bessMW.toFixed(2)} MW / ${r.expected.bessMWh.toFixed(2)} MWh`);
      console.log(`  Actual: Peak ${(r.actual.peakDemandKW / 1000).toFixed(1)} MW, BESS ${(r.actual.bessPowerKW / 1000).toFixed(2)} MW / ${(r.actual.bessEnergyKWh / 1000).toFixed(2)} MWh`);
    });
  }

  // Critical issues
  const criticalIssues = results.filter(r =>
    r.errors.some(e => e.includes('CRITICAL') || e.includes('is 0'))
  );

  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    criticalIssues.forEach(r => {
      console.log(`\n${r.testCase}:`);
      r.errors.filter(e => e.includes('CRITICAL') || e.includes('is 0')).forEach(err => {
        console.log(`  🚨 ${err}`);
      });
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
