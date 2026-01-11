# SSOT Compliance Analysis: Vineet's Step 1 & 2 Design

## Executive Summary

**Question**: Will Vineet's design support SSOT (Single Source of Truth)?

**Answer**: 
- ✅ **UI/UX Design**: YES - The visual layout and component structure are compatible
- ❌ **Current Code Implementation**: NO - Has hardcoded values and no engine integration
- ✅ **Calculation Logic**: YES - The 65% factor shown matches SSOT (`solarTemplates.ts`)

## Current SSOT Architecture

### ✅ SSOT-Compliant Components

1. **`solarTemplates.ts`** - SSOT for industry-specific factors
   - `roofUsableFactor: 0.65` for car_wash (matches Vineet's 65%)
   - `carportUsableFactor: 1.0`
   - `solarDensity: 0.020` kW/sqft

2. **`TrueQuoteEngine-Solar.ts`** - SSOT for all solar calculations
   - `calculateSolarCapacity()` - Main calculation function
   - Returns complete audit trail with formulas, inputs, results
   - Uses `getSolarTemplate()` to pull industry factors

3. **`SolarPreviewCard.tsx`** - SSOT-compliant UI component
   - Calls `calculateSolarCapacity()` from engine
   - Displays results, does NOT calculate

### ❌ Vineet's Code Issues

1. **Hardcoded Data**:
   ```jsx
   const [formData, setFormData] = useState({
     zipCode: '89052',  // ❌ Hardcoded
     businessName: 'Wow Carwash',  // ❌ Hardcoded
     streetAddress: '3405 St Rose Pkwy',  // ❌ Hardcoded
   });
   ```

2. **No Engine Integration**:
   - No calls to `calculateSolarCapacity()`
   - No calls to `getSolarTemplate()`
   - No integration with wizard state management

3. **Standalone Component**:
   - Not integrated with existing `WizardV6` flow
   - Doesn't use `WizardState` or `updateState` props
   - No connection to database or calculation services

## Step 3 Screenshot Analysis

From the screenshots, Step 3 shows:
- **"Solar Panel Usable Area Calculation"** box
- **"7,250 sq ft x 65% = 4,713 sq ft"**
- **"Usable Factor: 65%"** (highlighted in yellow)

### ✅ SSOT Compliance Check

**Calculation**: `7,250 × 0.65 = 4,712.5 ≈ 4,713 sq ft` ✅ **CORRECT**

**Source**: This matches `solarTemplates.ts`:
```typescript
car_wash: {
  roofUsableFactor: 0.65,  // ✅ Matches Vineet's 65%
  // ...
}
```

**Engine Function**: `TrueQuoteEngine-Solar.ts` calculates this:
```typescript
const roofSolarUsable = roofAreaSqFt * template.roofUsableFactor;
// 7250 * 0.65 = 4712.5 ✅
```

## Recommendation: Hybrid Approach

### ✅ Use Vineet's UI/UX Design
- Two-column layout (LEFT: inputs, RIGHT: Merlin Advisor)
- Visual components (cards, buttons, progress indicators)
- Question flow and user experience

### ✅ Integrate with SSOT Architecture

**Replace inline calculations with engine calls:**

```typescript
// ❌ BAD (Vineet's approach - inline calculation)
const usableArea = roofArea * 0.65;  // Hardcoded factor

// ✅ GOOD (SSOT approach - use engine)
import { calculateSolarCapacity } from '@/services/TrueQuoteEngine-Solar';
const result = calculateSolarCapacity({
  industry: state.industry,
  roofArea: answers.roofArea,
  roofUnit: 'sqft',
  carportInterest: answers.carportInterest,
  carportArea: answers.carportArea
});

// Display from engine result
const usableArea = result.roofSolarUsable;  // From SSOT
const usableFactor = result.roofUsableFactor;  // From SSOT (0.65)
```

**Display calculation breakdown from audit trail:**

```typescript
// Use engine's calculation audit trail
const calculation = result.calculations.roofUsable;
// Shows: formula, inputs, result, notes
// Formula: "roofArea × roofUsableFactor"
// Inputs: { roofArea: 7250, roofUsableFactor: 0.65 }
// Result: 4712.5
// Notes: "Using 65% usable factor for Car Wash industry"
```

## Implementation Plan

### Phase 1: Integrate Vineet's UI/UX (SSOT Compliant)

1. **Step 1 Location** ✅ **DONE**
   - Two-column layout implemented
   - Uses wizard state management
   - Calls location data services (SSOT)

2. **Step 2 Goals** (Next)
   - Use Vineet's goal cards design
   - Integrate with `WizardState.goals`
   - Display assessment from `getAssessmentValues()` (can be moved to engine)

3. **Step 3 Details** (Future)
   - Use Vineet's question layout
   - **CRITICAL**: Replace any inline calculations with `calculateSolarCapacity()` calls
   - Display "Solar Panel Usable Area Calculation" from engine's `calculations` audit trail

### Phase 2: Move Assessment Logic to Engine

Currently, `getAssessmentValues()` in Vineet's code calculates:
- Goal compatibility
- ROI potential
- Recommended system

**Recommendation**: Move this to a new `TrueQuoteEngine-Goals.ts`:
```typescript
// New SSOT file: TrueQuoteEngine-Goals.ts
export function assessGoals(selectedGoals: EnergyGoal[]): GoalAssessmentResult {
  // All assessment logic here
  // Returns: compatibility, roi, system, comment
}
```

## SSOT Compliance Checklist

### ✅ Current Architecture
- [x] Solar calculations in `TrueQuoteEngine-Solar.ts`
- [x] Industry factors in `solarTemplates.ts`
- [x] UI components call engines (no inline calculations)
- [x] Full audit trail with formulas and sources

### ⚠️ Vineet's Design Needs
- [ ] Replace hardcoded values with wizard state
- [ ] Call `calculateSolarCapacity()` instead of inline math
- [ ] Use `getSolarTemplate()` for industry factors
- [ ] Display calculation breakdown from engine's audit trail
- [ ] Integrate with existing `WizardV6` flow

## Conclusion

**Vineet's UI/UX design is excellent and CAN support SSOT**, but the code needs refactoring:

1. ✅ **Keep**: Visual design, component structure, user flow
2. ❌ **Replace**: Hardcoded values → Wizard state
3. ❌ **Replace**: Inline calculations → Engine calls
4. ❌ **Replace**: Hardcoded factors → `getSolarTemplate()` calls
5. ✅ **Add**: Display engine's calculation audit trail

**The "Solar Panel Usable Area Calculation" shown in screenshots is correct (65% matches SSOT)**, but it should be calculated by `TrueQuoteEngine-Solar.ts`, not inline in the UI component.
