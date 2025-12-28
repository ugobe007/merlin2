# Wizard V5 Architecture Map & Bottom Nav Investigation

## 🎯 Current Issue
Bottom navigation bar persists in Wizard V5 despite removal efforts.

---

## 📐 Architecture Overview

### Entry Points

```
App.tsx
├── /wizard route → WizardV5 (direct render, no wrapper)
└── BessQuoteBuilder → ModalManager → WizardV5 (modal wrapper: fixed inset-0 z-50)
```

### Wizard V5 Component Tree

```
WizardV5.tsx (Main Orchestrator)
├── Props:
│   ├── initialUseCase?: string
│   ├── onComplete?: (quote: any) => void
│   ├── onCancel?: () => void
│   ├── onClose?: () => void (legacy)
│   ├── onFinish?: (quote?: any) => void (legacy)
│   └── onOpenAdvanced?: () => void
│
├── State Management:
│   ├── currentStep: 0-4 (5 steps total)
│   ├── wizardState: WizardState (location, industry, facility, system, quote)
│   ├── isTransitioning: boolean
│   └── Modal states (solar, EV, etc.)
│
├── Step Components (renderStep function):
│   ├── case 0: Step1LocationGoals.tsx
│   ├── case 1: Step2IndustrySelect.tsx
│   ├── case 2: Step3FacilityDetails.tsx
│   ├── case 3: Step4MagicFit.tsx
│   └── case 4: Step5QuoteReview.tsx
│
└── Layout Structure:
    ├── Header (step indicator, progress bar)
    ├── Content Area (scrollable, data-wizard-content attribute)
    └── ❌ NO BOTTOM NAV (removed, comment confirms)
```

---

## 📁 File Structure & Dependencies

### Core Wizard V5 Files
```
src/components/wizard/v5/
├── WizardV5.tsx                    ← Main orchestrator (467 lines)
├── design-system/
│   ├── index.ts
│   └── merlinDesignSystem.ts
├── steps/
│   ├── Step1LocationGoals.tsx      ← Step 1: Location & Goals
│   ├── Step2IndustrySelect.tsx     ← Step 2: Industry Selection
│   ├── Step3FacilityDetails.tsx    ← Step 3: Facility Questions
│   ├── Step4MagicFit.tsx           ← Step 4: System Sizing
│   └── Step5QuoteReview.tsx        ← Step 5: Quote Results
└── components/
    ├── SolarOpportunityModal.tsx
    ├── SolarConfigModal.tsx
    ├── EVChargingConfigModal.tsx
    └── MerlinInputs.tsx
```

### Legacy Components (DO NOT USE)
```
src/components/wizard/legacy/
├── v4-active/
│   └── shared/
│       └── WizardBottomNav.tsx     ⚠️ LEGACY - Fixed bottom nav component
└── [other legacy folders]
```

---

## 🔍 Step-by-Step Component Flow

### Step 1: Location & Goals
**File**: `src/components/wizard/v5/steps/Step1LocationGoals.tsx`

**Props Received**:
- `state: string`
- `zipCode: string`
- `goals: string[]`
- `electricityRate: number`
- `peakSunHours?: number`
- `solarRating?: string`
- `onStateChange: (v: string) => void`
- `onZipCodeChange: (v: string) => void`
- `onGoalsChange: (v: string[]) => void`
- `onElectricityRateChange: (rate: number) => void`
- `onContinue: () => void`
- `onOpenAdvanced?: () => void`

**State Updates**: Updates `wizardState.state`, `wizardState.zipCode`, `wizardState.goals`, `wizardState.electricityRate`

**Navigation**: Has its own "Continue" button that calls `onContinue()` → `setCurrentStep(1)`

---

### Step 2: Industry Selection
**File**: `src/components/wizard/v5/steps/Step2IndustrySelect.tsx`

**Props Received**:
- `selectedIndustry: string`
- `onIndustrySelect: (slug: string, name: string) => void`
- `solarOpportunity?: boolean`
- `onSolarClick?: () => void`
- `state?: string`
- `electricityRate?: number`
- `peakSunHours?: number`
- `solarRating?: string`

**State Updates**: Updates `wizardState.selectedIndustry`, `wizardState.industryName`

**Navigation**: Has its own "Continue" button that calls `nextStep()` internally (passed as prop or handled in WizardV5)

---

### Step 3: Facility Details
**File**: `src/components/wizard/v5/steps/Step3FacilityDetails.tsx`

**Props Received**:
- `selectedIndustry: string`
- `industryName: string`
- `useCaseData: Record<string, any>`
- `onDataChange: (field: string, value: any) => void`
- `onSolarConfigClick?: () => void`
- `onEVConfigClick?: () => void`
- `solarKW?: number`
- `evChargerCount?: number`
- `state?: string`
- `zipCode?: string`
- `goals?: string[]`
- `electricityRate?: number`
- `batteryKW?: number`
- `durationHours?: number`
- `generatorKW?: number`
- `gridConnection?: string`
- `onOpenAdvanced?: () => void`

**State Updates**: Updates `wizardState.useCaseData` field by field

**Navigation**: Has its own "Continue" button

---

### Step 4: Magic Fit (System Sizing)
**File**: `src/components/wizard/v5/steps/Step4MagicFit.tsx`

