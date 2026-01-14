/**
 * PORSCHE 911 ARCHITECTURE TEST SUITE
 * ====================================
 * Run: npx vite-node src/tests/porsche911ArchitectureTest.ts
 */

import { calculateLoad } from '../services/calculators/loadCalculator';
import { calculateBESS } from '../services/calculators/bessCalculator';
import { calculateFinancials } from '../services/calculators/financialCalculator';
import { TRUEQUOTE_CONSTANTS, DEFAULTS } from '../services/data/constants';

// Test utilities
interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => { expected: string; actual: string; passed: boolean }) {
  try {
    const { expected, actual, passed } = fn();
    results.push({ name, passed, expected, actual });
  } catch (error) {
    results.push({
      name,
      passed: false,
      expected: 'no error',
      actual: error instanceof Error ? error.message : String(error),
    });
  }
}

function assertInRange(actual: number, min: number, max: number): boolean {
  return actual >= min && actual <= max;
}

// ============================================================================
// TESTS
// ============================================================================

test('TRUEQUOTE_CONSTANTS loaded', () => ({
  expected: 'values > 0',
  actual: `BESS_COST=${TRUEQUOTE_CONSTANTS.BESS_COST_PER_KWH}, ITC=${TRUEQUOTE_CONSTANTS.FEDERAL_ITC_RATE}`,
  passed: TRUEQUOTE_CONSTANTS.BESS_COST_PER_KWH > 0 && TRUEQUOTE_CONSTANTS.FEDERAL_ITC_RATE > 0,
}));

test('DEFAULTS.BESS structure', () => ({
  expected: 'costPerKWh=175, efficiency=0.85',
  actual: `costPerKWh=${DEFAULTS.BESS.costPerKWh}, efficiency=${DEFAULTS.BESS.efficiency}`,
  passed: DEFAULTS.BESS.costPerKWh === 175 && DEFAULTS.BESS.efficiency === 0.85,
}));

test('calculateLoad - Hotel 200 rooms', () => {
  const result = calculateLoad({ industry: 'hotel', useCaseData: { roomCount: 200 } });
  return {
    expected: '400-600 kW',
    actual: `${result.peakDemandKW} kW`,
    passed: assertInRange(result.peakDemandKW, 400, 600),
  };
});

test('calculateLoad - Data Center', () => {
  const result = calculateLoad({ industry: 'data_center', useCaseData: { rackCount: 100, squareFootage: 10000 } });
  return {
    expected: '> 1000 kW',
    actual: `${result.peakDemandKW} kW`,
    passed: result.peakDemandKW > 1000,
  };
});

test('calculateLoad - Car Wash', () => {
  const result = calculateLoad({ industry: 'car_wash', useCaseData: { squareFootage: 5000 } });
  return {
    expected: '100-200 kW',
    actual: `${result.peakDemandKW} kW`,
    passed: assertInRange(result.peakDemandKW, 100, 200),
  };
});

test('calculateBESS - Hotel 500kW', () => {
  const result = calculateBESS({
    peakDemandKW: 500,
    annualConsumptionKWh: 2000000,
    industry: 'hotel',
    useCaseData: {},
    goals: ['backup_power', 'reduce_costs'],
  });
  return {
    expected: '250-400 kW, 1000-1600 kWh',
    actual: `${result.powerKW} kW, ${result.energyKWh} kWh`,
    passed: assertInRange(result.powerKW, 250, 400) && assertInRange(result.energyKWh, 1000, 1600),
  };
});

test('calculateBESS - Data Center critical load', () => {
  const result = calculateBESS({
    peakDemandKW: 2000,
    annualConsumptionKWh: 15000000,
    industry: 'data_center',
    useCaseData: {},
    goals: ['backup_power'],
  });
  return {
    expected: '>= 1500 kW',
    actual: `${result.powerKW} kW`,
    passed: result.powerKW >= 1500,
  };
});

test('calculateFinancials - ROI positive', () => {
  const result = calculateFinancials({
    // Costs (estimated)
    bessCost: 500 * 350 + 2000 * 350, // kW + kWh pricing
    solarCost: 300 * 1200, // $1.20/W
    generatorCost: 0,
    evCost: 0,
    // System specs
    bessKW: 500,
    bessKWh: 2000,
    solarKW: 300,
    solarAnnualKWh: 300 * 1750, // NV capacity factor
    generatorKW: 0,
    // Utility rates
    electricityRate: 0.12,
    demandCharge: 15,
    // Location
    state: 'NV',
  });
  return {
    expected: 'payback < 20yr, ROI > 0%',
    actual: `payback: ${result.simplePaybackYears.toFixed(1)}yr, ROI: ${result.tenYearROI.toFixed(0)}%`,
    passed: result.simplePaybackYears < 20 && result.tenYearROI > 0,
  };
});

// ============================================================================
// RUN
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════════');
console.log('       PORSCHE 911 ARCHITECTURE TEST SUITE');
console.log('═══════════════════════════════════════════════════════════════════\n');

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

results.forEach(r => {
  const icon = r.passed ? '✅' : '❌';
  console.log(`${icon} ${r.name}`);
  if (!r.passed) {
    console.log(`   Expected: ${r.expected}`);
    console.log(`   Actual: ${r.actual}`);
  }
});

console.log('\n─────────────────────────────────────────────────────────────────');
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
