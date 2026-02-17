# Architecture Proposal: Central Calculator with Conditions Buffer

## Executive Summary

**Goal**: Create a clean, modular architecture where:
1. **Template variables** load from database into **Central Calculator** as **"conditions"**
2. **Conditions** act as a **buffer layer** between database and wizard
3. **Workflow** is broken into **logical modules** that are easily edited and verified
4. **TrueQuote button** and **battery status bar** integrated into Vineet's design
5. **No breaking changes** to existing logic

---

## Current Architecture Analysis

### ✅ What Works Well

1. **Database → Services Flow**:
   ```
   Database (calculation_constants, use_case_configurations)
     ↓
   calculationConstantsService.ts (getConstant, getConstantsByCategory)
     ↓
   centralizedCalculations.ts (getCalculationConstants)
     ↓
   TrueQuoteEngineV2.ts (processQuote)
   ```

2. **SSOT Compliance**:
   - `calculation_constants` table = SSOT for all constants
   - `industryTemplates.ts` = SSOT for industry factors
   - `TrueQuoteEngine-Solar.ts` = SSOT for solar calculations
   - `centralizedCalculations.ts` = SSOT for financial metrics

3. **Existing Components**:
   - ✅ `TrueQuoteVerifyBadge` - Calculator button with verification modal
   - ✅ `BatteryProgressIndicator` - Visual progress bar in sidebar
   - ✅ `ValueTicker` - Real-time savings display

### ⚠️ Current Gaps

1. **No Unified "Conditions" Layer**:
   - Template variables scattered across multiple services
   - No single place to load all use case conditions
   - Wizard makes direct DB calls (no buffer)

2. **Step Navigation (a, b, c)**:
   - Questions are organized by `section` (facility, operations, energy, solar)
   - No explicit "Step 3a, 3b, 3c" structure
   - Could benefit from clearer sub-step organization

3. **Template Variable Loading**:
   - Variables loaded on-demand (multiple DB calls)
   - No pre-loading of all conditions for a use case
   - No caching layer for conditions

---

## Proposed Architecture

### 🎯 Core Concept: "Use Case Conditions"

**Conditions** = All template variables, factors, and configuration for a specific use case, loaded once and cached.

```typescript
interface UseCaseConditions {
  // Use case metadata
  useCaseSlug: string;
  industry: string;
  
  // Load calculation factors (from calculation_constants)
  loadFactors: {
    baseFactor: number;        // kW per unit (room, sqft, etc.)
    loadFactor: number;         // Diversity factor (0-1)
    peakDemandMultiplier: number;
  };
  
  // Solar factors (from solarTemplates.ts or DB)
  solarFactors: {
    roofUsableFactor: number;   // 0.65 for car_wash
    carportUsableFactor: number; // 1.0
    solarDensity: number;       // 0.020 kW/sqft
  };
  
  // Financial constants (from calculation_constants)
  financialConstants: {
    federalITCRate: number;     // 0.30
    discountRate: number;        // 0.08
    projectLifetimeYears: number; // 25
  };
  
  // Equipment factors (from use_case_configurations)
  equipmentFactors: Record<string, number>;
  
  // Question defaults (from custom_questions)
  questionDefaults: Record<string, any>;
  
  // Caching metadata
  loadedAt: Date;
  version: string;
  source: 'database' | 'fallback';
}
```

### 📦 New Service: `useCaseConditionsService.ts`

**Purpose**: Load all conditions for a use case once, cache them, and provide to Central Calculator and Wizard.

