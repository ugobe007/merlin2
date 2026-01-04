# Step 4 Data Flow Issue

## Problem
Step 4 ValueTicker and TrueQuote Verify showing 0 values because:
1. **Step 4 doesn't call TrueQuote Engine** - only Step 5 does
2. **ValueTicker needs `state.calculations`** which is null until Step 5 runs
3. **TrueQuote Engine needs data from Step 3** but Step 3 doesn't calculate/store peakDemandKw

## Current Data Flow
```
Step 3 → stores useCaseData → Step 4 (no calculations) → Step 5 → calls TrueQuote Engine → stores calculations
```

## Required Data Flow
```
Step 3 → stores useCaseData → Step 4 → calls TrueQuote Engine → stores initial calculations → ValueTicker displays values
```

## Solution
1. **Step 3**: After user completes Step 3, call TrueQuote Engine to get initial calculations
2. **Step 4**: Use existing calculations from Step 3 (or recalculate if needed)
3. **Step 5**: Refine calculations based on power level selection
4. **Ensure persistence**: Calculations should persist across steps

## Files to Fix
- `Step3Details.tsx` or `Step3HotelEnergy.tsx` - Add TrueQuote Engine call after form completion
- `Step4Options.tsx` - Ensure it uses state.calculations (may already work if Step 3 populates it)
- `WizardV6.tsx` - Ensure calculations persist across steps

## Implementation Plan
1. Add `useEffect` in Step 3 components to call TrueQuote Engine when useCaseData changes
2. Store initial calculations in `state.calculations`
3. Ensure Step 4 ValueTicker can read from `state.calculations`
4. Test that calculations persist when navigating between steps
