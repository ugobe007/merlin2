# Calculation Files Audit Report
## Date: Session - Comprehensive Cleanup
## Last Updated: November 28, 2025

## Overview

This audit identifies all calculation-related files in the codebase and their roles in the SINGLE SOURCE OF TRUTH architecture.

---

## 🚨 CRITICAL FIX - November 28, 2025

### equipmentCalculations.ts - Small System Pricing Bug
**Bug**: Small systems (<1 MW) were forced to use utility-scale battery units (11.5 MWh @ $6.67M each)
**Symptom**: 0.35 MW hotel quoted $6.67M instead of ~$243K → 19+ year payback
**Root Cause**: Lines 134-146 forced `Math.ceil(totalEnergyMWh / 11.5)` for ALL systems
**Fix Applied**:
```typescript
// For small systems (<1MW), use actual kWh pricing instead of utility-scale units
if (storageSizeMW < 1) {
  const totalEnergyKWh = storageSizeMW * 1000 * durationHours;
  const effectivePricePerKWh = pricingResult.price || pricingResult.priceRange?.low || 155;
  totalBatteryCost = totalEnergyKWh * effectivePricePerKWh;
}
```

### centralizedCalculations.ts - Fallback Pricing Fix  
**Bug**: When `equipmentCost=0`, used hardcoded $350K/MWh fallback
**Fix**: Now imports `getBatteryPricing()` and fetches real NREL pricing

### InteractiveConfigDashboard.tsx - Hardcoded Sample Configs
**Bug**: Sample config generator used `energy * 300000` hardcoded pricing
**Fix**: Now calls `calculateFinancialMetrics()` for each config with real pricing

### unifiedQuoteCalculator.ts - NEW Single Entry Point
**Created**: Orchestrates all calculation services into single `calculateQuote()` function
**Purpose**: Prevent future calculation inconsistencies by providing one entry point

---

## ✅ CLEANUP COMPLETED THIS SESSION

### Changes Made:
1. **SmartWizardV2.tsx** - Removed old `getPowerDensity()` function (lines 168-184)
   - Now uses `POWER_DENSITY_STANDARDS` from `useCasePowerCalculations.ts`
   - All datacenter, casino, logistics, shopping-center calculations use centralized values
   
2. **TypeScript Errors Fixed**:
   - Line 553: Fixed undefined `baseline` reference
   - Line 2085: Fixed `gridStrategy` type on `aiBaseline`
   - Added missing `calculateDatacenterBESS` import from baselineService

3. **Test Suite Created**: `npm run test:calculations` - 26/26 tests pass

---

## 🟢 ACTIVE & CORRECT - Single Sources of Truth

### 1. `/src/services/useCasePowerCalculations.ts` (NEW - CREATED THIS SESSION)
**Purpose**: SINGLE SOURCE OF TRUTH for ALL power/demand calculations
- Contains industry-standard peak demand values (ASHRAE, CBECS, Energy Star)
- Individual calculators: `calculateOfficePower()`, `calculateHotelPower()`, `calculateHospitalPower()`, etc.
- Master function: `calculateUseCasePower(slug, useCaseData)`
- Exports `POWER_DENSITY_STANDARDS` for direct access
- **STATUS**: ✅ ACTIVE - Primary power calculation source

### 2. `/src/services/centralizedCalculations.ts`
**Purpose**: SINGLE SOURCE OF TRUTH for ALL financial calculations
- `calculateFinancialMetrics()` - NPV, IRR, payback, ROI
- Database-driven constants (`getCalculationConstants()`)
- Advanced analysis: sensitivity, risk, scenario analysis
- **STATUS**: ✅ ACTIVE - Primary financial calculation source

### 3. `/src/services/baselineService.ts`
**Purpose**: Database-driven baseline recommendations
- `calculateDatabaseBaseline()` - Fetches use case configs from Supabase
- `calculateDatacenterBESS()` - Datacenter BESS sizing with uptime tiers
- Special handlers for EV charging, datacenter, agriculture
- Grid strategy calculations
- **STATUS**: ✅ ACTIVE - Delegates power calculations appropriately

### 4. `/src/utils/equipmentCalculations.ts`
**Purpose**: Equipment breakdown and pricing
- `calculateEquipmentBreakdown()` - Batteries, inverters, transformers, etc.
- Database-driven pricing from `pricing_configurations`
- **STATUS**: ✅ ACTIVE - Primary equipment/pricing source

---

## 🟡 SUPPORTING FILES - Valid but Specialized

### 5. `/src/services/bessDataService.ts`
**Purpose**: BESS financial modeling and use case profiles
- `getBESSFinancialInputs()` - Database-driven BESS inputs ✅
- `USE_CASE_ENERGY_PROFILES` - Energy profiles by industry ⚠️ (duplicates some useCasePowerCalculations)
- `calculateBESSFinancials()` - ❌ DEPRECATED (use centralizedCalculations)
- **STATUS**: ⚠️ PARTIALLY DEPRECATED - Use getBESSFinancialInputs(), avoid calculateBESSFinancials()