```typescript
/**
 * Use Case Conditions Service
 * ============================
 * 
 * Loads ALL template variables for a use case into a single "conditions" object.
 * Acts as a buffer between database and wizard/calculator.
 * 
 * Benefits:
 * - Single DB query per use case (performance)
 * - Cached for 15 minutes (reduces DB load)
 * - Easy to verify (all conditions in one place)
 * - Easy to edit (change DB, conditions auto-update)
 * - No breaking changes (wizard still works, just faster)
 */

import { getConstant, getConstantsByCategory } from './calculationConstantsService';
import { getSolarTemplate } from './solarTemplates';
import { getIndustryTemplate } from './industryTemplates';
import { UseCaseService } from './useCaseService';

export interface UseCaseConditions {
  // ... (see above)
}

const conditionsCache = new Map<string, { data: UseCaseConditions; expiresAt: Date }>();

/**
 * Load all conditions for a use case
 * This is the SINGLE ENTRY POINT for use case configuration
 */
export async function loadUseCaseConditions(
  useCaseSlug: string
): Promise<UseCaseConditions> {
  // Check cache first
  const cached = conditionsCache.get(useCaseSlug);
  if (cached && cached.expiresAt > new Date()) {
    return cached.data;
  }
  
  // Load from database
  const [
    useCase,
    loadFactors,
    solarFactors,
    financialConstants,
    equipmentFactors,
    questionDefaults
  ] = await Promise.all([
    // 1. Use case metadata
    useCaseService.getUseCaseBySlug(useCaseSlug),
    
    // 2. Load factors (from calculation_constants)
    loadLoadFactors(useCaseSlug),
    
    // 3. Solar factors (from solarTemplates.ts or DB)
    loadSolarFactors(useCaseSlug),
    
    // 4. Financial constants (from calculation_constants)
    loadFinancialConstants(),
    
    // 5. Equipment factors (from use_case_configurations)
    loadEquipmentFactors(useCaseSlug),
    
    // 6. Question defaults (from custom_questions)
    loadQuestionDefaults(useCaseSlug)
  ]);
  
  const conditions: UseCaseConditions = {
    useCaseSlug,
    industry: useCase.industry || useCaseSlug,
    loadFactors,
    solarFactors,
    financialConstants,
    equipmentFactors,
    questionDefaults,
    loadedAt: new Date(),
    version: '1.0.0',
    source: 'database'
  };
  
  // Cache for 15 minutes
  conditionsCache.set(useCaseSlug, {
    data: conditions,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
  });
  
  return conditions;
}

/**
 * Helper: Load load calculation factors
 */
async function loadLoadFactors(useCaseSlug: string) {
  const industry = useCaseSlug.split('-')[0]; // e.g., 'car-wash' -> 'car'
  
  // Try industry-specific factors first
  const baseFactor = await getConstant(`${industry}_kw_per_unit`) || 
                     await getConstant(`${industry}_peak_demand_per_unit_kw`) ||
                     2.0; // Fallback
  
  const loadFactor = await getConstant(`${industry}_load_factor`) || 0.45;
  const peakMultiplier = await getConstant(`${industry}_peak_multiplier`) || 1.2;
  
  return { baseFactor, loadFactor, peakDemandMultiplier: peakMultiplier };
}

/**
 * Helper: Load solar factors
 */
async function loadSolarFactors(useCaseSlug: string) {
  const template = getSolarTemplate(useCaseSlug);
  return {
    roofUsableFactor: template.roofUsableFactor,
    carportUsableFactor: template.carportUsableFactor,
    solarDensity: template.solarDensity
  };
}

/**
 * Helper: Load financial constants (shared across all use cases)
 */
async function loadFinancialConstants() {
  const [itcRate, discountRate, lifetime] = await Promise.all([
    getConstant('federal_itc_rate'),
    getConstant('discount_rate'),
    getConstant('project_lifetime_years')
  ]);
  
  return {
    federalITCRate: itcRate || 0.30,
    discountRate: discountRate || 0.08,
    projectLifetimeYears: lifetime || 25
  };
}

/**
 * Helper: Load equipment factors
 */
async function loadEquipmentFactors(useCaseSlug: string) {
  const useCase = await useCaseService.getUseCaseBySlug(useCaseSlug);
  const config = useCase?.default_configuration;
  
  if (!config) return {};
  
  // Extract equipment factors from use_case_configurations
  return config.equipment_factors || {};
}

/**
 * Helper: Load question defaults
 */
async function loadQuestionDefaults(useCaseSlug: string) {
  const useCase = await useCaseService.getUseCaseBySlug(useCaseSlug);
  const questions = useCase?.custom_questions || [];
  
  const defaults: Record<string, any> = {};
  questions.forEach(q => {
    if (q.default_value !== null && q.default_value !== undefined) {
      defaults[q.field_name || q.question_key] = q.default_value;
    }
  });
  
  return defaults;
}
```

### 🔄 Central Calculator Integration

**Update `centralizedCalculations.ts`** to accept conditions:

```typescript
/**
 * Calculate financial metrics with use case conditions
 * 
 * @param input - Financial calculation input
 * @param conditions - Use case conditions (optional, will load if not provided)
 */
export async function calculateFinancialMetrics(
  input: FinancialCalculationInput,
  conditions?: UseCaseConditions
): Promise<FinancialCalculationResult> {
  // Load conditions if not provided
  if (!conditions && input.useCaseSlug) {
    conditions = await loadUseCaseConditions(input.useCaseSlug);
  }
  
  // Use conditions for calculations
  const constants = conditions 
    ? {
        FEDERAL_TAX_CREDIT_RATE: conditions.financialConstants.federalITCRate,
        // ... other constants from conditions
      }
    : await getCalculationConstants(); // Fallback to existing method
  
  // ... rest of calculation logic
}
```

### 🧙 Wizard Integration

**Update `Step3Details.tsx`** to use conditions:

```typescript
import { loadUseCaseConditions } from '@/services/useCaseConditionsService';

export function Step3Details({ state, updateState, onNext }: Step3DetailsProps) {
  const [conditions, setConditions] = useState<UseCaseConditions | null>(null);
  
  useEffect(() => {
    async function loadConditions() {
      if (state.industry) {
        const cond = await loadUseCaseConditions(state.industry);
        setConditions(cond);
        
        // Use conditions for smart defaults
        const defaults = cond.questionDefaults;
        // Apply defaults to answers...
      }
    }
    loadConditions();
  }, [state.industry]);
  
  // Use conditions.roofUsableFactor for solar calculations
  // Use conditions.loadFactors for load calculations
  // etc.
}
```

