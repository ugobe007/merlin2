# Manual Smoke Test Checklist - All 21 Industries (Jan 20, 2026)

## 🎯 Purpose
Verify Step 3 validity tracking fix works across ALL industries, not just data center.

## ✅ Automated Tests Completed
- [x] TypeScript build (0 errors)
- [x] Question database validation
- [x] Required field checks
- [x] Tier classification checks

## 🧪 Manual Testing Protocol

### Quick Smoke Test (5 Random Industries)
**Time: ~15 minutes**

Test these 5 industries to spot-check the fix:

#### 1. Data Center ⚡ (User-reported issue - HIGH PRIORITY)
- [ ] Navigate to `/wizard-v6`
- [ ] Step 1: ZIP `94102`, State `CA`
- [ ] Step 2: Select "Data Center", Size "Medium"
- [ ] Step 3: Questions load correctly?
- [ ] Answer: Facility Type (`enterprise`), Power Capacity (`5 MW`), Rack Count (`200`)
- [ ] Console shows: `📊 Step 3 Validity: X%` logs?
- [ ] Intelligence header updates with peak demand?
- [ ] Next button enables after 3-4 answers?
- [ ] Can advance to Step 4?

#### 2. Hotel 🏨 (Known working)
- [ ] Step 2: "Hotel", Size "Medium"
- [ ] Step 3: Answer Room Count (`100`), Hotel Class (`midscale`), Has Pool (`yes`)
- [ ] Validity tracking works?
- [ ] Next button enables?

#### 3. Car Wash 🚗 (Icon fix verification)
- [ ] Step 2: "Car Wash", Size "Small"
- [ ] Step 3: Icons display correctly (we fixed yesterday)?
- [ ] Answer: Bay Count (`4`), Wash Type (`automatic`), Operating Hours (`12`)
- [ ] Next button enables?

#### 4. Retail 🏬 (Generic industry)
- [ ] Step 2: "Retail", Size "Medium"
- [ ] Step 3: Square Footage, Operating Hours
- [ ] Validity works?

#### 5. Hospital 🏥 (Premium tier)
- [ ] Step 2: "Hospital", Size "Large"
- [ ] Step 3: Bed Count, Operating Hours
- [ ] Premium tier loads?
- [ ] Validity works?

---

### Deep Smoke Test (All 21 Industries)
**Time: ~45-60 minutes**
**Only if quick test fails or before investor demos**

| # | Industry | Tier | Anchor Field | Test Status |
|---|----------|------|--------------|-------------|
| 1 | Airport | PREMIUM | `annualPassengers` | [ ] |
| 2 | Apartment Complex | FREE | `unitCount` | [ ] |
| 3 | Agricultural | PREMIUM | `squareFootage` | [ ] |
| 4 | Car Wash | FREE | `bayCount` | [ ] |
| 5 | Casino & Gaming | PREMIUM | `gamingFloorSqft` | [ ] |
| 6 | College & University | PREMIUM | `studentCount` | [ ] |
| 7 | Cold Storage | PREMIUM | `squareFootage` | [ ] |
| 8 | Data Center | FREE | `rackCount` | [ ] |
| 9 | EV Charging Station | FREE | `level2Chargers` | [ ] |
| 10 | Gas Station | FREE | `pumpCount` | [ ] |
| 11 | Government & Public | PREMIUM | `squareFootage` | [ ] |
| 12 | Hospital | FREE | `bedCount` | [ ] |
| 13 | Hotel | FREE | `roomCount` | [ ] |
| 14 | Indoor Farm | FREE | `squareFootage` | [ ] |
| 15 | Manufacturing Facility | FREE | `squareFootage` | [ ] |
| 16 | Microgrid & Renewable | PREMIUM | `peakLoadKW` | [ ] |
| 17 | Office Building | FREE | `squareFootage` | [ ] |
| 18 | Residential | FREE | `squareFootage` | [ ] |
| 19 | Retail & Commercial | FREE | `squareFootage` | [ ] |
| 20 | Shopping Center/Mall | FREE | `squareFootage` | [ ] |
| 21 | Warehouse & Logistics | FREE | `squareFootage` | [ ] |

---

## 🔍 What to Watch For

### Console Logs (Chrome DevTools)
```javascript
// GOOD - Shows validity tracking working:
📝 Answer captured: operatingHours = 12 (type: number)
📊 State updated with 3 answers: { ... }
📊 Step 3 Validity: 60% (3/5 required) - ❌ INVALID

📝 Answer captured: rackCount = 200 (type: number)
📊 Step 3 Validity: 80% (4/5 required) - ✅ VALID

// BAD - No logs = validity tracking broken:
(silence...)
```

### UI Behavior

**Next Button States:**
- **Before 70%:** Gray, disabled, tooltip "Complete questionnaire to continue"
- **After 70%:** Green, enabled, "Continue to Step 4 →"
- **Clicking:** Advances to Step 4 (Options)

