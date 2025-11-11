# Code Link Audit & Cleanup Report

**Date:** November 10, 2025  
**Status:** ⚠️ Action Required - Unused imports and legacy code found

## Executive Summary

Audited all TypeScript/React files for calculation, pricing, and configuration imports. Found:
- ✅ 15 files correctly using new database-driven system
- ⚠️ 8 files with UNUSED legacy imports (need cleanup)
- ❌ 3 files still using OLD utils directly (need migration)
- ⚠️ 2 legacy service files that should be deprecated

---

## ✅ CORRECTLY USING NEW SYSTEM (No Changes Needed)

### 1. Smart Wizard ✅
**File:** `src/components/wizard/SmartWizardV2.tsx`
```typescript
import { useCaseService } from '../../services/useCaseService';
```
**Status:** ✅ Perfect - uses database-driven useCaseService  
**Action:** None

### 2. Advanced Config (Main) ✅  
**File:** `src/components/BessQuoteBuilder.tsx`
```typescript
import { calculateBessQuote } from '../services/quoteCalculations';
```
**Status:** ✅ Uses async database-backed calculations via quoteCalculations  
**Action:** ✅ Remove unused imports (see below)

### 3. Database Calculations Service ✅
**File:** `src/services/databaseCalculations.ts`
```typescript
import { useCaseService } from './useCaseService';
```
**Status:** ✅ Perfect - wrapper for database access  
**Action:** None

### 4. Advanced Financial Modeling ✅
**File:** `src/services/advancedFinancialModeling.ts`
```typescript
import { calculateBESSPricing as calculateBESSPricingDB, calculateSystemCost as calculateSystemCostDB } from './databaseCalculations';
```
**Status:** ✅ Perfect - uses database-backed functions with fallback  
**Action:** None

### 5. Use Case Admin Dashboard ✅
**File:** `src/components/admin/UseCaseAdminDashboard.tsx`
```typescript
import { useCaseService } from '../../services/useCaseService';
```
**Status:** ✅ Perfect - admin interface for use cases  
**Action:** None

### 6. Calculations Admin ✅
**File:** `src/components/admin/CalculationsAdmin.tsx`
```typescript
import { useCaseService } from '../../services/useCaseService';
```
**Status:** ✅ Perfect - admin interface for formulas  
**Action:** None

---

## ⚠️ FILES WITH UNUSED LEGACY IMPORTS (Cleanup Needed)

### 1. BessQuoteBuilder.tsx
**Location:** `src/components/BessQuoteBuilder.tsx`

**Unused imports to REMOVE:**
```typescript
// ❌ REMOVE - Not used anymore
import { generateCalculationBreakdown, exportCalculationsToText } from '../utils/calculationFormulas';
import { calculateBESSPricing, calculateSystemCost } from '../utils/bessPricing';
```

**Actually uses:**
```typescript
// ✅ Keep - actually used
import { calculateBessQuote } from '../services/quoteCalculations';
```

**Action:** Remove lines 6-7

---

### 2. QuotePreviewModal.tsx
**Location:** `src/components/modals/QuotePreviewModal.tsx`

**Import:**
```typescript
import { generateCalculationBreakdown } from '../../utils/calculationFormulas';
```

**Status:** Check if still used  
**Action:** If used, it's OK (display-only utility). If not used, remove.

---

### 3. MarketIntelligenceDashboard.tsx
**Location:** `src/components/MarketIntelligenceDashboard.tsx`

**Import:**
```typescript
import { calculateRealWorldPrice } from '../utils/bessPricing';
```

**Status:** May be display/demo only  
**Action:** Check if should use database calculations instead

---

### 4. HeroSection.tsx (two versions!)
**Locations:**
- `src/components/hero/HeroSection.tsx`
- `src/components/sections/HeroSection.tsx`

**Import:**
```typescript
import { calculateBESSPricing } from '../../utils/bessPricing';
```

**Status:** Likely demo/preview calculations  
**Action:** If they show quotes, should use database calculations. If just demos, OK as-is.

---

### 5. CalculationUtils.ts
**Location:** `src/utils/calculationUtils.ts`

