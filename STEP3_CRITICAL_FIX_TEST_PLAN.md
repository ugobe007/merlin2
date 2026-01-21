# Step 3 Critical Fix - Test Plan (Jan 20, 2026)

## 🚨 BLOCKER BUG FIXED

**Issue:** Step 3 questionnaires were broken across ALL 21 industries
- ❌ Next button never enabled
- ❌ Intelligence header showed no data
- ❌ Answers not captured in wizard state
- ❌ No calculations performed

**Root Cause:** `onValidityChange` prop chain was broken
- WizardV6 passes `onValidityChange={setStep3Valid}` to Step3Details
- Step3Details received it but never passed to CompleteStep3Component
- CompleteStep3Component had no validity tracking logic
- Result: `step3Valid` stayed `false` forever → Next button disabled

---

## ✅ FIX APPLIED

### Files Changed (3 files):

1. **Step3Details.tsx**
   - Added `onValidityChange` to prop destructuring
   - Pass it through to `<Step3Integration>`

2. **Step3Integration.tsx**
   - Added `onValidityChange` to interface
   - Pass it through to `<CompleteStep3Component>`

3. **CompleteStep3Component.tsx**
   - Added `onValidityChange` prop to interface
   - Added validity tracking `useEffect`:
     * Counts required (essential tier) questions
     * Filters by questionnaire depth (minimal/standard/detailed)
     * Applies conditional logic (show/hide based on answers)
     * Calculates required progress: `(answeredRequired / totalRequired) * 100`
     * Calls `onValidityChange(true)` when ≥ 70% complete
     * Debug logging: `📊 Step 3 Validity: X% (Y/Z required) - ✅ VALID`

### Validation Logic:
```typescript
// Essential tier questions are required
const requiredQuestions = questions.filter(q => {
  if (!shouldShowByDepth(q.questionTier)) return false;  // Respect depth filter
  if (q.conditionalLogic && !q.conditionalLogic.showIf(answers[...])) return false;
  return q.questionTier === 'essential' || !q.questionTier;
});

const requiredProgress = (answeredRequired.length / requiredQuestions.length) * 100;
const isValid = requiredProgress >= 70;  // ✅ 70% threshold
```

---

## 🧪 MANUAL TESTING CHECKLIST

**CRITICAL: Test BEFORE deploying or scheduling demos!**

### Test 1: Data Center (User-Reported Issue)
- [ ] Navigate to WizardV6 in browser (`http://localhost:5179/wizard-v6`)
- [ ] Step 1: Enter ZIP (e.g., `94102`), select state
- [ ] Step 2: Select "Data Center" industry
- [ ] Step 2: Select business size tier (small/medium/large)
- [ ] Click Next → Should go to Step 3
- [ ] **Step 3 Tests:**
  - [ ] Questions load correctly (see facility type, power capacity, etc.)
  - [ ] Answer 3-4 essential questions (facility type, power capacity, operating hours)
  - [ ] **Watch console:** Should see `📊 Step 3 Validity: X% (Y/Z required)` logs
  - [ ] **Watch header:** Intelligence metrics should update as you answer
  - [ ] **After 70% progress:** Next button should enable (green, clickable)
  - [ ] Click Next → Should advance to Step 4

### Test 2: Hotel (Known Working Industry)
- [ ] Repeat Step 1-2 with "Hotel" industry
- [ ] Step 3: Answer room count, hotel class, amenities
- [ ] Verify Next button enables
- [ ] Check intelligence header shows peak demand

### Test 3: Car Wash (Recently Fixed Icons)
- [ ] Repeat Step 1-2 with "Car Wash" industry
- [ ] Step 3: Answer bay count, wash type, operating hours
- [ ] Verify icons display correctly (we fixed this yesterday)
- [ ] Verify Next button enables
- [ ] Check header metrics update

### Test 4: Retail (Generic Industry)
- [ ] Test with "Retail" industry
- [ ] Answer square footage, operating hours
- [ ] Verify completion tracking works

---

## 🔍 WHAT TO WATCH FOR

### Console Output (Dev Mode)
```
📝 Answer captured: operatingHours = 12 (type: number)
📊 State updated with 3 answers: { operatingHours: 12, facilityType: 'edge', powerCapacity: 500 }
📊 Step 3 Validity: 60% (3/5 required) - ❌ INVALID
📝 Answer captured: rackCount = 100 (type: number)
📊 Step 3 Validity: 80% (4/5 required) - ✅ VALID
```

### Intelligence Header Metrics
- **Before answering:** Empty or placeholder values (`—`)
- **After answering:** 
  - Peak Sun: `5.2 hrs/day` (from ZIP lookup)
  - Electricity: `$0.28/kWh` (from state/utility)
  - Peak Demand: Should update when facility size answered
  - Annual kWh: Should update when operating hours answered

