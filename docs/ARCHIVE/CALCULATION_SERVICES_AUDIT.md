# Calculation Services Audit
**Date:** November 11, 2025  
**Purpose:** Identify redundancy and consolidation opportunities

## Current State: 4 Calculation Services (2,512 lines)

### 1. `centralizedCalculations.ts` (374 lines) ✅ **KEEP**
**Purpose:** Database-driven financial calculations (NEW, correct approach)
**Used by:** 
- SmartWizardV2 (main wizard)
- QuoteCompletePage (after removing equipmentCost overrides - FIXED!)
- InteractiveConfigDashboard

**Functions:**
- `calculateFinancialMetrics()` - Main entry point
- `getCalculationConstants()` - Fetches formulas from database
- Calculates: payback, ROI, savings, tax credits, net cost

**Status:** ✅ **This is our single source of truth - KEEP AS PRIMARY**

---

### 2. `databaseCalculations.ts` (351 lines) ❓ **EVALUATE**
**Purpose:** "Database-backed calculations" (similar to centralizedCalculations?)
**Used by:**
- advancedFinancialModeling.ts
- equipmentCalculations.ts (in utils/)

**Functions:**
- `calculateBESSPricingDB()` - Battery pricing from database
- `calculateSystemCostDB()` - System cost calculation
- `calculateGeneratorPricingDB()` - Generator pricing
- `calculateSolarPricingDB()` - Solar pricing
- `calculateWindPricingDB()` - Wind pricing

**Overlap with centralizedCalculations?** YES - both fetch from database

**Question:** Is this a legacy parallel system or does centralizedCalculations use this internally?

**Action Required:** Compare functions to see if this can be merged into centralizedCalculations

---

### 3. `advancedFinancialModeling.ts` (1,689 lines) ⚠️ **LARGE - AUDIT**
**Purpose:** "Advanced financial modeling" (what makes it advanced?)
**Used by:**
- quoteCalculations.ts (legacy BessQuoteBuilder path)

**Functions:**
- Imports from databaseCalculations.ts
- Re-exports calculateSystemCost, calculateBESSPricing
- Adds financial modeling layer on top?

**Size:** 1,689 lines - largest service file!

**Question:** What "advanced" features does this provide that centralizedCalculations doesn't?

**Action Required:** 
1. Review if BessQuoteBuilder needs features not in centralizedCalculations
2. If yes, migrate those features to centralizedCalculations
3. If no, update BessQuoteBuilder to use centralizedCalculations

---

### 4. `quoteCalculations.ts` (208 lines) ❓ **LEGACY PATH**
**Purpose:** Quote calculations for BessQuoteBuilder
**Used by:**
- BessQuoteBuilder.tsx (main legacy component)

**Functions:**
- `calculateBessQuote()` - Wraps advancedFinancialModeling
- `getCurrencySymbol()` - Utility function
- Imports from advancedFinancialModeling

**Status:** This is the entry point for BessQuoteBuilder's calculation path

**Chain:** BessQuoteBuilder → quoteCalculations → advancedFinancialModeling → databaseCalculations

**vs SmartWizardV2 chain:** SmartWizardV2 → centralizedCalculations (direct!)

---

## Architecture Problem: Two Parallel Calculation Systems

### System 1: Legacy (BessQuoteBuilder)
```
BessQuoteBuilder
    ↓
quoteCalculations.ts (208 lines)
    ↓
advancedFinancialModeling.ts (1,689 lines)
    ↓
databaseCalculations.ts (351 lines)
    ↓
Database
```
**Total:** 2,248 lines through 3 service layers

### System 2: Modern (SmartWizardV2)
```
SmartWizardV2
    ↓
centralizedCalculations.ts (374 lines)
    ↓
Database
```
**Total:** 374 lines, direct path

---

## Recommendation: Consolidate to Single System

### Phase 2A: Audit Deep Dive (1-2 hours)
1. **Read advancedFinancialModeling.ts** - What unique features does it have?
2. **Compare functions:**
   - Does advancedFinancialModeling do anything centralizedCalculations can't?
   - Are there business-critical calculations only in the legacy path?
3. **Check BessQuoteBuilder usage:**
   - Is BessQuoteBuilder still actively used?
   - Can it be deprecated in favor of SmartWizardV2?

