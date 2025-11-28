# Test Commands Reference

Complete guide to all available test commands in Merlin2 BESS Quote Builder.

## 🧪 Unit & Integration Tests (Vitest)

### Basic Commands

```bash
# Run all tests once
npm run test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run with interactive UI
npm run test:ui

# Run only unit tests (tests/unit directory)
npm run test:unit
```

### Test Output Locations

- **Coverage Report**: `coverage/` directory
  - Open `coverage/index.html` in browser for detailed view
- **Test Results**: Console output + HTML report

### Coverage Thresholds

Current requirements (configured in `vitest.config.ts`):
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## 🎭 End-to-End Tests (Playwright)

### Basic E2E Commands

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with Playwright UI (recommended for debugging)
npm run test:e2e:ui

# Run with browser visible (headed mode)
npm run test:e2e:headed

# Run in debug mode (step through tests)
npm run test:e2e:debug
```

### Browser-Specific Tests

```bash
# Run tests only in Chromium
npm run test:e2e:chromium

# Run tests only in Firefox
npm run test:e2e:firefox

# Run tests only in WebKit (Safari)
npm run test:e2e:webkit

# Run tests in mobile browsers only
npm run test:e2e:mobile
```

### Playwright Utilities

```bash
# Install/update Playwright browsers
npm run playwright:install

# Generate test code from browser interactions
npm run playwright:codegen

# Show last test report
npm run playwright:show-report

# Show trace for failed test
npm run playwright:show-trace
```

### E2E Test Output Locations

- **HTML Report**: `playwright-report/` directory
  - Open `playwright-report/index.html` after tests
- **Test Results**: `test-results/` directory
  - Screenshots (on failure)
  - Videos (on failure)
  - Traces (on retry)
- **JUnit Report**: `test-results/junit.xml` (CI)
- **JSON Report**: `test-results/results.json` (CI)

## 🔄 Combined & CI Commands

### Run All Tests

```bash
# Run both unit and E2E tests sequentially
npm run test:all

# Run tests as they would in CI pipeline
npm run test:ci
```

### CI-Specific Behavior

When `CI=true` environment variable is set:
- Unit tests: Coverage report generated
- E2E tests: 
  - 2 retries on failure
  - Single worker (no parallelism)
  - JUnit XML output for CI integration

Run in CI mode locally:
```bash
CI=true npm run test:all
```

## 🧹 Legacy Jest Tests

```bash
# Run old Jest tests (if needed)
npm run test:legacy

# Watch mode
npm run test:legacy:watch

# With coverage
npm run test:legacy:coverage
```

**Note**: New tests should use Vitest, not Jest.

## 📊 Performance Tests

```bash
# Quick performance test
npm run perf

# Profile wizard flow
npm run perf:profile

# Full performance test suite
npm run perf:full
```

## 🎯 Common Workflows

### During Development

```bash
# Start dev server in one terminal
npm run dev

# Run tests in watch mode in another terminal
npm run test:watch
```

### Before Committing

```bash
# Run all tests with coverage
npm run test:coverage

# Check for any regressions
npm run test:e2e:ui
```

### Debugging Failing Tests

```bash
# For unit tests - use UI mode
npm run test:ui

# For E2E tests - use debug mode
npm run test:e2e:debug

# Or run specific test file
npm run test tests/unit/workflow.test.ts

# Or run specific E2E test
npm run test:e2e tests/e2e/bess-quote-builder.test.ts
```

### Generating New E2E Tests

```bash
# Start codegen and interact with your app
npm run playwright:codegen

# This opens:
# 1. Browser window - interact with your app
# 2. Inspector window - generated test code
```

## 🔍 Filtering Tests

### Vitest Filtering

```bash
# Run tests matching pattern
npm run test -- --grep="BaselineService"

# Run tests in specific file
npm run test tests/unit/workflow.test.ts

# Run only tests with .only
npm run test -- --run

# Skip tests with .skip
npm run test -- --no-skip
```

### Playwright Filtering

```bash
# Run specific test file
npm run test:e2e tests/e2e/bess-quote-builder.test.ts

# Run tests matching title
npm run test:e2e -- --grep="should not create multiple Supabase clients"

# Run tests with specific tag
npm run test:e2e -- --grep="@smoke"
```

## 📈 Continuous Monitoring

### Watch Mode Best Practices

1. **Unit tests**: Use `npm run test:watch`
   - Auto-reruns on file changes
   - Fast feedback loop
   - Ideal for TDD

2. **E2E tests**: Use `npm run test:e2e:ui`
   - Visual feedback
   - Easy debugging
   - Step through test execution

### Performance Monitoring

Tests include performance benchmarks:
- Baseline service: <150ms average
- AI collection: <1000ms average
- Page load: <3000ms
- Component renders: <10 per action

Failed performance tests indicate potential issues.

## 🐛 Troubleshooting

### Tests Not Found

```bash
# Make sure you're in project root
cd /path/to/merlin2

# Check test files exist
ls tests/unit/
ls tests/e2e/
```

### Port Conflicts

```bash
# Kill process on port 5178
lsof -ti:5178 | xargs kill -9

# Restart dev server
npm run dev
```

### Coverage Issues

```bash
# Clean coverage cache
rm -rf coverage/

# Rerun with fresh coverage
npm run test:coverage
```

### Playwright Browser Issues

```bash
# Reinstall browsers
npm run playwright:install -- --force

# Check browser installation
npx playwright test --list
```

### Module Not Found Errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reinstall test dependencies
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 @playwright/test @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom jsdom --legacy-peer-deps
```

## 📝 Test File Locations

```
merlin2/
├── tests/
│   ├── setup.ts                    # Global test setup
│   ├── utils/
│   │   └── test-helpers.ts        # Mock services & utilities
│   ├── unit/
│   │   └── workflow.test.ts       # 50+ unit tests
│   └── e2e/
│       └── bess-quote-builder.test.ts  # 30+ E2E tests
├── vitest.config.ts                # Vitest configuration
├── playwright.config.ts            # Playwright configuration
└── package.json                    # Test scripts
```

## 🎓 Learning Resources

### Vitest
- Docs: https://vitest.dev
- API: https://vitest.dev/api
- Config: See `vitest.config.ts`

### Playwright
- Docs: https://playwright.dev
- API: https://playwright.dev/docs/api/class-test
- Config: See `playwright.config.ts`

### Testing Library
- React: https://testing-library.com/react
- DOM: https://testing-library.com/docs/dom-testing-library/intro
- Queries: https://testing-library.com/docs/queries/about

## ✅ Quick Reference

| Task | Command |
|------|---------|
| Run all unit tests | `npm run test` |
| Watch unit tests | `npm run test:watch` |
| Coverage report | `npm run test:coverage` |
| Interactive UI | `npm run test:ui` |
| Run E2E tests | `npm run test:e2e` |
| Debug E2E | `npm run test:e2e:debug` |
| E2E with UI | `npm run test:e2e:ui` |
| Specific browser | `npm run test:e2e:chromium` |
| Generate tests | `npm run playwright:codegen` |
| All tests | `npm run test:all` |
| CI mode | `npm run test:ci` |

---

**Pro Tip**: Use `npm run test:watch` during development and `npm run test:e2e:ui` for debugging E2E issues.
