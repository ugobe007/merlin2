# Magic Fit™ - Intelligent BESS Configuration Optimizer

> **Version:** 1.0.0  
> **Created:** December 2025  
> **Status:** Production Ready

## 🎯 What is Magic Fit?

**Magic Fit** is Merlin's intelligent configuration optimizer that generates 3 tailored BESS (Battery Energy Storage System) scenarios based on a user's facility data, location, and preferences. Instead of forcing users to manually size their battery systems, Magic Fit analyzes their inputs and presents 3 optimized options:

| Strategy | Multiplier | Focus | Best For |
|----------|------------|-------|----------|
| 💰 **Savings Focus** | 0.8x | Maximize ROI, fastest payback | Budget-conscious buyers |
| ⚖️ **Balanced** | 1.0x | Optimal cost/coverage ratio | Most commercial users |
| 🛡️ **Resilient** | 1.3x | Maximum backup, grid independence | Critical facilities |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MAGIC FIT SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Inputs (Wizard Sections 0-2)                                          │
│  ├── Location (state, electricity rate, solar hours)                        │
│  ├── Industry (hotel, car wash, data center, etc.)                          │
│  └── Facility Details (size, occupancy, equipment)                          │
│                           │                                                 │
│                           ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              CENTRALIZED CALCULATIONS (SSOT)                        │   │
│  │  useCasePowerCalculations.ts → totalPeakDemandKW                    │   │
│  │  geographicIntelligenceService.ts → electricityRate, solarHours     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                           │                                                 │
│                           ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    scenarioGenerator.ts                             │   │
│  │  generateScenarios(input) → ScenarioGeneratorResult                 │   │
│  │                                                                     │   │
│  │  For each strategy (savings, balanced, resilient):                  │   │
│  │  1. Apply multiplier to peak demand                                 │   │
│  │  2. Calculate battery kW/kWh                                        │   │
│  │  3. Size solar (if enabled)                                         │   │
│  │  4. Size generator (if enabled)                                     │   │
│  │  5. Call calculateQuote() for financials                            │   │
│  │  6. Generate highlights and recommendation                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                           │                                                 │
│                           ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ScenarioSection.tsx                              │   │
│  │  - Shows 3 scenario cards                                           │   │
│  │  - ScenarioExplainerModal (first visit)                             │   │
│  │  - User selects preferred strategy                                  │   │
│  │  - Updates wizardState with selected values                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
src/
├── services/
│   └── scenarioGenerator.ts          # Core Magic Fit engine (434 lines)
│       ├── SCENARIO_MULTIPLIERS      # Savings: 0.8x, Balanced: 1.0x, Resilient: 1.3x
│       ├── INDUSTRY_BESS_RATIOS      # Industry-specific battery sizing
│       ├── INDUSTRY_LOAD_PROFILES    # Peak hours, demand patterns
│       ├── generateScenarios()       # Main entry point
│       └── generateSingleScenario()  # Per-strategy calculation
│
├── components/wizard/
│   ├── sections/
│   │   └── ScenarioSection.tsx       # UI for 3-card selection
│   │
│   └── modals/
│       ├── ScenarioExplainerModal.tsx    # Explains 3 options
│       └── ConfigurationConfirmModal.tsx # Confirms before quote
│
└── types/
    └── wizardTypes.ts                # ScenarioConfig, ScenarioGeneratorResult
```

---

## 🔧 Core Types

### ScenarioConfig
```typescript
interface ScenarioConfig {
  type: 'savings' | 'balanced' | 'resilient';
  name: string;           // "Savings Focus", "Balanced", "Resilient"
  tagline: string;        // Short description
  icon: string;           // 💰, ⚖️, 🛡️
  
  // Equipment sizing
  batteryKW: number;
  batteryKWh: number;
  durationHours: number;
  solarKW: number;
  generatorKW: number;
  
  // Financial metrics (from calculateQuote)
  grossCost: number;
  netCost: number;        // After ITC
  annualSavings: number;
  paybackYears: number;
  roi10Year: number;
  backupHours: number;
  
