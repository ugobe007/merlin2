# 🏗️ TRUEQUOTE ENGINE ARCHITECTURE DIAGRAM

**Date:** January 2025  
**Version:** Porsche 911 Architecture v2.0

---

## 📊 **COMPLETE DATA FLOW ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WIZARD UI (Step 3)                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  CompleteStep3Component                                          │  │
│  │  ├─ User answers questions                                       │  │
│  │  ├─ Answers stored in: answers = { facilityType, bayCount, ... } │  │
│  │  └─ Calls: onAnswersChange(answers)                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Step3Integration                                                 │  │
│  │  ├─ Receives: answers from CompleteStep3Component                  │  │
│  │  ├─ Updates: state.useCaseData.inputs = answers                   │  │
│  │  ├─ On Complete: calculateCompleteQuote(answers)                   │  │
│  │  └─ Extracts: estimatedAnnualKwh, peakDemandKw                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  WizardV6 (State Manager)                                        │  │
│  │  ├─ State: { useCaseData: { inputs: {...}, ... } }               │  │
│  │  ├─ Auto-saves to: bufferService.save(state)                     │  │
│  │  └─ Passes state to: Step 5 (MagicFit)                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 5: MAGIC FIT (System Selection)                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Step5MagicFit.tsx                                                │  │
│  │  ├─ Receives: state (from WizardV6)                              │  │
│  │  ├─ Calls: generateQuote(state)                                  │  │
│  │  └─ generateQuote → MerlinOrchestrator.generateQuote()           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    MERLIN ORCHESTRATOR (General Contractor)              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MerlinOrchestrator.ts                                           │  │
│  │  ├─ Receives: WizardState                                        │  │
│  │  ├─ Maps: mapWizardStateToMerlinRequest(state)                   │  │
│  │  │   └─ Creates: MerlinRequest {                                 │  │
│  │  │       location: { zipCode, state, city },                     │  │
│  │  │       goals: ['reduce_costs', 'peak_shaving'],                │  │
│  │  │       facility: {                                            │  │
│  │  │         industry: 'car_wash',                                 │  │
│  │  │         useCaseData: state.useCaseData                        │  │
│  │  │       },                                                       │  │
│  │  │       preferences: { solar, generator, ev }                   │  │
│  │  │     }                                                         │  │
│  │  ├─ Delegates to: TrueQuoteEngineV2.processQuote(request)       │  │
│  │  └─ Returns: TrueQuoteAuthenticatedResult                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              TRUEQUOTE ENGINE V2 (Prime Sub Contractor - SSOT)          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  TrueQuoteEngineV2.ts                                             │  │
│  │  ├─ Receives: MerlinRequest                                       │  │
│  │  ├─ Step 1: Load Industry Template                               │  │
│  │  │   └─ Gets: industry config, power density, defaults            │  │
│  │  ├─ Step 2: Calculate Energy Profile                              │  │
│  │  │   ├─ Calls: loadCalculator.calculateLoad()                    │  │
│  │  │   │   └─ For car_wash: calculateCarWashLoad(useCaseData)      │  │
│  │  │   │       ├─ Reads: facilityType, bayCount, blowerCount, etc. │  │
│  │  │   │       ├─ Calculates: equipment loads (pumps, blowers, etc)│  │
│  │  │   │       └─ Returns: { peakDemandKW, averageDemand, ... }   │  │
│  │  │   ├─ Calculates: annualConsumption = avgDemand × hours × days│  │
│  │  │   └─ Returns: EnergyProfile                                    │  │
│  │  ├─ Step 3: Size Solar System                                     │  │
│  │  │   ├─ Calls: solarCalculator.sizeSolarSystem()                 │  │
│  │  │   │   ├─ Gets: roofArea from useCaseData                      │  │
│  │  │   │   ├─ Calculates: maxRoofKW = roofArea × 0.65 × 0.15      │  │
│  │  │   │   ├─ Gets: solar resource from location                    │  │
│  │  │   │   └─ Returns: { capacityKW, annualGeneration, ... }        │  │
│  │  │   └─ Returns: SolarSystem                                      │  │
│  │  ├─ Step 4: Size BESS System                                      │  │
│  │  │   ├─ Calculates: peakShavingKW = peakDemand × 0.35            │  │
│  │  │   ├─ Calculates: backupKWh = criticalLoad × backupHours       │  │
│  │  │   └─ Returns: BatterySystem                                    │  │
│  │  ├─ Step 5: Calculate Economics                                   │  │
│  │  │   ├─ Calls: financialCalculator.calculateFinancials()         │  │
│  │  │   │   ├─ Gets: utility rates from centralizedCalculations     │  │
│  │  │   │   ├─ Calculates: annualSavings = solarGen × rate          │  │
│  │  │   │   ├─ Calculates: demandChargeSavings = peakShave × rate   │  │
│  │  │   │   ├─ Calculates: payback = netCost / annualSavings        │  │
│  │  │   │   └─ Returns: Financials                                   │  │
│  │  │   └─ Returns: Economics                                        │  │
│  │  ├─ Step 6: Generate Base Calculation                            │  │
│  │  │   └─ Returns: TrueQuoteBaseCalculation {                       │  │
│  │  │       load: EnergyProfile,                                     │  │
│  │  │       bess: BatterySystem,                                     │  │
│  │  │       solar: SolarSystem,                                      │  │
│  │  │       generator: GeneratorSystem,                              │  │
│  │  │       ev: EVSystem,                                            │  │
│  │  │       utility: UtilityRates,                                  │  │
│  │  │       financials: Economics                                     │  │
│  │  │     }                                                          │  │
│  │  └─ Delegates to: MagicFit.generateMagicFitProposal()            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    MAGIC FIT (Option Generator)                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MagicFit.ts                                                      │  │
│  │  ├─ Receives: TrueQuoteBaseCalculation + UserPreferences         │  │
│  │  ├─ Generates: 3 optimized options (Starter, Perfect Fit, Beast) │  │
│  │  │   ├─ Applies: tier scales (0.7, 1.0, 1.25)                  │  │
│  │  │   ├─ Applies: BESS upsize multipliers (if no solar/gen)       │  │
│  │  │   ├─ Adjusts: based on user goals                             │  │
│  │  │   └─ Returns: MagicFitProposal {                              │  │
│  │  │       starter: SystemOption,                                  │  │
│  │  │       perfectFit: SystemOption,                               │  │
│  │  │       beastMode: SystemOption                                 │  │
│  │  │     }                                                          │  │
│  │  └─ Returns: MagicFitProposal                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              PROPOSAL VALIDATOR (Authentication Layer)                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  proposalValidator.ts                                             │  │
│  │  ├─ Receives: MagicFitProposal                                    │  │
│  │  ├─ Validates: Each option against base calculation              │  │
│  │  │   ├─ Checks: BESS <= 250% of base                             │  │
│  │  │   ├─ Checks: Solar <= 250% of base                             │  │
│  │  │   ├─ Checks: Financial calculations accurate                   │  │
│  │  │   └─ Returns: ValidationResult                                │  │
│  │  ├─ If valid: Creates AuthenticatedSystemOption                   │  │
│  │  └─ Returns: AuthenticationResult | TrueQuoteRejection             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              TRUEQUOTE ENGINE V2 (Final Assembly)                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  TrueQuoteEngineV2.ts (continued)                                │  │
│  │  ├─ Receives: AuthenticationResult                                │  │
│  │  ├─ Creates: TrueQuoteAuthenticatedResult {                       │  │
│  │  │     quoteId: "QT-...",                                         │  │
│  │  │     options: {                                                 │  │
│  │  │       starter: AuthenticatedSystemOption,                      │  │
│  │  │       perfectFit: AuthenticatedSystemOption,                   │  │
│  │  │       beastMode: AuthenticatedSystemOption                     │  │
│  │  │     },                                                          │  │
│  │  │     baseCalculation: TrueQuoteBaseCalculation,                 │  │
│  │  │     metadata: {...}                                            │  │
│  │  │   }                                                            │  │
│  │  └─ Returns: TrueQuoteAuthenticatedResult                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    MERLIN ORCHESTRATOR (Return Path)                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MerlinOrchestrator.ts (continued)                               │  │
│  │  └─ Returns: TrueQuoteAuthenticatedResult                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP 5: MAGIC FIT (Display)                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Step5MagicFit.tsx (continued)                                   │  │
│  │  ├─ Receives: TrueQuoteAuthenticatedResult                        │  │
│  │  ├─ Displays: 3 MagicFit cards (Starter, Perfect Fit, Beast)    │  │
│  │  ├─ User selects: tier (e.g., "perfectFit")                      │  │
│  │  ├─ Updates: state.calculations = {                              │  │
│  │  │     base: { ... },      // MagicFit base recommendations      │  │
│  │  │     selected: {         // User's selected values             │  │
│  │  │       bessKW: option.bess.powerKW,                            │  │
│  │  │       bessKWh: option.bess.energyKWh,                         │  │
│  │  │       solarKW: option.solar.capacityKW,                       │  │
│  │  │       totalInvestment: option.financials.totalInvestment,     │  │
│  │  │       annualSavings: option.financials.annualSavings,         │  │
│  │  │       paybackYears: option.financials.paybackYears,           │  │
│  │  │       utilityRate: baseCalculation.utility.rate,              │  │
│  │  │       demandCharge: baseCalculation.utility.demandCharge      │  │
│  │  │     }                                                          │  │
│  │  │   }                                                            │  │
│  │  └─ Updates: state.selectedPowerLevel = "perfect_fit"            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    VALUE TICKER (Live Updates)                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ValueTicker.tsx                                                  │  │
│  │  ├─ Reads from: state.useCaseData.estimatedAnnualKwh              │  │
│  │  ├─ Reads from: state.useCaseData.peakDemandKw                    │  │
│  │  ├─ Reads from: state.calculations.selected.utilityRate          │  │
│  │  ├─ Reads from: state.calculations.selected.solarKW              │  │
│  │  ├─ Reads from: state.calculations.selected.bessKWh              │  │
│  │  ├─ Calculates: annualEnergySpend = annualKwh × utilityRate       │  │
│  │  ├─ Calculates: peakDemandCharges = peakKW × demandRate × 12    │  │
│  │  └─ Displays: Live values across all steps                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

