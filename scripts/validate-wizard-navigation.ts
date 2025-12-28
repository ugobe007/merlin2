/**
 * WIZARD NAVIGATION VALIDATION SCRIPT
 * ===================================
 * 
 * Validates the code structure and logic for Step 2 → Step 3 navigation
 * Runs static analysis to verify the navigation flow is correct
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: string;
}

const results: ValidationResult[] = [];

function validateFile(filePath: string, description: string): boolean {
  const fullPath = join(process.cwd(), filePath);
  if (!existsSync(fullPath)) {
    results.push({
      test: description,
      status: 'FAIL',
      message: `File not found: ${filePath}`
    });
    return false;
  }
  results.push({
    test: description,
    status: 'PASS',
    message: `File exists: ${filePath}`
  });
  return true;
}

function validateCodePattern(filePath: string, pattern: RegExp, description: string, shouldExist: boolean = true): boolean {
  const fullPath = join(process.cwd(), filePath);
  if (!existsSync(fullPath)) {
    results.push({
      test: description,
      status: 'FAIL',
      message: `File not found: ${filePath}`
    });
    return false;
  }

  const content = readFileSync(fullPath, 'utf-8');
  const matches = content.match(pattern);

  if (shouldExist && !matches) {
    results.push({
      test: description,
      status: 'FAIL',
      message: `Pattern not found: ${pattern.toString()}`,
      details: `Expected to find pattern in ${filePath}`
    });
    return false;
  }

  if (!shouldExist && matches) {
    results.push({
      test: description,
      status: 'WARN',
      message: `Pattern found but should not exist: ${pattern.toString()}`,
      details: `Found in ${filePath}`
    });
    return false;
  }

  results.push({
    test: description,
    status: 'PASS',
    message: `Pattern ${shouldExist ? 'found' : 'not found'} as expected`
  });
  return true;
}

console.log('🔍 Running Wizard Navigation Validation...\n');

// Test 1: Verify critical files exist (Wizard V5)
console.log('📁 Checking file structure...');
validateFile('src/components/wizard/v5/WizardV5.tsx', 'WizardV5 component');
validateFile('src/components/wizard/v5/steps/Step1LocationGoals.tsx', 'Step1LocationGoals component');
validateFile('src/components/wizard/v5/steps/Step2IndustrySelect.tsx', 'Step2IndustrySelect component');
validateFile('src/components/wizard/v5/steps/Step3FacilityDetails.tsx', 'Step3FacilityDetails component');
validateFile('src/components/wizard/v5/steps/Step4MagicFit.tsx', 'Step4MagicFit component');
validateFile('src/components/wizard/v5/steps/Step5QuoteReview.tsx', 'Step5QuoteReview component');

// Test 2: Verify WizardV5 has proper step navigation
console.log('\n🔗 Checking WizardV5 navigation logic...');
validateCodePattern(
  'src/components/wizard/v5/WizardV5.tsx',
  /const nextStep = useCallback/,
  'WizardV5 has nextStep function'
);

validateCodePattern(
  'src/components/wizard/v5/WizardV5.tsx',
  /const goToStep = useCallback/,
  'WizardV5 has goToStep function'
);

validateCodePattern(
  'src/components/wizard/v5/WizardV5.tsx',
  /case 0:.*Step1LocationGoals/,
  'WizardV5 renders Step1LocationGoals for case 0'
);

validateCodePattern(
  'src/components/wizard/v5/WizardV5.tsx',
  /case 2:.*Step3FacilityDetails/,
  'WizardV5 renders Step3FacilityDetails for case 2'
);

// Test 3: Verify Step components have Continue buttons
console.log('\n🔗 Checking Step component navigation...');
validateCodePattern(
  'src/components/wizard/v5/steps/Step1LocationGoals.tsx',
  /onContinue/,
  'Step1LocationGoals has onContinue prop'
);

validateCodePattern(
  'src/components/wizard/v5/steps/Step2IndustrySelect.tsx',
  /onIndustrySelect/,
  'Step2IndustrySelect has onIndustrySelect prop'
);

// Test 5: Verify no accidental onOpenProQuote calls
console.log('\n🚨 Checking for accidental AdvancedConfigModal triggers...');
validateCodePattern(
  'src/components/wizard/sections/Step2IndustrySize.tsx',
  /onClick.*onOpenProQuote|onClick.*onOpenAdvanced/,
  'No buttons call onOpenProQuote in Step2IndustrySize',
  false // Should NOT exist
);

// Test 6: Verify advanceToSection implementation
console.log('\n🔗 Checking advanceToSection implementation...');
validateCodePattern(
  'src/components/wizard/hooks/useStreamlinedWizard.ts',
  /const advanceToSection = useCallback\(\(index: number\) =>/,
  'advanceToSection function exists'
);

validateCodePattern(
  'src/components/wizard/hooks/useStreamlinedWizard.ts',
  /setCurrentSection\(index\)/,
  'advanceToSection sets currentSection'
);

// Test 7: Verify MerlinGreeting in all steps
console.log('\n🎨 Checking MerlinGreeting components...');
validateCodePattern(
  'src/components/wizard/sections/Step2IndustrySize.tsx',
  /<MerlinGreeting/,
  'Step2IndustrySize has MerlinGreeting'
);

validateCodePattern(
  'src/components/wizard/sections/Step3FacilityDetails.tsx',
  /<MerlinGreeting/,
  'Step3FacilityDetails has MerlinGreeting'
);

validateCodePattern(
  'src/components/wizard/sections/Step4MagicFit.tsx',
  /<MerlinGreeting/,
  'Step4MagicFit has MerlinGreeting'
);

// Test 8: Verify console logging for debugging
console.log('\n📊 Checking debug console logs...');
validateCodePattern(
  'src/components/wizard/sections/Step2IndustrySize.tsx',
  /console\.log.*handleContinue/,
  'handleContinue has debug logging'
);

validateCodePattern(
  'src/components/wizard/StreamlinedWizard.tsx',
  /console\.log.*Step 2 onContinue/,
  'StreamlinedWizard has debug logging'
);

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION RESULTS');
console.log('='.repeat(60) + '\n');

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const warnings = results.filter(r => r.status === 'WARN').length;

results.forEach(result => {
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${result.test}`);
  console.log(`   ${result.message}`);
  if (result.details) {
    console.log(`   Details: ${result.details}`);
  }
  console.log('');
});

console.log('='.repeat(60));
console.log(`Summary: ${passed} PASSED, ${failed} FAILED, ${warnings} WARNINGS`);
console.log('='.repeat(60) + '\n');

if (failed > 0) {
  console.log('❌ VALIDATION FAILED - Please fix the issues above\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  VALIDATION PASSED WITH WARNINGS\n');
  process.exit(0);
} else {
  console.log('✅ VALIDATION PASSED - All checks successful\n');
  process.exit(0);
}

