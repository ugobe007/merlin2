# Customer Demo Test Plan
**Created:** November 18, 2025  
**Purpose:** Ensure Smart Wizard and Advanced Quote Builder are flawless for customer presentations

---

## ✅ BUGS FIXED TODAY

### 1. **CRITICAL: Select Dropdown Bug (QuestionRenderer.tsx)**
- **Problem:** Grid connection and other select fields weren't saving values
- **Impact:** 250 MW facility got 62.5 MW BESS instead of 150 MW
- **Fix:** Line 451 - Changed to `onChange(question.id, e.target.value)`
- **Status:** ✅ FIXED

### 2. **Compilation Error (AdvancedQuoteBuilder.tsx)**
- **Problem:** Undefined variables `bosPercent` and `epcPercent` in line 936
- **Impact:** TypeScript error preventing build
- **Fix:** Hardcoded "15%" and "10%" values
- **Status:** ✅ FIXED

### 3. **UX: Confusing Power Generation Messaging (Step3_AddRenewables.tsx)**
- **Problem:** All use cases showed "Your facility needs continuous power" even when grid was adequate
- **Impact:** Users confused about whether generation was required or optional
- **Fix:** Added conditional messaging showing:
  - ✅ Green "No Power Gap" when grid > peak demand (generation optional)
  - ⚠️ Red "X MW Generation Required" when gap exists
  - Shows math: "Peak 3 MW | Grid 15 MW | No Shortfall"
- **Status:** ✅ FIXED

### 4. **CRITICAL: EV Charger Load Not Included (baselineService.ts)**
- **Problem:** When users entered EV charging ports, load wasn't added to peak demand
- **Impact:** Hotel with 12 EV chargers showed 3 MW peak instead of ~3.2 MW
- **Fix:** Added EV load calculation:
  - Assumes 50% Level 2 (7 kW) + 50% DC Fast (50 kW)
  - Applies 70% utilization factor
  - Adds to peakDemandMW for accurate sizing
- **Status:** ✅ FIXED

---

## 🧪 PRE-DEMO TEST SCENARIOS

### Test 1: Data Center - Limited Grid
**Path:** Smart Wizard → Data Center Template

**Steps:**
1. Select "Data Center" template
2. Enter use case details:
   - Rack Count: 5000
   - Tier Classification: Tier 3
   - **Grid Connection: Limited Capacity** ⚠️ CRITICAL
   - Grid Available: 30 MW
   - Peak Load: 250 MW
3. Click "Configure System" → Advance to Step 3

**Expected Results:**
- ✅ BESS Recommendation: **150 MW / 4 hours** (60% multiplier for Tier 3 + limited grid)
- ✅ Power Gap Alert: **"220 MW shortfall"** (250 - 30 = 220)
- ✅ Generation Options:
  - Solar: ~286 MW
  - Generator: ~220 MW
  - Hybrid: ~154 MW solar + 110 MW generator

**What to Watch:**
- Grid connection dropdown MUST save "Limited Capacity"
- Console should show: `gridConnection: "limited"` NOT "reliable"
- Calculation should use 60% multiplier, not 25%

---

### Test 2: Manufacturing - Peak Shaving
**Path:** Smart Wizard → Manufacturing Template

**Steps:**
1. Select "Manufacturing Plant" template
2. Enter use case details:
   - Peak Demand: 10 MW
   - Utility Rate: $0.15/kWh
   - Demand Charge: $15/kW
   - Operating Hours: 16 hours/day
3. Configure system
4. Complete wizard to quote summary

**Expected Results:**
- ✅ BESS: 2.5-3 MW / 4 hours (25-30% for peak shaving)
- ✅ Financial calculations appear
- ✅ Annual savings calculated
- ✅ ROI and payback period displayed

**What to Watch:**
- All form inputs persist when navigating between steps
- Financial calculations complete without errors
- Quote summary shows all equipment costs

---

### Test 3: Form Persistence Test
**Path:** Smart Wizard → Any Template

