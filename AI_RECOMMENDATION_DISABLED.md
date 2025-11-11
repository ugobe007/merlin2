# AI Recommendation Feature - Temporarily Disabled

## Date: November 11, 2025

## Reason for Disabling

The AI recommendation feature was generating system sizing recommendations using **hardcoded formulas** that were inconsistent with the **database-driven centralized calculation service**. This created user confusion and undermined trust in the platform's accuracy.

### Example of Inconsistency

**Use Case**: EV Charging Station with 120 chargers

| Source | Recommendation | Calculation Method |
|--------|---------------|-------------------|
| **SmartWizard (Database)** | 5.4MW / 4hr | Uses `use_case_configurations` table + industry benchmarks |
| **AI Recommendation** | 11.5MW / 6hr | Hardcoded: `maxConcurrentPower * 0.6 / 1000` |
| **Difference** | **2.1x larger!** | 113% difference in system size |

**Impact**: Users see wildly different numbers and question accuracy of calculations.

## What Was Disabled

### Files Modified:

1. **`/src/components/wizard/SmartWizardV2.tsx`** (Lines 470-700)
   - Commented out entire `useEffect` that generates AI recommendations
   - Added TODO comment explaining need for centralized integration
   - Code preserved for future restoration

2. **`/src/components/wizard/steps/Step2_SimpleConfiguration.tsx`** (Line 110)
   - Changed conditional from `{aiRecommendation && aiConfig && (` to `{false && aiRecommendation && aiConfig && (`
   - UI component hidden but code intact
   - Can be re-enabled by changing `false` back to `true`

## Technical Debt Identified

The AI recommendation logic contained **200+ lines of hardcoded calculations** for different use cases:

- EV Charging: `batteryMW = maxConcurrentPower * 0.6 / 1000`
- Hotel: `hotelPowerMW = numRooms * 0.00293`
- Car Wash: `${numBays * 0.25}MW / ${heatedWater ? 4 : 3}hr`
- Hospital: `${bedCount * 0.03}MW / ${backupDuration === '24hr' ? 12 : 8}hr`
- Airport: Hardcoded `5.0MW / 6hr` for critical systems
- And many more...

**None of these used:**
- Database constants from `calculation_formulas` table
- Centralized `calculateFinancialMetrics()` service
- Industry configurations from `use_case_configurations` table

## Path to Re-Enable

To properly restore this feature, we need to:

### Phase 1: Architecture (2-3 hours)
1. Create new function: `generateAIRecommendation(useCase, userData)` 
2. Have it call `calculateIndustryBaseline()` to get database-driven sizing
3. Use `calculateFinancialMetrics()` to get accurate ROI/savings
4. Return formatted recommendation using centralized calculations

### Phase 2: Implementation (3-4 hours)
1. Replace all 200+ lines of hardcoded formulas
2. For each use case:
   - Get baseline config from database
   - Apply user-specific modifiers (e.g., utilization %, grid reliability)
   - Calculate financial metrics using centralized service
   - Format message with accurate numbers
3. Add unit tests to ensure consistency

### Phase 3: Validation (1-2 hours)
1. Test all 15+ use cases
2. Verify AI recommendations match SmartWizard initial values (within 10%)
3. Confirm ROI/savings calculations match dashboard
4. Document any intentional differences (e.g., AI suggests "optimized" vs "standard")

### Example of Correct Implementation:

```typescript
// ✅ CORRECT: Use centralized calculations
const generateAIRecommendation = async (selectedTemplate: string, useCaseData: any) => {
  // Get database-driven baseline
  const baseline = await calculateIndustryBaseline(selectedTemplate, 1.0);
  
  // Apply user-specific modifiers
  let scale = 1.0;
  if (selectedTemplate === 'ev-charging') {
    const totalChargers = useCaseData.level2Chargers + useCaseData.dcFastChargers;
    scale = totalChargers / 50; // Adjust based on charger count
  }
  
  const adjustedBaseline = await calculateIndustryBaseline(selectedTemplate, scale);
  
  // Calculate financial metrics using centralized service
  const metrics = await calculateFinancialMetrics({
    storageSizeMW: adjustedBaseline.powerMW,
    durationHours: adjustedBaseline.durationHrs,
    solarMW: adjustedBaseline.solarMW,
    location: 'California',
    electricityRate: 0.15
  });
  
  return {
    configuration: `${adjustedBaseline.powerMW}MW / ${adjustedBaseline.durationHrs}hr`,
    savings: `$${(metrics.annualSavings / 1000).toFixed(0)}K/year`,
    roi: `${metrics.paybackYears.toFixed(1)} years`,
    message: generateContextualMessage(selectedTemplate, useCaseData, metrics)
  };
};
```

## Current System State

With AI recommendations disabled, the system now has **consistent calculations**:

✅ **Unified Calculation Path:**
1. User selects industry template
2. SmartWizard loads database-driven baseline (`calculateIndustryBaseline()`)
3. User adjusts sliders (optional)
4. Dashboard calculates metrics using `calculateFinancialMetrics()`
5. All numbers come from same source: **database constants**

✅ **No More Islands:**
- ~~SmartWizardV2 hardcoded~~ → Uses centralized service
- ~~quoteCalculations.ts hardcoded~~ → Uses centralized service  
- ~~InteractiveConfigDashboard hardcoded~~ → Uses centralized service
- ~~Dashboard header hardcoded~~ → Uses centralized service
- ~~AI Recommendations hardcoded~~ → **DISABLED** (was 5th island)

## User Experience Impact

**Before (with AI)**:
- User sees 5.4MW from SmartWizard
- AI suggests 11.5MW
- User confused: "Which is correct?"
- Trust in platform eroded

**After (AI disabled)**:
- User sees 5.4MW from SmartWizard
- No conflicting recommendation
- Can adjust with confidence
- Dashboard shows consistent metrics
- Trust maintained

## Timeline for Re-Enable

**Target**: After full centralization is complete (estimated 2 weeks)

**Prerequisites**:
- [ ] All 15 files using centralized calculations (currently 4/15 done)
- [ ] Admin interface for managing calculation constants
- [ ] Unit tests for all calculation paths
- [ ] QA validation of all use cases

**Priority**: Medium (nice-to-have feature, not critical for core functionality)

---

**Status**: ✅ Clean Disable Completed  
**Code Preserved**: Yes (commented out, not deleted)  
**Can Re-Enable**: Yes (flip `false` to `true` in Step2_SimpleConfiguration.tsx)  
**Recommendation**: Keep disabled until Phase 2 of centralization complete
