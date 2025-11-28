# SmartWizardV3 Testing Guide

## 🎯 Testing Status

**Integration**: ✅ COMPLETE  
**ModalRenderer**: ✅ Updated to SmartWizardV3  
**TypeScript**: ✅ Zero errors  
**Dev Server**: 🟢 Running on http://localhost:5178

---

## 🧪 Test Plan

### Phase 1: Basic Functionality ✅

#### Test 1: Wizard Opens
1. Open http://localhost:5178
2. Click "New Quote" button (or wherever wizard is triggered)
3. **Expected**: SmartWizardV3 modal opens with intro screen
4. **Check**: Browser console for errors
5. **Verify**: Step counter shows "Step 1 of 6"

#### Test 2: Use Case Selection
1. Click "Get Started" on intro
2. **Expected**: Industry template selection screen
3. Select "Hotel" use case
4. Click "Next"
5. **Expected**: Move to Step 2 (questions)
6. **Check**: selectedUseCaseSlug is set in hook state

#### Test 3: Answer Questions
1. Fill out all hotel questions:
   - Number of rooms
   - Property type
   - Operating hours
2. Click "Next"
3. **Expected**: Move to Step 3 (configuration)
4. **Check**: useCaseAnswers object populated in hook

#### Test 4: Configure Sizing
1. Adjust storage size slider
2. Adjust duration slider
3. **Expected**: Real-time calculations
4. Click "Next"
5. **Expected**: Move to Step 4 (renewables)

#### Test 5: Add Renewables (Optional)
1. Toggle "Include Renewables"
2. Adjust solar/wind/generator values
3. Click "Next"
4. **Expected**: Move to Step 5 (location)

#### Test 6: Location & Pricing
1. Select location (e.g., "California")
2. Enter electricity rate (e.g., "0.15")
3. Click "Next"
4. **Expected**: Move to Step 6 (quote summary)

#### Test 7: Generate Quote
1. Review quote summary
2. Click "Finish"
3. **Expected**: 
   - Loading indicator appears
   - Quote builds via buildQuote() workflow
   - Complete page shows with quote details
4. **Check**: Browser console for workflow execution

### Phase 2: Calculations Verification 📊

#### Test 8: Compare with V2
To verify calculations match the old wizard:

**Equipment Costs**:
- [ ] Battery system cost matches
- [ ] Inverter cost matches
- [ ] Installation cost matches
- [ ] Total project cost matches

**Financial Metrics**:
- [ ] NPV (Net Present Value) matches
- [ ] IRR (Internal Rate of Return) matches
- [ ] Payback period matches
- [ ] ROI (10-year, 25-year) matches

**Savings**:
- [ ] Annual savings matches
- [ ] Peak shaving savings matches
- [ ] Demand charge reduction matches

**How to Compare**:
1. Use same inputs in both wizards
2. Note down V2 calculations
3. Run V3 with identical inputs
4. Compare line by line

### Phase 3: Export Functionality 📄

#### Test 9: PDF Export
1. On complete page, click "Export PDF"
2. **Expected**: PDF downloads with:
   - Quote summary
   - Equipment breakdown
   - Financial analysis
   - Charts/graphs
3. **Check**: All data renders correctly

#### Test 10: Excel Export
1. Click "Export Excel"
2. **Expected**: Excel file downloads with:
   - Multiple tabs (summary, equipment, financials)
   - All calculations
3. **Open Excel**: Verify formulas and data

#### Test 11: Word Export
1. Click "Export Word"
2. **Expected**: Word document downloads with:
   - Professional formatting
   - All quote sections
   - Appendices (if premium user)
3. **Open Word**: Verify layout

### Phase 4: Edge Cases 🔍

#### Test 12: Navigation
- [ ] Back button works on each step
- [ ] Can navigate forward/backward
- [ ] State persists during navigation
- [ ] Validation prevents skipping required steps

#### Test 13: Close & Reopen
1. Close wizard mid-flow (Step 3)
2. Reopen wizard
3. **Expected**: Fresh state, no leftover data
4. **Check**: useQuoteBuilder reset() called

