# SmartWizard Workflow Redesign Proposal
**Date:** November 26, 2025  
**Issue:** Steps 3 & 4 redundant, missing EV Charger question

---

## Current Workflow Problems

### 1. **Redundancy Between Step 3 & Step 4**
- **Step 3 (Merlin's Recommendation):** Shows battery sliders (MW, duration) with explanations
- **Step 4 (Power Profile Acceptance):** Shows same battery info + renewable sliders (Solar/Wind/Generator)
- **User Feedback:** "Almost redundant but in Step 4 the user can adjust the numbers"

### 2. **Missing EV Charger Question**
- No dedicated step asking if user wants to include EV chargers
- EV chargers are critical revenue source for hotels, apartments, commercial facilities
- Should be asked alongside Solar/Wind/Generator options

### 3. **Power Configuration Display Issue**
- Top nav shows "0.8 MW System" (battery only) even when user adds 1 MW solar
- Should display total system: 1.8 MW (0.8 battery + 1.0 solar)
- ✅ **FIXED** - Now shows total system MW

---

## Proposed Workflow Redesign

### **OPTION A: Collapse Step 3 & 4 Into One Interactive Step**

**New Step 3: "Build Your Power Profile"**

```
┌─────────────────────────────────────────────────────────┐
│  🧙‍♂️ Build Your Complete Power Profile                │
│  Based on your [Hotel] requirements                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ⚡ BATTERY STORAGE (Required)                          │
│  Calculated from your building's power needs            │
│                                                         │
│  [===========|===================] 0.8 MW               │
│  [==============|==============] 4 hours                │
│                                                         │
│  Total: 3.2 MWh                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ☀️ SOLAR POWER (Optional - Recommended)               │
│  Toggle: [ON]  Reduces grid costs & tax credits        │
│                                                         │
│  [====|============================] 1.0 MW             │
│  Space needed: ~5 acres or rooftop                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🚗 EV CHARGING STATIONS (Optional)                     │
│  Toggle: [OFF]  Add revenue & attract customers         │
│                                                         │
│  Level 2 (11kW):  [0] chargers                          │
│  DC Fast (50kW):  [0] chargers                          │
│  DC Fast (150kW): [0] chargers                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  💨 WIND POWER (Optional)                               │
│  Toggle: [OFF]  For sites with consistent wind          │
│                                                         │
│  [============================] 0 MW                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ⚙️ BACKUP GENERATORS (Optional)                        │
│  Toggle: [OFF]  For off-grid or unreliable grid         │
│                                                         │
│  [============================] 0 MW                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📊 YOUR TOTAL POWER PROFILE                            │
│                                                         │
│  Total System: 1.8 MW (0.8 Battery + 1.0 Solar)        │
│  ✓ Peak demand reduction                                │
│  ✓ Demand charge savings                                │
│  ✓ Backup power capability                              │
│  ✓ Carbon reduction                                     │
│                                                         │
│  [Back]                    [Next: Location & Pricing →] │
└─────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ One comprehensive configuration page
- ✅ All power sources visible at once
- ✅ Clear toggle switches for optional features
- ✅ EV Chargers prominently featured
- ✅ No redundancy - user sees and adjusts everything in one place

---

### **OPTION B: Keep Separate Steps But Improve Flow**

**Step 3: Merlin's Recommendation (View Only)**
- Show calculated battery configuration
- Explain WHY these numbers work
- Display as "recommendation" not "adjustment"
- No sliders - just information
- "Accept & Continue" button

**Step 4: Customize Your Power Profile (Adjustment)**
- Battery shown but NOT adjustable (locked from Step 3)
- Add optional power sources with toggles:
  - ☀️ Solar (slider 0-10 MW)
  - 🚗 EV Chargers (quantity by type)
  - 💨 Wind (slider 0-10 MW)
  - ⚙️ Generators (slider 0-10 MW)
- Clear separation: "Required (Battery)" vs "Optional (Everything Else)"

**Benefits:**
- ✅ Step 3 = educational (why this works)
- ✅ Step 4 = actionable (add optional features)
- ✅ Clear distinction between steps
- ✅ EV Chargers prominently asked

---

## Recommended Approach: **OPTION A**

### Why Collapse Into One Step?

1. **User Attention Span:** Modern UX favors fewer, richer pages over many simple pages
2. **Context Switching:** Users can see how adding solar affects total system immediately
3. **Mobile Optimization:** Scrollable single page works better than modal pagination
4. **Decision Making:** All options visible = better informed choices

### Implementation Plan

1. **Rename Step 3 → "Build Your Power Profile"**
   - Merge Step3_SimpleConfiguration + Step4_PowerRecommendation
   - Battery section: Display calculated values with brief explanation
   - Optional sections: Solar, EV, Wind, Generator as collapsible/toggle sections
   - Live total at bottom updating as user adjusts

2. **Remove Old Step 4**
   - No longer needed (merged into Step 3)

3. **Step numbering becomes:**
   - Step -1: Intro
   - Step 0: Industry Selection
   - Step 1: Use Case Questions
   - Step 2: **Build Your Power Profile** (merged 3+4)
   - Step 3: Location & Pricing
   - Step 4: Quote Summary

4. **EV Charger Section:**
   ```typescript
   <div className="bg-white border rounded-lg p-4">
     <div className="flex items-center justify-between mb-3">
       <div className="flex items-center gap-2">
         <span className="text-2xl">🚗</span>
         <h3 className="font-bold">EV Charging Stations</h3>
       </div>
       <Toggle checked={wantsEV} onChange={setWantsEV} />
     </div>
     {wantsEV && (
       <div className="space-y-2">
         <div className="flex justify-between items-center">
           <span className="text-sm">Level 2 (11kW):</span>
           <input type="number" value={level2Count} min="0" max="50" />
         </div>
         <div className="flex justify-between items-center">
           <span className="text-sm">DC Fast (50kW):</span>
           <input type="number" value={dcFast50Count} min="0" max="20" />
         </div>
         <div className="flex justify-between items-center">
           <span className="text-sm">DC Fast (150kW):</span>
           <input type="number" value={dcFast150Count} min="0" max="10" />
         </div>
       </div>
     )}
   </div>
   ```

---

## Technical Changes Required

### Files to Modify:
1. **Create: `Step3_CompletePowerProfile.tsx`**
   - Merge battery display from Step3_SimpleConfiguration
   - Add Solar toggle + slider (from old Step4)
   - Add **NEW** EV Charger toggle + quantity inputs
   - Add Wind toggle + slider
   - Add Generator toggle + slider
   - Live total system calculation at bottom

2. **Update: `SmartWizardV2.tsx`**
   - Remove case 3 (old Step4_PowerRecommendation)
   - Update case 2 to use new Step3_CompletePowerProfile
   - Adjust step numbering (case 3 becomes Location, case 4 becomes Quote)

3. **State Management:**
   - Add `evChargerConfig` state with types:
     ```typescript
     interface EVChargerConfig {
       enabled: boolean;
       level2_11kw: number;
       dcfast_50kw: number;
       dcfast_150kw: number;
       dcfast_350kw: number;
     }
     ```

4. **Power Configuration Display (Top Nav):**
   - ✅ **ALREADY FIXED** - Shows total system MW

---

## User Experience Benefits

### Before (Current):
1. Step 3: See battery recommendation, adjust sliders → Next
2. Step 4: See battery again + add renewables → Accept
3. *Confused why two steps show similar info*
4. *No EV charger question*

### After (Option A):
1. Step 3: See battery + ALL optional power sources on one page
2. Toggle/adjust everything in one place
3. See live total system calculation
4. **EV Chargers explicitly asked**
5. Click Next when satisfied

**Result:** Faster, clearer, more informed decisions.

---

## Questions for Decision

1. **Do you prefer Option A (merge) or Option B (keep separate but clarify)?**
2. **Should EV chargers be:**
   - Simple toggle with quantity sliders? ✅ (Recommended)
   - Full configuration with space calculations?
   - Advanced modal (like old AddRenewables)?
3. **Battery sliders in merged step:**
   - Keep adjustable? (User can tweak Merlin's recommendation)
   - Lock as read-only? (Force acceptance of calculated values)
4. **Should we add other power sources?**
   - Fuel cells?
   - Microturbines?
   - Grid connection options?

---

## Next Steps

**If you approve Option A:**
1. I'll create `Step3_CompletePowerProfile.tsx` with merged content
2. Add EV Charger section with quantity inputs
3. Update SmartWizardV2 step routing
4. Test complete flow: Industry → Questions → **Complete Power Profile** → Location → Quote

**Estimated Time:** 30 minutes to implement fully tested solution.

---

## Priority Fixes Already Completed ✅

1. ✅ **Next button at Step 4 bottom** - Added gradient Next button
2. ✅ **Power Configuration display** - Now shows total system MW (1.8) not just battery (0.8)
3. ✅ **State dropdown in Location step** - Fixed with placeholder "Select a state..."

---

**Your call!** Option A (merge) or Option B (separate but clearer)?
