# WIZARD V8 - UI REDESIGN TESTING GUIDE

## 🎯 Quick Start

**Dev Server:** Running on `http://localhost:5184`  
**Route:** `/v8` → WizardV8Page  
**Changes:** MagicFit pre-selection removal + Range button sliders

## 📋 Test Flow

### Full Wizard Test (Recommended: Car Wash)

**Step 1: Location** (No changes - existing)

1. Enter address or select state
2. City/Zip auto-filled
3. Click Continue → Step 2

**Step 2: Industry** (No changes - existing)

1. Click "Car Wash" card
2. Auto-advances to Step 3

**Step 3: Facility Profile** (No changes - existing)

1. Answer 16 questions (bay type, bays, wash options, etc.)
2. Power calculation updates in real-time
3. Click Continue → Step 3.5

**Step 3.5: Add-ons Configuration** 🆕 **CHANGED - TEST THIS**

1. ✅ **Solar PV Array**
   - [ ] 4 range buttons render: "80-100 kW", "100-120 kW", "120-140 kW" ⭐, "140-170 kW"
   - [ ] Click "120-140 kW" → green checkmark appears in top-right corner
   - [ ] Selected value displays: "125 kW (130% of peak)"
   - [ ] Click "Confirm Solar Capacity" → button turns green with checkmark
2. ✅ **Backup Generator**
   - [ ] 3 range buttons render: "Min", "Standard" ⭐, "High"
   - [ ] Critical load info shows: "Generator sized for XX kW critical loads vs YY kW full facility load"
   - [ ] Click "Standard" → green checkmark appears
   - [ ] Selected value displays correctly
   - [ ] Click "Confirm Generator Setup" → button turns green with checkmark

3. ✅ **EV Charging** (if enabled)
   - [ ] 4 config buttons render: "4 L2", "8 L2", "8 L2 + 2 DCFC" ⭐, "12 L2 + 4 DCFC"
   - [ ] Click option → green checkmark appears
   - [ ] Total charging power displays correctly
   - [ ] Click "Confirm EV Configuration" → button turns green

4. ✅ **Continue Button**
   - [ ] Button disabled until all add-ons confirmed
   - [ ] After confirming all → button becomes active: "Continue to MagicFit"
   - [ ] Click Continue → "Generating Your Options..." spinner
   - [ ] Advances to Step 4

**Step 4: MagicFit** 🆕 **CHANGED - TEST THIS**

1. ✅ **No Pre-selection**
   - [ ] On load: NO tier is selected (no green checkmark)
   - [ ] Header shows: "Click a configuration to select it"
   - [ ] Info banner shows: "ⓘ Select your preferred configuration to continue"

2. ✅ **Tier Selection**
   - [ ] Click "Starter" card → green checkmark badge appears in top-right
   - [ ] Click "Perfect Fit" card → checkmark moves to Perfect Fit
   - [ ] Click "Beast Mode" card → checkmark moves to Beast Mode
   - [ ] Only ONE checkmark visible at a time

3. ✅ **Checkmark Visual**
   - [ ] Checkmark is in emerald-500 circular badge
   - [ ] Badge has shadow and bounce animation
   - [ ] White checkmark icon is clearly visible

4. ✅ **Continue**
   - [ ] Click selected tier card → auto-advances to Step 5
   - OR
   - [ ] Bottom nav "Continue" button works

**Step 5: Final Quote** (No changes - existing)

1. Quote displays with all values
2. Export options work
3. Save quote works

## 🎨 Visual Checks

### Step 3.5 Range Buttons

**Solar (Amber):**

- [ ] Unselected: `border-amber-500/50`, `text-slate-400`
- [ ] Hover: `border-amber-500`, `bg-amber-500/10`
- [ ] Selected: `border-amber-500`, `text-amber-400`, green checkmark badge
- [ ] Click effect: Scale up on hover, scale down on click

**Generator (Orange):**

- [ ] Unselected: `border-orange-500/50`, `text-slate-400`
- [ ] Hover: `border-orange-500`, `bg-orange-500/10`
- [ ] Selected: `border-orange-500`, `text-orange-400`, green checkmark badge

**EV Charging (Cyan):**

- [ ] Unselected: `border-cyan-500/50`, `text-slate-400`
- [ ] Hover: `border-cyan-500`, `bg-cyan-500/10`
- [ ] Selected: `border-cyan-500`, `text-cyan-400`, green checkmark badge

**Confirm Buttons:**

- [ ] Before confirm: Colored background (amber/orange/cyan), colored border
- [ ] After confirm: `bg-emerald-500/30`, `border-emerald-500`, green checkmark icon

### Step 4 MagicFit

**Tier Cards:**

- [ ] Starter: Green gradient border
- [ ] Perfect Fit: Purple gradient border + "BEST VALUE" banner
- [ ] Beast Mode: Orange gradient border