### 6. `/src/utils/energyCalculations.ts`
**Purpose**: Utility rates and energy savings
- `UTILITY_RATES` - Regional utility pricing
- `calculateEnergySavings()` - Battery cycle savings
- `calculateROITimeline()` - Year-by-year ROI
- **STATUS**: ✅ ACTIVE - Supplementary data (doesn't conflict)

### 7. `/src/components/wizard/steps_v3/modules/PowerCalculations.ts`
**Purpose**: Power status display calculations
- `calculatePowerStatus()` - Gap/surplus calculations
- `formatPowerMW()` - Display formatting
- **STATUS**: ✅ ACTIVE - UI helper (doesn't duplicate core calculations)

---

## 🟠 PENDING MIGRATION - Future Work

### ~~8. `/src/services/dataIntegrationService.ts`~~ ✅ COMPLETED
**Purpose**: Unified API for use case queries + calculations
**MIGRATION COMPLETE**:
- ✅ Line 178: Now uses `calculateFinancialMetrics()` from centralizedCalculations
- ✅ Line 434: Now uses `calculateFinancialMetrics()` from centralizedCalculations  
- ✅ Removed dependency on deprecated `calculateBESSFinancials()`
- ✅ Removed 40+ lines of hardcoded financial parameters
- ✅ Build passes, all tests pass

---

## 🟢 RESOLVED - No Longer Problematic

### 9. `/src/hooks/wizard/useSystemCalculations.ts`
**Purpose**: Wizard calculation hook
**PREVIOUS PROBLEMS** (NOW FIXED):
- Line 32-44: `getPowerDensity()` - ✅ NOW DEPRECATED with warning, delegates to centralized
- `calculateScaleFactor()` - ⚠️ Still uses scale approach but secondary to centralized
- `calculateEVChargingConfig()` - ✅ Deprecated, points to useCasePowerCalculations.ts
**STATUS**: ⚠️ DEPRECATED FUNCTIONS - Will be removed in future cleanup

### 10. `/src/hooks/useAdvancedSystemCalculations.ts`
**Purpose**: Advanced quote builder calculations
**CURRENT STATE**:
- `getBESSPricePerKwh()` - Updated with NREL ATB 2024 pricing
- `RENEWABLE_COSTS` - Still hardcoded but documented
**STATUS**: ⚠️ NEEDS DATABASE MIGRATION - Should use pricing_configurations table
**ACTION NEEDED**: Replace hardcoded values with database calls

### 10. `/src/hooks/wizard/useCapacityCalculations.ts`
**Purpose**: Capacity and equipment breakdown
- Calls `calculateEquipmentBreakdown()` from equipmentCalculations.ts ✅
- Helper functions for containers, transformers, BMS, aux systems
**STATUS**: ✅ ACTIVE - Delegates correctly

---

## Summary of Required Actions

### Immediate (This Session):
1. ✅ Created `useCasePowerCalculations.ts` as single source of truth for power
2. ✅ Updated `SmartWizardV2.tsx` to use centralized calculations
3. ⏳ Deprecate `getPowerDensity()` in `useSystemCalculations.ts`
4. ⏳ Deprecate `calculateEVChargingConfig()` in `useSystemCalculations.ts`

### Future Cleanup:
5. Replace hardcoded pricing in `useAdvancedSystemCalculations.ts`
6. Merge `USE_CASE_ENERGY_PROFILES` from bessDataService into useCasePowerCalculations
7. Update baselineService to delegate power calculations to useCasePowerCalculations

---

## Calculation Flow (CORRECT Architecture)

```
User Input
    ↓
SmartWizardV2.tsx
    ↓
calculateUseCasePower() ← useCasePowerCalculations.ts (POWER)
    ↓
calculateDatabaseBaseline() ← baselineService.ts (DATABASE CONFIG)
    ↓
calculateEquipmentBreakdown() ← equipmentCalculations.ts (EQUIPMENT/PRICING)
    ↓
calculateFinancialMetrics() ← centralizedCalculations.ts (FINANCIALS)
    ↓
Quote/Report
```

---

## DO NOT USE (Deprecated):

| Function | Location | Use Instead |
|----------|----------|-------------|
| `calculateBESSFinancials()` | bessDataService.ts | `calculateFinancialMetrics()` |
| `getPowerDensity()` | useSystemCalculations.ts | `calculateUseCasePower()` |
| `calculateEVChargingConfig()` | useSystemCalculations.ts | `calculateEVChargingPower()` |
| Hardcoded `getBESSPricePerKwh()` | useAdvancedSystemCalculations.ts | `equipmentCalculations.ts` |