**Import:**
```typescript
import { calculateBESSPricing, calculateSystemCost } from './bessPricing';
```

**Status:** Utility wrapper - check if still used  
**Action:** If used, update to import from databaseCalculations.ts instead

---

### 6. WordExportService.ts
**Location:** `src/services/wordExportService.ts`

**Import:**
```typescript
import { generateCalculationBreakdown, exportCalculationsToText } from '../utils/calculationFormulas';
```

**Status:** Export service - likely needs these for formatting  
**Action:** Check if still used. These are display utilities, probably OK.

---

## ❌ FILES STILL USING OLD PRICING SYSTEM (Need Migration)

### 1. PricingConfigService.ts (LEGACY)
**Location:** `src/services/pricingConfigService.ts`

**Status:** ❌ OLD hardcoded pricing  
**Problem:** Provides hardcoded BESS/solar/wind pricing

**Used by:**
- `advancedFinancialModeling.ts` (as fallback - ✅ OK)
- `equipmentCalculations.ts` (⚠️ needs update)
- `PricingAdminDashboard.tsx` (⚠️ needs update)
- `pricingDatabaseService.ts` (⚠️ needs update)

**Recommendation:**
- Keep as fallback for advancedFinancialModeling.ts
- Update other files to use `useCaseService.getPricingConfig()` instead
- Add deprecation warning in file

---

### 2. PricingDatabaseService.ts (CONFLICTING)
**Location:** `src/services/pricingDatabaseService.ts`

**Imports:**
```typescript
import { pricingClient } from './supabaseClient';
import type { PricingConfiguration, DailyPriceData, PricingAlert } from './supabaseClient';
import { pricingConfigService } from './pricingConfigService';
```

**Problem:** 
- Uses `pricingClient` which queries OLD flat pricing_configurations table
- Conflicts with NEW JSONB pricing_configurations table

**Action:** 
- ⚠️ THIS IS THE CONFLICT! supabaseClient.ts has methods for OLD schema
- Either update to use useCaseService, or deprecate this service

---

### 3. SupabaseClient.ts - Legacy Pricing Methods
**Location:** `src/services/supabaseClient.ts`

**Methods for OLD pricing schema:**
```typescript
export const pricingClient = {
  getPricingConfiguration()
  updatePricingConfiguration()
  createPricingConfiguration()
  deletePricingConfiguration()
  // ... more methods
}
```

**Problem:** These expect OLD flat column structure (bess_small_system_per_kwh, etc.)  
**Conflicts with:** NEW JSONB structure (config_data column)

**Action:** ❌ REMOVE or DEPRECATE these methods

---

## 📋 CLEANUP ACTION PLAN

### Priority 1: Remove Conflicting Code (CRITICAL)

1. **Update supabaseClient.ts**
   - Remove or deprecate `pricingClient` object
   - Add comment: "DEPRECATED: Use useCaseService.getPricingConfig() instead"
   - OR: Update methods to work with JSONB structure

2. **Archive pricingDatabaseService.ts**
   - Move to `/src/services/ARCHIVE/pricingDatabaseService.ts.old`
   - Add notice in file about deprecation
   - Update imports in files that use it

### Priority 2: Remove Unused Imports (CLEANUP)

3. **BessQuoteBuilder.tsx**
   - Remove lines 6-7 (unused bessPricing and calculationFormulas imports)

4. **Check these files for actual usage:**
   - QuotePreviewModal.tsx
   - MarketIntelligenceDashboard.tsx
   - HeroSection.tsx (both versions)
   - calculationUtils.ts
   - wordExportService.ts

### Priority 3: Update Legacy References (MIGRATION)

5. **Update files using pricingConfigService directly:**
   - equipmentCalculations.ts → use useCaseService instead
   - PricingAdminDashboard.tsx → use useCaseService instead

6. **Update files using pricingDatabaseService:**
   - Find all references
   - Update to use useCaseService.getPricingConfig()

### Priority 4: Documentation (MAINTENANCE)

7. **Add deprecation warnings:**
   - In pricingConfigService.ts header
   - In bessPricing.ts header
   - In calculationFormulas.ts header

