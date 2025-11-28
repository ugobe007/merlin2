# 🔧 Calculation Centralization - Summary

## What We Fixed

You identified a **critical architecture issue**: calculations were scattered across 15+ files with different hardcoded values, causing inconsistent ROI and payback numbers across the app.

## Solution Implemented

### 1. Created Centralized Calculation Service ✅
**File**: `src/services/centralizedCalculations.ts`

This is now the **single source of truth** for ALL financial calculations.

### 2. Database-Backed Constants ✅
**File**: `docs/06_ADD_CALCULATION_CONSTANTS.sql`

All calculation constants now stored in `calculation_formulas` table:
- Peak shaving multiplier (365 cycles/year)
- Demand charge reduction ($15K/MW-month)
- Grid service revenue ($30K/MW-year)
- Solar capacity factor (1500 MWh/MW-year)
- Wind capacity factor (2500 MWh/MW-year)
- Federal tax credit (30%)
- Round-trip efficiency (85%)
- Degradation rate (2%/year)
- O&M costs (2.5%/year)

### 3. Created Migration Plan ✅
**File**: `CALCULATION_CENTRALIZATION_PLAN.md`

Complete roadmap for replacing hardcoded calculations in all files.

## Files Currently Affected (Need Migration)

1. ✅ **centralizedCalculations.ts** - CREATED (new service)
2. ⏳ **SmartWizardV2.tsx** - Import added, needs full migration
3. ⏳ **QuoteCompletePage.tsx** - Partially fixed (added electricityRate)
4. ⏳ **InteractiveConfigDashboard.tsx** - Needs migration
5. ⏳ **calculationUtils.ts** - Needs migration
6. ⏳ **energyCalculations.ts** - Needs migration
7. ⏳ **Step4_Summary.tsx** - Needs migration
8. ⏳ **AdvancedAnalytics.tsx** - Needs migration
9. ⏳ **FinancingCalculator.tsx** - Needs migration
10. ⏳ **useCaseService.ts** - Needs migration
11. ⏳ **quoteExport.ts** - Needs migration
12. ⏳ **industryStandardFormulas.ts** - Needs migration
13. ⏳ **advancedFinancialModeling.ts** - Needs migration
14. ⏳ **marketIntelligence.ts** - Needs migration
15. ⏳ **pricingIntelligence.ts** - Needs migration

## Next Steps

### Immediate (Do Now)
1. **Run SQL Script**:
   ```bash
   # Copy SQL to clipboard
   pbcopy < /Users/robertchristopher/merlin2/docs/06_ADD_CALCULATION_CONSTANTS.sql
   ```
   Then paste into Supabase SQL Editor and execute

2. **Test Centralized Service**:
   ```typescript
   import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
   
   const results = await calculateFinancialMetrics({
     storageSizeMW: 2,
     durationHours: 4,
     solarMW: 1,
     location: 'California',
     electricityRate: 0.15
   });
   
   console.log(results); // Should show database-backed calculations
   ```

### Phase 2 (This Week)
- Update SmartWizardV2 to use centralized service
- Update QuoteCompletePage to remove duplicate calculateROI
- Verify numbers are consistent across app

### Phase 3 (Next Week)
- Migrate remaining 12 files
- Build admin interface for formula management
- Add audit logging

## Benefits

### Before (Current State)
```typescript
// SmartWizardV2.tsx
const demandChargeSavings = storageSizeMW * 12 * 15000; // ❌ Hardcoded

// InteractiveConfigDashboard.tsx  
const demandChargeReduction = storageSizeMW * 1000 * 180 * 12; // ❌ Different value!

// calculationUtils.ts
const demandChargeSavings = powerMW * 1000 * utilityRates.demandChargeKW * 12; // ❌ Different formula!
```

### After (Target State)
```typescript
// Everywhere in the app
const results = await calculateFinancialMetrics(config); // ✅ One source of truth
```

## Impact

- **Consistency**: Same calculation = same results everywhere
- **Maintainability**: Update database value → entire app updates
- **Auditability**: Track which formula version was used
- **Admin Control**: Non-developers can adjust constants
- **Performance**: 5-minute cache prevents DB hammering

## Files Created Today

1. `/src/services/centralizedCalculations.ts` - Core service
2. `/docs/06_ADD_CALCULATION_CONSTANTS.sql` - Database population script
3. `/CALCULATION_CENTRALIZATION_PLAN.md` - Migration roadmap
4. `/CALCULATION_FIX_SUMMARY.md` - This file

## Current Status

🟡 **Phase 1 Complete** - Service created, SQL ready
⏳ **Phase 2 Pending** - Run SQL script, test service
⏳ **Phase 3 Pending** - Migrate SmartWizardV2
⏳ **Phase 4 Pending** - Migrate remaining files

---

**Ready to proceed with SQL script execution?**
