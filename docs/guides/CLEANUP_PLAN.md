# Codebase Cleanup Plan
**Date:** November 11, 2025
**Priority:** High - Multiple calculation paths causing bugs

## Problem Analysis
The payback calculation bug (42.9 years vs 2.9 years) revealed that we have:
- Multiple calculation services doing the same thing
- Duplicate wizard components
- Legacy backup files cluttering the repository
- Inconsistent data flows between components

## Files to DELETE Immediately ✂️

### 1. Duplicate Wizard Components
```
❌ src/components/wizard/SmartWizard.tsx (replaced by SmartWizardV2.tsx)
❌ src/components/wizard/backup/ (entire folder)
   - SmartWizard_v1_technical.tsx
   - steps_v1_technical/ (all backup step files)
```

### 2. Duplicate Calculation Services
```
❌ src/services/quoteCalculations.ts (superseded by centralizedCalculations.ts)
❌ src/services/databaseCalculations.ts (duplicate of centralizedCalculations.ts?)
❌ src/services/advancedFinancialModeling.ts (unless actively used)
```

### 3. Archive Folder (Already Archived!)
```
❌ src/services/ARCHIVE/ (entire folder - move to git history)
   - dailySyncService.ts.old
   - pricingDatabaseService.ts.old
```

### 4. Test Files for Deleted Services
```
❌ src/services/__tests__/ (any tests for deleted services)
```

## Files to AUDIT and Consolidate 🔍

### 1. Equipment Calculations
**Current:** `src/utils/equipmentCalculations.ts` was calculating costs wrong
**Action:** Either fix to match `centralizedCalculations.ts` OR delete and let central service handle everything

### 2. Pricing Services (Keep but audit)
```
✅ Keep: baselineService.ts (database-driven sizing)
✅ Keep: centralizedCalculations.ts (single source of truth for financial metrics)
✅ Keep: electricityPricing.ts (location-based rates)
✅ Keep: cacheService.ts (performance optimization)

❓ Audit:
- generatorPricingService.ts
- solarPricingService.ts  
- windPricingService.ts
- powerElectronicsPricingService.ts
- systemControlsPricingService.ts
- pricingConfigService.ts
- pricingIntelligence.ts

Are these all used? Or can they be consolidated into centralizedCalculations.ts?
```

### 3. Wizard Steps
Check `/src/components/wizard/steps/` for:
- Duplicate step files (Step2_Budget vs Step2_SimpleConfiguration?)
- Unused legacy steps

## Benefits of Cleanup

1. **Bug Prevention:** Single calculation path = consistent results
2. **Faster Development:** No confusion about which file to edit
3. **Easier Debugging:** Clear data flow through codebase
4. **Smaller Bundle Size:** Less code shipped to users
5. **Better Onboarding:** New developers can understand the system

## Implementation Steps

### Phase 1: Safe Deletions (No Risk)
1. Delete `backup/` folder (already backed up in git)
2. Delete `ARCHIVE/` folder (already archived)
3. Delete `SmartWizard.tsx` (replaced by V2)

### Phase 2: Audit and Test (Medium Risk)
1. Search codebase for imports of `quoteCalculations.ts`
2. If unused → delete
3. Search for imports of `advancedFinancialModeling.ts`
4. If unused → delete
5. Search for imports of `databaseCalculations.ts`
6. If duplicate → delete

### Phase 3: Consolidation (Requires Testing)
1. Audit all pricing services
2. Consolidate into `centralizedCalculations.ts` if possible
3. Update imports across codebase
4. Test all calculation paths

## Single Source of Truth Architecture

### Ideal State:
```
User Input 
    ↓
baselineService.ts (sizing from database)
    ↓
centralizedCalculations.ts (financial metrics from database)
    ↓
UI Display (all components use same data)
```

### Current State:
```
User Input 
    ↓
baselineService.ts (sizing)
    ↓
equipmentCalculations.ts (wrong costs) ← BUG SOURCE
    ↓                                    ↓
centralizedCalculations.ts ←────────────┘
    ↓
UI Display (inconsistent!)
```

## Next Steps

1. **Immediate:** Review this plan
2. **This Week:** Execute Phase 1 safe deletions
3. **Next Week:** Audit and test Phase 2
4. **Month End:** Complete Phase 3 consolidation

## Success Metrics

- ✅ All calculations produce identical results across all pages
- ✅ Zero duplicate calculation logic
- ✅ < 10 service files in `/src/services/`
- ✅ Single wizard component (no "V2" in name)
- ✅ No backup folders in production code
