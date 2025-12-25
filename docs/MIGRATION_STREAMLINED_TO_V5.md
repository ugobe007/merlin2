# Migration Plan: StreamlinedWizard → WizardV5
**Date:** January 3, 2025  
**Status:** In Progress

## Executive Summary

This document outlines the migration path from `StreamlinedWizard` (legacy) to `WizardV5` (current), ensuring data integrity and removing all legacy file paths.

---

## Current State Analysis

### ✅ Already Migrated
- **Vertical Components**: All three vertical components (`HotelEnergy.tsx`, `CarWashEnergy.tsx`, `EVChargingEnergy.tsx`) are already using `WizardV5`
- **Main App**: `App.tsx` uses `WizardV5` for `/wizard` route
- **Modal System**: `ModalRenderer.tsx` and `ModalManager.tsx` use `WizardV5`

### ⚠️ Remaining Legacy References
1. **StreamlinedWizard.tsx** - Still exists in `src/components/wizard/legacy/v4-active/`
2. **Legacy hooks** - `useStreamlinedWizard.ts` in legacy folder
3. **Legacy sections** - Various step components in legacy folders
4. **Type definitions** - Some types may reference legacy structure

---

## Core Imports/Exports Analysis

### StreamlinedWizard.tsx Exports
```typescript
export default function StreamlinedWizard({
  show: boolean;
  onClose: () => void;
  onFinish: (data: any) => void;
  onOpenAdvanced?: () => void;
  initialUseCase?: string;
  initialState?: string;
  initialData?: Record<string, any>;
})
```

### WizardV5.tsx Exports
```typescript
export interface WizardV5Props {
  initialUseCase?: string;
  onComplete?: (quote: any) => void;
  onCancel?: () => void;
  onClose?: () => void;  // Legacy compatibility
  onFinish?: (quote?: any) => void;  // Legacy compatibility
  onOpenAdvanced?: () => void;
}

export const WizardV5: React.FC<WizardV5Props>
export default WizardV5;
```

### Compatibility Mapping
| StreamlinedWizard | WizardV5 | Status |
|-------------------|----------|--------|
| `show` | (removed - always shown) | ✅ Handled by parent |
| `onClose` | `onCancel` or `onClose` | ✅ Compatible |
| `onFinish` | `onComplete` or `onFinish` | ✅ Compatible |
| `onOpenAdvanced` | `onOpenAdvanced` | ✅ Compatible |
| `initialUseCase` | `initialUseCase` | ✅ Compatible |
| `initialState` | (via wizardState) | ⚠️ Needs mapping |
| `initialData` | (via wizardState) | ⚠️ Needs mapping |

---

## Critical Issue: Step 4 State Sync

### Problem
Step 4 (`Step4MagicFit.tsx`) uses a hash-based memoization workaround to prevent infinite loops:
```typescript
const inputsHash = useMemo(() => {
  return JSON.stringify({
    selectedIndustry,
    useCaseData,  // ⚠️ This object changes reference on every render
    state,
    goals,
    electricityRate
  });
}, [selectedIndustry, useCaseData, state, goals, electricityRate]);
```

### Root Cause
- `useCaseData` is an object that gets a new reference on every render
- Even if contents are the same, `useMemo` sees it as changed
- This triggers recalculation unnecessarily

### Solution
1. **Stabilize useCaseData**: Use deep comparison or normalized structure
2. **Remove hash workaround**: Use proper dependency management
3. **Memoize calculation inputs**: Only recalculate when actual values change

---

## Migration Steps

### Phase 1: Fix Step 4 State Sync ✅ (Current)
- [x] Identify the state sync issue
- [ ] Implement proper dependency management
- [ ] Remove hash-based workaround
- [ ] Test infinite loop prevention

### Phase 2: Verify No Active StreamlinedWizard Usage
- [ ] Search codebase for `StreamlinedWizard` imports
- [ ] Verify all components use `WizardV5`
- [ ] Update any remaining references

### Phase 3: Clean Up Legacy Files
- [ ] Move legacy files to archive (if needed for reference)
- [ ] Remove unused legacy imports
- [ ] Update type definitions
- [ ] Remove legacy file paths from build