---

## Step Navigation (a, b, c) Structure

### Current Structure
- Questions organized by `section` (facility, operations, energy, solar)
- No explicit sub-steps

### Proposed Structure
Add `subStep` field to questions:

```typescript
interface Question {
  id: number;
  section: 'facility' | 'operations' | 'energy' | 'solar';
  subStep?: 'a' | 'b' | 'c' | 'd';  // NEW: Sub-step identifier
  field: string;
  question: string;
  // ...
}
```

**Example**:
- Step 3a: Facility Basics (roof area, property size)
- Step 3b: Operations (hours, vehicles, equipment)
- Step 3c: Energy Systems (water heater, pumps)
- Step 3d: Solar Potential (roof, carport)

**Display in UI**:
```
Step 3: Details
├─ 3a: Facility Basics (3 questions)
├─ 3b: Operations (5 questions)
├─ 3c: Energy Systems (4 questions)
└─ 3d: Solar Potential (2 questions)
```

---

## Integration with Vineet's Design

### 1. TrueQuote Calculator Button

**Location**: Top of Step 3 (in Merlin Energy Advisor panel)

```typescript
// In MerlinEnergyAdvisor.tsx
import { TrueQuoteVerifyBadge } from '@/components/wizard/v6/components/TrueQuoteVerifyBadge';

<button
  onClick={() => setShowTrueQuoteCalculator(!showTrueQuoteCalculator)}
  className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg"
>
  <TrueQuoteBadge size="sm" />
  <Calculator className="w-4 h-4" />
  <span>Verify Calculations</span>
</button>

{showTrueQuoteCalculator && (
  <TrueQuoteVerifyBadge
    worksheetData={buildWorksheetDataFromConditions(conditions, answers)}
  />
)}
```

### 2. Battery Status Bar

**Location**: Left sidebar (already implemented in `ProgressSidebar.tsx`)

```typescript
// Already exists in ProgressSidebar.tsx
<BatteryProgressIndicator currentStep={currentWizardStep} />
```

**Enhancement**: Show sub-step progress within Step 3:
```typescript
<BatteryProgressIndicator 
  currentStep={currentWizardStep}
  subStep={currentSubStep}  // NEW: 'a', 'b', 'c', 'd'
  subStepProgress={subStepProgress}  // NEW: 0-100% within sub-step
/>
```

---

## Migration Strategy (No Breaking Changes)

### Phase 1: Add Conditions Service (Non-Breaking)
1. ✅ Create `useCaseConditionsService.ts`
2. ✅ Add `loadUseCaseConditions()` function
3. ✅ Cache conditions for 15 minutes
4. ✅ **No changes to existing code** (backward compatible)

### Phase 2: Integrate with Central Calculator (Optional)
1. Update `centralizedCalculations.ts` to accept conditions (optional param)
2. **Existing calls still work** (conditions is optional)
3. New code can pass conditions for better performance

### Phase 3: Integrate with Wizard (Optional)
1. Update `Step3Details.tsx` to load conditions
2. Use conditions for smart defaults
3. **Existing logic still works** (fallback to current behavior)

### Phase 4: Add Sub-Step Navigation (Enhancement)
1. Add `subStep` field to questions (optional)
2. Update UI to show sub-steps
3. **Existing questions work** (no subStep = no grouping)

---

## Benefits

### ✅ Performance
- **Single DB query** per use case (instead of multiple)
- **15-minute cache** reduces DB load
- **Faster wizard** (conditions pre-loaded)

### ✅ Maintainability
- **One place** to load all conditions
- **Easy to verify** (all conditions in one object)
- **Easy to edit** (change DB, conditions auto-update)

### ✅ Modularity
- **Clear separation**: DB → Conditions → Calculator/Wizard
- **Logical modules**: Load factors, solar factors, financial constants
- **Easy to test** (mock conditions object)

### ✅ No Breaking Changes
- **Backward compatible** (existing code still works)
- **Gradual migration** (adopt conditions when ready)
- **Fallback support** (if conditions unavailable, use existing methods)

---

## Next Steps

1. **Create `useCaseConditionsService.ts`** (Phase 1)
2. **Test with one use case** (car_wash)
3. **Integrate TrueQuote button** into Vineet's Step 3 design
4. **Enhance battery status bar** with sub-step progress
5. **Add sub-step navigation** (Phase 4)

---

## Questions for Discussion

1. **Cache Duration**: 15 minutes OK? Or should it be configurable?
2. **Sub-Step Structure**: Do we want explicit "3a, 3b, 3c" or keep current section-based approach?
3. **Conditions Versioning**: Should conditions have version numbers for cache invalidation?
4. **Error Handling**: What happens if conditions fail to load? Fallback to existing methods?
