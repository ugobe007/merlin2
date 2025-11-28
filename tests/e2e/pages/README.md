# E2E Tests - Page Objects

## Overview

This directory contains Page Object Models (POMs) for end-to-end testing with Playwright. Page objects encapsulate page-specific knowledge and provide a clean API for test scripts.

## Available Page Objects

### BasePage
Base class providing common functionality for all page objects:
- Navigation methods (`goto`, `waitForPageLoad`)
- Element interactions (`fillField`, `clickButton`)
- Assertions (`expectVisible`, `expectText`)
- Utility methods (screenshots, storage, scrolling)

### QuoteBuilderPage
Page object for BESS Quote Builder interface:
```typescript
import { QuoteBuilderPage } from '@/tests/e2e/pages/QuoteBuilderPage';

const quotePage = new QuoteBuilderPage(page);
await quotePage.navigateTo();
await quotePage.fillFacilityDetails({
  facilityType: 'medical_office',
  squareFootage: '50000'
});
await quotePage.generateQuote();
const results = await quotePage.getQuoteResults();
```

### SmartWizardPage
Multi-step wizard page object:
```typescript
import { SmartWizardPage } from '@/tests/e2e/pages/SmartWizardPage';

const wizardPage = new SmartWizardPage(page);
await wizardPage.completeFullWizard(
  { industryCategory: 'commercial', useCase: 'medical-office' },
  { answers: { num_exam_rooms: 10 } },
  { solarMWp: 2 }
);
```

### DashboardPage
User dashboard with saved quotes:
```typescript
import { DashboardPage } from '@/tests/e2e/pages/DashboardPage';

const dashboardPage = new DashboardPage(page);
await dashboardPage.navigateTo();
const quotes = await dashboardPage.getQuoteCards();
await dashboardPage.openQuote(quotes[0].id);
```

## Usage Examples

### Basic Test
```typescript
import { test } from '@playwright/test';
import { QuoteBuilderPage } from './pages/QuoteBuilderPage';

test('generate quote for medical office', async ({ page }) => {
  const quotePage = new QuoteBuilderPage(page);
  
  await quotePage.navigateTo();
  await quotePage.fillFacilityDetails({
    facilityType: 'medical_office',
    squareFootage: '50000',
    operatingHours: '12'
  });
  await quotePage.generateQuote();
  await quotePage.expectQuoteResultsVisible();
});
```

### Complex Flow
```typescript
test('complete quote workflow', async ({ page }) => {
  const wizardPage = new SmartWizardPage(page);
  const dashboardPage = new DashboardPage(page);
  
  // Complete wizard
  await wizardPage.navigateTo();
  await wizardPage.completeFullWizard(step1, step2, step3);
  
  // Save quote
  await wizardPage.saveProgress();
  
  // Verify in dashboard
  await dashboardPage.navigateTo();
  await dashboardPage.expectQuoteCount(1);
});
```

## Best Practices

1. **Encapsulation**: Keep page-specific details in page objects
2. **Single Responsibility**: One page object per page/component
3. **Reusable Methods**: Create methods for common operations
4. **Descriptive Names**: Use clear, intention-revealing names
5. **Wait Strategies**: Always wait for elements before interacting
6. **Error Handling**: Provide helpful error messages
7. **Extend BasePage**: Inherit common functionality
8. **Use Data Test IDs**: Prefer `data-testid` for stability

## Adding New Page Objects

1. Create new file in `tests/e2e/pages/`
2. Extend `BasePage`
3. Define locators as private getters
4. Implement page-specific methods
5. Add TypeScript interfaces for data structures
6. Document with JSDoc comments

Example:
```typescript
import { BasePage } from './BasePage';

export class NewPage extends BasePage {
  private get elementLocator() {
    return this.getByTestId('element-id');
  }

  async doSomething(): Promise<void> {
    await this.elementLocator.click();
  }
}
```

## Test Data Builders

Combine with test data builders for cleaner tests:
```typescript
import { FacilityBuilder } from '@/tests/utils/builders/FacilityBuilder';

const facility = new FacilityBuilder()
  .asMedicalOffice()
  .large()
  .build();

await quotePage.fillFacilityDetails(facility);
```
