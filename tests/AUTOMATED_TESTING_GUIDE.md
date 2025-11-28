# Automated Error Detection for Smart Wizard

## 🎯 Purpose

Automated tests to catch consistent wizard errors:
- Console spam (1260+ messages)
- Validation failures (missing defaults)
- JavaScript errors
- UI blocking issues
- Performance problems

## 🛠️ Test Tools Created

### 1. **Playwright Test Suite** (`tests/e2e/wizard-validation.spec.ts`)
Fast, comprehensive test cases for:
- ✅ Excessive logging detection (>100 messages)
- ✅ Validation error detection
- ✅ JavaScript error capture
- ✅ Next button state verification
- ✅ AI Status Indicator removal check
- ✅ Generator field removal check
- ✅ Select dropdown default values
- ✅ UI overlay blocking
- ✅ PowerMeter display

### 2. **Puppeteer Error Sniffer** (`tests/puppeteer/wizard-error-sniffer.js`)
Detailed error analysis with:
- 📊 Console message categorization
- 🔍 Full error stack traces
- 🌐 Network failure detection
- ⚡ Performance metrics (DOM size, memory)
- 📈 Overall health score (0-100)

## 🚀 Running Tests

### Prerequisites
```bash
# Start dev server first
npm run dev
```

### Quick Test (Playwright)
```bash
npx playwright test tests/e2e/wizard-validation.spec.ts --reporter=list
```

### Detailed Analysis (Puppeteer)
```bash
node tests/puppeteer/wizard-error-sniffer.js
```

### Run All Tests
```bash
./tests/run-wizard-tests.sh both
```

## 📊 What Tests Catch

### Fixed Issues (Should Pass Now)
1. ✅ **Excessive Logging**
   - Test: `should not have excessive console logging`
   - Checks: <100 total messages
   - Before: 1260+ messages
   - After: <10 messages

2. ✅ **Missing Default Values**
   - Test: `should have working select dropdowns with default values`
   - Checks: All required selects have values
   - Before: `primaryGoals` empty → validation failed
   - After: Auto-populated from database

3. ✅ **AI Status Indicator**
   - Test: `should not show AI Status Indicator`
   - Checks: No "Not Used" badge visible
   - Before: Badge showing
   - After: Completely removed

4. ✅ **Generator Field**
   - Test: `should not show Generator Capacity field`
   - Checks: Field hidden for office building
   - Before: Shown and breaking logic
   - After: Hidden via conditional

5. ✅ **Next Button Disabled**
   - Test: `should enable Next button when all required fields filled`
   - Checks: Button enabled with defaults
   - Before: Disabled due to missing `primaryGoals`
   - After: Enabled immediately

### Ongoing Monitoring
6. 🔍 **JavaScript Errors**
   - Test: `should not have JavaScript errors`
   - Catches: Uncaught exceptions, type errors
   - Fails if: Any console.error() or page error

7. 🔍 **Validation Failures**
   - Test: `should not have validation errors when form has default values`
   - Catches: "Missing required fields" logs
   - Fails if: Validation errors with defaults applied

8. 🔍 **Per-Question Logging**
   - Test: `should not log per-question renders`
   - Checks: Zero "Rendering question:" messages
   - Before: 17 questions × rerenders = 100+ logs
   - After: 0 logs

## 📈 Puppeteer Report Example

```
======================================================================
📊 WIZARD ERROR SNIFFER REPORT
======================================================================

📝 CONSOLE MESSAGES:
  Total Logs: 8
  Warnings: 0
  Errors: 0
  ✅ Acceptable log count

✅ NO JAVASCRIPT ERRORS

✅ NO VALIDATION ERRORS

✅ NO NETWORK ERRORS

✅ ALL SELECT FIELDS HAVE VALUES

🔘 NEXT BUTTON:
  ✅ ENABLED

⚡ PERFORMANCE:
  DOM Content Loaded: 234ms
  Load Complete: 45ms
  DOM Interactive: 289ms
  DOM Node Count: 1847
  JS Heap Size: 12MB

🔍 SPECIFIC ISSUE CHECKS:
  ✅ No per-question render logs
  ✅ Validation logging: 0 calls
  ✅ No AI Status Indicator logs

📈 OVERALL SCORE:
  100/100
  🎉 EXCELLENT - No critical issues
```

## 🎨 CSS/Animation Testing

**Note**: Current tests don't check for "jumpy" animations.

To add CSS transition testing:
```javascript
// In Playwright test
test('should have smooth transitions', async ({ page }) => {
  // Measure transition duration
  const transitionTime = await page.evaluate(() => {
    const wizard = document.querySelector('.wizard-container');
    const style = window.getComputedStyle(wizard);
    return parseFloat(style.transitionDuration);
  });
  
  // Should be < 500ms to avoid jank
  expect(transitionTime).toBeLessThan(0.5);
});
```

## 🔧 Troubleshooting

### Dev Server Not Running
```bash
# Error: Cannot connect to localhost:5177
npm run dev
```

### Playwright Not Installed
```bash
npm install -D @playwright/test
npx playwright install
```

### Puppeteer Not Installed
```bash
npm install -D puppeteer
```

### Tests Failing After Code Changes
1. Clear browser cache: `Cmd+Shift+R`
2. Rebuild: `npm run build`
3. Restart dev server: `npm run dev`
4. Re-run tests

## 📝 Adding New Tests

### Playwright Test Template
```typescript
test('should [describe behavior]', async ({ page }) => {
  // Navigate to wizard
  await page.goto('http://localhost:5177');
  await page.click('button:has-text("Get Started")');
  
  // Your test logic here
  const element = page.locator('selector');
  await expect(element).toBeVisible();
});
```

### Puppeteer Check Template
```javascript
// In generateReport() method
const customCheck = this.consoleLogs.filter(log =>
  log.text.includes('YOUR_PATTERN')
);
if (customCheck.length > 0) {
  console.log(`  ⚠️  Found ${customCheck.length} custom issues`);
  score -= 10;
}
```

## 🎯 CI/CD Integration

### GitHub Actions Example
```yaml
name: Wizard Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run dev &
      - run: sleep 5
      - run: npx playwright test tests/e2e/wizard-validation.spec.ts
```

## 🚨 Error Thresholds

**Failing Conditions**:
- Console messages: >100
- JavaScript errors: >0
- Validation errors: >0
- Empty required selects: >0
- Next button disabled: true (with defaults)

**Warning Conditions**:
- Console messages: >50
- DOM node count: >5000
- JS heap size: >50MB
- Validation logging: >10 calls

## 📊 Test Coverage

Current coverage:
- ✅ Step 1: Use case selection
- ✅ Step 2: Questionnaire (office building)
- ❌ Step 3: Battery configuration (TODO)
- ❌ Step 4: Location & pricing (TODO)
- ❌ Step 5: Quote summary (TODO)

To add Step 3 coverage:
```typescript
// Continue flow from Step 2
await page.click('button:has-text("Next")');
await page.waitForSelector('text=Battery Configuration');
// Add battery config assertions
```

## 🔄 Regression Prevention

**Before deploying new wizard changes**:
1. Run full test suite: `./tests/run-wizard-tests.sh both`
2. Check Puppeteer score: Must be ≥90/100
3. Verify 0 JavaScript errors
4. Confirm console logs <20 messages

**After deployment**:
1. Run smoke test: `npx playwright test wizard-validation.spec.ts -g "comprehensive"`
2. Monitor production console logs
3. Check user feedback for validation issues

---

**Created**: November 25, 2025  
**Status**: ✅ Active - Ready for use  
**Maintained by**: Development team  
