# CRITICAL BUGS ANALYSIS - December 14, 2025
## User-Reported Issues in StreamlinedWizard (Hotel Flow)

---

## 🚨 CRITICAL ISSUES FOUND

### Issue 1: Wrong Component Integration ❌
**Problem:** I integrated AcceptCustomizeModal into `HotelWizard.tsx`, BUT the actual production flow uses `StreamlinedWizard` with `initialUseCase="hotel"`

**Evidence:**
- `HotelEnergy.tsx` line 1317: `<StreamlinedWizard initialUseCase="hotel" />`
- Comment line 15: "REFACTORED Dec 2025: Now uses StreamlinedWizard with initialUseCase='hotel'"

**Impact:** My Phase 2.1 work was on the WRONG component - it's not even being used!

**Root Cause:** I didn't verify the actual production flow before making changes

---

### Issue 2: User Inputs NOT Recorded in Wizard ❌
**Problem:** "Merlin's Insight" modal shows values that don't match user's actual inputs

**User Reports:**
- Entered specific values for hotel (rooms, amenities, monthly bill)
- Modal shows "450 kW" and "1.3 MWh" (defaults)
- Power profile shows "139%" (over-provisioned)

**Code Location:** `StreamlinedWizard.tsx` lines 1033-1047
```typescript
const calc = wizard.centralizedState?.calculated || {};
const basePeakKW = calc.totalPeakDemandKW || calc.recommendedBatteryKW || 0;

// ALWAYS show recommended values in modal, not current config
const recBatteryKW = calc.recommendedBatteryKW || Math.round(peakKW * 0.4);
const recBatteryKWh = calc.recommendedBatteryKWh || recBatteryKW * 4;
```

**Root Cause Analysis:**
1. `wizard.centralizedState?.calculated` is either:
   - Empty (`{}`)
   - Populated with default values instead of user inputs
   - Not being updated when user fills out forms

2. The fallback logic uses `peakKW * 0.4` (static formula) instead of ACTUAL user inputs

3. No synchronization between:
   - Section 2 form inputs (rooms, amenities, monthly bill)
   - `centralizedState.calculated` object
   - "Merlin's Insight" modal display

**Expected Behavior:**
```typescript
// User enters: 150 rooms, upscale hotel, pool, restaurant
// Expected calc:
const calc = {
  totalPeakDemandKW: 450,  // Based on 150 rooms * 3 kW/room
  recommendedBatteryKW: 315,  // 70% of peak (user's target savings %)
  recommendedBatteryKWh: 1260,  // 315 kW * 4 hours
  recommendedSolarKW: 441  // From user's solar checkbox
};
```

**Actual Behavior:**
```typescript
// Modal shows defaults because calc is empty or wrong:
const calc = {};  // Empty object!
const recBatteryKW = Math.round(0 * 0.4);  // 0 kW → Falls back to 100 kW minimum
```

---

### Issue 3: No Accept/Customize Choice at Step 4 ❌
**Problem:** Step 4 ("Review & Configure Your System") goes straight to configuration WITHOUT presenting user with choice

**User Feedback:**
> "we need to present users at step 4 with 2 OPTIONS! They can accept Merlin's recommendations (which need to be summarized before I accept them)---- OR---- Configure my own with Merlin's help! This is logic. Users arrive at this page (step 4) and need instruction!"

**Current Flow (WRONG):**
1. User completes Section 3 (Goals)
2. Clicks "Continue to Quote" button
3. → **Goes directly to Section 4 configuration sliders**
4. No summary, no choice, no context

**Expected Flow (CORRECT):**
1. User completes Section 3 (Goals)
2. Clicks "Generate Quote" button
3. → **AcceptCustomizeModal appears with:**
   - Merlin's recommendation summary (BESS, Solar, Payback, Savings)
   - **Two buttons:**
     - "Accept Merlin AI Setup" → Skip to Section 5 (Final Quote)
     - "Customize Configuration" → Go to Section 4 (Sliders)
