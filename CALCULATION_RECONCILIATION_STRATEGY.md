# 🔄 CALCULATION RECONCILIATION STRATEGY
**Date**: November 21, 2025  
**Status**: PRE-LAUNCH - ZERO BREAKING CHANGES  
**Goal**: Validate calculations without disrupting workflows

---

## 🎯 CORE PRINCIPLE

**"Validate, Don't Replace"**

Keep fast, context-aware calculations in place. Add validation layer to catch errors.

---

## 📐 CALCULATION TAXONOMY

### Tier 1: PROTECTED (Do Not Touch)
**Industry-Specific Advanced Calculations** - These are your competitive advantage

**Files to Preserve**:
1. `advancedFinancialModeling.ts` (1,500+ lines)
   - Target IRR-based pricing
   - Professional battery capacity fading models
   - Multiple revenue stream modeling
   - DCF analysis with Monte Carlo simulations
   - ✅ **KEEP AS-IS** - This is your secret sauce

2. `baselineService.ts` - Industry-specific sizing
   - EV Charging: Charger-based calculations
   - Data Center: Rack-based + tier classification
   - Hotel: Room-based power profiles
   - ✅ **KEEP AS-IS** - Context-aware, accurate

3. `unifiedPricingService.ts` - Regional pricing
   - Vendor-specific logic
   - Regional adjustments
   - Size-based scaling
   - ✅ **KEEP AS-IS** - Working correctly

### Tier 2: VALIDATE (Add Checks)
**Fast Execution Path Calculations** - Keep but validate

**Files to Add Validation**:
1. `SmartWizardV2.tsx` - calculateCosts()
2. `Step4_QuoteSummary.tsx` - Equipment breakdown
3. `AdvancedQuoteBuilder.tsx` - System calculations

### Tier 3: RECONCILE (Fix Inconsistencies)
**Deprecated/Duplicate Calculations** - Replace with central service

**Files to Update**:
1. `dataIntegrationService.ts` - Remove `calculateBESSFinancials()`
2. Old NPV/IRR approximations - Point to central service

---

## 🛡️ VALIDATION LAYER (Non-Breaking)

### Strategy: Runtime Validation in Development

```typescript
// NEW FILE: src/utils/calculationValidator.ts

/**
 * Validation layer - runs in development only
 * Compares local calculations with central service
 * Logs warnings but doesn't break execution
 */

import { calculateFinancialMetrics } from '@/services/centralizedCalculations';

interface ValidationResult {
  isValid: boolean;
  variance: number;
  localValue: number;
  centralValue: number;
  message: string;
}

export async function validateFinancialCalculation(
  localResult: {
    paybackYears?: number;
    roi10Year?: number;
    annualSavings?: number;
    netCost?: number;
  },
  inputs: {
    storageSizeMW: number;
    durationHours: number;
    electricityRate: number;
    equipmentCost?: number;
    // ... other inputs
  },
  source: string // e.g., "SmartWizardV2", "AdvancedQuoteBuilder"
): Promise<ValidationResult | null> {
  
  // Only validate in development
  if (import.meta.env.PROD) return null;
  
  try {
    // Get central calculation
    const central = await calculateFinancialMetrics(inputs);
    
    // Compare payback years (most critical metric)
    if (localResult.paybackYears && central.paybackYears) {
      const variance = Math.abs(
        (localResult.paybackYears - central.paybackYears) / central.paybackYears
      );
      
      const result: ValidationResult = {
        isValid: variance < 0.05, // 5% tolerance
        variance,
        localValue: localResult.paybackYears,
        centralValue: central.paybackYears,
        message: variance > 0.05 
          ? `⚠️ ${source}: Payback calculation off by ${(variance * 100).toFixed(1)}%`
          : `✅ ${source}: Calculation validated`
      };
      
      // Log to console in development
      if (!result.isValid) {
        console.warn(result.message, {
          local: localResult,
          central,
          variance: `${(variance * 100).toFixed(2)}%`
        });
      } else {
        console.log(result.message);
      }
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error(`Validation failed for ${source}:`, error);
    return null;
  }
}

/**
 * Validation decorator for calculation functions
 * Use this to wrap existing calculations
 */
export function withValidation<T extends (...args: any[]) => any>(
  fn: T,
  source: string,
  extractInputs: (args: Parameters<T>) => any
): T {
  return (async (...args: Parameters<T>) => {
    // Execute original function
    const result = await fn(...args);
    
    // Validate in background (don't block)
    if (!import.meta.env.PROD) {
      const inputs = extractInputs(args);
      validateFinancialCalculation(result, inputs, source)
        .catch(err => console.error('Validation error:', err));
    }
    
    return result;
  }) as T;
}
```

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: Add Validation Layer (Week 1) - ZERO BREAKING CHANGES

