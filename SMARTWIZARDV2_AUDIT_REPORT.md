# SmartWizardV2 Architecture Audit Report
**Generated:** November 25, 2025
**File:** `src/components/wizard/SmartWizardV2.tsx`
**Size:** 2,390 lines

---

## Executive Summary

SmartWizardV2 is a **hybrid architecture** that combines:
- V2 core logic (state management, workflow)
- V3 step components (UI rendering)
- Mixed dependency paths (some V2 steps, mostly V3 steps)

**Key Finding:** V2 is NOT a standalone component - it's a wrapper around V3 step components with V2-specific state management.

---

## Import Analysis

### Core Dependencies (Lines 1-22)
```typescript
// React & UI
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

// Utils (V2-specific)
import { generatePDF, generateExcel, generateWord } from '../../utils/quoteExport';
import { calculateEquipmentBreakdown } from '../../utils/equipmentCalculations';
import { calculateAutomatedSolarSizing, formatSolarCapacity } from '../../utils/solarSizingUtils';
import { formatSolarSavings, formatTotalProjectSavings } from '../../utils/financialFormatting';
import { formatPowerCompact } from '../../utils/powerFormatting';
import { validateFinancialCalculation } from '../../utils/calculationValidator';

// Services (V2-specific)
import { calculateFinancialMetrics } from '../../services/centralizedCalculations';
import { calculateDatabaseBaseline } from '../../services/baselineService';
import { aiStateService } from '../../services/aiStateService';
import { useCaseService } from '../../services/useCaseService';

// Advanced Analytics (V2-specific)
import {
  LoadProfileAnalyzer,
  BatteryElectrochemicalModel,
  BESSControlOptimizer,
  BESSMLForecasting,
  BESSOptimizationEngine,
  type LoadProfile,
  type BatteryModel,
  type ControlStrategy
} from '../../services/advancedBessAnalytics';
```

### Step Components (Lines 25-34) - THE HYBRID ISSUE
```typescript
// ⚠️ MIXED DEPENDENCIES - This is the problem!

// V2 Steps (3 files from steps/)
import StepIntro from './steps/Step_Intro';                    // ✅ V2
import Step3_SimpleConfiguration from './steps/Step2_SimpleConfiguration'; // ✅ V2
import Step3_AddRenewables from './steps/Step3_AddRenewables'; // ✅ V2

// V3 Steps (4 files from steps_v3/)
import Step1_IndustryTemplate from './steps_v3/Step1_IndustryTemplate'; // ⚠️ V3
import Step2_UseCase from './steps_v3/Step2_UseCase';         // ⚠️ V3
import Step4_LocationPricing from './steps_v3/Step4_LocationPricing'; // ⚠️ V3
import Step5_QuoteSummary from './steps_v3/Step5_QuoteSummary'; // ⚠️ V3

// Shared Components (version-agnostic)
import InteractiveConfigDashboard from './InteractiveConfigDashboard'; // ✅ Shared
import QuoteCompletePage from './QuoteCompletePage';          // ✅ Shared
import AIStatusIndicator from './AIStatusIndicator';          // ✅ Shared
```

---

## Step Rendering Architecture

### Current Step Flow (Lines 1555-1700)

```
Step -1: StepIntro (V2) → Intro screen
Step  0: Step1_IndustryTemplate (V3) → Industry selection
Step  1: Step2_UseCase (V3) → Custom questions
Step  2: Step3_SimpleConfiguration (V2) → BESS sizing
Step  3: Step3_AddRenewables (V2) → Solar/EV/Wind
Step  4: Step4_LocationPricing (V3) → Location & rates
Step  5: Step5_QuoteSummary (V3) → Final quote
```

**Pattern:** V2 uses V3 steps for data collection (Steps 0, 1, 4, 5) and V2 steps for configuration (Steps 2, 3).

---

## Dependency Chain Analysis

### V3 Steps Import V3 Types

**Step1_IndustryTemplate.tsx:**
```typescript
import type { BaseStepProps } from '../SmartWizardV3.types';
```

**Step2_UseCase.tsx:**
```typescript
import type { BaseStepProps } from '../SmartWizardV3.types';
```

**Step4_LocationPricing.tsx:**
```typescript
import type { BaseStepProps } from '../SmartWizardV3.types';
```

