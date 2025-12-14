# 🧪 USER TESTING GUIDE - UX Simplification Fixes
**Date**: December 14, 2025  
**Deployment**: ✅ COMPLETED  
**Commit**: adef136  
**URL**: https://merlin2.fly.dev/  

---

## ⚠️ CRITICAL: MUST HARD REFRESH BROWSER

**Before testing, you MUST clear the old cached bundle:**

### Option 1: Hard Refresh (Recommended)
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`
- **Alternative**: `Cmd/Ctrl + F5`

### Option 2: Incognito/Private Window
- **Chrome**: `Cmd/Ctrl + Shift + N`
- **Safari**: `Cmd + Shift + N`
- **Firefox**: `Cmd/Ctrl + Shift + P`

### Option 3: Clear Cache Manually
1. Open DevTools (`F12` or `Cmd + Option + I`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

---

## 🧪 Test Scenario: 200-Room Upscale Hotel in California

### Step 1: Open Console
1. Open browser developer tools: `F12` or `Cmd + Option + I`
2. Click the **Console** tab
3. Keep it open during entire test

### Step 2: Start Wizard
1. Navigate to: https://merlin2.fly.dev/
2. Click **"Start Your Quote"** or **"Get Started"**

### Step 3: Section 0 - Location
1. Select **State**: California
2. Select **Goal**: "Reduce my electricity bill" (or any option)
3. Click **Continue**

### Step 4: Section 1 - Industry
1. Select **Hotel** industry
2. Click **Continue**

### Step 5: Section 2 - Facility Details (CRITICAL)
1. **Number of rooms**: `200`
2. **Hotel class**: Upscale
3. **Amenities**: Check Pool + Restaurant
4. Click **Continue**

### ✅ CHECKPOINT: Console Logs After Section 2
**You should see these logs immediately:**
```
🔄 [RECALC] ========================================
🔄 [RECALC] CALCULATION TRIGGER FIRED!
🔄 [RECALC] Industry: hotel
🔄 [RECALC] Current Section: 3
🔄 [RECALC] Raw useCaseData field names: ['numberOfRooms', 'hotelClass', ...]
🔄 [RECALC] Raw useCaseData values: { numberOfRooms: 200, ... }
🔄 [RECALC] ========================================
✅ [SSOT] ========================================
✅ [SSOT] CALCULATION SUCCESSFUL!
✅ [SSOT] Peak Demand (kW): 650
✅ [SSOT] Power (MW): 0.65
💾 [RECALC] UPDATED centralizedState.calculated:
💾 [RECALC] Total Peak Demand (kW): 650
💾 [RECALC] Recommended Battery (kW): 455
💾 [RECALC] Recommended Battery (kWh): 1820
```

**⚠️ IF YOU DON'T SEE THESE LOGS:**
- Screenshot the console
- Take a screenshot of the page
- Report: "Calculation trigger did not fire"

### Step 6: Section 3 - Goals
1. Review options (solar, wind, generator)
2. Select or skip as desired
3. **CRITICAL**: Click **Continue** button

### ✅ CHECKPOINT: Console Logs After Continue
**You should see:**
```
🎯 [GOALS] Continue clicked - triggering generateQuote() for AcceptCustomizeModal
🧙 [generateQuote] Centralized state check: {...}
🧙 [generateQuote] Using values: {...}
🧙 [generateQuote] Quote generated successfully: {...}
```

### ✅ CHECKPOINT: AcceptCustomizeModal Appears
**Modal should show:**

#### Title:
"Merlin's Recommendation" or similar

#### Values to Verify:
1. **Peak Demand**: ~650 kW (NOT 450 kW)
2. **Recommended BESS**: ~455 kW (NOT 315 kW)
3. **Recommended Storage**: ~1,820 kWh (NOT 1,300 kWh)
4. **Annual Savings**: $XXX,XXX (calculated value)
5. **Payback**: X.X years (calculated value)

#### Two Buttons:
- **"Accept AI Recommendation"** (green/primary)
- **"Customize My System"** (secondary)

**📸 REQUIRED: Take screenshot of this modal**

### Step 7: Check PowerProfile Widget (Left Sidebar)
**Look at left sidebar widget:**

#### Should Display:
- **Section progress**: Shows you're on Section 3
- **Power Gap indicator**: Shows % provisioning
- **System size**: Should match recommended values

#### Power Gap %:
- **Expected**: <100% (e.g., 85%, 95%, etc.)
- **NOT**: 139% or over-provisioning

**📸 REQUIRED: Take screenshot of sidebar**

---

## 📊 What to Report

### ✅ If Everything Works:
Send message with:
1. ✅ "Calculation logs appeared in console"
2. ✅ Screenshot of AcceptCustomizeModal showing correct values
3. ✅ Screenshot of PowerProfile showing <100% provisioning
4. ✅ "UX is simplified - single modal instead of multiple"

### ❌ If Logs Don't Appear:
Send message with:
1. ❌ "No calculation logs in console"
2. 📸 Screenshot of console (showing what IS there)
3. 📸 Screenshot of the wizard page
4. Copy/paste ANY console errors or warnings

### ❌ If Values Still Wrong:
Send message with:
1. ❌ "Values still showing defaults"
2. 📸 Screenshot of AcceptCustomizeModal
3. 📸 Screenshot of console logs
4. Copy/paste the console output showing:
   - `🔄 [RECALC]` section
   - `✅ [SSOT]` section
   - `💾 [RECALC]` section

### ❌ If PowerProfile Still Shows 139%:
Send message with:
1. ❌ "PowerProfile still over-provisioned"
2. 📸 Screenshot of left sidebar
3. 📸 Screenshot of console logs

---

## 🔍 Expected vs Actual Values

| Metric | Template Default | Expected (200 rooms) | What You See |
|--------|------------------|----------------------|--------------|
| **Peak Demand** | 450 kW | ~650 kW | ___________ |
| **Recommended BESS** | 315 kW | ~455 kW | ___________ |
| **Storage Capacity** | 1,300 kWh | ~1,820 kWh | ___________ |
| **PowerProfile %** | 139% | <100% | ___________ |

Fill in "What You See" column in your report.

---

## 🐛 Known Issues (Already Fixed in This Deploy)

1. ✅ **Intermediate Merlin's Insight modal** - REMOVED
2. ✅ **PowerProfile using slider values** - NOW uses calculated values
3. ✅ **GoalsSection auto-advancing** - NOW triggers generateQuote()
4. ✅ **No console logs** - NOW added extensive debugging

---

## 🔧 If Still Broken - Debug Actions

### Action 1: Check React DevTools
1. Install React DevTools extension
2. Open DevTools → React tab
3. Find `StreamlinedWizard` component
4. Inspect: `hooks → centralizedState → calculated`
5. Should see:
   ```
   calculated: {
     totalPeakDemandKW: 650,
     recommendedBatteryKW: 455,
     recommendedBatteryKWh: 1820,
     ...
   }
   ```
6. 📸 Screenshot this state

### Action 2: Check Actual Database Fields
If logs show empty or wrong field names:
1. Message: "Need to verify database field names"
2. Copy/paste the `🔄 [RECALC] Raw useCaseData field names:` output
3. I'll check if normalization mapping needs updating

### Action 3: Browser Console Commands
Open console and run:
```javascript
// Check if calculation exists
console.log('Centralized State:', window.sessionStorage.getItem('wizardState'));
```
Send the output.

---

## 📝 Template Response

**Copy this and fill in:**

```
Testing Results - Dec 14, 2025

