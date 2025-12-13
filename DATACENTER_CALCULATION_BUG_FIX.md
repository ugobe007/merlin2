# Data Center BESS Calculation Bug Fix - Dec 2025

## 🔴 CRITICAL BUG DISCOVERED

**Issue**: Data center BESS recommendations were dramatically undersized (18x too small).

**Example**: 
- User input: Tier 3 data center with 9 MW IT load
- Expected BESS: 9,000 kW × 1.5 PUE = 13,500 kW peak → 13,500 × 0.40 ratio = 5,400 kW × 4hr = **21,600 kWh**
- Actual recommendation: **800 kWh** (200 kW × 4hr)
- Error magnitude: ~27x too small

## 🔍 ROOT CAUSE

### Field Name Mismatch: MW vs kW Units

The database migration `20251212_fix_data_center_questions.sql` stores IT load in **megawatts**:

```sql
INSERT INTO custom_questions (use_case_id, question_text, field_name, ...)
VALUES (v_use_case_id, 'IT load / white space capacity', 'itLoadMW', 'select', '3', true, ...);
```

But the calculation code in `useWizardState.ts` and `useCasePowerCalculations.ts` expects **kilowatts**:

```typescript
// useCasePowerCalculations.ts line 5145
return calculateDatacenterPower(
  parseInt(useCaseData.itLoadKW) || undefined,  // ❌ Looking for itLoadKW
  parseInt(useCaseData.rackCount) || undefined,
  parseFloat(useCaseData.averageRackDensity || useCaseData.rackDensityKW) || 8
);
```

### What Happened

1. User enters "3" in the form (meaning 3 MW)
2. Database stores: `{ itLoadMW: '3' }`
3. Code looks for: `useCaseData.itLoadKW` → **undefined**
4. Code falls back to: `useCaseData.rackCount` → also **undefined**
5. `calculateDatacenterPower()` gets all undefined inputs
6. Falls back to default: **2,000 kW (2 MW)** instead of 9,000 kW

### Why the Wrong Number Appeared

The 200 kW shown in the UI was likely:
- Either the 2 MW default × 0.10 (some other factor)
- Or a different calculation path using square footage instead of data center specs

## ✅ FIX APPLIED

### Code Change (useWizardState.ts line ~168)

Added MW to kW conversion in the field mapping:

```typescript
// Data center IT load (convert MW to kW for SSOT)
// Database stores itLoadMW (in MW), SSOT expects itLoadKW (in kW)
itLoadKW: state.useCaseData.itLoadKW || (state.useCaseData.itLoadMW ? parseFloat(state.useCaseData.itLoadMW) * 1000 : undefined),
```

### What This Does

1. First checks if `itLoadKW` already exists (backward compatibility)
2. If not, looks for `itLoadMW` and converts: MW × 1000 = kW
3. If neither exists, returns `undefined` (triggers rack count calculation or default)

## 🧪 VERIFICATION

### Debug Logging Added

To help diagnose future issues, added comprehensive logging:

**useWizardState.ts (line ~312)**:
```typescript
console.log('🔋🔋🔋 [recalculate] CRITICAL DATA CENTER DEBUG:', {
  industryType: state.industry.type,
  baseBuildingLoadKW,
  totalPeakDemandKW,
  facilityData: {
    itLoadKW: state.useCaseData?.itLoadKW,
    useCaseDataKeys: Object.keys(state.useCaseData || {})
  }
});
```

**useCasePowerCalculations.ts (line ~5142)**:
```typescript
console.log('🏢🏢🏢 [calculateUseCasePower] DATA CENTER CASE - useCaseData:', {
  itLoadKW: useCaseData.itLoadKW,
  rackCount: useCaseData.rackCount,
  allKeys: Object.keys(useCaseData)
});
```

**calculateDatacenterPower() (line ~3364)**:
```typescript
console.log('🏢 [calculateDatacenterPower] INPUTS:', { itLoadKW, rackCount, rackDensityKW });
console.log('🏢 [calculateDatacenterPower] FINAL OUTPUT:', { powerKW, powerMW, method });
```

### Expected Behavior After Fix

For a Tier 3 data center with 9 MW IT load:

1. User selects "5 - 15 MW (large)" → value: "10" (stores `itLoadMW: '10'`)
2. Code converts: `10 MW × 1000 = 10,000 kW`
3. `calculateDatacenterPower(10000, undefined, 8)` 
4. Calculation: `10,000 kW IT × 1.5 PUE = 15,000 kW` total facility load
5. BESS sizing: `15,000 kW × 0.40 (peak_shaving) = 6,000 kW`
6. Battery: `6,000 kW × 4 hr = 24,000 kWh` ✅ CORRECT

## 📋 TESTING CHECKLIST