**Props Received**:
- `selectedIndustry: string`
- `useCaseData: Record<string, any>`
- `state: string`
- `goals: string[]`
- `electricityRate: number`
- `batteryKW: number`
- `durationHours: number`
- `solarKW: number`
- `generatorKW: number`
- `gridConnection: string`
- `onBatteryChange: (v: number) => void`
- `onDurationChange: (v: number) => void`
- `onSolarChange: (v: number) => void`
- `onGeneratorChange: (v: number) => void`
- `onGridConnectionChange: (v: string) => void`
- `onContinue: () => void`
- `onOpenAdvanced?: () => void`

**State Updates**: Updates `wizardState.batteryKW`, `wizardState.durationHours`, `wizardState.solarKW`, `wizardState.generatorKW`, `wizardState.gridConnection`

**Navigation**: Has "Build My Quote" button that calls `onContinue()` → `nextStep()`

---

### Step 5: Quote Review
**File**: `src/components/wizard/v5/steps/Step5QuoteReview.tsx`

**Props Received**:
- `state: string`
- `selectedIndustry: string`
- `industryName: string`
- `goals: string[]`
- `useCaseData: Record<string, any>`
- `batteryKW: number`
- `durationHours: number`
- `solarKW: number`
- `generatorKW: number`
- `gridConnection: string`
- `electricityRate: number`
- `quoteResult: any | null`
- `onQuoteGenerated: (quote: any) => void`

**State Updates**: Updates `wizardState.quoteResult`

**Navigation**: Has floating navigation arrows (left/right side, not bottom)

---

## 🚨 Bottom Nav Investigation Results

### ✅ Confirmed Removed from WizardV5.tsx
- Line 461: `{/* REMOVED: Fixed bottom navigation buttons - each step handles its own navigation */}`
- No imports of `WizardBottomNav` in WizardV5.tsx
- CSS rules added to hide legacy bottom navs (lines 361-368, index.css lines 285-289)

### ⚠️ Legacy Component Still Exists
- `src/components/wizard/legacy/v4-active/shared/WizardBottomNav.tsx` (exists, but should not be imported)

### 🔍 Potential Sources
1. **Browser Cache** - Most likely cause given aggressive hiding rules
2. **Legacy Step Components** - Check if any step components import `WizardBottomNav`
3. **Modal Wrapper** - ModalManager wraps WizardV5 in `fixed inset-0` div, but shouldn't add nav
4. **Service Worker** - May be serving cached version

---

## 🔧 Global Configuration & Presets

### Wizard State Defaults
```typescript
const DEFAULT_STATE: WizardState = {
  state: '',
  zipCode: '',
  goals: [],
  selectedIndustry: '',
  industryName: '',
  facilitySubtype: '',
  useCaseData: {},
  batteryKW: 500,
  durationHours: 4,
  solarKW: 0,
  generatorKW: 0,
  gridConnection: 'on-grid',
  quoteResult: null,
  electricityRate: 0.12,
};
```

### Initial Use Case (URL Parameter)
- `?industry=car-wash` → Pre-selects industry, skips to step 2
- `initialUseCase` prop → Same behavior
- Source: URL params or `initialUseCase` prop

### Design System
- Colors: `COLORS` from `./design-system`
- Step definitions: `WIZARD_STEPS` from `./design-system`
- All styling via Tailwind classes + design system tokens

---

## 📊 Component Dependencies Graph

```
WizardV5
├── Step Components (self-contained, handle own navigation)
│   ├── Step1LocationGoals → No dependencies on other steps
│   ├── Step2IndustrySelect → No dependencies on other steps
│   ├── Step3FacilityDetails → No dependencies on other steps
│   ├── Step4MagicFit → Calls baselineService, uses wizardState
│   └── Step5QuoteReview → Calls quoteEngine, uses wizardState
│
├── Modals (separate, controlled by WizardV5 state)
│   ├── SolarOpportunityModal
│   ├── SolarConfigModal
│   └── EVChargingConfigModal
│
└── Services (called by step components)
    ├── baselineService.ts (Step 4)
    ├── quoteEngine.ts (Step 5)
    └── useCaseService.ts (Step 3)
```

---

## 🎯 Next Steps for Debugging

1. **Check Step Component Imports**
   ```bash
   grep -r "WizardBottomNav" src/components/wizard/v5/
   ```

2. **Check Browser DevTools**
   - Inspect element at bottom of screen
   - Check computed styles
   - Verify which component is rendering it

3. **Clear All Caches**
   - Browser cache
   - Service worker cache
   - Vite build cache (`rm -rf node_modules/.vite dist`)

4. **Verify Component Tree**
   - React DevTools: Confirm only WizardV5 and step components render
   - No legacy components in tree

5. **Check CSS Specificity**
   - Ensure hiding rules have higher specificity than legacy nav styles
   - Verify `data-wizard-content` attribute is present

---

## 📝 Notes

- **WizardV5 is standalone** - No dependencies on legacy wizard components
- **Each step handles its own navigation** - No global bottom nav needed
- **Legacy WizardBottomNav exists but should not be imported** - Keep for reference only
- **ModalManager wrapper** - Just adds `fixed inset-0 z-50` div, doesn't add nav

