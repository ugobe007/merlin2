# SSOT & TrueQuote Audit Results - Complete Fix Plan

## Audit Results Summary

**Total Violations: 22**
- Critical: 20
- Warnings: 2

**By Type:**
- Missing: 16
- SSOT: 5
- TrueQuote: 1
- Mapping: 0

## Fixes Applied

### 1. Database Migration
**File**: `database/migrations/20260102_fix_all_ssot_violations.sql`

Adds all missing foundational variables:
- ✅ ev-charging: `ultraFastCount`
- ✅ warehouse: `squareFeet`
- ✅ manufacturing: `squareFeet`
- ✅ retail: `squareFeet`
- ✅ office: `squareFeet`
- ✅ cold-storage: `storageVolume`, `squareFeet`
- ✅ casino: `gamingFloorSize` + default for `gamingFloorSqFt`
- ✅ college: `studentEnrollment`, `studentCount`
- ✅ government: `buildingSqFt`, `facilitySqFt`
- ✅ shopping-center: `totalSqFt`, `retailSqFt`
- ✅ indoor-farm: `squareFeet` + default for `growingAreaSqFt`

Fixes SSOT violations:
- ✅ ev-charging: `dcFastCount` → required
- ✅ car-wash: `tunnelCount` → required (verify business logic)
- ⚠️ data-center: `rackCount` → required (needs business logic verification - might be alternative to itLoadKW)

### 2. Code Fix
**File**: `src/components/wizard/v6/steps/Step5MagicFit.tsx`

**Fixed**: Apartment TrueQuote mapping
- **Issue**: Apartment uses `unitCount` in database, but TrueQuote Engine expects `roomCount`
- **Fix**: Added mapping `unitCount → roomCount` in `mapWizardStateToTrueQuoteInput()`

```typescript
// Apartment: Map unitCount → roomCount for TrueQuote Engine
if (industryType === 'apartment' && facilityData.unitCount && !facilityData.roomCount) {
  facilityData.roomCount = parseFloat(String(facilityData.unitCount));
}
```

## Edge Cases to Verify

### 1. Restaurant Use Case
**Issue**: Audit reports "Use case 'restaurant' not found in database"
**Action**: 
- Check if restaurant use case exists
- If exists: Add foundational variables
- If not: Remove from audit script's foundational variables list

### 2. tunnelCount (Car Wash)
**Issue**: Audit says should be required
**Question**: Is `tunnelCount` required, or can car wash use `bayCount` as alternative?
**Action**: Verify business logic - if both are valid, make both optional but at least one required

### 3. rackCount (Data Center)
**Issue**: Audit says should be required
**Question**: Data center can use EITHER `rackCount` OR `itLoadKW` - should both be required?
**Action**: Verify business logic - if `itLoadKW` is alternative, make both optional but at least one required

## Next Steps

1. **Run Migration**
   ```bash
   psql $DATABASE_URL -f database/migrations/20260102_fix_all_ssot_violations.sql
   ```

2. **Re-run Audit**
   ```bash
   npx tsx scripts/audit-ssot-truequote-violations.ts
   ```
   Expected: 0 critical violations (or verify edge cases)

3. **Test in Wizard**
   - Test each industry
   - Verify foundational variables appear
   - Verify calculations are accurate
   - Verify values flow to TrueQuote Engine

4. **Fix Edge Cases** (if needed)
   - Restaurant use case (add or remove from audit)
   - tunnelCount/rackCount business logic verification

## Success Criteria

✅ All 20 critical violations fixed  
✅ Apartment TrueQuote mapping working  
✅ All foundational variables in database  
✅ All foundational variables have defaults (UI initialization)  
✅ Required foundational variables are `is_required: true`  
✅ TrueQuote Engine mappings correct  
✅ 0 critical violations on re-run audit  
