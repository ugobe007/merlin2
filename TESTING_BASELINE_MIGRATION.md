# Testing Guide: Baseline Service Migration

## Quick Test (5 minutes)

### Test 1: EV Charging Calculation
**Goal**: Verify AI recommends realistic sizing (not 1 MW for 120 chargers)

**Steps**:
1. Open Smart Wizard (http://localhost:5177)
2. Select "EV Charging Hub" use case
3. Enter:
   - Level 2 Chargers: `100`
   - Level 2 Power: `11` kW
   - DC Fast Chargers: `20`
   - DC Fast Power: `150` kW
4. Proceed to Step 3 (Interactive Dashboard)

**Expected Results**:
- Wizard should calculate ~1.7-2.0 MW (NOT 1.0 MW)
- Console should show:
  ```
  🔌 EV Charging Calculation: {
    level2Count: 100, totalLevel2: 1.1 MW,
    dcFastCount: 20, totalDCFast: 3.0 MW,
    recommendedSize: 1.7-2.0 MW
  }
  ```
- AI insight badge should appear (if values differ from baseline)
- AI suggestion should use similar baseline (~1.7-2.0 MW, not 11.5 MW)

**Pass Criteria**: ✅ Wizard shows 1.7-2.0 MW, AI suggests based on similar baseline

---

### Test 2: Hotel Baseline Consistency
**Goal**: Verify wizard and AI use identical database baseline

**Steps**:
1. Open Smart Wizard
2. Select "Hotel/Resort" use case
3. Enter: `100` rooms
4. Proceed to Step 3 (Interactive Dashboard)
5. Open browser console (Cmd+Opt+J on Mac)

**Expected Console Output**:
```
🔍 [BaselineService] Fetching configuration for: hotel (scale: 2.0)
✅ [BaselineService] Using database configuration: { typical_load_kw: 2930, ... }
📊 [BaselineService] Calculated baseline: { powerMW: 5.86, durationHrs: 4, ... }
🎯 [SmartWizard] Baseline from shared service: { powerMW: 5.86, ... }
🤖 AI Optimization analyzing configuration...
📊 Industry baseline (from database): { powerMW: 5.86, ... }
```

**Key Check**: The powerMW value should be **IDENTICAL** in both wizard and AI logs

**Pass Criteria**: ✅ Wizard and AI show same baseline (5.86 MW for 100 rooms)

---

### Test 3: AI Suggestion Consistency
**Goal**: Verify AI suggestions align with wizard calculations

**Steps**:
1. Continue from Test 2 (100-room hotel)
2. Wait 1 second for AI analysis to complete
3. Look for AI insight badges in the dashboard
4. Check console for AI analysis

**Expected Behavior**:
- If user's config matches baseline: Green "✓ Optimal" badge
- If user's config differs: Yellow "!" badge with suggestion
- "Optimize with AI" button should be visible
- Clicking button should apply consistent recommendations

**Expected Console**:
```
🤖 AI Optimization analyzing configuration...
📊 Industry baseline (from database): { powerMW: 5.86, durationHrs: 4 }
📈 User configuration: { powerMW: 5.86, durationHrs: 4 }
✅ Configuration is optimal (within 10% of baseline)
```

**Pass Criteria**: ✅ AI suggestions reference same baseline as wizard

---

## Comprehensive Test (20 minutes)

### Test All Use Cases

| Use Case | Input | Expected Power | Expected Duration |
|----------|-------|----------------|-------------------|
| Hotel | 50 rooms | ~2.9 MW | 4 hrs |
| Hotel | 100 rooms | ~5.9 MW | 4 hrs |
| Hospital | 200 beds | Database value | Database value |
| Data Center | 5 MW IT load | Database value | Database value |
| EV Charging | 100 L2 + 20 DC Fast | ~1.7-2.0 MW | 2 hrs |
| Manufacturing | 10 MW peak | Database value | Database value |

**For Each Use Case**:
1. Complete wizard flow
2. Check console for "🔍 [BaselineService]" logs
3. Verify wizard uses database baseline
4. Verify AI uses same baseline
5. Check that values are sensible

---

## Database Verification

### Check Use Case Configurations Exist

**Run in Supabase SQL Editor**:
```sql
-- Check all use cases
SELECT 
  uc.name,
  uc.slug,
  ucc.typical_load_kw,
  ucc.preferred_duration_hours,
  ucc.is_default
FROM use_cases uc
LEFT JOIN use_case_configurations ucc ON uc.id = ucc.use_case_id
WHERE ucc.is_default = true
ORDER BY uc.name;
```

**Expected Results**:
- Hotel: typical_load_kw = 2930 (for 50 rooms baseline)
- Hospital: typical_load_kw = populated
- Data Center: typical_load_kw = populated
- EV Charging: May not have default config (uses calculated baseline)
- Manufacturing: typical_load_kw = populated

**If Missing Data**:
- Fallback mechanism will trigger
- Console will show: "⚠️ No database configuration found for {use_case}"
- System will use hardcoded fallback values

---

## Console Log Reference

### Normal Flow (Success):
```
🔍 [BaselineService] Fetching configuration for: hotel (scale: 2.0)
✅ [BaselineService] Using database configuration: { typical_load_kw: 2930 }
📊 [BaselineService] Calculated baseline: { powerMW: 5.86, durationHrs: 4 }
🎯 [SmartWizard] Baseline from shared service: { powerMW: 5.86 }
🤖 AI Optimization analyzing configuration...
📊 Industry baseline (from database): { powerMW: 5.86 }
```

### Fallback Flow (Database Issue):
```
🔍 [BaselineService] Fetching configuration for: hotel (scale: 2.0)
⚠️ No database configuration found for hotel
🔄 [BaselineService] Using fallback baseline
📊 [BaselineService] Fallback baseline: { powerMW: 2.93, durationHrs: 4 }
```

### EV Charging Flow:
```
🔍 [BaselineService] EV Charging - Using charger specifications
🔌 EV Charging Calculation: {
  level2Count: 100, level2Power: 11kW,
  dcFastCount: 20, dcFastPower: 150kW,
  totalLevel2: 1.1 MW, totalDCFast: 3.0 MW,
  totalCharging: 4.1 MW, concurrency: 0.7,
  recommendedSize: 1.9 MW
}
```

---

## Troubleshooting

### Issue: AI shows different baseline than wizard
**Symptom**: Console shows different powerMW values for wizard vs AI
**Cause**: Migration incomplete or import error
**Fix**: 
- Check `aiOptimizationService.ts` line 12 imports `calculateDatabaseBaseline`
- Check `SmartWizardV2.tsx` line 8 imports `calculateDatabaseBaseline`
- Verify no lingering `calculateIndustryBaseline` calls

### Issue: "Cannot read property 'typical_load_kw'"
**Symptom**: Error in console, baseline calculation fails
**Cause**: Database connection issue or missing use case configuration
**Fix**:
- Check Supabase connection in browser network tab
- Verify use_case_configurations table has data
- Check fallback mechanism triggers

### Issue: EV charging still shows 1.0 MW
**Symptom**: Wizard shows 1 MW for 120 chargers
**Cause**: useCaseData not passed or EV calculation logic not triggered
**Fix**:
- Check `SmartWizardV2.tsx` line 265 passes `useCaseData` parameter
- Check `InteractiveConfigDashboard.tsx` passes `useCaseData` to AI
- Verify console shows "🔌 EV Charging Calculation"

### Issue: No AI suggestions appear
**Symptom**: No insight badges in dashboard
**Cause**: AI optimization hook not firing or errors
**Fix**:
- Check browser console for errors
- Verify 1-second debounce is working (wait a moment after changing values)
- Check `aiOptimizationService.ts` is being called (look for "🤖 AI Optimization" log)

---

## Performance Checks

### Response Times
**Baseline Calculation**: Should be < 100ms
- Database query: ~20-50ms
- Calculation logic: ~1-5ms
- Fallback (if needed): ~1ms

**AI Optimization**: Should be < 500ms
- Baseline fetch: ~100ms
- Financial calculations: ~200ms
- Analysis logic: ~100ms

**If Slower**:
- Check network tab for slow Supabase queries
- Consider adding database indexes on `use_cases.slug`
- Consider caching baseline configurations

---

## Success Checklist

### Critical Tests (Must Pass):
- [ ] EV Charging: Shows 1.7-2.0 MW (not 1.0 MW) for 100 L2 + 20 DC Fast
- [ ] Hotel: Wizard and AI show identical baseline for 100 rooms
- [ ] Console logs show "🔍 [BaselineService]" for all calculations
- [ ] AI suggestions reference database-driven baseline
- [ ] No new TypeScript compilation errors

### Nice-to-Have Tests:
- [ ] All 6+ use cases calculate correctly
- [ ] Fallback mechanism works if database unavailable
- [ ] Performance is acceptable (< 500ms for full flow)
- [ ] UI responds smoothly, no lag
- [ ] Console logs are clear and helpful

---

## Regression Tests

### Ensure These Still Work:
- [ ] Wizard flow completes without errors
- [ ] Quote generation (PDF/Excel/Word) works
- [ ] Financial calculations are accurate
- [ ] Solar sizing recommendations appear
- [ ] Advanced mode features still work
- [ ] Quote review workflow functions

---

## Next Steps After Testing

### If All Tests Pass:
1. Mark `/utils/industryBaselines.ts` as deprecated
2. Update ARCHITECTURE.md with shared service
3. Plan migration of remaining 11 files
4. Add unit tests for baselineService
5. Deploy to staging for broader testing

### If Tests Fail:
1. Document specific failure scenarios
2. Check console for error messages
3. Review BASELINE_SERVICE_MIGRATION.md for troubleshooting
4. Rollback changes if critical issues found
5. Debug with comprehensive logging

---

## User Acceptance Criteria

Ask these questions during user testing:

1. **Accuracy**: "Does the recommended system size feel right for your facility?"
2. **Consistency**: "Do the numbers feel consistent throughout the wizard?"
3. **Trust**: "Do you trust the AI suggestions?"
4. **Speed**: "Is the wizard responsive enough?"
5. **Clarity**: "Are the recommendations clear and well-explained?"

**Target**: 4/5 or higher satisfaction on all questions

---

**Ready to Test**: ✅ All code changes complete, testing guide ready