4. User makes informed choice

**Code Location:** `StreamlinedWizard.tsx` Section 3 → Section 4 transition
- Currently: Direct navigation with no modal
- Needed: AcceptCustomizeModal integration (like I did for HotelWizard, but in StreamlinedWizard)

---

### Issue 4: Power Profile Shows 139% Over-Provisioning ❌
**Problem:** "Power covered: 139%" indicator shows user has MORE than enough power

**Root Cause:**
1. Wizard is using DEFAULT values (315 kW BESS + 441 kW solar = 756 kW total)
2. But user's ACTUAL peak demand is ~450 kW (from form inputs)
3. 756 / 450 = 168% (user sees 139% in screenshot, suggests slightly different calc)

**Why This Happens:**
- `wizard.centralizedState.calculated.totalPeakDemandKW` is not being populated from user inputs
- Sliders default to TEMPLATE values instead of CALCULATED values
- No real-time sync between:
  - Form inputs (Section 2)
  - Calculated power demand
  - Configuration sliders (Section 4)
  - Power profile widget

---

## 🔍 DATA FLOW INVESTIGATION

### Where User Inputs Get Lost:

**Section 2: Facility Details**
```typescript
// User fills out custom questions:
- numberOfRooms: 150
- hotelClass: "upscale"
- hasPool: true
- hasRestaurant: true
- state: "Nevada"
```

**Expected:** These should trigger calculation via `useCasePowerCalculations.ts`
```typescript
import { calculateHotelPowerDetailed } from '@/services/useCasePowerCalculations';

const result = calculateHotelPowerDetailed({
  rooms: 150,
  hotelClass: 'upscale',
  amenities: { pool: true, restaurant: true },
  // ... other inputs
});

// Result should be:
{
  totalPeakKW: 450,
  dailyKWh: 4320,
  monthlyKWh: 129600,
  // ...
}
```

**Actual:** This calculation either:
1. Never happens
2. Happens but result doesn't get stored in `centralizedState.calculated`
3. Gets overwritten by template defaults

---

### Hook Flow Analysis:

**`useStreamlinedWizard.ts`** (Lines 329-369)
```typescript
// This useEffect should sync useCaseData → centralizedState
useEffect(() => {
  if (!wizardState.useCaseData) return;
  
  // Extract industry data
  const industryData = wizardState.useCaseData?.industryData || {};
  
  setCentralizedState(prev => ({
    ...prev,
    calculated: {
      // THIS is where calculated values should be set!
      totalPeakDemandKW: industryData.peakDemandKW,
      recommendedBatteryKW: industryData.bessKW,
      recommendedBatteryKWh: industryData.bessKWh,
      // ...
    }
  }));
}, [wizardState.useCaseData]);
```

**Problem:** `wizardState.useCaseData` is populated from DATABASE template, NOT from user's actual form inputs!

---

## 🎯 ROOT CAUSE SUMMARY

### The Fundamental Issue:
**StreamlinedWizard uses database-driven USE CASE TEMPLATES with DEFAULT values, but it DOESN'T RECALCULATE when user provides actual facility data.**

**What Should Happen:**
1. User selects "Hotel" use case → Load template with 150 rooms default
2. User changes to 200 rooms, adds pool, selects Nevada → **RECALCULATE**
3. New calculation: 200 rooms × 3 kW/room + pool (50 kW) = 650 kW peak
4. Update `centralizedState.calculated` with new values
5. Show "Merlin's Insight" with ACTUAL calculated values (650 kW, not 450 kW default)
6. Section 4 sliders default to CALCULATED values (not template values)

**What Actually Happens:**
1. User selects "Hotel" → Load template (150 rooms default = 450 kW)
2. User changes to 200 rooms → **NOTHING HAPPENS** (calc never runs)
3. `centralizedState.calculated` still has 450 kW default
4. "Merlin's Insight" shows 450 kW (wrong!)
5. Section 4 sliders show template values (wrong!)
6. Power profile shows over-provisioning because of mismatch

