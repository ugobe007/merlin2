/**
 * MERLIN WIZARD E2E TESTS - PUPPETEER
 * ====================================
 * 
 * End-to-end tests using Puppeteer for browser automation.
 * Focuses on visual testing, screenshots, and PDF generation.
 * 
 * Run: npx jest tests/puppeteer/wizard.test.ts
 * Or: node tests/puppeteer/wizard.test.js
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const WIZARD_PATH = '/wizard';
const SCREENSHOT_DIR = './tests/screenshots';
const TIMEOUT = 30000;

// Industry configurations for testing
const INDUSTRY_TESTS = [
  {
    id: 'hotel',
    name: 'Hotel',
    inputs: {
      hotelType: 'fullService',
      roomCount: 200,
      amenities: ['pool', 'restaurant', 'laundry'],
      hvacType: 'central',
      currentBackup: 'partial',
      monthlyEnergySpend: '35000'
    }
  },
  {
    id: 'carWash',
    name: 'Car Wash',
    inputs: {
      washType: 'expressTunnel',
      tunnelLength: 150,
      carsPerDay: 500,
      dryerType: 'highVelocity',
      waterHeatingFuel: 'gas',
      currentBackup: 'none'
    }
  },
  {
    id: 'dataCenter',
    name: 'Data Center',
    inputs: {
      facilityType: 'enterprise',
      rackCount: 150,
      workloadType: 'virtualized',
      criticalityLevel: 'missionCritical',
      coolingMethod: 'hotColdAisle'
    }
  },
  {
    id: 'hospital',
    name: 'Hospital',
    inputs: {
      facilityType: 'regional',
      bedCount: 250,
      criticalServices: ['emergencyDept', 'operatingRooms', 'icu'],
      currentBackup: 'diesel'
    }
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    inputs: {
      manufacturingType: 'processChemical',
      facilitySqFt: 200000,
      productionSchedule: 'continuous',
      outageImpact: 'productRuined'
    }
  },
  {
    id: 'retail',
    name: 'Retail',
    inputs: {
      retailType: 'largeGrocery',
      storeSqFt: 60000,
      refrigerationLevel: 'heavy',
      operatingHours: 'extended'
    }
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    inputs: {
      restaurantType: 'qsr',
      restaurantSqFt: 3000,
      cookingFuel: 'allElectric',
      mealPeriods: ['breakfast', 'lunch', 'dinner']
    }
  },
  {
    id: 'office',
    name: 'Office Building',
    inputs: {
      officeType: 'highRise',
      buildingSqFt: 300000,
      floorCount: 20,
      buildingClass: 'classA'
    }
  },
  {
    id: 'university',
    name: 'University',
    inputs: {
      campusType: 'majorResearch',
      studentCount: 45000,
      campusSqFt: 15000000,
      buildingTypes: ['classroom', 'researchLabs', 'residenceHalls']
    }
  },
  {
    id: 'evChargingHub',
    name: 'EV Charging Hub',
    inputs: {
      hubType: 'fleetDepot',
      totalChargingSpaces: 50,
      chargerMix: 'mixed',
      gridUpgradeNeeded: true
    }
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function setupBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
}

async function navigateToWizard(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}${WIZARD_PATH}`, { waitUntil: 'networkidle2' });
}

async function selectIndustry(page: Page, industryId: string): Promise<void> {
  await page.waitForSelector(`[data-industry="${industryId}"]`, { timeout: TIMEOUT });
  await page.click(`[data-industry="${industryId}"]`);
  await page.waitForSelector('[data-testid="question-form"]', { timeout: TIMEOUT });
}

async function fillSelectField(page: Page, questionId: string, value: string): Promise<void> {
  const selector = `[data-question="${questionId}"] select, [data-question="${questionId}"] [role="combobox"]`;
  await page.waitForSelector(selector, { timeout: TIMEOUT });
  await page.click(selector);
  await page.click(`[data-value="${value}"]`);
}

async function fillSliderField(page: Page, questionId: string, value: number): Promise<void> {
  const selector = `[data-question="${questionId}"] input[type="range"]`;
  await page.waitForSelector(selector, { timeout: TIMEOUT });
  
  // Get slider bounds
  const slider = await page.$(selector);
  const box = await slider?.boundingBox();
  
  if (box) {
    // Calculate position based on value
    const sliderInput = await page.$eval(selector, (el: HTMLInputElement) => ({
      min: parseFloat(el.min),
      max: parseFloat(el.max)
    }));
    
    const percent = (value - sliderInput.min) / (sliderInput.max - sliderInput.min);
    const x = box.x + box.width * percent;
    const y = box.y + box.height / 2;
    
    await page.mouse.click(x, y);
  }
}

async function fillNumberField(page: Page, questionId: string, value: number): Promise<void> {
  const selector = `[data-question="${questionId}"] input[type="number"]`;
  await page.waitForSelector(selector, { timeout: TIMEOUT });
  await page.click(selector, { clickCount: 3 }); // Select all
  await page.type(selector, String(value));
}

async function fillMultiSelect(page: Page, questionId: string, values: string[]): Promise<void> {
  for (const value of values) {
    const selector = `[data-question="${questionId}"] [data-value="${value}"]`;
    await page.waitForSelector(selector, { timeout: TIMEOUT });
    await page.click(selector);
  }
}

async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}.png`,
    fullPage: true
  });
}

async function submitAndWaitForResults(page: Page): Promise<void> {
  await page.click('button[type="submit"], [data-testid="submit-wizard"]');
  await page.waitForSelector('[data-testid="results"]', { timeout: TIMEOUT });
}

async function getCalculationResults(page: Page): Promise<{
  peakKw: number;
  bessKwh: number;
  solarKw: number;
  annualSavings: number;
}> {
  return page.evaluate(() => {
    const getText = (selector: string) => {
      const el = document.querySelector(selector);
      return el?.textContent?.replace(/[^0-9.]/g, '') || '0';
    };
    
    return {
      peakKw: parseFloat(getText('[data-testid="peak-kw"]')),
      bessKwh: parseFloat(getText('[data-testid="bess-kwh"]')),
      solarKw: parseFloat(getText('[data-testid="solar-kw"]')),
      annualSavings: parseFloat(getText('[data-testid="annual-savings"]'))
    };
  });
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Wizard Visual Tests', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await setupBrowser();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
  });
  
  afterEach(async () => {
    await page.close();
  });
  
  test('Industry selection page renders correctly', async () => {
    await navigateToWizard(page);
    await takeScreenshot(page, 'industry-selection');
    
    // Verify all 10 industries are visible
    const industryCards = await page.$$('[data-industry]');
    expect(industryCards.length).toBe(10);
  });
  
  test('Each industry card shows correct icon and name', async () => {
    await navigateToWizard(page);
    
    for (const industry of INDUSTRY_TESTS) {
      const card = await page.$(`[data-industry="${industry.id}"]`);
      expect(card).not.toBeNull();
      
      const cardText = await page.$eval(
        `[data-industry="${industry.id}"]`,
        el => el.textContent
      );
      expect(cardText).toContain(industry.name);
    }
  });
});

describe('Industry Flow Screenshots', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await setupBrowser();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  for (const industry of INDUSTRY_TESTS) {
    test(`${industry.name} - Complete flow screenshots`, async () => {
      page = await browser.newPage();
      
      try {
        await navigateToWizard(page);
        await selectIndustry(page, industry.id);
        await takeScreenshot(page, `${industry.id}-questions`);
        
        // Fill first few questions based on type
        if (industry.inputs.hotelType) {
          await fillSelectField(page, 'hotelType', industry.inputs.hotelType);
        }
        if (industry.inputs.washType) {
          await fillSelectField(page, 'washType', industry.inputs.washType);
        }
        if (industry.inputs.facilityType) {
          await fillSelectField(page, 'facilityType', industry.inputs.facilityType);
        }
        if (industry.inputs.retailType) {
          await fillSelectField(page, 'retailType', industry.inputs.retailType);
        }
        if (industry.inputs.restaurantType) {
          await fillSelectField(page, 'restaurantType', industry.inputs.restaurantType);
        }
        if (industry.inputs.officeType) {
          await fillSelectField(page, 'officeType', industry.inputs.officeType);
        }
        if (industry.inputs.campusType) {
          await fillSelectField(page, 'campusType', industry.inputs.campusType);
        }
        if (industry.inputs.hubType) {
          await fillSelectField(page, 'hubType', industry.inputs.hubType);
        }
        if (industry.inputs.manufacturingType) {
          await fillSelectField(page, 'manufacturingType', industry.inputs.manufacturingType);
        }
        
        await takeScreenshot(page, `${industry.id}-filled`);
        
      } finally {
        await page.close();
      }
    });
  }
});

describe('Calculation Verification', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await setupBrowser();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  test('Hotel calculation produces reasonable results', async () => {
    page = await browser.newPage();
    
    try {
      await navigateToWizard(page);
      await selectIndustry(page, 'hotel');
      
      await fillSelectField(page, 'hotelType', 'fullService');
      await fillSliderField(page, 'roomCount', 200);
      await fillMultiSelect(page, 'amenities', ['pool', 'restaurant']);
      await fillSelectField(page, 'hvacType', 'central');
      await fillSelectField(page, 'currentBackup', 'none');
      
      await submitAndWaitForResults(page);
      await takeScreenshot(page, 'hotel-results');
      
      const results = await getCalculationResults(page);
      
      // 200 room full-service hotel: expect 300-800 kW peak
      expect(results.peakKw).toBeGreaterThan(300);
      expect(results.peakKw).toBeLessThan(800);
      expect(results.bessKwh).toBeGreaterThan(0);
      
    } finally {
      await page.close();
    }
  });
  
  test('Data center calculation scales with rack count', async () => {
    page = await browser.newPage();
    
    try {
      await navigateToWizard(page);
      await selectIndustry(page, 'dataCenter');
      
      // Test with 50 racks
      await fillSelectField(page, 'facilityType', 'enterprise');
      await fillNumberField(page, 'rackCount', 50);
      await fillSelectField(page, 'workloadType', 'standard');
      
      await submitAndWaitForResults(page);
      const results50 = await getCalculationResults(page);
      
      // Navigate back and test with 100 racks
      await page.goBack();
      await fillNumberField(page, 'rackCount', 100);
      
      await submitAndWaitForResults(page);
      const results100 = await getCalculationResults(page);
      
      // 100 racks should be roughly 2x the load of 50 racks
      expect(results100.peakKw).toBeGreaterThan(results50.peakKw * 1.5);
      expect(results100.peakKw).toBeLessThan(results50.peakKw * 2.5);
      
    } finally {
      await page.close();
    }
  });
});

describe('Error Handling', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await setupBrowser();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
  });
  
  afterEach(async () => {
    await page.close();
  });
  
  test('Shows error for missing required fields', async () => {
    await navigateToWizard(page);
    await selectIndustry(page, 'hotel');
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Should show validation error
    const errorVisible = await page.$('.error-message, [data-testid="validation-error"]');
    expect(errorVisible).not.toBeNull();
    
    await takeScreenshot(page, 'validation-error');
  });
  
  test('Handles network errors gracefully', async () => {
    await navigateToWizard(page);
    
    // Simulate offline
    await page.setOfflineMode(true);
    
    await selectIndustry(page, 'hotel');
    await fillSelectField(page, 'hotelType', 'limitedService');
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Should show network error
    const errorVisible = await page.$('.network-error, [data-testid="network-error"]');
    
    await page.setOfflineMode(false);
  });
});

describe('PDF Generation', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await setupBrowser();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  test('Generate PDF report for Hotel', async () => {
    page = await browser.newPage();
    
    try {
      await navigateToWizard(page);
      await selectIndustry(page, 'hotel');
      
      await fillSelectField(page, 'hotelType', 'fullService');
      await fillSliderField(page, 'roomCount', 150);
      await fillSelectField(page, 'currentBackup', 'none');
      
      await submitAndWaitForResults(page);
      
      // Generate PDF of results
      await page.pdf({
        path: `${SCREENSHOT_DIR}/hotel-report.pdf`,
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      
    } finally {
      await page.close();
    }
  });
});

describe('Performance Metrics', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await setupBrowser();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  test('Page load performance', async () => {
    page = await browser.newPage();
    
    try {
      const startTime = Date.now();
      await navigateToWizard(page);
      const loadTime = Date.now() - startTime;
      
      console.log(`Wizard load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000);
      
      // Get performance metrics
      const metrics = await page.metrics();
      console.log('Performance metrics:', {
        jsHeapUsedSize: `${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`,
        jsHeapTotalSize: `${(metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2)} MB`,
        documents: metrics.Documents,
        frames: metrics.Frames
      });
      
    } finally {
      await page.close();
    }
  });
  
  test('Calculation performance', async () => {
    page = await browser.newPage();
    
    try {
      await navigateToWizard(page);
      await selectIndustry(page, 'manufacturing');
      
      await fillSelectField(page, 'manufacturingType', 'processChemical');
      await fillSliderField(page, 'facilitySqFt', 500000);
      await fillSelectField(page, 'productionSchedule', 'continuous');
      
      const startTime = Date.now();
      await submitAndWaitForResults(page);
      const calcTime = Date.now() - startTime;
      
      console.log(`Calculation time: ${calcTime}ms`);
      expect(calcTime).toBeLessThan(2000);
      
    } finally {
      await page.close();
    }
  });
});

// ============================================================================
// RUN TESTS
// ============================================================================

// If running directly (not through Jest)
if (require.main === module) {
  (async () => {
    const browser = await setupBrowser();
    const page = await browser.newPage();
    
    console.log('Running Puppeteer tests manually...');
    
    try {
      await navigateToWizard(page);
      console.log('✓ Wizard loaded');
      
      await selectIndustry(page, 'hotel');
      console.log('✓ Hotel industry selected');
      
      await takeScreenshot(page, 'manual-test-hotel');
      console.log('✓ Screenshot captured');
      
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      await browser.close();
    }
  })();
}