✅/❌ Hard refresh performed: _______
✅/❌ Calculation logs appeared: _______
✅/❌ Values are correct (not defaults): _______
✅/❌ PowerProfile shows <100%: _______
✅/❌ Single modal (no multiple popups): _______

Peak Demand shown: _______ kW (expected ~650 kW)
Recommended BESS: _______ kW (expected ~455 kW)
Storage Capacity: _______ kWh (expected ~1,820 kWh)
PowerProfile %: _______ (expected <100%)

[Attach screenshots here]

Console logs:
[Paste any 🔄, ✅, or 💾 logs here]
```

---

## 🎯 Success Criteria

**Test PASSES if:**
1. ✅ Console shows calculation logs (🔄, ✅, 💾)
2. ✅ AcceptCustomizeModal shows ~650 kW peak (not 450 kW)
3. ✅ PowerProfile shows <100% provisioning (not 139%)
4. ✅ Only ONE modal appears (AcceptCustomizeModal)
5. ✅ No intermediate Merlin's Insight popup

**Test FAILS if:**
1. ❌ No console logs appear
2. ❌ Values still show 450 kW, 315 kW, 1,300 kWh
3. ❌ PowerProfile still shows 139%
4. ❌ Multiple confusing modals appear

---

## 💡 What This Fix Should Achieve

### User Experience:
- **BEFORE**: Location → Industry → Fill form → Popup #1 → Dismiss → Goals → Continue → Sliders → Quote → Popup #2
- **AFTER**: Location → Industry → Fill form → Goals → Continue → Single Recommendation Modal → Choose Accept or Customize

### Technical:
- **BEFORE**: PowerProfile used slider values (user-controlled)
- **AFTER**: PowerProfile uses calculated values (SSOT)

### Clarity:
- **BEFORE**: "PP and wizard using 2 different calculators"
- **AFTER**: Both use same SSOT calculation

---

**Ready to test! Please follow steps carefully and report back with screenshots + console output.**
