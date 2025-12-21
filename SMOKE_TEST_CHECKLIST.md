# Wizard Smoke Test Checklist
**Date**: December 20, 2025

---

## ✅ Pre-Test Verification

- [x] TypeScript compilation: PASS
- [x] Linting: PASS  
- [x] Build: PASS
- [x] All components exported: PASS
- [x] Navigation flow logic: VERIFIED

---

## 🧪 Manual Smoke Tests

### Test 1: Step 2 Initial Render
**Steps:**
1. Navigate to Step 2 (Industry Selection)
2. Verify components render

**Expected Results:**
- [ ] MerlinGreeting panel visible at top with "Step 2 of 5"
- [ ] Industry selection grid/cards visible
- [ ] Right arrow button visible (disabled until industry selected)
- [ ] No console errors

**Actual Results:**
- [ ] _______________________

---

### Test 2: Step 2 Industry Selection
**Steps:**
1. Click on an industry (e.g., "Hotel")
2. Verify size slider appears
3. Adjust size slider
4. Verify right arrow becomes enabled

**Expected Results:**
- [ ] Industry selected and highlighted
- [ ] Size slider appears below industry selection
- [ ] Merlin insight message updates
- [ ] Right arrow button becomes enabled (blue gradient)
- [ ] Console shows: Industry selection logged

**Actual Results:**
- [ ] _______________________

---

### Test 3: Step 2 → Step 3 Navigation (CRITICAL)
**Steps:**
1. Complete Step 2 (select industry + size)
2. Click right arrow button
3. Observe navigation behavior

**Expected Results:**
- [ ] Console shows: `🎯 [Step2IndustrySize] handleContinue called`
- [ ] Console shows: `🎯 [Step2IndustrySize] Calling onContinue to advance to Step 3`
- [ ] Console shows: `🎯 [StreamlinedWizard] Step 2 onContinue called - advancing to Section 2`
- [ ] Console shows: `🎯 [StreamlinedWizard] Current section after advance: 2`
- [ ] **Step 3 (Facility Details) displays** ✅
- [ ] **NOT AdvancedConfigModal** ✅
- [ ] Transition animation plays
- [ ] Page scrolls to top

**Actual Results:**
- [ ] Console logs: _______________________
- [ ] What displays: _______________________
- [ ] If AdvancedConfigModal opens, note: _______________________

---

### Test 4: Step 3 Render
**Steps:**
1. Verify Step 3 displays correctly

**Expected Results:**
- [ ] MerlinGreeting panel visible with "Step 3 of 5"
- [ ] Facility questions/form visible
- [ ] Collapsible bottom estimate bar visible (minimized)
- [ ] Right arrow button visible
- [ ] No console errors

**Actual Results:**
- [ ] _______________________

---

### Test 5: Data Persistence
**Steps:**
1. On Step 2, select industry and set size
2. Navigate to Step 3
3. Check if data persisted

**Expected Results:**
- [ ] Industry selection available in Step 3
- [ ] Size value available in Step 3
- [ ] Solar/EV data saved (if entered)
- [ ] Data visible in bottom estimate bar

**Actual Results:**
- [ ] _______________________

---

### Test 6: Back Navigation
**Steps:**
1. On Step 3, click left arrow
2. Verify navigation back to Step 2

**Expected Results:**
- [ ] Returns to Step 2
- [ ] Industry selection still selected
- [ ] Size value preserved
- [ ] No data loss

**Actual Results:**
- [ ] _______________________

---

## 🚨 Error Scenarios to Test

### Error Test 1: AdvancedConfigModal Opens Instead
**If this happens:**
- [ ] Check console for: `🔥 ModalManager: onOpenAdvanced called`
- [ ] Check if any button accidentally calls `onOpenProQuote`
- [ ] Verify `onContinue` is being called, not `onOpenAdvanced`

### Error Test 2: Step 3 Doesn't Display
**If this happens:**
- [ ] Check console for navigation logs
- [ ] Verify `currentSection === 2` in console
- [ ] Check if `Step3FacilityDetails` is hidden (`isHidden={true}`)
- [ ] Verify component is imported correctly

### Error Test 3: Data Loss
**If this happens:**
- [ ] Check `wizardState` in React DevTools
- [ ] Verify `handleContinue` saves data before calling `onContinue`
- [ ] Check for state reset between steps

---

## 📊 Test Results Summary

**Date**: _______________  
**Tester**: _______________  
**Browser**: _______________  
**Version**: _______________

### Overall Status:
- [ ] ✅ PASS - All tests pass
- [ ] ⚠️ PARTIAL - Some issues found
- [ ] ❌ FAIL - Critical issues found

### Issues Found:
1. _______________________
2. _______________________
3. _______________________

### Next Steps:
- [ ] _______________________
- [ ] _______________________

---

## 🔍 Debug Commands

If issues found, run these in browser console:

```javascript
// Check current section
window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.findFiberByHostInstance(document.querySelector('[data-testid="wizard"]'))?.memoizedState

// Check wizard state
// (Use React DevTools to inspect wizardState)

// Force navigation
// (Not recommended - use UI buttons)
```