### Phase 4: Documentation & Testing
- [ ] Update all documentation references
- [ ] Test all wizard flows
- [ ] Verify quote generation works
- [ ] Confirm no console errors

---

## Implementation Details

### Step 4 State Sync Fix

**Current (Problematic):**
```typescript
const inputsHash = useMemo(() => {
  return JSON.stringify({
    selectedIndustry,
    useCaseData,  // New reference every render
    state,
    goals,
    electricityRate
  });
}, [selectedIndustry, useCaseData, state, goals, electricityRate]);
```

**Proposed (Fixed):**
```typescript
// Deep comparison of useCaseData
const useCaseDataHash = useMemo(() => {
  return JSON.stringify(useCaseData);
}, [JSON.stringify(useCaseData)]); // Still problematic - need better approach

// Better: Use a ref to track previous values
const prevInputsRef = useRef({
  selectedIndustry: '',
  useCaseData: {},
  state: '',
  goals: [],
  electricityRate: 0
});

// Or: Normalize useCaseData to a stable structure
const normalizedUseCaseData = useMemo(() => {
  // Sort keys, remove undefined values, etc.
  return Object.keys(useCaseData)
    .sort()
    .reduce((acc, key) => {
      if (useCaseData[key] !== undefined) {
        acc[key] = useCaseData[key];
      }
      return acc;
    }, {} as Record<string, any>);
}, [useCaseData]);
```

**Best Solution:**
```typescript
// Use a deep equality check library or custom hook
import { useDeepCompareMemo } from 'use-deep-compare'; // or similar

const stableInputs = useDeepCompareMemo(() => ({
  selectedIndustry,
  useCaseData,
  state,
  goals,
  electricityRate
}), [selectedIndustry, useCaseData, state, goals, electricityRate]);

// Or: Use a ref-based approach with manual comparison
const prevInputsRef = useRef<string>('');
const currentInputs = JSON.stringify({
  selectedIndustry,
  useCaseData,
  state,
  goals,
  electricityRate
});

if (currentInputs !== prevInputsRef.current) {
  prevInputsRef.current = currentInputs;
  // Trigger recalculation
}
```

---

## Files to Update

### Core Files
1. `src/components/wizard/v5/steps/Step4MagicFit.tsx` - Fix state sync
2. `src/components/wizard/v5/WizardV5.tsx` - Ensure stable useCaseData passing

### Verification Files
1. `src/components/verticals/HotelEnergy.tsx` - ✅ Already using WizardV5
2. `src/components/verticals/CarWashEnergy.tsx` - ✅ Already using WizardV5
3. `src/components/verticals/EVChargingEnergy.tsx` - ✅ Already using WizardV5
4. `src/App.tsx` - ✅ Already using WizardV5
5. `src/components/modals/ModalRenderer.tsx` - ✅ Already using WizardV5
6. `src/components/modals/ModalManager.tsx` - ✅ Already using WizardV5

### Legacy Files (To Archive/Remove)
1. `src/components/wizard/legacy/v4-active/StreamlinedWizard.tsx`
2. `src/components/wizard/legacy/v4-active/hooks/useStreamlinedWizard.ts`
3. `src/components/wizard/legacy/v4-active/sections/*.tsx`
4. `src/components/wizard/legacy/v3-reference/*` (already archived)

---

## Testing Checklist

- [ ] Step 4 doesn't trigger infinite loops
- [ ] Step 4 recalculates when inputs actually change
- [ ] All vertical components work correctly
- [ ] Quote generation works for all industries
- [ ] No console errors or warnings
- [ ] No references to StreamlinedWizard in active code
- [ ] Build succeeds without errors
- [ ] TypeScript compilation passes

---

## Rollback Plan

If issues arise:
1. Keep legacy files in `legacy/` folder (don't delete immediately)
2. Add feature flag to switch between versions
3. Monitor for errors before full removal

---

## Next Steps

1. **Immediate**: Fix Step 4 state sync issue
2. **Short-term**: Verify no active StreamlinedWizard usage
3. **Medium-term**: Archive/remove legacy files
4. **Long-term**: Update all documentation

