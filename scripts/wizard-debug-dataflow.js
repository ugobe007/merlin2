/**
 * MERLIN WIZARD DEBUG SCRIPT
 * ==========================
 * Paste this entire script into browser console while on Step 5 or Step 6
 * 
 * Run: testMerlinDataFlow()
 */

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

function testMerlinDataFlow() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 MERLIN WIZARD DATA FLOW DIAGNOSTIC');
  console.log('='.repeat(60) + '\n');

  // Try to find React state
  const state = findWizardState();
  
  if (!state) {
    console.error('❌ Could not find wizard state. Make sure you are on the wizard page.');
    console.log('💡 TIP: Try running this on Step 5 or Step 6 of the wizard.');
    return;
  }

  console.log('✅ Found wizard state!\n');

  // Run all diagnostic tests
  testStep1Data(state);
  testStep2Data(state);
  testStep3Data(state);
  testStep4Data(state);
  testStep5Data(state);
  testCalculations(state);
  
  // Summary
  printSummary(state);
}

// ============================================================================
// FIND WIZARD STATE (Multiple methods)
// ============================================================================

function findWizardState() {
  // Method 1: Check window for exposed state
  if (window.__MERLIN_STATE__) {
    console.log('📍 Found state via window.__MERLIN_STATE__');
    return window.__MERLIN_STATE__;
  }

  // Method 2: Try to find React fiber
  const wizardRoot = document.querySelector('[class*="wizard"]') || 
                     document.querySelector('[class*="Wizard"]') ||
                     document.querySelector('main');
  
  if (wizardRoot) {
    const fiber = findReactFiber(wizardRoot);
    if (fiber) {
      const state = extractStateFromFiber(fiber);
      if (state) {
        console.log('📍 Found state via React fiber');
        return state;
      }
    }
  }

  // Method 3: Look for state in React DevTools hook
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('📍 React DevTools detected - try using React DevTools Components tab');
  }

  return null;
}

function findReactFiber(element) {
  const key = Object.keys(element).find(key => 
    key.startsWith('__reactFiber$') || 
    key.startsWith('__reactInternalInstance$')
  );
  return key ? element[key] : null;
}

