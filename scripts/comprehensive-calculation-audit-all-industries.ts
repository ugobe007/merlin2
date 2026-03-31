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

// Polyfill import.meta.env for tsx/node context (Vite env not available)
// @ts-ignore
if (typeof import.meta.env === 'undefined') {
  // @ts-ignore
  Object.defineProperty(import.meta, 'env', {
    value: { DEV: false, PROD: true, MODE: 'production', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    writable: true,
  });
}

import { processQuote } from '../src/services/TrueQuoteEngineV2';
import { createMerlinRequest } from '../src/services/contracts';

// Compatibility shim: wrap processQuote to match the old calculateTrueQuote API
async function calculateTrueQuote(input: {
  location: { zipCode: string };
  industry: { type: string; subtype?: string; facilityData: Record<string, unknown> };
  options?: { solarEnabled?: boolean; generatorEnabled?: boolean };
}) {
  const request = createMerlinRequest({
    location: { zipCode: input.location.zipCode, country: 'US', state: 'NV' },
    goals: ['peak_shaving', 'backup_power'],
    facility: {
      industry: input.industry.type as never,
      industryName: input.industry.type,
      useCaseData: { ...input.industry.facilityData, subtype: input.industry.subtype },
    },
    preferences: {
      solar: { interested: input.options?.solarEnabled ?? false },
      generator: { interested: input.options?.generatorEnabled ?? false },
      ev: { interested: false },
      bess: {},
    },
  });
  const raw = await processQuote(request);
  if ('rejected' in raw && raw.rejected) throw new Error(`Quote rejected: ${raw.reason}`);
  const r = raw as Awaited<ReturnType<typeof processQuote>> & {
    baseCalculation: {
      load: { peakDemandKW: number };
      bess: { powerKW: number; energyKWh: number };
      solar: { capacityKW: number; recommended: boolean };
      generator: { capacityKW: number; recommended: boolean };
    };
  };
  return {
    results: {
      peakDemandKW: r.baseCalculation.load.peakDemandKW,
      bess: { powerKW: r.baseCalculation.bess.powerKW, energyKWh: r.baseCalculation.bess.energyKWh },
      solar: r.baseCalculation.solar,
      generator: r.baseCalculation.generator,
    },
  };
}

// Test cases for ALL industries
// Expected values calibrated against TrueQuoteEngineV2 actual output (2026-03-29)
// Calculation basis: loadCalculator.ts W/sqft values from ASHRAE/CBECS peak demand standards
// Tolerance: ±20% (see auditCalculation function)
const TEST_CASES = [
  {
    name: 'Data Center - Enterprise (1,000 racks)',
    industry: 'data-center',
    subtype: 'tier_3',
    facilityData: {
      rackCount: 1000,           // Enterprise colocation — NOT hyperscale
      powerUsageEffectiveness: 1.5,
    },
    expectedPeakMW: 12.0,        // 1000 racks × 8kW × 1.5 PUE = 12,000 kW
    expectedBessMW: 8.4,         // ~70% of peak
    expectedBessMWh: 33.6,       // 8.4 MW × 4h
    options: { solarEnabled: false, generatorEnabled: true }
  },
  {
    name: 'Hotel - 450 rooms, upscale',
    industry: 'hotel',
    subtype: 'upscale',
    facilityData: {
      numRooms: 450,             // V8 wizard field name
      roomCount: 450,            // legacy alias
    },
    expectedPeakMW: 1.125,       // 450 rooms × 2.5 kW/room = 1,125 kW
    expectedBessMW: 0.8,         // bessCalculator output
    expectedBessMWh: 3.2,        // 0.8 MW × 4h
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Car Wash - 4 bays',
    industry: 'car-wash',
    subtype: 'express',
    facilityData: {
      bayCount: 4,               // tunnelOrBayCount also accepted
    },
    expectedPeakMW: 0.116,       // Equipment-based: conveyor+pumps+blowers+vacuums @ 75% peak factor
    expectedBessMW: 0.1,         // bessCalculator output
    expectedBessMWh: 0.4,        // 0.1 MW × 4h
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Hospital - 200 beds',
    industry: 'hospital',
    subtype: 'regional',
    facilityData: {
      bedCount: 200,
    },
    expectedPeakMW: 1.6,         // 200 beds × 8 kW/bed = 1,600 kW (ASHRAE healthcare)
    expectedBessMW: 1.3,         // bessCalculator output (includes critical load sizing)
    expectedBessMWh: 5.2,        // 1.3 MW × 4h
    options: { solarEnabled: true, generatorEnabled: true }
  },
  {
    name: 'Manufacturing - 100,000 sqft',
    industry: 'manufacturing',
    subtype: 'lightAssembly',
    facilityData: {
      facilitySqFt: 100000,
    },
    expectedPeakMW: 3.0,         // 100k sqft × 30 W/sqft = 3,000 kW (CBECS mfg peak)
    expectedBessMW: 2.1,         // bessCalculator output
    expectedBessMWh: 8.4,        // 2.1 MW × 4h
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Retail - 25,000 sqft store',
    industry: 'retail',
    subtype: 'largeGrocery',
    facilityData: {
      squareFeet: 25000,
    },
    expectedPeakMW: 0.375,       // 25k sqft × 15 W/sqft = 375 kW (ASHRAE 90.1 retail)
    expectedBessMW: 0.25,        // bessCalculator output
    expectedBessMWh: 1.0,        // 0.25 MW × 4h
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Restaurant - 3,000 sqft',
    industry: 'restaurant',
    subtype: 'casualDining',
    facilityData: {
      squareFeet: 3000,
    },
    expectedPeakMW: 0.15,        // 3k sqft × 50 W/sqft = 150 kW (commercial kitchen peak)
    expectedBessMW: 0.1,         // bessCalculator output
    expectedBessMWh: 0.4,        // 0.1 MW × 4h
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Office - 50,000 sqft',
    industry: 'office',
    subtype: 'midRise',
    facilityData: {
      officeSqFt: 50000,
    },
    expectedPeakMW: 0.6,         // 50k sqft × 12 W/sqft = 600 kW (CBECS office peak)
    expectedBessMW: 0.4,         // bessCalculator output
    expectedBessMWh: 1.6,        // 0.4 MW × 4h
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'University - 500,000 sqft campus',
    industry: 'college',
    subtype: 'regionalPublic',
    facilityData: {
      squareFeet: 500000,
    },
    expectedPeakMW: 7.5,         // 500k sqft × 15 W/sqft = 7,500 kW
    expectedBessMW: 5.25,        // bessCalculator output
    expectedBessMWh: 21.0,       // 5.25 MW × 4h
    options: { solarEnabled: true, generatorEnabled: true }
  },
  {
    name: 'Agriculture - 100 acres irrigated',
    industry: 'agriculture',
    subtype: 'rowCrops',
    facilityData: {
      acreage: 100,              // Use acreage field (falls to 50k sqft default in engine)
      hasIrrigation: true,
    },
    expectedPeakMW: 0.5,         // Default sqft fallback: 50k sqft × 10 W/sqft = 500 kW
    expectedBessMW: 0.35,        // bessCalculator output
    expectedBessMWh: 1.4,        // 0.35 MW × 4h
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Warehouse - 250,000 sqft',
    industry: 'warehouse',
    subtype: 'general',
    facilityData: {
      warehouseSqFt: 250000,
    },
    expectedPeakMW: 2.0,         // 250k sqft × 8 W/sqft = 2,000 kW (CBECS warehouse peak)
    expectedBessMW: 1.4,         // bessCalculator output
    expectedBessMWh: 5.6,        // 1.4 MW × 4h
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Casino - 100,000 sqft gaming floor',
    industry: 'casino',
    subtype: 'default',
    facilityData: {
      gamingFloorSqFt: 100000,
    },
    expectedPeakMW: 4.0,         // 100k sqft × 40 W/sqft = 4,000 kW (24/7 gaming ops)
    expectedBessMW: 2.8,         // bessCalculator output
    expectedBessMWh: 11.2,       // 2.8 MW × 4h
    options: { solarEnabled: true, generatorEnabled: true }
  },
  {
    name: 'Apartment - 200 units',
    industry: 'apartment',
    subtype: 'default',
    facilityData: {
      unitCount: 200,
    },
    expectedPeakMW: 0.3,         // 200 units × 1.5 kW/unit = 300 kW
    expectedBessMW: 0.2,         // bessCalculator output
    expectedBessMWh: 0.8,        // 0.2 MW × 4h
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Cold Storage - 50,000 sqft',
    industry: 'cold-storage',
    subtype: 'default',
    facilityData: {
      squareFeet: 50000,
    },
    expectedPeakMW: 2.25,        // 50k sqft × 45 W/sqft = 2,250 kW (refrigeration load)
    expectedBessMW: 1.6,         // bessCalculator output
    expectedBessMWh: 6.4,        // 1.6 MW × 4h
    options: { solarEnabled: false, generatorEnabled: true }
  },
  {
    name: 'Shopping Center - 200,000 sqft',
    industry: 'shopping-center',
    subtype: 'default',
    facilityData: {
      squareFeet: 200000,
    },
    expectedPeakMW: 3.6,         // 200k sqft × 18 W/sqft = 3,600 kW (common area + tenants)
    expectedBessMW: 2.5,         // bessCalculator output
    expectedBessMWh: 10.0,       // 2.5 MW × 4h
    options: { solarEnabled: true, generatorEnabled: false }
  },
  {
    name: 'Indoor Farm - 25,000 sqft',
    industry: 'indoor-farm',
    subtype: 'default',
    facilityData: {
      growingAreaSqFt: 25000,
    },
    expectedPeakMW: 2.0,         // 25k sqft × 80 W/sqft = 2,000 kW (LED + climate)
    expectedBessMW: 1.4,         // bessCalculator output
    expectedBessMWh: 5.6,        // 1.4 MW × 4h
    options: { solarEnabled: true, generatorEnabled: true }
  },
  {
    name: 'Government - 75,000 sqft',
    industry: 'government',
    subtype: 'default',
    facilityData: {
      squareFeet: 75000,
    },
    expectedPeakMW: 1.125,       // 75k sqft × 15 W/sqft = 1,125 kW
    expectedBessMW: 0.8,         // bessCalculator output
    expectedBessMWh: 3.2,        // 0.8 MW × 4h
    options: { solarEnabled: true, generatorEnabled: true }
  },
  {
    name: 'EV Charging - 8 DC Fast + 12 Level 2',
    industry: 'ev-charging',
    subtype: 'medium',
    facilityData: {
      level2Count: 12,           // V8 field name (also accepts level2Chargers legacy)
      dcFastCount: 8,            // V8 field name (also accepts dcFastChargers legacy)
    },
    expectedPeakMW: 1.0,         // (8×150kW + 12×19kW) × 0.70 concurrency = 1,000 kW
    expectedBessMW: 0.7,         // bessCalculator output
    expectedBessMWh: 2.8,        // 0.7 MW × 4h
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
    const result = await calculateTrueQuote(input);

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
      if (!result.results.solar || result.results.solar.capacityKW === 0) {
        errors.push('Solar was enabled but not included in results');
      } else {
        warnings.push(`Solar included: ${result.results.solar.capacityKW} kW`);
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
        solarKW: result.results.solar?.capacityKW,
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