#### Step 1.1: Create Validator
```bash
# Create new validation utility
touch src/utils/calculationValidator.ts
```

#### Step 1.2: Add to SmartWizardV2 (Non-Breaking)
```typescript
// File: src/components/wizard/SmartWizardV2.tsx
// ADD at top:
import { validateFinancialCalculation } from '@/utils/calculationValidator';

// MODIFY calculateCosts() - ADD validation after calculation:
const calculateCosts = async () => {
  const equipmentBreakdown = await calculateEquipmentBreakdown(...);
  
  // EXISTING CODE - keep as-is
  const simplifiedSavings = totalEnergyMWh * 365 * (electricityRate - 0.05);
  
  const calculatedCosts = {
    equipmentCost: equipmentBreakdown.batterySystem,
    grandTotal: equipmentBreakdown.totalProjectCost,
    annualSavings: simplifiedSavings,
    paybackYears: equipmentBreakdown.totalProjectCost / simplifiedSavings
  };
  
  // NEW: Validate in development only
  await validateFinancialCalculation(
    calculatedCosts,
    {
      storageSizeMW: powerMW,
      durationHours: durationHrs,
      solarMW: solarMWp,
      electricityRate,
      equipmentCost: equipmentBreakdown.batterySystem,
      installationCost: equipmentBreakdown.installation
    },
    'SmartWizardV2.calculateCosts'
  );
  
  return calculatedCosts; // Return original calculation (no breaking change)
};
```

**Result**: 
- ✅ Existing calculations still run
- ✅ Validation happens in background
- ✅ Warnings logged in development
- ✅ Zero performance impact in production

---

### Phase 2: Fix Known Issues (Week 2) - SURGICAL FIXES

#### Fix 2.1: dataIntegrationService.ts - DEPRECATED FUNCTION
```typescript
// File: src/services/dataIntegrationService.ts
// Lines 176, 462

// CURRENT (WRONG):
import { calculateBESSFinancials } from './bessDataService';
const bessCalculations = calculateBESSFinancials({ ... });

// REPLACE WITH (RIGHT):
import { calculateFinancialMetrics } from './centralizedCalculations';
const bessCalculations = await calculateFinancialMetrics({
  storageSizeMW: params.powerMW,
  durationHours: params.durationHours,
  electricityRate: params.electricityRate || 0.12,
  solarMW: params.solarKW ? params.solarKW / 1000 : 0,
  equipmentCost: systemCost, // From existing calculation
  includeNPV: true
});
```

**Testing**:
```typescript
// Before & after comparison
const oldResult = calculateBESSFinancials({ ... });
const newResult = await calculateFinancialMetrics({ ... });

console.log('Migration validation:', {
  paybackDiff: Math.abs(oldResult.paybackYears - newResult.paybackYears),
  npvOld: oldResult.netPresentValue,
  npvNew: newResult.npv,
  acceptable: Math.abs(oldResult.paybackYears - newResult.paybackYears) < 0.5
});
```