  // Display
  highlights: string[];   // Key benefits
  quoteResult: QuoteResult | null;
}
```

### ScenarioGeneratorInput
```typescript
interface ScenarioGeneratorInput {
  peakDemandKW: number;       // From centralized calculations
  dailyKWh: number;           // Estimated daily consumption
  industryType: string;       // Use case slug
  state: string;              // Location for pricing
  electricityRate: number;    // $/kWh
  goals: string[];            // User-selected goals
  wantsSolar: boolean;
  wantsGenerator: boolean;
  gridConnection: 'on-grid' | 'off-grid' | 'limited';
}
```

---

## 🔄 Workflow (Current Implementation)

### Step-by-Step Flow

```
Section 0: Location
    │
    ▼
Section 1: Industry
    │
    ▼
Section 2: Facility Details
    │   └── Calculates totalPeakDemandKW via SSOT
    │
    ▼
Section 3: MAGIC FIT (Scenarios)
    │   ├── Auto-generates 3 scenarios on entry
    │   ├── Shows ScenarioExplainerModal (first time)
    │   ├── Displays 3 scenario cards
    │   └── User selects one → populates batteryKW, solarKW, etc.
    │
    ▼
Section 4: Goals
    │   ├── User can add solar, generator, wind
    │   ├── Merlin adjusts recommendation
    │   └── Continue → shows ConfigurationConfirmModal
    │
    ▼
Section 5: Quote Results
    └── Final quote with selected scenario values
```

### Auto-Generation Trigger
```typescript
// ScenarioSection.tsx
useEffect(() => {
  if (currentSection === 3 && !scenarioResult && !isGenerating) {
    onGenerateScenarios(); // Calls generateScenarios() in hook
  }
}, [currentSection, scenarioResult, isGenerating, onGenerateScenarios]);
```

---

## 🧮 Calculation Logic

### 1. Battery Sizing
```typescript
// scenarioGenerator.ts
const baseBatteryKW = peakDemandKW * industryRatio * multiplier;
const batteryKWh = baseBatteryKW * durationHours;

// Industry ratios (INDUSTRY_BESS_RATIOS)
const ratios = {
  'data-center': 1.0,    // Full peak coverage
  'hospital': 0.85,      // Critical load coverage
  'hotel': 0.4,          // Peak shaving focus
  'car-wash': 0.35,      // Demand charge reduction
  'warehouse': 0.3,      // Basic peak shaving
  // ...
};

// Multipliers (SCENARIO_MULTIPLIERS)
const multipliers = {
  savings: 0.8,     // 20% smaller = faster payback
  balanced: 1.0,    // Optimal sizing
  resilient: 1.3,   // 30% larger = more backup
};
```

### 2. Solar Sizing
```typescript
// Only if wantsSolar or goals include solar-related items
if (wantsSolar) {
  const ilr = 1.4; // Inverter Loading Ratio (NREL ATB 2024)
  solarKW = baseBatteryKW * SOLAR_TO_BESS_RATIO * multiplier;
}
```

### 3. Generator Sizing
```typescript
// Only if wantsGenerator or off-grid
if (wantsGenerator || gridConnection === 'off-grid') {
  generatorKW = peakDemandKW * GENERATOR_RESERVE_MARGIN;
}
```

### 4. Financial Calculations
```typescript
// Uses SSOT calculateQuote() for each scenario
const quoteResult = await calculateQuote({
  storageSizeMW: batteryKW / 1000,
  durationHours,
  location: state,
  electricityRate,
  solarMW: solarKW / 1000,
  generatorMW: generatorKW / 1000,
  useCase: industryType,
});

