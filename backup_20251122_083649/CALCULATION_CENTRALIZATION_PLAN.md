# 🔧 Calculation Centralization Migration Plan

## Problem Statement
Currently, financial calculations are scattered across **15+ files** with hardcoded constants and inconsistent formulas. This causes:
- ❌ Different parts of the app showing different ROI/payback numbers for the same inputs
- ❌ No single source of truth for calculation constants
- ❌ Difficult to maintain and update formulas
- ❌ Impossible to audit which formula version was used
- ❌ Admin panel cannot control calculation logic

## Solution: Centralized Calculation Service

### New File Created
`src/services/centralizedCalculations.ts` - Single source of truth for ALL financial calculations

### Key Features
1. **Database-Backed Constants**: All calculation constants stored in `calculation_formulas` table
2. **Consistent Calculations**: One function used everywhere across the app
3. **Caching**: 5-minute cache to prevent excessive database queries
4. **Fallback Values**: Graceful degradation if database unavailable
5. **Version Tracking**: Every calculation includes formula version and data source
6. **Audit Trail**: Know exactly which constants were used for each calculation

---

## Constants Moved to Database

### Financial Constants
| Constant | Current Hardcoded Value | New Location |
|----------|------------------------|--------------|
| `PEAK_SHAVING_MULTIPLIER` | 365 | `calculation_formulas.formula_name = 'peak_shaving_multiplier'` |
| `DEMAND_CHARGE_MONTHLY_PER_MW` | $15,000 | `calculation_formulas.formula_name = 'demand_charge_monthly_per_mw'` |
| `GRID_SERVICE_REVENUE_PER_MW` | $30,000 | `calculation_formulas.formula_name = 'grid_service_revenue_per_mw'` |
| `SOLAR_CAPACITY_FACTOR` | 1500 MWh/MW-year | `calculation_formulas.formula_name = 'solar_capacity_factor'` |
| `WIND_CAPACITY_FACTOR` | 2500 MWh/MW-year | `calculation_formulas.formula_name = 'wind_capacity_factor'` |
| `FEDERAL_TAX_CREDIT_RATE` | 0.30 (30%) | `calculation_formulas.formula_name = 'federal_tax_credit_rate'` |

### Operational Constants
| Constant | Current Value | New Location |
|----------|--------------|--------------|
| `ANNUAL_CYCLES` | 365 | `calculation_formulas` |
| `ROUND_TRIP_EFFICIENCY` | 0.85 (85%) | `calculation_formulas` |
| `DEGRADATION_RATE_ANNUAL` | 0.02 (2%) | `calculation_formulas` |
| `OM_COST_PERCENT` | 0.025 (2.5%) | `calculation_formulas` |

---

## Files Currently Doing Calculations (AUDIT)

### ❌ Files with Hardcoded Calculations
1. **SmartWizardV2.tsx** (lines 796-813)
   - `peakShavingSavings = totalEnergyMWh * 365 * (electricityRate - 0.05) * 1000`
   - `demandChargeSavings = storageSizeMW * 12 * 15000`
   - `gridServiceRevenue = storageSizeMW * 30000`

2. **QuoteCompletePage.tsx** (lines 181-205)
   - `calculateROI()` function
   - Duplicate calculation logic

3. **InteractiveConfigDashboard.tsx** (lines 201-212)
   - `energyArbitrage = totalEnergyMWh * 300 * 200`
   - `demandChargeReduction = storageSizeMW * 1000 * 180 * 12`

4. **calculationUtils.ts** (lines 125, 216)
   - `annualSavings = peakShavingSavings + demandChargeSavings`
   - Multiple calculation functions

5. **energyCalculations.ts** (lines 201-249)
   - `calculateEnergySavings()`
   - `calculateROITimeline()`

6. **Step4_Summary.tsx** (lines 68-81)
   - `peakShavingSavings = annualEnergyKWh * 0.7 * (peak - offpeak)`
   - `demandChargeSavings = (power * 1000) * demandCharge * 12`

7. **AdvancedAnalytics.tsx** (lines 65-128)
   - Complete ROI calculation engine
   - `paybackPeriod = totalCapEx / annualSavings`

8. **FinancingCalculator.tsx** (lines 126+)
   - PPA and loan calculations

9. **useCaseService.ts** (lines 518-524)
   - `paybackYears = estimatedCost / projectedSavings`

10. **quoteExport.ts** (multiple locations)
    - Export formatting uses hardcoded formulas

11. **industryStandardFormulas.ts** (lines 167-250)
    - Complete financial calculation suite