---

## ✅ REQUIRED FIXES

### Fix 1: Trigger Calculation After Section 2 Form Completion
**File:** `useStreamlinedWizard.ts`

**Add:**
```typescript
useEffect(() => {
  // When user completes Section 2 (Facility Details), recalculate
  if (wizardState.currentSection === 2 && wizardState.customAnswers) {
    const answers = wizardState.customAnswers;
    
    // Call SSOT calculation function
    if (wizardState.selectedIndustry === 'hotel') {
      const result = calculateHotelPowerDetailed({
        rooms: answers.roomCount || 150,
        hotelClass: answers.hotelClass || 'midscale',
        amenities: {
          pool: answers.hasPool || false,
          restaurant: answers.hasRestaurant || false,
          // ... other amenities
        },
        operations: {
          avgOccupancy: answers.occupancyRate || 70,
          // ...
        },
        electricityRate: getStateRate(wizardState.state),
        demandCharge: getStateDemandCharge(wizardState.state),
      });
      
      // Update centralizedState with ACTUAL calculated values
      setCentralizedState(prev => ({
        ...prev,
        calculated: {
          totalPeakDemandKW: result.totalPeakKW,
          recommendedBatteryKW: Math.round(result.totalPeakKW * 0.7),  // 70% default
          recommendedBatteryKWh: Math.round(result.totalPeakKW * 0.7 * 4),
          recommendedSolarKW: answers.interestInSolar ? calculateSolarCapacity(result.totalPeakKW) : 0,
          dailyKWh: result.dailyKWh,
          monthlyKWh: result.monthlyKWh,
        }
      }));
    }
  }
}, [wizardState.currentSection, wizardState.customAnswers, wizardState.selectedIndustry]);
```

### Fix 2: Show AcceptCustomizeModal After Section 3
**File:** `StreamlinedWizard.tsx`

**Current (Lines 1200-1250):**
```typescript
{/* Section 3: Goals */}
<button onClick={() => updateSection(4)}>
  Continue to Configuration
</button>
```

**Change To:**
```typescript
{/* Section 3: Goals */}
<button onClick={handleGenerateQuote}>
  📊 Generate My Quote
</button>

{/* Add AcceptCustomizeModal */}
{showAcceptCustomizeModal && quoteResult && (
  <AcceptCustomizeModal
    isOpen={showAcceptCustomizeModal}
    onClose={() => setShowAcceptCustomizeModal(false)}
    onAccept={() => {
      // Accept AI → Skip to Section 5 (Final Quote)
      setShowAcceptCustomizeModal(false);
      updateSection(5);
    }}
    onCustomize={() => {
      // Customize → Go to Section 4 (Sliders)
      setShowAcceptCustomizeModal(false);
      updateSection(4);
    }}
    quoteResult={quoteResult}
    verticalName="Hotel"  // Or dynamic based on selectedIndustry
    facilityDetails={{
      name: wizardState.businessName,
      size: `${wizardState.customAnswers.roomCount} rooms`,
      location: wizardState.state,
    }}
    systemSummary={{
      bessKW: Math.round(centralizedState.calculated.recommendedBatteryKW),
      bessKWh: Math.round(centralizedState.calculated.recommendedBatteryKWh),
      solarKW: centralizedState.calculated.recommendedSolarKW,
      paybackYears: quoteResult.financials.paybackYears,
      annualSavings: quoteResult.financials.annualSavings,
    }}
    colorScheme="purple"  // StreamlinedWizard brand color
  />
)}
```

### Fix 3: Sync Configuration Sliders with Calculated Values
**File:** `useStreamlinedWizard.ts`

**Current Problem:** Sliders default to template values
**Fix:** Initialize sliders from `centralizedState.calculated` after Section 3