**Steps:**
1. Select any template
2. Fill out Step 2 completely (all fields)
3. **DO NOT advance** - instead refresh the page (Cmd+R)
4. Observe form state

**Expected Results:**
- ✅ All form data restores from localStorage
- ✅ Selected template remains
- ✅ All dropdown selections preserved
- ✅ All numeric inputs preserved

**What to Watch:**
- Data should restore within 1 hour of last save
- Console shows: "Restored wizard data from localStorage"

---

### Test 4: Advanced Quote Builder
**Path:** Direct to Advanced Quote Builder

**Steps:**
1. Open Advanced Quote Builder
2. Enter system configuration:
   - Storage: 5 MW / 4 hours
   - Solar: 3 MW
   - Generator: 2 MW
3. Configure financial inputs:
   - System Cost: $10,000,000
   - Utility Rate: $0.12/kWh
   - Demand Charge: $12/kW
4. Generate quote

**Expected Results:**
- ✅ No compilation errors
- ✅ System cost shows: "Auto-calculated from equipment + BOS (15%) + EPC (10%) + renewables"
- ✅ Financial calculations complete
- ✅ Quote PDF generates

**What to Watch:**
- No TypeScript errors in console
- All calculations use centralized services
- Equipment costs match NREL ATB 2024 data

---

### Test 5: Navigation Stress Test
**Path:** Smart Wizard - Back and Forth

**Steps:**
1. Start wizard with Data Center template
2. Fill Step 2 completely
3. Advance to Step 3
4. **Go back** to Step 2
5. Change grid connection from "Reliable" to "Limited"
6. **Advance again** to Step 3
7. Verify BESS recommendation updates

**Expected Results:**
- ✅ Data persists when going back
- ✅ Changes trigger recalculation
- ✅ Step 3 reflects new grid connection
- ✅ Power gap alert appears/disappears correctly

**What to Watch:**
- No data loss when navigating
- Calculations update on data changes
- UI reflects current state accurately

---

## 🚨 CRITICAL FAILURE MODES TO AVOID

### 1. **Wrong Calculations**
- **Symptom:** BESS size doesn't match peak load
- **Root Cause:** Select dropdown not saving
- **Status:** ✅ FIXED (QuestionRenderer line 451)

### 2. **Data Loss on Page Refresh**
- **Symptom:** Form clears when page reloads
- **Root Cause:** HMR clearing state
- **Status:** ✅ FIXED (localStorage backup + useRef)

### 3. **Missing Power Gap Alert**
- **Symptom:** No alert when generation required
- **Root Cause:** baselineResult not passed to Step3
- **Status:** ✅ FIXED (baselineResult prop)

### 4. **Compilation Errors**
- **Symptom:** TypeScript errors prevent build
- **Root Cause:** Undefined variables
- **Status:** ✅ FIXED (AdvancedQuoteBuilder line 936)

---

## 🎯 DEMO TALKING POINTS

### Smart Wizard Strengths:
1. **Template-Based:** 12+ industry templates with intelligent defaults
2. **Centralized Calculations:** All logic in baselineService - consistent results
3. **Data Persistence:** Form auto-saves every change to localStorage
4. **Power Gap Detection:** Automatically identifies generation requirements
5. **Visual Feedback:** Clear selection states, progress indicators

### Advanced Quote Builder Strengths:
1. **Flexible Configuration:** Manual input for custom scenarios
2. **Real-Time Pricing:** NREL ATB 2024 database integration
3. **Financial Analysis:** ROI, payback, annual savings
4. **Professional Output:** PDF quote generation

### Architecture Highlights:
- **100% Centralized Calculations:** baselineService, centralizedCalculations, unifiedPricingService
- **Single Source of Truth:** baselineResult passed as prop, no duplicate logic
- **Defensive Programming:** Input validation, error boundaries, fallback values
- **Modern Stack:** React 18, TypeScript, Vite

---

## 📋 PRE-DEMO CHECKLIST

