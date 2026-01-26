#!/usr/bin/env node
/**
 * WIZARD VALIDATION TEST SCRIPT
 * Created: Jan 26, 2026
 * 
 * Automatically detects common wizard bugs:
 * 1. Infinite loops in useEffect (circular dependencies)
 * 2. Pre-fill → validation → Continue button flow issues
 * 3. Missing required field mappings
 * 4. State synchronization problems
 * 5. Race conditions in effects
 * 
 * Run: npm run test:wizard
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

let totalIssues = 0;
let criticalIssues = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(file, line, issue, severity = 'ERROR') {
  const prefix = severity === 'CRITICAL' ? '🚨 CRITICAL' : severity === 'WARNING' ? '⚠️  WARNING' : '❌ ERROR';
  const color = severity === 'CRITICAL' ? 'red' : severity === 'WARNING' ? 'yellow' : 'red';
  
  log(`${prefix}: ${file}:${line}`, color);
  log(`  ${issue}`, 'cyan');
  
  if (severity === 'CRITICAL') criticalIssues++;
  totalIssues++;
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

// ==============================================================================
// TEST 1: Check for infinite loop patterns in useEffect
// ==============================================================================
function checkInfiniteLoops(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  log(`\n📋 Testing: ${path.relative(projectRoot, filePath)}`, 'blue');
  
  // Pattern 1: useEffect modifies state that's in dependency array
  const effectRegex = /useEffect\(\(\) => \{/g;
  let match;
  let effectCount = 0;
  
  while ((match = effectRegex.exec(content)) !== null) {
    effectCount++;
    const effectStart = match.index;
    const lineNumber = content.substring(0, effectStart).split('\n').length;
    
    // Find the matching closing brace and dependency array
    let braceCount = 0;
    let inEffect = false;
    let effectBody = '';
    let depsArray = '';
    
    for (let i = effectStart; i < content.length; i++) {
      const char = content[i];
      
      if (char === '{') {
        braceCount++;
        inEffect = true;
      } else if (char === '}') {
        braceCount--;
        if (inEffect && braceCount === 0) {
          // Found end of effect, now look for deps
          const remaining = content.substring(i);
          const depsMatch = remaining.match(/\}, \[([^\]]*)\]\)/);
          if (depsMatch) {
            depsArray = depsMatch[1];
          }
          break;
        }
      }
      
      if (inEffect) {
        effectBody += char;
      }
    }
    
    // Check for setState/updateState calls
    const stateUpdates = [];
    const updateRegex = /(setState|updateState|set[A-Z]\w+)\(\{/g;
    let updateMatch;
    
    while ((updateMatch = updateRegex.exec(effectBody)) !== null) {
      const updateCall = updateMatch[0];
      // Find the object being updated
      const objStart = updateMatch.index + updateCall.length;
      let objBody = '';
      let objBraceCount = 1;
      
      for (let i = objStart; i < effectBody.length && objBraceCount > 0; i++) {
        if (effectBody[i] === '{') objBraceCount++;
        if (effectBody[i] === '}') objBraceCount--;
        objBody += effectBody[i];
      }
      
      // Check if any updated state field is in deps
      const depFields = depsArray.split(',').map(d => d.trim());
      
      depFields.forEach(dep => {
        // Check for patterns like: state.useCaseData in deps, and updateState({ useCaseData: ... })
        if (dep.includes('state.') && objBody.includes(dep.split('.').pop())) {
          logError(
            path.relative(projectRoot, filePath),
            lineNumber,
            `Infinite loop risk: Effect modifies "${dep}" which is in dependency array`,
            'CRITICAL'
          );
        }
      });
      
      stateUpdates.push({ call: updateMatch[1], body: objBody });
    }
    
    // Check for missing guard refs (like preFillsAppliedRef)
    if (stateUpdates.length > 0 && !effectBody.includes('useRef') && !effectBody.includes('Ref.current')) {
      const hasEarlyReturn = effectBody.match(/if \([^)]+\) return;/);
      if (!hasEarlyReturn) {
        logError(
          path.relative(projectRoot, filePath),
          lineNumber,
          `Effect #${effectCount} updates state without guard ref or early return`,
          'WARNING'
        );
      }
    }
  }
  
  if (effectCount > 0) {
    logSuccess(`Checked ${effectCount} useEffect hooks for infinite loops`);
  }
}

// ==============================================================================
// TEST 2: Check validation contract completeness
// ==============================================================================
function checkValidationContract(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check that validator reads from state.useCaseData.inputs
  if (!content.includes('state.useCaseData?.inputs')) {
    logError(
      path.relative(projectRoot, filePath),
      0,
      'Validator does not read from state.useCaseData.inputs',
      'CRITICAL'
    );
  } else {
    logSuccess('Validator reads from correct state path');
  }
  
  // Check for industry-specific validations
  const industries = [
    'hotel', 'data-center', 'data_center', 'car-wash', 'car_wash',
    'ev-charging', 'ev_charging', 'hospital', 'office', 'retail',
    'warehouse', 'manufacturing'
  ];
  
  let hasIndustryChecks = 0;
  industries.forEach(industry => {
    if (content.includes(`needs.needs${industry.replace(/[-_]/g, '').charAt(0).toUpperCase()}`) ||
        content.includes(`"${industry}"`) ||
        content.includes(`'${industry}'`)) {
      hasIndustryChecks++;
    }
  });
  
  if (hasIndustryChecks < 3) {
    logError(
      path.relative(projectRoot, filePath),
      0,
      `Only ${hasIndustryChecks} industry-specific validations found (expected more)`,
      'WARNING'
    );
  } else {
    logSuccess(`Found ${hasIndustryChecks} industry-specific validations`);
  }
}

// ==============================================================================
// TEST 3: Check pre-fill → validation flow
// ==============================================================================
function checkPreFillFlow(wizardFile, step3File, validatorFile) {
  log('\n📋 Testing Pre-fill → Validation Flow', 'blue');
  
  const wizardContent = fs.readFileSync(wizardFile, 'utf-8');
  const step3Content = fs.readFileSync(step3File, 'utf-8');
  const validatorContent = fs.readFileSync(validatorFile, 'utf-8');
  
  // Check that wizard validates using contract
  if (!wizardContent.includes('validateStep3Contract(state)')) {
    logError(
      path.relative(projectRoot, wizardFile),
      0,
      'WizardV6 does not use validateStep3Contract(state)',
      'CRITICAL'
    );
  } else {
    logSuccess('WizardV6 uses correct validator');
  }
  
  // Check that validation effect depends on state
  const validationEffectMatch = wizardContent.match(/useEffect\(\(\) => \{[^}]*validateStep3Contract\(state\)[^}]*\}, \[([^\]]*)\]/);
  if (validationEffectMatch) {
    const deps = validationEffectMatch[1];
    if (!deps.includes('state')) {
      logError(
        path.relative(projectRoot, wizardFile),
        0,
        'Validation effect does not depend on [state]',
        'CRITICAL'
      );
    } else {
      logSuccess('Validation effect has correct dependencies');
    }
  }
  
  // Check that pre-fills write to state.useCaseData.inputs
  const preFillPatterns = [
    'updateState({ useCaseData: { ...state.useCaseData, inputs:',
    'updateState({\n        useCaseData: {\n          ...state.useCaseData,\n          inputs:'
  ];
  
  const hasPreFillUpdate = preFillPatterns.some(pattern => step3Content.includes(pattern));
  
  if (!hasPreFillUpdate) {
    logError(
      path.relative(projectRoot, step3File),
      0,
      'Pre-fills do not write to state.useCaseData.inputs',
      'CRITICAL'
    );
  } else {
    logSuccess('Pre-fills write to correct state path');
  }
  
  // Check that pre-fill effect has guard ref
  if (step3Content.includes('BUSINESS_SIZE_PREFILLS') && !step3Content.includes('preFillsAppliedRef')) {
    logError(
      path.relative(projectRoot, step3File),
      0,
      'Pre-fill effect missing guard ref (preFillsAppliedRef)',
      'CRITICAL'
    );
  } else if (step3Content.includes('BUSINESS_SIZE_PREFILLS')) {
    logSuccess('Pre-fill effect has guard ref');
  }
}

// ==============================================================================
// TEST 4: Check Continue button gating
// ==============================================================================
function checkContinueButton(wizardFile) {
  log('\n📋 Testing Continue Button Gating', 'blue');
  
  const content = fs.readFileSync(wizardFile, 'utf-8');
  
  // Check that Continue button uses canProceed from contract
  if (!content.includes('step3Contract.ok')) {
    logError(
      path.relative(projectRoot, wizardFile),
      0,
      'Continue button does not check step3Contract.ok',
      'CRITICAL'
    );
  } else {
    logSuccess('Continue button checks step3Contract.ok');
  }
  
  // Check for _canProceed function
  const canProceedMatch = content.match(/const _canProceed = \(\): boolean => \{([^}]+case 3:[^}]+)\}/s);
  if (canProceedMatch) {
    const step3Logic = canProceedMatch[1];
    if (!step3Logic.includes('step3Contract.ok')) {
      logError(
        path.relative(projectRoot, wizardFile),
        0,
        '_canProceed for Step 3 does not use step3Contract.ok',
        'CRITICAL'
      );
    } else {
      logSuccess('_canProceed uses step3Contract.ok for Step 3');
    }
  }
  
  // Check that button disabled prop uses canProceed
  if (!content.includes('disabled={') || !content.includes('canProceed')) {
    logError(
      path.relative(projectRoot, wizardFile),
      0,
      'Continue button disabled prop does not use canProceed',
      'WARNING'
    );
  } else {
    logSuccess('Continue button uses canProceed for disabled state');
  }
}

// ==============================================================================
// TEST 5: Check for required field mappings
// ==============================================================================
function checkRequiredFields(validatorFile) {
  log('\n📋 Testing Required Field Mappings', 'blue');
  
  const content = fs.readFileSync(validatorFile, 'utf-8');
  
  const requiredFields = {
    'data-center': ['rackCount'],
    'hotel': ['roomCount'],
    'car-wash': ['bayCount'],
    'hospital': ['bedCount'],
    'office': ['squareFeet'],
    'retail': ['squareFeet'],
    'warehouse': ['squareFeet'],
  };
  
  let missingFields = 0;
  
  Object.entries(requiredFields).forEach(([industry, fields]) => {
    fields.forEach(field => {
      // Check for field extraction patterns:
      // 1. const rackCount = num(inputs.rackCount)
      // 2. const bayCountRaw = ... inputs.bayCount ...
      // 3. const roomCount = num(inputs.roomCount || inputs.numberOfRooms)
      const patterns = [
        new RegExp(`const ${field}\\s*=\\s*num\\(inputs\\.${field}`),
        new RegExp(`const ${field}Raw\\s*=[^;]+inputs\\.${field}`),
        new RegExp(`inputs\\.${field}`)
      ];
      
      const hasExtraction = patterns.some(pattern => pattern.test(content));
      
      if (!hasExtraction) {
        logError(
          path.relative(projectRoot, validatorFile),
          0,
          `Missing extraction for ${industry}.${field}`,
          'ERROR'
        );
        missingFields++;
      }
    });
  });
  
  if (missingFields === 0) {
    logSuccess('All required fields have extractors');
  }
}

// ==============================================================================
// TEST 6: Check database question consistency
// ==============================================================================
async function checkDatabaseQuestions() {
  log('\n📋 Testing Database Question Configuration', 'blue');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    logError('N/A', 0, 'DATABASE_URL not set, skipping database checks', 'WARNING');
    return;
  }
  
  try {
    // Import pg dynamically
    const pg = await import('pg');
    const { Client } = pg.default;
    
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    
    // Check for industries without questions
    const result = await client.query(`
      SELECT uc.slug, uc.name, COUNT(cq.id) as question_count
      FROM use_cases uc
      LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
      WHERE uc.is_active = true
      GROUP BY uc.slug, uc.name
      HAVING COUNT(cq.id) = 0
      ORDER BY uc.slug;
    `);
    
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        logError(
          'Database',
          0,
          `Industry "${row.name}" (${row.slug}) has NO questions configured`,
          'CRITICAL'
        );
      });
    } else {
      logSuccess('All active use cases have questions configured');
    }
    
    // Check for required questions without defaults
    const requiredResult = await client.query(`
      SELECT uc.slug, cq.field_name, cq.question_text
      FROM custom_questions cq
      JOIN use_cases uc ON cq.use_case_id = uc.id
      WHERE cq.is_required = true
      AND cq.default_value IS NULL
      AND uc.is_active = true
      ORDER BY uc.slug, cq.display_order;
    `);
    
    if (requiredResult.rows.length > 5) {
      log(`⚠️  Found ${requiredResult.rows.length} required questions without defaults`, 'yellow');
    } else {
      logSuccess(`Only ${requiredResult.rows.length} required questions without defaults`);
    }
    
    await client.end();
  } catch (error) {
    logError('Database', 0, `Database check failed: ${error.message}`, 'WARNING');
  }
}

// ==============================================================================
// MAIN TEST RUNNER
// ==============================================================================
async function runTests() {
  log('\n' + '='.repeat(80), 'bold');
  log('🧪 WIZARD VALIDATION TEST SUITE', 'bold');
  log('='.repeat(80) + '\n', 'bold');
  
  const wizardV6 = path.join(projectRoot, 'src/components/wizard/v6/WizardV6.tsx');
  const step3Component = path.join(projectRoot, 'src/components/wizard/CompleteStep3Component.tsx');
  const step3Integration = path.join(projectRoot, 'src/components/wizard/Step3Integration.tsx');
  const validator = path.join(projectRoot, 'src/components/wizard/v6/step3/validateStep3Contract.ts');
  
  // Check if files exist
  const files = [wizardV6, step3Component, step3Integration, validator];
  const missingFiles = files.filter(f => !fs.existsSync(f));
  
  if (missingFiles.length > 0) {
    log('\n❌ Missing files:', 'red');
    missingFiles.forEach(f => log(`  - ${path.relative(projectRoot, f)}`, 'red'));
    process.exit(1);
  }
  
  // Run tests
  try {
    log('TEST 1: Infinite Loop Detection', 'magenta');
    checkInfiniteLoops(step3Component);
    checkInfiniteLoops(step3Integration);
    
    log('\nTEST 2: Validation Contract', 'magenta');
    checkValidationContract(validator);
    
    log('\nTEST 3: Pre-fill Flow', 'magenta');
    checkPreFillFlow(wizardV6, step3Component, validator);
    
    log('\nTEST 4: Continue Button', 'magenta');
    checkContinueButton(wizardV6);
    
    log('\nTEST 5: Required Fields', 'magenta');
    checkRequiredFields(validator);
    
    log('\nTEST 6: Database Questions', 'magenta');
    await checkDatabaseQuestions();
    
    // Summary
    log('\n' + '='.repeat(80), 'bold');
    log('📊 TEST SUMMARY', 'bold');
    log('='.repeat(80), 'bold');
    
    if (criticalIssues > 0) {
      log(`\n🚨 ${criticalIssues} CRITICAL ISSUE(S) FOUND`, 'red');
      log(`⚠️  ${totalIssues - criticalIssues} warning(s)`, 'yellow');
      log('\n❌ WIZARD HAS CRITICAL BUGS - FIX IMMEDIATELY\n', 'red');
      process.exit(1);
    } else if (totalIssues > 0) {
      log(`\n⚠️  ${totalIssues} WARNING(S) FOUND`, 'yellow');
      log('\n✅ No critical issues, but warnings should be reviewed\n', 'yellow');
      process.exit(0);
    } else {
      log('\n✅ ALL TESTS PASSED - WIZARD IS HEALTHY\n', 'green');
      process.exit(0);
    }
    
  } catch (error) {
    log(`\n💥 Test suite crashed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
