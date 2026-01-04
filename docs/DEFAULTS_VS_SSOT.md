# Default Values vs SSOT (Single Source of Truth)

## Critical Principle

**Default values ≠ SSOT**

Default values should ONLY be used for:
- UI initialization (when form first loads and no user input exists yet)
- Fallback if database is not accessible
- Providing a starting point for user input

**The database is the SSOT** - actual user-provided values always take precedence.

## Current Implementation

### Step3HotelEnergy Default Initialization

The code should:
1. ✅ Check `state.useCaseData` first (existing user input - SSOT)
2. ✅ Only use `default_value` from database if `state.useCaseData[field]` is undefined
3. ✅ Sync to `useCaseData` so it becomes the SSOT
4. ❌ Never use hardcoded defaults as fallback

### Current Code Logic

```typescript
// ✅ CORRECT: Merge existing data (SSOT) with defaults (UI init only)
const currentData = state.useCaseData || {};  // SSOT - user-provided values
const defaults: Record<string, any> = {};

data?.forEach(q => {
  // Only use default if field is not already in state (SSOT)
  if (q.default_value && currentData[q.field_name] === undefined) {
    // Default is for UI initialization only
    defaults[q.field_name] = parseFloat(q.default_value);
  }
});

// Merge: existing data (SSOT) takes precedence, then defaults
const merged = { ...defaults, ...currentData };
```

**This is correct** - existing data (SSOT) takes precedence over defaults.

## Database Default Values

The `default_value` field in `custom_questions` table is for:
- ✅ UI initialization (so form shows something on first load)
- ✅ User convenience (reasonable starting point)
- ❌ NOT as a fallback if user doesn't provide value
- ❌ NOT as SSOT

## TrueQuote Engine

TrueQuote Engine should:
1. ✅ Receive actual values from `useCaseData` (SSOT)
2. ✅ Error if required foundational variable is missing
3. ❌ Never silently use defaults
4. ❌ Never assume default values

## Migration Default Values

The migration adds `default_value` to database questions for:
- UI initialization only
- Not as SSOT
- Users should always provide actual values

## Example: Hotel roomCount

**Scenario 1: User provides 350 rooms**
- `useCaseData.roomCount = 350` (SSOT)
- Default value (150) is ignored
- TrueQuote Engine uses 350 ✅

**Scenario 2: User doesn't provide value**
- `useCaseData.roomCount = undefined`
- Default (150) used for UI initialization
- But user must provide actual value before proceeding
- TrueQuote Engine should error if still undefined ❌

**Scenario 3: Database not accessible**
- Default (150) used as fallback
- But system should log error about database access
- Not ideal - should fix database connection

## Action Items

1. ✅ Code already prioritizes SSOT (existing data over defaults)
2. ⏳ Ensure Step 3 validation prevents proceeding without foundational variables
3. ⏳ TrueQuote Engine should error if required fields missing (already done)
4. ⏳ Document that defaults are UI-only, not SSOT
