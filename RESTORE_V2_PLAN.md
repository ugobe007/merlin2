# Restore SmartWizardV2 - Action Plan

## Why Restore V2?

SmartWizardV2 was WORKING perfectly with:
- ✅ Power Status Bar (the "golden tool")
- ✅ AI recommendations
- ✅ Rich Step3_AddRenewables (Solar/Wind/Generators/EV)
- ✅ Automatic baseline calculations
- ✅ All 6 steps functional
- ✅ Grid reliability question in database

V3 broke because it DEVIATED from this proven architecture.

## Restoration Steps

### 1. Switch ModalRenderer to use V2 (1 minute)

**File:** `src/components/modals/ModalRenderer.tsx`
**Line 32:** Change lazy import from V3 to V2

```typescript
// BEFORE:
const SmartWizard = React.lazy(() => import('../wizard/SmartWizardV3'));

// AFTER:
const SmartWizard = React.lazy(() => import('../wizard/SmartWizardV2'));
```

That's it! One line change.

### 2. Test Immediately

```bash
# Server should already be running
open http://localhost:5177
# Click "Get Started" button
# SmartWizardV2 should open
```

### 3. Run Tests

```bash
npx playwright test tests/e2e/smartWizard.spec.ts --project=chromium
```

## Why This Works

- V2 file still exists: `src/components/wizard/SmartWizardV2.tsx` (2368 lines)
- All V2 steps exist in `src/components/wizard/steps/`
- V2 uses same props interface as V3
- Database already has all necessary data
- No other changes needed!

## Expected Result

✅ Wizard opens immediately
✅ All steps work
✅ Power Status Bar visible
✅ Calculations accurate
✅ Tests pass

## If There Are Import Errors

The missing step files are:
- `Step1_IndustryTemplate.tsx`
- `Step2_UseCase.tsx`
- `Step3_AddRenewables.tsx` (THE MAGIC ONE)
- `Step4_LocationPricing.tsx`
- `Step4_QuoteSummary.tsx` (final step)

These need to be in `src/components/wizard/steps/` (not `steps_v3/`)

Let me know if you want me to make this one-line change now!
