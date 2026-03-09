# WizardV8 Add-on Flow Implementation Plan

**Date:** March 1, 2026  
**Requested By:** User  
**Status:** 🚧 IN PROGRESS

---

## 📋 Requirements

### User Request:

> "if I choose solar in step 1 --> prompt me to fill out the solar questions at the end of the questionnaire. if I chose power generators, where do I set them? If I chose ev charging where do I set them? suggestion---> step 3+ is an intemediary step that captures these values, then passes them to step 4 and 5. step 5---> please use MagicFit here. you changed it back to the old format."

### Translation:

1. **Step 1:** User selects add-on preferences (solar/EV/generator) ✅ DONE
2. **Step 3:** Industry questionnaire (existing) ✅ EXISTS
3. **Step 4 (NEW):** Add-ons configuration - only shown if any addon flags are true
   - Solar: kW size, array type (rooftop/canopy/ground)
   - Generator: kW size, fuel type (diesel/natural-gas/dual-fuel), runtime hours
   - EV Charging: L2/DCFC/HPC counts
4. **Step 5:** Use V6 MagicFit design (STARTER/PERFECT FIT/BEAST MODE)
5. **Step 6:** Quote results (existing)

---

## 🏗️ Architecture Changes

### Current Flow (V8):

```
Step 1 (Location) → Step 2 (Industry) → Step 3 (Questionnaire)
→ Step 4 (Goals) → Step 5 (Tier Selection) → Step 6 (Quote Results)
```

### New Flow (V8 Enhanced):

```
Step 1 (Location + Add-on Preferences)
↓
Step 2 (Industry)
↓
Step 3 (Questionnaire)
↓
Step 4 (Add-ons Config) ← ONLY if wantsSolar || wantsEVCharging || wantsGenerator
↓  (otherwise skip)
Step 5 (MagicFit - STARTER/PERFECT FIT/BEAST MODE)
↓
Step 6 (Quote Results)
```

---

## ✅ Completed

### 1. State Fields Added

**File:** `src/wizard/v8/wizardState.ts`

```typescript
// Step 1: Add-on Preferences
wantsSolar: boolean;
wantsEVCharging: boolean;
wantsGenerator: boolean;

// Step 4: Add-on Configuration ← ADDED
solarKW: number;
generatorKW: number;
generatorFuelType: "diesel" | "natural-gas" | "dual-fuel";
level2Chargers: number;
dcfcChargers: number;
hpcChargers: number;
```

### 2. Actions Added

```typescript
// Action type
| { type: "SET_ADDON_CONFIG"; config: Partial<{...}> }

// Method (needs to be added to useWizardV8.ts)
setAddonConfig(config: Partial<{solarKW, generatorKW, ...}>)
```

### 3. Step 1 UI

**File:** `src/wizard/v8/steps/Step1V8.tsx`

✅ 3 checkboxes for addon preferences (solar/EV/generator)
✅ Visual feedback with color-coded checkmarks

---

## 🚧 TODO

### Task 1: Create Step4V8.tsx (Add-ons Configuration)

**Location:** `src/wizard/v8/steps/Step4V8.tsx`

**Design:**

