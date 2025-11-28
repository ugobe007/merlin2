# SmartWizard V3 Diagnostic Report

## File Dependencies Analysis

### Primary Files
- ✅ `/src/components/wizard/SmartWizardV3.tsx` (799 lines) - Main wizard
- ✅ `/src/ui/hooks/useQuoteBuilder.ts` (316 lines) - State management
- ✅ `/src/application/workflows/buildQuote.ts` (105 lines) - Business logic
- ✅ `/src/components/wizard/widgets/PowerMeterWidget.tsx` (138 lines) - Widget
- ✅ `/src/components/wizard/widgets/PowerStatusWidget.tsx` (149 lines) - Widget

### Import Chain
```
SmartWizardV3.tsx
  → useQuoteBuilder (hook)
    → buildQuote workflow
      → useCaseRepository
        → Supabase
```

### Potential Conflicts
- ❌ SmartWizardV2.tsx still exists in same directory (could cause confusion)
- ⚠️ ModalManager.tsx imports SmartWizardV3 but may not be used
- ⚠️ ModalRenderer.tsx imports SmartWizardV3 (this is the active one)

## Current Issues

### 1. Loading Industries Hangs
**Symptom**: Wizard shows "Loading Industries..." indefinitely
**Root Cause**: `quoteBuilder.loadUseCases()` either:
  - Failing silently (async error not caught)
  - Supabase query hanging
  - State not updating after successful load

**Debug Steps**:
1. Check browser console for errors
2. Check Network tab for Supabase requests
3. Add more console logging to useQuoteBuilder.loadUseCases()

### 2. Missing Landing Page
**Symptom**: Wizard opens directly to Step 1
**Expected**: Should show landing page with options:
  - Smart Wizard (guided)
  - Advanced Quote Builder (manual)

**Solution**: Integrate AdvancedQuoteBuilderLanding.tsx into SmartWizardV3

### 3. Input Fields Not Working
**Symptom**: Cannot type in Step 2 input fields
**Possible Causes**:
  - State updates not triggering re-render
  - Input value binding issue
  - CSS overlay blocking clicks
  - Component re-rendering on every keystroke

## Recommended Fixes

### Fix 1: Add Comprehensive Error Logging
```typescript
// In useQuoteBuilder.ts loadUseCases()
try {
  console.log('[loadUseCases] Starting...');
  const useCases = await getUseCasesForSelection();
  console.log('[loadUseCases] Loaded:', useCases.length, 'use cases');
  setState(prev => ({
    ...prev,
    availableUseCases: useCases,
    error: null
  }));
  console.log('[loadUseCases] State updated');
  return useCases;
} catch (error) {
  console.error('[loadUseCases] ERROR:', error);
  throw error;
}
```

### Fix 2: Add Landing Page to SmartWizardV3
Create a Step 0 with two options:
1. Continue with Smart Wizard (guided flow)
2. Advanced Quote Builder (direct to manual config)

### Fix 3: Simplify Input Binding
Remove controlled component complexity:
```typescript
// Use local state for inputs, sync on blur
const [localValue, setLocalValue] = useState('');

<input
  type="number"
  value={localValue}
  onChange={(e) => setLocalValue(e.target.value)}
  onBlur={() => quoteBuilder.updateAnswers({ [field]: localValue })}
/>
```

## Next Steps
1. ✅ Add detailed console logging
2. ✅ Test Supabase connection independently
3. ✅ Add landing page
4. ✅ Fix input binding
5. ✅ Remove SmartWizardV2.tsx to avoid confusion
