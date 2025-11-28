# Dead Code Audit - November 18, 2025

## Summary
Searched for dead code similar to `calculateDatacenterBESS()` to prevent future bugs.

---

## ✅ Phase 1 Complete: Removed from baselineService.ts

### 1. Deleted: `calculateDatacenterBESS()` function (68 lines)
- **Location:** Was lines 620-688 in baselineService.ts
- **Status:** ✅ DELETED
- **Reason:** Never called anywhere in codebase
- **Verified:** grep search showed zero references

### 2. Deleted: Unreachable datacenter special case (6 lines)  
- **Location:** Was lines 287-292 in baselineService.ts
- **Status:** ✅ DELETED
- **Reason:** Code never reached due to early return on line 104
- **Impact:** Cleaner fallback logic

**Total Removed:** 74 lines of dead/unreachable code

---

## ⚠️ Found But NOT Removed: SmartWizardV2.tsx

### Commented-Out AI Recommendation Code (330 lines)
- **Location:** Lines 574-904 in SmartWizardV2.tsx
- **Status:** ⚠️ COMMENTED OUT (not executed)
- **Contains:** Calls to deleted `calculateDatacenterBESS()` function
- **Risk Level:** LOW (code is commented, not executed)

**Why it exists:**
```typescript
// 🚫 AI USE CASE RECOMMENDATION TEMPORARILY DISABLED
// TODO [v2.1]: Re-enable AI recommendations with centralizedCalculations.ts v2.0.0
// Currently uses hardcoded formulas that don't match database-driven calculations
// causing confusion (e.g., AI suggests 11.5MW vs SmartWizard's 5.4MW for same use case)
/*
  // 330 lines of switch/case AI recommendation logic
  ...
  const { powerMW, durationHours: dur } = calculateDatacenterBESS(capacity, uptimeReq, gridConn); // ❌ Function deleted!
  ...
*/
```

**Decision:** Leave commented out for now
- Not causing any issues (commented code never executes)
- Removing requires careful file surgery (risk of breaking working code)
- If anyone tries to uncomment this, TypeScript will immediately show error: "calculateDatacenterBESS not found"
- Can be safely removed in future cleanup sprint

**Action if uncommented:** Will break immediately with clear error message pointing to missing function

---

## ✅ No Other Dead Code Found

### Files Searched:
- `src/services/*.ts` - All service files
- `src/utils/*.ts` - All utility files  
- `src/components/wizard/SmartWizardV2.tsx` - Main wizard component

### Search Patterns:
- `calculateDatacenterBESS` - Only found in commented code + doc files
- `calculateHotelBESS` - Not found (never existed)
- `calculateManufacturingBESS` - Not found (never existed)
- Dead exports - All exports are referenced

---

## Current Architecture State

### Active Calculation Functions:
✅ `calculateDatabaseBaseline()` - Main entry point (baselineService.ts)
✅ `calculateDatacenterBaseline()` - Datacenter-specific (baselineService.ts)
✅ `calculateEVChargingBaseline()` - EV-specific (baselineService.ts)

### Removed Functions:
❌ `calculateDatacenterBESS()` - DELETED (was never called)

### Commented Functions:
⚠️ AI recommendation logic in SmartWizardV2.tsx - Temporarily disabled, safe to ignore

---

## Recommendations

### Immediate (This Sprint):
1. ✅ Continue with comprehensive testing of ALL use cases
2. ✅ Verify calculateDatabaseBaseline() works for every template
3. ⏳ Phase 2: Extract shared grid analysis function

### Future Cleanup (v2.1):
1. Remove commented AI recommendation block (lines 574-904 in SmartWizardV2.tsx)
2. Either re-implement AI recommendations using calculateDatabaseBaseline() OR delete permanently
3. Add linter rule to prevent large commented code blocks

---

## Testing Priority

User is NERVOUS about customer demos THIS WEEK. Focus on:
1. **Test ALL use cases** - Verify calculations work
2. **Document results** - Build confidence through data
3. **Phase 2 can wait** - Only proceed after testing complete

---

## Commit Message (Phase 1)

```
refactor: Remove 74 lines of dead code from baselineService

- Delete calculateDatacenterBESS() function (never called)
- Remove unreachable datacenter special case (lines 287-292)
- Simplify calculateDatabaseBaseline() routing logic
- No functional changes - pure cleanup

Audit found 330 lines of commented code in SmartWizardV2.tsx
referencing deleted function, but left in place (already disabled,
low risk). Can be removed in future sprint.
```

---

**Status:** Dead code audit complete. Phase 1 cleanup successful. Ready for comprehensive testing.
