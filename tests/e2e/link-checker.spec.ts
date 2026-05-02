/**
 * Playwright Link Checker Test
 * Validates all internal links and buttons across the application
 */

import { test, expect } from '@playwright/test';

test.describe('Link Checker - Validate All Internal Navigation', () => {
  
  test('Hero Section - All buttons and links work', async ({ page }) => {
    await page.goto('http://localhost:5177');
    
    // Check primary TrueQuote entry exists and navigates to the workflow
    const trueQuoteLink = page.getByRole('link', { name: /Start your free TrueQuote/i });
    await expect(trueQuoteLink).toBeVisible();
    await expect(trueQuoteLink).toHaveAttribute('href', '/wizard');
    
    // Check EPC / integrator embed entry exists
    const embedLink = page.getByRole('link', { name: /Embed TrueQuote/i }).first();
    await expect(embedLink).toBeVisible();
    await expect(embedLink).toHaveAttribute('href', '/widget');
    
    // Check key value props render
    await expect(page.getByText('Annual savings projection, payback period & 25-yr NPV')).toBeVisible();
    await expect(page.getByText('Solar, BESS, backup power & generator sizing for your facility')).toBeVisible();
    await expect(page.getByText('Demand charge reduction based on your actual utility tariff')).toBeVisible();
  });

  test('Hero CTA navigates to wizard workflow', async ({ page }) => {
    await page.goto('http://localhost:5177');
    
    await page.getByRole('link', { name: /Start your free TrueQuote/i }).click();
    await expect(page).toHaveURL(/\/wizard/);
  });

  test('Example output - Hotel card updates quote preview', async ({ page }) => {
    await page.goto('http://localhost:5177');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Click Hotel example card
    const hotelCard = page.getByRole('button', { name: 'Hotel' });
    await expect(hotelCard).toBeVisible({ timeout: 10000 });
    await hotelCard.click({ timeout: 5000 });

    await expect(page.getByText('Grand Sierra Resort · Reno, NV')).toBeVisible();
  });

  test('Example output - Data Center card updates quote preview', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    const dataCenterCard = page.getByRole('button', { name: 'Data Center' });
    await expect(dataCenterCard).toBeVisible({ timeout: 10000 });
    await dataCenterCard.click({ timeout: 5000 });
    
    await expect(page.getByText('CloudEdge Facility · Phoenix, AZ')).toBeVisible();
  });

  test('Example output - Car Wash card updates quote preview', async ({ page }) => {
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    
    const carWashCard = page.getByRole('button', { name: 'Car Wash' });
    await expect(carWashCard).toBeVisible({ timeout: 10000 });
    await carWashCard.click({ timeout: 5000 });

    await expect(page.getByText('SpeedyClean Group · Atlanta, GA')).toBeVisible();
  });

  test('Wizard workflow route loads without crashes', async ({ page }) => {
    await page.goto('http://localhost:5177');
    
    // Track all errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    // Open TrueQuote workflow
    await page.getByRole('link', { name: /Start your free TrueQuote/i }).click();
    
    // Wait for wizard route to load without requiring background network calls to settle
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveURL(/\/wizard/);
    await expect(page.locator('body')).toContainText(/TrueQuote|ZIP|facility|energy/i, { timeout: 10000 });
    expect(pageErrors.length).toBe(0);
  });

  test('Check for bad localhost URLs in source', async ({ page }) => {
    await page.goto('http://localhost:5177');
    
    // Get all link elements
    const links = await page.locator('a[href]').all();
    const badLinks: string[] = [];
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && href.includes('localhost') && !href.includes('localhost:5177')) {
        badLinks.push(href);
      }
    }
    
    // Report any bad localhost links
    if (badLinks.length > 0) {
      console.error('Found bad localhost links:', badLinks);
    }
    expect(badLinks.length).toBe(0);
  });

  test('TrueQuote logo is clickable and navigates home', async ({ page }) => {
    await page.goto('http://localhost:5177');
    
    const logoLink = page.getByRole('link', { name: /TrueQuote — Verified Energy Quotes/i });
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toHaveAttribute('href', '/');
  });
});

test.describe('Page Error Detection', () => {
  test('No console errors on homepage', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });
    
    await page.goto('http://localhost:5177');
    await page.waitForTimeout(2000);
    
    // Filter out known benign errors (like network timing)
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('ResizeObserver') && 
      !err.includes('favicon')
    );
    
    if (criticalErrors.length > 0) {
      console.error('Console errors found:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBe(0);
  });
});