### Next Button Behavior
- **Before 70%:** Button grayed out, shows "Complete questionnaire" message
- **After 70%:** Button turns green, shows "Continue to Step 4 →"
- **Clicking Next:** Should advance to Step 4 (Options)

---

## 🐛 KNOWN ISSUES TO INVESTIGATE

### Issue 1: Intelligence Header Data Flow
**Status:** Needs verification
**Question:** Where does intelligence header get `peakDemandKW` and `annualKWh`?
**Expected flow:**
```
Step 3 answers → wizardState.useCaseData.inputs
  → buildStep3Snapshot(state)
  → snapshot.calculated.totalPeakDemandKW
  → AdvisorRail context.config.peakLoadKW
  → Intelligence header dial
```

**Test:**
1. Answer data center questions (rack count, power capacity)
2. Check if header "Peak Demand" dial updates
3. If NOT updating, investigate `buildStep3Snapshot.ts` line 76-90

### Issue 2: Calculations Not Triggering
**Status:** Suspected
**Symptom:** Header metrics stay at placeholder values
**Root cause hypothesis:** WizardV6 may not be calling calculations after Step 3
**Location to check:**
- `WizardV6.tsx` lines 350-400 (useEffect hooks for calculations)
- Look for `calculateDatabaseBaseline()` calls
- Check if calculations triggered on `state.useCaseData` changes

---

## 📊 SUCCESS CRITERIA

### ✅ PASS Criteria:
1. Next button enables after answering 70% of required questions
2. Console shows validity logs updating in real-time
3. Intelligence header metrics update from Step 3 answers
4. Can advance from Step 3 → Step 4 → Step 5
5. Works across at least 4 industries (data center, hotel, car wash, retail)

### ❌ FAIL Criteria (Require additional fixes):
1. Next button stays disabled even after answering all questions
2. No console logs appear when answering questions
3. Intelligence header stays empty/placeholder
4. Clicking Next doesn't advance to Step 4
5. Answers disappear when navigating back to Step 3

---

## 🚀 DEPLOYMENT CHECKLIST

**DO NOT deploy until all tests pass!**

- [ ] All 4 test industries pass manual testing
- [ ] Console shows no errors during questionnaire
- [ ] Intelligence header metrics update correctly
- [ ] Next button enables/disables correctly
- [ ] Can complete full wizard flow (Steps 1-6)
- [ ] No regression in company name display (Merlin panel)
- [ ] AdvisorRail location analysis works (tested yesterday)
- [ ] Build passes: `npm run build` (0 errors)
- [ ] Commit message documents the fix
- [ ] Update DEPLOYMENT_JAN_14_2026.md with Step 3 fix notes

### Deploy Command:
```bash
# After all tests pass:
flyctl deploy

# Monitor deployment:
flyctl logs

# Smoke test production:
# https://merlin-bess-quote-builder.fly.dev/wizard-v6
```

---

## 📝 NEXT STEPS AFTER TESTING

### If Tests Pass:
1. ✅ Deploy to fly.io
2. 📧 Email user: "Step 3 critical bug fixed - ready for demos"
3. 📅 Safe to schedule customer demos
4. 💼 Safe to schedule investor meetings
5. 📄 Update roadmap: Remove blocker status from Step 3

### If Tests Fail:
1. ❌ DO NOT DEPLOY
2. 🐛 Debug remaining issues (see "Known Issues" section)
3. 🔧 Apply additional fixes
4. 🔄 Re-run test plan
5. 📧 Email user: "Still debugging Step 3 - estimated fix time: X hours"

---

## 🎯 IMPACT ASSESSMENT

### Before Fix:
- **Status:** 🔴 PRODUCTION BLOCKER
- **Affected:** ALL 21 industries
- **Severity:** Critical - no demos possible
- **User impact:** 100% - wizard unusable beyond Step 2

### After Fix:
- **Status:** 🟢 READY FOR TESTING
- **Affected:** 0 industries (if tests pass)
- **Severity:** None (if tests pass)
- **User impact:** 0% - full wizard functionality restored

### Risk Assessment:
- **Low risk:** Fix is surgical (3 files, prop threading only)
- **High confidence:** Validity tracking logic is straightforward (70% threshold)
- **Easy rollback:** Single commit, no database changes
- **Blast radius:** Isolated to Step 3 questionnaire validation

---

## 📞 CONTACT

If tests fail or you find issues:
1. Check console for error messages
2. Review this test plan for debugging hints
3. Contact: github.com/copilot (I'll continue debugging)
4. DO NOT schedule demos until tests pass!

---

**Last Updated:** Jan 20, 2026 (After critical fix applied)
**Tested By:** [PENDING - USER MUST TEST]
**Deployment Status:** [PENDING - DO NOT DEPLOY YET]