// Extract metrics
const netCost = quoteResult.costs.netCost;
const annualSavings = quoteResult.financials.annualSavings;
const paybackYears = quoteResult.financials.paybackYears;
```

---

## 🌍 Environmental Variables

Magic Fit incorporates several environmental factors:

### Location-Based Adjustments
| Variable | Source | Impact |
|----------|--------|--------|
| Electricity Rate | `geographicIntelligenceService` | Higher rates = faster payback |
| Demand Charge | State/utility data | Affects peak shaving savings |
| Solar Hours | Location profile | Determines solar viability |
| Grid Reliability | State data | Affects backup requirements |

### Industry-Specific Factors
| Variable | Source | Impact |
|----------|--------|--------|
| Peak Demand Pattern | `INDUSTRY_LOAD_PROFILES` | Sizing optimization |
| Critical Load % | `wizardConstants.ts` | Backup duration |
| Operating Hours | Industry defaults | Daily consumption |

### How to Add New Environmental Variables

```typescript
// 1. Add to ScenarioGeneratorInput
interface ScenarioGeneratorInput {
  // ... existing
  climateZone?: string;        // NEW
  utilityIncentive?: number;   // NEW
}

// 2. Use in generateSingleScenario()
function generateSingleScenario(input, type) {
  let adjustment = 1.0;
  
  // Climate adjustment
  if (input.climateZone === 'hot-humid') {
    adjustment *= 1.1; // 10% more for cooling loads
  }
  
  // Utility incentive
  const incentiveBonus = input.utilityIncentive || 0;
  const netCost = grossCost - incentiveBonus;
  
  // ...
}

// 3. Pass from useStreamlinedWizard.ts
const input: ScenarioGeneratorInput = {
  // ... existing
  climateZone: wizardState.climateZone,
  utilityIncentive: geoRecommendations.utilityIncentive,
};
```

---

## 🔍 Debugging Magic Fit

### Console Logs
```typescript
// scenarioGenerator.ts has built-in logging
console.log('🎯 [generateScenarios] Input:', input);
console.log('🎯 [generateScenarios] Generated scenarios:', result);

// useStreamlinedWizard.ts
console.log('🎯 [generateAllScenarios] Generating 3 scenario configurations...');
console.log('✅ [selectScenario] User selected:', scenario.name);
```

### Common Issues & Fixes

#### 1. Scenarios Not Generating
**Symptom:** Spinner shows indefinitely  
**Check:**
```typescript
// Verify centralizedState has calculations
console.log('Peak Demand:', centralizedState?.calculated?.totalPeakDemandKW);
// Should be > 0

// Verify input is valid
if (peakDemandKW === 0) {
  console.error('❌ Peak demand is 0 - facility details not calculated');
}
```

#### 2. Payback Shows Infinity or NaN
**Symptom:** Financial metrics invalid  
**Fix:**
```typescript
// In scenarioGenerator.ts
const paybackYears = annualSavings > 0 
  ? netCost / annualSavings 
  : 99; // Fallback for $0 savings

const roi10Year = annualSavings > 0
  ? ((annualSavings * 10 - netCost) / netCost) * 100
  : 0;
```

#### 3. Selected Scenario Not Populating Values
**Symptom:** Battery/solar sliders don't update after selection  
**Check:**
```typescript
// selectScenario callback in useStreamlinedWizard.ts
setWizardState(prev => ({
  ...prev,
  selectedScenario: scenario,
  batteryKW: scenario.batteryKW,      // ✅ Must set these
  batteryKWh: scenario.batteryKWh,
  solarKW: scenario.solarKW,
  generatorKW: scenario.generatorKW,
}));
```

#### 4. Wrong Industry Ratios
**Symptom:** Sizing too big/small for industry  
**Fix:** Update `INDUSTRY_BESS_RATIOS` in `scenarioGenerator.ts`
```typescript
const INDUSTRY_BESS_RATIOS: Record<string, number> = {
  'your-new-industry': 0.5, // Add appropriate ratio
};
```

---

## 🔗 Integration Points

### 1. Wizard Hook (`useStreamlinedWizard.ts`)
```typescript
// Exposed callbacks
generateAllScenarios: () => Promise<void>;
selectScenario: (scenario: ScenarioConfig) => void;

