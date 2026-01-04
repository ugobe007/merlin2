/**
 * COMPREHENSIVE CALCULATION AUDIT - ALL INDUSTRIES
 * 
 * Tests ALL 18 industries to identify calculation errors:
 * - Data flow (Step 3 → TrueQuote Engine)
 * - Unit errors (kWh vs MW)
 * - Solar/EV inclusion
 * - Industry template math
 * 
 * Run: npx tsx scripts/comprehensive-calculation-audit-all-industries.ts
 */

import { calculateTrueQuote } from '../src/services/TrueQuoteEngine';

// Test cases for ALL industries
const TEST_CASES = [
  // ✅ Already tested - keep existing
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
    name: 'Hotel - 450 rooms, upscale',
    industry: 'hotel',
    subtype: 'upscale',
    facilityData: {
      roomCount: 450,
    },
    expectedPeakMW: 1.35, // 450 rooms × 3 kW/room = 1,350 kW = 1.35 MW (using current config)
    expectedBessMW: 0.675, // 50% of peak
    expectedBessMWh: 2.7, // 0.675 MW × 4 hours
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
  // NEW: Additional industries
  {
    name: 'Retail - 25,000 sqft store',
    industry: 'retail',
    subtype: 'largeGrocery',
    facilityData: {
      squareFeet: 25000,
    },
    expectedPeakMW: 0.0375, // 25k sqft × 1.5 W/sqft = 37.5 kW = 0.0375 MW
    expectedBessMW: 0.016875, // 45% of peak
    expectedBessMWh: 0.0675, // 0.016875 MW × 4 hours
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Restaurant - 3,000 sqft',
    industry: 'restaurant',
    subtype: 'casualDining',
    facilityData: {
      squareFeet: 3000,
    },
    expectedPeakMW: 0.006, // 3k sqft × 2 W/sqft = 6 kW = 0.006 MW
    expectedBessMW: 0.0027, // 45% of peak
    expectedBessMWh: 0.0108, // 0.0027 MW × 4 hours
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Office - 50,000 sqft',
    industry: 'office',
    subtype: 'midRise',
    facilityData: {
      squareFeet: 50000,
    },
    expectedPeakMW: 0.03, // 50k sqft × 0.6 W/sqft = 30 kW = 0.03 MW
    expectedBessMW: 0.012, // 40% of peak
    expectedBessMWh: 0.048, // 0.012 MW × 4 hours
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'University - 500,000 sqft campus',
    industry: 'university',
    subtype: 'regionalPublic',
    facilityData: {
      squareFeet: 500000,
    },
    expectedPeakMW: 0.4, // 500k sqft × 0.8 W/sqft = 400 kW = 0.4 MW
    expectedBessMW: 0.18, // 45% of peak
    expectedBessMWh: 0.72, // 0.18 MW × 4 hours
    options: { solarEnabled: true, generatorEnabled: true }
  },
  {
    name: 'Agriculture - 100 acres irrigated',
    industry: 'agriculture',
    subtype: 'rowCrops',
    facilityData: {
      squareFeet: 4356000, // 100 acres × 43,560 sqft/acre
      hasIrrigation: true,
    },
    expectedPeakMW: 1.744, // (4.356M sqft × 0.05 W/sqft) × 8.0 irrigation = 1,744 kW = 1.744 MW
    expectedBessMW: 0.6976, // 40% of peak
    expectedBessMWh: 2.7904, // 0.6976 MW × 4 hours
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Warehouse - 250,000 sqft',
    industry: 'warehouse',
    subtype: 'general',
    facilityData: {
      squareFeet: 250000,
    },
    expectedPeakMW: 0.05, // 250k sqft × 0.2 W/sqft = 50 kW = 0.05 MW
    expectedBessMW: 0.0175, // 35% of peak
    expectedBessMWh: 0.07, // 0.0175 MW × 4 hours
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Casino - 100,000 sqft gaming floor',
    industry: 'casino',
    subtype: 'default',
    facilityData: {
      squareFeet: 100000,
    },
    expectedPeakMW: 1.8, // 100k sqft × 18 W/sqft = 1,800 kW = 1.8 MW
    expectedBessMW: 0.9, // 50% of peak
    expectedBessMWh: 3.6, // 0.9 MW × 4 hours
    options: { solarEnabled: true, generatorEnabled: true }
  },
  {
    name: 'Apartment - 200 units',
    industry: 'apartment',
    subtype: 'default',
    facilityData: {
      unitCount: 200,
    },
    expectedPeakMW: 0.36, // 200 units × 1.8 kW/unit = 360 kW = 0.36 MW
    expectedBessMW: 0.126, // 35% of peak
    expectedBessMWh: 0.504, // 0.126 MW × 4 hours
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Cold Storage - 50,000 sqft',
    industry: 'cold-storage',
    subtype: 'default',
    facilityData: {
      squareFeet: 50000,
    },
    expectedPeakMW: 0.4, // 50k sqft × 8 W/sqft = 400 kW = 0.4 MW
    expectedBessMW: 0.24, // 60% of peak
    expectedBessMWh: 1.92, // 0.24 MW × 8 hours (longer duration)
    options: { solarEnabled: false, generatorEnabled: true }
  },
  {
    name: 'Shopping Center - 200,000 sqft',
    industry: 'shopping-center',
    subtype: 'default',
    facilityData: {
      squareFeet: 200000,
    },
    expectedPeakMW: 2.0, // 200k sqft × 10 W/sqft = 2,000 kW = 2 MW
    expectedBessMW: 0.9, // 45% of peak
    expectedBessMWh: 3.6, // 0.9 MW × 4 hours
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Indoor Farm - 25,000 sqft',
    industry: 'indoor-farm',
    subtype: 'default',
    facilityData: {
      squareFeet: 25000,
    },
    expectedPeakMW: 1.625, // 25k sqft × 65 W/sqft = 1,625 kW = 1.625 MW
    expectedBessMW: 0.89375, // 55% of peak
    expectedBessMWh: 5.3625, // 0.89375 MW × 6 hours (longer duration)
    options: { solarEnabled: true, generatorEnabled: true }
  },
  {
    name: 'Government - 75,000 sqft',
    industry: 'government',
    subtype: 'default',
    facilityData: {
      squareFeet: 75000,
    },
    expectedPeakMW: 0.45, // 75k sqft × 6 W/sqft = 450 kW = 0.45 MW
    expectedBessMW: 0.27, // 60% of peak
    expectedBessMWh: 2.16, // 0.27 MW × 8 hours (longer duration)
    options: { solarEnabled: true, generatorEnabled: true }
  },
  {
    name: 'EV Charging - 8 DC Fast + 12 Level 2',
    industry: 'ev-charging',
    subtype: 'medium',
    facilityData: {
      level2Chargers: 12,
      dcFastChargers: 8,
      ultraFastChargers: 0,
    },
    expectedPeakMW: 1.4304, // (12 × 19.2kW) + (8 × 150kW) = 1,430.4 kW = 1.4304 MW
    expectedBessMW: 0.85824, // 60% of peak
    expectedBessMWh: 1.71648, // 0.85824 MW × 2 hours (shorter duration)
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
        `Peak demand mismatch: expected ~${testCase.expectedPeakMW.toFixed(3)} MW, got ${peakDemandMW.toFixed(3)} MW`
      );
    }

    // Check BESS power (allow 20% tolerance)
    const bessPowerTolerance = testCase.expectedBessMW * 0.2;
    if (Math.abs(bessMW - testCase.expectedBessMW) > bessPowerTolerance) {
      errors.push(
        `BESS power mismatch: expected ~${testCase.expectedBessMW.toFixed(4)} MW, got ${bessMW.toFixed(4)} MW`
      );
    }

    // Check BESS energy (allow 20% tolerance)
    const bessEnergyTolerance = testCase.expectedBessMWh * 0.2;
    if (Math.abs(bessMWh - testCase.expectedBessMWh) > bessEnergyTolerance) {
      errors.push(
        `BESS energy mismatch: expected ~${testCase.expectedBessMWh.toFixed(4)} MWh, got ${bessMWh.toFixed(4)} MWh`
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
  console.log('🔍 COMPREHENSIVE CALCULATION AUDIT - ALL INDUSTRIES\n');
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
  console.log(`Passed: ${passed} (${((passed / results.length) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${((failed / results.length) * 100).toFixed(1)}%)`);
  console.log(`Total Errors: ${totalErrors}\n`);

  if (failed > 0) {
    console.log('FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`\n${r.testCase}:`);
      r.errors.forEach(err => console.log(`  ❌ ${err}`));
      console.log(`  Expected: Peak ${r.expected.peakDemandMW.toFixed(3)} MW, BESS ${r.expected.bessMW.toFixed(4)} MW / ${r.expected.bessMWh.toFixed(4)} MWh`);
      console.log(`  Actual: Peak ${(r.actual.peakDemandKW / 1000).toFixed(3)} MW, BESS ${(r.actual.bessPowerKW / 1000).toFixed(4)} MW / ${(r.actual.bessEnergyKWh / 1000).toFixed(4)} MWh`);
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

  // Industry breakdown
  console.log('\n📊 BY INDUSTRY:');
  const byIndustry = new Map<string, { passed: number; failed: number }>();
  results.forEach(r => {
    const industry = r.testCase.split(' - ')[0];
    const current = byIndustry.get(industry) || { passed: 0, failed: 0 };
    if (r.passed) current.passed++;
    else current.failed++;
    byIndustry.set(industry, current);
  });
  
  byIndustry.forEach((stats, industry) => {
    const total = stats.passed + stats.failed;
    const passRate = ((stats.passed / total) * 100).toFixed(0);
    const status = stats.failed === 0 ? '✅' : '❌';
    console.log(`  ${status} ${industry}: ${stats.passed}/${total} passed (${passRate}%)`);
  });

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