#### Test 14: Quickstart Data
1. Click "Start Quote" from use case template
2. **Expected**: 
   - Wizard opens
   - Pre-filled with template data
   - Jump to correct step
3. **Check**: localStorage data processed

#### Test 15: Error Handling
Test error scenarios:
- [ ] Invalid inputs (negative numbers, etc.)
- [ ] Network errors (simulate offline)
- [ ] Missing use case data
- [ ] Repository query failures

### Phase 5: Different Use Cases 🏢

Test with multiple industries to verify baselineService works:

#### Test 16: EV Charging Station
1. Select "EV Charging" use case
2. Fill questions:
   - Number of chargers: 8
   - Charging type: Mixed (Level 2 + DC Fast)
3. Complete workflow
4. **Expected**: Calculations specific to EV charging
5. **Verify**: Peak power calculations correct

#### Test 17: Data Center
1. Select "Data Center" use case
2. Fill questions:
   - IT load
   - Redundancy requirements
3. Complete workflow
4. **Expected**: High power density calculations
5. **Verify**: 24/7 operation reflected

#### Test 18: Shopping Center
1. Select "Shopping Center" use case
2. Fill questions:
   - Square footage
   - Tenant count
3. Complete workflow
4. **Expected**: Retail-specific calculations
5. **Verify**: Peak hours accounted for

---

## 🐛 Common Issues & Fixes

### Issue: Wizard doesn't open
**Check**:
```javascript
// Browser console
console.log('ModalRenderer active modals:', modalState);
```
**Fix**: Verify `showSmartWizard` modal state is true

### Issue: Hook state not updating
**Check**:
```javascript
// In SmartWizardV3.tsx
console.log('useQuoteBuilder state:', {
  selectedUseCaseSlug,
  useCaseAnswers,
  sizing
});
```
**Fix**: Verify hook actions are being called

### Issue: buildQuote fails
**Check**:
```javascript
// Browser console
// Look for errors in buildQuote workflow
```
**Fix**: 
1. Verify repositories are accessible
2. Check useCaseService methods work
3. Verify calculateFinancialMetrics is called

### Issue: Calculations wrong
**Check**:
```javascript
// Compare intermediate values
console.log('Baseline result:', baseline);
console.log('Pricing result:', pricing);
console.log('Financial result:', financials);
```
**Fix**: 
1. Verify baselineService calculations
2. Check unifiedPricingService
3. Verify centralizedCalculations

---

## 📊 Browser Console Monitoring

**What to Watch For**:

### Good Signs ✅
```
🎬 [SmartWizardV3] Initializing...
✅ [useQuoteBuilder] Use cases loaded: 30
✅ [useQuoteBuilder] Use case selected: hotel
✅ [useQuoteBuilder] Answers updated
✅ [buildQuote] Starting workflow...
✅ [buildQuote] Use case fetched
✅ [buildQuote] Baseline calculated
✅ [buildQuote] Pricing fetched
✅ [buildQuote] Financial metrics calculated
✅ [buildQuote] Quote complete!
```

### Warning Signs ⚠️
```
⚠️ Repository query slow: 2.5s
⚠️ Calculation took longer than expected
⚠️ No configurations found for use case
```

### Error Signs ❌
```
❌ [useCaseRepository] Failed to fetch use case
❌ [buildQuote] Workflow failed: ...
❌ [useQuoteBuilder] Hook error: ...
TypeError: Cannot read property 'id' of undefined
```

---

## 🎯 Success Criteria

**Phase 1 (Basic)**: ✅ MUST PASS
- [ ] Wizard opens without errors
- [ ] Can navigate through all 6 steps
- [ ] Quote generates successfully
- [ ] Complete page displays

**Phase 2 (Calculations)**: ✅ MUST PASS
- [ ] Equipment costs within 5% of V2
- [ ] Financial metrics within 5% of V2
- [ ] All calculations complete (no NaN/undefined)

**Phase 3 (Exports)**: ✅ SHOULD PASS
- [ ] PDF exports successfully
- [ ] Excel exports successfully
- [ ] Word exports successfully

