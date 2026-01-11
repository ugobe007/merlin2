/**
 * DEBUG TEST - Fixed to navigate through wizard properly
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5184';

test.describe('Debug Wizard Navigation', () => {
  test('Step 1: Show buttons on initial wizard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/wizard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const buttons = await page.locator('button').allTextContents();
    console.log(`\n📋 Step 1 - Found ${buttons.length} buttons:`);
    buttons.forEach((text, i) => {
      console.log(`  ${i + 1}. "${text}"`);
    });

    expect(buttons.length).toBeGreaterThan(0);
  });

  test('Step 2: Navigate to industry selection', async ({ page }) => {
    console.log('\n🚀 Starting wizard navigation...');
    
    // Go to wizard
    await page.goto(`${BASE_URL}/wizard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('📍 Step 1: Initial page loaded');

    // Click "Continue" to get past Step 1
    const continueButton = page.locator('button:has-text("Continue")').first();

    if (await continueButton.count() > 0) {
      console.log('✅ Found Continue button, clicking...');
      await continueButton.click();
      await page.waitForTimeout(2000);
      
      // Now check for industry buttons
      const buttons = await page.locator('button').allTextContents();
      console.log(`\n📋 Step 2 - Found ${buttons.length} buttons:`);
      buttons.forEach((text, i) => {
        console.log(`  ${i + 1}. "${text}"`);
      });
      
      // Look for industry-related text
      const hasHotel = buttons.some(text => text.includes('Hotel'));
      const hasCarWash = buttons.some(text => text.includes('Car Wash'));
      const hasEV = buttons.some(text => text.includes('EV') || text.includes('Charging'));
      
      console.log('\n🔍 Industry buttons found:');
      console.log(`  Hotel: ${hasHotel}`);
      console.log(`  Car Wash: ${hasCarWash}`);
      console.log(`  EV Charging: ${hasEV}`);
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-results/step2-industry-page.png',
        fullPage: true 
      });
      console.log('\n📸 Screenshot: test-results/step2-industry-page.png');
      
    } else {
      console.log('❌ No Continue button found');
      
      // Try clicking "Industry" tab directly
      const industryTab = page.locator('button:has-text("Industry")').first();
      if (await industryTab.count() > 0) {
        console.log('✅ Found Industry tab, clicking...');
        await industryTab.click();
        await page.waitForTimeout(2000);
        
        const buttons = await page.locator('button').allTextContents();
        console.log(`\n📋 After clicking Industry - Found ${buttons.length} buttons:`);
        buttons.forEach((text, i) => {
          console.log(`  ${i + 1}. "${text}"`);
        });
      }
    }
  });

  test('Step 3: Complete navigation and select industry', async ({ page }) => {
    console.log('\n🎯 Full wizard flow test...');
    
    await page.goto(`${BASE_URL}/wizard`);
    await page.waitForLoadState('networkidle');

    // Step 1: Click Continue (if exists)
    const continueBtn = page.locator('button:has-text("Continue")').first();
    if (await continueBtn.count() > 0 && await continueBtn.isVisible()) {
      console.log('Step 1: Clicking Continue...');
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }

    // Step 2: Look for industry buttons
    const allButtons = await page.locator('button').allTextContents();
    console.log(`\n📋 Current page has ${allButtons.length} buttons`);

    // Try to find industry buttons
    const industryButtons = allButtons.filter(text => 
      text.includes('Hotel') || 
      text.includes('Car Wash') || 
      text.includes('EV') ||
      text.includes('Manufacturing') ||
      text.includes('Data Center')
    );

    console.log(`\n✅ Found ${industryButtons.length} industry buttons:`);
    industryButtons.forEach(text => console.log(`  - "${text}"`));

    if (industryButtons.length > 0) {
      // Try to click first industry
      const firstIndustry = industryButtons[0];
      console.log(`\n🎯 Attempting to click: "${firstIndustry}"`);
      
      const button = page.locator(`button:has-text("${firstIndustry}")`).first();
      await button.click();
      await page.waitForTimeout(1000);
      
      console.log('✅ Industry clicked successfully!');
    } else {
      console.log('❌ No industry buttons found on current page');
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: 'test-results/no-industry-buttons.png',
        fullPage: true 
      });
    }
  });
});
