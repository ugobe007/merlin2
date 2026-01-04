# TrueQuote Engine Industry Coverage

**Date:** January 2, 2026

## ✅ Industries Supported by TrueQuote Engine

Based on `src/services/TrueQuoteEngine.ts` `INDUSTRY_CONFIGS`:

1. ✅ **data-center** / **data_center** - `DATA_CENTER_CONFIG`
2. ✅ **hospital** - `HOSPITAL_CONFIG`
3. ✅ **hotel** - `HOTEL_CONFIG`
4. ✅ **ev-charging** / **ev_charging** - `EV_CHARGING_CONFIG`
5. ✅ **car-wash** / **car_wash** - `CAR_WASH_CONFIG`

## ❌ Industries NOT Supported (Using Legacy Calculations)

These industries do NOT have TrueQuote Engine configurations, so they use the old calculation methods:

1. ❌ **manufacturing** - No `MANUFACTURING_CONFIG`
2. ❌ **retail** - No `RETAIL_CONFIG`
3. ❌ **restaurant** - No `RESTAURANT_CONFIG`
4. ❌ **office** - No `OFFICE_CONFIG`
5. ❌ **university** / **college** - No `UNIVERSITY_CONFIG`
6. ❌ **agriculture** - No `AGRICULTURE_CONFIG`
7. ❌ **warehouse** - No `WAREHOUSE_CONFIG`

**Impact:** These industries are NOT affected by the field name mismatch bug because they don't use TrueQuote Engine yet. They continue to use legacy calculation services (`baselineService.ts`, `useCasePowerCalculations.ts`, etc.).

## 🔍 Field Name Mismatch Impact

**Only affects industries that use TrueQuote Engine:**
- ✅ **Data Center** - 🔴 **CRITICAL BUG** (2 mismatches found)
- ✅ **Hospital** - ✅ Working (verified)
- ✅ **Hotel** - ✅ Working (verified)
- ✅ **EV Charging** - ❓ Need to verify
- ✅ **Car Wash** - ✅ Working (verified)

## 📋 Next Steps

1. **Fix Data Center** - Implement field name fixes
2. **Verify EV Charging** - Check if field names match
3. **Future:** Add TrueQuote Engine support for other industries (manufacturing, retail, etc.)
