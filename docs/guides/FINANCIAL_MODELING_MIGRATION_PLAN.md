# Advanced Financial Modeling Migration Plan

**Date**: November 16, 2025  
**Objective**: Integrate sophisticated financial modeling from `advancedFinancialModeling.ts` into active codebase  
**Status**: Planning Phase

---

## 🎯 Current State Analysis

### Three Financial Calculation Systems

| System | Lines | Status | Features | UI Access |
|--------|-------|--------|----------|-----------|
| **AdvancedAnalytics.tsx** | 376 | ✅ Active | NPV, IRR, payback, ROI, adjustable params | FinancialSummaryPanel button |
| **centralizedCalculations.ts** | 457 | ✅ Active | Basic metrics, database-driven, simple NPV/IRR | Used across app |
| **advancedFinancialModeling.ts** | 1,584 | ❌ Unused | MIRR, sensitivity, risk, scenarios, degradation | None (orphaned) |

### Key Finding

**The sophisticated features in `advancedFinancialModeling.ts` are NOT available to users.**

Advanced features include:
- ✅ MIRR (Modified Internal Rate of Return)
- ✅ Sensitivity Analysis with tornado charts
- ✅ Monte Carlo risk analysis
- ✅ Value at Risk (VaR 95%, 99%)
- ✅ Scenario analysis (optimistic/base/pessimistic)
- ✅ Revenue stacking optimization
- ✅ Multi-battery system modeling
- ✅ 8 different degradation models
- ✅ Hourly forecast engine
- ✅ Professional investor presentations

---

## 🚀 Recommended Approach: Enhanced Integration

### Phase 1: Migrate Core Advanced Functions (6-8 hours)

**Objective**: Move sophisticated calculations into `centralizedCalculations.ts` as the single source of truth

#### Step 1.1: Add Advanced Functions to centralizedCalculations.ts

**Functions to migrate:**

```typescript
// From advancedFinancialModeling.ts lines 1346-1408
// → Into centralizedCalculations.ts

/**
 * Modified Internal Rate of Return (MIRR)
 * More realistic than IRR because it assumes reinvestment at discount rate
 */
export function calculateMIRR(
  cashFlows: number[], 
  financeRate: number, 
  reinvestmentRate: number
): number {
  // Implementation from advancedFinancialModeling.ts lines 1371-1407
}

/**
 * Sensitivity Analysis
 * Shows how NPV/IRR change with parameter variations
 */
export function performSensitivityAnalysis(
  baseInputs: FinancialCalculationInput,
  parameters: string[],
  variationPercent: number
): SensitivityAnalysisResult {
  // Implementation from advancedFinancialModeling.ts lines 1470-1540
}

/**
 * Risk Analysis with Monte Carlo Simulation
 * Calculates probability distributions for financial outcomes
 */
export async function performRiskAnalysis(
  inputs: FinancialCalculationInput,
  numSimulations: number = 1000
): Promise<RiskAnalysisResult> {
  // Implementation from advancedFinancialModeling.ts lines 1410-1467
}

/**
 * Scenario Analysis
 * Compare optimistic, base, and pessimistic cases
 */
export function performScenarioAnalysis(
  baseInputs: FinancialCalculationInput
): ScenarioAnalysisResult {
  // Optimistic: +20% revenue, -10% costs
  // Base: As-is
  // Pessimistic: -20% revenue, +10% costs
}
```

#### Step 1.2: Update TypeScript Interfaces

