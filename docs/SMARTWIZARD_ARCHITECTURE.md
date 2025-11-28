# SmartWizardV2 Architecture & Workflow

## Overview

`SmartWizardV2.tsx` is a 3,161-line React component that implements a guided BESS quote builder wizard. It supports two distinct flows (Legacy 6-Step and New 7-Step) and manages complex state for industry templates, equipment configuration, financial calculations, and quote generation.

---

## File Location
```
/src/components/wizard/SmartWizardV2.tsx
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SmartWizardV2.tsx                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         IMPORTS (Lines 1-45)                        │   │
│  │  - React hooks (useState, useEffect, useRef, useMemo, useCallback) │   │
│  │  - Utils: quoteExport, equipmentCalculations, solarSizing, etc.    │   │
│  │  - Services: centralizedCalculations, baselineService, powerProfile│   │
│  │  - Step Components: Step1-7 from steps_v3/, legacy steps           │   │
│  │  - Widgets: PowerMeterWidget, PowerProfileIndicator                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    STATE DECLARATIONS (Lines 74-920)                │   │
│  │                                                                     │   │
│  │  NAVIGATION (74-100):                                              │   │
│  │    step, showIntro, showCompletePage, showAIWizard, isQuickstart   │   │
│  │                                                                     │   │
│  │  TEMPLATE/USE CASE (95-130):                                       │   │
│  │    selectedTemplate, availableUseCases, useCaseData, userGoals     │   │
│  │    use7StepFlow (feature flag)                                     │   │
│  │                                                                     │   │
│  │  BESS CONFIG (137-170):                                            │   │
│  │    storageSizeMW, durationHours, baselineResult                    │   │
│  │                                                                     │   │
│  │  FINANCIALS (144-155):                                             │   │
│  │    equipmentCost, installationCost, annualSavings, paybackYears    │   │
│  │    roi10Year, roi25Year, npv, irr                                  │   │
│  │                                                                     │   │
│  │  RENEWABLES/GENERATION (792-845):                                  │   │
│  │    includeRenewables, solarMW, windMW, generatorMW                 │   │
│  │    solarSpaceConfig, evChargerConfig, windConfig, generatorConfig  │   │
│  │                                                                     │   │
│  │  LOCATION/PRICING (843-920):                                       │   │
│  │    location, electricityRate, selectedInstallation/Shipping/Finance│   │
│  │    costs (composite object), equipmentBreakdown                    │   │
│  │                                                                     │   │
│  │  ANALYTICS (907-920):                                              │   │
│  │    loadPatternAnalysis, optimizationResults, controlStrategy       │   │
│  │    forecastData, batteryModelData, mpcStrategy                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    EFFECTS (Lines 189-1463)                         │   │
│  │                                                                     │   │
│  │  Line 189: Clear useCaseData when template changes                 │   │
│  │  Line 199: Fetch use case details when template selected           │   │
│  │  Line 275: Fetch use case defaults from database configs           │   │
│  │  Line 296: Fetch available use cases on mount                      │   │
│  │  Line 314: Handle skipIntro/startInAdvancedMode props             │   │
│  │  Line 405: Calculate default baseline after template load         │   │
│  │  Line 468: Recalculate config when useCaseData changes            │   │
│  │  Line 850: Calculate financial metrics                             │   │
│  │  Line 925: Update equipment breakdown                              │   │
│  │  Line 968: Calculate costs when equipment changes                  │   │
│  │  Line 998: Run advanced analytics                                  │   │
│  │  Line 1030: Power profile gamification                            │   │
│  │  Line 1463: Update costs composite object                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    HANDLERS (Lines 1368-2046)                       │   │
│  │                                                                     │   │
│  │  calculateCosts (1368): Master cost calculation (useCallback)      │   │
│  │  analyzeConfiguration (1491): AI suggestions engine                │   │
│  │  handleOpenAIWizard (1852): Open AI wizard modal                   │   │
│  │  handleNext (1857): Step navigation forward                        │   │
│  │  handleBack (1883): Step navigation backward                       │   │
│  │  handleDownloadPDF/Excel/Word (1908/1945/1982): Export handlers    │   │
│  │  handleSaveAndComplete (2019): Final save action                   │   │
│  │  canProceed (2046): Step validation                                │   │
│  │  getStepTitle (2115): Dynamic step titles                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    renderStep() (Lines 2139-2477)                   │   │
│  │                                                                     │   │
│  │  if (use7StepFlow) → NEW 7-STEP WIZARD                             │   │
│  │  else             → LEGACY 6-STEP WIZARD                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    RENDER (Lines 2477-3161)                         │   │
│  │                                                                     │   │
│  │  - QuoteCompletePage (if showCompletePage)                         │   │
│  │  - Modal wrapper with header/body/PowerMeterWidget                 │   │
│  │  - BatteryConfigModal (if showBatteryConfigModal)                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Two Wizard Flows

### Feature Flag
```typescript
const [use7StepFlow, setUse7StepFlow] = useState(false);
```

### Legacy 6-Step Flow (Default)
```
Step -1 → Step 0 → Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Complete
 Intro   Industry  UseCase  Config   Power    Location  Summary
                   Questions         Recommend