> **Note (Jan 2026):** The `calculations` object uses nested structure `{ base, selected }`. 
> Always read from `state.calculations.selected.bessKW`, not `state.calculations.bessKW`.

---

## 🔄 **CENTRAL CALCULATOR DATA FLOW**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CENTRALIZED CALCULATIONS (SSOT)                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  centralizedCalculations.ts                                       │  │
│  │  ├─ Loads: calculation_constants from database                    │  │
│  │  │   └─ Gets: ITC rate, solar cost, BESS cost, etc.              │  │
│  │  ├─ Exports: calculateFinancials()                                │  │
│  │  │   ├─ Inputs: {                                                 │  │
│  │  │   │     bessCost, solarCost, generatorCost,                    │  │
│  │  │   │     bessKW, bessKWh, solarKW,                              │  │
│  │  │   │     electricityRate, demandCharge,                         │  │
│  │  │   │     state (for incentives)                                 │  │
│  │  │   │   }                                                         │  │
│  │  │   ├─ Calculates:                                               │  │
│  │  │   │   ├─ totalInvestment = bessCost + solarCost + genCost     │  │
│  │  │   │   ├─ federalITC = (bessCost + solarCost) × 0.30          │  │
│  │  │   │   ├─ stateIncentives = getStateIncentives(state)          │  │
│  │  │   │   ├─ netCost = totalInvestment - ITC - stateIncentives    │  │
│  │  │   │   ├─ annualSavings = solarSavings + demandChargeSavings  │  │
│  │  │   │   ├─ paybackYears = netCost / annualSavings               │  │
│  │  │   │   └─ tenYearROI = ((annualSavings × 10) - netCost) / netCost│
│  │  │   └─ Returns: Financials                                       │  │
│  │  └─ Used by: TrueQuoteEngineV2, MagicFit, financialCalculator     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    TRUEQUOTE ENGINE V2 (Consumer)                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  TrueQuoteEngineV2.ts                                             │  │
│  │  ├─ Calls: centralizedCalculations.calculateFinancials()         │  │
│  │  │   └─ Passes: equipment costs, system sizes, utility rates     │  │
│  │  ├─ Receives: Financials {                                       │  │
│  │  │     totalInvestment,                                          │  │
│  │  │     federalITC,                                               │  │
│  │  │     netCost,                                                  │  │
│  │  │     annualSavings,                                            │  │
│  │  │     paybackYears,                                             │  │
│  │  │     tenYearROI                                                │  │
│  │  │   }                                                            │  │
│  │  └─ Includes in: TrueQuoteBaseCalculation.financials               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    MAGIC FIT (Consumer)                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MagicFit.ts                                                      │  │
│  │  ├─ Receives: TrueQuoteBaseCalculation (includes financials)     │  │
│  │  ├─ Generates: 3 options with scaled sizes                      │  │
│  │  ├─ For each option:                                             │  │
│  │  │   ├─ Calculates: new equipment costs                         │  │
│  │  │   ├─ Calls: centralizedCalculations.calculateFinancials()    │  │
│  │  │   │   └─ Passes: scaled costs, same utility rates           │  │
│  │  │   ├─ Receives: Financials for this tier                       │  │
│  │  │   └─ Includes in: SystemOption.financials                     │  │
│  │  └─ Returns: MagicFitProposal with financials for each tier        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 **DATA STRUCTURES**

