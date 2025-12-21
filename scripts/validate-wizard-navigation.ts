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

// Test 1: Verify critical files exist
console.log('📁 Checking file structure...');
validateFile('src/components/wizard/sections/Step2IndustrySize.tsx', 'Step2IndustrySize component');
validateFile('src/components/wizard/sections/Step3FacilityDetails.tsx', 'Step3FacilityDetails component');
validateFile('src/components/wizard/StreamlinedWizard.tsx', 'StreamlinedWizard component');
validateFile('src/components/wizard/shared/FloatingNavigationArrows.tsx', 'FloatingNavigationArrows component');
validateFile('src/components/wizard/hooks/useStreamlinedWizard.ts', 'useStreamlinedWizard hook');

// Test 2: Verify Step2IndustrySize has handleContinue
console.log('\n🔗 Checking Step2IndustrySize navigation logic...');
validateCodePattern(
  'src/components/wizard/sections/Step2IndustrySize.tsx',
  /const handleContinue = \(\) =>/,
  'handleContinue function exists'
);

validateCodePattern(
  'src/components/wizard/sections/Step2IndustrySize.tsx',
  /onContinue\(\)/,
  'handleContinue calls onContinue'
);

validateCodePattern(
  'src/components/wizard/sections/Step2IndustrySize.tsx',
  /onForward=\{handleContinue\}/,
  'FloatingNavigationArrows uses handleContinue'
);

// Test 3: Verify StreamlinedWizard has correct onContinue callback
console.log('\n🔗 Checking StreamlinedWizard navigation callback...');
validateCodePattern(
  'src/components/wizard/StreamlinedWizard.tsx',
  /onContinue=\{\(\) =>/,
  'Step2IndustrySize has onContinue callback'
);

validateCodePattern(
  'src/components/wizard/StreamlinedWizard.tsx',
  /wizard\.advanceToSection\(2\)/,
  'onContinue calls advanceToSection(2)'
);

// Test 4: Verify Step3FacilityDetails visibility logic
console.log('\n🔗 Checking Step3FacilityDetails visibility...');
validateCodePattern(
  'src/components/wizard/StreamlinedWizard.tsx',
  /isHidden=\{wizard\.currentSection !== 2\}/,
  'Step3FacilityDetails shows when currentSection === 2'
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

