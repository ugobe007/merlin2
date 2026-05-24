/**
 * Playwright Link Checker Test
 *
 * Validates current public navigation and production wizard routes.
 * Requires a dev server; use npm run dev before running locally.
 */

import { test, expect, type Page } from '@playwright/test';

async function collectPageErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  return errors;
}

function criticalErrors(errors: string[]): string[] {
  return errors.filter(error =>
    !error.includes('ResizeObserver') &&
    !error.includes('favicon') &&
    !error.includes('Failed to load resource')
  );
}

test.describe('Link Checker - Current App Navigation', () => {
  test('homepage loads without critical console errors', async ({ page }) => {
    const errors = await collectPageErrors(page);

    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('a[href], button')).not.toHaveCount(0);

    expect(criticalErrors(errors)).toEqual([]);
  });

  test('production wizard routes load V8 shell', async ({ page }) => {
    const routes = ['/wizard', '/wizard-v8', '/v8', '/home', '/landing'];

    for (const route of routes) {
      const errors = await collectPageErrors(page);
      const response = await page.goto(route);

      expect(response?.status(), `${route} should not 404/500`).toBeLessThan(400);
      await expect(page.locator('body'), `${route} should render body`).toBeVisible();
      await expect(page.locator('button'), `${route} should expose wizard controls`).not.toHaveCount(0);
      expect(criticalErrors(errors), `${route} should not throw critical errors`).toEqual([]);
    }
  });

  test('internal links do not point to stale localhost ports', async ({ page }, testInfo) => {
    await page.goto('/');

    const baseUrl = new URL(testInfo.project.use.baseURL || 'http://localhost:5177');
    const staleLinks = await page.locator('a[href]').evaluateAll((anchors, expectedOrigin) =>
      anchors
        .map(anchor => anchor.getAttribute('href'))
        .filter((href): href is string => Boolean(href))
        .filter(href => href.includes('localhost') && !href.startsWith(expectedOrigin as string)),
      baseUrl.origin
    );

    expect(staleLinks).toEqual([]);
  });

  test('all same-origin anchor links return a successful response', async ({ page, request }, testInfo) => {
    await page.goto('/');

    const baseUrl = new URL(testInfo.project.use.baseURL || 'http://localhost:5177');
    const hrefs = await page.locator('a[href]').evaluateAll(anchors =>
      Array.from(new Set(
        anchors
          .map(anchor => anchor.getAttribute('href'))
          .filter((href): href is string => Boolean(href))
          .filter(href => !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:'))
      ))
    );

    for (const href of hrefs) {
      const url = new URL(href, baseUrl);
      if (url.origin !== baseUrl.origin) continue;

      const response = await request.get(url.pathname + url.search);
      expect(response.status(), `${href} should resolve`).toBeLessThan(400);
    }
  });
});
