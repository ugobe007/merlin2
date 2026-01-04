# Step 4 Data Flow Fix - Complete

## Problem
Step 4 ValueTicker and TrueQuote Verify showing 0 values because:
1. Step 4 didn't call TrueQuote Engine - only Step 5 did
2. ValueTicker needs `state.calculations` which was null until Step 5 runs
3. TrueQuote Engine wasn't connected to input variables from Step 3

## Solution Implemented

### 1. Created Shared Mapper Utility
**File**: `src/components/wizard/v6/utils/trueQuoteMapper.ts`

- Extracted `mapWizardStateToTrueQuoteInput` function from Step5MagicFit
- Shared between Step 4 and Step 5 for consistency
- Handles all industry type mappings and field name normalization

### 2. Step 4 Now Calls TrueQuote Engine
**File**: `src/components/wizard/v6/steps/Step4Options.tsx`

Added `useEffect` hook that:
- Calls TrueQuote Engine when Step 4 loads (if calculations don't exist)
- Maps WizardState to TrueQuoteInput using shared mapper
- Stores initial calculations in `state.calculations`
- Stores `peakDemandKw` in `useCaseData` for ValueTicker
- Only runs when essential data (industry, zipCode, useCaseData) changes

### 3. Updated Step 5 to Use Shared Mapper
**File**: `src/components/wizard/v6/steps/Step5MagicFit.tsx`

- Removed duplicate `mapWizardStateToTrueQuoteInput` function
- Now imports from shared utility
- Ensures consistent mapping between Step 4 and Step 5

## Data Flow Now

```
Step 3 → stores useCaseData → Step 4 → calls TrueQuote Engine → stores calculations → ValueTicker displays values
                                                                                     → TrueQuote Verify shows values
```

## What Gets Stored

When Step 4 calls TrueQuote Engine, it stores:

1. **state.calculations** (SystemCalculations):
   - `bessKW` - BESS power from TrueQuote Engine
   - `bessKWh` - BESS energy from TrueQuote Engine
   - `peakDemandKW` - Peak demand (via useCaseData)
   - `utilityRate` - Utility rate from utilityRateService
   - `demandCharge` - Demand charge from utilityRateService
   - Basic structure (pricing calculated in Step 5)

2. **state.useCaseData.peakDemandKw**:
   - Stored for ValueTicker to calculate peak demand charges
   - ValueTicker reads: `state.useCaseData?.peakDemandKw`

## Testing Checklist

- [ ] Step 4 loads and calls TrueQuote Engine
- [ ] ValueTicker shows non-zero values (BESS, annual value, etc.)
- [ ] TrueQuote Verify page shows non-zero values (peak demand, BESS, storage)
- [ ] Calculations persist when navigating between steps
- [ ] Step 5 still works correctly (refines calculations with pricing)
- [ ] All industries work (hotel, data center, car wash, etc.)

## Files Changed

1. `src/components/wizard/v6/utils/trueQuoteMapper.ts` (NEW)
2. `src/components/wizard/v6/steps/Step4Options.tsx` (UPDATED)
3. `src/components/wizard/v6/steps/Step5MagicFit.tsx` (UPDATED - uses shared mapper)

## Next Steps

1. Test in browser - verify Step 4 shows values
2. Verify TrueQuote Verify page shows correct values
3. Verify calculations persist across steps
4. Test with multiple industries