```tsx
{
  /* Only shown if any addon flags are true */
}
{
  (state.wantsSolar || state.wantsEVCharging || state.wantsGenerator) && (
    <div>
      <h2>Configure Your Add-ons</h2>

      {/* Solar Section */}
      {state.wantsSolar && (
        <div>
          <h3>☀️ Solar PV Configuration</h3>
          <input
            type="number"
            value={state.solarKW}
            onChange={(e) => actions.setAddonConfig({ solarKW: Number(e.target.value) })}
            placeholder="Solar array size (kW)"
          />
          <select onChange={/* array type */}>
            <option value="rooftop">Rooftop</option>
            <option value="canopy">Canopy</option>
            <option value="ground">Ground Mount</option>
          </select>
        </div>
      )}

      {/* Generator Section */}
      {state.wantsGenerator && (
        <div>
          <h3>🔋 Backup Generator Configuration</h3>
          <input
            type="number"
            value={state.generatorKW}
            onChange={(e) => actions.setAddonConfig({ generatorKW: Number(e.target.value) })}
            placeholder="Generator capacity (kW)"
          />
          <select
            value={state.generatorFuelType}
            onChange={(e) => actions.setAddonConfig({ generatorFuelType: e.target.value })}
          >
            <option value="natural-gas">Natural Gas</option>
            <option value="diesel">Diesel</option>
            <option value="dual-fuel">Dual Fuel</option>
          </select>
        </div>
      )}

      {/* EV Charging Section */}
      {state.wantsEVCharging && (
        <div>
          <h3>⚡ EV Charging Configuration</h3>
          <div>
            <label>Level 2 Chargers (7-22 kW)</label>
            <input
              type="number"
              value={state.level2Chargers}
              onChange={(e) => actions.setAddonConfig({ level2Chargers: Number(e.target.value) })}
            />
          </div>
          <div>
            <label>DC Fast Chargers (50-150 kW)</label>
            <input
              type="number"
              value={state.dcfcChargers}
              onChange={(e) => actions.setAddonConfig({ dcfcChargers: Number(e.target.value) })}
            />
          </div>
          <div>
            <label>High Power Chargers (250-350 kW)</label>
            <input
              type="number"
              value={state.hpcChargers}
              onChange={(e) => actions.setAddonConfig({ hpcChargers: Number(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Smart Defaults:**

- Solar: Calculate recommended kW based on facility size (from Step 3 answers)
- Generator: 1.25x peak load (25% reserve margin per LADWP/NEC)
- EV Chargers: Industry-specific defaults (office: 12 L2, hotel: 8 L2 + 2 DCFC, etc.)

---

### Task 2: Update useWizardV8.ts

**Add setAddonConfig method:**

```typescript
const setAddonConfig = useCallback(
  (config: Partial<{ solarKW: number; generatorKW: number /*...*/ }>) => {
    dispatch({ type: "SET_ADDON_CONFIG", config });
  },
  []
);
```

**Update step flow logic:**

```typescript
const goToStep = useCallback(
  (step: number) => {
    // After Step 3, check if add-ons config is needed
    if (step === 4) {
      const needsAddonConfig = state.wantsSolar || state.wantsEVCharging || state.wantsGenerator;
      if (!needsAddonConfig) {
        // Skip Step 4, go directly to Step 5 (MagicFit)
        dispatch({ type: "GO_TO_STEP", step: 5 });
        return;
      }
    }
    dispatch({ type: "GO_TO_STEP", step });
  },
  [state.wantsSolar, state.wantsEVCharging, state.wantsGenerator]
);
```

**Update generateQuote() to pass add-on configs:**

```typescript
const result = await calculateQuote({
  storageSizeMW: state.batteryKW / 1000,
  durationHours: state.durationHours,
  location: state.location.state,
  electricityRate: stateData.rate,
  useCase: state.industry,

  // Add-ons (NEW)
  solarMW: state.solarKW / 1000,
  generatorMW: state.generatorKW / 1000,
  generatorFuelType: state.generatorFuelType,
  // EV chargers calculated as total kW
  evChargingKW: state.level2Chargers * 11 + state.dcfcChargers * 150 + state.hpcChargers * 350,
});
```

---

### Task 3: Replace Step5V8.tsx with MagicFit Design

**Source:** Copy from `src/components/wizard/v6/steps/Step5MagicFit.tsx`

**Key Changes Needed:**

1. Import V8 types instead of V6:

   ```typescript
   import type { WizardState, WizardActions, QuoteTier } from "../wizardState";
   ```

2. Use V8 state structure:

   ```typescript
   // V6 uses state.tiers
   // V8 uses state.tiers (same)
   ```

3. Keep V6 design elements:
   - **STARTER** headline (green gradient, "Get your feet wet")
   - **PERFECT FIT** headline (purple gradient, "Just right for you")
   - **BEAST MODE** headline (orange gradient, "Go all in")
   - Equipment strip with emoji icons (🔋 ☀️ ⚡ 🔥)
   - Full financial summary (Investment, ITC, Net Cost)
   - ROI metrics (Payback, 10-Year ROI, 25-Year Profit)
   - Card hover animations + click feedback
   - Selected state glow
   - Checkmark animation

4. Update tier generation to use V8's tier structure

---

### Task 4: Update WizardV8Page.tsx

**Add Step 4 import:**

```typescript
import Step4V8 from "./steps/Step4V8";
```

**Add conditional rendering:**

```tsx
{
  state.currentStep === 4 && <Step4V8 state={state} actions={actions} />;
}

{
  state.currentStep === 5 && <Step5V8 state={state} actions={actions} />;
}
```

**Update progress indicators:**

```typescript
const STEP_LABELS = [
  "Location",
  "Industry",
  "Profile",
  "Add-ons", // NEW - only shown if addon flags are true
  "MagicFit",
  "Quote",
];
```

---

## 🎯 Implementation Order

1. **✅ DONE:** Add state fields to wizardState.ts
2. **✅ DONE:** Add SET_ADDON_CONFIG action type
3. **TODO:** Add setAddonConfig method to useWizardV8.ts
4. **TODO:** Create Step4V8.tsx (Add-ons Configuration)
5. **TODO:** Update step flow logic in useWizardV8.ts
6. **TODO:** Replace Step5V8.tsx with MagicFit design from V6
7. **TODO:** Update WizardV8Page.tsx to render Step 4 conditionally
8. **TODO:** Update quote generation to pass add-on configs
9. **TODO:** Test full flow

---

## 🧪 Testing Checklist

- [ ] Step 1: Select solar → Verify wantsSolar flag set
- [ ] Step 3: Complete questionnaire
- [ ] Step 4: Verify add-ons config shown for solar
- [ ] Step 4: Enter solar kW → Verify state updated
- [ ] Step 5: Verify MagicFit design (STARTER/PERFECT FIT/BEAST MODE)
- [ ] Step 5: Select tier → Verify selection persists
- [ ] Step 6: Verify quote includes solar (kW, cost, savings)
- [ ] Flow: If no add-ons selected in Step 1 → Skip Step 4

---

## 📝 Notes

- **MagicFit Design:** Copy visual design from V6 Step5MagicFit but use V8 state structure
- **Smart Defaults:** Calculate recommended sizes based on Step 3 facility data
- **Skip Logic:** If no add-ons selected, skip Step 4 entirely
- **Quote Integration:** All add-on configs pass through to calculateQuote() SSOT

---

**Next Action:** Implement setAddonConfig method + create Step4V8.tsx
