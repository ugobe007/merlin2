# Wizard Modification Plan - Car Wash 16Q Integration
**Created:** January 22, 2026  
**Goal:** Integrate new car wash 16-question system without breaking existing wizard  
**Risk Level:** MEDIUM - Database + UI + Calculator changes  
**Estimated Time:** 2-3 hours with testing

---

## Current State Analysis

### ✅ What's Already Built
1. **Database Migration Ready:** `20260121_carwash_16q_v3.sql` (609 lines)
   - 16 comprehensive questions with proper field names
   - Sections: Topology, Infrastructure, Equipment, Operations, Financial, Resilience, Planning
   - Validation query included

2. **Calculator Service Exists:** `src/services/carWash16QCalculator.ts`
   - `calculateCarWash16Q()` function ready
   - Input/output types defined
   - Used by integration layer

3. **Integration Layer Exists:** `src/components/wizard/carWashIntegration.ts`
   - `mapAnswersToCarWash16QInput()` - Maps DB answers to calculator
   - `calculateCarWashMetrics()` - Orchestrates calculation
   - Already used in `Step3Integration.tsx` (lines 72-91)

4. **WizardV6 Step 3 Flow:**
   ```
   WizardV6.tsx
     └→ Step3Details.tsx (thin wrapper)
         └→ Step3Integration.tsx (SSOT enforcer + car wash detection)
             └→ CompleteStep3Component.tsx (DB-driven questionnaire)
                 └→ CompleteQuestionRenderer.tsx (renders 12 question types)
                     └→ Loads from custom_questions table
   ```

5. **Current Build Status:** ✅ Passing (4.64s)

### ⚠️ What's NOT Ready
1. **Database State:** Unknown if questions are in production DB
2. **Testing:** No smoke tests for car wash flow
3. **Error Handling:** What if calculator fails mid-wizard?
4. **Backward Compatibility:** What happens to in-flight sessions?

---

## Risk Assessment

### 🟢 LOW RISK (Safe to modify)
- **carWashIntegration.ts** - Already isolated, tested mapping layer
- **Database migration** - Idempotent (DELETE before INSERT)
- **Calculator service** - Pure function, no side effects

### 🟡 MEDIUM RISK (Requires testing)
- **Step3Integration.tsx** - Already has car wash detection (line 72)
- **CompleteStep3Component** - Loads questions dynamically from DB
- **WizardV6 power metrics** - Needs validation after integration

### 🔴 HIGH RISK (Could break wizard)
- **WizardV6.tsx line 1428** - Hardcoded `car_wash` detection: `basePeakKW += 100`
- **Global state management** - Changes to `useCaseData` structure
- **Export/PDF generation** - Car wash answers need proper formatting

---

## The Safe Modification Plan

### Phase 1: Database Migration (5 min)
**Goal:** Load 16 questions into `custom_questions` table

```bash
# 1. Backup current car wash questions
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
(async () => {
  const { data } = await supabase
    .from('custom_questions')
    .select('*')
    .eq('use_case_id', (await supabase.from('use_cases').select('id').eq('slug', 'car-wash').single()).data.id);
  fs.writeFileSync('car_wash_questions_backup.json', JSON.stringify(data, null, 2));
  console.log('✅ Backup saved:', data?.length || 0, 'questions');
})();
"

# 2. Run migration via Supabase SQL Editor (safer than CLI)
# - Copy contents of 20260121_carwash_16q_v3.sql
# - Paste into Supabase Dashboard → SQL Editor
# - Review execution plan
# - Execute

# 3. Verify migration
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
(async () => {
  const { data: useCase } = await supabase
    .from('use_cases')
    .select('id')
    .eq('slug', 'car-wash')
    .single();
  
  const { data: questions, error } = await supabase
    .from('custom_questions')
    .select('field_name, question_text, section_name, display_order')
    .eq('use_case_id', useCase.id)
    .order('display_order');
  
  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  console.log('✅ Car Wash Questions:', questions.length);
  console.log('Expected field names:', [
    'carWashType', 'bayTunnelCount', 'electricalServiceSize', 
    'voltageLevel', 'primaryEquipment', 'largestMotorSize',
    'simultaneousEquipment', 'averageWashesPerDay', 'peakHourThroughput',
    'washCycleDuration', 'operatingHours', 'monthlyElectricitySpend',
    'utilityRateStructure', 'powerQualityIssues', 'outageSensitivity',
    'expansionPlans'
  ].join(', '));
  
  console.log('Actual field names:', questions.map(q => q.field_name).join(', '));
  
  if (questions.length !== 16) {
    console.error('❌ Expected 16 questions, got', questions.length);
    process.exit(1);
  }
  
  console.log('✅ All 16 questions present');
})();
"
```

**Rollback Strategy:** Restore from `car_wash_questions_backup.json`

---

### Phase 2: Build Validation (2 min)
**Goal:** Ensure no TypeScript errors before testing

```bash
# 1. Clean build
npm run build

# 2. Type check specific files
npx tsc --noEmit --skipLibCheck \
  src/services/carWash16QCalculator.ts \
  src/components/wizard/carWashIntegration.ts \
  src/components/wizard/Step3Integration.tsx

# 3. Lint check (warnings OK, errors not OK)
npm run lint 2>&1 | grep -E "error|Error" || echo "✅ No lint errors"
```

