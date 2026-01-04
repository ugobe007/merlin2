# Complete Field Name Audit - ALL Industries

**Date:** January 2, 2026  
**Status:** 🔍 **IN PROGRESS**

---

## 🎯 Goal

Identify ALL field name mismatches between:
1. Database `custom_questions.field_name` values
2. Industry profile function input interfaces
3. TrueQuote Engine field expectations

---

## ✅ TrueQuote Engine Supported (5 industries - FIXED)

### Data Center
- ✅ **Fixed:** `dataCenterTier` → normalized to `tier_3` format
- ✅ **Fixed:** `targetPUE` → now accepted in TrueQuote Engine

### Hotel, Hospital, Car Wash, EV Charging
- ✅ **Verified:** Field names match (no fixes needed)

---

## ❓ Industries Using Fallback (7 industries - NEED AUDIT)

These industries don't have TrueQuote Engine configs, so they:
1. Throw error in TrueQuote Engine
2. Fall back to `calculateBasePowerKW()` which uses generic square footage
3. Their dedicated profile functions are **never called**

### Manufacturing
**Industry Profile Function:** `calculateManufacturingProfile(inputs: ManufacturingInputs)`

**Expected Fields (need to verify):**
- `manufacturingType` / `manufacturingSize`?
- `facilitySqFt` / `squareFootage`?
- `industryType`?

**Database Fields (from migration):**
- `manufacturingSize` (field_name: 'manufacturingSize')
- `squareFootage` (field_name: 'squareFootage')
- `industryType` (field_name: 'industryType')

**Status:** ❓ Need to check ManufacturingInputs interface

---

### Retail
**Industry Profile Function:** `calculateRetailProfile(inputs: RetailInputs)`

**Database Fields (need to check):**
- ❓ Check migration file for field names

**Status:** ❓ Need to audit

---

### Restaurant
**Industry Profile Function:** `calculateRestaurantProfile(inputs: RestaurantInputs)`

**Database Fields (need to check):**
- ❓ Check migration file for field names

**Status:** ❓ Need to audit

---

### Office
**Industry Profile Function:** `calculateOfficeProfile(inputs: OfficeInputs)`

**Database Fields (need to check):**
- ❓ Check migration file for field names

**Status:** ❓ Need to audit

---

### University/College
**Industry Profile Function:** `calculateUniversityProfile(inputs: UniversityInputs)`

**Database Fields (need to check):**
- ❓ Check migration file for field names

**Status:** ❓ Need to audit

---

### Agriculture
**Industry Profile Function:** `calculateAgricultureProfile(inputs: AgricultureInputs)`

**Database Fields (need to check):**
- ❓ Check migration file for field names

**Status:** ❓ Need to audit

---

### Warehouse
**Industry Profile Function:** `calculateWarehouseProfile(inputs: WarehouseInputs)`

**Database Fields (need to check):**
- ❓ Check migration file for field names

**Status:** ❓ Need to audit

---

## 📋 Action Items

1. **For each of the 7 industries:**
   - [ ] Read industry profile Inputs interface
   - [ ] Check database migration file for field names
   - [ ] Compare field names (identify mismatches)
   - [ ] Document mismatches

2. **Determine solution:**
   - Option A: Add TrueQuote Engine configs for all 7
   - Option B: Fix Step5MagicFit to call industry profile functions
   - Option C: Fix field name mismatches in industry profile functions

---

**Next:** Start auditing manufacturing industry profile function to see what fields it expects.
