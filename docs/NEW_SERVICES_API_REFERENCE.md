# NEW SERVICES API DOCUMENTATION
**Complete reference for all 7 new calculation services (Jan 2026 Integration)**

Last Updated: January 14, 2026

---

## 📋 TABLE OF CONTENTS

1. [ITC Calculator](#1-itc-calculator) (`itcCalculator.ts`)
2. [Battery Degradation Service](#2-battery-degradation-service) (`batteryDegradationService.ts`)
3. [PVWatts Solar Production](#3-pvwatts-solar-production) (`pvWattsService.ts`)
4. [8760 Hourly Analysis](#4-8760-hourly-analysis) (`hourly8760AnalysisService.ts`)
5. [Monte Carlo Sensitivity](#5-monte-carlo-sensitivity) (`monteCarloService.ts`)
6. [Utility Rate Service](#6-utility-rate-service) (`utilityRateService.ts`)
7. [Equipment Pricing Tiers](#7-equipment-pricing-tiers) (`equipmentPricingTiersService.ts`)

---

## 1. ITC CALCULATOR

**File**: `src/services/itcCalculator.ts`  
**Purpose**: Calculate dynamic Investment Tax Credit per IRA 2022 rules

### Functions

#### `calculateITC(input: ITCProjectInput): ITCCalculationResult`

**Full ITC calculation with detailed breakdown**

**Parameters:**
- `input.projectType`: 'bess' | 'solar' | 'wind' | 'hybrid' | 'geothermal' | 'fuel-cell'
- `input.capacityMW`: Project capacity in MW
- `input.totalCost`: Total project cost ($)
- `input.prevailingWage`: Boolean - PWA requirements met?
- `input.apprenticeship`: Boolean - Apprenticeship requirements met?
- `input.energyCommunity`: Boolean | 'coal-closure' | 'brownfield' | 'fossil-fuel-employment'
- `input.domesticContent`: Boolean - US content requirements met?
- `input.lowIncomeProject`: Boolean | 'located-in' | 'serves' | 'tribal' | 'affordable-housing'

**Returns:**
```typescript
{
  baseRate: number;           // 0.06 or 0.30
  totalRate: number;          // Final ITC % (0.06-0.70)
  creditAmount: number;       // Dollar amount
  breakdown: {
    baseCredit: number;       // $ amount
    prevailingWageBonus: number;
    energyCommunityBonus: number;
    domesticContentBonus: number;
    lowIncomeBonus: number;
  },
  qualifications: { ... },
  phaseOut: { ... },
  audit: { methodology, sources, confidence, notes }
}
```

**Example:**
```typescript
const itc = calculateITC({
  projectType: 'bess',
  capacityMW: 5.0,
  totalCost: 5_000_000,
  prevailingWage: true,
  apprenticeship: true,
  energyCommunity: 'coal-closure',
  domesticContent: true,
  lowIncomeProject: false,
  gridConnected: true,
  inServiceDate: new Date('2026-01-01'),
  state: 'PA',
});

// Result:
// {
//   baseRate: 0.30,
//   totalRate: 0.50,
//   creditAmount: 2_500_000,
//   breakdown: {
//     baseCredit: 1_500_000,
//     prevailingWageBonus: 0,
//     energyCommunityBonus: 500_000,
//     domesticContentBonus: 500_000,
//     lowIncomeBonus: 0
//   }
// }
```

#### `estimateITC(projectType, totalCost, capacityMW, prevailingWage, bonuses?): ITCEstimateResult`

**Quick estimate for UI previews**

**Parameters:**
- `projectType`: 'bess' | 'solar' | 'hybrid' | etc.
- `totalCost`: Total project cost ($)
- `capacityMW`: Project capacity (MW)
- `prevailingWage`: Boolean (default: true)
- `bonuses?`: Optional { energyCommunity?, domesticContent?, lowIncome? }

**Returns:**
```typescript
{
  totalRate: number;          // Final ITC %
  baseRate: number;           // 0.06 or 0.30
  creditAmount: number;       // Dollar amount
  notes: string[];            // Qualification summary
}
```

**Example:**
```typescript
const itc = estimateITC('bess', 5_000_000, 5.0, true, {
  energyCommunity: true,
  domesticContent: true,
});

// Result:
// {
//   totalRate: 0.50,
//   baseRate: 0.30,
//   creditAmount: 2_500_000,
//   notes: [
//     'Prevailing wage & apprenticeship requirements met (+24%)',
//     'Energy Community bonus: +10% (designated area)',
//     'Domestic Content bonus: +10%'
//   ]
// }
```

---

## 2. BATTERY DEGRADATION SERVICE

**File**: `src/services/batteryDegradationService.ts`  
**Purpose**: Model battery capacity degradation over project lifetime

### Functions

#### `calculateDegradation(input: DegradationInput): DegradationResult`

**Full year-by-year degradation projection**

**Parameters:**
- `input.chemistry`: 'lfp' | 'nmc' | 'nca' | 'flow-vrb' | 'sodium-ion'
- `input.initialCapacityKWh`: Initial capacity (kWh)
- `input.cyclesPerYear`: Expected cycles/year (default: 365)
- `input.averageDoD`: Average depth of discharge (default: 0.8)
- `input.projectYears`: Project lifetime (default: 25)

**Returns:**
```typescript
{
  yearlyCapacity: Array<{
    year: number;
    capacityKWh: number;
    capacityPct: number;
    cyclesDone: number;
  }>,
  endOfLife: {
    finalCapacityKWh: number;
    finalCapacityPct: number;
    totalCycles: number;
  },
  warranty: {
    warrantyYears: number;
    warrantyCapacityPct: number;
    yearsAtWarrantyCapacity: number;
  },
  degradationRate: {
    calendarAging: number;      // %/year
    cycleAging: number;          // %/cycle
    totalYearly: number;         // %/year
  },
  audit: { methodology, sources, confidence, calculatedAt }
}
```

**Example:**
```typescript
const degradation = calculateDegradation({
  chemistry: 'lfp',
  initialCapacityKWh: 4000,
  cyclesPerYear: 365,
  averageDoD: 0.8,
  projectYears: 25,
});

// Result:
// {
//   yearlyCapacity: [
//     { year: 0, capacityKWh: 4000, capacityPct: 100, cyclesDone: 0 },
//     { year: 1, capacityKWh: 3940, capacityPct: 98.5, cyclesDone: 365 },
//     { year: 5, capacityKWh: 3702, capacityPct: 92.5, cyclesDone: 1825 },
//     ...
//   ],
//   endOfLife: {
//     finalCapacityKWh: 2490,
//     finalCapacityPct: 62.3,
//     totalCycles: 9125
//   },
//   warranty: {
//     warrantyYears: 15,
//     warrantyCapacityPct: 70,
//     yearsAtWarrantyCapacity: 14.2
//   }
// }
```

#### `estimateDegradation(chemistry, projectYears): DegradationEstimate[]`

**Quick estimate for UI (year-by-year capacity %)**

**Returns:** Array of `{ year, capacityPct }`

**Example:**
```typescript
const estimate = estimateDegradation('lfp', 25);

// Result:
// [
//   { year: 0, capacityPct: 100 },
//   { year: 1, capacityPct: 98.5 },
//   { year: 5, capacityPct: 92.5 },
//   ...
//   { year: 25, capacityPct: 62.3 }
// ]
```

---

## 3. PVWATTS SOLAR PRODUCTION

**File**: `src/services/pvWattsService.ts`  
**Purpose**: Estimate solar production using NREL PVWatts API

### Functions

#### `getPVWattsEstimate(input: PVWattsInput): Promise<PVWattsResult>`

**Full API call with monthly production**

**Parameters:**
- `input.systemCapacityKW`: System size (kW)
- `input.zipCode`: 5-digit US zip code
- `input.arrayType`: 0 (fixed) | 1 (1-axis tracker) | 2 (2-axis tracker)
- `input.moduleType`: 0 (standard) | 1 (premium) | 2 (thin-film)
- `input.losses`: System losses % (default: 14.08)
- `input.tilt`: Array tilt angle (default: latitude)
- `input.azimuth`: Array azimuth (default: 180 = south)

**Returns:**
```typescript
{
  annualProductionKWh: number;
  capacityFactor: number;       // % (not decimal)
  monthlyProductionKWh: number[];
  solarRadiation: {
    annual: number;             // kWh/m²/day
    monthly: number[];
  },
  audit: { dataSource, apiVersion, timestamp }
}
```

**Example:**
```typescript
const solar = await getPVWattsEstimate({
  systemCapacityKW: 500,
  zipCode: '94102',
  arrayType: 1,  // 1-axis tracker
  moduleType: 0,
  losses: 14.08,
});

// Result:
// {
//   annualProductionKWh: 892_340,
//   capacityFactor: 20.4,
//   monthlyProductionKWh: [
//     58123, 62345, 78123, 82456, 89234, 91234,
//     95123, 93456, 86234, 76543, 63456, 57023
//   ],
//   solarRadiation: {
//     annual: 5.89,
//     monthly: [4.2, 5.1, 5.9, 6.5, 6.8, 7.2, 7.1, 6.8, 6.2, 5.4, 4.5, 3.9]
//   }
// }
```

#### `estimateSolarProduction(systemCapacityKW, state, arrayType): SolarEstimate`

**Quick estimate without API call (regional fallback)**

**Example:**
```typescript
const quick = estimateSolarProduction(500, 'CA', 'tracker');

// Result:
// {
//   annualProductionKWh: 930_000,
//   capacityFactor: 21.2,
//   confidence: 'medium'
// }
```

---

## 4. 8760 HOURLY ANALYSIS

**File**: `src/services/hourly8760AnalysisService.ts`  
**Purpose**: Full-year hourly BESS dispatch simulation

### Functions

#### `run8760Analysis(input: HourlyAnalysisInput): HourlyAnalysisResult`

**Full 8760-hour simulation**

**Parameters:**
- `input.bessCapacityKWh`: BESS capacity (kWh)
- `input.bessPowerKW`: BESS power (kW)
- `input.loadProfileType`: 'commercial-office' | 'retail' | 'industrial' | 'hotel' | 'hospital' | 'data-center' | etc.
- `input.annualLoadKWh`: Total annual load (kWh)
- `input.peakDemandKW`: Peak demand (kW)
- `input.rateStructure`: TOU rates or flat rate
- `input.demandCharge`: $/kW
- `input.strategy`: 'peak-shaving' | 'arbitrage' | 'hybrid'
- `input.solarProductionKWh?`: Optional hourly solar array

**Returns:**
```typescript
{
  summary: {
    annualSavings: number;
    touArbitrageSavings: number;
    peakShavingSavings: number;
    demandChargeSavings: number;
    solarSelfConsumption: number;
  },
  monthly: Array<{ month, savings, cycles, avgDoD }>,
  hourlyDispatch: Array<{ hour, charge, discharge, soc, savingsThisHour }>,
  audit: { methodology, sources, confidence }
}
```

**Example:**
```typescript
const result = run8760Analysis({
  bessCapacityKWh: 4000,
  bessPowerKW: 1000,
  loadProfileType: 'commercial-office',
  annualLoadKWh: 2_000_000,
  peakDemandKW: 500,
  rateStructure: { type: 'tou', touPeriods: [...] },
  demandCharge: 20,
  strategy: 'hybrid',
});

// Result:
// {
//   summary: {
//     annualSavings: 458_000,
//     touArbitrageSavings: 178_000,
//     peakShavingSavings: 180_000,
//     demandChargeSavings: 100_000,
//     solarSelfConsumption: 0
//   },
//   monthly: [
//     { month: 'Jan', savings: 38200, cycles: 28, avgDoD: 0.75 },
//     ...
//   ],
//   hourlyDispatch: [ ... 8760 hours ... ]
// }
```

#### `estimate8760Savings(bessKWh, bessKW, loadType, rate, demandCharge): SavingsEstimate`

**Quick estimate without full simulation**

**Example:**
```typescript
const estimate = estimate8760Savings(4000, 1000, 'commercial-office', 0.25, 20);

// Result:
// {
//   annualSavings: 420_000,
//   confidence: 'medium',
//   breakdown: {
//     energyArbitrage: 160_000,
//     demandReduction: 180_000,
//     peakShaving: 80_000
//   }
// }
```

---

## 5. MONTE CARLO SENSITIVITY

**File**: `src/services/monteCarloService.ts`  
**Purpose**: Probabilistic NPV/IRR analysis with P10/P50/P90

### Functions

#### `runMonteCarloSimulation(input: MonteCarloInput): MonteCarloResult`

**Full 10,000-iteration simulation**

**Parameters:**
- `input.baseNPV`: Base case NPV ($)
- `input.baseIRR`: Base case IRR (decimal)
- `input.basePayback`: Base case payback (years)
- `input.projectCost`: Total project cost ($)
- `input.annualSavings`: Annual savings ($)
- `input.iterations`: Number of iterations (default: 10000)
- `input.itcConfig?`: Optional ITC uncertainty

**Returns:**
```typescript
{
  percentiles: {
    npv: { p10, p50, p90 },
    irr: { p10, p50, p90 },
    payback: { p10, p50, p90 }
  },
  statistics: {
    probabilityPositiveNPV: number;
    probabilityHurdleRate: number;
    valueAtRisk95: number;
    conditionalVaR: number;
  },
  sensitivity: Array<{
    variable: string;
    impact: number;
    rank: number;
  }>,
  distributions: {
    npv: Array<{ bin, count }>,
    irr: Array<{ bin, count }>
  },
  audit: { methodology, iterations, variables, timestamp }
}
```

**Example:**
```typescript
const result = runMonteCarloSimulation({
  baseNPV: 2_500_000,
  baseIRR: 0.12,
  basePayback: 6.5,
  projectCost: 5_000_000,
  annualSavings: 500_000,
  iterations: 10_000,
});

// Result:
// {
//   percentiles: {
//     npv: { p10: 1_800_000, p50: 2_400_000, p90: 3_100_000 },
//     irr: { p10: 8.5, p50: 11.8, p90: 15.2 },
//     payback: { p10: 5.5, p50: 6.8, p90: 8.5 }
//   },
//   statistics: {
//     probabilityPositiveNPV: 92.5,
//     probabilityHurdleRate: 78.3,
//     valueAtRisk95: 1_200_000,
//     conditionalVaR: 900_000
//   },
//   sensitivity: [
//     { variable: 'Electricity Rate', impact: 0.42, rank: 1 },
//     { variable: 'Battery Degradation', impact: 0.28, rank: 2 },
//     ...
//   ]
// }
```

#### `estimateRiskMetrics(baseNPV, projectCost): RiskMetrics`

**Quick P10/P90 estimate**

**Example:**
```typescript
const risk = estimateRiskMetrics(2_500_000, 5_000_000);

// Result:
// {
//   npvP10: 1_875_000,
//   npvP90: 3_125_000,
//   probabilityPositive: 87.3,
//   riskLevel: 'low'
// }
```

---

## 6. UTILITY RATE SERVICE

**File**: `src/services/utilityRateService.ts`  
**Purpose**: Dynamic utility rate lookup by ZIP code

### Functions

#### `getUtilityRatesByZip(zipCode: string): Promise<UtilityRateResult>`

**Full utility data for a ZIP code**

**Returns:**
```typescript
{
  electricityRate: number;      // $/kWh
  demandCharge: number;         // $/kW
  utilityName: string;
  state: string;
  source: 'eia' | 'openei' | 'cached';
  confidence: 'high' | 'medium' | 'low';
  lastUpdated: string;
}
```

**Example:**
```typescript
const rate = await getUtilityRatesByZip('94102');

// Result:
// {
//   electricityRate: 0.2794,
//   demandCharge: 25,
//   utilityName: 'Pacific Gas & Electric',
//   state: 'CA',
//   source: 'eia',
//   confidence: 'high',
//   lastUpdated: '2024-12-01'
// }
```

#### `getCommercialRateByZip(zipCode: string): Promise<number>`

**Quick rate lookup (just $/kWh)**

**Example:**
```typescript
const rate = await getCommercialRateByZip('78701');
// Result: 0.1234
```

---

## 7. EQUIPMENT PRICING TIERS

**File**: `src/services/equipmentPricingTiersService.ts`  
**Purpose**: TrueQuote™-backed equipment pricing with markup

### Functions

#### `getEquipmentPrice(type, tier, size): Promise<EquipmentPriceResult>`

**Get price for any equipment type**

**Parameters:**
- `type`: EquipmentType ('microgrid_controller' | 'bms' | 'scada' | etc.)
- `tier`: PricingTier ('economy' | 'standard' | 'premium' | 'enterprise')
- `size`: System size (kW or kWh depending on equipment)

**Returns:**
```typescript
{
  price: number;                // Base price ($)
  priceWithMarkup: number;      // Price with markup ($)
  markupPercentage: number;     // Markup % (0.12 = 12%)
  truequote: {
    dataSource: string;
    sourceUrl: string;
    sourceDate: string;
    confidenceLevel: 'high' | 'medium' | 'low';
  }
}
```

**Example:**
```typescript
const price = await getEquipmentPrice('microgrid_controller', 'standard', 2000);

// Result:
// {
//   price: 28_500,
//   priceWithMarkup: 35_625,
//   markupPercentage: 0.25,
//   truequote: {
//     dataSource: 'Schneider Electric',
//     sourceUrl: 'https://schneider.com/pricing',
//     sourceDate: '2025-12-01',
//     confidenceLevel: 'high'
//   }
// }
```

#### Convenience Functions

All return `Promise<number>` (price with markup):

- `getMicrogridControllerPrice(systemKW, tier)`
- `getBMSPrice(capacityKWh, tier)`
- `getSCADAPrice(systemKW, tier)`
- `getEMSSoftwarePrice(systemKW, tier)`
- `getDCPatchPanelPrice(ratedCurrent, tier)`
- `getACPatchPanelPrice(ratedCurrent, tier)`
- `getESSEnclosurePrice(capacityKWh, tier)`
- `getTransformerPricePerKVA(systemKVA, tier)`
- `getInverterPricePerKW(systemKW, tier)`
- `getSwitchgearPricePerKW(tier)`

**Example:**
```typescript
const bms = await getBMSPrice(4000, 'standard');
// Result: 8_625 (includes markup)
```

---

## INTEGRATION WITH calculateQuote()

All 7 services are integrated into the main SSOT calculator:

```typescript
import { calculateQuote } from '@/services/unifiedQuoteCalculator';

const result = await calculateQuote({
  storageSizeMW: 2.0,
  durationHours: 4,
  location: 'California',
  zipCode: '94102',          // → utilityRateService
  electricityRate: 0.25,     // Overridden by zipCode
  
  batteryChemistry: 'lfp',   // → batteryDegradationService
  cyclesPerYear: 365,
  averageDoD: 0.8,
  
  solarMW: 1.0,              // → pvWattsService
  state: 'CA',
  
  itcConfig: {                // → itcCalculator
    prevailingWage: true,
    apprenticeship: true,
    energyCommunity: 'coal-closure',
  },
  
  includeAdvancedAnalysis: true,  // → 8760AnalysisService + monteCarloService
});

// Result includes:
// - result.metadata.itcDetails (from itcCalculator)
// - result.metadata.degradation (from batteryDegradationService)
// - result.metadata.solarProduction (from pvWattsService)
// - result.metadata.utilityRates (from utilityRateService)
// - result.metadata.hourlyAnalysis (from 8760AnalysisService)
// - result.metadata.riskAnalysis (from monteCarloService)
// - result.equipment.* (from equipmentPricingTiersService)
```

---

## FALLBACK BEHAVIOR

All services have fallback pricing/values when database unavailable:

| Service | Fallback Behavior |
|---------|------------------|
| ITC Calculator | Hardcoded 30% ITC (pre-IRA standard) |
| Degradation | LFP: 2%/year, NMC: 2.5%/year |
| PVWatts | Regional capacity factors (CA: 21%, TX: 19%, etc.) |
| 8760 Analysis | Simplified savings estimation |
| Monte Carlo | ±25% NPV uncertainty (typical BESS) |
| Utility Rates | EIA state averages |
| Equipment Pricing | 15% default markup, NREL ATB pricing |

---

## ERROR HANDLING

All functions handle errors gracefully:

```typescript
try {
  const result = await someService(...);
} catch (error) {
  // Services catch errors internally and return fallback
  // Check result.confidence or result.audit.confidence
}
```

**Confidence Levels:**
- `high` - Database/API data with recent timestamp
- `medium` - Fallback data from authoritative source (NREL, EIA)
- `low` - Hardcoded fallback estimates

---

## VALIDATION TEST RESULTS

All 41 validation tests passing (Jan 14, 2026):

```
✓ ITC Calculator (7 tests)
✓ Battery Degradation (4 tests)
✓ PVWatts Solar (4 tests)
✓ 8760 Analysis (4 tests)
✓ Monte Carlo (4 tests)
✓ Utility Rates (4 tests)
✓ Equipment Pricing (4 tests)
✓ Quote Integration (6 tests)
✓ Sanity Checks (4 tests)
```

**Test file**: `tests/validation/new-services-validation.test.ts`

---

## TRUEQUOTE™ COMPLIANCE

All services return audit trails with:

1. **Methodology** - How the number was calculated
2. **Sources** - Authoritative data sources (NREL, IRS, EIA, IEEE, etc.)
3. **Confidence** - Data quality level
4. **Timestamp** - When calculated

**Example audit trail:**
```typescript
result.audit = {
  methodology: "Combined calendar aging (1.5%/year) + cycle aging (0.5%/cycle)",
  sources: [
    {
      component: "Calendar aging rate",
      source: "NREL Battery Degradation Model",
      citation: "NREL/TP-5400-78186"
    },
    {
      component: "Cycle aging rate",
      source: "PNNL Li-ion Database",
      citation: "DOI: 10.1149/2.0411814jes"
    }
  ],
  confidence: "high",
  calculatedAt: "2026-01-14T22:47:00Z"
}
```

---

**END OF DOCUMENTATION**
