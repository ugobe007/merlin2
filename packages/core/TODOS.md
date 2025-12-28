# @merlin/core - TODOs

## Dependencies to Add Later

1. **useCaseService** - Used for fetching pricing configs from database
   - Can be replaced with `calculationConstantsService` for simple key-value configs
   - Or extract to core package if needed

2. **vendorPricingIntegrationService** - Vendor product pricing
   - Should be added when vendor portal is fully integrated
   - Currently stubbed out in `unifiedPricingService.ts`

3. **alertNotificationService** - Email/SMS alerts
   - Used in `calculationValidator.ts` for validation alerts
   - Can be optional dependency

4. **marketIntelligence service** - Market data analysis
   - Currently using `unifiedPricingService` which includes market data integration
   - Can add dedicated service later if needed

5. **EV Charging Functions** - `calculateEVChargingPowerSimple`, `calculateEVHubPower`, etc.
   - These functions exist in main codebase but not yet extracted
   - Stubbed in `QuoteEngine.ts` with TODO comments

## Build Issues Fixed

- ✅ Fixed `import.meta.env` → `process.env.NODE_ENV`
- ✅ Fixed import paths within packages/core
- ✅ Stubbed out optional dependencies
- ✅ Fixed equipment types imports

## Next Steps

1. Build the package successfully
2. Test calculations still work
3. Update main codebase to use `@merlin/core`
4. Extract remaining dependencies as needed



