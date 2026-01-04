/**
 * IMMEDIATE VALIDATION SCRIPT
 * 
 * Paste this into your browser console while on Step 6 of the wizard
 * to immediately validate your numbers against benchmarks.
 * 
 * Usage:
 *   1. Complete wizard to Step 6 (Quote Summary)
 *   2. Open browser DevTools (F12)
 *   3. Paste this entire script into Console
 *   4. Call: validateMyQuote({ ...your values... })
 */

// ═══════════════════════════════════════════════════════════════════════════════
// BENCHMARKS
// ═══════════════════════════════════════════════════════════════════════════════

const BENCHMARKS = {
  'data-center-tier-3-400-racks': {
    name: 'Tier III Data Center - 400 Racks',
    expected: {
      peakDemandKW: { min: 3000, max: 3400, exact: 3200 },
      bessPowerKW: { min: 1400, max: 1800, exact: 1600 },
      bessEnergyKWh: { min: 5600, max: 7200, exact: 6400 },
      generatorRequired: true,
      generatorKW: { min: 3500, max: 4500, exact: 4000 },
      annualSavings: { min: 300000, max: 600000 }
    }
  },
  'data-center-tier-2-100-racks': {
    name: 'Tier II Data Center - 100 Racks',
    expected: {
      peakDemandKW: { min: 800, max: 1000, exact: 900 },
      bessPowerKW: { min: 300, max: 420, exact: 360 },
      bessEnergyKWh: { min: 1200, max: 1700, exact: 1440 },
      generatorRequired: true
    }
  },
  'hospital-regional-300-beds': {
    name: 'Regional Hospital - 300 Beds',
    expected: {
      peakDemandKW: { min: 3000, max: 4000, exact: 3600 },
      bessPowerKW: { min: 1300, max: 1800, exact: 1530 },
      generatorRequired: true
    }
  },
  'hotel-upscale-200-rooms': {
    name: 'Upscale Hotel - 200 Rooms',
    expected: {
      peakDemandKW: { min: 800, max: 1100, exact: 900 },
      bessPowerKW: { min: 200, max: 350, exact: 270 },
      generatorRequired: true
    }
  },
  'ev-charging-20-chargers': {
    name: 'EV Charging Hub - 20 Chargers (8 L2 + 10 DCFC + 2 Ultra)',
    expected: {
      peakDemandKW: { min: 2200, max: 2500, exact: 2354 },
      bessPowerKW: { min: 1200, max: 1600, exact: 1412 },
      generatorRequired: false
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

function validateMyQuote(wizardOutput, benchmarkId) {
  const benchmark = BENCHMARKS[benchmarkId];
  
  if (!benchmark) {
    console.error('Unknown benchmark. Available:', Object.keys(BENCHMARKS));
    return;
  }
  
  console.log('%c═══════════════════════════════════════════════════════════════', 'color: #9333ea');
  console.log('%c  TRUEQUOTE VALIDATION: ' + benchmark.name, 'color: #9333ea; font-weight: bold; font-size: 14px');
  console.log('%c═══════════════════════════════════════════════════════════════', 'color: #9333ea');
  console.log('');
  
  const results = [];
  let criticalCount = 0;
  let warningCount = 0;
  let passCount = 0;
  
  // Check each field
  for (const [field, expected] of Object.entries(benchmark.expected)) {
    const actual = wizardOutput[field];
    
    if (field === 'generatorRequired') {
      const genEnabled = actual === true;
      const shouldHave = expected;
      
      if (shouldHave && !genEnabled) {
        console.log('%c🚨 CRITICAL: Generator REQUIRED but not enabled!', 'color: red; font-weight: bold');
        criticalCount++;
      } else if (genEnabled === shouldHave) {
        console.log('%c✓ Generator selection correct', 'color: green');
        passCount++;
      }
      continue;
    }
    
    if (actual === undefined || actual === null) {
      console.log('%c❓ ' + field + ': No value provided', 'color: gray');
      continue;
    }
    
    const inRange = actual >= expected.min && actual <= expected.max;
    let deviation = null;
    if (expected.exact) {
      deviation = Math.abs((actual - expected.exact) / expected.exact) * 100;
    }
    
    if (inRange) {
      console.log('%c✓ ' + field + ': ' + actual.toLocaleString() + ' (expected ' + expected.min.toLocaleString() + '-' + expected.max.toLocaleString() + ')', 'color: green');
      passCount++;
    } else if (deviation && deviation > 50) {
      console.log('%c🚨 CRITICAL ' + field + ': ' + actual.toLocaleString() + ' is ' + deviation.toFixed(0) + '% off! (expected ~' + expected.exact.toLocaleString() + ')', 'color: red; font-weight: bold');
      criticalCount++;
    } else {
      console.log('%c⚠️ WARNING ' + field + ': ' + actual.toLocaleString() + ' outside range ' + expected.min.toLocaleString() + '-' + expected.max.toLocaleString(), 'color: orange');
      warningCount++;
    }
  }
  
  console.log('');
  console.log('%c───────────────────────────────────────────────────────────────', 'color: gray');
  
  if (criticalCount > 0) {
    console.log('%c❌ FAILED: ' + criticalCount + ' critical issues, ' + warningCount + ' warnings', 'color: red; font-weight: bold; font-size: 14px');
  } else if (warningCount > 0) {
    console.log('%c⚠️ PASSED WITH WARNINGS: ' + warningCount + ' warnings', 'color: orange; font-weight: bold');
  } else {
    console.log('%c✅ PASSED: All checks within expected ranges', 'color: green; font-weight: bold; font-size: 14px');
  }
  
  return { criticalCount, warningCount, passCount };
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK TEST - Data Center Example
// ═══════════════════════════════════════════════════════════════════════════════

console.log('%c\n📋 TrueQuote Validation Loaded!\n', 'color: #9333ea; font-weight: bold; font-size: 16px');
console.log('%cTo validate your wizard output, call:', 'color: gray');
console.log('%c\nvalidateMyQuote({\n  peakDemandKW: YOUR_VALUE,\n  bessPowerKW: YOUR_VALUE,\n  bessEnergyKWh: YOUR_VALUE,\n  generatorRequired: true/false,\n  generatorKW: YOUR_VALUE,\n  annualSavings: YOUR_VALUE\n}, "data-center-tier-3-400-racks")', 'color: #0ea5e9; font-family: monospace');
console.log('%c\nAvailable benchmarks:', 'color: gray');
Object.keys(BENCHMARKS).forEach(id => {
  console.log('%c  • ' + id, 'color: #9333ea');
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE: Validate the buggy output you showed me
// ═══════════════════════════════════════════════════════════════════════════════

console.log('%c\n\n🔍 Example: Validating the buggy Tier III data center output you showed me...', 'color: #f59e0b; font-weight: bold');
console.log('');

validateMyQuote({
  peakDemandKW: 100,        // WRONG - should be ~3200
  bessPowerKW: 100,         // WRONG - should be ~1600
  bessEnergyKWh: 400,       // WRONG - should be ~6400
  generatorRequired: false, // WRONG - should be true
  generatorKW: 0,           // WRONG - should be ~4000
  annualSavings: 80000      // WRONG - should be ~400000
}, 'data-center-tier-3-400-racks');

console.log('%c\n📌 The above shows what YOUR wizard currently produces.', 'color: #f59e0b');
console.log('%c   Compare to what it SHOULD produce and fix the data flow!', 'color: #f59e0b');
