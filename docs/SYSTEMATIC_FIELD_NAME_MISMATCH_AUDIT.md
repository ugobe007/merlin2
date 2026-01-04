# Systematic Field Name Mismatch Audit
## TrueQuote Engine ↔ Database Field Mapping Issues

**Date:** January 2, 2026  
**Status:** 🔴 CRITICAL - All Data Center calculations failing, potentially other industries too

---

## 🔍 Executive Summary

The TrueQuote Engine was built with specific field name expectations, but the database uses different field names in several critical areas. This causes **ALL calculations to return 0 kW / 0 kWh** for affected industries.

**Root Cause:** Field name mismatches between:
1. `Step5MagicFit.tsx` subtype extraction
2. `TrueQuoteEngine.ts` field lookups
3. Database `custom_questions.field_name` values

---

## ❌ CRITICAL MISMATCHES IDENTIFIED

### 1. Data Center - Subtype Field
| Component | Field Name | Status |
|-----------|-----------|--------|
| **TrueQuote Engine** | `tierClassification` | ❌ Expected |
| **Step5MagicFit.tsx** | `tierClassification` | ❌ Checks this |
| **Database** | `dataCenterTier` | ✅ Actual value |
| **Impact** | Subtype defaults to `'tier_3'` but may not match database values | 🔴 HIGH |

**Database Migration:** `20251212_fix_data_center_questions.sql:40`
```sql
field_name: 'dataCenterTier'  -- NOT 'tierClassification'!
```

---

### 2. Data Center - PUE Field
| Component | Field Name | Status |
|-----------|-----------|--------|
| **TrueQuote Engine** | `powerUsageEffectiveness` or `pue` | ❌ Expected |
| **Database** | `targetPUE` | ✅ Actual value |
| **Impact** | PUE modifier never applied → peak demand wrong → BESS = 0 | 🔴 CRITICAL |

**Database Migration:** `20251212_fix_data_center_questions.sql:100`
```sql
field_name: 'targetPUE'  -- NOT 'powerUsageEffectiveness' or 'pue'!
```

**TrueQuote Engine Code:** `TrueQuoteEngine.ts:1088, 1141`
```typescript
// Line 1088: Modifier application
if (mod.trigger === 'powerUsageEffectiveness' || mod.trigger === 'pue')

// Line 1141: shouldApplyModifier
if (trigger === 'powerUsageEffectiveness' || trigger === 'pue')
```

---

## ✅ VERIFIED MATCHES (These industries should work)

### Hotel
- **Unit Field:** `roomCount` ✅ (matches)
- **Subtype Field:** `hotelType` ✅ (matches)
- **Source:** `database/migrations/20251217_hotel_questionnaire_updates.sql:54`

### Hospital
- **Unit Field:** `bedCount` ✅ (matches)
- **Subtype Field:** `hospitalType` ✅ (matches)
- **Source:** `database/migrations/20251212_fix_hospital_questions.sql`

### Car Wash
- **Unit Field:** `bayCount` ✅ (matches)
- **Subtype Field:** `washType` ✅ (matches)
- **Source:** Various migrations use `bayCount` and `washType`

---

## 🔬 SYSTEMATIC CHECK NEEDED

### Industries to Verify:
1. ✅ **Data Center** - ❌ **FAILING** (2 mismatches found)
2. ✅ **Hotel** - ✅ Working (verified)
3. ✅ **Hospital** - ✅ Working (verified)
4. ✅ **Car Wash** - ✅ Working (verified)
5. ⚠️ **EV Charging** - ❓ Need to verify
6. ⚠️ **Manufacturing** - ❓ Need to verify
7. ⚠️ **Retail** - ❓ Need to verify
8. ⚠️ **Restaurant** - ❓ Need to verify
9. ⚠️ **Office** - ❓ Need to verify
10. ⚠️ **University** - ❓ Need to verify
11. ⚠️ **Agriculture** - ❓ Need to verify
12. ⚠️ **Warehouse** - ❓ Need to verify

---

## 🛠️ FIXES REQUIRED

### Fix #1: Step5MagicFit.tsx - Add dataCenterTier to subtype extraction

**File:** `src/components/wizard/v6/steps/Step5MagicFit.tsx`  
**Line:** 328-332

**Current:**
```typescript
const subtype = state.useCaseData?.tierClassification || 
                state.useCaseData?.hotelType ||
                state.useCaseData?.hospitalType ||
                state.useCaseData?.washType ||
                'tier_3'; // Default for data centers
```