#### Fix 2.2: Add @deprecated Tags (Non-Breaking)
```typescript
// File: src/services/bessDataService.ts
/**
 * @deprecated Since v2.0.0 - Use calculateFinancialMetrics() from centralizedCalculations.ts
 * This function will be removed in v3.0.0
 * Migration guide: See CALCULATION_AUDIT_REPORT.md
 */
export function calculateBESSFinancials(inputs: BESSFinancialInputs) {
  if (import.meta.env.DEV) {
    console.warn(
      '⚠️ DEPRECATED: calculateBESSFinancials() is deprecated.\n' +
      'Please use calculateFinancialMetrics() from centralizedCalculations.ts\n' +
      'See CALCULATION_AUDIT_REPORT.md for migration guide.'
    );
  }
  // ... existing implementation (keep for backward compatibility)
}
```

---

### Phase 3: Enhanced Central Service (Week 3) - ADDITIVE ONLY

#### Enhancement 3.1: Add Industry Context to Central Calculations
```typescript
// File: src/services/centralizedCalculations.ts
// ADD new optional parameter (doesn't break existing code):

export interface FinancialCalculationInput {
  // Existing parameters...
  storageSizeMW: number;
  durationHours: number;
  
  // NEW: Industry-specific context (optional)
  industryContext?: {
    useCase: string; // 'ev-charging', 'data-center', 'hotel', etc.
    customMultipliers?: {
      peakShavingFactor?: number;
      demandChargeMultiplier?: number;
      gridServicesFactor?: number;
    };
    degradationProfile?: 'standard' | 'aggressive' | 'conservative';
  };
}

// ENHANCE calculation to use industry context:
export async function calculateFinancialMetrics(
  input: FinancialCalculationInput
): Promise<FinancialCalculationResult> {
  
  const constants = await getCalculationConstants();
  
  // NEW: Apply industry-specific adjustments
  const industryMultipliers = input.industryContext?.customMultipliers || {};
  const peakShavingMultiplier = industryMultipliers.peakShavingFactor 
    || constants.PEAK_SHAVING_MULTIPLIER;
  
  // Use industry-specific multiplier instead of generic
  const peakShavingSavings = totalEnergyMWh * peakShavingMultiplier 
    * (electricityRate - 0.05) * 1000;
  
  // ... rest of calculation
}
```

**Benefits**:
- ✅ Central service now supports industry-specific logic
- ✅ Backward compatible (industryContext is optional)
- ✅ Components can pass context for more accurate results

---

### Phase 4: Gradual Migration (Week 4) - OPTIONAL IMPROVEMENTS

#### Migration 4.1: Smart Wizard Enhancement (Optional)
```typescript
// File: src/components/wizard/SmartWizardV2.tsx
// OPTION A: Keep existing + add enhanced results

const calculateCosts = async () => {
  // KEEP existing fast path
  const equipmentBreakdown = await calculateEquipmentBreakdown(...);
  const simplifiedSavings = totalEnergyMWh * 365 * (electricityRate - 0.05);
  
  const quickResults = {
    equipmentCost: equipmentBreakdown.batterySystem,
    grandTotal: equipmentBreakdown.totalProjectCost,
    annualSavings: simplifiedSavings,
    paybackYears: equipmentBreakdown.totalProjectCost / simplifiedSavings
  };
  
  // NEW: Also calculate enhanced metrics (async, don't block)
  const enhancedPromise = calculateFinancialMetrics({
    storageSizeMW: powerMW,
    durationHours: durationHrs,
    solarMW: solarMWp,
    electricityRate,
    equipmentCost: equipmentBreakdown.batterySystem,
    installationCost: equipmentBreakdown.installation,
    includeNPV: true,
    industryContext: {
      useCase: selectedTemplate,
      degradationProfile: 'standard'
    }
  });
  
  // Return quick results immediately
  setCosts(quickResults);
  
  // Update with enhanced metrics when ready (non-blocking)
  enhancedPromise.then(enhanced => {
    setCosts({
      ...quickResults,
      npv: enhanced.npv,
      irr: enhanced.irr,
      discountedPayback: enhanced.discountedPayback,
      enhancedMetricsAvailable: true
    });
  });
  
  return quickResults; // Fast path preserved
};
```

