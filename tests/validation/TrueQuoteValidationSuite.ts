/**
 * TRUEQUOTE VALIDATION TEST SUITE
 * 
 * Tests wizard calculations against known-correct benchmarks.
 * Run these tests to verify your numbers are accurate.
 * 
 * Usage:
 *   npm test -- --grep "TrueQuote"
 *   OR copy individual test cases into your browser console
 * 
 * @version 1.0.0
 * @date January 2026
 */

// ═══════════════════════════════════════════════════════════════════════════════
// BENCHMARK DATA - These are the "correct" answers based on industry standards
// ═══════════════════════════════════════════════════════════════════════════════

export const BENCHMARKS = {
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DATA CENTER BENCHMARKS
  // ─────────────────────────────────────────────────────────────────────────────
  
  'data-center-tier-3-400-racks': {
    name: 'Tier III Data Center - 400 Racks',
    inputs: {
      industry: 'data-center',
      subtype: 'tier_3',
      zipCode: '89101',
      state: 'NV',
      facilityData: {
        rackCount: 400,
        powerPerRack: 5,  // kW
        pue: 1.6,
        tierClassification: 'tier_3',
        powerUsageEffectiveness: 1.6
      }
    },
    expected: {
      // Power calculation: 400 racks × 5 kW × 1.6 PUE = 3,200 kW
      peakDemandKW: { min: 3000, max: 3400, exact: 3200 },
      
      // BESS: 50% of peak for Tier III = 1,600 kW
      bessPowerKW: { min: 1400, max: 1800, exact: 1600 },
      
      // BESS Energy: 4-hour duration = 6,400 kWh
      bessEnergyKWh: { min: 5600, max: 7200, exact: 6400 },
      
      // Generator: REQUIRED for Tier III, 125% of critical load
      generatorRequired: true,
      generatorKW: { min: 3500, max: 4500, exact: 4000 },
      
      // Financial (rough ranges)
      totalInvestment: { min: 3000000, max: 5000000 },
      annualSavings: { min: 300000, max: 600000 },
      paybackYears: { min: 5, max: 12 }
    },
    sources: [
      'Uptime Institute Tier Standards',
      'ASHRAE TC 9.9 Guidelines',
      'NREL ATB 2024'
    ]
  },
  
  'data-center-tier-2-100-racks': {
    name: 'Tier II Data Center - 100 Racks',
    inputs: {
      industry: 'data-center',
      subtype: 'tier_2',
      zipCode: '94102',
      state: 'CA',
      facilityData: {
        rackCount: 100,
        powerPerRack: 5,
        pue: 1.8,
        tierClassification: 'tier_2',
        powerUsageEffectiveness: 1.8
      }
    },
    expected: {
      // Power: 100 × 5 × 1.8 = 900 kW
      peakDemandKW: { min: 800, max: 1000, exact: 900 },
      
      // BESS: 40% for Tier II = 360 kW
      bessPowerKW: { min: 300, max: 420, exact: 360 },
      
      // Energy: 4hr = 1,440 kWh
      bessEnergyKWh: { min: 1200, max: 1700, exact: 1440 },
      
      // Generator: Required for Tier II
      generatorRequired: true,
      generatorKW: { min: 1000, max: 1300, exact: 1125 }
    }
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // HOSPITAL BENCHMARKS
  // ─────────────────────────────────────────────────────────────────────────────
  
  'hospital-regional-300-beds': {
    name: 'Regional Hospital - 300 Beds',
    inputs: {
      industry: 'hospital',
      subtype: 'regional',
      zipCode: '75001',
      state: 'TX',
      facilityData: {
        bedCount: 300,
        hasICU: true,
        hasOR: true,
        hasMRI: true
      }
    },
    expected: {
      // Power: 300 beds × 10 kW/bed = 3,000 kW base
      // With ICU/OR/MRI: +20% = 3,600 kW
      peakDemandKW: { min: 3000, max: 4000, exact: 3600 },
      
      // BESS: 50% × 85% critical = 1,530 kW
      bessPowerKW: { min: 1300, max: 1800, exact: 1530 },
      
      // Generator: ALWAYS required for hospitals
      generatorRequired: true,
      generatorKW: { min: 3800, max: 4800, exact: 4500 }
    },
    sources: [
      'ASHRAE Handbook - Healthcare Facilities',
      'CMS Life Safety Code',
      'NFPA 110'
    ]
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // HOTEL BENCHMARKS
  // ─────────────────────────────────────────────────────────────────────────────
  
  'hotel-upscale-200-rooms': {
    name: 'Upscale Hotel - 200 Rooms',
    inputs: {
      industry: 'hotel',
      subtype: 'upscale',
      zipCode: '89109',
      state: 'NV',
      facilityData: {
        roomCount: 200,
        hasRestaurant: true,
        hasSpa: true,
        hasPool: true,
        hasConferenceCenter: true
      }
    },
    expected: {
      // Base: 200 rooms × 3 kW = 600 kW (SSOT: calculateHotelPower)
      // Amenities are included in SSOT calculation but result is ~600 kW
      peakDemandKW: { min: 500, max: 750, exact: 600 },
      
      // BESS: 50% of peak = 300 kW
      bessPowerKW: { min: 250, max: 400, exact: 300 },
      
      // Generator: Required for upscale (guest expectations)
      generatorRequired: true
    }
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // EV CHARGING HUB BENCHMARKS
  // ─────────────────────────────────────────────────────────────────────────────
  
  'ev-charging-medium-hub': {
    name: 'Medium EV Charging Hub - 20 Chargers',
    inputs: {
      industry: 'ev-charging',
      subtype: 'medium',
      zipCode: '90210',
      state: 'CA',
      facilityData: {
        level2Chargers: 8,      // 8 × 19.2 kW = 154 kW
        dcFastChargers: 10,     // 10 × 150 kW = 1,500 kW
        ultraFastChargers: 2    // 2 × 350 kW = 700 kW
      }
    },
    expected: {
      // Total: 154 + 1,500 + 700 = 2,354 kW
      peakDemandKW: { min: 2200, max: 2500, exact: 2354 },
      
      // BESS: 60% for peak shaving = 1,412 kW
      bessPowerKW: { min: 1200, max: 1600, exact: 1412 },
      
      // Generator: NOT required (not critical infrastructure)
      generatorRequired: false
    }
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CAR WASH BENCHMARKS
  // ─────────────────────────────────────────────────────────────────────────────
  
  'car-wash-express-4-bay': {
    name: 'Express Car Wash - 4 Bays',
    inputs: {
      industry: 'car-wash',
      subtype: 'express',
      zipCode: '85001',
      state: 'AZ',
      facilityData: {
        bayCount: 4,
        hasVacuums: true,
        hasDryer: true
      }
    },
    expected: {
      // Base: 4 bays × 50 kW = 200 kW (SSOT: calculateCarWashPower)
      // Vacuums/dryers included in SSOT but result is ~200 kW for express
      peakDemandKW: { min: 150, max: 250, exact: 200 },
      
      // BESS: 40% = 80 kW
      bessPowerKW: { min: 60, max: 120, exact: 80 },
      
      // Generator: Not required
      generatorRequired: false
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidationResult {
  benchmarkId: string;
  benchmarkName: string;
  passed: boolean;
  score: number;  // 0-100
  checks: CheckResult[];
  summary: string;
}

export interface CheckResult {
  field: string;
  expected: { min: number; max: number; exact?: number };
  actual: number | boolean | null;
  passed: boolean;
  deviation?: number;
  severity: 'pass' | 'warning' | 'critical' | 'missing';
  message: string;
}

/**
 * Validate wizard output against a benchmark
 */
export function validateAgainstBenchmark(
  benchmarkId: string,
  wizardOutput: {
    peakDemandKW?: number;
    bessPowerKW?: number;
    bessEnergyKWh?: number;
    generatorEnabled?: boolean;
    generatorKW?: number;
    totalInvestment?: number;
    annualSavings?: number;
    paybackYears?: number;
  }
): ValidationResult {
  const benchmark = BENCHMARKS[benchmarkId as keyof typeof BENCHMARKS];
  
  if (!benchmark) {
    return {
      benchmarkId,
      benchmarkName: 'Unknown',
      passed: false,
      score: 0,
      checks: [],
      summary: `Benchmark "${benchmarkId}" not found`
    };
  }
  
  const checks: CheckResult[] = [];
  
  // Check each expected field
  const expected = benchmark.expected;
  
  // Peak Demand
  if (expected.peakDemandKW) {
    checks.push(checkNumericField(
      'Peak Demand (kW)',
      wizardOutput.peakDemandKW,
      expected.peakDemandKW
    ));
  }
  
  // BESS Power
  if (expected.bessPowerKW) {
    checks.push(checkNumericField(
      'BESS Power (kW)',
      wizardOutput.bessPowerKW,
      expected.bessPowerKW
    ));
  }
  
  // BESS Energy
  if (expected.bessEnergyKWh) {
    checks.push(checkNumericField(
      'BESS Energy (kWh)',
      wizardOutput.bessEnergyKWh,
      expected.bessEnergyKWh
    ));
  }
  
  // Generator Required
  if (expected.generatorRequired !== undefined) {
    const genEnabled = wizardOutput.generatorEnabled === true;
    const shouldHaveGen = expected.generatorRequired;
    
    checks.push({
      field: 'Generator Required',
      expected: { min: shouldHaveGen ? 1 : 0, max: shouldHaveGen ? 1 : 0 },
      actual: genEnabled,
      passed: genEnabled === shouldHaveGen,
      severity: (!shouldHaveGen || genEnabled) ? 'pass' : 'critical',
      message: shouldHaveGen && !genEnabled 
        ? '🚨 CRITICAL: Generator REQUIRED but not selected'
        : genEnabled === shouldHaveGen 
          ? '✓ Generator selection correct'
          : '⚠️ Generator selected but not required'
    });
  }
  
  // Generator Size (if required and enabled)
  if (expected.generatorKW && wizardOutput.generatorEnabled) {
    checks.push(checkNumericField(
      'Generator (kW)',
      wizardOutput.generatorKW,
      expected.generatorKW
    ));
  }
  
  // Financial checks (wider tolerances)
  if (expected.totalInvestment) {
    checks.push(checkNumericField(
      'Total Investment ($)',
      wizardOutput.totalInvestment,
      expected.totalInvestment,
      50  // 50% tolerance for financial
    ));
  }
  
  if (expected.annualSavings) {
    checks.push(checkNumericField(
      'Annual Savings ($)',
      wizardOutput.annualSavings,
      expected.annualSavings,
      50
    ));
  }
  
  // Calculate score
  const passedChecks = checks.filter(c => c.passed).length;
  const criticalFails = checks.filter(c => c.severity === 'critical').length;
  const score = criticalFails > 0 ? 0 : Math.round((passedChecks / checks.length) * 100);
  
  // Overall pass/fail
  const passed = criticalFails === 0 && score >= 70;
  
  return {
    benchmarkId,
    benchmarkName: benchmark.name,
    passed,
    score,
    checks,
    summary: passed 
      ? `✅ PASSED (${score}% - ${passedChecks}/${checks.length} checks)`
      : `❌ FAILED (${score}% - ${criticalFails} critical issues)`
  };
}

function checkNumericField(
  fieldName: string,
  actual: number | undefined | null,
  expected: { min: number; max: number; exact?: number },
  tolerancePercent: number = 15
): CheckResult {
  if (actual === undefined || actual === null) {
    return {
      field: fieldName,
      expected,
      actual: null,
      passed: false,
      severity: 'missing',
      message: `❓ ${fieldName}: No value provided`
    };
  }
  
  // Check if within range
  const inRange = actual >= expected.min && actual <= expected.max;
  
  // Calculate deviation from exact (if provided)
  let deviation: number | undefined;
  if (expected.exact) {
    deviation = Math.abs((actual - expected.exact) / expected.exact) * 100;
  }
  
  // Determine severity
  let severity: 'pass' | 'warning' | 'critical';
  if (inRange) {
    severity = 'pass';
  } else if (deviation !== undefined && deviation > 50) {
    severity = 'critical';
  } else if (deviation !== undefined && deviation > tolerancePercent) {
    severity = 'warning';
  } else {
    severity = 'warning';
  }
  
  // Generate message
  let message: string;
  if (severity === 'pass') {
    message = `✓ ${fieldName}: ${actual.toLocaleString()} (expected ${expected.min.toLocaleString()}-${expected.max.toLocaleString()})`;
  } else if (severity === 'critical') {
    message = `🚨 ${fieldName}: ${actual.toLocaleString()} is ${deviation?.toFixed(0)}% off (expected ~${expected.exact?.toLocaleString()})`;
  } else {
    message = `⚠️ ${fieldName}: ${actual.toLocaleString()} outside range ${expected.min.toLocaleString()}-${expected.max.toLocaleString()}`;
  }
  
  return {
    field: fieldName,
    expected,
    actual,
    passed: inRange,
    deviation,
    severity,
    message
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run all benchmarks against a calculation function
 * 
 * Usage:
 *   const results = runAllBenchmarks(myCalculationFunction);
 *   console.log(formatResults(results));
 */
export function runAllBenchmarks(
  calculateFn: (inputs: any) => any
): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const [benchmarkId, benchmark] of Object.entries(BENCHMARKS)) {
    try {
      const output = calculateFn(benchmark.inputs);
      const result = validateAgainstBenchmark(benchmarkId, output);
      results.push(result);
    } catch (error) {
      results.push({
        benchmarkId,
        benchmarkName: benchmark.name,
        passed: false,
        score: 0,
        checks: [],
        summary: `💥 ERROR: ${error}`
      });
    }
  }
  
  return results;
}

/**
 * Format results as a readable report
 */
export function formatResults(results: ValidationResult[]): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════',
    '  TRUEQUOTE VALIDATION REPORT',
    '  Generated: ' + new Date().toISOString(),
    '═══════════════════════════════════════════════════════════════',
    ''
  ];
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const overallScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / total);
  
  lines.push(`OVERALL: ${passed}/${total} benchmarks passed (${overallScore}% avg score)`);
  lines.push('');
  
  for (const result of results) {
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(`${result.passed ? '✅' : '❌'} ${result.benchmarkName}`);
    lines.push(`   ${result.summary}`);
    lines.push('');
    
    for (const check of result.checks) {
      lines.push(`   ${check.message}`);
    }
    lines.push('');
  }
  
  lines.push('═══════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK VALIDATION (for browser console)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Quick validation you can paste into browser console
 * 
 * Usage:
 *   // After completing wizard to Step 6, open console and run:
 *   validateCurrentQuote({
 *     peakDemandKW: 3200,
 *     bessPowerKW: 100,  // from wizard
 *     bessEnergyKWh: 400,
 *     generatorEnabled: false,
 *     totalInvestment: 392000,
 *     annualSavings: 80000
 *   }, 'data-center-tier-3-400-racks');
 */
export function validateCurrentQuote(
  wizardValues: any,
  benchmarkId: string
): void {
  const result = validateAgainstBenchmark(benchmarkId, wizardValues);
  
  console.group(`%c TrueQuote Validation: ${result.benchmarkName}`, 
    result.passed ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold');
  
  console.log(`%c${result.summary}`, result.passed ? 'color: green' : 'color: red');
  console.log('');
  
  for (const check of result.checks) {
    const color = check.severity === 'pass' ? 'green' 
      : check.severity === 'critical' ? 'red' 
      : 'orange';
    console.log(`%c${check.message}`, `color: ${color}`);
  }
  
  console.groupEnd();
}

// Export for use in tests
export default {
  BENCHMARKS,
  validateAgainstBenchmark,
  runAllBenchmarks,
  formatResults,
  validateCurrentQuote
};
