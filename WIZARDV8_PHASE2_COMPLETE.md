# WizardV8 MagicFit Design — Phase 2 Complete

**Date:** March 1, 2026  
**Session:** MagicFit Visual Design Implementation

## ✅ Completed: MagicFit Design Applied to Step4V8

### Design Implementation

**File:** `src/wizard/v8/steps/Step4V8.tsx`  
**Backup:** `src/wizard/v8/steps/Step4V8.old.tsx` (old tier cards preserved)

### Key Features Implemented

#### 1. Bold Gradient Headlines

```
STARTER:     Fresh green gradient (#34d399 → #10b981 → #059669)
PERFECT FIT: Royal purple gradient (#c084fc → #a855f7 → #9333ea → #7c3aed)
BEAST MODE:  Fire gradient (#fcd34d → #fbbf24 → #f97316 → #ea580c → #dc2626)
```

#### 2. Hero Annual Savings Number

- **5xl font size** with glow effects
- Color-matched to tier theme
- Pop-in animation on load
- "Annual Savings" label above

#### 3. Equipment Strip (Emoji Icons)

```
🔋 BESS capacity (shown in MWh)
☀️ Solar capacity (shown in kW)
⚡ EV chargers (L2 + DCFC + HPC count)
🔥 Generator capacity (shown in kW)
```

#### 4. Financial Summary

- Total Investment
- Federal ITC (30%) in emerald green
- Net Cost in tier accent color
- Clean divider line between sections

#### 5. ROI Metrics (3-column grid)

```
Payback:    X.X years
10-Yr ROI:  XXX%
25-Yr Gain: $XXX
```

#### 6. Visual Effects

- **Hover:** Card lifts 6px with color-matched glow
- **Active:** Scale to 0.98 with stronger glow
- **Selected:** Pulse animation (0-5px glow variation)
- **Checkmark:** Bounce-in animation when selected
- **BEST VALUE Badge:** Pulsing glow on Perfect Fit tier

#### 7. Card Hierarchy

```
PERFECT FIT (Index 1):
├── BEST VALUE banner at top
├── Purple accent throughout
├── Stronger box shadow (60px purple glow)
└── Pre-selected by default (selectedTierIndex: 1)

STARTER (Index 0):
├── Green theme
└── "Get your feet wet" tagline

BEAST MODE (Index 2):
├── Orange theme
└── "Go all in" tagline
```

## 🎨 Style Architecture

### Custom CSS Injected

- **Card animations:** 11 keyframe animations
- **Gradient text effects:** 3 headline gradients with drop-shadow
- **Glow effects:** 3 savings glow variations
- **Equipment chips:** Consistent micro-component styling
- **Pulse animations:** Recommended badge + selected state

### Responsive Grid

```css
grid-cols-1        /* Mobile: Stack vertically */
lg:grid-cols-3     /* Desktop: 3 columns side-by-side */
gap-5              /* 1.25rem spacing between cards */
```

## 📊 Data Structure

### QuoteTier Interface Usage

```typescript
interface QuoteTier {
  label: string; // "Starter" | "Recommended" | "Complete"
  multiplier: number; // 0.7 | 1.0 | 1.5
  bessKW: number; // Battery power capacity
  bessKWh: number; // Battery energy capacity
  solarKW: number; // Solar array size
  annualSavings: number; // Hero number for each tier
  paybackYears: number; // ROI metric
  // ... other fields
}
```

### Financial Calculations

```typescript
// Simple estimates (will be replaced with SSOT + margin policy)
totalInvestment = bessKWh * 250 + solarKW * 1500;
federalITC = totalInvestment * 0.3;
netCost = totalInvestment - federalITC;
twentyFiveYearProfit = annualSavings * 25 - netCost;
tenYearROI = ((annualSavings * 10) / netCost - 1) * 100;
```

**⚠️ Note:** These are placeholder calculations. Phase 5 will integrate real SSOT calculations with margin policy.

## 🖥️ User Experience Flow

### Step 4 States

1. **Loading** (`tiersStatus === "fetching"`)
   - Purple spinner animation
   - "Generating your configurations..." message

2. **Error** (`tiersStatus === "error"` or `!tiers`)
   - Red alert triangle icon
   - Error message
   - "Go Back to Profile" button