**Fix:**
```typescript
const subtype = state.useCaseData?.tierClassification || 
                state.useCaseData?.dataCenterTier ||  // ADD THIS
                state.useCaseData?.hotelType ||
                state.useCaseData?.hospitalType ||
                state.useCaseData?.washType ||
                'tier_3'; // Default for data centers
```

**Also need to normalize dataCenterTier values:**
- Database uses: `"tier1"`, `"tier2"`, `"tier3"`, `"tier4"`, `"hyperscale"`
- TrueQuote Engine expects: `"tier_1"`, `"tier_2"`, `"tier_3"`, `"tier_4"`, `"hyperscale"`

**Additional Fix Needed:**
```typescript
// Normalize dataCenterTier format (tier1 → tier_1)
let normalizedSubtype = subtype;
if (state.useCaseData?.dataCenterTier) {
  const dcTier = state.useCaseData.dataCenterTier;
  if (dcTier === 'tier1') normalizedSubtype = 'tier_1';
  else if (dcTier === 'tier2') normalizedSubtype = 'tier_2';
  else if (dcTier === 'tier3') normalizedSubtype = 'tier_3';
  else if (dcTier === 'tier4') normalizedSubtype = 'tier_4';
  else normalizedSubtype = dcTier; // hyperscale or other
}
```

---

### Fix #2: TrueQuoteEngine.ts - Accept targetPUE for PUE modifier

**File:** `src/services/TrueQuoteEngine.ts`  
**Lines:** 1088-1090, 1141-1143

**Current (Line 1088):**
```typescript
const multiplier = ((mod.trigger === 'powerUsageEffectiveness' || mod.trigger === 'pue') && typeof modValue === 'number' && modValue > 1) 
  ? modValue 
  : mod.multiplier;
```

**Fix:**
```typescript
// Check for PUE field (multiple variations)
const isPUE = mod.trigger === 'powerUsageEffectiveness' || 
               mod.trigger === 'pue' || 
               mod.trigger === 'targetPUE';
const pueValue = isPUE ? (facilityData['powerUsageEffectiveness'] || 
                          facilityData['pue'] || 
                          facilityData['targetPUE']) : null;
const multiplier = (isPUE && pueValue !== undefined && parseFloat(pueValue) > 1)
  ? parseFloat(pueValue)
  : mod.multiplier;
```

**Current (Line 1141):**
```typescript
if (trigger === 'powerUsageEffectiveness' || trigger === 'pue') {
  return value !== undefined && parseFloat(value) > 1;
}
```

**Fix:**
```typescript
if (trigger === 'powerUsageEffectiveness' || trigger === 'pue' || trigger === 'targetPUE') {
  const pueValue = facilityData['powerUsageEffectiveness'] || 
                   facilityData['pue'] || 
                   facilityData['targetPUE'];
  return pueValue !== undefined && parseFloat(pueValue) > 1;
}
```

**Also update modifier lookup (Line 1086):**
```typescript
const modValue = facilityData[mod.trigger] || 
                 (mod.trigger === 'powerUsageEffectiveness' ? (facilityData['pue'] || facilityData['targetPUE']) : undefined) ||
                 (mod.trigger === 'pue' ? (facilityData['powerUsageEffectiveness'] || facilityData['targetPUE']) : undefined) ||
                 (mod.trigger === 'targetPUE' ? (facilityData['powerUsageEffectiveness'] || facilityData['pue']) : undefined);
```

---

## 📋 TESTING CHECKLIST

After fixes, verify:

- [ ] Data Center: 400 racks, Tier III → BESS ~1,600 kW (not 0)
- [ ] Data Center: PUE applied correctly (1.6 PUE → peak demand × 1.6)
- [ ] Hotel: Still works (regression test)
- [ ] Hospital: Still works (regression test)
- [ ] Car Wash: Still works (regression test)
- [ ] Browser console shows correct values in debug logs

---

## 🔄 NEXT STEPS

1. **Immediate:** Implement Fixes #1 and #2
2. **Next:** Audit all other industries (EV, Manufacturing, Retail, etc.) for similar mismatches
3. **Prevention:** Create a field name mapping document/constants file to prevent future mismatches
4. **Testing:** Run validation suite against all industries

---

## 📁 FILES TO UPDATE

1. ✅ `src/components/wizard/v6/steps/Step5MagicFit.tsx` - Line 328-332
2. ✅ `src/services/TrueQuoteEngine.ts` - Lines 1086-1090, 1141-1143
3. ⚠️ Consider: Create `src/services/fieldNameMapping.ts` for centralized field name mappings

---

**Priority:** 🔴 **CRITICAL** - All Data Center calculations are currently broken.
