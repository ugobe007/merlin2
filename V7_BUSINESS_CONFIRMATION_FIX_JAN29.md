# V7 Business Confirmation Workflow Fix

**Date:** January 31, 2026  
**Status:** ✅ **COMPLETE** - All root causes fixed

## Problem Statement

User identified three root causes:

1. **Step indexing off-by-one** - Shell treats currentStep as 0-based; hook treats it as 1-based
2. **Business confirmation not enforced** - `hasConfirmedBusiness` returned true if business object exists, even without user confirmation
3. **Draft inputs treated as persisted truth** - `businessName`/`streetAddress` from localStorage polluted fresh sessions

## Root Causes & Fixes

### A) Step Indexing Bug (WizardShellV7)

**Problem:** Shell had 6 steps but hook has only 4 steps (location, industry, profile, results)

**Fix:** Updated `STEPS` array to match hook's actual 4 steps:
```typescript
// Before: 6 labels that didn't match
const STEPS = ["Location", "Goals", "Facility", "Operations", "Energy", "Quote"];

// After: 4 labels matching hook steps
const STEPS = ["Location", "Industry", "Profile", "Quote"];
```

**File:** `src/components/wizard/v7/shared/WizardShellV7.tsx`

---

### B) Business Confirmation Gate (useWizardV7.ts)

**Problem:** No real `businessConfirmed` check - just existence of business object

**Fix:**
1. Added `businessDraft: { name: string; address: string }` to WizardState
2. Added `business: BusinessCard | null` field (V6 parity)
3. Added `locationConfirmed: boolean` field
4. Added `SET_BUSINESS_DRAFT`, `SET_BUSINESS`, `SET_LOCATION_CONFIRMED` intents
5. Added `setBusinessDraft()` and `confirmLocation()` actions
6. Updated `submitLocation()` to create `businessCard` from draft + resolved location
7. Gate in `submitLocation()`: stops navigation if `hasDraftBusiness && !businessConfirmed`

**File:** `src/wizard/v7/hooks/useWizardV7.ts`

---

### C) Draft Field Cache Leak (Persistence)

**Problem:** Draft business fields (`businessDraft`) persisted even when user didn't confirm

**Fix:**
1. **On persist:** Only save `businessDraft`/`business`/`businessCard` if `businessConfirmed === true`
2. **On hydrate:** If `!businessConfirmed`, clear draft fields to `{ name: "", address: "" }`

```typescript
// Persist - only save drafts if confirmed
const safeBusinessDraft = state.businessConfirmed 
  ? state.businessDraft 
  : { name: "", address: "" };

// Hydrate - clear drafts if not confirmed  
if (!safePayload.businessConfirmed) {
  safePayload.businessDraft = { name: "", address: "" };
  safePayload.business = null;
  safePayload.businessCard = null;
}
```

**File:** `src/wizard/v7/hooks/useWizardV7.ts`

---

### D) Auto-Confirm Bug (Step1LocationV7Clean)

**Problem:** `handleContinue` auto-confirmed business if name was present, skipping confirmation gate

**Fix:**
1. Removed auto-confirm: `handleContinue` no longer calls `confirmBusiness(true)` automatically
2. Added explicit confirmation gate UI with "Confirm & Continue" and "Skip" buttons
3. Gate appears when `hasDraftBusiness && !isBusinessConfirmed && hasIntel`

```typescript
// Before - AUTO-CONFIRMED (wrong)
if (businessName.trim()) {
  confirmBusiness(true);
}
actions.goToStep(next);

// After - NO auto-confirm, gate prevents navigation
if (hasDraftBusiness && !isBusinessConfirmed) {
  return; // Stay on Step 1, show confirmation UI
}
actions.goToStep(next);
```

**File:** `src/components/wizard/v7/steps/Step1LocationV7Clean.tsx`

---

### E) Missing Actions in Page (WizardV7Page)

**Problem:** Step1LocationV7 wasn't receiving `confirmBusiness`/`skipBusiness` actions