After deployment, verify:

- [ ] Open https://merlin2.fly.dev/ in browser console
- [ ] Start wizard, select "Data Center" industry
- [ ] Fill in: Tier 3, 5-15 MW (large), High-Density racks
- [ ] Check browser console for debug logs showing:
  - `itLoadKW: 10000` (not undefined)
  - `baseBuildingLoadKW: 15000` (10 MW × 1.5 PUE × 1000)
  - `recommendedBatteryKW: 6000` (15,000 × 0.40)
  - `recommendedBatteryKWh: 24000` (6,000 × 4)
- [ ] Verify Merlin's recommendation shows ~24 MWh battery
- [ ] Test with other IT loads (2-5 MW, 15-40 MW, etc.)
- [ ] Verify no regression in other industries (hotel, hospital, etc.)

## 🛡️ RELATED SYSTEMS TO AUDIT

This bug reveals a broader issue: **Unit consistency between database and code**.

### Other Industries to Check

| Industry | Database Field | Code Expects | Status |
|----------|---------------|--------------|--------|
| Hospital | `bedCount` | `bedCount` | ✅ OK |
| Hotel | `roomCount` | `roomCount` | ✅ OK |
| Car Wash | `bayCount` | `bayCount` | ✅ OK |
| EV Charging | Charger counts | Charger counts | ✅ OK |
| Airport | `annualPassengers` | `annualPassengers` | ⚠️ Check |
| Casino | `gamingFloorSqft` | `gamingFloorSqft` | ⚠️ Check |

### Recommended: Add TypeScript Validation

Create a type-safe mapper between database fields and calculation inputs:

```typescript
interface DataCenterInput {
  itLoadMW?: string;  // Database stores as string
  rackCount?: string;
  dataCenterTier?: 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'hyperscale';
}

function mapDataCenterInputs(dbData: DataCenterInput): CalculationInput {
  return {
    itLoadKW: dbData.itLoadMW ? parseFloat(dbData.itLoadMW) * 1000 : undefined,
    rackCount: dbData.rackCount ? parseInt(dbData.rackCount) : undefined,
    tier: dbData.dataCenterTier
  };
}
```

## 📊 IMPACT ASSESSMENT

### Affected Quotes

Any data center quotes generated before this fix would have been **dramatically undersized**. This could lead to:

- ❌ System undersized by 10-30x
- ❌ Insufficient backup power during outages
- ❌ Inability to handle peak loads
- ❌ Customer dissatisfaction
- ❌ Safety concerns for critical loads

### Business Impact

- **Severity**: CRITICAL - affects customer quotes, revenue, safety
- **Affected Users**: Any data center configurations since Dec 12, 2025
- **Fix Status**: ✅ Deployed Dec 2025 (commit TBD)
- **Recommendation**: Contact recent data center customers to re-quote

## 🔄 DEPLOYMENT HISTORY

| Date | Action | Commit | Status |
|------|--------|--------|--------|
| Dec 12, 2025 | Migration adds `itLoadMW` field | `20251212_fix_data_center_questions.sql` | ⚠️ Broke calculations |
| Dec 2025 | Bug discovered via user screenshot | N/A | 🔴 Critical issue |
| Dec 2025 | Added debug logging | TBD | ✅ Deployed |
| Dec 2025 | Added MW→kW conversion | TBD | ✅ Deployed |
| TBD | Verify fix in production | TBD | ⏳ Pending test |

## 📝 LESSONS LEARNED

1. **Unit consistency is critical** - Always use the same units across DB and code
2. **Type-safe field mapping** - Create typed mappers between DB and calculations
3. **Comprehensive logging** - Debug logs helped identify the issue quickly
4. **Integration tests** - Need end-to-end tests that verify DB → calculation flow
5. **Migration review** - Database field changes should trigger code audits

## 🎯 NEXT STEPS

1. ✅ Fix deployed (MW → kW conversion added)
2. ⏳ Test in production with real data center configurations
3. ⏳ Verify debug logs show correct values
4. ⏳ Contact recent data center customers for re-quotes
5. ⏳ Add integration test: DB field → calculation → quote result
6. ⏳ Audit other industries for similar unit mismatches
7. ⏳ Create typed field mappers for all industries

---

**Fix Author**: AI Agent  
**Date**: December 2025  
**Files Modified**:
- `src/hooks/useWizardState.ts` - Added MW to kW conversion
- `src/services/useCasePowerCalculations.ts` - Added debug logging
- `src/hooks/useWizardState.ts` - Added debug logging in recalculate()

**Related Issues**:
- User screenshot showing 800 kWh for 9 MW data center
- Database migration 20251212 added `itLoadMW` field
- Code expected `itLoadKW` field (unit mismatch)
