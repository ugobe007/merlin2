# WizardV8 MagicFit Restructure — Phase 1 Complete

**Date:** March 1, 2026  
**Session:** Goals Step Removal & File Reorganization

## ✅ Completed Tasks

### 1. wizardState.ts Cleanup

**Files Modified:** `src/wizard/v8/wizardState.ts`

**Changes:**

- ❌ Removed `GoalChoice` type definition
- ❌ Removed `SET_GOAL` action type from `WizardIntent` union
- ❌ Removed `goalChoice` field from initial state
- ❌ Removed `SET_GOAL` reducer case
- ✅ Updated Step 4 comments from "Goal" to "MagicFit"

### 2. useWizardV8.ts Cleanup

**Files Modified:** `src/wizard/v8/useWizardV8.ts`

**Changes:**

- ❌ Removed `GoalChoice` import
- ❌ Removed `setGoal` method (33 lines deleted)
- ❌ Removed `setGoal` from actions export
- ✅ Updated Step 4 comment to "MagicFit Tiers"

### 3. File Reorganization

**Files Deleted:**

- `src/wizard/v8/steps/Step4V8.tsx` (old Goals step)

**Files Renamed:**

- `Step5V8.tsx` → `Step4V8.tsx` (MagicFit tiers)
- `Step6V8.tsx` → `Step5V8.tsx` (Quote results)

**Files Kept:**

- `Step6V8.backup.tsx` (backup file preserved)

### 4. WizardV8Page.tsx Updates

**Files Modified:** `src/wizard/v8/WizardV8Page.tsx`

**Changes:**

- ❌ Removed `Step6V8` import
- ✅ Updated STEP_LABELS from 6 to 5 steps:
  - Old: `["Location", "Industry", "Profile", "Goal", "Compare", "Quote"]`
  - New: `["Location", "Industry", "Profile", "MagicFit", "Quote"]`
- ✅ Updated step rendering to 5 steps (removed Step 6)

## 🎯 Current State

### New Wizard Flow (Steps 1-5)

```
Step 1: Location + Addon Preferences
Step 2: Industry Selection
Step 3: Infrastructure Questionnaire
Step 4: MagicFit Tiers (STARTER/PERFECT FIT/BEAST MODE)
Step 5: Quote Results
```

### WizardStep Type

```typescript
export type WizardStep = 1 | 2 | 3 | 3.5 | 4 | 5;
```

**Note:** Step 3.5 is defined in the type but not yet implemented. This will be the conditional Addon Configuration step.

### State Structure (Relevant to MagicFit)

```typescript
// Step 1: Add-on Preferences
wantsSolar: boolean;
wantsEVCharging: boolean;
wantsGenerator: boolean;

// Step 3.5/4: Add-on Configuration (conditional)
solarKW: number;
generatorKW: number;
generatorFuelType: "diesel" | "natural-gas" | "dual-fuel";
level2Chargers: number;
dcfcChargers: number;
hpcChargers: number;

// Step 4: MagicFit Tiers
tiersStatus: FetchStatus;
tiers: [QuoteTier, QuoteTier, QuoteTier] | null;
selectedTierIndex: 0 | 1 | 2;
```

## 🚧 Remaining Tasks

### Phase 2: MagicFit Design Implementation

**Next Steps:**

1. ✅ Read V6 MagicFit design from `src/components/wizard/v6/steps/Step5MagicFit.tsx`
2. ✅ Apply design to new `Step4V8.tsx`:
   - STARTER card (green gradient, "Get your feet wet")
   - PERFECT FIT card (purple gradient, BEST VALUE badge, "Just right for you")
   - BEAST MODE card (orange gradient, "Go all in")
   - Equipment strips (🔋 ☀️ ⚡ 🔥)
   - Full financials (Investment | ITC | Net Cost)
   - ROI metrics (Payback | 10-Year ROI | 25-Year Profit)
   - Card animations (hover, click, selected state)

### Phase 3: Step 3.5 Creation

**File to Create:** `src/wizard/v8/steps/Step3_5V8.tsx`

**Functionality:**

- **Conditional rendering:** Only shown if `wantsSolar || wantsEVCharging || wantsGenerator`
- **Solar config:** kW slider/input
- **Generator config:** kW + fuel type selector
- **EV config:** L2/DCFC/HPC charger counts
- **Smart defaults:** Based on Step 3 facility data

### Phase 4: Navigation Logic

**File to Modify:** `src/wizard/v8/useWizardV8.ts`

**Changes needed:**

