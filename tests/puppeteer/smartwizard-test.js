/**
 * SmartWizard V3 - Comprehensive Puppeteer Test
 * ==============================================
 * Tests REAL user interactions to catch ALL bugs
 * 
 * Run: node tests/puppeteer/smartwizard-test.js
 */

import puppeteer from 'puppeteer';

const TEST_URL = process.env.TEST_URL || 'http://localhost:5177';
const HEADLESS = true; // Set to true for CI, false to watch

// Helper to take screenshot on failure
async function screenshot(page, name) {
  await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}.png`);
}

// Helper to check for duplicate buttons
async function checkDuplicateButtons(page, stepName) {
  const nextButtons = await page.$$('button:has-text("Next"), button:has-text("Continue")');
  const backButtons = await page.$$('button:has-text("Back")');
  
  console.log(`\n🔍 ${stepName}:`);
  console.log(`  - Next/Continue buttons: ${nextButtons.length}`);
  console.log(`  - Back buttons: ${backButtons.length}`);
  
  if (nextButtons.length > 1) {
    console.error(`❌ DUPLICATE NEXT BUTTONS on ${stepName}!`);
    await screenshot(page, `duplicate-next-${stepName}`);
    return false;
  }
  
  if (backButtons.length > 1) {
    console.error(`❌ DUPLICATE BACK BUTTONS on ${stepName}!`);
    await screenshot(page, `duplicate-back-${stepName}`);
    return false;
  }
  
  console.log(`✅ No duplicate buttons on ${stepName}`);
  return true;
}

// Helper to check for NaN anywhere on page
async function checkForNaN(page, stepName) {
  const nanElements = await page.$$('text=NaN');
  if (nanElements.length > 0) {
    console.error(`❌ NaN FOUND on ${stepName}!`);
    await screenshot(page, `nan-error-${stepName}`);
    return false;
  }
  console.log(`✅ No NaN errors on ${stepName}`);
  return true;
}

async function runTest() {
  console.log('\n🚀 Starting SmartWizard V3 Comprehensive Test\n');
  console.log('='.repeat(60));
  
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    slowMo: 100, // Slow down by 100ms for visibility
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Track test results
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  try {
    // ========================================
    // TEST 1: Load Homepage
    // ========================================
    console.log('\n📋 TEST 1: Load Homepage');
    await page.goto(TEST_URL, { waitUntil: 'networkidle0' });
    console.log('✅ Homepage loaded');
    results.passed.push('Homepage load');

    // ========================================
    // TEST 2: Open Smart Wizard
    // ========================================
    console.log('\n📋 TEST 2: Open Smart Wizard');
    
    // Try multiple selectors for the wizard button
    const wizardButton = await page.waitForSelector(
      'button:has-text("Smart Wizard"), [data-testid="open-wizard"]',
      { timeout: 5000 }
    );
    
    if (!wizardButton) {
      throw new Error('Smart Wizard button not found!');
    }
    
    await wizardButton.click();
    await page.waitForTimeout(1000);
    
    const wizardModal = await page.$('text=Smart Wizard');
    if (!wizardModal) {
      throw new Error('Smart Wizard modal did not open!');
    }
    
    console.log('✅ Smart Wizard opened');
    results.passed.push('Open wizard');

    // ========================================
    // TEST 3: Skip Intro (if present)
    // ========================================
    console.log('\n📋 TEST 3: Handle Intro Screen');
    
    const startButton = await page.$('button:has-text("Start"), button:has-text("Get Started")');
    if (startButton) {
      await startButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Skipped intro');
    } else {
      console.log('ℹ️  No intro screen');
    }
    results.passed.push('Handle intro');

    // ========================================
    // TEST 4: Step 0 - Select Office Building
    // ========================================
    console.log('\n📋 TEST 4: Step 0 - Select Office Building');
    
    await checkDuplicateButtons(page, 'Step 0');
    await checkForNaN(page, 'Step 0');
    
    // Find Office Building option
    const officeButton = await page.waitForSelector(
      'button:has-text("Office"), [data-testid="use-case-office"]',
      { timeout: 5000 }
    );
    
    await officeButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Office Building selected');
    
    // Click Next/Continue
    const nextButton = await page.$('button:has-text("Next"), button:has-text("Continue")');
    if (nextButton) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Advanced to Step 1');
      results.passed.push('Step 0 - Select use case');
    } else {
      throw new Error('Next button not found on Step 0');
    }

    // ========================================
    // TEST 5: Step 1 - Answer Questions
    // ========================================
    console.log('\n📋 TEST 5: Step 1 - Answer Questions');
    
    await checkDuplicateButtons(page, 'Step 1');
    await checkForNaN(page, 'Step 1');
    
    // Fill square footage
    const sqFtInput = await page.$('input[name="squareFootage"], input[placeholder*="square"]');
    if (sqFtInput) {
      await sqFtInput.type('50000');
      console.log('✅ Entered square footage: 50,000');
    } else {
      results.warnings.push('Square footage input not found');
    }
    
    // Fill monthly bill
    const billInput = await page.$('input[name="monthlyElectricBill"], input[placeholder*="bill"]');
    if (billInput) {
      await billInput.type('2500');
      console.log('✅ Entered monthly bill: $2,500');
    } else {
      results.warnings.push('Monthly bill input not found');
    }
    
    // Select primary goal if present
    const goalSelect = await page.$('select[name="primaryGoals"]');
    if (goalSelect) {
      await goalSelect.select('save-money');
      console.log('✅ Selected goal: Save Money');
    }
    
    // Check for grid reliability question
    const gridSelect = await page.$('select[name="gridReliability"]');
    if (gridSelect) {
      await gridSelect.select('reliable');
      console.log('✅ Grid reliability question found and answered');
      results.passed.push('Grid reliability question exists');
    } else {
      console.warn('⚠️  MISSING: Grid reliability question not found');
      results.warnings.push('Grid reliability question missing');
    }
    
    await page.waitForTimeout(500);
    
    // Click Next
    const step1Next = await page.$('button:has-text("Next"), button:has-text("Continue")');
    if (step1Next) {
      await step1Next.click();
      await page.waitForTimeout(1000);
      console.log('✅ Advanced to Step 2');
      results.passed.push('Step 1 - Answer questions');
    } else {
      throw new Error('Next button not found on Step 1');
    }

    // ========================================
    // TEST 6: Step 2/3 - Battery Configuration
    // ========================================
    console.log('\n📋 TEST 6: Step 2 - Battery Configuration');
    
    await checkDuplicateButtons(page, 'Step 2');
    await checkForNaN(page, 'Step 2');
    
    // Check if battery values are displayed
    const batteryText = await page.$('text=/0\\.\\d+ MW|\\d+\\.\\d+ kW|Battery/');
    if (batteryText) {
      const text = await page.evaluate(el => el.textContent, batteryText);
      console.log(`✅ Battery configuration visible: ${text}`);
      
      // Verify NOT 1.0 MW (should be ~0.3 MW for 50K sq ft)
      if (text.includes('1.0 MW') || text.includes('1 MW')) {
        console.error('❌ MATH ERROR: Battery shows 1 MW for 50K sq ft (should be ~0.3 MW)');
        results.failed.push('Math verification - battery size incorrect');
      } else if (text.includes('0.3') || text.includes('0.2') || text.includes('0.4') || text.includes('300')) {
        console.log('✅ Math appears correct (~0.3 MW for 50K sq ft)');
        results.passed.push('Math verification - battery size');
      }
    } else {
      results.warnings.push('Battery configuration not clearly visible');
    }
    
    // Check for Power Status Bar
    const powerStatusBar = await page.$('[data-testid="power-status-bar"], text=Power Configuration');
    if (powerStatusBar) {
      console.log('✅ Power Status Bar is visible');
      results.passed.push('Power Status Bar visible');
    } else {
      console.warn('⚠️  Power Status Bar not visible (may appear on next step)');
      results.warnings.push('Power Status Bar not visible yet');
    }
    
    // Advance
    const step2Next = await page.$('button:has-text("Next"), button:has-text("Continue")');
    if (step2Next) {
      await step2Next.click();
      await page.waitForTimeout(1000);
      console.log('✅ Advanced to Step 3');
      results.passed.push('Step 2 - Battery configuration');
    } else {
      throw new Error('Next button not found on Step 2');
    }

    // ========================================
    // TEST 7: Step 3 - Power Sources / Renewables
    // ========================================
    console.log('\n📋 TEST 7: Step 3 - Power Sources Configuration');
    
    await checkDuplicateButtons(page, 'Step 3');
    await checkForNaN(page, 'Step 3');
    
    // Check for Power Status Bar (should definitely be here)
    const powerStatusBar2 = await page.$('[data-testid="power-status-bar"], text=Power Configuration');
    if (powerStatusBar2) {
      console.log('✅ Power Status Bar is visible');
      results.passed.push('Power Status Bar on Step 3');
    } else {
      console.error('❌ Power Status Bar NOT VISIBLE on Step 3');
      results.failed.push('Power Status Bar missing');
      await screenshot(page, 'missing-power-status-bar');
    }
    
    // Look for solar option
    const solarToggle = await page.$('input[type="checkbox"], text=Solar');
    if (solarToggle) {
      await solarToggle.click();
      console.log('✅ Solar option toggled');
    }
    
    // Advance
    const step3Next = await page.$('button:has-text("Next"), button:has-text("Continue")');
    if (step3Next) {
      await step3Next.click();
      await page.waitForTimeout(1000);
      console.log('✅ Advanced to Step 4');
      results.passed.push('Step 3 - Power sources');
    } else {
      throw new Error('Next button not found on Step 3');
    }

    // ========================================
    // TEST 8: Step 4 - Location & Pricing
    // ========================================
    console.log('\n📋 TEST 8: Step 4 - Location & Pricing');
    
    await checkDuplicateButtons(page, 'Step 4');
    await checkForNaN(page, 'Step 4');
    
    // Select location
    const locationSelect = await page.$('select[name="location"]');
    if (locationSelect) {
      await locationSelect.select('California');
      console.log('✅ Location selected');
    }
    
    // Advance
    const step4Next = await page.$('button:has-text("Next"), button:has-text("Continue")');
    if (step4Next) {
      await step4Next.click();
      await page.waitForTimeout(1000);
      console.log('✅ Advanced to Step 5');
      results.passed.push('Step 4 - Location & pricing');
    } else {
      throw new Error('Next button not found on Step 4');
    }

    // ========================================
    // TEST 9: Step 5 - Quote Summary
    // ========================================
    console.log('\n📋 TEST 9: Step 5 - Quote Summary');
    
    await checkDuplicateButtons(page, 'Step 5');
    await checkForNaN(page, 'Step 5');
    
    // Check for quote details
    const quoteVisible = await page.$('text=Quote, text=Summary, text=Cost');
    if (quoteVisible) {
      console.log('✅ Quote summary visible');
      results.passed.push('Step 5 - Quote summary');
    } else {
      console.error('❌ Quote summary not visible');
      results.failed.push('Step 5 - Quote not visible');
      await screenshot(page, 'step5-quote-missing');
    }
    
    // Check for dollar amounts (no NaN)
    const dollarAmounts = await page.$$('text=/\\$[\\d,]+/');
    if (dollarAmounts.length > 0) {
      console.log(`✅ Found ${dollarAmounts.length} cost displays`);
    } else {
      results.warnings.push('No cost amounts visible on quote');
    }

    // ========================================
    // FINAL SCREENSHOT
    // ========================================
    await screenshot(page, 'final-state');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    results.failed.push(`Error: ${error.message}`);
    await screenshot(page, 'error-state');
  }

  // ========================================
  // RESULTS SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n✅ PASSED (${results.passed.length}):`);
  results.passed.forEach(test => console.log(`  ✓ ${test}`));
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`);
    results.warnings.forEach(warning => console.log(`  ⚠ ${warning}`));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ FAILED (${results.failed.length}):`);
    results.failed.forEach(failure => console.log(`  ✗ ${failure}`));
  }
  
  const totalTests = results.passed.length + results.failed.length;
  const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);
  
  console.log(`\n📈 PASS RATE: ${passRate}% (${results.passed.length}/${totalTests})`);
  console.log('='.repeat(60) + '\n');

  await browser.close();
  
  // Exit with error code if any tests failed
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run the test
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