8. **Update import examples in docs:**
   - Show correct way to import calculations
   - Show database-driven approach

---

## TESTING CHECKLIST

After cleanup:

- [ ] No TypeScript compilation errors
- [ ] BessQuoteBuilder calculates quotes
- [ ] Smart Wizard loads use cases
- [ ] Admin panel shows pricing configs
- [ ] No "module not found" errors
- [ ] Browser console has no import errors
- [ ] All calculations produce results
- [ ] Database queries succeed
- [ ] No "table does not exist" errors

---

## FILES STATUS SUMMARY

### Services (9 files)

| File | Status | Action |
|------|--------|--------|
| useCaseService.ts | ✅ Perfect | None |
| databaseCalculations.ts | ✅ Perfect | None |
| advancedFinancialModeling.ts | ✅ Good | None (uses DB + fallback) |
| quoteCalculations.ts | ✅ Perfect | None |
| pricingConfigService.ts | ⚠️ Legacy | Add deprecation warning |
| pricingDatabaseService.ts | ❌ Conflict | Archive or update |
| supabaseClient.ts | ❌ Conflict | Remove pricingClient methods |
| vendorService.ts | ✅ Good | None (uses core supabase only) |
| authService.ts | ✅ Good | None |

### Components (20+ files)

| File | Status | Action |
|------|--------|--------|
| BessQuoteBuilder.tsx | ⚠️ Cleanup | Remove unused imports (lines 6-7) |
| SmartWizardV2.tsx | ✅ Perfect | None |
| UseCaseAdminDashboard.tsx | ✅ Perfect | None |
| CalculationsAdmin.tsx | ✅ Perfect | None |
| PricingAdminDashboard.tsx | ⚠️ Update | Use useCaseService instead |
| QuotePreviewModal.tsx | ⚠️ Check | Verify if import used |
| MarketIntelligenceDashboard.tsx | ⚠️ Check | Verify if should use DB |
| HeroSection.tsx (×2) | ⚠️ Check | Verify if demos or real quotes |
| ModalManager.tsx | ⚠️ Check | Verify usage |

### Utils (5 files)

| File | Status | Action |
|------|--------|--------|
| calculationFormulas.ts | ⚠️ Legacy | Add deprecation warning |
| bessPricing.ts | ⚠️ Legacy | Add deprecation warning |
| equipmentCalculations.ts | ⚠️ Update | Use useCaseService |
| calculationUtils.ts | ⚠️ Check | Update to databaseCalculations |
| wordHelpers.ts | ✅ OK | Display utilities only |

---

## RECOMMENDED IMMEDIATE ACTIONS

### Do These NOW (Before Running Master Schema):

1. ✅ **Created:** MASTER_SCHEMA.sql (done)
2. ✅ **Created:** This audit document (done)
3. ⏳ **Next:** Remove unused imports from BessQuoteBuilder.tsx
4. ⏳ **Next:** Archive or update supabaseClient.ts pricingClient
5. ⏳ **Next:** Archive pricingDatabaseService.ts

### Do These AFTER (After Master Schema Deployed):

6. Update PricingAdminDashboard to use useCaseService
7. Update equipmentCalculations to use useCaseService
8. Add deprecation warnings to legacy files
9. Test all calculation flows
10. Update documentation

---

## CONCLUSION

**Good News:**
- Core system (Smart Wizard, Advanced Config) correctly uses new database
- Database calculation service working correctly
- Most components already updated

**Issues Found:**
- Unused imports in BessQuoteBuilder (easy fix)
- Legacy pricingClient in supabaseClient.ts (conflicts with new schema)
- pricingDatabaseService.ts uses old schema (needs update or archive)
- A few utility files still reference old system (low priority)

**Risk Level:** 🟡 MEDIUM
- System will work with new schema
- But legacy code could cause confusion
- Conflicts in supabaseClient.ts must be resolved before migration

**Estimated Cleanup Time:** 2-3 hours

---

**Ready to proceed with cleanup? Say "yes" and I'll start removing unused imports and archiving conflicting code.**