### **WizardState → MerlinRequest**
```typescript
WizardState {
  zipCode: "89052",
  state: "NV",
  industry: "car_wash",
  useCaseData: {
    inputs: {
      facilityType: "express_tunnel",
      bayCount: 1,
      blowerCount: 4,
      waterHeaterType: "gas",
      // ... all question answers
    },
    estimatedAnnualKwh: 1850000,  // From CompleteTrueQuoteEngine
    peakDemandKw: 116              // From CompleteTrueQuoteEngine
  },
  selectedOptions: ["solar"],
  customSolarKw: 100
}
    ↓ mapWizardStateToMerlinRequest()
MerlinRequest {
  location: { zipCode: "89052", state: "NV", city: "..." },
  goals: ["reduce_costs", "peak_shaving"],
  facility: {
    industry: "car_wash",
    useCaseData: { ...inputs from above }
  },
  preferences: {
    solar: { interested: true, customSizeKw: 100 },
    generator: { interested: false },
    ev: { interested: false }
  }
}
```

### **MerlinRequest → TrueQuoteBaseCalculation**
```typescript
TrueQuoteBaseCalculation {
  load: {
    peakDemandKW: 116,              // From loadCalculator
    averageDemand: 87,              // peakDemand × loadFactor
    annualConsumption: 1850000      // avgDemand × hours × days
  },
  bess: {
    powerKW: 50,                     // peakDemand × 0.35
    energyKWh: 100,                  // Calculated for backup
    durationHours: 2
  },
  solar: {
    capacityKW: 100,                 // From solarCalculator
    annualGeneration: 150000,        // capacityKW × 1500 kWh/kW
    maxRoofCapacityKW: 300
  },
  utility: {
    rate: 0.12,                     // From centralizedCalculations
    demandCharge: 15                 // From centralizedCalculations
  },
  financials: {
    totalInvestment: 641595,         // From centralizedCalculations
    federalITC: 192478,              // (BESS + Solar) × 0.30
    netCost: 449117,                 // totalInvestment - ITC
    annualSavings: 261100,           // From centralizedCalculations
    paybackYears: 1.72               // netCost / annualSavings
  }
}
```