**Success Criteria:**
- ✅ Build completes without errors
- ✅ No TypeScript errors in car wash files
- ⚠️ Warnings acceptable (we have many)

**If fails:** Do NOT proceed - fix errors first

---

### Phase 3: Manual Smoke Test (15 min)
**Goal:** Walk through wizard as user to catch integration bugs

#### Test Case 1: Fresh Car Wash Flow
```
1. Start dev server: npm run dev
2. Navigate to: http://localhost:5178/wizard
3. Step 1: Location → Select any state → Next
4. Step 2: Industry → Select "Car Wash" → Next
5. Step 3: Questionnaire
   - Should see 16 questions in sections
   - Answer Q1-5 (required fields)
   - Check console for: "🚗 Car Wash Power Metrics Updated"
   - Verify power gauge updates in real-time
6. Step 4: Options → Enable solar (optional test)
7. Step 5: Magic Fit → Verify BESS sizing reasonable
8. Step 6: Quote Results
   - Check power metrics from car wash calculator
   - Verify savings calculations not hardcoded
   - Export PDF → Check car wash answers included
```

**Console Checks:**
```javascript
// Should see in browser console:
🚗 Car Wash Power Metrics Updated: {
  peakKW: <calculated>,
  bessKW: <calculated>,
  bessKWh: <calculated>,
  confidence: <0-1>
}
```

**Expected Behavior:**
- ✅ 16 questions load from database
- ✅ Power metrics calculate in real-time
- ✅ BESS sizing uses calculated peak (not hardcoded 100 kW)
- ✅ Quote shows car wash-specific insights

#### Test Case 2: Backward Compatibility (Existing Sessions)
```
1. Clear browser cache
2. Load wizard with old session data (if any exists)
3. Switch to car wash → Should gracefully handle missing fields
4. Complete wizard → Should not crash
```

#### Test Case 3: Error Resilience
```
1. Enter invalid data (e.g., all equipment = "none")
2. Calculator should return null
3. Wizard should fall back to defaults (not crash)
4. Console should show: "❌ Error calculating car wash metrics"
```

---

### Phase 4: SSOT Audit (5 min)
**Goal:** Ensure no new SSOT violations introduced

```bash
# Run audit on modified files
./audit-v6-ssot.sh src/components/wizard/carWashIntegration.ts
./audit-v6-ssot.sh src/components/wizard/Step3Integration.tsx
./audit-v6-ssot.sh src/components/wizard/v6/WizardV6.tsx

# Check for hardcoded car wash values
grep -r "car_wash.*100" src/components/wizard/v6/
grep -r "0\.[0-9].*carWash" src/components/wizard/
```

**Red Flags:**
- ❌ New hardcoded calculations (e.g., `peakKW * 0.75`)
- ❌ Hardcoded 100 kW for car wash (line 1428 in WizardV6.tsx)
- ❌ Local ROI calculations instead of using SSOT

**If violations found:** Fix before proceeding

---

### Phase 5: Fix Known Issue - Hardcoded Car Wash Peak (10 min)
**Goal:** Replace `basePeakKW += 100` with calculator result

**Problem:** WizardV6.tsx line 1428 has:
```typescript
if (stationType.includes("car_wash")) basePeakKW += 100; // Integrated car wash
```

**Solution:** Use car wash calculator result if available

```typescript
// In WizardV6.tsx - findReplace with context
// BEFORE:
if (stationType.includes("car_wash")) basePeakKW += 100; // Integrated car wash

// AFTER:
if (stationType.includes("car_wash")) {
  // Use car wash calculator if available (SSOT)
  const carWashMetrics = state.useCaseData?.carWashMetrics as { peakDemandKW?: number } | undefined;
  basePeakKW += carWashMetrics?.peakDemandKW || 100; // Fallback to 100 if calculator unavailable
}
```

**Why Safe:**
- Uses calculator result when available (SSOT compliance)
- Falls back to 100 kW if calculator fails (graceful degradation)
- No breaking changes to existing flows

---

### Phase 6: Production Deployment Checklist (5 min)

```bash
# 1. Final build check
npm run build

# 2. Create deployment tag
git add -A
git commit -m "feat(wizard): Car wash 16Q integration - SSOT compliant"
git tag wizard-carwash-16q-v1.0.0

# 3. Deploy to staging first (if available)
flyctl deploy --config fly.staging.toml

# 4. Run staging smoke test
# → Open staging URL
# → Complete car wash flow
# → Verify PDF export

# 5. Deploy to production (only if staging passes)
flyctl deploy

# 6. Monitor for errors (first 24 hours)
flyctl logs --app merlin3
```

---

## Rollback Plan (If Things Break)