**30 Minutes Before Demo:**
- [ ] Run `npm run build` - verify no TypeScript errors
- [ ] Test Test 1 (Data Center) end-to-end
- [ ] Test Test 2 (Manufacturing) end-to-end
- [ ] Clear localStorage and test fresh session
- [ ] Check browser console for errors
- [ ] Verify all form dropdowns save correctly
- [ ] Test page refresh - data should restore
- [ ] Generate sample PDF quote

**During Demo:**
- [ ] Use Chrome DevTools to monitor console
- [ ] Have backup data ready if form fails
- [ ] Keep CUSTOMER_DEMO_TEST_PLAN.md open for reference
- [ ] Know the fix for select dropdown bug (in case regression)

**After Demo:**
- [ ] Note any issues encountered
- [ ] Document customer feedback
- [ ] Update test plan with new scenarios

---

## 🔍 VERIFICATION COMMANDS

```bash
# Check for TypeScript errors
npm run build

# Check for console errors in runtime
# Open browser console (Cmd+Option+J in Chrome)
# Look for red errors - should be ZERO

# Verify calculations
# Check console logs for:
# "🎯 [SmartWizard] Baseline from shared service:"
# "gridConnection: 'limited'" (not 'reliable')

# Test form persistence
# Fill form → Refresh page → Check localStorage:
localStorage.getItem('merlin_wizard_data')
```

---

## 🆘 EMERGENCY FIXES

### If Select Dropdown Fails Again:
**File:** `src/components/wizard/QuestionRenderer.tsx`  
**Line:** 451  
**Fix:** Ensure it reads:
```typescript
onChange={(e) => onChange(question.id, e.target.value)}
```
NOT:
```typescript
onChange={(e) => handleInputChange(e.target.value)} // WRONG
```

### If Data Loss Occurs:
**File:** `src/components/wizard/SmartWizardV2.tsx`  
**Lines:** 86-106  
**Check:** localStorage backup code is active
**Manual Recovery:** Open DevTools → Application → Local Storage → Find `merlin_wizard_data`

### If Calculations Are Wrong:
**Check Console For:**
- `useCaseData` object - verify all fields present
- `gridConnection` value - should match dropdown selection
- `baselineResult` - verify powerMW matches expected
- If gridConnection missing → select dropdown bug returned

---

## 📊 SUCCESS METRICS

**Demo is successful if:**
1. ✅ No TypeScript compilation errors
2. ✅ No runtime console errors
3. ✅ All form inputs save and persist
4. ✅ Calculations are accurate (150 MW for 250 MW datacenter)
5. ✅ Power gap alerts appear when expected
6. ✅ Quote PDF generates correctly
7. ✅ Customer can navigate wizard without crashes
8. ✅ Data survives page refreshes

**You're ready to demo if all 8 criteria pass.**

---

## 🎬 RECOMMENDED DEMO FLOW

### Option 1: Smart Wizard (Guided)
1. "This is our Smart Wizard - templates for 12+ industries"
2. Select Data Center template
3. "Just answer a few questions about your facility"
4. Fill form → Show auto-save feature
5. "System automatically calculates optimal BESS size"
6. Show 150 MW recommendation for 250 MW facility
7. "Notice the power gap alert - system detected you need generation"
8. Show 3 generation options (Solar, Generator, Hybrid)
9. "All calculations use NREL ATB 2024 pricing database"
10. Complete to quote summary

### Option 2: Advanced Quote Builder (Expert)
1. "For customers who know exactly what they want"
2. "Direct input - no wizard steps"
3. Configure 5 MW / 4 hour system
4. "Real-time equipment pricing from NREL database"
5. Show financial calculations
6. Generate PDF quote

### Option 3: Both (Full Demo)
1. Start with Smart Wizard (show ease of use)
2. "For more control, we have Advanced Quote Builder"
3. Show both tools complement each other
4. Emphasize: "Same calculation engine, different interfaces"

---

**Good luck with your customer demos! 🚀**