```typescript
// Add to centralizedCalculations.ts interfaces

export interface SensitivityAnalysisResult {
  parameters: Record<string, {
    baseValue: number;
    variations: number[];
    npvImpact: number[];
    irrImpact: number[];
    elasticity: number; // % change in NPV per % change in parameter
  }>;
  tornadoChart: Array<{
    parameter: string;
    impact: number;
    direction: 'positive' | 'negative';
  }>;
  mostSensitiveParameters: string[];
}

export interface RiskAnalysisResult {
  statistics: {
    meanNPV: number;
    medianNPV: number;
    stdDevNPV: number;
    coefficientOfVariation: number;
  };
  valueAtRisk: {
    var95: number; // 95% confidence level
    var99: number; // 99% confidence level
    expectedShortfall: number; // Average loss beyond VaR
  };
  probabilityOfSuccess: number; // P(NPV > 0)
  scenarios: {
    best: number;
    worst: number;
    range: number;
  };
}

export interface ScenarioAnalysisResult {
  optimistic: FinancialCalculationResult;
  base: FinancialCalculationResult;
  pessimistic: FinancialCalculationResult;
  comparisons: {
    npvSpread: number;
    irrSpread: number;
    paybackSpread: number;
  };
}

export interface AdvancedFinancialMetrics extends FinancialCalculationResult {
  // Add advanced metrics to existing result interface
  mirr?: number;
  sensitivityAnalysis?: SensitivityAnalysisResult;
  riskAnalysis?: RiskAnalysisResult;
  scenarioAnalysis?: ScenarioAnalysisResult;
  degradationModel?: {
    yearlyCapacityRetention: number[];
    effectiveLifeYears: number;
  };
}
```

#### Step 1.3: Create Enhanced Calculation Function

```typescript
// Add to centralizedCalculations.ts

/**
 * Enhanced Financial Analysis with Advanced Metrics
 * Extends basic calculateFinancialMetrics() with professional features
 */
export async function calculateAdvancedFinancialMetrics(
  input: FinancialCalculationInput,
  options: {
    includeMIRR?: boolean;
    includeSensitivity?: boolean;
    includeRiskAnalysis?: boolean;
    includeScenarios?: boolean;
    numMonteCarloSims?: number;
  } = {}
): Promise<AdvancedFinancialMetrics> {
  
  // 1. Get basic metrics
  const baseMetrics = await calculateFinancialMetrics(input);
  
  const result: AdvancedFinancialMetrics = { ...baseMetrics };
  
  // 2. Add MIRR if requested
  if (options.includeMIRR) {
    const cashFlows = buildCashFlowArray(input);
    result.mirr = calculateMIRR(
      cashFlows,
      input.discountRate || 0.08,
      input.discountRate || 0.08
    );
  }
  
  // 3. Add sensitivity analysis if requested
  if (options.includeSensitivity) {
    result.sensitivityAnalysis = performSensitivityAnalysis(
      input,
      ['electricityRate', 'storageSizeMW', 'discountRate', 'projectLifetimeYears'],
      0.20 // ±20% variation
    );
  }
  
  // 4. Add risk analysis if requested
  if (options.includeRiskAnalysis) {
    result.riskAnalysis = await performRiskAnalysis(
      input,
      options.numMonteCarloSims || 1000
    );
  }
  
  // 5. Add scenario analysis if requested
  if (options.includeScenarios) {
    result.scenarioAnalysis = performScenarioAnalysis(input);
  }
  
  return result;
}
```

---

### Phase 2: Enhance AdvancedAnalytics.tsx UI (4-6 hours)

**Objective**: Expose new advanced features in existing modal

#### Step 2.1: Add Tabs to AdvancedAnalytics Modal

```typescript
// Update AdvancedAnalytics.tsx

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  isOpen,
  onClose,
  projectData,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'sensitivity' | 'risk' | 'scenarios'>('basic');
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedFinancialMetrics | null>(null);
  
  useEffect(() => {
    if (isOpen && !advancedMetrics) {
      // Fetch all advanced metrics
      calculateAdvancedFinancialMetrics({
        storageSizeMW: projectData.powerMW,
        durationHours: projectData.durationHours,
        electricityRate: 0.12, // From project data
        // ... other params
      }, {
        includeMIRR: true,
        includeSensitivity: true,
        includeRiskAnalysis: true,
        includeScenarios: true
      }).then(setAdvancedMetrics);
    }
  }, [isOpen]);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      {/* Tab Navigation */}
      <div className="flex border-b">
        <TabButton 
          active={activeTab === 'basic'} 
          onClick={() => setActiveTab('basic')}
        >
          📊 Basic Metrics
        </TabButton>
        <TabButton 
          active={activeTab === 'sensitivity'} 
          onClick={() => setActiveTab('sensitivity')}
        >
          📈 Sensitivity Analysis
        </TabButton>
        <TabButton 
          active={activeTab === 'risk'} 
          onClick={() => setActiveTab('risk')}
        >
          🎲 Risk Analysis
        </TabButton>
        <TabButton 
          active={activeTab === 'scenarios'} 
          onClick={() => setActiveTab('scenarios')}
        >
          🔮 Scenarios
        </TabButton>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'basic' && <BasicMetricsTab metrics={advancedMetrics} />}
      {activeTab === 'sensitivity' && <SensitivityTab analysis={advancedMetrics?.sensitivityAnalysis} />}
      {activeTab === 'risk' && <RiskAnalysisTab analysis={advancedMetrics?.riskAnalysis} />}
      {activeTab === 'scenarios' && <ScenariosTab analysis={advancedMetrics?.scenarioAnalysis} />}
    </Modal>
  );
};
```