### Immediate Rollback (< 5 min)
```bash
# 1. Revert database migration
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const backup = JSON.parse(fs.readFileSync('car_wash_questions_backup.json', 'utf8'));
(async () => {
  // Delete new questions
  await supabase.from('custom_questions').delete()
    .eq('use_case_id', (await supabase.from('use_cases').select('id').eq('slug', 'car-wash').single()).data.id);
  
  // Restore backup
  await supabase.from('custom_questions').insert(backup);
  console.log('✅ Rollback complete');
})();
"

# 2. Revert code changes
git revert HEAD
git push origin main

# 3. Redeploy
flyctl deploy
```

### Partial Fix (Keep new questions, disable calculator)
```typescript
// In Step3Integration.tsx - comment out car wash calculator
// if (industry === 'car-wash' && Object.keys(answers).length > 0) {
//   carWashMetrics = calculateCarWashMetrics(answers);
// }
```

---

## Success Metrics

### ✅ Deployment Success If:
1. **Database:** 16 car wash questions present, properly formatted
2. **Build:** No TypeScript errors, clean compile
3. **Wizard Flow:** User can complete car wash quote end-to-end
4. **Power Metrics:** Real-time calculation in Step 3 works
5. **SSOT Compliance:** No new hardcoded calculations
6. **PDF Export:** Car wash answers appear in generated documents
7. **Error Handling:** Graceful fallbacks if calculator fails
8. **No Regressions:** Other industries still work (hotel, office, etc.)

### 🚨 Abort Deployment If:
- Build fails with errors
- Wizard crashes on car wash selection
- Calculator returns NaN or negative values
- SSOT audit shows new violations (> 2 issues)
- PDF export breaks for any industry
- Supabase quota exceeded (check dashboard)

---

## Testing Checklist

### Pre-Deployment (Local)
- [ ] Database migration runs without errors
- [ ] 16 questions verified in Supabase dashboard
- [ ] `npm run build` succeeds
- [ ] Manual smoke test: Fresh car wash flow (Test Case 1)
- [ ] Manual smoke test: Error resilience (Test Case 3)
- [ ] SSOT audit shows ≤ 2 violations
- [ ] Fixed hardcoded 100 kW in WizardV6.tsx line 1428
- [ ] Console shows car wash metrics calculated

### Post-Deployment (Production)
- [ ] Car wash flow completes end-to-end
- [ ] Power gauge updates in real-time
- [ ] Quote results show calculator-derived metrics
- [ ] PDF export includes 16 car wash answers
- [ ] No console errors in Step 3
- [ ] Other industries unaffected (spot check hotel, office)
- [ ] Monitor logs for 24 hours (no spike in errors)

---

## Key Files to Monitor

### DO NOT MODIFY (Core SSOT)
- `src/services/carWash16QCalculator.ts` - Calculator logic
- `src/services/unifiedQuoteCalculator.ts` - Quote SSOT
- `src/services/centralizedCalculations.ts` - Financial SSOT
- `database/migrations/20260121_carwash_16q_v3.sql` - Database schema

### SAFE TO MODIFY (Integration layer)
- `src/components/wizard/carWashIntegration.ts` - Mapping logic
- `src/components/wizard/Step3Integration.tsx` - Car wash detection (line 72)
- `src/components/wizard/v6/WizardV6.tsx` - Hardcoded peak fix (line 1428)

### REQUIRES CARE (High traffic)
- `src/components/wizard/v6/steps/Step3Details.tsx` - Entry point
- `src/components/wizard/CompleteStep3Component.tsx` - Questionnaire renderer
- `src/components/wizard/v6/steps/Step6Quote.tsx` - Results display

---

## Timeline Estimate

| Phase | Task | Time | Risk |
|-------|------|------|------|
| 1 | Database migration | 5 min | 🟢 Low |
| 2 | Build validation | 2 min | 🟢 Low |
| 3 | Manual smoke test | 15 min | 🟡 Med |
| 4 | SSOT audit | 5 min | 🟢 Low |
| 5 | Fix hardcoded peak | 10 min | 🟡 Med |
| 6 | Deploy + monitor | 30 min | 🟡 Med |
| **Total** | | **~70 min** | **🟡 MEDIUM** |

**Buffer:** Add 30-60 min for unexpected issues  
**Best case:** 1 hour  
**Realistic:** 2 hours  
**Worst case:** 3 hours (includes rollback)

---

## Questions to Answer Before Starting

1. **Is production database accessible?** (Need Supabase credentials)
2. **Do we have a staging environment?** (Safer to test there first)
3. **Are there active user sessions?** (Migration could break them)
4. **Is there a deployment freeze?** (Check with team)
5. **Who should be notified?** (Stakeholders expecting car wash feature)

---

## Next Steps

### Option A: Full Implementation (Recommended)
Execute phases 1-6 in order, with testing at each stage.

### Option B: Database Only (Low Risk)
Run Phase 1 only, verify questions load in wizard, deploy calculator later.

### Option C: Feature Flag (Safest)
Add environment variable `VITE_ENABLE_CAR_WASH_16Q=true`, gate all changes behind it.

**Recommendation:** Start with **Option C** for first production deployment, switch to Option A after 48-hour monitoring period shows no issues.

---

**Plan prepared by:** GitHub Copilot  
**Reviewed by:** Awaiting user approval  
**Status:** READY FOR EXECUTION