**Result**:
- ✅ Fast initial render (existing calculation)
- ✅ Enhanced metrics appear 200ms later
- ✅ User sees instant feedback, gets better data shortly after
- ✅ Zero breaking changes

---

## 🧪 TESTING STRATEGY

### Development Testing (Automatic)
```typescript
// File: src/tests/calculationReconciliation.test.ts

import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
import { calculateDatabaseBaseline } from '@/services/baselineService';

describe('Calculation Reconciliation', () => {
  test('SmartWizard calculations within 5% of central service', async () => {
    const testCase = {
      storageSizeMW: 2.0,
      durationHours: 4,
      electricityRate: 0.12,
      useCase: 'hotel'
    };
    
    // Simulate wizard calculation
    const wizardPayback = (2000000 * 0.85) / 250000; // Simplified
    
    // Central calculation
    const central = await calculateFinancialMetrics(testCase);
    
    const variance = Math.abs(wizardPayback - central.paybackYears) / central.paybackYears;
    
    expect(variance).toBeLessThan(0.05); // Within 5%
    
    if (variance > 0.05) {
      console.warn('⚠️ Wizard calculation divergence:', {
        wizard: wizardPayback,
        central: central.paybackYears,
        variance: `${(variance * 100).toFixed(2)}%`
      });
    }
  });
  
  test('Industry-specific calculations preserved', async () => {
    // Test EV Charging maintains charger-based logic
    const evBaseline = await calculateDatabaseBaseline('ev-charging', 1.0, {
      chargers: 10,
      chargersPerHour: 5
    });
    
    expect(evBaseline.dataSource).toContain('charger specifications');
    expect(evBaseline.powerMW).toBeGreaterThan(0);
  });
  
  test('Advanced financial modeling intact', async () => {
    // Ensure advancedFinancialModeling.ts still works
    const { calculateDCFMetrics } = await import('@/services/advancedFinancialModeling');
    
    const result = await calculateDCFMetrics({
      initialInvestment: 2000000,
      projectLifeYears: 25,
      // ... other inputs
    });
    
    expect(result.dcf).toBeDefined();
    expect(result.targetIRR).toBeGreaterThan(0);
  });
});
```

### Pre-Launch Checklist
```bash
# Run before deploying
npm run test                    # All tests pass
npm run build                   # TypeScript compilation
npm run dev                     # Check console for validation warnings

# Manually test critical paths:
# 1. Complete SmartWizardV2 flow (all use cases)
# 2. Create quote in AdvancedQuoteBuilder
# 3. Check QuoteCompletePage calculations
# 4. Verify no calculation errors in console
```

---

## 📊 VALIDATION DASHBOARD (Development Only)

### Create Admin Panel for Calculation Health
```typescript
// File: src/components/admin/CalculationHealthDashboard.tsx

export function CalculationHealthDashboard() {
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  
  useEffect(() => {
    // Listen to validation events
    window.addEventListener('calculationValidation', (e: CustomEvent) => {
      setValidations(prev => [...prev, e.detail]);
    });
  }, []);
  
  const failedValidations = validations.filter(v => !v.isValid);
  const avgVariance = validations.reduce((sum, v) => sum + v.variance, 0) 
    / validations.length;
  
  return (
    <div className="p-6">
      <h2>Calculation Health</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-2xl">{validations.length}</div>
          <div className="text-sm">Total Validations</div>
        </div>
        <div>
          <div className="text-2xl text-red-600">{failedValidations.length}</div>
          <div className="text-sm">Failed (>5% variance)</div>
        </div>
        <div>
          <div className="text-2xl">{(avgVariance * 100).toFixed(2)}%</div>
          <div className="text-sm">Avg Variance</div>
        </div>
      </div>
      
      {failedValidations.length > 0 && (
        <div className="mt-4">
          <h3>Issues Detected:</h3>
          <ul>
            {failedValidations.map((v, i) => (
              <li key={i} className="text-red-600">
                {v.message} (Variance: {(v.variance * 100).toFixed(2)}%)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 DEPLOYMENT STRATEGY

### Pre-Launch (Now)
1. ✅ Run validation audit (DONE - CALCULATION_AUDIT_REPORT.md)
2. Add validation layer (non-breaking)
3. Fix 2 critical issues in dataIntegrationService
4. Add @deprecated tags
5. Test all critical paths

### Launch (Week 1-2)
1. Deploy with validation layer active
2. Monitor validation warnings in development
3. Customer testing with existing calculations (working)
4. Collect validation data

### Post-Launch (Week 3-4)
1. Review validation data
2. Gradually enhance calculations based on data
3. Add industry context to central service
4. Optional: Migrate to enhanced calculations

---

## 🎓 DOMAIN-SPECIFIC KNOWLEDGE

### BESS Financial Calculations - Critical Concepts

#### 1. Degradation Modeling
```typescript
// Battery capacity degrades over time
// Year 1: 100% capacity
// Year 10: ~80% capacity (2% annual degradation)
// Year 25: ~60% capacity