```

| Step | Component | Purpose |
|------|-----------|---------|
| -1 | `StepIntro` | Welcome screen |
| 0 | `Step1_IndustryTemplate` | Select industry template |
| 1 | `Step2_UseCase` | Answer custom questions |
| 2 | `Step3_SimpleConfiguration` | Battery size/duration |
| 3 | `Step4_PowerRecommendation` | Solar/Wind/Generator options |
| 4 | `Step5_LocationPricing` | Location & electricity rate |
| 5 | `Step6_QuoteSummary` | Final quote with exports |

### New 7-Step Flow (use7StepFlow=true)
```
Step -1 → Step 0 → Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6
 Intro   Industry+ UseCase  Extras   Goals   Power    Prelim   Final
         Location  Questions (Solar)         Summary  Quote    Quote
```

| Step | Component | Purpose |
|------|-----------|---------|
| -1 | `StepIntro` | Welcome screen |
| 0 | `Step1_IndustryAndLocation` | Industry + ZIP combined |
| 1 | `Step2_UseCase` | Custom questions |
| 2 | `Step3_AddGoodies` | Solar/EV/Generator/Wind extras |
| 3 | `Step4_GoalsAndInterests` | User goals selection |
| 4 | `Step5_PowerRecommendation` | Complete power profile |
| 5 | `Step6_PreliminaryQuote` | Preliminary quote |
| 6 | `Step7_FinalQuote` | Final quote + downloads |

---

## Import Dependencies

### Utility Functions
```typescript
import { generatePDF, generateExcel, generateWord } from '../../utils/quoteExport';
import { calculateEquipmentBreakdown } from '../../utils/equipmentCalculations';
import { calculateAutomatedSolarSizing, formatSolarCapacity } from '../../utils/solarSizingUtils';
import { formatSolarSavings, formatTotalProjectSavings } from '../../utils/financialFormatting';
import { formatPowerCompact } from '../../utils/powerFormatting';
import { validateFinancialCalculation } from '../../utils/calculationValidator';
```

### Services (Core Business Logic)
```typescript
import { calculateFinancialMetrics } from '../../services/centralizedCalculations';      // ✅ PROTECTED
import { calculateDatabaseBaseline } from '../../services/baselineService';              // ✅ PROTECTED
import { calculatePowerProfile } from '../../services/powerProfileService';
import { aiStateService } from '../../services/aiStateService';
import { useCaseService } from '../../services/useCaseService';
import { advancedBessAnalytics } from '../../services/advancedBessAnalytics';           // ML/AI analytics
```

### Step Components (Legacy)
```typescript
import StepIntro from './steps/Step_Intro';
import Step3_SimpleConfiguration from './steps/Step2_SimpleConfiguration';
import Step4_AddRenewables from './steps/Step3_AddRenewables';
```

### Step Components (V3 - New)
```typescript
import Step1_IndustryTemplate from './steps_v3/Step1_IndustryTemplate';
import Step2_UseCase from './steps_v3/Step2_UseCase';
import Step4_PowerRecommendation from './steps_v3/Step4_PowerRecommendation';
import Step5_LocationPricing from './steps_v3/Step4_LocationPricing';
import Step6_QuoteSummary from './steps_v3/Step5_QuoteSummary';
import Step1_IndustryAndLocation from './steps_v3/Step1_IndustryAndLocation';
import Step3_AddGoodies from './steps_v3/Step3_AddGoodies';
import Step4_GoalsAndInterests from './steps_v3/Step4_GoalsAndInterests';
import Step5_PowerRecommendation from './steps_v3/Step5_PowerRecommendation';
import Step6_PreliminaryQuote from './steps_v3/Step6_PreliminaryQuote';
import Step7_FinalQuote from './steps_v3/Step7_FinalQuote';
```

### Widgets/Modals
```typescript
import BatteryConfigModal from '../modals/BatteryConfigModal';
import QuoteCompletePage from './QuoteCompletePage';
import { PowerMeterWidget } from './widgets/PowerMeterWidget';
import PowerProfileIndicator from './PowerProfileIndicator';
```

---

## State Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐       ┌─────────────────┐       ┌──────────────────────┐
│ Step 0:     │       │ Step 1:         │       │ Step 2:              │
│ Template    │──────▶│ Custom Questions│──────▶│ Baseline Calculation │
│ Selection   │       │                 │       │                      │
└─────────────┘       └─────────────────┘       └──────────────────────┘
      │                       │                          │
      ▼                       ▼                          ▼
selectedTemplate ──▶ useCaseData ──────────▶ calculateDatabaseBaseline()
                          │                          │
                          │                          ▼
                          │                 ┌──────────────────┐
                          │                 │ storageSizeMW    │
                          │                 │ durationHours    │
                          │                 │ solarMW          │
                          │                 │ baselineResult   │
                          │                 └──────────────────┘
                          │                          │
                          ▼                          ▼
              ┌────────────────────────────────────────────────┐
              │           CUSTOM QUESTION FIELDS               │
              │ (Captured from database, used in calculations) │
              ├────────────────────────────────────────────────┤
              │ existingSolarKW → NET peak demand calculation  │
              │ existingEVChargers → NET peak demand           │
              │ wantsSolar → Step 3 Solar section visibility   │
              │ wantsEVCharging → Step 3 EV section visibility │
              │ peakDemandKW → Baseline sizing input           │
              │ [industryField] → Industry-specific sizing     │
              └────────────────────────────────────────────────┘
                                     │
                                     ▼
              ┌────────────────────────────────────────────────┐
              │        NET PEAK DEMAND CALCULATION             │
              │              (Lines 428-453)                   │
              ├────────────────────────────────────────────────┤
              │ existingSolar = existingSolarKW || existingSolarKw
              │ existingEV = existingEVChargers || existingEvPorts
              │                                                │
              │ solarOffset = existingSolar * 0.3 (capacity)   │
              │ evLoad = existingEV * 7.2 kW                   │
              │ netPeakDemand = peakDemand - solarOffset + evLoad
              └────────────────────────────────────────────────┘
                                     │
                                     ▼
              ┌────────────────────────────────────────────────┐
              │         FINANCIAL CALCULATIONS                 │
              │            (Line 851 useEffect)                │
              ├────────────────────────────────────────────────┤
              │ calculateFinancialMetrics({                    │
              │   storageSizeMW,                               │
              │   durationHours,                               │
              │   electricityRate,                             │
              │   solarMW,                                     │
              │   ...                                          │
              │ })                                             │
              │ → equipmentCost, installationCost              │
              │ → annualSavings, paybackYears                  │
              │ → roi10Year, roi25Year, npv, irr               │
              └────────────────────────────────────────────────┘
                                     │
                                     ▼
              ┌────────────────────────────────────────────────┐
              │         EQUIPMENT BREAKDOWN                    │
              │           (Line 925 useEffect)                 │
              ├────────────────────────────────────────────────┤
              │ calculateEquipmentBreakdown({                  │
              │   storageSizeMW,                               │
              │   durationHours,                               │
              │   solarMW,                                     │
              │   windMW,                                      │
              │   generatorMW,                                 │
              │   ...                                          │
              │ })                                             │
              │ → Battery containers, inverters, transformers  │
              │ → Solar panels, wind turbines, generators      │
              └────────────────────────────────────────────────┘
                                     │
                                     ▼
              ┌────────────────────────────────────────────────┐
              │              QUOTE EXPORT                      │
              │         (handleDownloadPDF/Excel/Word)         │
              ├────────────────────────────────────────────────┤
              │ generatePDF/Excel/Word({                       │
              │   storageSizeMW, durationHours,                │
              │   solarMW, windMW, generatorMW,                │
              │   location, industryTemplate,                  │
              │   totalProjectCost, annualSavings, etc.        │
              │ }, equipmentBreakdown)                         │
              └────────────────────────────────────────────────┘
```

