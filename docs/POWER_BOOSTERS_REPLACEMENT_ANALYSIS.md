# Power Boosters Section Replacement - Analysis & Recommendations

## ✅ COMPLETED CHANGES

### 1. Power Boosters Section Replaced
- **Before**: Clickable configuration cards for Solar & EV Charging
- **After**: Read-only status cards showing user selections from Step 2 (MerlinInsightModal)
- **Location**: `src/components/wizard/v5/steps/Step3FacilityDetails.tsx` (lines ~1703-1882)
- **Status**: ✅ Completed

### 2. Props Removed from WizardV5
- Removed `onSolarConfigClick` and `onEVConfigClick` props
- Removed `solarKW` and `evChargerCount` props
- Configuration now happens exclusively in Step 2 modal
- **Status**: ✅ Completed

---

## 📋 QUESTIONS TO ADDRESS

### Question 1: How Does Solar Auto-Configuration Work?

**Current Implementation:**
- Solar sizing is calculated in `Step4MagicFit.tsx` based on `wantsSolar` from `opportunityPreferences`
- The system uses a rule of thumb: **~100 sq ft per kW** (from `recommendationEngine.ts` line 175)
- Formula: `estimatedCapacityKW = Math.floor(rooftopSqFt / 100)`

**How It Works:**
1. User selects Solar in Step 2 (MerlinInsightModal) → `wantsSolar = true`
2. User provides `rooftopSquareFootage` in Step 3 (facility details)
3. System calculates: `solarKW = rooftopSquareFootage / 100`
4. Example: 50,000 sq ft rooftop → ~500 kW solar capacity

**Recommendation:**
- ✅ This is working correctly
- We should **automatically calculate solar size** in Step 4 when:
  - `wantsSolar === true` AND
  - `rooftopSquareFootage` is provided
- If no rooftop square footage is provided, use fallback sizing (e.g., based on baselineKW * 1.2)

**Parking Lot Space:**
- Currently, only rooftop space is used for solar calculations
- Parking lot/canopy space could be added using `totalFacilitySquareFootage` as a fallback
- Ground-mount solar requires ~200 sq ft per kW (includes spacing, access roads, setbacks)
- **Question for you**: Should we ask about parking lot/canopy space separately, or use `totalFacilitySquareFootage` as a proxy?

---

### Question 2: Duplicate Rooftop Solar Questions

**Current Questions in Database:**
1. `totalFacilitySquareFootage` - Total building/canopy square footage (general facility size)
   - Question: "Total Facility Square Footage"
   - Help: "Total square footage including all buildings, canopies, and structures"
   - Min: 1,000 | Max: 500,000

2. `rooftopSquareFootage` - Usable rooftop area specifically for solar
   - Question: "Rooftop Square Footage (Main Building)"
   - Help: "Usable rooftop area on main building for solar panels. Typically 50-70% of total roof area is usable."
   - Min: 500 | Max: 1,000,000

3. `existingSolarKW` - Existing solar capacity (filtered out when `rooftopSquareFootage` exists)

**Analysis:**
- These serve **different purposes**:
  - `totalFacilitySquareFootage` = General facility size (for power calculations)
  - `rooftopSquareFootage` = Solar-specific sizing (for solar capacity calculation)
- However, this may be **confusing to users** - why ask both?

**Recommendations:**

**Option A: Keep Both (Recommended)**
- Clarify the difference in question text:
  - `totalFacilitySquareFootage`: "Total facility square footage (buildings + canopies + parking structures)"
  - `rooftopSquareFootage`: "Usable rooftop area for solar panels (typically 50-70% of total roof area)"

**Option B: Consolidate**
- Use only `rooftopSquareFootage` and calculate `totalFacilitySquareFootage` as an estimate
- Formula: `totalFacilitySquareFootage ≈ rooftopSquareFootage / 0.6` (assuming 60% of facility is roof)

**Option C: Make One Optional**
- Make `totalFacilitySquareFootage` optional if `rooftopSquareFootage` is provided
- Use `rooftopSquareFootage * 1.5` as estimate for total facility size

**My Recommendation:** **Option A** - Keep both but improve question clarity and help text. They serve different purposes and both are valuable for accurate calculations.

---

### Question 3: Icons - Switch to Clip Art Style

**Current Implementation:**
- Icons are emojis (📐, ⚡, ⏰, ☀️, etc.) in `getIconAndColor()` function
- Location: `src/components/wizard/v5/steps/Step3FacilityDetails.tsx` (lines 1158-1203)

**Available Assets:**
- Check `src/assets/images/` folder for available clip art icons
- User mentioned icons are "in the folder" - need to locate specific icon files

**Recommendation:**
1. Create an icon mapping file that maps field names to image paths
2. Update `getIconAndColor()` to return image paths instead of emoji
3. Update `QuestionCard` component to render `<img>` instead of emoji text

**Action Needed:**
- Please provide the folder path for clip art icons, or confirm they should be in `src/assets/images/`
- Should I scan the assets folder and create a mapping based on what's available?

---

## 📝 NEXT STEPS

1. ✅ **COMPLETED**: Power Boosters section replaced with read-only status cards
2. ⏳ **PENDING**: Review and update rooftop solar questions (awaiting your decision on Option A/B/C)
3. ⏳ **PENDING**: Update icons to clip art style (need icon folder location)
4. ⏳ **PENDING**: Document solar auto-configuration logic in Step4MagicFit

---

## 💡 SOLAR AUTO-CONFIGURATION IMPLEMENTATION NOTES

**Current Logic in Step4MagicFit.tsx:**
```typescript
const wantsSolar = opportunityPreferences?.wantsSolar || false;
const recommendedSolarKW = userSolarKW > 0 
  ? userSolarKW 
  : (wantsSolar && recommendation ? (recommendation.solarMW * 1000) : ...);
```

**Recommended Enhancement:**
```typescript
// Auto-calculate from rooftop square footage if available
const rooftopSqFt = useCaseData?.rooftopSquareFootage || 0;
const autoSolarKW = wantsSolar && rooftopSqFt > 0 
  ? Math.floor(rooftopSqFt / 100) // 100 sq ft per kW
  : 0;
const recommendedSolarKW = userSolarKW > 0 
  ? userSolarKW 
  : autoSolarKW > 0 
    ? autoSolarKW 
    : (wantsSolar ? fallbackSolarKW : 0);
```

This would automatically size solar based on rooftop space when:
- User selected solar in Step 2
- User provided rooftop square footage in Step 3

