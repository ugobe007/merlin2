# Package.json Additions

Add these to your existing `package.json`:

## 📜 Scripts to Add

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run tests/unit",
    
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:firefox": "playwright test --project=firefox",
    "test:e2e:webkit": "playwright test --project=webkit",
    "test:e2e:mobile": "playwright test --project='Mobile Chrome' --project='Mobile Safari'",
    
    "test:all": "npm run test && npm run test:e2e",
    "test:ci": "npm run test:coverage && npm run test:e2e -- --reporter=junit",
    
    "playwright:install": "playwright install",
    "playwright:codegen": "playwright codegen",
    "playwright:show-report": "playwright show-report",
    "playwright:show-trace": "playwright show-trace"
  }
}
```

## 📦 DevDependencies to Install

```bash
npm install --save-dev \
  @playwright/test@^1.40.0 \
  @testing-library/jest-dom@^6.1.5 \
  @testing-library/react@^14.1.2 \
  @testing-library/react-hooks@^8.0.1 \
  @testing-library/user-event@^14.5.1 \
  @types/node@^20.10.0 \
  @vitest/coverage-v8@^1.0.4 \
  @vitest/ui@^1.0.4 \
  jsdom@^23.0.1 \
  vitest@^1.0.4
```

Or add to package.json manually:

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/react-hooks": "^8.0.1",
    "@testing-library/user-event": "^14.5.1",
    "@types/node": "^20.10.0",
    "@vitest/coverage-v8": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "jsdom": "^23.0.1",
    "vitest": "^1.0.4"
  }
}
```

## ⚠️ Note About Existing Dependencies

These dependencies might already exist in your project. If so:
- **vite**: Keep your existing version
- **react**, **react-dom**: Keep your existing versions
- **@supabase/supabase-js**: Keep your existing version

The important ones to add are:
1. `vitest` and related packages for unit testing
2. `@playwright/test` for E2E testing
3. `@testing-library/*` packages for React component testing
4. `jsdom` for DOM simulation in tests

## 🚀 Quick Install Command

```bash
# Install all test dependencies at once
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 @playwright/test @testing-library/react @testing-library/react-hooks @testing-library/jest-dom @testing-library/user-event jsdom @types/node

# Then install Playwright browsers
npx playwright install
```

## ✅ Verify Installation

After installing, verify everything works:

```bash
# Check Vitest
npx vitest --version

# Check Playwright
npx playwright --version

# List available test browsers
npx playwright test --list
```

## 📋 Complete Example

Here's how your package.json scripts section might look after adding everything:

```json
{
  "name": "your-bess-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run tests/unit",
    
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    
    "test:all": "npm run test && npm run test:e2e",
    "test:ci": "npm run test:coverage && npm run test:e2e -- --reporter=junit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/react-hooks": "^8.0.1",
    "@testing-library/user-event": "^14.5.1",
    "@types/node": "^20.10.0",
    "@vitest/coverage-v8": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "jsdom": "^23.0.1",
    "vite": "^5.0.8",
    "vitest": "^1.0.4"
  }
}
```
