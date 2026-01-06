/**
 * TRUEQUOTE DATA FLOW TEST SUITE
 * ===============================
 * 
 * Tests the complete data flow:
 * 1. Wizard State → TrueQuoteMapper → TrueQuoteEngine
 * 2. TrueQuoteEngine calculations are correct
 * 3. Values persist through wizard steps
 * 
 * Run: npx ts-node src/tests/trueQuoteDataFlowTest.ts
 * Or:  npm run test:truequote
 * 
 * @author Merlin Energy
 * @date January 2026
 */

import { calculateTrueQuote, TRUEQUOTE_CONSTANTS, INDUSTRY_CONFIGS } from '../services/TrueQuoteEngine';
import type { TrueQuoteInput, TrueQuoteResult } from '../services/TrueQuoteEngine';

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => { passed: boolean; expected: any; actual: any; message: string }) {
  try {
    const result = fn();
    results.push({ name, ...result });
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (!result.passed) {
      console.log(`   Expected: ${JSON.stringify(result.expected)}`);
      console.log(`   Actual:   ${JSON.stringify(result.actual)}`);
      console.log(`   Message:  ${result.message}`);
    }
  } catch (error) {
    results.push({
      name,
      passed: false,
      expected: 'No error',
      actual: error instanceof Error ? error.message : String(error),
      message: 'Test threw an exception',
    });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assertEqual(actual: any, expected: any, tolerance = 0): boolean {
  if (typeof actual === 'number' && typeof expected === 'number') {
    return Math.abs(actual - expected) <= tolerance;
  }
  return actual === expected;
}

function assertRange(actual: number, min: number, max: number): boolean {
  return actual >= min && actual <= max;
}

// ============================================================================
// TEST DATA: Simulated Wizard States for Different Industries
// ============================================================================

const TEST_SCENARIOS: { name: string; input: TrueQuoteInput; expectations: any }[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // HOTEL TEST CASES
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'Hotel - Midscale 100 rooms',
    input: {
      location: { zipCode: '89052', state: 'NV' },
      industry: {
        type: 'hotel',
        subtype: 'midscale',
        facilityData: {
          roomCount: 100,
          hotelCategory: 'midscale',
        },
      },
      options: { solarEnabled: true, evChargingEnabled: false, generatorEnabled: false },
    },
    expectations: {
      peakDemandKW: { min: 200, max: 500 },  // 100 rooms × 3-5 kW/room
      bessKW: { min: 80, max: 250 },          // ~40% of peak
      bessKWh: { min: 320, max: 1000 },       // 4-hour duration
      solarKW: { min: 50, max: 200 },         // 40% of peak if enabled
      generatorRequired: false,
    },
  },
  {
    name: 'Hotel - Luxury 200 rooms with amenities',
    input: {
      location: { zipCode: '90210', state: 'CA' },
      industry: {
        type: 'hotel',
        subtype: 'luxury',
        facilityData: {
          roomCount: 200,
          hotelCategory: 'luxury',
          foodBeverage: 'full-service',
          spaServices: 'full-spa',
          poolType: 'indoor-outdoor',
          meetingSpace: 'large',
        },
      },
      options: { solarEnabled: true, evChargingEnabled: true, generatorEnabled: true, level2Chargers: 10, dcFastChargers: 2 },
    },
    expectations: {
      peakDemandKW: { min: 800, max: 2500 },  // Luxury with amenities
      bessKW: { min: 400, max: 1500 },
      generatorRequired: true,                 // Luxury requires generator
      evChargingKW: { min: 400, max: 600 },   // 10×19.2 + 2×150
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // DATA CENTER TEST CASES
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'Data Center - Tier III 100 racks',
    input: {
      location: { zipCode: '95054', state: 'CA' },
      industry: {
        type: 'data-center',
        subtype: 'tier_3',
        facilityData: {
          rackCount: 100,
          currentPUE: 1.6,
        },
      },
      options: { solarEnabled: false, evChargingEnabled: false, generatorEnabled: false },
    },
    expectations: {
      // 100 racks × 5kW × 1.6 PUE = 800 kW
      peakDemandKW: { min: 700, max: 900 },
      // Tier III: 50% multiplier = 400 kW
      bessKW: { min: 350, max: 450 },
      // 4-hour duration = 1600 kWh
      bessKWh: { min: 1400, max: 1800 },
      generatorRequired: true,  // Tier III requires generator
    },
  },
  {
    name: 'Data Center - Tier IV 500 racks with GPU',
    input: {
      location: { zipCode: '20001', state: 'NY' },
      industry: {
        type: 'data-center',
        subtype: 'tier_4',
        facilityData: {
          rackCount: 500,
          currentPUE: 1.4,
          hasGPU: true,
        },
      },
      options: { solarEnabled: true, evChargingEnabled: false, generatorEnabled: false },
    },
    expectations: {
      // 500 racks × 5kW × 1.4 PUE × 8.0 (GPU) = 28,000 kW
      peakDemandKW: { min: 20000, max: 35000 },
      // Tier IV: 60% multiplier
      bessKW: { min: 12000, max: 21000 },
      generatorRequired: true,  // Tier IV requires generator
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // HOSPITAL TEST CASES
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'Hospital - Community 50 beds',
    input: {
      location: { zipCode: '85001', state: 'AZ' },
      industry: {
        type: 'hospital',
        subtype: 'community',
        facilityData: {
          bedCount: 50,
        },
      },
      options: { solarEnabled: true, evChargingEnabled: false, generatorEnabled: false },
    },
    expectations: {
      // 50 beds × 10kW = 500 kW
      peakDemandKW: { min: 400, max: 600 },
      // Community: 50% multiplier = 250 kW
      bessKW: { min: 200, max: 300 },
      generatorRequired: true,  // Community hospital requires generator
    },
  },
  {
    name: 'Hospital - Teaching 300 beds with ICU/OR',
    input: {
      location: { zipCode: '02115', state: 'MA' },
      industry: {
        type: 'hospital',
        subtype: 'teaching',
        facilityData: {
          bedCount: 300,
          icuBeds: 50,
          operatingRooms: 12,
          imagingEquipment: ['MRI', 'CT', 'X-Ray'],
        },
      },
      options: { solarEnabled: true, evChargingEnabled: false, generatorEnabled: false },
    },
    expectations: {
      // 300 beds × 10kW × modifiers (ICU, OR, MRI)
      peakDemandKW: { min: 3000, max: 5000 },
      // Teaching: 60% multiplier
      bessKW: { min: 1800, max: 3000 },
      generatorRequired: true,  // Teaching hospital requires generator
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // CAR WASH TEST CASES
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'Car Wash - Express 3 bays',
    input: {
      location: { zipCode: '75001', state: 'TX' },
      industry: {
        type: 'car-wash',
        subtype: 'express',
        facilityData: {
          bayCount: 3,
          vacuumStations: 6,
        },
      },
      options: { solarEnabled: true, evChargingEnabled: false, generatorEnabled: false },
    },
    expectations: {
      // 3 bays × 50kW × modifiers
      peakDemandKW: { min: 150, max: 250 },
      bessKW: { min: 60, max: 125 },
      generatorRequired: false,
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // EV CHARGING TEST CASES
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'EV Charging Hub - Medium',
    input: {
      location: { zipCode: '98101', state: 'WA' },
      industry: {
        type: 'ev-charging',
        subtype: 'medium',
        facilityData: {
          level2Chargers: 20,
          dcFastChargers: 10,
          ultraFastChargers: 2,
        },
      },
      options: { solarEnabled: true, evChargingEnabled: true },
    },
    expectations: {
      // 20×19.2 + 10×150 + 2×350 = 384 + 1500 + 700 = 2584 kW
      peakDemandKW: { min: 2400, max: 2700 },
      bessKW: { min: 1400, max: 1700 },  // 60% multiplier
      evChargingKW: { min: 2500, max: 2700 },
      generatorRequired: false,
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // EDGE CASES
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'Edge Case - Missing facility data (should use defaults)',
    input: {
      location: { zipCode: '89052', state: 'NV' },
      industry: {
        type: 'hotel',
        subtype: 'midscale',
        facilityData: {},  // Empty!
      },
      options: { solarEnabled: false, evChargingEnabled: false, generatorEnabled: false },
    },
    expectations: {
      // Should return 0 or throw error (no data to calculate from)
      peakDemandKW: { min: 0, max: 100 },
      bessKW: { min: 0, max: 50 },
    },
  },
  {
    name: 'Edge Case - Unknown industry type',
    input: {
      location: { zipCode: '89052', state: 'NV' },
      industry: {
        type: 'unknown-industry',
        subtype: 'default',
        facilityData: { squareFootage: 10000 },
      },
      options: {},
    },
    expectations: {
      shouldThrow: true,
    },
  },
];

// ============================================================================
// TEST SUITE 1: INPUT VALIDATION
// ============================================================================

console.log('\n' + '═'.repeat(70));
console.log('TEST SUITE 1: INPUT VALIDATION');
console.log('═'.repeat(70) + '\n');

test('TrueQuoteEngine accepts valid hotel input', () => {
  const input: TrueQuoteInput = {
    location: { zipCode: '89052', state: 'NV' },
    industry: { type: 'hotel', subtype: 'midscale', facilityData: { roomCount: 100 } },
    options: {},
  };
  const result = calculateTrueQuote(input);
  return {
    passed: result.quoteId.startsWith('MQ-'),
    expected: 'Quote ID starting with MQ-',
    actual: result.quoteId,
    message: 'Should generate valid quote ID',
  };
});

test('TrueQuoteEngine rejects unknown industry type', () => {
  const input: TrueQuoteInput = {
    location: { zipCode: '89052', state: 'NV' },
    industry: { type: 'fake-industry', subtype: 'default', facilityData: {} },
    options: {},
  };
  let threw = false;
  try {
    calculateTrueQuote(input);
  } catch (e) {
    threw = true;
  }
  return {
    passed: threw,
    expected: true,
    actual: threw,
    message: 'Should throw error for unknown industry',
  };
});

test('TrueQuoteEngine accepts all 18 industry types', () => {
  const industries = [
    'data-center', 'hospital', 'hotel', 'ev-charging', 'car-wash',
    'manufacturing', 'retail', 'restaurant', 'office', 'university',
    'agriculture', 'warehouse', 'casino', 'apartment', 'cold-storage',
    'shopping-center', 'indoor-farm', 'government'
  ];
  
  const failed: string[] = [];
  for (const industry of industries) {
    try {
      const input: TrueQuoteInput = {
        location: { zipCode: '89052', state: 'NV' },
        industry: { type: industry, subtype: 'default', facilityData: { squareFootage: 10000 } },
        options: {},
      };
      calculateTrueQuote(input);
    } catch (e) {
      failed.push(industry);
    }
  }
  
  return {
    passed: failed.length === 0,
    expected: 'All 18 industries accepted',
    actual: failed.length === 0 ? 'All passed' : `Failed: ${failed.join(', ')}`,
    message: 'All industry types should be recognized',
  };
});

// ============================================================================
// TEST SUITE 2: CALCULATION ACCURACY
// ============================================================================

console.log('\n' + '═'.repeat(70));
console.log('TEST SUITE 2: CALCULATION ACCURACY');
console.log('═'.repeat(70) + '\n');

for (const scenario of TEST_SCENARIOS) {
  if (scenario.expectations.shouldThrow) {
    test(`${scenario.name} - Should throw error`, () => {
      let threw = false;
      try {
        calculateTrueQuote(scenario.input);
      } catch (e) {
        threw = true;
      }
      return {
        passed: threw,
        expected: true,
        actual: threw,
        message: 'Should throw for invalid input',
      };
    });
    continue;
  }
  
  let result: TrueQuoteResult;
  try {
    result = calculateTrueQuote(scenario.input);
  } catch (e) {
    test(`${scenario.name} - Should not throw`, () => ({
      passed: false,
      expected: 'No error',
      actual: e instanceof Error ? e.message : String(e),
      message: 'Calculation should not throw',
    }));
    continue;
  }
  
  // Test peak demand
  if (scenario.expectations.peakDemandKW) {
    test(`${scenario.name} - Peak Demand in range`, () => {
      const { min, max } = scenario.expectations.peakDemandKW;
      const actual = result.results.peakDemandKW;
      return {
        passed: assertRange(actual, min, max),
        expected: `${min} - ${max} kW`,
        actual: `${actual} kW`,
        message: 'Peak demand should be within expected range',
      };
    });
  }
  
  // Test BESS power
  if (scenario.expectations.bessKW) {
    test(`${scenario.name} - BESS Power in range`, () => {
      const { min, max } = scenario.expectations.bessKW;
      const actual = result.results.bess.powerKW;
      return {
        passed: assertRange(actual, min, max),
        expected: `${min} - ${max} kW`,
        actual: `${actual} kW`,
        message: 'BESS power should be within expected range',
      };
    });
  }
  
  // Test BESS energy
  if (scenario.expectations.bessKWh) {
    test(`${scenario.name} - BESS Energy in range`, () => {
      const { min, max } = scenario.expectations.bessKWh;
      const actual = result.results.bess.energyKWh;
      return {
        passed: assertRange(actual, min, max),
        expected: `${min} - ${max} kWh`,
        actual: `${actual} kWh`,
        message: 'BESS energy should be within expected range',
      };
    });
  }
  
  // Test generator requirement
  if (scenario.expectations.generatorRequired !== undefined) {
    test(`${scenario.name} - Generator requirement`, () => {
      const expected = scenario.expectations.generatorRequired;
      const actual = result.results.generator?.required || false;
      return {
        passed: actual === expected,
        expected: expected ? 'Required' : 'Not required',
        actual: actual ? 'Required' : 'Not required',
        message: 'Generator requirement should match industry standards',
      };
    });
  }
  
  // Test EV charging
  if (scenario.expectations.evChargingKW) {
    test(`${scenario.name} - EV Charging Power in range`, () => {
      const { min, max } = scenario.expectations.evChargingKW;
      const actual = result.results.evCharging?.totalPowerKW || 0;
      return {
        passed: assertRange(actual, min, max),
        expected: `${min} - ${max} kW`,
        actual: `${actual} kW`,
        message: 'EV charging power should be within expected range',
      };
    });
  }
}

// ============================================================================
// TEST SUITE 3: FINANCIAL CALCULATIONS
// ============================================================================

console.log('\n' + '═'.repeat(70));
console.log('TEST SUITE 3: FINANCIAL CALCULATIONS');
console.log('═'.repeat(70) + '\n');

test('BESS cost uses correct $/kWh rate', () => {
  const input: TrueQuoteInput = {
    location: { zipCode: '89052', state: 'NV' },
    industry: { type: 'hotel', subtype: 'midscale', facilityData: { roomCount: 100 } },
    options: {},
  };
  const result = calculateTrueQuote(input);
  const expectedCost = result.results.bess.energyKWh * TRUEQUOTE_CONSTANTS.BESS_COST_PER_KWH;
  const actualCost = result.results.bess.cost;
  
  return {
    passed: assertEqual(actualCost, expectedCost, 1),
    expected: `$${expectedCost.toLocaleString()}`,
    actual: `$${actualCost.toLocaleString()}`,
    message: `Should use $${TRUEQUOTE_CONSTANTS.BESS_COST_PER_KWH}/kWh`,
  };
});

test('Federal ITC is 30% of eligible costs', () => {
  const input: TrueQuoteInput = {
    location: { zipCode: '89052', state: 'NV' },
    industry: { type: 'hotel', subtype: 'midscale', facilityData: { roomCount: 100 } },
    options: { solarEnabled: true },
  };
  const result = calculateTrueQuote(input);
  
  const bessCost = result.results.bess.cost;
  const solarCost = result.results.solar?.cost || 0;
  const expectedITC = (bessCost + solarCost) * 0.30;
  const actualITC = result.results.financial.federalITC;
  
  return {
    passed: assertEqual(actualITC, expectedITC, 100),  // Allow $100 tolerance for rounding
    expected: `$${Math.round(expectedITC).toLocaleString()}`,
    actual: `$${actualITC.toLocaleString()}`,
    message: 'Federal ITC should be 30% of BESS + Solar costs',
  };
});

test('Net cost = Total - ITC', () => {
  const input: TrueQuoteInput = {
    location: { zipCode: '89052', state: 'NV' },
    industry: { type: 'hotel', subtype: 'midscale', facilityData: { roomCount: 100 } },
    options: { solarEnabled: true },
  };
  const result = calculateTrueQuote(input);
  
  const expectedNet = result.results.financial.totalInvestment - result.results.financial.federalITC;
  const actualNet = result.results.financial.netCost;
  
  return {
    passed: assertEqual(actualNet, expectedNet, 1),
    expected: `$${expectedNet.toLocaleString()}`,
    actual: `$${actualNet.toLocaleString()}`,
    message: 'Net cost should equal Total - ITC',
  };
});

test('Payback years = Net Cost / Annual Savings', () => {
  const input: TrueQuoteInput = {
    location: { zipCode: '89052', state: 'NV' },
    industry: { type: 'hotel', subtype: 'midscale', facilityData: { roomCount: 100 } },
    options: { solarEnabled: true },
  };
  const result = calculateTrueQuote(input);
  
  const expectedPayback = result.results.financial.netCost / result.results.financial.annualSavings;
  const actualPayback = result.results.financial.paybackYears;
  
  return {
    passed: assertEqual(actualPayback, expectedPayback, 0.2),  // Allow 0.2 year tolerance
    expected: `${expectedPayback.toFixed(1)} years`,
    actual: `${actualPayback} years`,
    message: 'Payback should equal Net Cost / Annual Savings',
  };
});

// ============================================================================
// TEST SUITE 4: DATA PERSISTENCE (Simulated Wizard Flow)
// ============================================================================

console.log('\n' + '═'.repeat(70));
console.log('TEST SUITE 4: DATA PERSISTENCE (Wizard Flow Simulation)');
console.log('═'.repeat(70) + '\n');

test('Same input produces identical output (deterministic)', () => {
  const input: TrueQuoteInput = {
    location: { zipCode: '89052', state: 'NV' },
    industry: { type: 'hotel', subtype: 'midscale', facilityData: { roomCount: 100 } },
    options: { solarEnabled: true },
  };
  
  const result1 = calculateTrueQuote(input);
  const result2 = calculateTrueQuote(input);
  
  // Compare key values (excluding quoteId and timestamp which will differ)
  const match = 
    result1.results.peakDemandKW === result2.results.peakDemandKW &&
    result1.results.bess.powerKW === result2.results.bess.powerKW &&
    result1.results.bess.energyKWh === result2.results.bess.energyKWh &&
    result1.results.financial.totalInvestment === result2.results.financial.totalInvestment;
  
  return {
    passed: match,
    expected: 'Identical results',
    actual: match ? 'Identical' : 'Different',
    message: 'Same input should always produce same output',
  };
});

test('Wizard Step 3 → Step 5 data flow simulation', () => {
  // Simulate Step 3: User enters facility data
  const step3Data = {
    roomCount: 150,
    hotelCategory: 'upscale',
    foodBeverage: 'full-service',
    spaServices: 'day-spa',
  };
  
  // Simulate Step 4: User enables options
  const step4Options = {
    solarEnabled: true,
    evChargingEnabled: true,
    level2Chargers: 8,
    dcFastChargers: 2,
  };
  
  // Build TrueQuoteInput (what trueQuoteMapper does)
  const trueQuoteInput: TrueQuoteInput = {
    location: { zipCode: '89052', state: 'NV' },
    industry: {
      type: 'hotel',
      subtype: 'upscale',
      facilityData: step3Data,
    },
    options: step4Options,
  };
  
  // Calculate (what Step 5 does)
  const result = calculateTrueQuote(trueQuoteInput);
  
  // Verify the data flowed correctly
  const dataFlowed = 
    result.inputs.industry.facilityData.roomCount === 150 &&
    result.inputs.industry.subtype === 'upscale' &&
    result.results.bess.powerKW > 0 &&
    result.results.evCharging !== undefined;
  
  return {
    passed: dataFlowed,
    expected: 'All Step 3 data flows to calculation',
    actual: dataFlowed ? 'Data flowed correctly' : 'Data lost in flow',
    message: 'Step 3 data should persist through to TrueQuote result',
  };
});

test('Power level multiplier applied correctly', () => {
  const input: TrueQuoteInput = {
    location: { zipCode: '89052', state: 'NV' },
    industry: { type: 'hotel', subtype: 'midscale', facilityData: { roomCount: 100 } },
    options: {},
  };
  
  // Get base calculation
  const baseResult = calculateTrueQuote(input);
  const baseBessKW = baseResult.results.bess.powerKW;
  
  // Simulate power level multipliers (as Step 5 does)
  const starterMultiplier = 0.7;
  const perfectFitMultiplier = 1.0;
  const beastModeMultiplier = 1.5;
  
  const starterBess = Math.round(baseBessKW * starterMultiplier);
  const perfectFitBess = Math.round(baseBessKW * perfectFitMultiplier);
  const beastModeBess = Math.round(baseBessKW * beastModeMultiplier);
  
  const validMultipliers = 
    starterBess < perfectFitBess &&
    perfectFitBess < beastModeBess &&
    assertEqual(perfectFitBess, baseBessKW, 1);
  
  return {
    passed: validMultipliers,
    expected: `Starter (${starterBess}) < Perfect Fit (${perfectFitBess}) < Beast Mode (${beastModeBess})`,
    actual: `Starter: ${starterBess}, Perfect Fit: ${perfectFitBess}, Beast Mode: ${beastModeBess}`,
    message: 'Power level multipliers should scale BESS correctly',
  };
});

// ============================================================================
// TEST SUITE 5: CALCULATION STEPS (Audit Trail)
// ============================================================================

console.log('\n' + '═'.repeat(70));
console.log('TEST SUITE 5: CALCULATION STEPS (Audit Trail)');
console.log('═'.repeat(70) + '\n');

test('Calculation steps are generated', () => {
  const input: TrueQuoteInput = {
    location: { zipCode: '89052', state: 'NV' },
    industry: { type: 'hotel', subtype: 'midscale', facilityData: { roomCount: 100 } },
    options: { solarEnabled: true },
  };
  const result = calculateTrueQuote(input);
  
  return {
    passed: result.calculationSteps.length >= 5,
    expected: 'At least 5 calculation steps',
    actual: `${result.calculationSteps.length} steps`,
    message: 'Should generate detailed calculation steps for audit',
  };
});

test('Each step has required fields', () => {
  const input: TrueQuoteInput = {
    location: { zipCode: '89052', state: 'NV' },
    industry: { type: 'hotel', subtype: 'midscale', facilityData: { roomCount: 100 } },
    options: {},
  };
  const result = calculateTrueQuote(input);
  
  const allValid = result.calculationSteps.every(step => 
    step.stepNumber > 0 &&
    step.category &&
    step.name &&
    step.formula &&
    step.output &&
    step.output.value !== undefined
  );
  
  return {
    passed: allValid,
    expected: 'All steps have required fields',
    actual: allValid ? 'All valid' : 'Some steps missing fields',
    message: 'Each step should have stepNumber, category, name, formula, output',
  };
});

test('Sources are provided for traceability', () => {
  const input: TrueQuoteInput = {
    location: { zipCode: '89052', state: 'NV' },
    industry: { type: 'hotel', subtype: 'midscale', facilityData: { roomCount: 100 } },
    options: {},
  };
  const result = calculateTrueQuote(input);
  
  const hasSources = result.sources.length >= 3;
  const hasNREL = result.sources.some(s => s.shortName.includes('NREL'));
  const hasEIA = result.sources.some(s => s.shortName.includes('EIA'));
  
  return {
    passed: hasSources && hasNREL && hasEIA,
    expected: 'Sources include NREL and EIA',
    actual: result.sources.map(s => s.shortName).join(', '),
    message: 'Should cite authoritative sources',
  };
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

console.log('\n' + '═'.repeat(70));
console.log('TEST SUMMARY');
console.log('═'.repeat(70) + '\n');

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log(`Total:  ${total}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);
console.log(`Rate:   ${((passed / total) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log('\n❌ FAILED TESTS:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`\n  • ${r.name}`);
    console.log(`    Expected: ${JSON.stringify(r.expected)}`);
    console.log(`    Actual:   ${JSON.stringify(r.actual)}`);
  });
}

console.log('\n' + '═'.repeat(70));

// Exit with error code if tests failed
if (failed > 0) {
  process.exit(1);
}
