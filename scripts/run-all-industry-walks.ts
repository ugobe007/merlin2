#!/usr/bin/env tsx
/**
 * D2 INDUSTRY WALK VALIDATION SCRIPT
 * ====================================
 * Walks all 12 active industries through the full wizard (Steps 0 → 6)
 * and verifies each produces a non-zero quote output.
 *
 * Usage:
 *   npx tsx scripts/run-all-industry-walks.ts              # headless
 *   npx tsx scripts/run-all-industry-walks.ts --headed     # see the browser
 *   npx tsx scripts/run-all-industry-walks.ts --industry hotel  # single run
 *
 * Prerequisites: Dev server running on http://localhost:5184
 *   npm run dev   (in a separate terminal)
 */

import { chromium, type Browser, type Page } from 'playwright';

// ── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5184';
const HEADED   = process.argv.includes('--headed');
const SINGLE   = process.argv.find((a, i) => process.argv[i - 1] === '--industry');
const ZIP      = '89101'; // Las Vegas, NV — deterministic, high PSH

// ── Industry roster ─────────────────────────────────────────────────────────
interface Industry {
  slug: string;      // underscore format (matches INDUSTRY_REGISTRY id)
  name: string;      // display name (from INDUSTRY_REGISTRY / industryMeta)
  testId: string;    // data-testid="industry-card-v8-{testId}"
}

const INDUSTRIES: Industry[] = [
  { slug: 'hotel',         name: 'Hotel / Hospitality',        testId: 'hotel'         },
  { slug: 'car_wash',      name: 'Car Wash',                   testId: 'car-wash'      },
  { slug: 'ev_charging',   name: 'EV Charging Hub',            testId: 'ev-charging'   },
  { slug: 'data_center',   name: 'Data Center',                testId: 'data-center'   },
  { slug: 'hospital',      name: 'Hospital / Healthcare',      testId: 'hospital'      },
  { slug: 'manufacturing', name: 'Manufacturing',              testId: 'manufacturing' },
  { slug: 'retail',        name: 'Retail / Commercial',        testId: 'retail'        },
  { slug: 'restaurant',    name: 'Restaurant',                 testId: 'restaurant'    },
  { slug: 'office',        name: 'Office Building',            testId: 'office'        },
  { slug: 'agriculture',   name: 'Agriculture / Farming',      testId: 'agriculture'   },
  { slug: 'warehouse',     name: 'Warehouse / Logistics',      testId: 'warehouse'     },
  { slug: 'college',       name: 'University / Campus',        testId: 'college'       },
];

// ── Result tracking ──────────────────────────────────────────────────────────
interface WalkResult {
  slug: string;
  name: string;
  passed: boolean;
  steps: Record<string, 'ok' | 'skip' | 'fail'>;
  errors: string[];
  durationMs: number;
  quote?: {
    bessKWh: string;
    peakKW: string;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Wait for the shell Next button to be enabled and return.
 *  V8 shell Next button has no data-testid — match by visible enabled button with these labels.
 *  Fallback: any enabled button containing "Skip to Questionnaire" or arrow → */
async function waitForNextEnabled(page: Page, timeoutMs = 30_000): Promise<void> {
  // Shell Next button labels by step (from NEXT_LABELS in WizardV8Page)
  const nextLabels = [
    'Choose add-ons',
    'Build my tiers',
    'See your quote',
  ];
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const label of nextLabels) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.count() > 0 && await btn.isEnabled().catch(() => false)) return;
    }
    await page.waitForTimeout(300);
  }
  throw new Error(`Shell Next button never became enabled within ${timeoutMs}ms (${page.url()})`);
}

/** Click the wizard Next button (waits for it to be enabled first). */
async function _clickNext(page: Page) {
  await waitForNextEnabled(page, 25_000);
  await page.locator('[data-testid="wizard-next-button"]').click();
  await page.waitForLoadState('networkidle').catch(() => {});
}

/** Assert no math poison (NaN/Infinity/undefined) is visible on the page. */
async function assertNoPoison(page: Page) {
  const body = await page.locator('body').innerText().catch(() => '');
  for (const token of ['NaN', 'Infinity', '-Infinity', '$NaN']) {
    if (body.includes(token)) {
      throw new Error(`Math poison "${token}" found in page text`);
    }
  }
}

