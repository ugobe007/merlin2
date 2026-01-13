/**
 * ============================================================================
 * MERLIN WIZARD - COMBINED DEBUG & VALIDATION SCRIPT
 * ============================================================================
 * 
 * HOW TO USE:
 * 1. Open Merlin wizard in browser
 * 2. Complete wizard to Step 5 (System) or Step 6 (Quote)
 * 3. Open DevTools (F12 or Cmd+Option+I)
 * 4. Go to Console tab
 * 5. Paste this ENTIRE script
 * 6. Press Enter
 * 
 * The script will automatically:
 * - Find the wizard state
 * - Check data flow at each step
 * - Validate calculations
 * - Show what's broken and why
 * 
 * ============================================================================
 */

(function() {
  'use strict';
  
  console.clear();
  console.log('%c🧙 MERLIN WIZARD DIAGNOSTIC', 'font-size: 20px; font-weight: bold; color: #8B5CF6;');
  console.log('%cSearching for wizard state...', 'color: #9CA3AF;');
  
  // ============================================================================
  // STATE FINDER
  // ============================================================================
  
  function findWizardState() {
    // Method 1: Global exposure
    if (window.__MERLIN_STATE__) return window.__MERLIN_STATE__;
    if (window.__wizardState__) return window.__wizardState__;
    
    // Method 2: React fiber traversal
    const roots = ['main', '[class*="wizard"]', '[class*="Wizard"]', '#root', '#app'];
    
    for (const selector of roots) {
      const el = document.querySelector(selector);
      if (!el) continue;
      
      const fiberKey = Object.keys(el).find(k => 
        k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
      );
      
      if (fiberKey) {
        const state = traverseFiber(el[fiberKey], 0);
        if (state) return state;
      }
    }
    
    return null;
  }
  
  function traverseFiber(fiber, depth) {
    if (!fiber || depth > 100) return null;
    
    // Check hooks
    let hook = fiber.memoizedState;
    while (hook) {
      const s = hook.memoizedState;
      if (s && typeof s === 'object' && !Array.isArray(s)) {
        // Check for wizard state signature
        if ('industry' in s || 'zipCode' in s || 'facilityDetails' in s || 
            'useCaseData' in s || 'calculations' in s) {
          return s;
        }
      }
      hook = hook.next;
    }
    
    // Traverse tree
    return traverseFiber(fiber.child, depth + 1) || 
           traverseFiber(fiber.sibling, depth + 1) ||
           traverseFiber(fiber.return, depth + 1);
  }
  
  // ============================================================================
  // DIAGNOSTIC
  // ============================================================================
  
  function runDiagnostic(state) {
    const results = {
      step1: { status: '❓', issues: [] },
      step2: { status: '❓', issues: [] },
      step3: { status: '❓', issues: [] },
      step4: { status: '❓', issues: [] },
      step5: { status: '❓', issues: [] },
      calculations: { status: '❓', issues: [] },
    };
    
    // STEP 1
    if (state.zipCode && state.zipCode.length >= 5 && state.goals?.length > 0) {
      results.step1.status = '✅';
    } else {
      results.step1.status = '❌';
      if (!state.zipCode || state.zipCode.length < 5) results.step1.issues.push('Missing ZIP code');
      if (!state.goals || state.goals.length === 0) results.step1.issues.push('No goals selected');
    }
    
    // STEP 2
    if (state.industry && state.industry !== '') {
      results.step2.status = '✅';
    } else {
      results.step2.status = '❌';
      results.step2.issues.push('No industry selected');
    }
    
    // STEP 3 - The critical one
    const fdKeys = Object.keys(state.facilityDetails || {}).filter(k => {
      const v = state.facilityDetails[k];
      return v !== undefined && v !== null && v !== 0 && v !== '';
    });
    const ucKeys = Object.keys(state.useCaseData || {});
    
    if (ucKeys.length > 0 || fdKeys.length > 2) {
      results.step3.status = '✅';
    } else {
      results.step3.status = '❌';
      results.step3.issues.push('No facility data captured');
      if (ucKeys.length === 0) results.step3.issues.push('useCaseData is EMPTY');
      if (fdKeys.length <= 2) results.step3.issues.push('facilityDetails has only defaults');
    }
    
    // Industry-specific checks
    const allData = { ...state.facilityDetails, ...state.useCaseData };
    if (state.industry === 'data_center') {
      if (!allData.rackCount) results.step3.issues.push('Missing: rackCount');
      if (!allData.tier) results.step3.issues.push('Missing: tier');
    } else if (state.industry === 'hotel') {
      if (!allData.roomCount) results.step3.issues.push('Missing: roomCount');
    } else if (state.industry === 'hospital') {
      if (!allData.bedCount) results.step3.issues.push('Missing: bedCount');
    }
    
    if (results.step3.issues.length > 0 && results.step3.status !== '❌') {
      results.step3.status = '⚠️';
    }
    
    // STEP 4
    if (state.selectedOptions && state.selectedOptions.length > 0) {
      results.step4.status = '✅';
    } else {
      results.step4.status = '⚠️';
      results.step4.issues.push('No options selected (solar/EV/generator)');
    }
    
    // STEP 5
    if (state.selectedPowerLevel) {
      results.step5.status = '✅';
    } else {
      results.step5.status = '⚠️';
      results.step5.issues.push('No power level selected');
    }
    
    // CALCULATIONS (Updated Jan 2026: nested structure { base, selected })
    if (state.calculations) {
      // Check for correct nested structure
      const hasNestedStructure = state.calculations.base && state.calculations.selected;
      const selected = state.calculations.selected || {};
      
      if (hasNestedStructure && selected.bessKW > 0 && selected.bessKWh > 0) {
        results.calculations.status = '✅';
      } else if (!hasNestedStructure && state.calculations.bessKW) {
        // Old flat structure detected
        results.calculations.status = '⚠️';
        results.calculations.issues.push('FLAT STRUCTURE DETECTED - should be { base, selected }');
        results.calculations.issues.push('bessKW found at root instead of calculations.selected.bessKW');
      } else {
        results.calculations.status = '❌';
        if (!hasNestedStructure) results.calculations.issues.push('Missing nested { base, selected } structure');
        if (selected.bessKW === 0) results.calculations.issues.push('BESS Power = 0 kW');
        if (selected.bessKWh === 0) results.calculations.issues.push('BESS Energy = 0 kWh');
      }
    } else {
      results.calculations.status = '❌';
      results.calculations.issues.push('No calculations object');
    }
    
    return results;
  }
  
  // ============================================================================
  // OUTPUT
  // ============================================================================
  
  function printResults(state, results) {
    console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8B5CF6;');
    console.log('%c DATA FLOW CHECK', 'font-size: 14px; font-weight: bold;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8B5CF6;');
    
    const steps = [
      { name: 'Step 1: Location', key: 'step1', data: { zipCode: state.zipCode, state: state.state, goals: state.goals } },
      { name: 'Step 2: Industry', key: 'step2', data: { industry: state.industry } },
      { name: 'Step 3: Details', key: 'step3', data: { facilityDetails: state.facilityDetails, useCaseData: state.useCaseData } },
      { name: 'Step 4: Options', key: 'step4', data: { selectedOptions: state.selectedOptions } },
      { name: 'Step 5: System', key: 'step5', data: { selectedPowerLevel: state.selectedPowerLevel } },
      { name: 'Calculations', key: 'calculations', data: state.calculations },
    ];
    
    steps.forEach(step => {
      const r = results[step.key];
      console.log(`\n${r.status} ${step.name}`);
      if (r.issues.length > 0) {
        r.issues.forEach(i => console.log(`   ↳ ${i}`));
      }
      console.log('   Data:', step.data);
    });
    
    // BESS-specific analysis (Updated Jan 2026: nested structure)
    console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8B5CF6;');
    console.log('%c🔋 BESS CALCULATION ANALYSIS', 'font-size: 14px; font-weight: bold;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8B5CF6;');
    
    const calc = state.calculations || {};
    const hasNestedStructure = calc.base && calc.selected;
    const selected = calc.selected || {};
    const base = calc.base || {};
    
    // Check for flat vs nested
    if (!hasNestedStructure && calc.bessKW) {
      console.log('\n   %c⚠️  FLAT STRUCTURE DETECTED (Legacy)!', 'color: #F59E0B; font-weight: bold;');
      console.log('   %cExpected: calculations.selected.bessKW', 'color: #F59E0B;');
      console.log('   %cFound: calculations.bessKW (flat)', 'color: #F59E0B;');
      console.log('\n   %c🔧 FIX: Update code to write { base: {...}, selected: {...} }', 'color: #10B981;');
    }
    
    console.log('\n   %cStructure:', 'font-weight: bold;');
    console.log(`      Nested format: ${hasNestedStructure ? '✅' : '❌'}`);
    console.log(`      base keys: [${Object.keys(base).join(', ') || 'EMPTY'}]`);
    console.log(`      selected keys: [${Object.keys(selected).join(', ') || 'EMPTY'}]`);
    
    console.log('\n   %cSelected Values:', 'font-weight: bold;');
    console.log(`   BESS Power:  ${selected.bessKW || calc.bessKW || 0} kW ${(selected.bessKW || calc.bessKW) === 0 ? '← ❌ PROBLEM!' : ''}`);
    console.log(`   BESS Energy: ${selected.bessKWh || calc.bessKWh || 0} kWh ${(selected.bessKWh || calc.bessKWh) === 0 ? '← ❌ PROBLEM!' : ''}`);
    console.log(`   Solar:       ${selected.solarKW || calc.solarKW || 0} kW`);
    console.log(`   Generator:   ${selected.generatorKW || calc.generatorKW || 0} kW`);
    console.log(`   Investment:  $${(selected.totalInvestment || calc.totalInvestment || 0).toLocaleString()}`);
    console.log(`   Savings:     $${(selected.annualSavings || calc.annualSavings || 0).toLocaleString()}/yr`);
    console.log(`   Payback:     ${selected.paybackYears || calc.paybackYears || 0} years`);
    
    // Root cause analysis (Updated Jan 2026)
    const bessKW = selected.bessKW || calc.bessKW || 0;
    const bessKWh = selected.bessKWh || calc.bessKWh || 0;
    
    if (bessKW === 0 || bessKWh === 0) {
      console.log('\n%c⚠️  ROOT CAUSE ANALYSIS', 'font-size: 14px; font-weight: bold; color: #F59E0B;');
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #F59E0B;');
      
      // Check for nested structure issues
      if (!hasNestedStructure) {
        console.log('\n   %c💡 STRUCTURE ISSUE: Missing nested { base, selected } format', 'color: #F59E0B;');
        console.log('   %c   Expected: state.calculations = { base: {...}, selected: {...} }', 'color: #F59E0B;');
        console.log('\n   %c🔧 FIX: Update Step5MagicFit.tsx to write nested structure', 'color: #10B981;');
      }
      
      const ucKeys = Object.keys(state.useCaseData || {});
      const inputKeys = Object.keys(state.useCaseData?.inputs || {});
      const fdKeys = Object.keys(state.facilityDetails || {});
      
      console.log(`\n   useCaseData keys: [${ucKeys.join(', ') || 'EMPTY'}]`);
      console.log(`   useCaseData.inputs keys: [${inputKeys.join(', ') || 'EMPTY'}]`);
      console.log(`   facilityDetails keys: [${fdKeys.join(', ')}]`);
      
      if (ucKeys.length === 0) {
        console.log('\n   %c💡 LIKELY CAUSE: Step 3 is writing to facilityDetails but', 'color: #F59E0B;');
        console.log('   %c   the calculation engine expects data in useCaseData.', 'color: #F59E0B;');
        console.log('\n   %c🔧 FIX: Update Step3Details.tsx to write to useCaseData', 'color: #10B981;');
      }
      
      if (state.industry === 'data_center') {
        const rackCount = state.useCaseData?.rackCount || state.facilityDetails?.rackCount;
        const tier = state.useCaseData?.tier || state.facilityDetails?.tier;
        
        if (!rackCount || !tier) {
          console.log('\n   %c💡 DATA CENTER SPECIFIC:', 'color: #F59E0B;');
          console.log(`      rackCount: ${rackCount || 'MISSING'}`);
          console.log(`      tier: ${tier || 'MISSING'}`);
          console.log('\n   %c🔧 FIX: Step 3 questionnaire must capture rack count and tier', 'color: #10B981;');
        }
      }
    }
    
    // Final summary
    console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8B5CF6;');
    console.log('%c📋 SUMMARY', 'font-size: 14px; font-weight: bold;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8B5CF6;');
    
    const criticalIssues = Object.entries(results)
      .filter(([_, r]) => r.status === '❌')
      .map(([k, r]) => ({ step: k, issues: r.issues }));
    
    if (criticalIssues.length === 0) {
      console.log('\n   %c✅ All checks passed!', 'color: #10B981; font-weight: bold;');
    } else {
      console.log(`\n   %c❌ ${criticalIssues.length} critical issue(s) found:`, 'color: #EF4444; font-weight: bold;');
      criticalIssues.forEach(({ step, issues }) => {
        issues.forEach(i => console.log(`      • [${step}] ${i}`));
      });
    }
    
    // Export state for further analysis
    window.__MERLIN_DEBUG_STATE__ = state;
    console.log('\n   %c💾 State saved to window.__MERLIN_DEBUG_STATE__', 'color: #9CA3AF;');
    console.log('   %c   Access it in console: __MERLIN_DEBUG_STATE__', 'color: #9CA3AF;');
  }
  
  // ============================================================================
  // RUN
  // ============================================================================
  
  const state = findWizardState();
  
  if (!state) {
    console.log('%c\n❌ Could not find wizard state!', 'color: #EF4444; font-weight: bold;');
    console.log('%c\nPossible reasons:', 'color: #9CA3AF;');
    console.log('   1. You are not on the wizard page');
    console.log('   2. The wizard has not initialized yet');
    console.log('   3. React state is not accessible');
    console.log('\n%cTry:', 'color: #9CA3AF;');
    console.log('   1. Navigate to Step 5 or Step 6 of the wizard');
    console.log('   2. Refresh the page and run this script again');
    console.log('   3. Check if React DevTools can see the state');
    return;
  }
  
  console.log('%c✅ Found wizard state!', 'color: #10B981;');
  
  const results = runDiagnostic(state);
  printResults(state, results);
  
})();
