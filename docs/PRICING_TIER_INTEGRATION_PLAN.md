# 🔧 PRICING TIER INTEGRATION PLAN

**Date:** December 25, 2025  
**Goal:** Move `pricingTierService` to `packages/core` and integrate into quote engine  
**Estimated Time:** 30-45 minutes

---

## 🎯 OBJECTIVE

Resolve the esbuild import error by moving `pricingTierService.ts` from `src/services/` to `packages/core/src/services/`, then integrating it into `equipmentCalculations.ts`.

---

## 📋 STEP-BY-STEP PLAN

### **Step 1: Verify Core Package Structure**

**Tasks:**
- ✅ Check if `packages/core/src/services/` exists
- ✅ Check how other core services access Supabase
- ✅ Verify Supabase client accessibility from core package

**Expected Outcome:**
- Understand current core package structure
- Determine if we need to create services directory
- Confirm Supabase import path

---

### **Step 2: Move pricingTierService to Core Package**

**Tasks:**
1. Create `packages/core/src/services/` directory (if needed)
2. Copy `src/services/pricingTierService.ts` to `packages/core/src/services/pricingTierService.ts`
3. Update Supabase import path (if needed):
   - From: `from './supabaseClient'` or `from '@/services/supabaseClient'`
   - To: Relative import or check how core package accesses Supabase
4. Verify file compiles in new location

**Files to Move:**
- `src/services/pricingTierService.ts` → `packages/core/src/services/pricingTierService.ts`

**Dependencies to Check:**
- Supabase client import
- Any other imports that might need adjustment

---

### **Step 3: Update Core Package Exports**

**Tasks:**
1. Check if `packages/core/src/calculations/index.ts` or similar export file exists
2. Add export for `pricingTierService` (if using index exports)
3. Or ensure direct import path works

**Files to Update:**
- `packages/core/src/index.ts` (if exists)
- `packages/core/src/services/index.ts` (if exists, or create)

---

### **Step 4: Update equipmentCalculations.ts**

**Tasks:**
1. Remove TODO comments about pricingTierService integration
2. Add import: `import { getPricingTier } from '../services/pricingTierService'`
3. Replace market intelligence fallback with database query:
   ```typescript
   // OLD (fallback):
   const marketAnalysis = calculateMarketAlignedBESSPricing(...);
   const marketPricePerKWh = marketAnalysis.systemCosts.costPerKWh;
   
   // NEW (database-driven):
   const pricingTier = await getPricingTier(
     'bess',
     storageSizeMW * 1000, // Convert to kW
     null,
     'mid'
   );
   const effectivePricePerKWh = pricingTier?.price || fallbackPrice;
   ```
4. Update pricing source tracking to use tier metadata
5. Keep fallback logic for error cases

**File to Update:**
- `packages/core/src/calculations/equipmentCalculations.ts` (lines ~185-206)

**Key Logic Changes:**
- Battery pricing: Use `getPricingTier('bess', sizeKW, null, 'mid')`
- Solar pricing: Use `getPricingTier('solar_pv', sizeKW, null, 'mid')`
- Fallback to market intelligence if database query fails
- Update `pricingTierSource` to reflect database vs fallback

---

### **Step 5: Update Any Other Imports**

**Tasks:**
1. Search codebase for imports of `pricingTierService` from `src/services/`
2. Update all imports to use new path:
   - From: `from '@/services/pricingTierService'`
   - To: `from '@/core/services/pricingTierService'` or appropriate path

**Files to Check:**
- Search: `grep -r "pricingTierService" src/`
- Update any files that import it

---

### **Step 6: Test Build**

**Tasks:**
1. Run `npm run build`
2. Verify no esbuild errors
3. Verify no TypeScript errors
4. Check console for any runtime errors

**Expected Results:**
- ✅ Build succeeds
- ✅ No import errors
- ✅ TypeScript compiles cleanly

---

### **Step 7: Test Quote Generation**

**Tasks:**
1. Generate a test quote using QuoteEngine
2. Verify pricing comes from database tiers
3. Check console logs for pricing source
4. Verify fallback works if database unavailable

**Test Cases:**
- Small system (< 1 MW) - should use commercial tier
- Medium system (3-10 MW) - should use utility 3-10 MW tier
- Large system (50+ MW) - should use utility 50+ MW tier
- Database unavailable - should fallback gracefully

---

## 🔍 DETAILED CHANGES

### **File: packages/core/src/services/pricingTierService.ts**

