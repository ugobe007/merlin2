# Test Suite Installation & Setup Guide

## 📦 Quick Installation

Run this command to install all test dependencies:

```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/react-hooks @testing-library/user-event @testing-library/jest-dom jsdom @playwright/test
```

Then install Playwright browsers:

```bash
npx playwright install
```

## 📁 Files Created

### Core Configuration
- ✅ `vitest.config.ts` - Vitest test runner configuration
- ✅ `playwright.config.ts` - Playwright E2E test configuration
- ✅ `tests/setup.ts` - Global test environment setup

### Documentation
- ✅ `tests/README.md` - Comprehensive test suite documentation
- ✅ `tests/QUICK_START.md` - Quick reference guide

### Test Files
- ✅ `tests/unit/workflow.test.ts` - 50+ unit & integration tests
- ✅ `tests/e2e/bess-quote-builder.test.ts` - 30+ E2E tests

### Utilities
- ✅ `tests/utils/test-helpers.ts` - Mock services, test data, helpers

### Package Scripts
- ✅ Updated `package.json` with test commands

## 🚀 Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Run all unit tests once
npm run test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests headless
npm run test:e2e

# Run E2E tests with UI (recommended for debugging)
npm run test:e2e:ui

# Run E2E tests with browser visible (headed mode)
npm run test:e2e:headed

# Run E2E tests in debug mode (step through tests)
npm run test:e2e:debug
```

### Legacy Jest Tests

```bash
# Run legacy Jest tests (if needed)
npm run test:legacy
npm run test:legacy:watch
npm run test:legacy:coverage
```

## ⚙️ Critical Configuration Notes

### Port Configuration (IMPORTANT!)

**Vite dev server runs on port 5178, NOT 5173!**

Verify in these files:
- `vite.config.ts` - `server.port: 5178`
- `playwright.config.ts` - `baseURL: 'http://localhost:5178'`
- `tests/e2e/*.test.ts` - All page.goto() calls use port 5178

### Environment Variables

Create `.env.test` file (if not exists):

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Or use the same `.env` file for both dev and test.

## 📊 Coverage Thresholds

Current thresholds (in `vitest.config.ts`):
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## 🧪 Test Structure

```
tests/
├── setup.ts                 # Global test setup
├── utils/
│   └── test-helpers.ts     # Mock services & utilities
├── unit/
│   └── workflow.test.ts    # 50+ unit & integration tests
└── e2e/
    └── bess-quote-builder.test.ts  # 30+ E2E tests
```

## 🔍 What Gets Tested

### Unit & Integration Tests (workflow.test.ts)
1. **BaselineService** - Configuration fetching, caching, duplicate call prevention
2. **AI Data Collection** - Daily updates, data sources, scheduling
3. **Cache Service** - Set/get/delete, complex data structures
4. **Integration Workflows** - Complete quote generation, concurrent requests
5. **Performance** - Baseline <150ms avg, AI collection <1000ms avg

### E2E Tests (bess-quote-builder.test.ts)
1. **App Initialization** - Load without errors, cache init, no duplicate Supabase clients
2. **Smart Wizard** - Modal operations, navigation, state management
3. **Baseline Configuration** - Calculations, no duplicate API calls, caching
4. **Quote Generation** - Complete quotes with all sections
5. **Performance** - Page load <3s, baseline <2s, re-render tracking
6. **Error Handling** - API failures, validation, retry logic
7. **User Workflows** - Full journeys from wizard to PDF export

## 🐛 Known Issues Being Tested

These tests specifically validate fixes for console log issues:

1. **Duplicate BaselineService Calls**
   - Issue: 6 identical calls with same parameters
   - Test: `workflow.test.ts` - "should handle 6 simultaneous identical calls efficiently"
   - Expected: Only 1 API call, not 6

2. **Multiple Supabase Clients**
   - Issue: Multiple GoTrueClient instances in same browser context
   - Test: `bess-quote-builder.test.ts` - "should not create multiple Supabase clients"
   - Expected: No GoTrueClient warnings in console

3. **Excessive Re-renders**
   - Issue: AdvancedQuoteBuilder rendering multiple times unnecessarily
   - Test: `bess-quote-builder.test.ts` - "should not have excessive component re-renders"
   - Expected: <10 renders per user action

## 📝 Next Steps

1. **Install dependencies** (see Quick Installation above)
2. **Run unit tests**: `npm run test`
3. **Run E2E tests**: `npm run test:e2e:ui` (UI mode recommended first)
4. **Check coverage**: `npm run test:coverage`
5. **Review failures**: If tests fail, implement the 3 priority fixes documented in `tests/QUICK_START.md`

## 🔧 Troubleshooting

### Port 5178 vs 5173 Issues

If E2E tests fail with connection errors:
1. Check `vite.config.ts` - Ensure `server.port: 5178`
2. Check `playwright.config.ts` - Ensure `baseURL: 'http://localhost:5178'`
3. Kill any processes on port 5178: `lsof -ti:5178 | xargs kill -9`
4. Restart dev server: `npm run dev`

### Vitest Not Finding Modules

If imports fail with `Cannot find module`:
1. Ensure `vitest.config.ts` has correct `resolve.alias` paths
2. Match aliases with `vite.config.ts` and `tsconfig.json`
3. Restart TypeScript server in VS Code

### Playwright Browser Issues

If browser installation fails:
```bash
npx playwright install --force
```

### Test Timeouts

If tests timeout:
- Increase timeout in `vitest.config.ts` (testTimeout)
- Increase timeout in `playwright.config.ts` (timeout)
- Check network connectivity
- Ensure Supabase credentials are valid

## 📚 Documentation

- Full guide: `tests/README.md`
- Quick start: `tests/QUICK_START.md`
- Priority fixes: `tests/QUICK_START.md` (3 code examples)

## 🎯 Success Criteria

Tests pass when:
- ✅ No duplicate BaselineService calls (max 1 per unique request)
- ✅ No multiple Supabase client warnings
- ✅ No excessive re-renders (≤10 per user action)
- ✅ Baseline calculations <200ms
- ✅ AI data collection <2s
- ✅ Page load <3s
- ✅ All workflows complete without errors

---

**Ready to test!** Start with `npm run test` to verify setup.
