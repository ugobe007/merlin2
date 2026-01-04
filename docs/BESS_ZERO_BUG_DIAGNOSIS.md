# BESS 0 kW Bug - Field Name Mismatch Diagnosis

## Date: January 2, 2026
## Issue: BESS Power and Storage showing 0 kW / 0 kWh in Step 5

---

## 🔍 ROOT CAUSE IDENTIFIED

### Issue #1: Subtype Field Name Mismatch

**Step5MagicFit.tsx** (line 328) looks for:
```typescript
const subtype = state.useCaseData?.tierClassification || ...
```

**Database** (20251212_fix_data_center_questions.sql, line 40) uses:
```sql
field_name: 'dataCenterTier'  -- NOT 'tierClassification'!
```

**Impact:** Subtype defaults to `'tier_3'` but TrueQuote Engine might not match the subtype config correctly.

---

### Issue #2: PUE Field Name Mismatch

**TrueQuote Engine** (TrueQuoteEngine.ts, line 1088, 1141) looks for:
```typescript
powerUsageEffectiveness || pue
```

**Database** (20251212_fix_data_center_questions.sql, line 100) uses:
```sql
field_name: 'targetPUE'  -- NOT 'powerUsageEffectiveness' or 'pue'!
```

**Impact:** PUE modifier is never applied, so peak demand calculation is wrong.

---

### Issue #3: rackCount Field Type (Potential Issue)

**Database** stores `rackCount` as a **SELECT dropdown** with string values:
```sql
options: [
  {"label": "200 - 500 racks", "value": "350"},  -- VALUE IS STRING "350"
  ...
]
```

**TrueQuote Engine** (TrueQuoteEngine.ts, line 1129) does:
```typescript
const value = parseInt(facilityData[field]) || 0;
```

**Should work** because `parseInt("350")` = 350, but we need to verify the value is actually stored in `useCaseData`.

---

## 📋 FIELD NAME MAPPING

| TrueQuote Engine Expects | Database Uses | Status |
|-------------------------|---------------|--------|
| `rackCount` | `rackCount` | ✅ MATCH |
| `tierClassification` | `dataCenterTier` | ❌ MISMATCH |
| `powerUsageEffectiveness` / `pue` | `targetPUE` | ❌ MISMATCH |

---

## 🛠️ FIXES NEEDED

### Fix #1: Update Step5MagicFit.tsx subtype extraction

**Current:**
```typescript
const subtype = state.useCaseData?.tierClassification || ...
```

**Should be:**
```typescript
const subtype = state.useCaseData?.tierClassification || 
                state.useCaseData?.dataCenterTier ||  // ADD THIS
                ...
```

### Fix #2: Update TrueQuote Engine PUE field mapping

**Option A:** Update TrueQuote Engine to also check `targetPUE`:
```typescript
// In shouldApplyModifier:
if (trigger === 'powerUsageEffectiveness' || trigger === 'pue' || trigger === 'targetPUE') {
  return value !== undefined && parseFloat(value) > 1;
}

// In calculatePeakDemand modifier application:
const pueValue = facilityData['powerUsageEffectiveness'] || 
                 facilityData['pue'] || 
                 facilityData['targetPUE'];
```

**Option B:** Update Step3Details to map `targetPUE` → `powerUsageEffectiveness` when saving answers.

**Recommendation:** Option A (update TrueQuote Engine) is more robust and handles all variations.

---

## 🔬 DEBUGGING STEPS

The debug logging I added will show:

1. **In browser console, look for:**
   ```
   🔍 [mapWizardStateToTrueQuoteInput] DEBUG: {
     useCaseData: { ... },
     facilityDataSample: {
       rackCount: ...,
       powerUsageEffectiveness: ...,
       tierClassification: ...,
     }
   }
   ```

2. **If `useCaseData` is empty or missing fields:**
   - Check Step3Details.tsx `updateAnswer` function (line 556-559)
   - Verify that answers are being saved to `useCaseData[fieldName]`

3. **If `rackCount` exists but is 0:**
   - Check if the dropdown value is being stored correctly
   - Verify `parseInt()` is working (might be storing as string "350" instead of number 350)

---

## ✅ VERIFICATION

After fixes, the console should show:
```
✅ TrueQuote Engine Calculation: {
  peakDemandKW: ~3200,  // 400 racks × 5 kW × 1.6 PUE
  baseBessKW: ~1600,    // 50% of peak
  baseBessKWh: ~6400,   // 1600 kW × 4 hours
  ...
}
```

---

## 📁 FILES TO UPDATE

1. **src/components/wizard/v6/steps/Step5MagicFit.tsx**
   - Line 328-332: Add `dataCenterTier` to subtype extraction

2. **src/services/TrueQuoteEngine.ts**
   - Line 1088-1090: Add `targetPUE` to PUE check in modifier application
   - Line 1141-1143: Add `targetPUE` to PUE check in `shouldApplyModifier`

---

**Next Step:** Implement the fixes above and test with Data Center (400 racks, Tier III).