#### Step 2.2: Create Visualization Components

**A. Sensitivity Analysis Tab**
```typescript
// New component: SensitivityTab.tsx
// Shows tornado chart of parameter impacts
// Table of sensitivities
// Interactive sliders to test scenarios
```

**B. Risk Analysis Tab**
```typescript
// New component: RiskAnalysisTab.tsx
// Histogram of NPV distribution
// Value at Risk visualization
// Probability of success gauge
// Best/worst case scenarios
```

**C. Scenarios Tab**
```typescript
// New component: ScenariosTab.tsx
// Side-by-side comparison of optimistic/base/pessimistic
// Bar charts comparing NPV, IRR, payback
// Assumptions for each scenario
```

---

### Phase 3: Testing & Validation (2-3 hours)

#### Test Cases

1. **Basic Metrics Consistency**
   - Verify NPV/IRR match between old and new implementation
   - Test with various project sizes (1MW, 10MW, 100MW)
   - Test with different durations (2hr, 4hr, 8hr)

2. **Advanced Features**
   - Sensitivity: Verify tornado chart ranks parameters correctly
   - Risk: Verify Monte Carlo produces reasonable distributions
   - Scenarios: Verify optimistic/pessimistic bounds are sensible

3. **UI/UX**
   - Modal loads smoothly with loading states
   - Charts render correctly
   - Export functionality works
   - Mobile responsive

4. **Performance**
   - Monte Carlo simulation completes in <3 seconds
   - UI remains responsive during calculations
   - No memory leaks on repeated modal opens

---

### Phase 4: Cleanup & Documentation (1-2 hours)

1. **Delete `advancedFinancialModeling.ts`** (after migration complete)
2. **Update `LARGE_FILES_ANALYSIS.md`** to reflect resolution
3. **Create user documentation** for new advanced features
4. **Update `SERVICES_ARCHITECTURE.md`** with new functions

---

## 📋 Implementation Checklist

### Week 1: Core Migration (8-10 hours)
- [ ] Create backup branch before changes
- [ ] Add MIRR function to centralizedCalculations.ts
- [ ] Add sensitivity analysis function
- [ ] Add risk analysis function (Monte Carlo)
- [ ] Add scenario analysis function
- [ ] Add enhanced interfaces
- [ ] Add calculateAdvancedFinancialMetrics() wrapper
- [ ] Write unit tests for new functions

### Week 2: UI Enhancement (6-8 hours)
- [ ] Add tabs to AdvancedAnalytics modal
- [ ] Create SensitivityTab component with tornado chart
- [ ] Create RiskAnalysisTab component with histogram
- [ ] Create ScenariosTab component with comparisons
- [ ] Add loading states
- [ ] Add error handling
- [ ] Make responsive

### Week 3: Testing & Cleanup (3-4 hours)
- [ ] Test basic metrics consistency
- [ ] Test advanced features accuracy
- [ ] Performance testing (Monte Carlo speed)
- [ ] Cross-browser testing
- [ ] Delete advancedFinancialModeling.ts
- [ ] Update all documentation
- [ ] Create user guide for advanced features

---

## 🎨 UI Mockup: Enhanced Advanced Analytics Modal

