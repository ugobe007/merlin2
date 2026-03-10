# Step 1 Workflow Debug - March 9, 2026

## Current Issue

**Problem**: "Confirm My Business" button is missing
**User reports**: Cannot confirm location

## File Being Used

**Primary file**: `/src/wizard/v8/steps/Step1V8.tsx` (1732 lines)

## The Three States of Step 1

### State 1: ZIP Entry (BEFORE location confirmed)

**Condition**: `!locationConfirmed`
**Shows**:

- Country toggle (US/International)
- ZIP input field with "Continue →" button
- No business search yet

**User action**: Enter ZIP → Click "Continue →"
**Trigger**: Calls `handleSubmit()` which sets `locationConfirmed = true`

---

### State 2: Business Search (AFTER location confirmed, BEFORE business selected)

**Condition**: `locationConfirmed && !state.business`
**Shows**:

1. ✅ Confirmed location pill (green checkmark)
2. ⚡ Grid reliability question (4 buttons)
3. 💡 Add-on preferences (Solar/EV/Generator checkboxes)
4. 🏢 "Find My Business" section with:
   - Business name input (Google Places Autocomplete)
   - Blue info box: "ℹ️ Select from dropdown to get photo, map, verified address"
   - "Continue with [Business Name]" button (DISABLED until autocomplete selection)
   - **NO SKIP BUTTON** (removed in version 1065)

**User action**:

1. Type business name in autocomplete field
2. **MUST** select from Google Places dropdown
3. Click "Continue with [Business Name]" button
   **Trigger**: Auto-calls `actions.setBusiness()` when place is selected

---

### State 3: Business Confirmation (AFTER business data received)

**Condition**: `state.business && locationConfirmed`
**Shows**:

- Business photo (or placeholder icon)
- Business name (large, bold)
- Formatted address
- Industry detection badge (if detected)
- Details grid (Location, Website, Roof space)
- Google Maps static map
- Location info card
- **🟢 "Confirm & Skip to Questionnaire" button** ← THIS IS WHAT YOU'RE MISSING
- "Edit" button

**User action**: Click "Confirm & Skip to Questionnaire" → Go to Step 2 or 3
**Trigger**: Calls `actions.confirmBusiness()`

---

## Why You're NOT Seeing the Confirm Button

### Most Likely Cause: You're stuck in State 2

**Symptoms**:

- You can type in the business name field
- You see the blue info box
- Continue button says "Select from dropdown to continue"
- Continue button is DISABLED

**Why**:

1. Google Places Autocomplete initialized ✅
2. Dropdown appeared ✅
3. But you didn't **select** from the dropdown ❌
4. Or selection didn't trigger `selectedPlace` state update ❌

### Console Logs Analysis

```javascript
[Log] [Step1V8] Google Places Autocomplete initialized
```

✅ This means autocomplete IS working

**BUT**: No log showing "Auto-submitting business data..." which should appear when you select from dropdown.

---

## The Autocomplete Selection Flow

### What SHOULD happen:

1. User types "Starbucks" in business name input
2. Google Places dropdown appears below input
3. **User MUST click on a dropdown item** (e.g., "Starbucks - Main St, Boston")
4. `place_changed` event fires
5. Code logs: "Auto-submitting business data..."
6. `actions.setBusiness()` is called with Google Place data
7. `state.business` becomes populated
8. UI switches to State 3 (confirmation card)
9. "Confirm & Skip to Questionnaire" button appears

### What's PROBABLY happening to you:

1. User types "Starbucks" ✅
2. Dropdown appears ✅
3. **User presses Enter or clicks Continue WITHOUT selecting from dropdown** ❌
4. `selectedPlace` is still `null`
5. Continue button stays disabled
6. Stuck in State 2

---

## How to Fix It - USER INSTRUCTIONS

### Step 1: Enter ZIP Code

1. Enter your ZIP code
2. Click "Continue →"
3. Wait for location to be confirmed (green checkmark)

### Step 2: Search for Business (CRITICAL)

1. Type your business name in the "Find My Business" field
2. **WAIT for Google autocomplete dropdown to appear**
3. **CLICK on your business from the dropdown list** (don't just type and press Enter!)
4. The Continue button will change from "Select from dropdown to continue" to "Continue with [Your Business Name]"
5. Click the now-enabled "Continue with [Business Name]" button

### Step 3: Confirm Business

1. You should now see your business card with photo and map
2. Click "Confirm & Skip to Questionnaire" button
3. Proceed to next step

---

## Debugging Commands

### Check if business data exists in state:

Open browser console and type:

```javascript
// Find the wizard state in React DevTools
// Or check localStorage
console.log(localStorage.getItem("wizardStateV8"));
```

### Check current state conditions:

```javascript
// In browser console
console.log({
  locationConfirmed: /* should be true */,
  hasBusiness: /* should be true when you see confirm button */,
  businessData: /* should have name, address, lat, lng */
})
```

---

## Code Locations

### State 2 → State 3 transition:

**File**: `/src/wizard/v8/steps/Step1V8.tsx`
**Lines**: 165-230 (autocomplete place_changed listener)
**Key code**:

```typescript
autocomplete.addListener("place_changed", () => {
  const place = autocomplete.getPlace();
  // ... extract data ...
  setTimeout(() => {
    actions.setBusiness(place.name, businessData); // This triggers State 3
  }, 100);
});
```

### "Confirm My Business" button:

**File**: `/src/wizard/v8/steps/Step1V8.tsx`
**Lines**: 1626-1688
**Condition**: Only shows when `state.business && locationConfirmed` is true

### Continue button (State 2):

**File**: `/src/wizard/v8/steps/Step1V8.tsx`
**Lines**: 1123-1151
**Disabled when**: `!businessName.trim() || isFetching || (!!autocompleteRef.current && !selectedPlace)`

---

## What Changed in Version 1065

**Removed**: "Skip — I'll select my industry manually" button (line 1155-1175)
**Reason**: User was bypassing Google Places autocomplete
**Impact**: You MUST now select from autocomplete dropdown to proceed

---

## Next Steps for You

1. **Hard refresh the page**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Start from Step 1 again**
3. **Enter ZIP** → Click Continue
4. **Type business name** → **CLICK on autocomplete suggestion** (don't press Enter!)
5. **Click "Continue with [Business]"** button
6. **Confirm button should now appear**

If this doesn't work, provide:

1. Screenshot of what you see after typing business name
2. Browser console logs (all of them)
3. Network tab showing any failed API calls