### **TrueQuoteBaseCalculation → MagicFitProposal**
```typescript
MagicFitProposal {
  starter: {
    bess: { powerKW: 35, energyKWh: 70 },    // base × 0.7
    solar: { capacityKW: 70 },                // base × 0.7
    financials: {
      totalInvestment: 449117,                 // Recalculated
      annualSavings: 182770,                  // Recalculated
      paybackYears: 2.45                      // Recalculated
    }
  },
  perfectFit: {
    bess: { powerKW: 50, energyKWh: 100 },   // base × 1.0
    solar: { capacityKW: 100 },               // base × 1.0
    financials: {
      totalInvestment: 641595,
      annualSavings: 261100,
      paybackYears: 1.72
    }
  },
  beastMode: {
    bess: { powerKW: 62, energyKWh: 125 },   // base × 1.25
    solar: { capacityKW: 125 },               // base × 1.25
    financials: {
      totalInvestment: 801994,
      annualSavings: 326375,
      paybackYears: 2.46
    }
  }
}
```

---

## 🔗 **KEY DATA PASSING POINTS**

### **1. Step 3 → Step 5**
```
Step3Integration.handleComplete()
  ↓
calculateCompleteQuote(answers)
  ↓
Extracts: estimatedAnnualKwh, peakDemandKw
  ↓
updateState({ useCaseData: { inputs: answers, estimatedAnnualKwh, peakDemandKw } })
  ↓
WizardV6 state updated
  ↓
Step5MagicFit receives state
  ↓
generateQuote(state)
```

### **2. WizardState → TrueQuote**
```
WizardV6.state
  ↓
MerlinOrchestrator.generateQuote(state)
  ↓
mapWizardStateToMerlinRequest(state)
  ↓
MerlinRequest {
  facility: { useCaseData: state.useCaseData }
}
  ↓
TrueQuoteEngineV2.processQuote(request)
  ↓
loadCalculator.calculateLoad(useCaseData)
  ↓
Reads: useCaseData.inputs.facilityType, bayCount, etc.
```

### **3. Central Calculator → TrueQuote**
```
centralizedCalculations.calculateFinancials()
  ↓
Gets: calculation_constants from database
  ↓
Calculates: ITC, savings, payback
  ↓
Returns: Financials
  ↓
TrueQuoteEngineV2 includes in baseCalculation
  ↓
MagicFit uses for each tier
```

---

## ✅ **SSOT COMPLIANCE**

- **Single Source of Truth:** `centralizedCalculations.ts` for all financial calculations
- **Data Flow:** WizardState → MerlinRequest → TrueQuote → MagicFit → Result
- **No Duplication:** All calculations go through centralized functions
- **Version Control:** All engines have version numbers for tracking

---

## 🎯 **KEY TAKEAWAYS**

1. **TrueQuote is the SSOT** for all energy calculations
2. **Central Calculator** provides financial functions (ITC, payback, ROI)
3. **Magic Fit** generates options but must be authenticated by TrueQuote
4. **Data flows one way:** UI → State → Request → Calculation → Result
5. **ValueTicker** reads from state.useCaseData and state.calculations
