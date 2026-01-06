# Merlin Wizard E2E Tests

End-to-end tests for the Merlin industry profile questionnaire wizard using three testing frameworks:

## Frameworks

### 1. Playwright (`/e2e`)
- Full browser automation
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile viewport testing
- Built-in parallelization
- Video/screenshot capture

### 2. Puppeteer (`/puppeteer`)
- Chrome/Chromium automation
- Screenshot comparison
- PDF report generation
- Performance metrics
- Custom visual testing

### 3. Stagehand (`/stagehand`)
- AI-powered browser automation
- Natural language test actions
- Resilient to UI changes
- Semantic element selection
- Automatic data extraction

---

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run all tests
npm test

# Run specific framework
npm run test:playwright
npm run test:puppeteer
npm run test:stagehand
```

---

## Test Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all test suites |
| `npm run test:playwright` | Playwright tests (headless) |
| `npm run test:playwright:ui` | Playwright with UI mode |
| `npm run test:playwright:debug` | Playwright with debugger |
| `npm run test:playwright:headed` | Playwright visible browser |
| `npm run test:puppeteer` | Puppeteer visual tests |
| `npm run test:stagehand` | AI-powered Stagehand tests |
| `npm run test:smoke` | Quick smoke tests only |
| `npm run report` | View Playwright HTML report |

### Industry-Specific Tests

```bash
npm run test:hotel
npm run test:carwash
npm run test:datacenter
npm run test:hospital
npm run test:manufacturing
npm run test:retail
npm run test:restaurant
npm run test:office
npm run test:university
npm run test:evcharging
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_URL` | `http://localhost:5173` | Base URL for tests |
| `CI` | - | Set in CI environments |
| `ANTHROPIC_API_KEY` | - | Required for Stagehand tests |

---

## Test Structure

```
tests/
├── e2e/                          # Playwright tests
│   └── wizard.spec.ts            # Main wizard test suite
├── puppeteer/                    # Puppeteer tests
│   ├── setup.ts                  # Jest setup
│   └── wizard.test.ts            # Visual/PDF tests
├── stagehand/                    # Stagehand tests
│   └── wizard.test.ts            # AI-powered tests
├── screenshots/                  # Generated screenshots
├── playwright.config.ts          # Playwright config
├── jest.puppeteer.config.js      # Jest config for Puppeteer
└── package.json                  # Test dependencies
```

---

## Test Coverage

### All 10 Industries Tested

| Industry | Playwright | Puppeteer | Stagehand |
|----------|------------|-----------|-----------|
| Hotel | ✅ Full flow | ✅ Visual | ✅ AI |
| Car Wash | ✅ Full flow | ✅ Visual | ✅ AI |
| EV Charging | ✅ Full flow | ✅ Visual | ✅ AI |
| Data Center | ✅ Full flow | ✅ Visual | ✅ AI |
| Manufacturing | ✅ Full flow | ✅ Visual | ✅ AI |
| Hospital | ✅ Full flow | ✅ Visual | ✅ AI |
| University | ✅ Full flow | ✅ Visual | ✅ AI |
| Retail | ✅ Full flow | ✅ Visual | ✅ AI |
| Restaurant | ✅ Full flow | ✅ Visual | ✅ AI |
| Office | ✅ Full flow | ✅ Visual | ✅ AI |

### Test Categories

- **Navigation**: Page loading, step navigation, back/forward
- **Industry Selection**: All 10 industries selectable
- **Question Flow**: Conditional questions, required fields
- **Validation**: Error messages, range validation
- **Calculations**: Output verification, range checking
- **Responsive**: Mobile, tablet, desktop viewports
- **Performance**: Load time, calculation time
- **Visual**: Screenshots, PDF generation

---

## Expected Results Ranges

| Industry | Peak kW Range | BESS kWh Range |
|----------|---------------|----------------|
| Hotel (175 rooms) | 250 - 600 | 200 - 800 |
| Car Wash (express) | 150 - 400 | 100 - 400 |
| Data Center (100 racks) | 800 - 2000 | 500 - 2000 |
| Hospital (200 beds) | 1500 - 4000 | 1000 - 4000 |
| Manufacturing (150K sqft) | 1000 - 3000 | 500 - 2000 |
| Retail (grocery) | 300 - 600 | 300 - 1000 |
| Restaurant (casual) | 100 - 250 | 100 - 400 |
| Office (mid-rise) | 400 - 1000 | 200 - 800 |
| University (large) | 30000 - 100000 | 20000 - 75000 |
| EV Hub (16 DCFC) | 1000 - 3000 | 500 - 2000 |

---

## CI Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: |
          npm ci
          npx playwright install --with-deps
      - name: Run Playwright tests
        run: npm run test:playwright
      - name: Upload report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Debugging

### Playwright
```bash
# Debug mode with inspector
npx playwright test --debug

# UI mode for interactive debugging
npx playwright test --ui

# Run single test
npx playwright test -g "Hotel"
```

### Puppeteer
```bash
# Run with visible browser
HEADLESS=false npm run test:puppeteer

# Run single test file
npx jest tests/puppeteer/wizard.test.ts --testNamePattern="Hotel"
```

### Stagehand
```bash
# Enable verbose logging
STAGEHAND_VERBOSE=true npm run test:stagehand
```

---

## Adding New Tests

### Playwright Example
```typescript
test('should complete new industry flow', async ({ page }) => {
  await navigateToWizard(page);
  await selectIndustry(page, 'newIndustry');
  
  // Fill questions
  await fillQuestion(page, 'questionId', 'value', 'select');
  
  // Submit and verify
  await submitWizard(page);
  const results = await getResults(page);
  expect(results.peakKw).toBeGreaterThan(100);
});
```

### Stagehand Example
```typescript
await stagehand.act({
  action: 'Select the new industry and fill in 50,000 square feet'
});

const results = await stagehand.extract({
  instruction: 'Get the peak demand and BESS recommendation',
  schema: QuoteResultSchema
});
```

---

## Troubleshooting

### Tests timing out
- Increase timeout in config
- Check if dev server is running
- Verify selectors match current UI

### Screenshots not capturing
- Check `tests/screenshots/` directory exists
- Verify write permissions

### Stagehand API errors
- Ensure `ANTHROPIC_API_KEY` is set
- Check API rate limits

---

## License

Internal use only - Merlin Energy Platform