**Step5_QuoteSummary.tsx:**
```typescript
import type { BaseStepProps } from '../SmartWizardV3.types';
```

### The Type Dependency Problem

```
SmartWizardV2.tsx
  └→ Imports steps_v3/Step1_IndustryTemplate.tsx
      └→ Imports SmartWizardV3.types.ts
          └→ Defines BaseStepProps

SmartWizardV2.tsx
  └→ Does NOT import SmartWizardV3.types.ts
  └→ Uses `as any` to bypass type checking (lines 1583, 1593, 1650, etc.)
```

**Result:** V2 works but has NO type safety for V3 step props.

---

## Props Passing Analysis

### Step 0: Industry Template (Line 1577)
```typescript
<Step1_IndustryTemplate
  {...{
    selectedTemplate,
    availableUseCases,
    onSelectTemplate: setSelectedTemplate,
    onNext: () => setStep(1),
    onBack: () => setStep(-1)
  } as any}  // ⚠️ Type bypass
/>
```

### Step 1: Use Case (Line 1589)
```typescript
<Step2_UseCase
  {...{
    selectedIndustry: selectedTemplate,
    useCaseData,
    setUseCaseData,
    aiRecommendation: aiUseCaseRecommendation,
    storageSizeMW,
    durationHours,
    setStorageSizeMW,
    setDurationHours,
    onAdvanceToConfiguration: () => setStep(2)
  } as any}  // ⚠️ Type bypass
/>
```

### Step 4: Location Pricing (Line 1645)
```typescript
<Step4_LocationPricing
  {...{
    location,
    setLocation,
    electricityRate,
    setElectricityRate,
    knowsRate,
    setKnowsRate,
    storageSizeMW,
    durationHours,
    solarMW,
    windMW,
    generatorMW
  } as any}  // ⚠️ Type bypass
/>
```

**Problem:** V2 passes props that don't match V3 type definitions, using `as any` to suppress errors.

---

## State Management (V2 Specific)

SmartWizardV2 manages **all state internally** using React hooks:

```typescript
// Navigation state
const [step, setStep] = useState(-1);
const [showIntro, setShowIntro] = useState(true);
const [showCompletePage, setShowCompletePage] = useState(false);
const [wizardInitialized, setWizardInitialized] = useState(false);

// Step 0: Industry Template
const [selectedTemplate, setSelectedTemplate] = useState<string>('');
const [useTemplate, setUseTemplate] = useState(true);
const [availableUseCases, setAvailableUseCases] = useState<any[]>([]);

// Step 1: Use Case Data
const [useCaseData, setUseCaseData] = useState<{ [key: string]: any }>({});
const [previousTemplate, setPreviousTemplate] = useState<string | null>(null);

// Step 2-3: Configuration
const [storageSizeMW, setStorageSizeMW] = useState<number>(0.1);
const [durationHours, setDurationHours] = useState(4);
const [baselineResult, setBaselineResult] = useState<any>(undefined);

// Step 3: Renewables
const [includeRenewables, setIncludeRenewables] = useState(false);
const [solarMW, setSolarMW] = useState(0);
const [windMW, setWindMW] = useState(0);
const [generatorMW, setGeneratorMW] = useState(0);
// ... etc (30+ state variables)

// Step 4: Location
const [location, setLocation] = useState('');
const [electricityRate, setElectricityRate] = useState(0.12);
const [knowsRate, setKnowsRate] = useState(false);

// Costs (calculated)
const [costs, setCosts] = useState({
  equipmentCost: 0,
  installationCost: 0,
  shippingCost: 0,
  tariffCost: 0,
  annualSavings: 0,
  paybackYears: 0,
  taxCredit: 0,
  netCost: 0
});
```

**Comparison with V3:**
- V3 uses `useSmartWizard` hook for centralized state
- V2 has NO custom hook - all state declared inline
- V2 has 2,390 lines vs V3's 494 lines (component only)

---

## Critical Issues Identified

### 1. **Type Safety Violation**
- V2 uses V3 steps but bypasses type checking with `as any`
- Props passed don't match V3 interface definitions
- Runtime errors possible if V3 components change

### 2. **Import Path Confusion**
- V3 steps reference `SmartWizardV3.types.ts`
- V2 doesn't import these types
- Developers see "V3" in imports but file is V2