```typescript
// In goToStep() callback:
// After Step 3, check if addon config needed
if (step === 4 && state.currentStep === 3) {
  const needsAddonConfig = state.wantsSolar || state.wantsEVCharging || state.wantsGenerator;
  if (needsAddonConfig) {
    dispatch({ type: "GO_TO_STEP", step: 3.5 });
    return;
  }
}

// From Step 3.5, go to Step 4 and generate tiers
if (step === 4 && state.currentStep === 3.5) {
  await generateTiers();
}
```

### Phase 5: Tier Generation with Margin Policy

**File to Modify:** `src/wizard/v8/useWizardV8.ts`

**Function to create:** `generateTiers()`

**Critical requirements:**

1. ✅ Call SSOT `calculateQuote()` with addon configs
2. ✅ Apply margin policy: `applyMarginPolicy({ lineItems, totalBaseCost, ... })`
3. ✅ Use `sellPriceTotal` (not `baseCostTotal`) for customer-facing prices
4. ✅ Create 3 tiers with multipliers (0.7 / 1.0 / 1.5)
5. ✅ Update tier labels to match MagicFit design

**Margin Bands:**
| Deal Size | Target Margin |
|-----------|---------------|
| <$500K | 20% |
| $500K-$1.5M | 18% |
| $1.5M-$3M | 12% |
| $3M-$5M | 10% |
| $5M-$10M | 7.5% |
| $10M+ | 3.5% |

### Phase 6: Verification

**Checklist:**

- [ ] `applyMarginPolicy()` imported from `marginPolicyEngine.ts`
- [ ] `applyMarginPolicy()` called in tier generation
- [ ] `sellPriceTotal` used in UI (not `baseCostTotal`)
- [ ] Step4V8 displays MagicFit design
- [ ] Step 3.5 conditionally shown
- [ ] Navigation flows correctly (3 → 3.5? → 4 → 5)

## 🖥️ Dev Server Status

**Running:** `http://localhost:5184/`  
**Route:** `/wizard-v8`

**Test Plan:**

1. Navigate to `/wizard-v8`
2. Complete Step 1 (Location + Addon Preferences)
3. Complete Step 2 (Industry)
4. Complete Step 3 (Questionnaire)
5. **Expected:** Navigate directly to Step 4 (MagicFit) if no addons selected
6. **Expected:** Navigate to Step 3.5 (Addon Config) if addons selected, then to Step 4

## 📊 Metrics

**Code Removed:**

- 1 type definition (GoalChoice)
- 1 action type (SET_GOAL)
- 1 state field (goalChoice)
- 1 reducer case (SET_GOAL)
- 1 method (setGoal - 33 lines)
- 1 step file (Step4V8.tsx - old Goals step)

**Files Modified:**

- `wizardState.ts` (4 removals, 3 label updates)
- `useWizardV8.ts` (1 import removal, 1 method removal, 1 export removal)
- `WizardV8Page.tsx` (1 import removal, 1 label array update, 1 rendering update)

**Files Renamed:**

- 2 step files (Step5→Step4, Step6→Step5)

**Net Result:**

- 6-step wizard → 5-step wizard (+ conditional Step 3.5)
- Goals concept completely removed
- MagicFit positioned as Step 4 (was Step 5)

## 🎓 Strategic Rationale

**User Insight:**

> "so let's assume goals is to save money. that is why the user starts the quote process, to save money on their energy bills."

**Key Principle:**
Users don't need to choose a "goal" because **everyone wants to save money**. The wizard should:

1. **Assume savings** as the primary objective
2. **Optimize configurations** for savings (low/medium/high via MagicFit)
3. **Ask sizing questions** (not goal questions)
4. **Apply margin policy** for proper commercialization

**MagicFit = 3 Savings-Optimized Configurations:**

- **STARTER** (70%): Low-cost entry point
- **PERFECT FIT** (100%): Optimal savings (BEST VALUE)
- **BEAST MODE** (150%): Maximum savings potential

## 📝 Notes

1. **No setGoal method needed:** Tiers are now generated automatically when entering Step 4, not triggered by goal selection
2. **Margin policy critical:** Must call `applyMarginPolicy()` to ensure proper commercialization
3. **Step 3.5 conditional:** Only shown if user wants solar/EV/generator addons
4. **WizardStep type ready:** Already includes 3.5 for future Step3_5V8.tsx

---

**Next Session Focus:** Apply MagicFit design to Step4V8.tsx and create Step3_5V8.tsx
