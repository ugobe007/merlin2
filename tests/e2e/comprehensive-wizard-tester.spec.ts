/**
 * Comprehensive Wizard Tester - Complete Step 1 First
 */

import { test, expect, Page } from '@playwright/test';

test.setTimeout(60000);

const BASE_URL = process.env.BASE_URL || 'http://localhost:5184';

const INDUSTRIES = [
  { slug: 'hotel', displayName: 'Hotel / Hospitality' },
  { slug: 'car_wash', displayName: 'Car Wash' },
  { slug: 'heavy_duty_truck_stop', displayName: 'Truck Stop / Travel Center' },
  { slug: 'ev_charging', displayName: 'EV Charging Hub' },
  { slug: 'manufacturing', displayName: 'Manufacturing' },
  { slug: 'data_center', displayName: 'Data Center' },
  { slug: 'hospital', displayName: 'Hospital / Healthcare' },
  { slug: 'retail', displayName: 'Retail / Commercial' },
  { slug: 'office', displayName: 'Office Building' },
  { slug: 'college', displayName: 'College / University' },
  { slug: 'warehouse', displayName: 'Warehouse / Logistics' },
  { slug: 'restaurant', displayName: 'Restaurant' },
  { slug: 'agriculture', displayName: 'Agriculture' }
];

async function completeStep1(page: Page) {
  // Select country (US)
  const usButton = page.locator('button:has-text("United States")').first();
  await usButton.click();
  await page.waitForTimeout(500);
  
  // Select a goal (any goal)
  const goalButton = page.locator('button:has-text("Cut Energy Costs")').first();
  await goalButton.click();
  await page.waitForTimeout(500);
}

async function navigateToIndustryPage(page: Page) {
  await page.goto(`${BASE_URL}/wizard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Complete Step 1
  await completeStep1(page);
  
  // Now Continue should be enabled
  const continueBtn = page.locator('button:has-text("Continue")').first();
  await continueBtn.click();
  await page.waitForTimeout(2000);
}

async function selectIndustry(page: Page, industryName: string) {
  console.log(`🎯 Selecting: ${industryName}`);
  
  const button = page.locator(`button:has-text("${industryName}")`).first();
  await button.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  
  await button.click({ force: true });
  await page.waitForTimeout(1000);
  
  console.log(`✅ Clicked: ${industryName}`);
  return true;
}

test.describe('COMPREHENSIVE WIZARD TESTER', () => {
  
  for (const industry of INDUSTRIES) {
    test(`🧪 ${industry.displayName}`, async ({ page }) => {
      console.log(`\n🚀 Testing: ${industry.displayName}`);
      
      await navigateToIndustryPage(page);
      await selectIndustry(page, industry.displayName);
      await page.waitForTimeout(2000);
      
      const url = page.url();
      const isOnStep3 = url.includes('step/3') || url.includes('details');
      
      console.log(`📍 URL: ${url}`);
      console.log(`✅ Step 3: ${isOnStep3}`);
      
      expect(isOnStep3).toBe(true);
    });
  }
  
  test('🔍 All industries visible', async ({ page }) => {
    await navigateToIndustryPage(page);
    
    const counts = await Promise.all(
      INDUSTRIES.map(ind => 
        page.locator(`button:has-text("${ind.displayName}")`).count()
      )
    );
    
    const visible = counts.filter(c => c > 0).length;
    console.log(`\n✅ ${visible}/13 industries visible`);
    
    expect(visible).toBe(13);
  });
});
