#!/usr/bin/env node

/**
 * Quick Link Validator
 * Checks for common issues without full Playwright setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running Quick Link Validation...\n');

let issuesFound = 0;

// 1. Check for bad localhost URLs
console.log('1️⃣ Checking for bad localhost URLs...');
const filesToCheck = [
  'src/components/sections/HeroSection.tsx',
  'src/components/hero/HeroSection.tsx',
  'src/components/BessQuoteBuilder.tsx',
  'src/App.tsx'
];

const badPatterns = [
  /localhost:5178/g,
  /localhost:5179/g,
  /localhost:3000/g,
  /localhost:8080/g
];

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    badPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        console.log(`   ❌ Found bad URL pattern ${pattern} in ${file}`);
        issuesFound++;
      }
    });
  }
});

if (issuesFound === 0) {
  console.log('   ✅ No bad localhost URLs found\n');
} else {
  console.log('');
}

// 2. Check for useCaseData state (single source of truth for wizard answers)
console.log('2️⃣ Checking for useCaseData state (single source of truth)...');
const wizardFile = path.join(process.cwd(), 'src/components/wizard/SmartWizardV2.tsx');
if (fs.existsSync(wizardFile)) {
  const content = fs.readFileSync(wizardFile, 'utf8');
  // Check that useCaseData exists as single source of truth
  // and that Step2_UseCase receives it via answers prop
  const hasUseCaseData = content.includes('const [useCaseData, setUseCaseData] = useState');
  const hasAnswersProp = content.includes('answers={useCaseData}');
  const hasUpdateProp = content.includes('onUpdateAnswers={setUseCaseData}');
  
  if (hasUseCaseData && hasAnswersProp && hasUpdateProp) {
    console.log('   ✅ useCaseData is single source of truth for wizard answers\n');
  } else {
    console.log('   ❌ useCaseData state configuration incorrect\n');
    if (!hasUseCaseData) console.log('      - Missing useCaseData state');
    if (!hasAnswersProp) console.log('      - Step2_UseCase not receiving useCaseData via answers prop');
    if (!hasUpdateProp) console.log('      - Step2_UseCase not updating via setUseCaseData');
    issuesFound++;
  }
}

// 3. Check for null safety in Step 2 rendering
console.log('3️⃣ Checking for Step 2 null safety...');
if (fs.existsSync(wizardFile)) {
  const content = fs.readFileSync(wizardFile, 'utf8');
  if (content.includes('if (!useCaseDetailsRef.current)')) {
    console.log('   ✅ Step 2 has null safety check\n');
  } else {
    console.log('   ⚠️  Step 2 may be missing null safety check\n');
    issuesFound++;
  }
}

// 4. Check Real World Applications have console.log debugging
console.log('4️⃣ Checking Real World Applications debugging...');
const heroFile = path.join(process.cwd(), 'src/components/sections/HeroSection.tsx');
if (fs.existsSync(heroFile)) {
  const content = fs.readFileSync(heroFile, 'utf8');
  const hasHotelLog = content.includes('Hotel card clicked');
  const hasDCLog = content.includes('Data Center card clicked');
  const hasEVLog = content.includes('EV Charging card clicked');
  
  if (hasHotelLog && hasDCLog && hasEVLog) {
    console.log('   ✅ All Real World Application cards have debug logging\n');
  } else {
    console.log('   ❌ Missing debug logs:');
    if (!hasHotelLog) console.log('      - Hotel card');
    if (!hasDCLog) console.log('      - Data Center card');
    if (!hasEVLog) console.log('      - EV Charging card');
    console.log('');
    issuesFound++;
  }
}

// 5. Check for Three Pillars color updates
console.log('5️⃣ Checking Three Pillars colors...');
if (fs.existsSync(heroFile)) {
  const content = fs.readFileSync(heroFile, 'utf8');
  const hasPurple = content.includes('purple-600') && content.includes('purple-900');
  const hasSky = content.includes('sky-300') && content.includes('blue-500');
  const hasAmber = content.includes('amber-400') && content.includes('orange-600');
  
  if (hasPurple && hasSky && hasAmber) {
    console.log('   ✅ Three Pillars have correct gradient colors\n');
  } else {
    console.log('   ❌ Three Pillars missing requested colors:');
    if (!hasPurple) console.log('      - Deep Purple gradient');
    if (!hasSky) console.log('      - Light Blue gradient');
    if (!hasAmber) console.log('      - Amber Orange gradient');
    console.log('');
    issuesFound++;
  }
}

// 6. Check Merlin clickability
console.log('6️⃣ Checking Merlin mascot clickability...');
if (fs.existsSync(heroFile)) {
  const content = fs.readFileSync(heroFile, 'utf8');
  const hasOnClick = content.includes('onClick={() => setShowAbout(true)}');
  const hasCursor = content.includes('cursor-pointer');
  const hasTooltip = content.includes('Merlin') && content.includes('Magic');
  
  if (hasOnClick && hasCursor && hasTooltip) {
    console.log('   ✅ Merlin is clickable with tooltip\n');
  } else {
    console.log('   ❌ Merlin mascot issues:');
    if (!hasOnClick) console.log('      - Missing onClick handler');
    if (!hasCursor) console.log('      - Missing cursor-pointer');
    if (!hasTooltip) console.log('      - Missing Merlin Magic tooltip');
    console.log('');
    issuesFound++;
  }
}

// 7. Check for "Start Saving with SmartWizard" text
console.log('7️⃣ Checking hero section messaging...');
if (fs.existsSync(heroFile)) {
  const content = fs.readFileSync(heroFile, 'utf8');
  const hasCorrectHeading = content.includes('Start Saving with SmartWizard');
  
  if (hasCorrectHeading) {
    console.log('   ✅ Hero section has correct SmartWizard messaging\n');
  } else {
    console.log('   ❌ Hero section missing "Start Saving with SmartWizard" heading\n');
    issuesFound++;
  }
}

// Summary
console.log('═'.repeat(60));
if (issuesFound === 0) {
  console.log('✅ All validation checks passed!');
  console.log('   No critical issues found.');
  process.exit(0);
} else {
  console.log(`❌ Found ${issuesFound} issue(s)`);
  console.log('   Please review and fix before proceeding.');
  process.exit(1);
}
