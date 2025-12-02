# Professional Financial Model Service

**Date:** November 29, 2025  
**Status:** ✅ Complete  
**File:** `src/services/professionalFinancialModel.ts`

## Overview

Bank/investor-ready BESS financial modeling service that produces professional-grade 3-5 year (or 25-year) financial projections suitable for:
- Project finance lenders
- Equity investors
- Developer pro formas
- Due diligence packages

**Based on industry standards from:**
- [NREL SAM Battery Storage](https://sam.nrel.gov/battery-storage.html)
- [Sandia ESS Publications](https://www.sandia.gov/ess-ssl/publications/)
- [Acelerex BESS Financial Model](https://acelerex.com/post/proforma-financial-model-of-bess)

## Key Features

### 1. 3-Statement Financial Model
- **Income Statement**: Revenue, OPEX, EBITDA, Depreciation, Interest, Taxes, Net Income
- **Balance Sheet**: Assets, Liabilities, Equity
- **Cash Flow Statement**: Operating, Financing, Free Cash Flow to Firm & Equity

### 2. DSCR (Debt Service Coverage Ratio)
- Required by all project finance lenders
- Calculates Average DSCR and Minimum DSCR
- Standard threshold: 1.25x minimum for most lenders

### 3. Levered vs Unlevered IRR
- **Unlevered IRR**: Returns to total project capital (before financing)
- **Levered IRR**: Returns to equity investors (after debt service)
- Banks care about unlevered; equity investors care about levered

### 4. MACRS Depreciation + ITC
- 5-Year MACRS schedule (IRS Publication 946)
- 30% ITC with 50% basis reduction
- Depreciation tax shield calculated correctly

### 5. LCOS (Levelized Cost of Storage)
- **NREL/Sandia standard metric**
- Formula: (CAPEX + NPV(OPEX) + NPV(Charging)) / NPV(Energy Discharged)
- Accounts for degradation, efficiency, and cycling
- Critical for comparing BESS with other storage technologies

### 6. Revenue Stacking
- **Energy Arbitrage**: Peak/off-peak price spread × cycles
- **Demand Charge Reduction**: $/kW-month × reliability factor  
- **Frequency Regulation**: ISO-specific rates (CAISO, ERCOT, PJM, etc.)
- **Spinning Reserve**: Ancillary service market rates
- **Capacity Payments**: Resource Adequacy/capacity market values
- **ISO-Specific Rates**: Different markets have different prices

### 7. Capital Structure
- Configurable debt/equity ratio (default 70/30)
- Interest rate and loan term inputs
- Full debt amortization schedule## Usage

```typescript
import { generateProfessionalModel } from '@/services/professionalFinancialModel';

const model = await generateProfessionalModel({
  storageSizeMW: 10,
  durationHours: 4,
  location: 'California',
  isoRegion: 'CAISO',
  electricityRate: 0.15,
  revenueStreams: {
    energyArbitrage: true,
    demandChargeReduction: true,
    frequencyRegulation: true,
    spinningReserve: false,
    capacityPayments: true,
    resourceAdequacy: true
  },
  // Optional overrides
  debtEquityRatio: 0.7,
  interestRate: 0.06,
  loanTermYears: 15,
  itcRate: 0.30
});

// Access results
console.log(model.summary);            // Executive summary
console.log(model.incomeStatements);   // 25-year income statements
console.log(model.debtSchedule);       // Debt amortization with DSCR
```

## Output Structure

### Executive Summary
```typescript
{
  projectName: "10 MW / 4h BESS - California",
  totalCapex: 12500000,
  equityInvestment: 3750000,
  debtAmount: 8750000,
  totalAnnualRevenue: 850000,
  simplePayback: 6.2,
  discountedPayback: 7.8,
  unleveredIRR: 12.5,
  leveredIRR: 18.2,
  npv: 2850000,
  averageDSCR: 1.85,
  minimumDSCR: 1.42,
  ebitdaYear1: 650000,
  moic: 2.4,
  lcos: 142.50,  // $/MWh - NREL/Sandia standard
  capacityFactorEffective: 68.5  // % after degradation
}
```

### Key Metrics by Year
```typescript
[
  { year: 1, revenue: 850000, ebitda: 650000, dscr: 1.42, ... },
  { year: 2, revenue: 867000, ebitda: 663000, dscr: 1.48, ... },
  // ... through year 25
]
```

## Sensitivity Analysis

```typescript
import { generateSensitivityMatrix } from '@/services/professionalFinancialModel';

const sensitivity = await generateSensitivityMatrix(
  baseInput,
  ['electricityRate', 'interestRate', 'degradation']
);

// Returns impact on Levered IRR, NPV, and Min DSCR for each parameter
```

## Revenue Calculation Methodology

### Energy Arbitrage
Based on NREL and industry benchmarks:
- Average price spread: $30/MWh (varies by ISO)
- Cycles per year: ~300 effective cycles (80% of max)
- Degradation applied year-over-year

### Frequency Regulation Rates ($/MW-hour)
| ISO | Rate |
|-----|------|
| PJM | $20 |
| NYISO | $18 |
| ISO-NE | $15 |
| CAISO | $12 |
| MISO | $10 |
| ERCOT | $8 |

### Capacity Market Rates ($/MW-year)
| ISO | Rate |
|-----|------|
| NYISO | $60,000 |
| PJM | $55,000 |
| ISO-NE | $50,000 |
| CAISO | $45,000 |
| MISO | $20,000 |
| ERCOT | $0 (no capacity market) |

## Integration Points

This service integrates with:
1. **unifiedQuoteCalculator.ts** - Gets equipment costs
2. **centralizedCalculations.ts** - Gets database constants
3. **unifiedPricingService.ts** - Gets battery pricing

## Future Enhancements

- [ ] Excel export with formatted spreadsheets
- [ ] PDF report generation
- [ ] Monte Carlo risk analysis on DSCR
- [ ] Tax equity flip modeling
- [ ] PPA vs merchant revenue scenarios
- [ ] Currency conversion for international projects