**Phase 4 (Edge Cases)**: ✅ NICE TO HAVE
- [ ] Navigation works smoothly
- [ ] Error handling graceful
- [ ] State management correct

**Phase 5 (Use Cases)**: ✅ NICE TO HAVE
- [ ] At least 3 different use cases work
- [ ] Industry-specific calculations correct

---

## 🚀 Next Steps After Testing

### If Tests PASS ✅
1. Update SMARTWIZARDV3_INTEGRATION_GUIDE.md with test results
2. Mark todos as complete
3. Consider updating ModalManager.tsx (optional)
4. Begin Phase 2: Expand repository coverage
5. Add unit tests for useQuoteBuilder hook
6. Add integration tests for buildQuote workflow

### If Tests FAIL ❌
1. Document specific failures
2. Check browser console errors
3. Compare with SmartWizardV2 behavior
4. Fix issues in:
   - useQuoteBuilder hook (src/ui/hooks/)
   - buildQuote workflow (src/application/workflows/)
   - Repository methods (src/infrastructure/repositories/)
5. Re-run tests
6. **Rollback Option**: Change ModalRenderer back to SmartWizardV2

---

## 🔧 Quick Rollback (If Needed)

If V3 has critical issues:

```typescript
// src/components/modals/ModalRenderer.tsx
// Line 32: Change back to V2
- const SmartWizard = React.lazy(() => import('../wizard/SmartWizardV3'));
+ const SmartWizard = React.lazy(() => import('../wizard/SmartWizardV2'));
```

Then:
```bash
# Restart dev server
npm run dev
```

V2 is **unchanged** - guaranteed to work!

---

## 📝 Test Log Template

Use this to track your testing:

```
Date: November 22, 2025
Tester: [Your Name]
Browser: [Chrome/Safari/Firefox]
Environment: Development (localhost:5178)

=== PHASE 1: BASIC FUNCTIONALITY ===
[ ] Test 1: Wizard Opens - PASS/FAIL
    Notes: 

[ ] Test 2: Use Case Selection - PASS/FAIL
    Notes:

[ ] Test 3: Answer Questions - PASS/FAIL
    Notes:

[ ] Test 4: Configure Sizing - PASS/FAIL
    Notes:

[ ] Test 5: Add Renewables - PASS/FAIL
    Notes:

[ ] Test 6: Location & Pricing - PASS/FAIL
    Notes:

[ ] Test 7: Generate Quote - PASS/FAIL
    Notes:

=== PHASE 2: CALCULATIONS ===
[ ] Test 8: Compare with V2 - PASS/FAIL
    Equipment Costs: V2: $____ | V3: $____ | Diff: ____%
    NPV: V2: $____ | V3: $____ | Diff: ____%
    IRR: V2: ___% | V3: ___% | Diff: ____%
    Payback: V2: ___ yrs | V3: ___ yrs | Diff: ____%

=== PHASE 3: EXPORTS ===
[ ] Test 9: PDF Export - PASS/FAIL
[ ] Test 10: Excel Export - PASS/FAIL
[ ] Test 11: Word Export - PASS/FAIL

=== PHASE 4: EDGE CASES ===
[ ] Test 12: Navigation - PASS/FAIL
[ ] Test 13: Close & Reopen - PASS/FAIL
[ ] Test 14: Quickstart Data - PASS/FAIL
[ ] Test 15: Error Handling - PASS/FAIL

=== PHASE 5: USE CASES ===
[ ] Test 16: EV Charging - PASS/FAIL
[ ] Test 17: Data Center - PASS/FAIL
[ ] Test 18: Shopping Center - PASS/FAIL

=== OVERALL RESULT ===
Status: [PASS/FAIL]
Critical Issues: [None/List]
Recommendations: [Notes]
```

---

## 🎉 Ready to Test!

**Dev server running**: http://localhost:5178

Open your browser and start with **Test 1**! 🚀

Good luck! If you encounter any issues, check the console first, then refer to the troubleshooting section.
