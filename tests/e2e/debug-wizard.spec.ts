/**
 * WORKING VERSION - Simplified, Robust Selectors
 */

import { test, expect, Page } from '@playwright/test';

test.setTimeout(60000);

const BASE_URL = process.env.BASE_URL || 'http://localhost:5184';

const INDUSTRIES = [
  { slug: 'hotel', displayName: 'Hotel' }, // Simplified - just "Hotel"
  { slug: 'car_wash', displayName: 'Car Wash' },
  { slug: 'ev_charging', displayName: 'EV Charging' },
  // Add more as needed...
];

async function selectIndustry(page: Page, industryName: string) {
  try {
    console.log(`🎯 Looking for industry: ${industryName}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Strategy 1: Try exact button text
    let button = page.locator(`button:has-text("${industryName}")`).first();
    let count = await button.count();
    
    if (count === 0) {
      console.log(`⚠️  "${industryName}" not found, trying partial match...`);
      
      // Strategy 2: Try any button containing the name
      button = page.locator(`button`).filter({ hasText: industryName }).first();
      count = await button.count();
    }
    
    if (count === 0) {
      console.log(`❌ No button found for "${industryName}"`);
      
      // Debug: Show all buttons on page
      const allButtons = await page.locator('button').allTextContents();
      console.log(`📋 All buttons on page (${allButtons.length}):`, allButtons);
      
      return false;
    }
    
    // Click the button
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
    
    // Wait for navigation
    await page.waitForTimeout(1000);
    
    console.log(`✅ Clicked: ${industryName}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error selecting ${industryName}:`, error.message);
    return false;
  }
}

test.describe('Simplified Industry Tests', () => {
  test('Debug: Show all buttons on wizard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/wizard`);
    await page.waitForLoadState('networkidle');
    
    // Get all buttons
    const buttons = await page.locator('button').allTextContents();
    console.log(`\n📋 Found ${buttons.length} buttons:`);
    buttons.forEach((text, i) => {
      console.log(`  ${i + 1}. "${text}"`);
    });
    
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('Try to select first industry', async ({ page }) => {
    await page.goto(`${BASE_URL}/wizard`);
    
    // Try to select Hotel
    const success = await selectIndustry(page, 'Hotel');
    
    if (!success) {
      // Take screenshot for debugging
      await page.screenshot({ 
        path: 'test-results/industry-page-debug.png',
        fullPage: true 
      });
    }
    
    expect(success).toBe(true);
  });
});