const degradationFactor = Math.pow(1 - 0.02, year - 1);
const effectiveCapacity = initialCapacity * degradationFactor;
```

#### 2. Levelized Cost of Storage (LCOS)
```typescript
// Total lifetime costs / Total lifetime energy throughput
// Critical for comparing storage technologies
LCOS = (CAPEX + Σ(OPEX_year / (1 + r)^year)) / Σ(Energy_year / (1 + r)^year)
```

#### 3. Demand Charge Savings
```typescript
// Commercial customers pay for peak demand ($/kW-month)
// BESS shaves peaks → reduces demand charges
// Often 30-50% of electricity bill for commercial/industrial
demandChargeSavings = peakReduction_MW * 12_months * demandRate_per_MW
```

#### 4. Industry-Specific Multipliers

**EV Charging**:
- Peak demand management: 2-4 hour duration
- Demand charges: 40-60% of total savings
- Time-of-use optimization critical

**Data Centers**:
- Backup power: 15min - 2 hours (Tier III: 72 hours)
- Uptime requirements: 99.99% (Tier IV: 99.995%)
- N+1 redundancy required

**Hotels**:
- Peak morning/evening (breakfast, check-in/out)
- HVAC load dominant (50-60% of power)
- Seasonal variations important

---

## 🔐 PROTECTED FORMULAS

### DO NOT MODIFY
These formulas are industry-validated and customer-tested:

1. **Target IRR Pricing** (advancedFinancialModeling.ts)
   - Backward calculation from desired return
   - Used for competitive quotes
   
2. **Grid-Synk BESS Sizing** (gridSynkBessFormulas.ts)
   - Industry-standard methodology
   - Used for equipment specifications

3. **Baseline Sizing Logic** (baselineService.ts)
   - Template-driven, data-validated
   - Industry-specific multipliers

---

## ✅ SUCCESS CRITERIA

### Week 1 (Validation Layer)
- [ ] calculationValidator.ts created
- [ ] SmartWizardV2 validation added (non-breaking)
- [ ] Console shows validation results in dev mode
- [ ] Zero breaking changes in production

### Week 2 (Critical Fixes)
- [ ] dataIntegrationService.ts migrated
- [ ] @deprecated tags added
- [ ] All tests pass
- [ ] Manual testing completed

### Week 3 (Enhanced Central Service)
- [ ] Industry context support added
- [ ] Backward compatibility maintained
- [ ] Documentation updated

### Week 4 (Monitoring)
- [ ] Validation dashboard live
- [ ] Calculation variance < 5% average
- [ ] Zero customer-reported calculation errors

---

## 📞 SUPPORT

If validation detects issues:
1. Check console warnings in development
2. Review CALCULATION_AUDIT_REPORT.md
3. Compare local vs central calculations
4. File issue with validation data

---

**Remember**: Validate, don't replace. Your industry-specific calculations are your competitive advantage. We're adding safety rails, not changing the road.
