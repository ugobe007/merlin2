# Industry Profiles vs TrueQuote Engine - Audit

**Date:** January 2, 2026  
**Status:** 🔍 **IN PROGRESS** - Need to determine if other industries need TrueQuote Engine configs

---

## 📊 Industry Profile Files (12 Total)

All these files exist in `src/services/`:

1. ✅ `hotelIndustryProfile.ts` - Has TrueQuote Engine config
2. ✅ `carWashIndustryProfile.ts` - Has TrueQuote Engine config
3. ✅ `evChargingHubIndustryProfile.ts` - Has TrueQuote Engine config
4. ✅ `dataCenterIndustryProfile.ts` - Has TrueQuote Engine config (FIXED)
5. ✅ `hospitalIndustryProfile.ts` - Has TrueQuote Engine config
6. ❓ `manufacturingIndustryProfile.ts` - **NO TrueQuote Engine config**
7. ❓ `retailIndustryProfile.ts` - **NO TrueQuote Engine config**
8. ❓ `restaurantIndustryProfile.ts` - **NO TrueQuote Engine config**
9. ❓ `officeIndustryProfile.ts` - **NO TrueQuote Engine config**
10. ❓ `universityIndustryProfile.ts` - **NO TrueQuote Engine config**
11. ❓ `agricultureIndustryProfile.ts` - **NO TrueQuote Engine config**
12. ❓ `warehouseIndustryProfile.ts` - **NO TrueQuote Engine config**

---

## 🔍 Question: What Calculation Path Do They Use?

### Option A: They use legacy calculations (baselineService, useCasePowerCalculations)
- These would NOT be affected by TrueQuote Engine field name bugs
- They might have their own field name mismatches with database
- Need to audit their field name mappings separately

### Option B: They should use TrueQuote Engine but configs are missing
- These industries ARE affected by the bug (because TrueQuote Engine falls back)
- Need to add TrueQuote Engine configs for them
- Need to check field name mappings for each

### Option C: They use industry profile calculate functions (calculateManufacturingProfile, etc.)
- Need to check if these functions are called from Step5MagicFit
- Need to check if they have field name mismatches with database
- May need to integrate them with TrueQuote Engine OR fix their field mappings

---

## 🛠️ Next Steps

1. **Check Step5MagicFit.tsx** - What happens when industry doesn't have TrueQuote Engine config?
2. **Check fallback logic** - Does it use `calculateDatabaseBaseline` or `calculateBasePowerKW`?
3. **Check industry profile functions** - Are `calculateManufacturingProfile`, etc. called anywhere?
4. **Audit field names** - For each industry profile, check if field names match database

---

## 📋 Action Items

- [ ] Check Step5MagicFit.tsx fallback logic (lines 381-428)
- [ ] Check if calculateManufacturingProfile, calculateRetailProfile, etc. are called
- [ ] Check database field names for manufacturing, retail, restaurant, office, university, agriculture, warehouse
- [ ] Determine if these need TrueQuote Engine configs OR separate field name fixes
