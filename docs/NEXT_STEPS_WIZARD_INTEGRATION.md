# Next Steps: Wizard Integration Investigation

**Date:** January 2, 2026  
**Status:** TrueQuote Engine Verified ✅  
**Focus:** Wizard data flow and display logic

---

## ✅ What We Know

**TrueQuote Engine is working correctly:**
- ✅ 18/18 industries pass comprehensive audit (100%)
- ✅ All calculations accurate
- ✅ All unit conversions correct
- ✅ Solar/EV inclusion working
- ✅ Industry templates correct

**User reports issues, so problems are likely in:**
- Wizard data flow (Step 3 → Step 5)
- Display logic (Step 5/6 UI)
- State management/persistence

---

## Investigation Plan

### 1. Verify Data Flow: Step 3 → TrueQuote Engine

**Questions:**
- Does Step 3 correctly save inputs to `state.useCaseData`?
- Does `mapWizardStateToTrueQuoteInput` correctly map all fields?
- Are foundational variables (roomCount, rackCount, etc.) present in `facilityData`?

**Files to Check:**
- `src/components/wizard/v6/steps/Step3Details.tsx`
- `src/components/wizard/v6/steps/Step3HotelEnergy.tsx`
- `src/components/wizard/v6/utils/trueQuoteMapper.ts`
- `src/components/wizard/v6/steps/Step5MagicFit.tsx` (data flow section)

**Test:**
- Run wizard for each industry
- Check console logs for data flow
- Verify `state.useCaseData` contains correct values
- Verify `mapWizardStateToTrueQuoteInput` output

---

### 2. Verify Step 5 Uses TrueQuote Engine Correctly

**Questions:**
- Does Step 5 call TrueQuote Engine?
- Does it use TrueQuote Engine results or fallback calculations?
- Are there multiple calculation paths?

**Files to Check:**
- `src/components/wizard/v6/steps/Step5MagicFit.tsx`
  - `calculateSystemAsync` function
  - Fallback logic
  - How results are used

**Test:**
- Check if `calculateTrueQuote` is called
- Verify no fallback calculations bypass TrueQuote Engine
- Check console logs for calculation path

---

### 3. Verify Display Logic

**Questions:**
- Are values displayed correctly?
- Are units converted correctly (kW→MW, kWh→MWh)?
- Are all components (BESS, solar, EV, generator) displayed?

**Files to Check:**
- `src/components/wizard/v6/steps/Step5MagicFit.tsx` (display section)
- `src/components/wizard/v6/steps/Step6Quote.tsx`

**Test:**
- Check display formatting
- Verify unit conversions
- Check if all components are shown

---

### 4. Verify State Persistence

**Questions:**
- Does state persist between steps?
- Are calculations stored correctly?
- Does Step 4 store solar/EV selections correctly?

**Files to Check:**
- `src/components/wizard/v6/WizardV6.tsx`
- `src/components/wizard/v6/steps/Step4Options.tsx`
- `src/components/wizard/v6/steps/Step5MagicFit.tsx`

**Test:**
- Check state persistence
- Verify Step 4 selections are in state
- Verify Step 5 reads from state correctly

---

## Expected Issues

Based on user reports, likely issues:

1. **Step 3 inputs not reaching TrueQuote Engine**
   - Fix: Ensure `state.useCaseData` is properly updated
   - Fix: Ensure `mapWizardStateToTrueQuoteInput` maps all fields

2. **Step 5 using fallback calculations**
   - Fix: Remove fallback calculations
   - Fix: Always use TrueQuote Engine results

3. **Display showing wrong units**
   - Fix: Verify unit conversion logic
   - Fix: Ensure consistent unit display

4. **Solar/EV not displayed**
   - Fix: Verify Step 4 stores selections
   - Fix: Verify Step 5 reads selections
   - Fix: Verify display logic includes all components

---

## Success Criteria

- [ ] Step 3 inputs flow to TrueQuote Engine correctly
- [ ] Step 5 always uses TrueQuote Engine (no fallbacks)
- [ ] All values displayed correctly
- [ ] All units converted correctly
- [ ] All components (BESS, solar, EV, generator) displayed
- [ ] State persists correctly between steps