**Intelligence Header:**
- **Before answers:** Placeholder `—` values
- **After facility size:** Peak Demand updates (e.g., `350 kW`)
- **After operating hours:** Annual kWh estimates

**Progress Ring:**
- Updates as questions answered
- Shows % complete (0-100%)
- Smooth animation

---

## ❌ Common Failure Patterns

### Issue 1: Next Button Never Enables
**Symptoms:**
- Console shows no `📊 Step 3 Validity` logs
- Next button stays gray even after answering all questions

**Root Cause:** `onValidityChange` not being called
**Check:**
```bash
# Search for validity tracking
grep -r "onValidityChange" src/components/wizard/
```

### Issue 2: Questions Don't Load
**Symptoms:**
- Step 3 shows "Loading..." forever
- Or shows "No questions configured" error

**Root Cause:** Industry slug mismatch in database
**Check:**
```sql
-- In Supabase SQL Editor:
SELECT uc.slug, COUNT(cq.id) as question_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
WHERE uc.is_active = true
GROUP BY uc.slug
ORDER BY question_count ASC;
```

### Issue 3: Intelligence Header Doesn't Update
**Symptoms:**
- Console shows validity logs
- Next button enables
- But header stays at placeholder values

**Root Cause:** `buildStep3Snapshot` not pulling from `useCaseData.inputs`
**Check:** WizardV6.tsx lines 810-850 (AdvisorRail context passing)

### Issue 4: Wrong Required Fields
**Symptoms:**
- Hotel asks for `bayCount` (car wash field)
- Data center asks for `roomCount` (hotel field)

**Root Cause:** Industry-specific validation in `step3Validator.ts` broken
**Check:** Lines 40-90 of step3Validator.ts

---

## 🎯 Success Criteria

### ✅ PASS Criteria (All Must Be True):
1. **Automated tests:** All 21 industries pass database validation
2. **Quick smoke test:** All 5 industries enable Next button correctly
3. **Console logs:** Validity tracking logs appear for all tested industries
4. **UI updates:** Intelligence header shows real values (not placeholders)
5. **No regressions:** Company name, icons, AdvisorRail still work
6. **Build:** `npm run build` completes with 0 errors

### ❌ FAIL Criteria (Any One Triggers Re-Work):
1. Any industry shows "No questions configured"
2. Next button doesn't enable after 70% progress
3. Console shows no validity logs
4. Intelligence header stays at placeholders
5. Questions load for wrong industry (slug mismatch)
6. Build errors or TypeScript warnings

---

## 📊 Testing Results Template

```markdown
### Smoke Test Results (Date: _________)

**Tester:** __________
**Environment:** [ ] Local Dev [ ] Production

#### Quick Smoke Test (5 Industries):
- Data Center: [ ] PASS [ ] FAIL - Notes: ___________
- Hotel: [ ] PASS [ ] FAIL - Notes: ___________
- Car Wash: [ ] PASS [ ] FAIL - Notes: ___________
- Retail: [ ] PASS [ ] FAIL - Notes: ___________
- Hospital: [ ] PASS [ ] FAIL - Notes: ___________

#### Overall Assessment:
- [ ] ✅ All tests pass - READY FOR DEPLOYMENT
- [ ] ⚠️  Minor issues found - deploy with caution
- [ ] ❌ Critical failures - DO NOT DEPLOY

#### Issues Found:
1. ___________
2. ___________

#### Next Steps:
- [ ] Deploy to production
- [ ] Fix issues and re-test
- [ ] Schedule customer demos
- [ ] Update documentation
```

---

## 🚀 Post-Testing Actions

### If All Tests Pass:
1. ✅ Mark smoke tests complete in STEP3_CRITICAL_FIX_TEST_PLAN.md
2. ✅ Deploy to fly.io: `flyctl deploy`
3. ✅ Smoke test production: https://merlin-bess-quote-builder.fly.dev/wizard-v6
4. ✅ Email stakeholders: "Step 3 fix verified across 21 industries - ready for demos"
5. ✅ Update roadmap: Remove blocker status

### If Tests Fail:
1. ❌ Document failures in this checklist
2. ❌ Create GitHub issue with reproduction steps
3. ❌ Debug using console logs and network tab
4. ❌ Apply fixes and re-run automated + manual tests
5. ❌ DO NOT deploy or schedule demos until fixed

---

## 📞 Escalation Path

**If you encounter critical bugs during testing:**

1. **Check console for error messages** - Most issues show detailed errors
2. **Review this checklist** - Common patterns documented above
3. **Run automated test:** `npx tsx scripts/smoke-test-all-industries.ts`
4. **Check database:** Verify questions exist for failing industry
5. **Contact dev team** - Provide:
   - Industry that failed
   - Console logs (screenshot)
   - Steps to reproduce
   - Whether it worked before the fix

---

**Last Updated:** Jan 20, 2026
**Status:** ⏳ PENDING MANUAL TESTING
**Blocker:** Cannot deploy until smoke tests pass
