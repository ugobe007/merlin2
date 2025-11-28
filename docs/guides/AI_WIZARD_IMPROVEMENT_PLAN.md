# AI Wizard Improvement Plan

## Problem Summary
1. **Inconsistent recommendations** - AI suggests removing solar that it previously recommended
2. **Not context-aware** - Doesn't consider use case (warehouse = solar good, downtown EV = solar bad)
3. **Role confusion** - AI Wizard vs Smart Wizard roles unclear
4. **Missing from steps 3 & 4** - Should be in top nav bar
5. **Not using use case templates** - Should reference template data for decisions

## Solution Architecture

### 1. Clear Role Distinction
- **Smart Wizard** = The guide/facilitator that walks users through configuration
- **AI Wizard** = The background optimization engine that analyzes and suggests improvements

### 2. Context-Aware Decision Making
Use case templates inform AI decisions:

```typescript
// Warehouse/Factory/Logistics
- Large roof space available
- ✅ Solar recommended
- ❌ Generators not needed (grid-tied)

// Downtown EV Charging
- Limited real estate
- ❌ Solar not feasible
- ✅ Generator recommended for backup/peak

// Hospital/Data Center
- Critical power needs
- ✅ Solar + Generator recommended
- Focus on reliability over cost

// Remote/Island
- Limited grid access
- ✅ Solar + Wind + Generator recommended
- Microgrid configuration
```

### 3. Enhanced AI Logic

```typescript
interface UseCaseContext {
  hasRoofSpace: boolean;      // From use case template
  isUrbanDowntown: boolean;   // From location
  needsBackup: boolean;        // From use case critical flag
  gridReliability: number;    // 0-1 from gridConnectivity
  realEstateConstraint: 'none' | 'moderate' | 'severe';
}

function determineRenewableRecommendations(context: UseCaseContext) {
  // Solar logic
  if (context.hasRoofSpace && !context.isUrbanDowntown) {
    recommend.solar = true;
    reasoning = "Large roof space available for solar panels";
  }
  
  // Generator logic
  if (context.needsBackup || context.gridReliability < 0.5) {
    recommend.generator = true;
    reasoning = "Backup power needed for critical operations";
  }
  
  // Wind logic (only for specific cases)
  if (context.gridReliability < 0.3 && !context.isUrbanDowntown) {
    recommend.wind = true;
    reasoning = "Limited grid access, wind provides additional resilience";
  }
}
```

### 4. Persistent Recommendations

```typescript
// Store AI decisions in component state
interface AIDecisionHistory {
  solarRecommended: boolean;
  solarReasoning: string;
  generatorRecommended: boolean;
  generatorReasoning: string;
  timestamp: Date;
}

// Never contradict previous recommendations unless user changes key parameters
if (previousDecision.solarRecommended && !userChangedUseCase) {
  // Keep solar recommendation
  maintain.solar = true;
}
```

### 5. UI Placement in Steps 3 & 4

```typescript
// Top Navigation Bar
[Industry Template] [Previous] [Next] [AI Wizard 🤖] [AI Status: Not Used]
                                        ↑               ↑
                                    Opens AI panel   Shows usage indicator
```

## Implementation Steps

1. ✅ Update `aiOptimizationService.ts`:
   - Add use case context analysis
   - Add location-based constraints
   - Add persistent decision tracking
   - Improve reasoning messages

2. ✅ Update `InteractiveConfigDashboard.tsx` (Step 3):
   - Add AI Wizard button to top nav bar
   - Move AI indicator to top nav
   - Store AI decision history

3. ✅ Update `QuoteCompletePage.tsx` (Step 4):
   - Add AI Wizard button to top nav bar
   - Show AI recommendations with full context
   - Allow users to apply/reject with clear reasoning

4. ✅ Create use case metadata:
   - Add `roofSpaceAvailable` field to templates
   - Add `criticalInfrastructure` flag
   - Add `typicalLocation` (urban/suburban/rural/remote)

5. ✅ Update centralized calculations:
   - Ensure AI uses same formulas
   - Cross-reference with use case templates
   - Validate against ROI calculations

## Expected Outcomes

- ✅ Consistent recommendations throughout wizard
- ✅ Context-aware suggestions based on use case
- ✅ Clear reasoning that makes sense to users
- ✅ AI Wizard accessible in steps 3 & 4
- ✅ Better adoption of AI suggestions
- ✅ Improved quote quality and ROI

