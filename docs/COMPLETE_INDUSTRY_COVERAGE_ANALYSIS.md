# Complete Industry Coverage Analysis

**Date:** January 2, 2026  
**Status:** 🔍 **ANALYSIS IN PROGRESS**

---

## 🔍 The Real Situation

### Industry Profile Files Exist (12 Total)
All these files exist and have calculation functions:
1. ✅ `hotelIndustryProfile.ts` - Has `calculateHotelProfile()`
2. ✅ `carWashIndustryProfile.ts` - Has `calculateCarWashProfile()`
3. ✅ `evChargingHubIndustryProfile.ts` - Has `calculateEVHubProfile()`
4. ✅ `dataCenterIndustryProfile.ts` - Has `calculateDataCenterProfile()`
5. ✅ `hospitalIndustryProfile.ts` - Has `calculateHospitalProfile()`
6. ✅ `manufacturingIndustryProfile.ts` - Has `calculateManufacturingProfile()`
7. ✅ `retailIndustryProfile.ts` - Has `calculateRetailProfile()`
8. ✅ `restaurantIndustryProfile.ts` - Has `calculateRestaurantProfile()`
9. ✅ `officeIndustryProfile.ts` - Has `calculateOfficeProfile()`
10. ✅ `universityIndustryProfile.ts` - Has `calculateUniversityProfile()`
11. ✅ `agricultureIndustryProfile.ts` - Has `calculateAgricultureProfile()`
12. ✅ `warehouseIndustryProfile.ts` - Has `calculateWarehouseProfile()`

---

## ❌ TrueQuote Engine Only Has Configs for 5 Industries

**TrueQuote Engine (`INDUSTRY_CONFIGS`):**
- ✅ data-center
- ✅ hospital
- ✅ hotel
- ✅ ev-charging
- ✅ car-wash

**Missing from TrueQuote Engine:**
- ❌ manufacturing
- ❌ retail
- ❌ restaurant
- ❌ office
- ❌ university/college
- ❌ agriculture
- ❌ warehouse

---

## 🔄 What Happens in Step5MagicFit?

**Current Flow (Step5MagicFit.tsx):**

1. **Try TrueQuote Engine** (line 398-400)
   ```typescript
   const trueQuoteInput = mapWizardStateToTrueQuoteInput(state);
   trueQuoteResult = calculateTrueQuote(trueQuoteInput);
   ```

2. **If TrueQuote Engine throws error** (line 422-429)
   - Falls back to `calculateBasePowerKW(state)` (line 431)
   - Uses `INDUSTRY_POWER_PROFILES` (only has 5 industries + default)
   - For other industries, uses generic square footage calculation

3. **Industry Profile Functions NOT Called**
   - `calculateManufacturingProfile()` - NOT called
   - `calculateRetailProfile()` - NOT called
   - `calculateRestaurantProfile()` - NOT called
   - etc.

---

## 🚨 The Problem

For the 7 missing industries (manufacturing, retail, restaurant, office, university, agriculture, warehouse):

1. TrueQuote Engine doesn't have a config → **Throws error or returns 0**
2. Falls back to `calculateBasePowerKW()` → **Uses generic square footage calculation**
3. Industry profile functions exist but **are never called**
4. Result: **Inaccurate calculations** using generic formulas instead of industry-specific logic

---

## 🛠️ Solution Options

### Option A: Add TrueQuote Engine Configs for All Industries (RECOMMENDED)

**Pros:**
- Single calculation path for all industries
- Consistent SSOT approach
- All industries benefit from TrueQuote Engine features (traceability, auditability)

**Cons:**
- Requires creating 7 new TrueQuote Engine configs
- Need to map industry profile data structures to TrueQuote Engine format
- More work upfront

**Implementation:**
1. Create `MANUFACTURING_CONFIG`, `RETAIL_CONFIG`, etc. in `TrueQuoteEngine.ts`
2. Map industry profile subtypes to TrueQuote Engine subtypes
3. Map industry profile field names to TrueQuote Engine field expectations
4. Update `INDUSTRY_CONFIGS` registry

---

### Option B: Call Industry Profile Functions in Fallback

**Pros:**
- Uses existing industry profile functions
- Less code changes needed

**Cons:**
- Dual calculation paths (TrueQuote Engine vs Industry Profiles)
- Inconsistent approach
- Industry profiles might have their own field name mismatches

**Implementation:**
1. Import industry profile functions in Step5MagicFit
2. In catch block, check if industry has profile function
3. Call `calculateManufacturingProfile(useCaseData)`, etc.
4. Extract peak demand / BESS sizing from profile result

---

### Option C: Hybrid - Use Industry Profiles to Generate TrueQuote Engine Inputs

**Pros:**
- Leverages existing industry profile calculations
- Still uses TrueQuote Engine for SSOT pricing/financials
- Can migrate incrementally

**Cons:**
- More complex integration
- Still need field name mappings

---

## 📋 Next Steps

1. **Check TrueQuote Engine error handling** - What happens when industry not found?
2. **Check industry profile function signatures** - What do they return?
3. **Decide on approach** - Option A, B, or C?
4. **Implement field name mappings** - For chosen approach

---

**Question for User:** Should I:
1. Add TrueQuote Engine configs for all 7 missing industries? (Option A)
2. Or make Step5MagicFit call the industry profile functions? (Option B)
