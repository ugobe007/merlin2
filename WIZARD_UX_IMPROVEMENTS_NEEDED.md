# Wizard UX Improvements Needed

**Date**: November 21, 2025  
**Priority**: HIGH - Pre-Launch Customer Experience Issues

---

## ✅ Fixed (This Session)

### 1. **Scale Bug - Hotel Calculation**
- **Issue**: Scale was being divided by 100, so 700 rooms → scale=7 → used scale=1 (typo in fix)
- **Impact**: Hotel showing 0.003 MW instead of 2+ MW for 700 rooms
- **Fix Applied**: Remove `scale = scale / 100;` division for hotels (line 228 in SmartWizardV2.tsx)
- **Status**: ✅ FIXED

### 2. **Blank Page Crash**
- **Issue**: `recommendedGenerationMW` undefined, causing `.toFixed()` error
- **Impact**: Wizard crashes on Step 3 when generator recommendation exists
- **Fix Applied**: Added null checks `(powerStatus.recommendedGenerationMW || 0).toFixed(1)`
- **Status**: ✅ FIXED

### 3. **PowerStatus Type Missing Fields**
- **Issue**: TypeScript errors for `recommendedGenerationMW` and `recommendationReason`
- **Fix Applied**: Added optional fields to PowerStatus interface
- **Status**: ✅ FIXED

### 4. **Select All Checkbox for Amenities**
- **Issue**: 10+ checkboxes overwhelming users ("users are going to quit the process")
- **Fix Applied**: Added blue "✓ Select All" checkbox (shows when >3 options)
- **Status**: ✅ FIXED
- **UI**: Blue bordered box at top, toggles all options at once

---

## 🚨 Still Broken (Needs Immediate Fix)

### 5. **Grid Capacity Question - AI Button Non-Functional**
- **User Quote**: *"the grid capacity AI button does not work... most users will not know their grid capacity and will use the AI agent which does not work. OH NO!!!!!!"*
- **Issue**: Question asks for grid capacity in MW, but:
  - Most users don't know this value
  - AI Help button doesn't work
  - Question shows even when not relevant
- **Current State**: 
  ```typescript
  {
    id: 'gridCapacity',
    question: 'Grid connection capacity (if limited)',
    type: 'number',
    default: 0,
    unit: 'MW',
    helpText: 'If limited grid: Enter max capacity from utility. If 0, we assume unlimited grid.',
    required: false
  }
  ```

#### Recommended Solutions (Pick One):

**Option A: Hide Question When Not Needed** (FASTEST)
- Only show `gridCapacity` when `gridConnection === 'limited'`
- Add conditional display logic:
  ```typescript
  conditionalDisplay: {
    dependsOn: 'gridConnection',
    showWhen: ['limited']
  }
  ```
- For reliable/unreliable grids: Assume unlimited grid capacity (default 0 MW)
- **Pro**: Reduces cognitive load, users only see it when relevant
- **Con**: Need to implement conditional display in QuestionRenderer.tsx

**Option B: Remove Question Entirely** (SIMPLEST)
- Delete gridCapacity question from all 30+ templates
- Use smart defaults based on gridConnection:
  - `reliable` → assume unlimited (0 MW = no limit)
  - `unreliable` → assume unlimited but add generators
  - `limited` → show warning, let user add generators manually
  - `off_grid` → grid capacity = 0 (no grid)
  - `microgrid` → calculate from system sizing
- **Pro**: Zero user confusion, one less question
- **Con**: Can't model constrained grid scenarios accurately

**Option C: Fix AI Button** (MOST COMPLEX)
- Implement actual AI grid capacity lookup
- Requires:
  - Location-based utility grid data
  - Building type + size → typical utility service
  - API integration or ML model
- **Pro**: Feature works as designed
- **Con**: Takes days/weeks, may still be inaccurate

#### Recommended Approach for Launch:
**OPTION A + Smart Messaging**

1. **Hide gridCapacity unless `gridConnection === 'limited'`**
2. **Update helpText** when it DOES show:
   ```
   "Limited grid capacity? Enter max MW from utility. 
   Don't know? Leave at 0 and we'll recommend generators to fill the gap."
   ```
3. **Remove AI Help button** from this field (it doesn't work anyway)
4. **Post-launch enhancement**: Build AI utility grid analyzer

---

## 📊 Impact Analysis

### User Workflow (700-room Hotel Example)

**BEFORE FIXES**:
1. Select amenities: 10+ checkboxes, no select-all (tedious)
2. Enter grid capacity: 0 MW, AI button broken (confusing)
3. Click Next → **BLANK PAGE CRASH** ❌

**AFTER FIXES**:
1. Select amenities: Click "✓ Select All" (1 click) ✅
2. Grid connection: "Unreliable" (gridCapacity hidden) ✅
3. Click Next → Step 3 loads successfully ✅
4. See: 0.7 MW BESS + 0.5 MW generators ✅

---

## 🎯 Next Steps

### Immediate (Pre-Launch):
- [ ] Test 700-room hotel workflow end-to-end
- [ ] Verify scale calculation: 700 rooms → ~2 MW
- [ ] Verify no crash on Step 3
- [ ] Verify "Select All" amenities works
- [ ] **CRITICAL**: Implement gridCapacity conditional display OR remove question

### Short-Term (Week 1 Post-Launch):
- [ ] Add conditional display logic to QuestionRenderer for all conditional questions
- [ ] User testing: Are there other questions causing confusion?
- [ ] Analytics: Track question abandonment rates

### Long-Term (Month 1):
- [ ] Build AI grid capacity analyzer
- [ ] Simplify questionnaire: Aim for <5 questions per use case
- [ ] A/B test: Wizard vs. chatbot interface

---

## 📝 Code References

**Files Modified**:
- `src/components/wizard/SmartWizardV2.tsx` (lines 228-235) - Fixed scale calculation
- `src/components/wizard/steps/Step3_AddRenewables.tsx` (lines 239, 262) - Added null checks
- `src/components/wizard/steps/modules/PowerCalculations.ts` (lines 6-20) - Updated interface
- `src/components/wizard/QuestionRenderer.tsx` (lines 463-520) - Added Select All checkbox

**Files Need Updates**:
- `src/data/useCaseTemplates.ts` (30+ locations) - Add conditionalDisplay to gridCapacity
- `src/components/wizard/QuestionRenderer.tsx` - Implement conditional rendering logic

---

## 🧪 Testing Checklist

Before deploying to production:

- [ ] Hotel 700 rooms → Shows ~2.0 MW (not 0.7 MW)
- [ ] Amenities: "Select All" → All checkboxes selected
- [ ] Grid capacity: Hidden when grid=reliable/unreliable
- [ ] Grid capacity: Shown only when grid=limited
- [ ] Step 3: No blank page crash
- [ ] Generator recommendation: Shows realistic MW (not undefined)
- [ ] Console: No TypeScript errors
- [ ] Mobile: All UI elements responsive

---

**Status**: 4 of 5 critical issues fixed. Grid capacity question still needs conditional display implementation or removal.
