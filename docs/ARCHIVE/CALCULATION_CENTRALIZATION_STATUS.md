# Calculation Centralization - Current Status

## ✅ COMPLETED
1. **Database Setup**
   - Created `calculation_formulas` table in Supabase
   - Inserted 10 calculation constants with proper structure
   - Confirmed database contains all constants (365 cycles, $15K demand charge, etc.)

2. **Centralized Service Created**
   - File: `/src/services/centralizedCalculations.ts`
   - Function: `calculateFinancialMetrics()` - master calculation
   - Function: `getCalculationConstants()` - fetches from database
   - Function: `getCachedConstants()` - 5-minute cache
   - Constants loading successfully from database

3. **SmartWizardV2 Migration**
   - Line 793-820: `calculateCosts()` now uses centralized service
   - Line 620: Logs "💰 Financial calculations from centralized service (data source: database)"
   - State updated with `setCosts()` to save values

4. **QuoteCompletePage Migration** 
   - Import added for `calculateFinancialMetrics`
   - `calculateROI()` function converted to async, uses centralized service
   - Added `dashboardMetrics` state for recalculated values
   - useEffect to recalculate on mount

5. **🎉 quoteCalculations.ts Migration (MAJOR FIX)**
   - Removed hardcoded `UTILITY_RATES` object
   - Now imports `getCalculationConstants()` from centralized service
   - Uses database constants for all calculations:
     * `peak_shaving_multiplier` (365 cycles/year)
     * `demand_charge_monthly_per_mw` ($15K/MW-month)
     * `grid_service_revenue_per_mw` ($30K/MW-year)
     * `solar_capacity_factor` & `wind_capacity_factor`
   - Added logging to show data source
   - **This was the "island" causing EV charger calculation bugs!**

6. **🎉 InteractiveConfigDashboard.tsx Migration (THE ACTUAL DASHBOARD - CRITICAL FIX)**
   - **This is Step 3 - the component user sees with ROI: 0% and Payback: 2000yr**
   - Removed ALL hardcoded calculations:
     * Old: `energyArbitrage = totalEnergyMWh * 300 * 200` (hardcoded)
     * Old: `demandChargeReduction = storageSizeMW * 1000 * 180 * 12` (hardcoded)
     * Old: `batteryCostPerMWh = 300000` (hardcoded)
   - Now uses `calculateFinancialMetrics()` from centralized service
   - Made useEffect async to call database-backed calculations
   - Added comprehensive logging to show data source
   - **This was the MAIN "island" causing the dashboard bugs!**

## ❌ CRITICAL BUGS

### Bug 1: Dashboard Not Recalculating
**Problem**: QuoteCompletePage useEffect not running
**Evidence**: No console log "🔄 Recalculating dashboard metrics..."
**Impact**: Dashboard shows old/wrong values (ROI: 0%, Payback: 2000 years)
**Root Cause**: Component may not be mounting or useEffect dependencies wrong

### Bug 2: Wizard Resets to Step 0
**Problem**: After a few clicks, wizard goes back to welcome screen
**Evidence**: Console shows "🔝 Scrolled to top for step: -1" then "step: 0"
**Impact**: User loses all progress
**Root Cause**: Hot reload or state reset logic triggering unexpectedly

### Bug 3: Scroll Not Working
**Problem**: Pages don't scroll to top on step change
**Evidence**: Log shows "🔝 Scrolled to top" but user sees no scroll
**Impact**: Users can't see content at top of each step
**Root Cause**: Modal container not being scrolled, only window

### Bug 4: EV Charger Returns Broken Values
**Problem**: ROI shows null, Payback shows 2000 years for EV chargers
**Evidence**: Works for Hotel use case, breaks for EV chargers
**Impact**: Specific use cases produce invalid results
**Root Cause**: annualSavings calculation may be near-zero for EV chargers

## 🔍 INVESTIGATION NEEDED

### What We Need to See:
1. Expand "Savings breakdown: Object" in console - need actual numbers:
   ```
   - peakShavingSavings
   - demandChargeSavings  
   - gridServiceRevenue
   - solarSavings
   - windSavings
   - annualSavings
   - netCost
   ```

2. Check if QuoteCompletePage is mounting:
   - Look for log: "🎯 QuoteCompletePage rendered with data:"
   - If missing, component not rendering

3. Test both use cases:
   - Hotel: Works correctly
   - EV Chargers: Broken calculations

## 📋 REMAINING WORK

### Immediate Fixes Required:
1. Fix QuoteCompletePage useEffect to actually run
2. Stop wizard from resetting to step 0
3. Fix scroll to work in modal container
4. Debug why EV charger calculations fail
5. Ensure dashboard always shows recalculated values

### Files Still Using Hardcoded Constants (Not Yet Migrated):
1. InteractiveConfigDashboard.tsx
2. calculationUtils.ts
3. energyCalculations.ts
4. Step4_Summary.tsx
5. AdvancedAnalytics.tsx
6. FinancingCalculator.tsx
7. useCaseService.ts
8. quoteExport.ts
9. industryStandardFormulas.ts
10. advancedFinancialModeling.ts
11. marketIntelligence.ts
12. pricingIntelligence.ts
13. wordExportService.ts

## 🎯 SOLUTION STRATEGY

### Phase 1: Fix Critical Bugs (TODAY)
- [ ] Get Savings breakdown actual numbers
- [ ] Fix dashboard recalculation useEffect
- [ ] Stop wizard reset bug
- [ ] Fix scroll in modal
- [ ] Debug EV charger calculation

### Phase 2: Complete Migration (THIS WEEK)
- [ ] Migrate remaining 13 files to use centralized service
- [ ] Remove all hardcoded constants
- [ ] Add tests to verify consistency

### Phase 3: Validation (BEFORE LAUNCH)
- [ ] Test all 15+ use cases with centralized calculations
- [ ] Verify ROI/payback match across wizard/dashboard/exports
- [ ] Performance test with 100 concurrent users
- [ ] Admin interface to manage constants

## 💡 ARCHITECTURAL LESSON

**The Problem**: We had calculations scattered across 15+ files with different hardcoded values. This created "islands" that don't align.

**The Solution**: Single source of truth - all calculations must use `calculateFinancialMetrics()` which reads from database.

**The Challenge**: Migration is complex. Can't do all 15 files at once. Must fix bugs as they appear during migration.

**Current Status**: 2 of 15 files migrated. Critical bugs blocking further migration.

---

**Last Updated**: November 11, 2025
**Next Action**: Expand "Savings breakdown" object in console to see actual numbers