### 3. **Missing V2 Step Files**
Steps 0, 1, 4, 5 have NO V2 equivalents in `steps/` folder:
```
❌ steps/Step1_IndustryTemplate.tsx - DOES NOT EXIST
❌ steps/Step2_UseCase.tsx - DOES NOT EXIST
❌ steps/Step4_LocationPricing.tsx - DOES NOT EXIST
❌ steps/Step5_QuoteSummary.tsx - DOES NOT EXIST
```

### 4. **Architectural Inconsistency**
- V2 core + V3 steps = fragile hybrid
- V3 was built to replace V2 but V2 depends on V3
- Circular dependency risk

---

## Recommended Solutions

### Option A: Create V2 Type Bridge (Minimal Change)
```typescript
// Create src/components/wizard/SmartWizardV2.types.ts
export * from './SmartWizardV3.types';

// Then update all steps_v3 files:
import type { BaseStepProps } from '../SmartWizardV2.types';
```

### Option B: Create True V2 Steps (High Effort)
- Copy steps_v3 → steps/ and rename
- Update all imports to use V2 types
- Remove V3 dependencies entirely

### Option C: Deprecate V2, Use V3 Only (Recommended)
- V2 is already using V3 components
- V3 has cleaner architecture (hook-based)
- Migrate remaining V2 logic to V3
- Remove V2 entirely

### Option D: Rename Types File (Quick Fix)
```bash
mv SmartWizardV3.types.ts SmartWizard.types.ts
```
- Update all imports
- Makes types version-agnostic
- Both V2 and V3 can use same types

---

## Build Status

**Current Status:** ✅ PASSING
```
npm run build
✓ 1887 modules transformed
✓ built in 2.57s
```

**Why it works:**
- TypeScript resolves all imports correctly
- `as any` bypasses type errors
- V3 steps are self-contained components
- Runtime prop matching works despite type mismatches

**Risk:** Changes to V3 step interfaces will break V2 silently.

---

## Conclusion

SmartWizardV2 is **NOT independent** - it's a state management wrapper around V3 UI components. The "V2 vs V3" distinction is misleading:

**Reality:**
```
SmartWizardV2 = V2 State Logic + V3 UI Components + Type Hacks
SmartWizardV3 = V3 Hook + V3 UI Components + Type Safety
```

**Bottom Line:**
- V2 cannot exist without V3 step components
- V3 CAN exist without V2
- V2 should be deprecated in favor of V3
- If keeping V2, create proper type bridge


---

## Architecture Comparison: V2 vs V3

| Aspect | SmartWizardV2 | SmartWizardV3 |
|--------|---------------|---------------|
| **Total Lines** | 2,390 lines (monolithic) | 493 + 601 = 1,094 lines (split) |
| **State Management** | Inline hooks (30+ useState) | Custom hook (`useSmartWizard`) |
| **Type Safety** | `as any` bypasses | Full TypeScript types |
| **Step Components** | Mixed (V2 + V3 hybrid) | Pure V3 components |
| **Maintainability** | Low (all logic in one file) | High (separation of concerns) |
| **Dependencies** | Depends on V3 steps | Self-contained |
| **Architecture** | Procedural | Hook-based pattern |
| **Status** | ✅ Working (with hacks) | ⚠️ Incomplete hook implementation |

### Code Complexity

**SmartWizardV2.tsx:**
- 2,390 lines in single file
- 30+ state variables declared inline
- Calculation logic mixed with rendering
- Duplicate code for cost calculations
- Hard to test (no separation)

**SmartWizardV3.tsx + useSmartWizard.ts:**
- 493 lines component (rendering only)
- 601 lines hook (state + logic)
- Clean separation of concerns
- Testable hook in isolation
- Type-safe throughout

### Verdict

**SmartWizardV2 is V3 components wrapped in V2 state logic.**

This explains why:
- V2 "rollback" was requested - V3 implementation was incomplete
- V2 "works better" - it has mature state management
- But V2 uses V3 step files - they're the same UI components
- "Broken dependencies" are just naming confusion - V2 imports V3 types

**The real situation:**
```
V2 = Mature state management + V3 UI components (hybrid)
V3 = Incomplete hook + V3 UI components (intended architecture)
```

**Why V2 was requested:**
- V3's `useSmartWizard` hook is incomplete/buggy
- V2's inline state management is battle-tested
- But both use THE SAME step components from steps_v3/

