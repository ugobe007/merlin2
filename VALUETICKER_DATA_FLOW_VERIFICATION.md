# ValueTicker Data Flow Verification
## Date: December 31, 2025

## ✅ Data Point Checklist

| Data Point | Source | Used For | Status |
|------------|--------|----------|--------|
| `annualUsageKwh` | `state.useCaseData?.estimatedAnnualKwh` | Base energy calculation | ✅ Correct |
| `peakDemandKw` | `state.useCaseData?.peakDemandKw` | Demand charge calculation | ✅ Correct |
| `utilityRate` | `state.calculations?.utilityRate \|\| 0.12` | Energy spend | ✅ Correct |
| `demandRate` | `state.calculations?.demandCharge \|\| 15` | Peak demand charges | ✅ Correct |
| `selectedOptions` | `state.selectedOptions?.includes('solar')` etc. | hasSolar/hasGenerator/hasEv flags | ✅ Correct |
| `customSolarKw` | `state.customSolarKw \|\| state.calculations?.solarKW \|\| 0` | Solar savings calc | ✅ Correct |
| `customEvL2` | `state.customEvL2 \|\| 0` | EV revenue calc | ✅ Correct |
| `customEvDcfc` | `state.customEvDcfc \|\| 0` | EV revenue calc | ✅ Correct |
| `customGeneratorKw` | `state.customGeneratorKw \|\| 0` | Protection value | ✅ Correct |
| `bessKwh` | `state.calculations?.bessKWh \|\| 0` | Demand reduction calc | ✅ Correct |

## Code Location

**File:** `src/components/wizard/v6/WizardV6.tsx`  
**Lines:** 105-143

```typescript
const tickerValues = useMemo(() => {
  // Base data from Step 3 (useCaseData)
  const annualUsage = state.useCaseData?.estimatedAnnualKwh || 0;
  const peakDemand = state.useCaseData?.peakDemandKw || 0;
  
  // Utility rates from calculations (Step 5) or defaults
  const utilityRate = state.calculations?.utilityRate || 0.12;
  const demandRate = state.calculations?.demandCharge || 15; // $/kW typical commercial rate
  
  // Calculate annual energy spend and peak demand charges
  const annualEnergySpend = annualUsage * utilityRate;
  const peakDemandCharges = peakDemand * demandRate * 12; // Annual (monthly × 12)
  
  // Get system sizes from state (Step 4 custom values or Step 5 calculations)
  const solarKw = state.customSolarKw || state.calculations?.solarKW || 0;
  const bessKwh = state.calculations?.bessKWh || 0;
  const generatorKw = state.customGeneratorKw || 0;
  const evL2Count = state.customEvL2 || 0;
  const evDcfcCount = state.customEvDcfc || 0;
  
  // Flags based on selectedOptions (set in Step 4)
  const hasSolar = state.selectedOptions?.includes('solar') || false;
  const hasGenerator = state.selectedOptions?.includes('generator') || false;
  const hasEv = state.selectedOptions?.includes('ev') || false;
  
  return {
    annualEnergySpend,
    peakDemandCharges,
    annualUsageKwh: annualUsage,
    solarKw,
    bessKwh,
    generatorKw,
    generatorFuel: state.generatorFuel || 'natural-gas',
    evL2Count,
    evDcfcCount,
    hasSolar,
    hasGenerator,
    hasEv,
    industryType: state.industryName
  };
}, [state]);
```

## Expected Behavior

### Test 1: Step 3 → Step 4 transition
- **Ticker appears:** ✅ Yes, `currentStep >= 3` condition
- **"Without Action" value:** Shows `(peakDemandCharges + outageRisk) / 12` monthly waste
- **Initial state:** Should show low temperature (0-20%) if no options selected

### Test 2: Add Solar
- **Annual value increase:** ✅ Yes, `solarKw * 400` added to total
- **Temperature gauge:** ✅ Yes, calculated as `(totalAnnual + riskProtection) / maxPotential * 100`
- **Breakdown on hover:** ✅ Shows "☀️ Solar: +$X/yr"

### Test 3: Full Configuration
- **Temperature 60-80%+:** ✅ Expected with Solar + Generator + EV
- **All breakdown items:** ✅ BESS, Solar, Generator, EV all show on hover expansion

### Test 4: Hover Expansion
- **Smooth expansion:** ✅ CSS transition `max-height 0.3s ease`
- **Breakdown values:** ✅ All calculated correctly from SSOT constants

## ValueTicker Component Location

**File:** `src/components/wizard/v6/components/ValueTicker.tsx`  
**Rendering:** Between header and main content in WizardV6.tsx (lines ~234-241)

## Calculations Reference

### Constants (SSOT):
- Solar savings: `$400/kW/year`
- BESS demand reduction: `60% of peak demand charges`
- EV revenue: L2 = `$150/mo`, DCFC = `$800/mo`
- Outage cost: `$12,000/hr` × `4 hours avg` = `$48,000/outage`

### Formula:
```
totalAnnual = solarSavings + demandReduction + evRevenue
maxPotential = (annualEnergySpend * 0.35) + (peakDemandCharges * 0.6) + 50000 + 50000
temperaturePct = (totalAnnual + riskProtection) / maxPotential * 100
monthlyWaste = (peakDemandCharges + outageRisk) / 12
```

## Ready for Testing ✅

All data points are correctly mapped and the component is integrated.