```
╔════════════════════════════════════════════════════════════╗
║  Advanced Financial Analytics - Tesla Gigafactory BESS    ║
╠════════════════════════════════════════════════════════════╣
║  [📊 Basic] [📈 Sensitivity] [🎲 Risk] [🔮 Scenarios]     ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  When on "Sensitivity Analysis" tab:                       ║
║                                                            ║
║  Most Sensitive Parameters (Tornado Chart)                 ║
║  ┌────────────────────────────────────────┐               ║
║  │ Electricity Rate     ████████████████  │ ±$15M NPV    ║
║  │ Storage Size (MW)    ████████████      │ ±$12M NPV    ║
║  │ Discount Rate        ██████            │ ±$6M NPV     ║
║  │ Project Lifetime     ████              │ ±$4M NPV     ║
║  └────────────────────────────────────────┘               ║
║                                                            ║
║  Interactive Testing                                       ║
║  Electricity Rate: [======|=====] $0.15/kWh               ║
║  NPV Impact: $45.2M → $52.8M (+$7.6M)                     ║
║                                                            ║
║  [Export Sensitivity Report] [Run Custom Scenario]        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## 💰 Alternative: Professional Tier Feature

**If you want to monetize advanced analytics:**

1. Keep current `AdvancedAnalytics` simple (NPV/IRR/payback) - **Free for all users**
2. Add new **"🎓 Professional Financial Modeling"** button - **Pro/Enterprise only**
3. Gate advanced features:
   - ✅ Free: Basic NPV, IRR, payback, ROI
   - 💎 Pro: Sensitivity analysis, scenarios
   - 💼 Enterprise: Risk analysis (Monte Carlo), custom reports

**Pricing opportunity:**
- Free tier: Basic financial metrics
- Professional ($99/mo): + Sensitivity & scenarios
- Enterprise ($299/mo): + Risk analysis + API access

---

## 🚨 Critical: Maintain Site Flow Integrity

**During migration, ensure:**

1. ✅ **Existing "Advanced Analytics" button keeps working** (no downtime)
2. ✅ **All current calculations remain consistent** (validate against existing results)
3. ✅ **No breaking changes to centralizedCalculations API** (other components depend on it)
4. ✅ **Feature flag new advanced features** (enable gradually)
5. ✅ **Comprehensive testing before merging** (Phase 3 testing plan)

**Safety measures:**
```typescript
// Feature flag approach
const ENABLE_ADVANCED_ANALYTICS = process.env.VITE_ENABLE_ADVANCED_ANALYTICS === 'true';

// In AdvancedAnalytics.tsx
const showAdvancedTabs = ENABLE_ADVANCED_ANALYTICS && userTier === 'professional';
```

---

## 📊 Expected Outcomes

**After migration:**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Available advanced features | 3 | 8 | +167% |
| Code duplication | 3 services | 1 service | -67% |
| Lines of unused code | 1,584 | 0 | -100% |
| Professional features | ❌ | ✅ | ∞ |
| User access to MIRR | ❌ | ✅ | ∞ |
| User access to sensitivity | ❌ | ✅ | ∞ |
| User access to risk analysis | ❌ | ✅ | ∞ |

**User benefits:**
- ✅ More sophisticated financial analysis
- ✅ Better investment decision-making
- ✅ Professional-grade reports
- ✅ Competitive advantage over other BESS tools

---

## 🎯 Next Steps

**Immediate action needed:**
1. **Approve this migration plan** (or suggest modifications)
2. **Decide: Free for all OR Pro tier feature?**
3. **Allocate 15-20 hours for implementation** (3 phases)
4. **Create feature branch**: `feature/advanced-financial-modeling-migration`
5. **Begin Phase 1: Core migration**

**Questions to answer:**
- Should advanced features be free or gated behind Pro tier?
- Do you want all 8 advanced features or prioritize subset first?
- Should we keep existing simple modal and add separate professional modal?
- Any custom visualizations or reports needed?

---

**This migration plan preserves all existing functionality while unlocking powerful professional features that are currently dormant in your codebase. All work is incremental and testable at each step.**
