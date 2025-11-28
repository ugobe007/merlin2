# SmartWizard V3 - Complete Restoration Plan
## Restore V2's Proven Architecture + Add Automated Testing

## IMPLEMENTATION CHECKLIST

### Phase 1: Restore V2 Components (30 min)
- [ ] Copy Step3_AddRenewables from V2 to V3
- [ ] Copy Step4_LocationPricing from V2 to V3  
- [ ] Copy AIStatusIndicator from V2 to V3
- [ ] Add Power Status Bar to V3
- [ ] Update SmartWizardV3.tsx to use V2 steps

### Phase 2: Fix Navigation (15 min)
- [ ] Remove ALL duplicate navigation buttons
- [ ] Verify single navigation bar at bottom only
- [ ] Test back button on each step
- [ ] Test next button on each step

### Phase 3: Add Grid Reliability Question (15 min)
- [ ] Add to office questions in database
- [ ] Add to baselineService.ts calculation
- [ ] Update types to include gridConnection

### Phase 4: Route Fixes (15 min)
- [ ] Fix Step 5 (Quote Summary) component path
- [ ] Fix Step 6 (Complete Page) component path
- [ ] Verify all imports are correct
- [ ] Test end-to-end navigation

### Phase 5: Automated Testing (30 min)
- [ ] Create Playwright test for complete flow
- [ ] Test: Select Office Building
- [ ] Test: Answer all questions
- [ ] Test: Configure power sources
- [ ] Test: Select location
- [ ] Test: Generate quote
- [ ] Test: No duplicate buttons
- [ ] Test: No navigation breaks

## V2 STEP FLOW TO RESTORE:

```
Step -1: Intro (keep V3's version)
Step 0: Industry Template (keep V3's version)  
Step 1: Questions (keep V3's version, ADD grid question)
Step 2: Battery Configuration (RESTORE V2's Step3_SimpleConfiguration)
Step 3: Add Renewables (RESTORE V2's Step3_AddRenewables) ← THE MAGIC STEP
Step 4: Location & Pricing (RESTORE V2's Step4_LocationPricing - COMBINED)
Step 5: Quote Summary (fix route, use V2's Step5_QuoteSummary)
```

## POWER STATUS BAR (From V2 - Line 1847):

```tsx
{step >= 2 && step <= 5 && baselineResult && (
  <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white px-6 py-3">
    <div className="flex items-center justify-between">
      <!-- Shows: Peak, Grid, Battery, Generation stats -->
      <!-- Alerts if backup power needed -->
      <!-- Shows green check if grid adequate -->
    </div>
  </div>
)}
```

## AI STATUS INDICATOR (From V2 - Line 1823):

```tsx
<AIStatusIndicator compact={true} />
```

## TESTING SCRIPT (Playwright):

```typescript
test('Complete SmartWizard Flow', async ({ page }) => {
  // 1. Open wizard
  await page.goto('http://localhost:5177');
  await page.click('[data-testid="open-wizard"]');
  
  // 2. Select Office Building
  await page.click('[data-testid="use-case-office"]');
  await page.click('button:has-text("Next")');
  
  // 3. Answer questions
  await page.fill('[name="squareFootage"]', '50000');
  await page.fill('[name="monthlyElectricBill"]', '2500');
  await page.selectOption('[name="primaryGoals"]', 'save-money');
  await page.selectOption('[name="gridReliability"]', 'reliable');
  await page.click('button:has-text("Continue")');
  
  // 4. Verify ONLY ONE next button
  const nextButtons = await page.locator('button:has-text("Next")').count();
  expect(nextButtons).toBe(1);
  
  // 5. Battery configuration - should show calculated values
  await expect(page.locator('[data-testid="battery-mw"]')).toBeVisible();
  await page.click('button:has-text("Next")');
  
  // 6. Add Renewables - verify power status bar
  await expect(page.locator('[data-testid="power-status-bar"]')).toBeVisible();
  await page.click('[data-testid="add-solar"]');
  await page.click('button:has-text("Next")');
  
  // 7. Location & Pricing
  await page.selectOption('[name="location"]', 'California');
  await page.fill('[name="electricityRate"]', '0.15');
  await page.click('button:has-text("Next")');
  
  // 8. Quote Summary - verify no errors
  await expect(page.locator('[data-testid="quote-summary"]')).toBeVisible();
  await expect(page.locator('text=NaN')).toHaveCount(0);
  
  // 9. Complete
  await page.click('button:has-text("Generate Quote")');
  await expect(page.locator('[data-testid="quote-complete"]')).toBeVisible();
});
```

## DUPLICATE BUTTON LOCATIONS TO FIX:

1. `Step2_UseCase.tsx` - lines 200-220 (already removed, verify)
2. `Step3_Configuration.tsx` - bottom navigation
3. Check ALL step components for duplicate buttons

## SUCCESS CRITERIA:

✅ All 6 steps navigate correctly
✅ Power Status Bar visible from Step 2-5
✅ AI Status Indicator shows in header
✅ NO duplicate navigation buttons anywhere
✅ Grid reliability question captured
✅ Math is correct (50K sq ft = 0.3 MW peak, not 1 MW)
✅ Intelligent recommendations shown
✅ Quote generates without NaN errors
✅ Automated test passes 100%

## FILES TO MODIFY:

1. `/src/components/wizard/SmartWizardV3.tsx` - Add V2 steps, Power Status Bar
2. `/src/hooks/useSmartWizard.ts` - Already has auto-calculation
3. `/src/components/wizard/steps_v3/Step2_UseCase.tsx` - Verify no duplicate buttons
4. `/src/components/wizard/steps_v3/Step3_Configuration.tsx` - Replace with V2's version
5. `/src/components/wizard/steps_v3/Step4_LocationPricing.tsx` - Restore from V2
6. `/tests/e2e/smartwizard-complete.spec.ts` - Create automated test

## MATH VERIFICATION:

50,000 sq ft office building:
- Power density: 6 W/sq ft (industry standard)
- Peak load: 50,000 × 6 = 300,000 W = 300 kW = 0.3 MW
- NOT 1 MW (user's data shows $2,500/mo bill ≈ 300 kW average)
- Battery: 0.3 MW × 4 hours = 1.2 MWh
- If "save money" goal + reliable grid → Recommend solar
- If "save money" goal + unreliable grid → Recommend solar + small generator

## IMPLEMENTATION ORDER:

1. Create automated test FIRST (TDD approach)
2. Run test - should FAIL
3. Fix components one by one
4. Re-run test after each fix
5. When test passes 100% → DONE

This ensures NO MORE GUESSING!
