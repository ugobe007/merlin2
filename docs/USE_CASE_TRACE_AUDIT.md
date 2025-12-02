# USE CASE CALCULATION TRACE ROUTE AUDIT

**Generated:** November 30, 2025  
**Status:** ✅ ALL MAJOR ISSUES FIXED

## Executive Summary

Traced all 13+ use cases through their calculation paths. **FIXED** 5 files with hardcoded pricing and **CONSOLIDATED** 3 duplicate calculation paths into Single Source of Truth (SSOT) architecture.

---

## ✅ COMPLETED FIXES

### Hardcoded Pricing (5 files fixed)

| File | Issue | Fix Applied |
|------|-------|-------------|
| `HeroSection.tsx` | `* 200000` ($200/kWh) | Now uses `getBatteryPricing()` |
| `AdvancedQuoteBuilder.tsx` | `pricePerKwh = 200/155/140` | Now uses `getBatteryPricing()` + async |
| `BessQuoteBuilder.tsx` | `pricePerKwh = 200/155/140` | Now uses state + `getBatteryPricing()` |
| `AdminDashboard.tsx` | Display text with wrong prices | Updated to show NREL ATB 2024 ranges |
| `Step3_AddOnsSelection.tsx` | `COST_ESTIMATES` hardcoded | Now fetches from `unifiedPricingService` |

### EV Charging Consolidation ✅
- `calculateEVChargingPower()` in `useCasePowerCalculations.ts` now **deprecated**
- Delegates to `evChargingCalculations.ts` → `calculateEVHubPower()` (SSOT)
- All EV charger specs centralized in `EV_CHARGER_SPECS`

### Datacenter Standards ✅
- Created `DATACENTER_TIER_STANDARDS` in `useCasePowerCalculations.ts`
- Tier multipliers: Tier 1 (30%), Tier 2 (40%), Tier 3 (50%), Tier 4 (70%)
- `baselineService.ts` now imports and uses `DATACENTER_TIER_STANDARDS`

### Amenity Power Standards ✅
- Created `AMENITY_POWER_STANDARDS` in `useCasePowerCalculations.ts`
- Reference values: pool (25kW), spa (20kW), fitness (15kW), restaurant (50kW)
- Templates define context-specific overrides (hotel pool: 55kW > apartment pool: 25kW)

---

## ✅ VALID: Using SSOT Correctly

| Use Case | Power Source | Financial Source | Status |
|----------|-------------|------------------|--------|
| Office | `useCasePowerCalculations.ts` | `centralizedCalculations.ts` | ✅ |
| Retail | `useCasePowerCalculations.ts` | `centralizedCalculations.ts` | ✅ |
| Warehouse | `useCasePowerCalculations.ts` | `centralizedCalculations.ts` | ✅ |
| Hospital | `useCasePowerCalculations.ts` | `centralizedCalculations.ts` | ✅ |
| Airport | `useCasePowerCalculations.ts` | `centralizedCalculations.ts` | ✅ |
| Casino | `useCasePowerCalculations.ts` | `centralizedCalculations.ts` | ✅ |
| Shopping Center | `useCasePowerCalculations.ts` | `centralizedCalculations.ts` | ✅ |
| **EV Charging** | `evChargingCalculations.ts` | `centralizedCalculations.ts` | ✅ FIXED |
| **Datacenter** | `DATACENTER_TIER_STANDARDS` | `centralizedCalculations.ts` | ✅ FIXED |
| **Hotel** | `templates + AMENITY_POWER_STANDARDS` | `centralizedCalculations.ts` | ✅ FIXED |

---

## 📊 Lookup Table Audit

### ✅ VALID SSOT Tables
| Table | File | Source |
|-------|------|--------|
| `POWER_DENSITY_STANDARDS` | `useCasePowerCalculations.ts` | ASHRAE, CBECS |
| `DATACENTER_TIER_STANDARDS` | `useCasePowerCalculations.ts` | Uptime Institute |
| `AMENITY_POWER_STANDARDS` | `useCasePowerCalculations.ts` | EPRI, hotel industry |
| `EV_CHARGER_SPECS` | `evChargingCalculations.ts` | SAE J1772, IEC 61851 |
| `ITC_RATES` | `centralizedCalculations.ts` | IRA 2022 |

### ❌ DEPRECATED Tables
| Table | File | Issue |
|-------|------|-------|
| Malaysia RM pricing | `pricingService.ts` | Entire file deprecated |
| `marketData.realTimePricing` | `pricingIntelligence.ts` | May duplicate SSOT |

### Remaining Items
| Table | File | Issue |
|-------|------|-------|
| Farm type multipliers | `useCasePowerCalculations.ts` | Hardcoded, could be configurable |
| Manufacturing multipliers | `baselineService.ts` | Could move to SSOT |

---

## 🔧 REMAINING ITEMS (Low Priority)

### Priority 1: Clean Up Deprecated Files
1. Ensure no imports from `bessDataService.ts`
2. Ensure no imports from `pricingService.ts`
3. Add `@deprecated` JSDoc to all functions

### Priority 2: Optional Improvements
1. Move manufacturing multipliers to lookup table
2. Make farm type multipliers configurable from database

---

## 📁 Complete File List by Status

### ✅ Protected (Do Not Modify)
- `unifiedQuoteCalculator.ts` - Entry point
- `centralizedCalculations.ts` - Financial SSOT
- `equipmentCalculations.ts` - Equipment pricing SSOT
- `unifiedPricingService.ts` - Battery pricing SSOT
- `evChargingCalculations.ts` - EV charging SSOT
- `useCasePowerCalculations.ts` - Power standards SSOT

### ✅ Fixed (Verified Working)
- `baselineService.ts` - Now imports SSOT constants
- `HeroSection.tsx` - Uses async pricing
- `AdvancedQuoteBuilder.tsx` - Uses async pricing
- `BessQuoteBuilder.tsx` - Uses state + async pricing
- `AdminDashboard.tsx` - Shows NREL ATB ranges
- `Step3_AddOnsSelection.tsx` - Fetches from SSOT

### ❌ Deprecated (Remove Usage)
- `bessDataService.ts` - Fully deprecated
- `pricingService.ts` - Fully deprecated

### ✅ Using SSOT Correctly
- `CarWashWizard.tsx` - Uses `quoteResult.equipment.batteries.pricePerKWh`
- `SmartWizardV2.tsx` - Uses `equipmentCalculations.ts` → `unifiedPricingService`

---

## Validation Script

Run this to find more hardcoded values:
```bash
# Find all hardcoded $/kWh values
grep -rn "\$[0-9]*\/kWh\|\* [0-9]*000" src/components/*.tsx src/components/**/*.tsx 2>/dev/null

# Find all direct numeric pricing
grep -rn "pricePerKwh = [0-9]" src/

# Find references to deprecated services
grep -rn "bessDataService\|pricingService" src/ --include="*.ts" --include="*.tsx" | grep -v "\.ts:.*\/\/"
```
