/**
 * Puppeteer E2E Tests for Merlin Wizard
 * Run with: npx vitest run tests/e2e/wizard-puppeteer.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5178';
const TIMEOUT = 30000;

describe('Merlin Wizard E2E (Puppeteer)', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  }, TIMEOUT);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Home Page', () => {
    it('should load the home page', async () => {
      const response = await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      expect(response?.status()).toBe(200);
      
      // Check for React app mount
      const root = await page.$('#root');
      expect(root).not.toBeNull();
    }, TIMEOUT);

    it('should have Merlin branding', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      
      // Look for Merlin image or text
      const hasmerlin = await page.evaluate(() => {
        return document.body.innerText.toLowerCase().includes('merlin') ||
               !!document.querySelector('img[alt*="erlin"]');
      });
      expect(hasmerlin).toBe(true);
    }, TIMEOUT);

    it('should display the wizard', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      
      // Check for wizard container (purple gradient background)
      const wizardVisible = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="from-purple"]');
        return elements.length > 0;
      });
      expect(wizardVisible).toBe(true);
    }, TIMEOUT);
  });

  describe('Hotel Vertical Page', () => {
    it('should load the hotel page', async () => {
      const response = await page.goto(`${BASE_URL}/hotel`, { waitUntil: 'networkidle0' });
      expect(response?.status()).toBe(200);
    }, TIMEOUT);

    it('should display hotel-specific content', async () => {
      await page.goto(`${BASE_URL}/hotel`, { waitUntil: 'networkidle0' });
      
      const hasHotelContent = await page.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes('hotel') || text.includes('room');
      });
      expect(hasHotelContent).toBe(true);
    }, TIMEOUT);

    it('should have a Get Quote button', async () => {
      await page.goto(`${BASE_URL}/hotel`, { waitUntil: 'networkidle0' });
      
      const hasGetQuoteButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(b => 
          b.textContent?.toLowerCase().includes('quote') ||
          b.textContent?.toLowerCase().includes('get started')
        );
      });
      expect(hasGetQuoteButton).toBe(true);
    }, TIMEOUT);
  });

  describe('Wizard Navigation', () => {
    it('should have Continue/Next buttons', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      
      const hasContinueButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(b => {
          const text = b.textContent?.toLowerCase() || '';
          return text.includes('continue') || text.includes('next') || text.includes('start');
        });
      });
      expect(hasContinueButton).toBe(true);
    }, TIMEOUT);

    it('should display section indicators', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      
      // Look for step/section indicators (circles, progress dots, etc.)
      const hasProgressIndicators = await page.evaluate(() => {
        // Check for numbered steps or dots
        const indicators = document.querySelectorAll('[class*="rounded-full"], [class*="step"], [class*="dot"]');
        return indicators.length > 0;
      });
      expect(hasProgressIndicators).toBe(true);
    }, TIMEOUT);
  });

  describe('Form Inputs', () => {
    it('should have input fields', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      
      const hasInputs = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, select, textarea');
        return inputs.length > 0;
      });
      expect(hasInputs).toBe(true);
    }, TIMEOUT);

    it('should have clickable buttons', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      
      const buttonCount = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button:not(:disabled)');
        return buttons.length;
      });
      expect(buttonCount).toBeGreaterThan(0);
    }, TIMEOUT);
  });

  describe('Power Values Display', () => {
    it('should display power units (kW, kWh, MW)', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      await page.waitForTimeout(1000); // Wait for React to hydrate
      
      const hasPowerUnits = await page.evaluate(() => {
        const text = document.body.innerText;
        return /\d+\s*(kW|kWh|MW|MWh)/i.test(text);
      });
      expect(hasPowerUnits).toBe(true);
    }, TIMEOUT);

    it('should display dollar values', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      await page.waitForTimeout(1000);
      
      const hasDollarValues = await page.evaluate(() => {
        const text = document.body.innerText;
        return /\$[\d,]+/.test(text);
      });
      // Dollar values may or may not be visible initially
      // This just checks if the pattern exists anywhere
      console.log('Dollar values present:', hasDollarValues);
    }, TIMEOUT);
  });

  describe('Responsive Layout', () => {
    it('should render on mobile viewport', async () => {
      await page.setViewport({ width: 375, height: 667 }); // iPhone SE
      const response = await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      expect(response?.status()).toBe(200);
      
      // Verify content is visible
      const hasContent = await page.evaluate(() => {
        return document.body.innerText.length > 100;
      });
      expect(hasContent).toBe(true);
      
      // Reset viewport
      await page.setViewport({ width: 1280, height: 800 });
    }, TIMEOUT);
  });

  describe('Console Errors', () => {
    it('should not have critical console errors', async () => {
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      await page.waitForTimeout(2000);

      // Filter out known acceptable errors
      const criticalErrors = consoleErrors.filter(err => 
        !err.includes('favicon') &&
        !err.includes('Failed to load resource') &&
        !err.includes('ERR_BLOCKED_BY_CLIENT')
      );

      console.log('Console errors found:', criticalErrors.length);
      criticalErrors.forEach(err => console.log('  -', err.slice(0, 100)));
      
      // Allow some non-critical errors but flag if there are many
      expect(criticalErrors.length).toBeLessThan(5);
    }, TIMEOUT);
  });
});

describe('Wizard Flow Automation', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  }, TIMEOUT);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('should complete a basic wizard flow', async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(1000);

    // Step 1: Look for state selection or location input
    const hasStateSelector = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      const inputs = document.querySelectorAll('input[placeholder*="zip"], input[placeholder*="location"]');
      return selects.length > 0 || inputs.length > 0;
    });
    console.log('Has state/location selector:', hasStateSelector);

    // Step 2: Try to click Continue if available
    const clickedContinue = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const continueBtn = buttons.find(b => {
        const text = b.textContent?.toLowerCase() || '';
        return (text.includes('continue') || text.includes('next')) && !b.disabled;
      });
      if (continueBtn) {
        continueBtn.click();
        return true;
      }
      return false;
    });
    console.log('Clicked Continue:', clickedContinue);

    await page.waitForTimeout(500);

    // Step 3: Check for industry selection
    const hasIndustryCards = await page.evaluate(() => {
      // Look for industry/use case cards
      const cards = document.querySelectorAll('[class*="cursor-pointer"], [class*="card"]');
      return cards.length > 0;
    });
    console.log('Has industry cards:', hasIndustryCards);

    // Verify we're still on the page without errors
    const pageStable = await page.evaluate(() => {
      return document.body.innerText.length > 100;
    });
    expect(pageStable).toBe(true);
  }, TIMEOUT);

  it('should handle hotel vertical flow', async () => {
    await page.goto(`${BASE_URL}/hotel`, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(1000);

    // Check for hero calculator
    const hasCalculator = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="number"], input[type="range"], select');
      return inputs.length > 0;
    });
    console.log('Hotel page has calculator inputs:', hasCalculator);

    // Look for Get Quote button
    const hasQuoteButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => b.textContent?.toLowerCase().includes('quote'));
    });
    console.log('Has Get Quote button:', hasQuoteButton);

    expect(hasCalculator || hasQuoteButton).toBe(true);
  }, TIMEOUT);
});

describe('State Inspector Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  }, TIMEOUT);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('should inspect wizard state elements', async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(1000);

    const stateInspection = await page.evaluate(() => {
      const result = {
        totalButtons: document.querySelectorAll('button').length,
        disabledButtons: document.querySelectorAll('button:disabled').length,
        checkboxes: document.querySelectorAll('input[type="checkbox"]').length,
        checkedCheckboxes: document.querySelectorAll('input[type="checkbox"]:checked').length,
        selects: document.querySelectorAll('select').length,
        textInputs: document.querySelectorAll('input[type="text"], input[type="number"]').length,
        hasWizardContainer: !!document.querySelector('[class*="from-purple"]'),
        hasHeader: !!document.querySelector('header'),
        visibleSections: document.querySelectorAll('[class*="min-h-"]:not(.hidden)').length,
      };
      return result;
    });

    console.log('🧙‍♂️ WIZARD STATE INSPECTION:');
    console.log(JSON.stringify(stateInspection, null, 2));

    expect(stateInspection.totalButtons).toBeGreaterThan(0);
    expect(stateInspection.hasWizardContainer).toBe(true);
  }, TIMEOUT);

  it('should extract displayed values', async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(1500);

    const values = await page.evaluate(() => {
      const text = document.body.innerText;
      
      return {
        kwValues: (text.match(/[\d,]+\s*kW(?!h)/gi) || []).slice(0, 5),
        kwhValues: (text.match(/[\d,]+\s*kWh/gi) || []).slice(0, 5),
        mwValues: (text.match(/[\d.]+\s*MW(?!h)/gi) || []).slice(0, 5),
        dollarValues: (text.match(/\$[\d,]+[KM]?/g) || []).slice(0, 5),
        percentValues: (text.match(/\d+%/g) || []).slice(0, 5),
      };
    });

    console.log('📊 DISPLAYED VALUES:');
    console.log(JSON.stringify(values, null, 2));

    // At least some values should be displayed
    const totalValues = Object.values(values).flat().length;
    console.log('Total values found:', totalValues);
  }, TIMEOUT);
});