3. **Success** (`tiers` array with 3 elements)
   - 3 MagicFit cards rendered
   - Middle card (Perfect Fit) pre-selected
   - Hover/click interactions enabled

### Navigation

- **Back button:** Goes to Step 3 (Profile)
- **Continue button:** Goes to Step 5 (Quote)
  - Disabled if no tier selected
  - Purple gradient when enabled

## 🔄 Comparison: Old vs New

| Feature               | Old Step4V8         | New Step4V8 (MagicFit)       |
| --------------------- | ------------------- | ---------------------------- |
| **Headline**          | Simple text         | Bold gradient text with glow |
| **Hero Metric**       | ROI %               | Annual Savings $             |
| **Equipment Display** | Text list           | Emoji chip strip             |
| **Card Style**        | Flat with border    | Gradient background + glow   |
| **Hover Effect**      | Border color change | Lift + shadow                |
| **Selected State**    | Border highlight    | Pulse glow + checkmark badge |
| **Perfect Fit Badge** | "Recommended" text  | Animated "BEST VALUE" banner |
| **Financial Detail**  | Basic               | Investment → ITC → Net Cost  |
| **ROI Metrics**       | Single payback      | 3 metrics (Payback/ROI/Gain) |

## 📝 Technical Details

### Component Props

```typescript
interface Props {
  state: WizardState; // Includes tiers, tiersStatus, selectedTierIndex
  actions: WizardActions; // Includes selectTier(), goToStep(), goBack()
}
```

### Tier Selection

```typescript
// User clicks card → selectTier(tierIndex)
actions.selectTier(0); // STARTER
actions.selectTier(1); // PERFECT FIT
actions.selectTier(2); // BEAST MODE
```

### Button Styles by Tier

```typescript
TIER_CONFIG = {
  0: { buttonClass: "emerald-400 bg-emerald-500/10" },
  1: { buttonClass: "gradient from-violet-600 to-purple-600" },
  2: { buttonClass: "orange-400 bg-orange-500/10" },
};
```

## 🚧 Known Limitations (To Be Fixed in Phase 5)

1. **Placeholder Financials**
   - Using simple `bessKWh * 250` instead of SSOT
   - No margin policy applied yet
   - ITC hardcoded at 30% (should be dynamic)

2. **Missing Tier Generation**
   - Tiers not auto-generated on entering Step 4
   - Need to implement `generateTiers()` in useWizardV8.ts

3. **No Step 3.5 Integration**
   - Addon configs (solar/EV/generator) not passed to tier calculation yet
   - Need Step3_5V8.tsx for user to configure addons

4. **State Incentives**
   - Not yet integrated (V6 has this feature)

## 🎯 Next Steps

### Phase 3: Step 3.5 Creation

**File to create:** `src/wizard/v8/steps/Step3_5V8.tsx`

**Functionality:**

- Conditional rendering (only if wantsSolar/wantsEV/wantsGenerator)
- Solar config (kW slider)
- Generator config (kW + fuel type)
- EV config (L2/DCFC/HPC counts)

### Phase 4: Navigation Logic

**File to modify:** `src/wizard/v8/useWizardV8.ts`

**Changes:**

```typescript
// In goToStep():
if (step === 4 && currentStep === 3) {
  if (needsAddonConfig) {
    goToStep(3.5); // Redirect to addon config first
  } else {
    await generateTiers(); // Go directly to Step 4
  }
}
```

### Phase 5: Tier Generation + Margin Policy

**File to modify:** `src/wizard/v8/useWizardV8.ts`

**Function to create:** `generateTiers()`

**Steps:**

1. Call SSOT `calculateQuote()` with all configs
2. Apply `applyMarginPolicy()` to get `sellPriceTotal`
3. Create 3 tiers with multipliers (0.7 / 1.0 / 1.5)
4. Dispatch `SET_TIERS` action
5. Navigate to Step 4

---

**Dev Server:** http://localhost:5184/wizard-v8  
**Status:** ✅ MagicFit design live and ready to test!

**Test the cards:**

1. Navigate to `/wizard-v8`
2. Complete Steps 1-3
3. You should see the new MagicFit design on Step 4
4. Try hovering/clicking cards
5. Check the animations and selected states