// State
isGeneratingScenarios: boolean;
wizardState.scenarioResult: ScenarioGeneratorResult | null;
wizardState.selectedScenario: ScenarioConfig | null;
```

### 2. WizardState (`wizardTypes.ts`)
```typescript
interface WizardState {
  // Magic Fit state
  scenarioResult: ScenarioGeneratorResult | null;
  selectedScenario: ScenarioConfig | null;
  showScenarios: boolean;
  
  // Values populated from selected scenario
  batteryKW: number;
  batteryKWh: number;
  solarKW: number;
  generatorKW: number;
}
```

### 3. StreamlinedWizard.tsx
```typescript
// Section 3 renders ScenarioSection
<ScenarioSection
  scenarioResult={wizard.wizardState.scenarioResult}
  isGenerating={wizard.isGeneratingScenarios}
  onGenerateScenarios={wizard.generateAllScenarios}
  onContinue={() => {
    wizard.completeSection('scenarios');
    wizard.advanceToSection(4);
  }}
/>
```

---

## 📊 Testing Magic Fit

### Unit Test Example
```typescript
// __tests__/scenarioGenerator.test.ts
import { generateScenarios } from '@/services/scenarioGenerator';

describe('Magic Fit - generateScenarios', () => {
  it('generates 3 scenarios with correct multipliers', async () => {
    const input = {
      peakDemandKW: 500,
      dailyKWh: 5000,
      industryType: 'hotel',
      state: 'California',
      electricityRate: 0.15,
      goals: [],
      wantsSolar: true,
      wantsGenerator: false,
      gridConnection: 'on-grid',
    };
    
    const result = await generateScenarios(input);
    
    expect(result.scenarios).toHaveLength(3);
    expect(result.scenarios[0].type).toBe('savings');
    expect(result.scenarios[1].type).toBe('balanced');
    expect(result.scenarios[2].type).toBe('resilient');
    
    // Verify multipliers applied
    const balanced = result.scenarios[1];
    const savings = result.scenarios[0];
    const resilient = result.scenarios[2];
    
    expect(savings.batteryKW).toBeLessThan(balanced.batteryKW);
    expect(resilient.batteryKW).toBeGreaterThan(balanced.batteryKW);
  });
  
  it('includes solar when wantsSolar is true', async () => {
    const result = await generateScenarios({
      ...baseInput,
      wantsSolar: true,
    });
    
    result.scenarios.forEach(scenario => {
      expect(scenario.solarKW).toBeGreaterThan(0);
    });
  });
});
```

---

## 🚀 Future Enhancements

### Phase 2: Goal-Aware Scenarios
Generate scenarios AFTER user selects goals, so each scenario is tailored to their preferences.

### Phase 3: AI-Powered Recommendations  
Use ML to recommend the best scenario based on similar facility profiles.

### Phase 4: Real-Time Market Pricing
Integrate live battery/solar pricing for more accurate quotes.

### Phase 5: Utility Rate Integration
Pull actual utility rate schedules for precise savings calculations.

---

## 📝 Changelog

| Date | Version | Changes |
|------|---------|---------|
| Dec 15, 2025 | 1.0.0 | Initial Magic Fit implementation |
| Dec 15, 2025 | 1.0.1 | Moved Scenarios before Goals (Section 3) |
| Dec 15, 2025 | 1.0.2 | Added ScenarioExplainerModal |
| Dec 15, 2025 | 1.0.3 | Added ConfigurationConfirmModal |

---

## 🎯 Summary

**Magic Fit** transforms the BESS quoting process from manual configuration to intelligent optimization. By analyzing facility data, location, and industry patterns, it presents users with 3 clear choices that match their priorities—whether that's maximizing savings, finding the optimal balance, or ensuring maximum resilience.

The system is built on Merlin's SSOT architecture, ensuring all calculations flow through `calculateQuote()` and produce TrueQuote™-compliant results with full source attribution.
