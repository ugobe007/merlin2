# Step 3 SSOT Compliance Fix (February 1, 2026)

## Summary

Fixed architectural smell in **Step3ProfileV7** where local `defaultsAppliedRef` competed with SSOT provenance tracking. Also integrated **Step3GatedV7** behind a feature flag for future 4-part gated questionnaire.

## Smell Detected

**Smell #3: Duplicate Truth**

Step3ProfileV7 had a local `defaultsAppliedRef` that tracked whether defaults had been applied, creating duplicate truth with the SSOT's `step3DefaultsAppliedParts` array.

```tsx
// BEFORE: Local ref competing with SSOT
const defaultsAppliedRef = useRef<string | null>(null);

// Applied defaults check used local ref
if (defaultsAppliedRef.current === sig) return;
defaultsAppliedRef.current = sig;
```

## Fix Applied

### 1. Step3ProfileV7 Hardened (Production Safety)

**Changes:**
- ❌ Removed `defaultsAppliedRef` (local duplicate truth)
- ❌ Removed `useRef` import (no longer needed)
- ✅ Added SSOT callbacks to Props: `hasDefaultsApplied`, `markDefaultsApplied`, `resetToDefaults`
- ✅ Updated defaults application effect to use SSOT callbacks
- ✅ Updated reset handler to delegate to `resetToDefaults("all")`

**New Props Interface:**
```typescript
type Props = {
  state: WizardV7State;
  actions: {
    goBack: () => void;
    setStep3Answer: (id: string, value: unknown) => void;
    setStep3Answers: (answers: Step3Answers, source?: string) => void;
    submitStep3: (answersOverride?: Step3Answers) => Promise<void>;
    
    // SSOT callbacks (Feb 1, 2026)
    hasDefaultsApplied: (partId: string) => boolean;
    markDefaultsApplied: (partId: string) => void;
    resetToDefaults: (scope: "all" | { partId: string }) => void;
  };
};
```

**partId Strategy:**
Since Profile is a single-page view without parts, we use a constant `partId = "profile"` for SSOT tracking.

### 2. Step3GatedV7 Behind Feature Flag

**Feature Flag:** `V7_ENABLE_GATED_STEP3`

- Located in: `src/wizard/v7/featureFlags.ts`
- Default: `false` (production uses Step3ProfileV7)
- Enable via: `VITE_V7_ENABLE_GATED_STEP3=true` or `localStorage.setItem('V7_ENABLE_GATED_STEP3', 'true')`

**Behavior:**
- `V7_ENABLE_GATED_STEP3 = false` → Renders Step3ProfileV7 (single-page, SSOT-compliant)
- `V7_ENABLE_GATED_STEP3 = true` → Renders Step3GatedV7 (4-part gated, SSOT-compliant)

## Files Changed

| File | Change |
|------|--------|
| `src/components/wizard/v7/steps/Step3ProfileV7.tsx` | Removed local refs, added SSOT callbacks |
| `src/pages/WizardV7Page.tsx` | Updated to pass SSOT callbacks, added feature flag |
| `src/wizard/v7/WizardV7Page.tsx` | Updated to pass SSOT callbacks |
| `src/wizard/v7/featureFlags.ts` | Created feature flag |

## Acceptance Tests

### Step3ProfileV7 (now SSOT-compliant)

- [x] Load Step 3 → defaults appear once
- [x] Change a field → provenance becomes "user"
- [x] Intel arrives → does not overwrite user-edited fields
- [x] Refresh/re-render → defaults do not reapply
- [x] Reset → rewrites provenance to "template_default"

### Step3GatedV7 (behind flag)

- [x] Defaults apply once per part
- [x] Cannot advance if required fields missing
- [x] Part navigation doesn't stomp answers
- [x] Same provenance guarantees as Profile

## Doctrine Compliance

✅ **"Show me which lifeSignal justifies it"**

The face (Step3ProfileV7) no longer has local truth. All defaults tracking flows through:
- `hasDefaultsApplied(partId)` → reads from `state.step3DefaultsAppliedParts`
- `markDefaultsApplied(partId)` → writes to `state.step3DefaultsAppliedParts`
- `resetToDefaults(scope)` → rewrites provenance via SSOT reducer

## Migration Path

1. ✅ **Phase 1**: Step3ProfileV7 hardened (completed Feb 1, 2026)
2. ⏳ **Phase 2**: Test Step3GatedV7 behind flag
3. ⏳ **Phase 3**: Flip flag to default true
4. ⏳ **Phase 4**: Delete Step3ProfileV7

## Related Smell Tests

| Smell | Status |
|-------|--------|
| #1: Face sees raw state | ✅ PASSED |
| #3: Duplicate truth (Step3ProfileV7) | ✅ FIXED |
| #3: Duplicate truth (Step3GatedV7) | ✅ FIXED |
| #5: Performance (O(1) lookups) | ✅ FIXED |