---

## Key useEffect Chains

### 1. Template Selection Chain
```
selectedTemplate changes
    ↓
useEffect (Line 189): Clear useCaseData if template changed
    ↓
useEffect (Line 199): Fetch use case details from database
    ↓
useCaseDetailsRef.current populated
    ↓
useEffect (Line 275): Apply database defaults to useCaseData
    ↓
useEffect (Line 405): Calculate default baseline
```

### 2. Configuration Calculation Chain
```
useCaseData changes (user answers questions)
    ↓
useEffect (Line 468): calculateConfig()
    ↓
calculateDatabaseBaseline(selectedTemplate, scale, useCaseData)
    ↓
Sets: storageSizeMW, durationHours, solarMW, baselineResult
    ↓
useEffect (Line 850): calculateFinancials()
    ↓
calculateFinancialMetrics(...)
    ↓
Sets: equipmentCost, installationCost, annualSavings, paybackYears, etc.
```

### 3. Cost Update Chain
```
storageSizeMW, durationHours, solarMW, windMW, generatorMW changes
    ↓
useEffect (Line 925): Update equipment breakdown
    ↓
calculateEquipmentBreakdown(...)
    ↓
useEffect (Line 968): Calculate costs
    ↓
calculateCosts() callback
    ↓
useEffect (Line 1463): Update costs state object
```