**Selected State:**

- [ ] Purple border (`border-purple-500`)
- [ ] Glow effect (`card-selected` animation)
- [ ] Green checkmark badge in top-right corner
- [ ] Subtle purple overlay on card

## 📱 Mobile Testing

**Viewport Sizes:**

- 1920x1080 (Desktop) - 4 columns for solar/EV, 3 for generator
- 1024x768 (Tablet) - 3 columns for solar/EV, 3 for generator
- 768x1024 (iPad Portrait) - 2 columns for all
- 375x667 (iPhone) - 2 columns for solar/EV, 1 for generator

**Touch Targets:**

- [ ] All range buttons are at least 44x44 px (WCAG 2.1 minimum)
- [ ] Green checkmarks are clearly visible on small screens
- [ ] No horizontal scrolling
- [ ] Buttons stack appropriately (responsive grid)

## 🐛 Known Issues to Watch For

**Step 3.5:**

- ⚠️ Solar ranges might be too narrow for some industries (adjust multipliers)
- ⚠️ Generator ranges assume critical load is always calculated
- ⚠️ EV charging assumes Level 2 = 7.2 kW, DCFC = 150 kW (verify with SSOT)

**Step 4:**

- ⚠️ If user clicks Continue without selecting tier, should show error (test this)
- ⚠️ Checkmark animation should play smoothly (no lag)

## ✅ Success Criteria

**Phase 11 Complete if:**

- [x] Office critical load working (20%)
- [x] Retail critical load working (15-18%)
- [x] Casino crash fixed
- [x] TypeScript clean
- [x] Tier pre-selection removed
- [x] Selection prompt showing when null
- [x] Solar slider replaced with range buttons
- [x] Generator slider replaced with range buttons
- [x] Green checkmarks showing on selected ranges
- [ ] **Mobile responsive** ← TEST THIS
- [ ] **Full flow works end-to-end** ← TEST THIS

## 🔍 Debug Tips

**If range buttons don't appear:**

```bash
# Check console for errors
# Verify lazy load worked:
console.log("Step3_5V8_RANGEBUTTONS loaded");

# Check import in WizardV8Page.tsx:
const Step3_5V8 = lazy(() => import("./steps/Step3_5V8_RANGEBUTTONS"));
```

**If checkmarks don't show:**

```tsx
// Check state value:
console.log("Solar kW:", state.solarKW);
console.log("Is selected?", Math.abs(state.solarKW - range.value) < 10);
```

**If tier selection doesn't work:**

```tsx
// Check selectedTierIndex:
console.log("Selected tier:", state.selectedTierIndex); // Should be null on load
```

## 📊 Comparison Test

**Test both versions side-by-side:**

**OLD (Step3_5V8.tsx):**

1. Rename `Step3_5V8_RANGEBUTTONS.tsx` to `Step3_5V8_NEW.tsx`
2. Restore import in WizardV8Page.tsx to use `Step3_5V8` (old sliders)
3. Test slider UX - note pain points
4. Revert import to use `Step3_5V8_NEW.tsx`

**NEW (Step3_5V8_RANGEBUTTONS.tsx):**

1. Test range button UX
2. Compare ease of use, mobile experience
3. Collect feedback

## 🎬 Demo Script

**For Vineet/stakeholders:**

1. **Show Problem:**
   - "Previously, sliders were hard to use on mobile"
   - "Perfect Fit tier was pre-selected, users didn't actively engage"

2. **Show Solution:**
   - "Now: Supabase-style range buttons - just click your preferred range"
   - "Green checkmarks provide clear confirmation"
   - "No pre-selection - user must actively choose their tier"

3. **Walk Through Flow:**
   - Select Car Wash → Answer 16 questions
   - Step 3.5: Click "120-140 kW" solar → green checkmark appears
   - Confirm solar → button turns green
   - Click generator range → confirm
   - Continue to MagicFit
   - Step 4: NO tier selected → click Perfect Fit → green checkmark appears
   - Continue to final quote

4. **Highlight Benefits:**
   - "Mobile-friendly - larger touch targets"
   - "Clear visual feedback - green checkmarks"
   - "Modern design - matches Supabase, Vercel"
   - "Higher engagement - no passive pre-selection"

## 📝 Bug Report Template

If you find issues, use this format:

```
**Step:** [e.g., Step 3.5 - Solar]
**Issue:** [Description of problem]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Browser:** [Chrome/Safari/Firefox]
**Device:** [Desktop/iPhone/Android]
**Console Errors:** [Paste any errors]
**Screenshot:** [Attach if possible]
```

---

**Last Updated:** February 10, 2026  
**Status:** Ready for Testing  
**Dev Server:** http://localhost:5184/v8