12. **advancedFinancialModeling.ts** (lines 1283-1350)
    - NPV, IRR, payback calculations

13. **marketIntelligence.ts** (line 173)
    - `simplePayback = totalCapex / annualProfit`

14. **pricingIntelligence.ts** (line 217)
    - `simplePayback = totalCapex / netAnnualRevenue`

15. **wordExportService.ts** (line 504)
    - Documentation of formulas

---

## Migration Steps

### Phase 1: Database Setup ✅ COMPLETE
- [x] Create `calculation_formulas` table
- [x] Create centralized calculation service
- [x] Add caching mechanism

### Phase 2: Populate Database (NEXT)
```sql
-- Insert calculation constants into database
INSERT INTO calculation_formulas (formula_name, formula_expression, variables, category) VALUES
('peak_shaving_multiplier', '365', '{"value": 365, "unit": "cycles/year"}', 'Financial'),
('demand_charge_monthly_per_mw', '15000', '{"value": 15000, "unit": "$/MW-month"}', 'Financial'),
('grid_service_revenue_per_mw', '30000', '{"value": 30000, "unit": "$/MW-year"}', 'Financial'),
('solar_capacity_factor', '1500', '{"value": 1500, "unit": "MWh/MW-year"}', 'Renewable'),
('wind_capacity_factor', '2500', '{"value": 2500, "unit": "MWh/MW-year"}', 'Renewable'),
('federal_tax_credit_rate', '0.30', '{"value": 0.30, "unit": "percentage"}', 'Tax'),
('annual_cycles', '365', '{"value": 365, "unit": "cycles/year"}', 'Operational'),
('round_trip_efficiency', '0.85', '{"value": 0.85, "unit": "percentage"}', 'Technical'),
('degradation_rate_annual', '0.02', '{"value": 0.02, "unit": "percentage/year"}', 'Technical'),
('om_cost_percent', '0.025', '{"value": 0.025, "unit": "percentage"}', 'O&M');
```

### Phase 3: Update SmartWizardV2 (HIGH PRIORITY)
**File**: `src/components/wizard/SmartWizardV2.tsx`

**Before**:
```typescript
const peakShavingSavings = totalEnergyMWh * 365 * (electricityRate - 0.05) * 1000;
const demandChargeSavings = storageSizeMW * 12 * 15000;
const gridServiceRevenue = storageSizeMW * 30000;
```

**After**:
```typescript
import { calculateFinancialMetrics } from '@/services/centralizedCalculations';

const results = await calculateFinancialMetrics({
  storageSizeMW,
  durationHours,
  solarMW,
  windMW,
  generatorMW,
  location,
  electricityRate
});
```

### Phase 4: Update QuoteCompletePage
**File**: `src/components/wizard/QuoteCompletePage.tsx`

Remove `calculateROI()` function and use centralized service

### Phase 5: Update Remaining Files
Systematically replace all hardcoded calculations in the 15 files listed above

### Phase 6: Testing
- [ ] Test wizard with various configurations
- [ ] Verify ROI numbers match across all pages
- [ ] Test with database unavailable (fallback mode)
- [ ] Performance test with cache

### Phase 7: Admin Interface
- [ ] Build admin panel to manage `calculation_formulas` table
- [ ] Add UI to update constants
- [ ] Add "Refresh Cache" button
- [ ] Add audit log for formula changes

---

## Benefits After Migration

### ✅ Consistency
- Same calculation everywhere = same results everywhere
- No more "why is the dashboard showing different numbers?"

### ✅ Maintainability
- Update one value in database → affects entire app
- No need to hunt through 15 files to change a constant

### ✅ Auditability
- Every calculation includes version number
- Know exactly which formula was used
- Track changes over time

### ✅ Admin Control
- Non-technical users can adjust formulas
- No code deployment needed for constant updates
- Instant updates via cache refresh

### ✅ Performance
- 5-minute cache prevents excessive DB queries
- Fallback mode ensures app works offline

---

## SQL Script to Add Constants