/** Get a text snippet from the body that looks like a kWh or kW value. */
async function extractQuoteMetrics(page: Page) {
  const body = await page.locator('body').innerText().catch(() => '');

  // Match "1,200 kWh" or "585 kW" patterns
  const kwhMatch = body.match(/(\d[\d,]+)\s*kWh/i);
  const kwMatch  = body.match(/(\d[\d,]+)\s*kW(?!h)/i);

  return {
    bessKWh: kwhMatch ? kwhMatch[0] : '(not found)',
    peakKW:  kwMatch  ? kwMatch[0]  : '(not found)',
  };
}

// ── Single industry walk ─────────────────────────────────────────────────────

async function walkIndustry(browser: Browser, industry: Industry): Promise<WalkResult> {
  const start = Date.now();
  const result: WalkResult = {
    slug: industry.slug,
    name: industry.name,
    passed: false,
    steps: {},
    errors: [],
    durationMs: 0,
  };

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
  });
  const page = await context.newPage();

  // Silence expected network noise
  page.on('pageerror', (err) => result.errors.push(`PAGE ERROR: ${err.message}`));

  try {
    // ── Step 0: Mode Select ─────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/wizard`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Click the "Guided Wizard" card (button that contains h3 with that text)
    // Step0 may not always be shown — try it, but don't hard-fail if missing
    const guidedWizardCard = page.locator('button:has(h3:has-text("Guided Wizard"))').first();
    if (await guidedWizardCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await guidedWizardCard.click({ force: true });
    }
    await page.waitForTimeout(800);
    result.steps['step0_mode'] = 'ok';

    // ── Step 1: Location ────────────────────────────────────────────────────
    // US is default country — fill ZIP then click "Confirm Location"
    const zipInput = page.locator('input.step1-zip-input, input[placeholder="ZIP code"]').first();
    await zipInput.waitFor({ state: 'visible', timeout: 10_000 });
    await zipInput.fill(ZIP);
    await zipInput.blur();
    await page.waitForTimeout(400);

    // Click "Confirm Location" button (triggers geocoding)
    const confirmLocationBtn = page.locator('button:has-text("Confirm Location")').first();
    await confirmLocationBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await confirmLocationBtn.click();
    await page.waitForTimeout(600);

    // After geocoding resolves, Step1 shows the business name field with a "Skip" button.
    // Clicking Skip calls actions.goToStep(2) — advances to Industry selection.
    const skipBtn = page.locator('button:has-text("Skip")').first();
    await skipBtn.waitFor({ state: 'visible', timeout: 20_000 });
    await skipBtn.click();
    await page.waitForTimeout(800);
    result.steps['step1_location'] = 'ok';

    // ── Step 2: Industry Selection ──────────────────────────────────────────
    const cardSelector = `[data-testid="industry-card-v8-${industry.testId}"]`;
    await page.locator(cardSelector).waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator(cardSelector).scrollIntoViewIfNeeded();
    await page.locator(cardSelector).click({ force: true });
    // Industry card click auto-advances to Step 3 (profile)
    await page.waitForTimeout(1500);
    result.steps['step2_industry'] = 'ok';

    // ── Step 3: Profile (industry questions) ────────────────────────────────
    // Wait for base load to compute (required: baseLoadKW > 0 to enable Next)
    // Shell Next label for step 3 = "Choose add-ons →"
    await waitForNextEnabled(page, 30_000);
    await assertNoPoison(page);
    await page.locator('button:has-text("Choose add-ons")').first().click();
    await page.waitForTimeout(800);
    result.steps['step3_profile'] = 'ok';

    // ── Step 4: Add-ons ─────────────────────────────────────────────────────
    // Shell Next label for step 4 = "Build my tiers →" (the last button with this text)
    // Note: Step3_5 also has an in-page "🧙 Build My Tiers →" button — use the shell one (last)
    await page.locator('button:has-text("Build my tiers")').last().waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('button:has-text("Build my tiers")').last().click();
    await page.waitForTimeout(800);
    result.steps['step4_addons'] = 'ok';

    // ── Step 5: MagicFit (Tier Selection) ───────────────────────────────────
    // Wait for "Recommended" tier card — signals tiers finished building
    const recommendedCard = page.locator('text=Recommended').first();
    const hasTiers = await recommendedCard.waitFor({ state: 'visible', timeout: 50_000 })
      .then(() => true)
      .catch(() => false);
    if (!hasTiers) {
      throw new Error('MagicFit tiers did not appear within 50s');
    }
    // Give animations time to settle; Tier 1 (Recommended) is auto-selected on mount
    await page.waitForTimeout(2000);

    // Shell Next label for step 5 = "See your quote →"
    const seeQuoteBtn = page.locator('button:has-text("See your quote")').first();
    await seeQuoteBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await seeQuoteBtn.click();
    await page.waitForTimeout(1500);
    result.steps['step5_magicfit'] = 'ok';

    // ── Step 6: Quote Output ─────────────────────────────────────────────────
    // Verify non-zero kWh and kW values in the quote
    await page.waitForTimeout(1500);
    await assertNoPoison(page);

    const metrics = await extractQuoteMetrics(page);
    result.quote = metrics;

    // Check for a $ value that isn't $0
    const body = await page.locator('body').innerText().catch(() => '');
    const hasDollarValue = /\$\s?\d{1,3}(,\d{3})+/.test(body);
    const hasKwh = /\d[\d,]+\s*kWh/i.test(body);

    if (!hasKwh && !hasDollarValue) {
      throw new Error('Quote page has no kWh or dollar values — output appears empty');
    }
    result.steps['step6_quote'] = 'ok';
    result.passed = true;

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(msg);

    // Capture screenshot on failure
    const safe = industry.slug.replace(/[^a-z0-9]/gi, '_');
    await page.screenshot({
      path: `test-results/industry-walk-FAIL-${safe}.png`,
      fullPage: true,
    }).catch(() => {});
  } finally {
    result.durationMs = Date.now() - start;
    await context.close();
  }

  return result;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const toRun = SINGLE
    ? INDUSTRIES.filter(i => i.slug === SINGLE || i.testId === SINGLE)
    : INDUSTRIES;

  if (toRun.length === 0) {
    console.error(`❌ No industry found matching "--industry ${SINGLE}"`);
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('  D2 INDUSTRY WALK VALIDATION');
  console.log(`  URL: ${BASE_URL}`);
  console.log(`  ZIP: ${ZIP}  |  Industries: ${toRun.length}`);
  console.log('═'.repeat(70) + '\n');

  const browser: Browser = await chromium.launch({ headless: !HEADED, slowMo: HEADED ? 200 : 0 });
  const results: WalkResult[] = [];

  for (const industry of toRun) {
    process.stdout.write(`  ⏳  ${industry.name.padEnd(30)} `);
    const r = await walkIndustry(browser, industry);
    results.push(r);
    const icon = r.passed ? '✅' : '❌';
    const dur  = `${(r.durationMs / 1000).toFixed(1)}s`;
    const quote = r.quote ? ` [${r.quote.bessKWh} / ${r.quote.peakKW}]` : '';
    console.log(`${icon}  ${dur}${quote}`);
    if (!r.passed) {
      r.errors.forEach(e => console.log(`       ⚠  ${e}`));
    }
  }

  await browser.close();

  // ── Summary ─────────────────────────────────────────────────────────────
  const passed  = results.filter(r => r.passed).length;
  const failed  = results.length - passed;
  const totalMs = results.reduce((s, r) => s + r.durationMs, 0);

  console.log('\n' + '═'.repeat(70));
  console.log('  RESULTS');
  console.log('═'.repeat(70));

  results.forEach(r => {
    const steps = Object.entries(r.steps)
      .map(([k, v]) => `${v === 'ok' ? '✓' : v === 'fail' ? '✗' : '○'} ${k.replace('step', 'S').replace('_', '·')}`)
      .join('  ');
    const icon = r.passed ? '✅' : '❌ FAIL';
    console.log(`  ${icon.padEnd(8)} ${r.name.padEnd(32)} ${steps}`);
  });

  console.log('\n' + '─'.repeat(70));
  console.log(`  Passed: ${passed}/${results.length}   Failed: ${failed}   Total: ${(totalMs / 1000).toFixed(1)}s`);
  console.log('─'.repeat(70) + '\n');

  if (failed > 0) {
    console.log('  Failed industries:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`    ❌  ${r.name}`);
      r.errors.forEach(e => console.log(`         ${e}`));
    });
    console.log('\n  Screenshots saved to test-results/\n');
    process.exit(1);
  } else {
    console.log('  ✅ All industries passed D2 validation!\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