### Phase 2B: Migration Plan (if features are unique)
If advancedFinancialModeling has features centralizedCalculations lacks:

1. **Extract unique features** from advancedFinancialModeling
2. **Merge into centralizedCalculations**
3. **Update BessQuoteBuilder** to use centralizedCalculations
4. **Delete:**
   - quoteCalculations.ts
   - advancedFinancialModeling.ts
   - databaseCalculations.ts (if redundant)

**Estimated savings:** ~1,900 lines of code, 3 service files deleted

### Phase 2C: Simplification Plan (if BessQuoteBuilder is legacy)
If BessQuoteBuilder can be deprecated:

1. **Confirm SmartWizardV2 has all needed features**
2. **Remove BessQuoteBuilder** from App.tsx
3. **Delete entire legacy chain:**
   - quoteCalculations.ts
   - advancedFinancialModeling.ts  
   - databaseCalculations.ts

**Estimated savings:** ~2,200 lines of code, 4 files deleted (including BessQuoteBuilder)

---

## Other Calculation-Related Files

### Utilities
- **`equipmentCalculations.ts`** (in utils/) - Used by SmartWizardV2 for equipment breakdown
  - **Status:** Still needed for display, but no longer passed to financial calculations (FIXED!)
  - **Consider:** Could be merged into centralizedCalculations for consistency

### Specialized Pricing Services
All in `/src/services/`:
- `generatorPricingService.ts`
- `solarPricingService.ts`
- `windPricingService.ts`
- `powerElectronicsPricingService.ts`
- `systemControlsPricingService.ts`
- `pricingConfigService.ts`
- `pricingIntelligence.ts`

**Question:** Are these used by databaseCalculations or directly?

**Action:** Audit imports to see if these can be consolidated

---

## Success Metrics for Complete Cleanup

### Before:
- ❌ 2,512 lines across 4 calculation services
- ❌ Two parallel calculation systems
- ❌ Inconsistent results (42.9 years vs 2.9 years bug)
- ❌ Confusion about which service to use

### After:
- ✅ <500 lines in single calculation service
- ✅ One calculation path for entire app
- ✅ Consistent results everywhere
- ✅ Clear: "Use centralizedCalculations for all financial calculations"

---

## Next Steps

### Immediate (This Session):
- [x] Delete backup folders (DONE - Phase 1)
- [x] Delete ARCHIVE folder (DONE - Phase 1)
- [x] Delete old SmartWizard.tsx (DONE - Phase 1)
- [ ] Read advancedFinancialModeling.ts to understand unique features
- [ ] Decision: Migrate or Deprecate BessQuoteBuilder?

### This Week:
- [ ] Migrate unique features to centralizedCalculations (if needed)
- [ ] Update BessQuoteBuilder to use centralizedCalculations
- [ ] Delete legacy calculation chain
- [ ] Test all calculation paths produce identical results

### This Month:
- [ ] Audit specialized pricing services
- [ ] Consolidate into centralizedCalculations if possible
- [ ] Achieve single source of truth for ALL calculations
- [ ] Document calculation formulas and business logic

---

## Questions to Answer

1. **Is BessQuoteBuilder still used in production?**
   - If no → delete entire component + legacy calculation chain
   - If yes → migrate to use centralizedCalculations

2. **What makes advancedFinancialModeling "advanced"?**
   - Are there calculations not in centralizedCalculations?
   - Can they be migrated?

3. **Why do we have databaseCalculations AND centralizedCalculations?**
   - Were they created by different developers?
   - Can they be merged?

4. **Can equipmentCalculations be merged into centralizedCalculations?**
   - Would reduce confusion about where calculations live
   - Single file for all calculation logic

---

## Estimated Impact

**Lines of Code Saved:**
- Phase 1 (DONE): ~5,400 lines (backup files)
- Phase 2 (Calculation consolidation): ~2,000 lines
- **Total cleanup potential: ~7,400 lines** 

**Maintenance Burden Reduced:**
- 4 calculation services → 1
- 18 legacy component files → 0 (deleted)
- Clear architecture: "Use centralizedCalculations"

**Bug Prevention:**
- Single calculation path = impossible to have inconsistent results
- Database-driven = easy to update formulas without code changes
- Clear ownership = know where to fix issues