---

## Step Component Props Reference

### Step2_UseCase (Custom Questions)
```typescript
<Step2_UseCase
  useCase={useCaseDetailsRef.current}        // Use case from database
  answers={useCaseData}                       // Current answers
  onUpdateAnswers={setUseCaseData}           // Update handler
  onNext={() => setStep(2)}
  onBack={() => setStep(0)}
/>
```

### Step3_AddGoodies (Extras)
```typescript
<Step3_AddGoodies
  solarMWp={solarMW}
  evChargerCount={evChargerCount}
  generatorKW={generatorMW * 1000}
  windMWp={windMW}
  onUpdateSolar={setSolarMW}
  onUpdateEV={setEvChargerCount}
  onUpdateGenerator={(kW) => setGeneratorMW(kW / 1000)}
  onUpdateWind={setWindMW}
  onNext={() => setStep(3)}
  onBack={() => setStep(1)}
  showSolar={showSolarSection}               // ✅ NEW: Conditional display
  showEV={showEVSection}                     // ✅ NEW: Conditional display
/>
```

### Step6_QuoteSummary (Final Quote)
```typescript
<Step6_QuoteSummary
  storageSizeMW={storageSizeMW}
  durationHours={durationHours}
  solarMW={solarMW}
  windMW={windMW}
  generatorMW={generatorMW}
  location={location}
  industryTemplate={selectedTemplate}
  equipmentCost={costs.equipmentCost}
  installationCost={costs.installationCost}
  annualSavings={costs.annualSavings}
  paybackYears={costs.paybackYears}
  taxCredit30Percent={costs.taxCredit}
  netCostAfterTaxCredit={costs.netCost}
  onEditConfiguration={() => setStep(3)}
  onNext={handleNext}
  onBack={handleBack}
  industryData={{ selectedIndustry: selectedTemplate, useCaseData }}
/>
```

