# Step 4 → 5 Navigation Bug Fix (Mar 11, 2026)

## Problem
User reported: "step 4--> 5 is broken"

Console logs showed:
```
[Log] [Step4V8] Continue clicked, selectedTierIndex: 1
[Log] [WizardV8Page] Rendering step: 5
(repeated - wizard stuck on step 5)
```

## Root Cause
When I renumbered steps from 0-5 to 0-6 (to accommodate the new Add-ons step at position 4), I updated the step routing in WizardV8Page.tsx but **forgot to update the hardcoded step numbers inside the step components**.

**Step4V8.tsx** (MagicFit - tier selection):
- Now rendered at step **5** (was step 4)
- Continue button was calling `actions.goToStep(5)` 
- ❌ Bug: Trying to navigate to itself (5 → 5) instead of going forward to step 6

**Step5V8.tsx** (Quote results):
- Now rendered at step **6** (was step 5)
- Back buttons were calling `actions.goToStep(4)` (Add-ons)
- ❌ Bug: Should go back to step 5 (MagicFit) not step 4

## Solution
Fixed 4 hardcoded step references:

### Step4V8.tsx (1 fix)
**Line 689** - Continue button:
```tsx
// OLD (broken):
actions.goToStep(5);

// NEW (fixed):
actions.goToStep(6);
```

### Step5V8.tsx (3 fixes)
**Line 121** - Error fallback "Back to Configuration":
```tsx
// OLD: actions.goToStep(4)
// NEW: actions.goToStep(5)
```

**Line 344** - Header Back button:
```tsx
// OLD: actions.goToStep(4)
// NEW: actions.goToStep(5)
```

**Line 986** - Bottom "Back to Tiers" button:
```tsx
// OLD: actions.goToStep(4)
// NEW: actions.goToStep(5)
```

## Current Step Flow (After Fix)
```
0: Mode Selection
1: Location & Business (Google Maps)
2: Industry Selection
3: Facility Details (Questionnaire)
4: Add-ons (Solar/Generator/EV recommendations) ← NEW STEP
5: MagicFit (Tier selection) ← Was step 4
6: Quote Results ← Was step 5
```

## Testing
✅ Build successful (7.11s)
✅ Deployment successful to Fly.io
✅ Navigation 5 → 6 now works (Continue button on MagicFit)
✅ Navigation 6 → 5 works (Back buttons on Quote)

## Lesson Learned
When renumbering steps, **ALL** of these must be updated:
1. ✅ WizardStep type definition (`wizardState.ts`)
2. ✅ Step routing in WizardV8Page (`{step === 5 && <Step4V8 .../>}`)
3. ✅ STEP_LABELS array
4. ✅ GO_BACK logic in reducer
5. ✅ Step transition logic in `goToStep()` callback
6. ❌ **FORGOT**: Hardcoded step numbers INSIDE step components (navigation buttons)

**Action Item**: Add test that validates all `actions.goToStep(N)` calls are <= max step number.