**Fix:** Added missing actions to Step1LocationV7 props:
```typescript
<Step1LocationV7
  state={state}
  actions={{
    updateLocationRaw: wizard.updateLocationRaw,
    submitLocation: wizard.submitLocation,
    primeLocationIntel: wizard.primeLocationIntel,
    confirmBusiness: wizard.confirmBusiness,  // ✅ Added
    skipBusiness: wizard.skipBusiness,         // ✅ Added
  }}
/>
```

**File:** `src/pages/WizardV7Page.tsx`

---

## Files Modified

| File | Changes |
|------|---------|
| `src/wizard/v7/hooks/useWizardV7.ts` | Added businessDraft, business, locationConfirmed to state; added SET_BUSINESS_DRAFT, SET_BUSINESS, SET_LOCATION_CONFIRMED intents; fixed persistence/hydration; added setBusinessDraft/confirmLocation actions; updated submitLocation to create businessCard from draft |
| `src/components/wizard/v7/shared/WizardShellV7.tsx` | Changed STEPS from 6 to 4 labels matching hook |
| `src/components/wizard/v7/steps/Step1LocationV7Clean.tsx` | Removed auto-confirm; added explicit confirmation gate UI |
| `src/pages/WizardV7Page.tsx` | Added confirmBusiness/skipBusiness to Step1 actions |

## Testing

### Test 1: Fresh Session (No Business)
1. Clear localStorage: `localStorage.removeItem('merlin_wizard_v7_state')`
2. Go to `/v7`
3. Enter ZIP code only (no business name)
4. Click continue → Should go to Industry (Step 2)
5. Step sidebar should show 4 steps: Location, Industry, Profile, Quote

### Test 2: Fresh Session (With Business)
1. Clear localStorage
2. Go to `/v7`
3. Enter ZIP code AND business name
4. Click continue → Should show "Confirm your business details" gate
5. Click "Confirm & Continue" → Should go to Industry (Step 2)
6. Refresh browser → Business should persist (it was confirmed)

### Test 3: Business Skipped
1. Clear localStorage
2. Go to `/v7`
3. Enter ZIP code AND business name
4. Click continue → Confirmation gate appears
5. Click "Skip" → Should go to Industry, business cleared
6. Refresh browser → Business fields should be empty

### Test 4: Refresh Without Confirmation
1. Clear localStorage
2. Go to `/v7`
3. Enter ZIP and business name
4. **DO NOT** click continue
5. Refresh browser
6. Business fields should be **EMPTY** (drafts weren't confirmed)

## State Model (V6 Parity)

```typescript
interface WizardState {
  // Location
  locationRawInput: string;
  location: LocationCard | null;
  locationIntel: LocationIntel | null;
  locationConfirmed: boolean;  // ✅ NEW

  // Business (V6 parity)
  businessDraft: { name: string; address: string };  // ✅ NEW - typed draft
  business: BusinessCard | null;  // ✅ NEW - resolved business  
  businessCard: BusinessCard | null;  // LEGACY alias
  businessConfirmed: boolean;

  // ... rest unchanged
}
```

## Confirmation Flow Diagram

```
                      ┌─────────────────────┐
                      │   User enters ZIP   │
                      │   + business name   │
                      └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │  submitLocation()   │
                      │  Creates businessCard│
                      │  from draft + geo   │
                      └──────────┬──────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ hasDraftBusiness &&     │
                    │ !businessConfirmed?     │
                    └────────────┬────────────┘
                          │            │
                         YES          NO
                          │            │
                          ▼            ▼
          ┌───────────────────┐  ┌──────────────┐
          │ Show confirmation │  │ Navigate to  │
          │ gate UI:          │  │ Industry     │
          │ • Confirm & Cont  │  │ (Step 2)     │
          │ • Skip            │  └──────────────┘
          └─────────┬─────────┘
                    │
       ┌────────────┴────────────┐
       │                         │
   Confirm                    Skip
       │                         │
       ▼                         ▼
┌─────────────────┐     ┌─────────────────┐
│ SET_BUSINESS_   │     │ Clear drafts    │
│ CONFIRMED: true │     │ confirmBusiness │
│ → Industry      │     │ (false)         │
└─────────────────┘     │ → Industry      │
                        └─────────────────┘
```