```typescript
useEffect(() => {
  // When entering Section 4, initialize sliders from calculations
  if (wizardState.currentSection === 4 && centralizedState.calculated.recommendedBatteryKW) {
    setWizardState(prev => ({
      ...prev,
      batteryKW: centralizedState.calculated.recommendedBatteryKW,
      batteryKWh: centralizedState.calculated.recommendedBatteryKWh,
      solarKW: centralizedState.calculated.recommendedSolarKW || 0,
    }));
  }
}, [wizardState.currentSection, centralizedState.calculated]);
```

### Fix 4: Update "Merlin's Insight" Modal to Use Actual Calculations
**File:** `StreamlinedWizard.tsx` lines 1033-1047

**Current (WRONG):**
```typescript
const recBatteryKW = calc.recommendedBatteryKW || Math.round(peakKW * 0.4);
```

**Change To:**
```typescript
// CRITICAL: Ensure calc has values from user inputs, not defaults
const recBatteryKW = calc.recommendedBatteryKW || 0;
const recBatteryKWh = calc.recommendedBatteryKWh || 0;

// If values are still 0, user hasn't completed form - don't show modal
if (recBatteryKW === 0) {
  console.warn('⚠️ Merlin Insight: No calculated values available');
  return null;  // Don't show modal with 0 kW
}
```

---

## 🧪 TESTING CHECKLIST

### Smoke Test for Fixes:

1. **Start Fresh:**
   - Go to https://merlin2.fly.dev/verticals/hotel
   - Click "Get Your Quote"

2. **Section 2: Facility Details**
   - Enter: 200 rooms
   - Select: Upscale hotel
   - Check: Pool, Restaurant
   - Select: Nevada
   - Monthly Bill: $50,000

3. **Verify Calculation Triggered:**
   - Open browser console
   - Should see: `📊 [CALC] Hotel power calculated: { totalPeakKW: 650, ... }`

4. **Section 3: Goals**
   - Primary Goal: Cost Savings
   - Target Savings: 70%
   - Add Solar: Yes

5. **Click "Generate My Quote":**
   - ✅ "Merlin's Insight" should show: **650 kW** (not 450 kW default)
   - ✅ Battery recommendation: **455 kW** (70% of 650 kW)
   - ✅ Solar recommendation: Based on user's checkbox

6. **Click "Got it, let's continue!":**
   - ✅ **AcceptCustomizeModal should appear** (NEW!)
   - ✅ Shows summary: 455 kW BESS, X kW solar, Y years payback
   - ✅ Two buttons: "Accept AI" and "Customize"

7. **If user clicks "Accept AI":**
   - ✅ Skip Section 4, go directly to Section 5 (Final Quote)

8. **If user clicks "Customize":**
   - ✅ Go to Section 4 (Configuration sliders)
   - ✅ Sliders default to **455 kW** (calculated value, not template)
   - ✅ Power profile shows **100%** (not 139% over-provisioned)

---

## 📝 IMPLEMENTATION PRIORITY

### Immediate (Today - Dec 14):
1. ✅ Fix 1: Trigger calculation after Section 2 form completion
2. ✅ Fix 4: Update "Merlin's Insight" to use actual calculations

### High Priority (Today/Tomorrow):
3. ✅ Fix 2: Integrate AcceptCustomizeModal into StreamlinedWizard
4. ✅ Fix 3: Sync sliders with calculated values

### Testing:
5. ✅ Smoke test with multiple use cases (hotel, car wash, EV charging)
6. ✅ Verify power profile accuracy
7. ✅ Test Accept vs Customize paths

---

## 🎯 SUCCESS CRITERIA

- [ ] User enters 200 rooms → "Merlin's Insight" shows ACTUAL 650 kW (not 450 kW default)
- [ ] AcceptCustomizeModal appears after Section 3, before Section 4
- [ ] "Accept AI" button skips configuration, goes to final quote
- [ ] "Customize" button goes to Section 4 with sliders at calculated values
- [ ] Power profile shows 100% (accurate provisioning, not over/under)
- [ ] All use cases work correctly (hotel, car wash, EV charging, office, etc.)

---

**End of Critical Bugs Analysis**
