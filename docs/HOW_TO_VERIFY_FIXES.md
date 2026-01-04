# How to Verify the Fixes Work

**Date:** January 2, 2026  
**Purpose:** Provide concrete ways to verify the fixes actually work

---

## Fix 1: Step 3 Modifiers Applied ✅

### What to Check in Browser Console

1. **Open browser DevTools Console** (F12 or Cmd+Option+I)
2. **Go through Step 3** and enter:
   - 400 rooms
   - Full amenities (restaurant, spa, pool, conference center, laundry, gym)
3. **Look for this log message:**
   ```
   ✅ Step 3 Modifiers Applied: Restaurant (+15%), Spa (+10%), Pool (+5%), Conference Center (+20%)
   ```
4. **If you see this message**, the modifiers are being applied ✅
5. **If you see this warning instead:**
   ```
   ⚠️ No Step 3 modifiers applied - check field mappings
   ```
   Then the mapping is NOT working ❌

### Expected Energy Increase

**Before fix:** 400 rooms × 5.5 kW/room = 2,200 kW  
**After fix (with modifiers):**
- Base: 2,200 kW
- Restaurant: 2,200 × 1.15 = 2,530 kW
- Spa: 2,530 × 1.10 = 2,783 kW
- Pool: 2,783 × 1.05 = 2,922 kW
- Conference: 2,922 × 1.20 = **3,506 kW**

**You should see ~3,506 kW (or higher) in Step 5**, not 2,200 kW.

---

## Fix 2: ZIP Code Saved to State ✅

### What to Check in Browser Console

1. **Open browser DevTools Console**
2. **Go to Step 1** and enter a ZIP code (e.g., 89052)
3. **Look for this log message:**
   ```
   💾 Step 1: Saving zipCode to state { zipCode: "89052", stateCode: "NV" }
   ```
4. **Then go to Step 4** and look for:
   ```
   ✅ Step 4: zipCode verified { zipCode: "89052", zipCodeLength: 5 }
   ```
5. **If you see BOTH messages**, zipCode is working ✅
6. **If you see this error in Step 4:**
   ```
   ❌ Step 4: Missing required data for TrueQuote Engine { zipCode: "MISSING", ... }
   ```
   Then zipCode is NOT being saved ❌

### Quick Test

**Before fix:** Step 4 would show "Missing required data" error  
**After fix:** Step 4 should show "zipCode verified" log

---

## Manual Testing Checklist

### Test Case: 400-Room Hotel with Full Amenities

1. **Step 1:** Enter ZIP code (e.g., 89052)
   - ✅ Check console: "Saving zipCode to state"
   
2. **Step 2:** Select "Hotel"
   
3. **Step 3:** Enter:
   - Rooms: 400
   - Hotel Category: Upscale
   - Pool Type: Indoor
   - Fitness Center: Full
   - Spa Services: Full
   - Food & Beverage: Full
   - Meeting Space: Large
   - Laundry Type: Commercial
   
   - ✅ Check console: "Step 3 Modifiers Applied: Restaurant (+15%), Spa (+10%), Pool (+5%), Conference Center (+20%)"
   
4. **Step 4:** Select solar and EV options
   - ✅ Check console: "zipCode verified"
   - ✅ Should NOT see "Missing required data" error
   
5. **Step 5:** Check BESS Power
   - ✅ Should show ~3,500 kW (or higher), NOT ~2,200 kW
   - ✅ If it shows ~2,200 kW, modifiers are NOT working ❌

---

## What If It Doesn't Work?

### If Modifiers Are Not Applied:

1. **Check the console log** - does it show "No Step 3 modifiers applied"?
2. **Check the field values in Step 3** - are they exactly:
   - `foodBeverage: 'full'` (not 'Full' or 'FULL')
   - `spaServices: 'full'` (not 'Full' or 'FULL')
   - `poolType: 'indoor'` (not 'Indoor' or 'INDOOR')
   - `meetingSpace: 'large'` (not 'Large' or 'LARGE')

3. **Check `trueQuoteMapper.ts` line ~220** - is the mapping code present?

### If ZIP Code Is Not Saved:

1. **Check the console log in Step 1** - do you see "Saving zipCode to state"?
2. **Check the console log in Step 4** - do you see "zipCode verified" or "Missing required data"?
3. **Check `Step1Location.tsx` line ~366** - is the `updateState` call present?
4. **Check localStorage** - open DevTools → Application → Local Storage → look for `merlin-wizard-state` → does it have `zipCode`?

---

## Trust But Verify

I've added **console logging** to make these fixes **verifiable**. 

**The logs will tell you immediately:**
- ✅ Whether modifiers are applied
- ✅ Whether zipCode is saved
- ✅ What values are being passed

**You don't have to trust me** - the console logs will show you what's actually happening.

---

## Next Steps

1. **Test with the checklist above**
2. **Check the console logs**
3. **Report back what you see**
4. **If something doesn't work, the logs will show us exactly what's wrong**