```sql
-- Filename: /docs/06_ADD_CALCULATION_CONSTANTS.sql

-- Insert calculation constants
INSERT INTO calculation_formulas 
(formula_name, description, formula_expression, variables, category, industry_standard_reference, version, is_active)
VALUES
-- Financial Constants
('peak_shaving_multiplier', 
 'Annual cycles for peak shaving arbitrage', 
 'annualSavings = energyMWh * cycles * (peakRate - offpeakRate) * 1000',
 '{"cycles": 365, "unit": "cycles/year", "typical_spread": 0.05}',
 'Financial',
 'NREL APR 2024 - Energy Arbitrage Methodology',
 '1.0',
 true),

('demand_charge_monthly_per_mw',
 'Monthly demand charge reduction value per MW',
 'demandSavings = powerMW * monthlyRate * 12',
 '{"monthly_rate": 15000, "unit": "$/MW-month"}',
 'Financial',
 'Commercial Industrial Rate Schedules 2024',
 '1.0',
 true),

('grid_service_revenue_per_mw',
 'Annual grid services revenue per MW of capacity',
 'gridRevenue = powerMW * annualRate',
 '{"annual_rate": 30000, "unit": "$/MW-year", "includes": ["frequency_regulation", "voltage_support", "capacity_payments"]}',
 'Financial',
 'FERC Order 841 & ISO-NE Market Data',
 '1.0',
 true),

-- Renewable Constants
('solar_capacity_factor',
 'Annual energy production per MW of solar',
 'solarEnergy = solarMW * capacityFactor',
 '{"capacity_factor": 1500, "unit": "MWh/MW-year", "assumes": "20% capacity factor with 8760 hours"}',
 'Renewable',
 'NREL PVWatts - National Average',
 '1.0',
 true),

('wind_capacity_factor',
 'Annual energy production per MW of wind',
 'windEnergy = windMW * capacityFactor',
 '{"capacity_factor": 2500, "unit": "MWh/MW-year", "assumes": "30% capacity factor"}',
 'Renewable',
 'DOE Wind Energy Report 2024',
 '1.0',
 true),

-- Tax & Incentives
('federal_tax_credit_rate',
 'Federal Investment Tax Credit (ITC) rate',
 'taxCredit = totalCost * rate',
 '{"rate": 0.30, "unit": "percentage", "expires": "2032", "applies_to": ["standalone_storage", "solar_paired_storage"]}',
 'Tax',
 'Inflation Reduction Act (IRA) 2022',
 '1.0',
 true),

-- Operational Constants
('annual_cycles',
 'Expected annual charge/discharge cycles',
 'cycles = 365',
 '{"cycles": 365, "unit": "cycles/year", "daily_cycling": true}',
 'Operational',
 'Industry Standard - Daily Cycling',
 '1.0',
 true),

('round_trip_efficiency',
 'Battery round-trip efficiency',
 'efficiency = 0.85',
 '{"efficiency": 0.85, "unit": "percentage", "chemistry": "LFP"}',
 'Technical',
 'Battery Manufacturer Specifications',
 '1.0',
 true),

('degradation_rate_annual',
 'Annual battery capacity degradation rate',
 'degradation = 0.02',
 '{"rate": 0.02, "unit": "percentage/year", "eol_capacity": 0.80, "warranty_years": 10}',
 'Technical',
 'Battery Warranty Standards',
 '1.0',
 true),

('om_cost_percent',
 'Annual O&M cost as percentage of CAPEX',
 'omCost = totalCost * rate',
 '{"rate": 0.025, "unit": "percentage", "includes": ["maintenance", "monitoring", "insurance"]}',
 'O&M',
 'NREL ATB 2024 - O&M Cost Assumptions',
 '1.0',
 true);
```

---

## Implementation Timeline

| Phase | Task | Priority | Estimated Time |
|-------|------|----------|----------------|
| 1 | ✅ Create centralized service | DONE | - |
| 2 | Insert constants into database | HIGH | 30 min |
| 3 | Update SmartWizardV2 | HIGH | 1 hour |
| 4 | Update QuoteCompletePage | HIGH | 30 min |
| 5 | Update remaining files | MEDIUM | 3 hours |
| 6 | Testing & QA | HIGH | 2 hours |
| 7 | Build admin interface | LOW | 4 hours |

**Total Estimated Time**: ~11 hours

---

## Next Steps

1. **Run the SQL script** to populate `calculation_formulas` table
2. **Test the centralized service** with console logs
3. **Update SmartWizardV2** first (highest impact)
4. **Verify numbers match** before and after migration
5. **Gradually migrate** other files one at a time

---

## Rollback Plan

If issues arise:
1. Centralized service has fallback mode with original constants
2. Can revert individual file changes
3. Cache can be cleared to force fresh database reads
4. Original formulas preserved in fallback constants

---

**Status**: ✅ Service Created | ⏳ Awaiting Database Population
**Last Updated**: November 11, 2025
**Version**: 1.0