---

## Potential Issues & Watch Points

### 1. State Synchronization
- `useCaseData` must be cleared when `selectedTemplate` changes
- `useCaseDetailsRef.current` must be loaded before Step 1 renders
- Financial calculations depend on equipment breakdown being calculated first

### 2. Conditional Step 3 Display
- `wantsSolar` and `wantsEVCharging` from custom questions control visibility
- Default to `true` if fields don't exist (backward compatibility)
- Falls back to showing both Solar and EV if undefined

### 3. Field Name Compatibility
```typescript
// Line 431-432: Handle both old and new field names
const existingSolar = useCaseData.existingSolarKW || useCaseData.existingSolarKw || 0;
const existingEV = useCaseData.existingEVChargers || useCaseData.existingEvPorts || 0;
```

### 4. Protected Services
Do NOT modify these services (per copilot-instructions.md):
- `calculateFinancialMetrics()` in `centralizedCalculations.ts`
- `calculateDatabaseBaseline()` in `baselineService.ts`
- `advancedFinancialModeling.ts`
- `unifiedPricingService.ts`

### 5. Duplicate Import Risk
```typescript
// Note: Step4_PowerRecommendation and Step5_PowerRecommendation 
// are imported from different paths - potential naming confusion
import Step4_PowerRecommendation from './steps_v3/Step4_PowerRecommendation';
import Step5_PowerRecommendation from './steps_v3/Step5_PowerRecommendation';
```

---

## Files Structure

```
src/components/wizard/
├── SmartWizardV2.tsx              # Main wizard component (this file)
├── QuoteCompletePage.tsx          # Final completion page
├── PowerProfileIndicator.tsx      # Gamification indicator
├── InteractiveConfigDashboard.tsx # Advanced config (unused in current flow)
├── steps/                         # Legacy step components
│   ├── Step_Intro.tsx
│   ├── Step2_SimpleConfiguration.tsx
│   └── Step3_AddRenewables.tsx
├── steps_v3/                      # New step components
│   ├── Step1_IndustryTemplate.tsx
│   ├── Step1_IndustryAndLocation.tsx
│   ├── Step2_UseCase.tsx
│   ├── Step3_AddGoodies.tsx       # ✅ Modified: Added showSolar/showEV props
│   ├── Step3_Configuration.tsx
│   ├── Step3_PowerGapResolution.tsx
│   ├── Step4_GoalsAndInterests.tsx
│   ├── Step4_LocationPricing.tsx
│   ├── Step4_PowerRecommendation.tsx
│   ├── Step5_PowerRecommendation.tsx
│   ├── Step5_QuoteSummary.tsx
│   ├── Step6_PreliminaryQuote.tsx
│   ├── Step7_FinalQuote.tsx
│   ├── Step_Intro.tsx
│   └── modules/                   # Reusable step modules
└── widgets/
    └── PowerMeterWidget.tsx       # Power status bar widget
```

---

## Testing Checklist

When making changes to SmartWizardV2, verify:

1. **Template Selection**
   - [ ] Selecting a template loads use case details
   - [ ] Changing templates clears previous useCaseData
   - [ ] Custom questions render correctly

2. **Custom Questions**
   - [ ] Answers persist through step navigation
   - [ ] Field names match database (existingSolarKW, wantsSolar, etc.)
   - [ ] NET peak demand calculates correctly

3. **Step 3 Conditional Display**
   - [ ] Solar section shows when wantsSolar = 'Yes' or undefined
   - [ ] Solar section hides when wantsSolar = 'No'
   - [ ] EV section shows when wantsEVCharging = 'Yes' or undefined
   - [ ] EV section hides when wantsEVCharging = 'No'

4. **Calculations**
   - [ ] Baseline calculates after questions answered
   - [ ] Financial metrics update after configuration changes
   - [ ] Equipment breakdown reflects all components

5. **Quote Export**
   - [ ] PDF downloads correctly
   - [ ] Excel downloads correctly
   - [ ] Word downloads correctly
   - [ ] All equipment appears in exports

---

*Last Updated: November 28, 2025*
