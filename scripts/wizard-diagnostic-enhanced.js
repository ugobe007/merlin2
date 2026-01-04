/**
 * ============================================================================
 * MERLIN WIZARD - ENHANCED DIAGNOSTIC & VALIDATION SCRIPT
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
 * - Find the wizard state (multiple methods)
 * - Check data flow at each step
 * - Validate calculations
 * - Check localStorage/sessionStorage
 * - Validate data integrity
 * - Export results as JSON
 * - Show what's broken and why
 * 
 * ============================================================================
 */

(function() {
  'use strict';
  
  console.clear();
  console.log('%c🧙 MERLIN WIZARD ENHANCED DIAGNOSTIC', 'font-size: 20px; font-weight: bold; color: #8B5CF6;');
  console.log('%cSearching for wizard state...', 'color: #9CA3AF;');
  
  // ============================================================================
  // ENHANCED STATE FINDER - Multiple Methods
  // ============================================================================
  
  function findWizardState() {
    const methods = [];
    
    // Method 1: Global exposure
    if (window.__MERLIN_STATE__) {
      methods.push('Global: __MERLIN_STATE__');
      return { state: window.__MERLIN_STATE__, method: 'Global: __MERLIN_STATE__' };
    }
    if (window.__wizardState__) {
      methods.push('Global: __wizardState__');
      return { state: window.__wizardState__, method: 'Global: __wizardState__' };
    }
    
    // Method 2: localStorage
    try {
      const stored = localStorage.getItem('merlin-wizard-state');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.industry || parsed.zipCode || parsed.useCaseData)) {
          methods.push('localStorage: merlin-wizard-state');
          return { state: parsed, method: 'localStorage: merlin-wizard-state' };
        }
      }
    } catch (e) {
      // Ignore
    }
    
    // Method 3: React DevTools integration
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.renderers && hook.renderers.size > 0) {
        const renderer = Array.from(hook.renderers.values())[0];
        if (renderer.findFiberByHostInstance) {
          const root = document.querySelector('#root, #app, main, [class*="wizard"]');
          if (root) {
            const fiber = renderer.findFiberByHostInstance(root);
            if (fiber) {
              const state = traverseFiberAdvanced(fiber, 0);
              if (state) {
                methods.push('React DevTools');
                return { state, method: 'React DevTools' };
              }
            }
          }
        }
      }
    }
    
    // Method 4: Enhanced React fiber traversal (React 16, 17, 18)
    const roots = [
      'main', 
      '[class*="wizard"]', 
      '[class*="Wizard"]', 
      '#root', 
      '#app',
      '[data-reactroot]',
      '[data-react-root]'
    ];
    
    for (const selector of roots) {
      const el = document.querySelector(selector);
      if (!el) continue;
      
      // Try all possible React fiber keys
      const fiberKeys = Object.keys(el).filter(k => 
        k.startsWith('__reactFiber$') || 
        k.startsWith('__reactInternalInstance$') ||
        k.startsWith('__reactContainer$') ||
        k === '__reactFiber' ||
        k === '__reactInternalInstance'
      );
      
      for (const fiberKey of fiberKeys) {
        const fiber = el[fiberKey];
        if (fiber) {
          const state = traverseFiberAdvanced(fiber, 0);
          if (state) {
            methods.push(`Fiber: ${fiberKey}`);
            return { state, method: `Fiber: ${fiberKey}` };
          }
        }
      }
      
      // Also check parent elements
      let parent = el.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        const fiberKeys = Object.keys(parent).filter(k => 
          k.startsWith('__reactFiber$') || 
          k.startsWith('__reactInternalInstance$')
        );
        for (const fiberKey of fiberKeys) {
          const state = traverseFiberAdvanced(parent[fiberKey], 0);
          if (state) {
            methods.push(`Fiber (parent): ${fiberKey}`);
            return { state, method: `Fiber (parent): ${fiberKey}` };
          }
        }
        parent = parent.parentElement;
        depth++;
      }
    }
    
    // Method 5: Search all React roots
    const allRoots = document.querySelectorAll('[id^="root"], [id^="app"], [class*="root"], [class*="app"]');
    for (const root of allRoots) {
      const fiberKeys = Object.keys(root).filter(k => 
        k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
      );
      for (const fiberKey of fiberKeys) {
        const state = traverseFiberAdvanced(root[fiberKey], 0);
        if (state) {
          methods.push(`Root search: ${fiberKey}`);
          return { state, method: `Root search: ${fiberKey}` };
        }
      }
    }
    
    return null;
  }
  
  function traverseFiberAdvanced(fiber, depth) {
    if (!fiber || depth > 150) return null;
    
    // Check different React versions
    // React 16/17: memoizedState
    // React 18: memoizedState (hooks) or stateNode (class components)
    
    // Check hooks (functional components)
    let hook = fiber.memoizedState;
    while (hook) {
      // Check hook state
      const s = hook.memoizedState;
      if (s && typeof s === 'object' && !Array.isArray(s)) {
        if (isWizardState(s)) return s;
      }
      
      // Check hook queue (for useState)
      if (hook.queue) {
        const queueState = hook.queue.baseState || hook.queue.memoizedState;
        if (queueState && typeof queueState === 'object' && !Array.isArray(queueState)) {
          if (isWizardState(queueState)) return queueState;
        }
      }
      
      hook = hook.next;
    }
    
    // Check stateNode (class components or React 18)
    if (fiber.stateNode) {
      const node = fiber.stateNode;
      
      // Class component state
      if (node.state && typeof node.state === 'object') {
        if (isWizardState(node.state)) return node.state;
      }
      
      // Props might contain state
      if (node.props && typeof node.props === 'object') {
        if (isWizardState(node.props)) return node.props;
      }
    }
    
    // Check memoizedProps
    if (fiber.memoizedProps && typeof fiber.memoizedProps === 'object') {
      if (isWizardState(fiber.memoizedProps)) return fiber.memoizedProps;
    }
    
    // Check alternate (React 18 concurrent mode)
    if (fiber.alternate) {
      const altState = traverseFiberAdvanced(fiber.alternate, depth + 1);
      if (altState) return altState;
    }
    
    // Traverse tree (breadth-first for better performance)
    const children = [];
    if (fiber.child) children.push(fiber.child);
    if (fiber.sibling) children.push(fiber.sibling);
    if (fiber.return) children.push(fiber.return);
    
    for (const child of children) {
      const result = traverseFiberAdvanced(child, depth + 1);
      if (result) return result;
    }
    
    return null;
  }
  
  function isWizardState(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    
    // Check for wizard state signature
    const hasIndustry = 'industry' in obj;
    const hasZipCode = 'zipCode' in obj;
    const hasFacilityDetails = 'facilityDetails' in obj;
    const hasUseCaseData = 'useCaseData' in obj;
    const hasCalculations = 'calculations' in obj;
    const hasSelectedPowerLevel = 'selectedPowerLevel' in obj;
    
    // Must have at least 2 wizard-specific fields
    const matches = [hasIndustry, hasZipCode, hasFacilityDetails, hasUseCaseData, hasCalculations, hasSelectedPowerLevel].filter(Boolean).length;
    return matches >= 2;
  }
  
  // ============================================================================
  // ENHANCED DIAGNOSTIC - More Checks
  // ============================================================================
  
  function runDiagnostic(state) {
    const results = {
      step1: { status: '❓', issues: [], warnings: [] },
      step2: { status: '❓', issues: [], warnings: [] },
      step3: { status: '❓', issues: [], warnings: [] },
      step4: { status: '❓', issues: [], warnings: [] },
      step5: { status: '❓', issues: [], warnings: [] },
      calculations: { status: '❓', issues: [], warnings: [] },
      storage: { status: '❓', issues: [], warnings: [] },
      dataIntegrity: { status: '❓', issues: [], warnings: [] },
      performance: { status: '❓', issues: [], warnings: [] },
    };
    
    // STEP 1 - Enhanced
    if (state.zipCode && state.zipCode.length >= 5) {
      if (state.state && state.city) {
        results.step1.status = '✅';
      } else {
        results.step1.status = '⚠️';
        if (!state.state) results.step1.warnings.push('State not set (may be auto-filled)');
        if (!state.city) results.step1.warnings.push('City not set (may be auto-filled)');
      }
    } else {
      results.step1.status = '❌';
      if (!state.zipCode || state.zipCode.length < 5) results.step1.issues.push('Missing or invalid ZIP code');
    }
    
    if (!state.goals || state.goals.length === 0) {
      results.step1.status = results.step1.status === '❌' ? '❌' : '⚠️';
      (results.step1.status === '❌' ? results.step1.issues : results.step1.warnings).push('No goals selected');
    }
    
    if (state.solarData) {
      if (!state.solarData.sunHours || state.solarData.sunHours <= 0) {
        results.step1.warnings.push('Solar data missing sunHours');
      }
    } else {
      results.step1.warnings.push('Solar irradiance data not loaded');
    }
    
    // STEP 2 - Enhanced
    if (state.industry && state.industry !== '') {
      if (state.industryName && state.industryName !== '') {
        results.step2.status = '✅';
      } else {
        results.step2.status = '⚠️';
        results.step2.warnings.push('Industry name not set');
      }
    } else {
      results.step2.status = '❌';
      results.step2.issues.push('No industry selected');
    }
    
    // STEP 3 - Enhanced with more checks
    const fdKeys = Object.keys(state.facilityDetails || {}).filter(k => {
      const v = state.facilityDetails[k];
      return v !== undefined && v !== null && v !== 0 && v !== '';
    });
    const ucKeys = Object.keys(state.useCaseData || {});
    const ucValues = Object.values(state.useCaseData || {}).filter(v => 
      v !== undefined && v !== null && v !== 0 && v !== '' && (!Array.isArray(v) || v.length > 0)
    );
    
    if (ucKeys.length > 0 || fdKeys.length > 2) {
      if (ucValues.length === ucKeys.length) {
        results.step3.status = '✅';
      } else {
        results.step3.status = '⚠️';
        results.step3.warnings.push(`${ucKeys.length - ucValues.length} empty values in useCaseData`);
      }
    } else {
      results.step3.status = '❌';
      results.step3.issues.push('No facility data captured');
      if (ucKeys.length === 0) results.step3.issues.push('useCaseData is EMPTY');
      if (fdKeys.length <= 2) results.step3.issues.push('facilityDetails has only defaults');
    }
    
    // Industry-specific checks - Enhanced
    const allData = { ...state.facilityDetails, ...state.useCaseData };
    const industryChecks = {
      'data_center': ['rackCount', 'tier', 'squareFootage', 'estimatedAnnualKwh'],
      'hotel': ['roomCount', 'squareFootage', 'estimatedAnnualKwh'],
      'hospital': ['bedCount', 'squareFootage', 'estimatedAnnualKwh'],
      'manufacturing': ['squareFootage', 'estimatedAnnualKwh', 'peakDemandKw'],
      'office': ['squareFootage', 'estimatedAnnualKwh'],
      'retail': ['squareFootage', 'estimatedAnnualKwh'],
      'restaurant': ['squareFootage', 'estimatedAnnualKwh'],
      'warehouse': ['squareFootage', 'estimatedAnnualKwh'],
      'university': ['squareFootage', 'estimatedAnnualKwh'],
      'ev_charging_hub': ['squareFootage', 'estimatedAnnualKwh'],
      'car_wash': ['squareFootage', 'estimatedAnnualKwh'],
      'agriculture': ['squareFootage', 'estimatedAnnualKwh'],
    };
    
    if (industryChecks[state.industry]) {
      const missing = industryChecks[state.industry].filter(field => !allData[field]);
      if (missing.length > 0) {
        if (results.step3.status === '✅') results.step3.status = '⚠️';
        missing.forEach(field => {
          results.step3.warnings.push(`Missing recommended field: ${field}`);
        });
      }
    }
    
    // Check for estimatedAnnualKwh (critical for calculations)
    if (!allData.estimatedAnnualKwh || allData.estimatedAnnualKwh === 0) {
      if (results.step3.status === '✅') results.step3.status = '⚠️';
      results.step3.warnings.push('estimatedAnnualKwh is missing or zero (required for calculations)');
    }
    
    // STEP 4 - Enhanced
    if (state.selectedOptions && state.selectedOptions.length > 0) {
      results.step4.status = '✅';
      
      // Check for solar/EV/generator specifics
      if (state.selectedOptions.includes('solar')) {
        if (!state.solarTier) {
          results.step4.warnings.push('Solar selected but solarTier not set');
        }
        if (state.customSolarKw && state.customSolarKw <= 0) {
          results.step4.warnings.push('Custom solar kW is invalid');
        }
      }
      
      if (state.selectedOptions.includes('ev')) {
        if (!state.evTier && !state.customEvL2 && !state.customEvDcfc) {
          results.step4.warnings.push('EV selected but no EV configuration');
        }
      }
    } else {
      results.step4.status = '⚠️';
      results.step4.warnings.push('No options selected (solar/EV/generator)');
    }
    
    // Check opportunities object
    if (state.opportunities) {
      if (state.opportunities.wantsSolar && !state.selectedOptions?.includes('solar')) {
        results.step4.warnings.push('Opportunities.wantsSolar=true but solar not in selectedOptions');
      }
    }
    
    // STEP 5 - Enhanced
    if (state.selectedPowerLevel) {
      if (typeof state.selectedPowerLevel === 'object' && state.selectedPowerLevel.id) {
        results.step5.status = '✅';
      } else if (typeof state.selectedPowerLevel === 'string') {
        results.step5.status = '⚠️';
        results.step5.warnings.push('Power level is string, expected object');
      } else {
        results.step5.status = '⚠️';
        results.step5.warnings.push('Power level format unexpected');
      }
    } else {
      results.step5.status = '⚠️';
      results.step5.warnings.push('No power level selected');
    }
    
    // CALCULATIONS - Enhanced validation
    if (state.calculations) {
      const calc = state.calculations;
      
      // BESS validation
      if (calc.bessKW > 0 && calc.bessKWh > 0) {
        // Check ratio (typical: 1-4 hours duration)
        const duration = calc.bessKWh / calc.bessKW;
        if (duration < 0.5 || duration > 8) {
          results.calculations.warnings.push(`Unusual BESS duration: ${duration.toFixed(2)} hours`);
        }
        
        results.calculations.status = '✅';
      } else {
        results.calculations.status = '❌';
        if (calc.bessKW === 0) results.calculations.issues.push('BESS Power = 0 kW');
        if (calc.bessKWh === 0) results.calculations.issues.push('BESS Energy = 0 kWh');
      }
      
      // Financial validation
      if (calc.totalInvestment !== undefined) {
        if (calc.totalInvestment <= 0) {
          results.calculations.warnings.push('Total investment is zero or negative');
        }
        if (calc.totalInvestment > 10000000) {
          results.calculations.warnings.push(`Very large investment: $${calc.totalInvestment.toLocaleString()}`);
        }
      }
      
      if (calc.annualSavings !== undefined) {
        if (calc.annualSavings < 0) {
          results.calculations.warnings.push('Negative annual savings (may indicate calculation error)');
        }
      }
      
      if (calc.paybackYears !== undefined) {
        if (calc.paybackYears < 0) {
          results.calculations.issues.push('Negative payback years');
        } else if (calc.paybackYears > 30) {
          results.calculations.warnings.push(`Very long payback: ${calc.paybackYears} years`);
        }
      }
      
      // ITC validation
      if (calc.federalITC !== undefined && calc.federalITC > 0) {
        if (!calc.federalITCRate) {
          results.calculations.warnings.push('ITC amount present but rate not specified');
        }
        if (calc.netInvestment !== undefined && calc.netInvestment >= calc.totalInvestment) {
          results.calculations.warnings.push('Net investment should be less than total (after ITC)');
        }
      }
      
    } else {
      results.calculations.status = '❌';
      results.calculations.issues.push('No calculations object');
    }
    
    // STORAGE CHECK - New
    try {
      const stored = localStorage.getItem('merlin-wizard-state');
      const stepStored = sessionStorage.getItem('merlin-wizard-step');
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const storedKeys = Object.keys(parsed || {});
          const currentKeys = Object.keys(state);
          
          // Check if stored state matches current
          const missingInStored = currentKeys.filter(k => !(k in parsed));
          const extraInStored = storedKeys.filter(k => !(k in state));
          
          if (missingInStored.length > 0) {
            results.storage.warnings.push(`${missingInStored.length} fields in state but not in localStorage`);
          }
          if (extraInStored.length > 0) {
            results.storage.warnings.push(`${extraInStored.length} fields in localStorage but not in state`);
          }
          
          results.storage.status = '✅';
        } catch (e) {
          results.storage.status = '⚠️';
          results.storage.warnings.push('localStorage data is not valid JSON');
        }
      } else {
        results.storage.status = '⚠️';
        results.storage.warnings.push('State not persisted to localStorage');
      }
      
      if (stepStored) {
        const step = parseInt(stepStored, 10);
        if (step < 1 || step > 6) {
          results.storage.warnings.push(`Invalid step in sessionStorage: ${step}`);
        }
      }
    } catch (e) {
      results.storage.status = '❌';
      results.storage.issues.push(`Storage access error: ${e.message}`);
    }
    
    // DATA INTEGRITY CHECK - New
    const integrityIssues = [];
    
    // Check for NaN or Infinity
    function checkNumber(value, path) {
      if (typeof value === 'number') {
        if (isNaN(value)) integrityIssues.push(`NaN found at ${path}`);
        if (!isFinite(value)) integrityIssues.push(`Infinity found at ${path}`);
      }
    }
    
    function traverse(obj, path = '') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newPath = path ? `${path}.${key}` : key;
          const value = obj[key];
          
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            traverse(value, newPath);
          } else {
            checkNumber(value, newPath);
          }
        }
      }
    }
    
    traverse(state);
    
    if (integrityIssues.length > 0) {
      results.dataIntegrity.status = '❌';
      results.dataIntegrity.issues.push(...integrityIssues);
    } else {
      results.dataIntegrity.status = '✅';
    }
    
    // Check for circular references (would cause JSON.stringify to fail)
    try {
      JSON.stringify(state);
    } catch (e) {
      results.dataIntegrity.status = '❌';
      results.dataIntegrity.issues.push(`Circular reference detected: ${e.message}`);
    }
    
    // PERFORMANCE CHECK - New
    const perfWarnings = [];
    
    // Check object size
    const stateSize = JSON.stringify(state).length;
    if (stateSize > 100000) {
      perfWarnings.push(`Large state object: ${(stateSize / 1024).toFixed(2)} KB`);
    }
    
    // Check useCaseData size
    if (state.useCaseData) {
      const ucSize = Object.keys(state.useCaseData).length;
      if (ucSize > 100) {
        perfWarnings.push(`Large useCaseData: ${ucSize} fields`);
      }
    }
    
    if (perfWarnings.length > 0) {
      results.performance.status = '⚠️';
      results.performance.warnings.push(...perfWarnings);
    } else {
      results.performance.status = '✅';
    }
    
    return results;
  }
  
  // ============================================================================
  // ENHANCED OUTPUT
  // ============================================================================
  
  function printResults(state, results, method) {
    console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8B5CF6;');
    console.log('%c DATA FLOW CHECK', 'font-size: 14px; font-weight: bold;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8B5CF6;');
    console.log(`%cState found via: ${method}`, 'color: #9CA3AF; font-size: 11px;');
    
    const steps = [
      { name: 'Step 1: Location', key: 'step1', data: { zipCode: state.zipCode, state: state.state, city: state.city, goals: state.goals, solarData: state.solarData } },
      { name: 'Step 2: Industry', key: 'step2', data: { industry: state.industry, industryName: state.industryName } },
      { name: 'Step 3: Details', key: 'step3', data: { facilityDetails: state.facilityDetails, useCaseData: state.useCaseData } },
      { name: 'Step 4: Options', key: 'step4', data: { selectedOptions: state.selectedOptions, solarTier: state.solarTier, evTier: state.evTier, opportunities: state.opportunities } },
      { name: 'Step 5: System', key: 'step5', data: { selectedPowerLevel: state.selectedPowerLevel } },
      { name: 'Calculations', key: 'calculations', data: state.calculations },
      { name: 'Storage', key: 'storage', data: null },
      { name: 'Data Integrity', key: 'dataIntegrity', data: null },
      { name: 'Performance', key: 'performance', data: null },
    ];
    
    steps.forEach(step => {
      const r = results[step.key];
      console.log(`\n${r.status} ${step.name}`);
      if (r.issues.length > 0) {
        r.issues.forEach(i => console.log(`   %c❌ ${i}`, 'color: #EF4444;'));
      }
      if (r.warnings.length > 0) {
        r.warnings.forEach(w => console.log(`   %c⚠️  ${w}`, 'color: #F59E0B;'));
      }
      if (step.data && Object.keys(step.data).length > 0) {
        console.log('   Data:', step.data);
      }
    });
    
    // BESS-specific analysis
    console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8B5CF6;');
    console.log('%c🔋 BESS CALCULATION ANALYSIS', 'font-size: 14px; font-weight: bold;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8B5CF6;');
    
    const calc = state.calculations || {};
    const duration = calc.bessKW > 0 ? (calc.bessKWh / calc.bessKW).toFixed(2) : 'N/A';
    
    console.log(`\n   BESS Power:  ${calc.bessKW || 0} kW ${calc.bessKW === 0 ? '← ❌ PROBLEM!' : ''}`);
    console.log(`   BESS Energy: ${calc.bessKWh || 0} kWh ${calc.bessKWh === 0 ? '← ❌ PROBLEM!' : ''}`);
    console.log(`   Duration:    ${duration} hours`);
    console.log(`   Solar:       ${calc.solarKW || 0} kW`);
    console.log(`   Generator:   ${calc.generatorKW || 0} kW`);
    console.log(`   EV Chargers: ${calc.evChargers || 0}`);
    console.log(`   Investment:  $${(calc.totalInvestment || 0).toLocaleString()}`);
    console.log(`   Net (ITC):   $${(calc.netInvestment || calc.totalInvestment || 0).toLocaleString()}`);
    console.log(`   Savings:     $${(calc.annualSavings || 0).toLocaleString()}/yr`);
    console.log(`   Payback:     ${calc.paybackYears || 0} years`);
    console.log(`   ROI (10yr):  ${calc.tenYearROI ? calc.tenYearROI.toFixed(1) + '%' : 'N/A'}`);
    
    // Root cause analysis
    if (calc.bessKW === 0 || calc.bessKWh === 0) {
      console.log('\n%c⚠️  ROOT CAUSE ANALYSIS', 'font-size: 14px; font-weight: bold; color: #F59E0B;');
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #F59E0B;');
      
      const ucKeys = Object.keys(state.useCaseData || {});
      const fdKeys = Object.keys(state.facilityDetails || {});
      const allData = { ...state.facilityDetails, ...state.useCaseData };
      
      console.log(`\n   useCaseData keys: [${ucKeys.join(', ') || 'EMPTY'}]`);
      console.log(`   facilityDetails keys: [${fdKeys.join(', ')}]`);
      console.log(`   estimatedAnnualKwh: ${allData.estimatedAnnualKwh || 'MISSING'}`);
      console.log(`   peakDemandKw: ${allData.peakDemandKw || 'MISSING'}`);
      
      if (ucKeys.length === 0) {
        console.log('\n   %c💡 LIKELY CAUSE: Step 3 is writing to facilityDetails but', 'color: #F59E0B;');
        console.log('   %c   the calculation engine expects data in useCaseData.', 'color: #F59E0B;');
        console.log('\n   %c🔧 FIX: Update Step3Details.tsx to write to useCaseData', 'color: #10B981;');
      }
      
      if (!allData.estimatedAnnualKwh || allData.estimatedAnnualKwh === 0) {
        console.log('\n   %c💡 CRITICAL: estimatedAnnualKwh is missing or zero', 'color: #EF4444;');
        console.log('   %c   This is required for BESS sizing calculations', 'color: #EF4444;');
      }
    }
    
    // Final summary
    console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8B5CF6;');
    console.log('%c📋 SUMMARY', 'font-size: 14px; font-weight: bold;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8B5CF6;');
    
    const criticalIssues = Object.entries(results)
      .filter(([_, r]) => r.status === '❌')
      .map(([k, r]) => ({ step: k, issues: r.issues }));
    
    const warnings = Object.entries(results)
      .filter(([_, r]) => r.warnings.length > 0)
      .map(([k, r]) => ({ step: k, warnings: r.warnings }));
    
    if (criticalIssues.length === 0) {
      console.log('\n   %c✅ All critical checks passed!', 'color: #10B981; font-weight: bold;');
    } else {
      console.log(`\n   %c❌ ${criticalIssues.length} critical issue(s) found:`, 'color: #EF4444; font-weight: bold;');
      criticalIssues.forEach(({ step, issues }) => {
        issues.forEach(i => console.log(`      • [${step}] ${i}`));
      });
    }
    
    if (warnings.length > 0) {
      console.log(`\n   %c⚠️  ${warnings.reduce((sum, w) => sum + w.warnings.length, 0)} warning(s):`, 'color: #F59E0B; font-weight: bold;');
      warnings.forEach(({ step, warnings: ws }) => {
        ws.forEach(w => console.log(`      • [${step}] ${w}`));
      });
    }
    
    // Export state and results for further analysis
    window.__MERLIN_DEBUG_STATE__ = state;
    window.__MERLIN_DEBUG_RESULTS__ = results;
    
    console.log('\n   %c💾 State saved to window.__MERLIN_DEBUG_STATE__', 'color: #9CA3AF;');
    console.log('   %c💾 Results saved to window.__MERLIN_DEBUG_RESULTS__', 'color: #9CA3AF;');
    console.log('   %c📥 Run exportDiagnosticJSON() to download results as JSON', 'color: #3B82F6; font-weight: bold;');
  }
  
  // ============================================================================
  // JSON EXPORT FUNCTION
  // ============================================================================
  
  window.exportDiagnosticJSON = function() {
    const state = window.__MERLIN_DEBUG_STATE__;
    const results = window.__MERLIN_DEBUG_RESULTS__;
    
    if (!state || !results) {
      console.error('No diagnostic data found. Run the diagnostic script first.');
      return;
    }
    
    const exportData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      state: state,
      results: results,
      summary: {
        criticalIssues: Object.entries(results)
          .filter(([_, r]) => r.status === '❌')
          .map(([k, r]) => ({ step: k, issues: r.issues })),
        warnings: Object.entries(results)
          .filter(([_, r]) => r.warnings.length > 0)
          .map(([k, r]) => ({ step: k, warnings: r.warnings })),
        overallStatus: Object.values(results).every(r => r.status === '✅') ? 'PASS' : 
                       Object.values(results).some(r => r.status === '❌') ? 'FAIL' : 'WARN'
      }
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merlin-diagnostic-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('%c✅ Diagnostic data exported!', 'color: #10B981; font-weight: bold;');
  };
  
  // ============================================================================
  // RUN
  // ============================================================================
  
  const found = findWizardState();
  
  if (!found || !found.state) {
    console.log('%c\n❌ Could not find wizard state!', 'color: #EF4444; font-weight: bold;');
    console.log('%c\nPossible reasons:', 'color: #9CA3AF;');
    console.log('   1. You are not on the wizard page');
    console.log('   2. The wizard has not initialized yet');
    console.log('   3. React state is not accessible');
    console.log('   4. React version not supported');
    console.log('\n%cTry:', 'color: #9CA3AF;');
    console.log('   1. Navigate to Step 5 or Step 6 of the wizard');
    console.log('   2. Refresh the page and run this script again');
    console.log('   3. Check if React DevTools can see the state');
    console.log('   4. Try the bookmarklet version (see scripts/wizard-diagnostic-bookmarklet.js)');
    return;
  }
  
  console.log(`%c✅ Found wizard state via: ${found.method}`, 'color: #10B981;');
  
  const results = runDiagnostic(found.state);
  printResults(found.state, results, found.method);
  
})();