**Changes:**
- None (just moved location)
- May need to update Supabase import path:
  ```typescript
  // If Supabase client is in src/services:
  import { supabase } from '../../../src/services/supabaseClient';
  
  // OR if core has its own Supabase setup:
  // Check how other core files import Supabase
  ```

---

### **File: packages/core/src/calculations/equipmentCalculations.ts**

**Current Code (lines ~185-206):**
```typescript
// ✅ UPDATED: Use market intelligence pricing (pricingTierService integration pending)
// NOTE: Dynamic imports from packages/core to src/services cause esbuild errors
// TODO: Move pricingTierService to packages/core or use dependency injection pattern
let effectivePricePerKWh: number;
let pricingTierSource = 'market_intelligence_fallback';

const marketAnalysis = calculateMarketAlignedBESSPricing(storageSizeMW, durationHours, location);
const marketPricePerKWh = marketAnalysis.systemCosts.costPerKWh;
// ... fallback logic
```

**New Code:**
```typescript
import { getPricingTier } from '../services/pricingTierService';

// Try database pricing tier first
let effectivePricePerKWh: number;
let pricingTierSource = 'database_pricing_tier';

try {
  const sizeKW = storageSizeMW * 1000;
  const pricingTier = await getPricingTier('bess', sizeKW, null, 'mid');
  
  if (pricingTier && pricingTier.price > 0) {
    effectivePricePerKWh = pricingTier.price;
    pricingTierSource = pricingTier.tier.data_source || 'database_pricing_tier';
    
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ [Pricing Tier] Using database tier: ${pricingTier.price} ${pricingTier.unit} (${pricingTier.tier.config_key})`);
    }
  } else {
    throw new Error('No pricing tier found');
  }
} catch (error) {
  // Fallback to market intelligence
  console.warn('⚠️ [Pricing Tier] Database query failed, using market intelligence fallback:', error);
  const marketAnalysis = calculateMarketAlignedBESSPricing(storageSizeMW, durationHours, location);
  effectivePricePerKWh = marketAnalysis.systemCosts.costPerKWh;
  pricingTierSource = 'market_intelligence_fallback';
}
```

**Similar Changes Needed For:**
- Solar pricing (line ~505)
- Other equipment pricing that should use tiers

---

## 🚨 POTENTIAL ISSUES & SOLUTIONS

### **Issue 1: Supabase Client Not Accessible from Core**

**Solution Options:**
1. **Pass Supabase client as dependency:**
   ```typescript
   export async function getPricingTier(
     category: string,
     sizeKW?: number | null,
     sizeMWh?: number | null,
     priceLevel: PriceLevel = 'mid',
     supabaseClient?: any // Optional, inject if needed
   )
   ```

2. **Create core-specific Supabase setup:**
   - Create `packages/core/src/services/supabaseClient.ts`
   - Re-export from main Supabase client

3. **Use relative import path:**
   ```typescript
   import { supabase } from '../../../src/services/supabaseClient';
   ```

**Preferred:** Option 3 (relative import) - simplest, keeps single Supabase instance

---

### **Issue 2: TypeScript Path Aliases**

**Check:**
- `tsconfig.json` paths configuration
- Ensure `@/core` or similar alias exists
- Or use relative imports within core package

---

### **Issue 3: Circular Dependencies**

**Check:**
- Ensure no circular imports between core and src
- Core should not import from src (except for shared utilities like Supabase)

---

## ✅ SUCCESS CRITERIA

1. ✅ Build succeeds without esbuild errors
2. ✅ TypeScript compiles cleanly
3. ✅ `equipmentCalculations.ts` imports `pricingTierService` successfully
4. ✅ Quote generation uses database pricing tiers
5. ✅ Fallback works if database unavailable
6. ✅ No runtime errors in browser console

---

## 📝 VALIDATION CHECKLIST

After implementation:

- [ ] File moved to `packages/core/src/services/pricingTierService.ts`
- [ ] Supabase import updated (if needed)
- [ ] `equipmentCalculations.ts` imports pricingTierService
- [ ] Battery pricing uses database tiers
- [ ] Solar pricing uses database tiers (if applicable)
- [ ] Fallback logic works
- [ ] Build succeeds
- [ ] Test quote generation works
- [ ] Console shows pricing tier source correctly
- [ ] All other imports updated (if any)

---

## 🎯 NEXT STEPS AFTER COMPLETION

1. **Test thoroughly** - Generate quotes for various system sizes
2. **Monitor logs** - Check pricing source in production
3. **Update documentation** - Mark integration as complete
4. **Proceed with car wash edits** - Now that integration is unblocked

---

**Ready to execute!** 🚀


