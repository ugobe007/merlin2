import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5184';

test.describe('Current TrueQuote workflow smoke', () => {
  test('home page renders current TrueQuote entry points', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /sized & priced in 90 seconds/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Start your free TrueQuote/i })).toHaveAttribute('href', '/wizard');
    await expect(page.getByRole('link', { name: /Embed TrueQuote/i }).first()).toHaveAttribute('href', '/widget');
  });

  test('wizard route loads without a blank screen', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(`${BASE_URL}/wizard`, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/wizard/);
    await expect(page.locator('body')).toContainText(/TrueQuote|ZIP|facility|energy/i, { timeout: 15000 });
    await expect(page.locator('body')).not.toContainText(/Page not found|404/i);
    expect(pageErrors).toEqual([]);
  });

  test('quote-builder, pricing, and widget routes render', async ({ page }) => {
    for (const route of ['/quote-builder', '/pricing', '/widget']) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(route.replace('/', '\\/')));
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(page.locator('body')).not.toContainText(/Page not found|404/i);
    }
  });

  test('bad route fails gracefully instead of rendering a blank page', async ({ page }) => {
    await page.goto(`${BASE_URL}/this-page-does-not-exist-xyz`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).not.toBeEmpty();
  });
});