function extractStateFromFiber(fiber, depth = 0) {
  if (depth > 50) return null;
  
  // Check memoizedState for hooks
  let current = fiber;
  while (current) {
    if (current.memoizedState) {
      // Look for state that looks like WizardState
      let hookState = current.memoizedState;
      while (hookState) {
        if (hookState.memoizedState && 
            typeof hookState.memoizedState === 'object' &&
            hookState.memoizedState !== null) {
          const s = hookState.memoizedState;
          // Check if it looks like wizard state
          if ('zipCode' in s || 'industry' in s || 'facilityDetails' in s || 'useCaseData' in s) {
            return s;
          }
        }
        hookState = hookState.next;
      }
    }
    current = current.return;
  }
  
  // Try child
  if (fiber.child) {
    const result = extractStateFromFiber(fiber.child, depth + 1);
    if (result) return result;
  }
  
  // Try sibling
  if (fiber.sibling) {
    const result = extractStateFromFiber(fiber.sibling, depth + 1);
    if (result) return result;
  }
  
  return null;
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

function testStep1Data(state) {
  console.log('📍 STEP 1: Location & Goals');
  console.log('-'.repeat(40));
  
  const checks = [
    { field: 'zipCode', value: state.zipCode, required: true },
    { field: 'state', value: state.state, required: true },
    { field: 'city', value: state.city, required: false },
    { field: 'goals', value: state.goals, required: true },
    { field: 'solarData', value: state.solarData, required: false },
  ];

  checks.forEach(({ field, value, required }) => {
    const hasValue = value !== undefined && value !== null && value !== '' && 
                     (Array.isArray(value) ? value.length > 0 : true);
    const status = hasValue ? '✅' : (required ? '❌' : '⚠️');
    console.log(`  ${status} ${field}: ${JSON.stringify(value)}`);
  });
  console.log('');
}

function testStep2Data(state) {
  console.log('📍 STEP 2: Industry');
  console.log('-'.repeat(40));
  
  console.log(`  ${state.industry ? '✅' : '❌'} industry: "${state.industry}"`);
  console.log(`  ${state.industryName ? '✅' : '⚠️'} industryName: "${state.industryName}"`);
  console.log('');
}

function testStep3Data(state) {
  console.log('📍 STEP 3: Facility Details');
  console.log('-'.repeat(40));
  
  // Check facilityDetails
  console.log('  📦 facilityDetails:');
  if (state.facilityDetails && Object.keys(state.facilityDetails).length > 0) {
    Object.entries(state.facilityDetails).forEach(([key, value]) => {
      const hasValue = value !== undefined && value !== null && value !== 0 && value !== '';
      console.log(`    ${hasValue ? '✅' : '⚠️'} ${key}: ${JSON.stringify(value)}`);
    });
  } else {
    console.log('    ❌ EMPTY or undefined');
  }
  
  // Check useCaseData
  console.log('  📦 useCaseData:');
  if (state.useCaseData && Object.keys(state.useCaseData).length > 0) {
    Object.entries(state.useCaseData).forEach(([key, value]) => {
      const hasValue = value !== undefined && value !== null && value !== 0 && value !== '';
      console.log(`    ${hasValue ? '✅' : '⚠️'} ${key}: ${JSON.stringify(value)}`);
    });
  } else {
    console.log('    ❌ EMPTY or undefined');
  }
  
  // Industry-specific checks
  console.log('  🏭 Industry-specific fields:');
  const industryFields = {
    'data_center': ['rackCount', 'tier', 'powerUsageEffectiveness', 'redundancy'],
    'hotel': ['roomCount', 'starRating', 'hasPool', 'hasRestaurant', 'hasSpa'],
    'hospital': ['bedCount', 'hasEmergency', 'hasICU', 'hasOR'],
    'car_wash': ['bayCount', 'tunnelCount', 'hasVacuums'],
    'ev_charging': ['chargerCount', 'level2Count', 'dcfcCount'],
  };
  
  const expectedFields = industryFields[state.industry] || [];
  expectedFields.forEach(field => {
    const inFacility = state.facilityDetails?.[field];
    const inUseCase = state.useCaseData?.[field];
    const value = inFacility ?? inUseCase;
    const status = value !== undefined && value !== null ? '✅' : '❌';
    const location = inFacility !== undefined ? 'facilityDetails' : 
                     inUseCase !== undefined ? 'useCaseData' : 'MISSING';
    console.log(`    ${status} ${field}: ${JSON.stringify(value)} (in ${location})`);
  });
  
  console.log('');
}

function testStep4Data(state) {
  console.log('📍 STEP 4: Options');
  console.log('-'.repeat(40));
  
  console.log(`  selectedOptions: ${JSON.stringify(state.selectedOptions)}`);
  console.log(`  solarTier: ${state.solarTier}`);
  console.log(`  evTier: ${state.evTier}`);
  console.log(`  customSolarKw: ${state.customSolarKw}`);
  console.log(`  customEvL2: ${state.customEvL2}`);
  console.log(`  customEvDcfc: ${state.customEvDcfc}`);
  console.log(`  customEvUltraFast: ${state.customEvUltraFast}`);
  console.log(`  customGeneratorKw: ${state.customGeneratorKw}`);
  console.log(`  generatorFuel: ${state.generatorFuel}`);
  console.log('');
}

function testStep5Data(state) {
  console.log('📍 STEP 5: System Selection');
  console.log('-'.repeat(40));
  
  console.log(`  selectedPowerLevel: ${state.selectedPowerLevel}`);
  console.log('');
}

function testCalculations(state) {
  console.log('📍 CALCULATIONS');
  console.log('-'.repeat(40));
  
  if (!state.calculations) {
    console.log('  ❌ calculations is NULL or undefined');
    console.log('  💡 This means Step 5 calculation engine never ran or failed');
    return;
  }
  
  const calc = state.calculations;
  
  // BESS
  console.log('  🔋 BESS:');
  console.log(`    ${calc.bessKW > 0 ? '✅' : '❌'} bessKW: ${calc.bessKW} kW`);
  console.log(`    ${calc.bessKWh > 0 ? '✅' : '❌'} bessKWh: ${calc.bessKWh} kWh`);
  
  // Solar
  console.log('  ☀️ Solar:');
  console.log(`    solarKW: ${calc.solarKW} kW`);
  
  // EV
  console.log('  ⚡ EV:');
  console.log(`    evChargers: ${calc.evChargers}`);
  
  // Generator
  console.log('  🔌 Generator:');
  console.log(`    generatorKW: ${calc.generatorKW} kW`);
  
  // Financial
  console.log('  💰 Financial:');
  console.log(`    totalInvestment: $${calc.totalInvestment?.toLocaleString()}`);
  console.log(`    annualSavings: $${calc.annualSavings?.toLocaleString()}`);
  console.log(`    paybackYears: ${calc.paybackYears}`);
  console.log(`    federalITC: $${calc.federalITC?.toLocaleString()}`);
  console.log(`    netInvestment: $${calc.netInvestment?.toLocaleString()}`);
  
  console.log('');
}

// ============================================================================
// SUMMARY
// ============================================================================

function printSummary(state) {
  console.log('='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  
  const issues = [];
  
  // Check for data flow issues
  if (!state.industry) {
    issues.push('❌ No industry selected (Step 2 data missing)');
  }
  
  const hasFacilityDetails = state.facilityDetails && 
    Object.values(state.facilityDetails).some(v => v !== 0 && v !== '' && v !== undefined);
  const hasUseCaseData = state.useCaseData && 
    Object.keys(state.useCaseData).length > 0;
  
  if (!hasFacilityDetails && !hasUseCaseData) {
    issues.push('❌ CRITICAL: Both facilityDetails AND useCaseData are empty (Step 3 data not captured)');
  } else if (!hasUseCaseData && state.industry !== 'hotel') {
    issues.push('⚠️ useCaseData is empty - Step 3 may be writing to facilityDetails instead');
  }
  
  // Check calculations
  if (!state.calculations) {
    issues.push('❌ CRITICAL: No calculations object (Step 5 calculation failed)');
  } else {
    if (state.calculations.bessKW === 0) {
      issues.push('❌ CRITICAL: BESS Power = 0 kW (calculation returned nothing)');
    }
    if (state.calculations.bessKWh === 0) {
      issues.push('❌ CRITICAL: BESS Storage = 0 kWh (calculation returned nothing)');
    }
  }
  
  // Check industry-specific
  if (state.industry === 'data_center') {
    const rackCount = state.facilityDetails?.rackCount || state.useCaseData?.rackCount;
    if (!rackCount) {
      issues.push('❌ Data Center: rackCount not found in state');
    }
    const tier = state.facilityDetails?.tier || state.useCaseData?.tier;
    if (!tier) {
      issues.push('❌ Data Center: tier not found in state');
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ No obvious issues detected');
  } else {
    console.log(`Found ${issues.length} issue(s):\n`);
    issues.forEach(issue => console.log(`  ${issue}`));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 NEXT STEPS');
  console.log('='.repeat(60));
  
  if (issues.some(i => i.includes('useCaseData'))) {
    console.log('1. Check Step3Details.tsx - verify it calls updateState({ useCaseData: {...} })');
  }
  if (issues.some(i => i.includes('BESS'))) {
    console.log('2. Check Step5MagicFit.tsx - verify TrueQuoteEngine receives correct input');
    console.log('3. Add console.log before TrueQuoteEngine.calculate() to see input');
  }
  if (issues.some(i => i.includes('rackCount'))) {
    console.log('4. Step3Details needs to capture rackCount for data centers');
  }
  
  console.log('\n📋 Full state object:');
  console.log(JSON.stringify(state, null, 2));
}

// ============================================================================
// ADDITIONAL HELPERS
// ============================================================================

// Expose state globally if found
window.getMerlinState = function() {
  return findWizardState();
};

// Quick check for BESS calculation
window.checkBESS = function() {
  const state = findWizardState();
  if (!state) {
    console.log('❌ Could not find state');
    return;
  }
  
  console.log('🔋 BESS Check:');
  console.log(`  Power: ${state.calculations?.bessKW || 0} kW`);
  console.log(`  Storage: ${state.calculations?.bessKWh || 0} kWh`);
  console.log(`  Industry: ${state.industry}`);
  console.log(`  useCaseData keys: ${Object.keys(state.useCaseData || {}).join(', ') || 'EMPTY'}`);
  console.log(`  facilityDetails keys: ${Object.keys(state.facilityDetails || {}).join(', ') || 'EMPTY'}`);
};

// ============================================================================
// AUTO-RUN
// ============================================================================

console.log('🧙 Merlin Debug Script Loaded!');
console.log('');
console.log('Available commands:');
console.log('  testMerlinDataFlow()  - Run full diagnostic');
console.log('  getMerlinState()      - Get current wizard state');
console.log('  checkBESS()           - Quick BESS calculation check');
console.log('');
console.log('Running diagnostic now...\n');

testMerlinDataFlow();
