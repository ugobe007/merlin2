# Fix: roomCount Sync Issue - COMPLETE

## Problem
- `roomCount` was missing from `useCaseData` when reaching Step 5
- TrueQuote Engine returned 0 kW because it couldn't find `roomCount`
- This caused incorrect quotes (e.g., 150-room default for 350-room hotel)

## Root Cause
`Step3HotelEnergy` was setting defaults in local `answers` state but:
1. Defaults were only set conditionally (`if (!answers[q.field_name])`)
2. Sync to `useCaseData` happened via useEffect, but defaults might not have been set yet
3. No immediate sync of defaults to parent state

## Solution
Updated `Step3HotelEnergy` default initialization (lines 198-239):

### Before
- Defaults set in local state only
- Sync happened later via useEffect on `answers` changes
- Race condition possible

### After
- Initialize defaults from database questions
- Merge with existing `state.useCaseData` (preserves user inputs)
- **Immediately sync defaults to parent state** via `updateState`
- Ensures all default values (including `roomCount`) are saved to `useCaseData`

## Code Changes

```typescript
// Fetch questions from database and initialize defaults
useEffect(() => {
  async function fetchQuestions() {
    // ... fetch questions ...
    
    // Initialize defaults from database questions
    const currentData = state.useCaseData || {};
    const defaults: Record<string, any> = {};
    
    data?.forEach(q => {
      // Only set default if field is not already in state
      if (q.default_value && currentData[q.field_name] === undefined) {
        if (q.question_type === 'number') {
          defaults[q.field_name] = parseFloat(q.default_value);
        } else if (q.question_type === 'boolean') {
          defaults[q.field_name] = q.default_value === 'true';
        } else {
          defaults[q.field_name] = q.default_value;
        }
      }
    });
    
    // Merge: existing data takes precedence, then defaults
    if (Object.keys(defaults).length > 0 || Object.keys(currentData).length > 0) {
      const merged = { ...defaults, ...currentData };
      setAnswers(merged);
      // Immediately sync defaults to parent state
      updateState({ useCaseData: merged });
    }
  }
  fetchQuestions();
}, []);
```

## Important Notes

⚠️ **This fixes the technical issue, but the user's point remains valid:**

- We still need to ensure users provide ACTUAL values (not just defaults)
- A 350-room hotel needs accurate calculations
- Defaults are fine for UI initialization, but users should confirm/update them
- Foundation variables MUST be captured from user input

## Next Steps

1. ✅ Fix applied - defaults now sync to `useCaseData`
2. ⏳ Verify database has `roomCount` question with `default_value`
3. ⏳ Audit all industries for foundational variables
4. ⏳ Ensure foundational variables are required and prominent in UI

## Testing

To verify the fix:
1. Navigate to Step 3 for hotel
2. Check browser console - should see `roomCount` in `useCaseData`
3. Navigate to Step 5 - `roomCount` should be present
4. TrueQuote Engine should calculate proper BESS sizing
