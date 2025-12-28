# Core Extraction Status
**Date**: December 25, 2025

## ✅ Completed

1. **Monorepo Structure**
   - Turborepo configured
   - Workspace structure created
   - Package structure for core, wizard, verticals

2. **Package Structure**
   - `packages/core/` created with proper TypeScript config
   - Module exports configured
   - README documentation created

3. **Services Copied**
   - ✅ unifiedQuoteCalculator.ts
   - ✅ centralizedCalculations.ts
   - ✅ equipmentCalculations.ts
   - ✅ QuoteEngine.ts
   - ✅ calculationValidator.ts
   - ✅ useCasePowerCalculations.ts
   - ✅ calculationConstantsService.ts
   - ✅ unifiedPricingService.ts
   - ✅ marketDataIntegrationService.ts
   - ✅ benchmarkSources.ts
   - ✅ supabaseClient.ts
   - ✅ equipment.types.ts

4. **Import Path Fixes**
   - Fixed relative imports within packages/core
   - Fixed cross-module references
   - Fixed `import.meta.env` → `process.env.NODE_ENV`

## ⚠️ In Progress

### Syntax Errors (from sed replacements)
- Broken try/catch blocks in `equipmentCalculations.ts`
- Broken alert notification code in `calculationValidator.ts`
- Need to manually fix these sections

### Dependencies Stubbed (TODO)
1. **useCaseService** - Used for pricing configs
   - Should use `calculationConstantsService` instead
   - Or extract to core package

2. **vendorPricingIntegrationService** - Vendor pricing
   - Stubbed in `unifiedPricingService.ts`
   - Add when vendor portal integrated

3. **alertNotificationService** - Email/SMS alerts
   - Stubbed in `calculationValidator.ts`
   - Can be optional dependency

4. **marketIntelligence service** - Market analysis
   - Using `unifiedPricingService` instead
   - Can add dedicated service later

5. **EV Charging Functions** - Not yet extracted
   - Stubbed in `QuoteEngine.ts`
   - Need to extract from main codebase

## 🔧 Next Steps

1. **Fix Syntax Errors**
   - Manually fix broken try/catch blocks
   - Fix alert notification code
   - Clean up sed replacement artifacts

2. **Resolve Dependencies**
   - Replace useCaseService calls with calculationConstantsService
   - Or properly stub out all useCaseService dependencies
   - Document what needs to be added later

3. **Build & Test**
   - Build the package successfully
   - Test that calculations still work
   - Verify TrueQuote compliance

4. **Update Main Codebase**
   - Gradually migrate imports to use `@merlin/core`
   - Test at each step
   - Verify no regressions

## 📝 Notes

- Current codebase continues to work (services copied, not moved)
- Migration is incremental - can test at each step
- TODOs documented in `packages/core/TODOS.md`
- TrueQuote compliance maintained throughout



