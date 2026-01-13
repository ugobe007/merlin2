# Wizard V6 Guardrails

## Type-Level Guardrails

### 1. SSOT-Only Field (`calculations`)
```typescript
// ✅ SSOT-only: do not write estimates here.
// Populated ONLY by Step5MagicFit TrueQuote results.
// Never write MagicFit estimates or temporary calculations here.
calculations: SystemCalculations | null;
```

### 2. Estimates-Only Field (`magicFit`)
```typescript
// ⚠️ Estimates only: safe to show for preview, never export/commit as SSOT.
magicFit?: MagicFitEstimateState;
```

### 3. Different Type Shapes (Prevents Accidental Assignment)
- `SystemCalculations` has `{ base, selected }` structure
- `MagicFitEstimateState` has `{ scenarios, selectedType, isEstimate }` structure
- TypeScript will prevent: `state.calculations = state.magicFit` (type mismatch)

## Runtime Invariants

### Invariant C: MagicFit vs SSOT Separation

**Function:** `assertMagicFitSSOTSeparation(state: WizardState)`

**Rules:**
1. If `state.calculations !== null` and `state.magicFit !== undefined`:
   - `state.magicFit.isEstimate` must be `true`
   - MagicFit should be frozen/read-only
   - UI must read from `calculations` for "Final" displays

2. MagicFit must never be assigned to `calculations`
   - Type-level: TypeScript prevents this
   - Runtime: Invariant checks if needed

3. If both exist, `calculations` takes precedence for "Final" displays
   - Enforced by UI logic

### Helper Function: `shouldShowMagicFitEstimate(state: WizardState)`

**Returns:**
- `false` if `state.calculations !== null` (use SSOT calculations instead)
- `true` if `state.magicFit !== undefined && state.magicFit.isEstimate === true`
- `false` otherwise

**Usage in UI:**
```typescript
if (shouldShowMagicFitEstimate(state)) {
  // Show MagicFit estimate with "Estimate (preview)" label
} else if (state.calculations) {
  // Show TrueQuote verified numbers with "TrueQuote Verified" badge
}
```

## Export Safety Rules

### Rule: Export uses SSOT-only

**Checked files:**
- ✅ `Step6Quote.tsx` - Uses `state.calculations` only
- ✅ `quoteExportUtils.ts` - No MagicFit usage
- ✅ `RequestQuoteModal.tsx` - No MagicFit usage

**Enforcement:**
- All export/PDF/email paths must read from `state.calculations`
- Never read `state.magicFit` in export functions
- If MagicFit is shown in UI, it must be clearly labeled "Estimate" and not exported

## Constants.ts Cleanup

**Status:** ✅ Clean
- `calculateArbitrageSavings` removed (was SSOT violation)
- Only constants and lookup functions remain
- No math calculations in `wizard/v6/constants.ts`

## Test Suite

**File:** `tests/wizard-v6-ssot.test.ts`

**3 Critical Tests:**
1. Validation blocks bad input (Red Box path)
2. TrueQuote populates `calculations.base` (SSOT write path)
3. Tier switching never mutates `calculations.base` (immutability)

**Run:** `npm test tests/wizard-v6-ssot.test.ts`

## UI Copy Rules (When MagicFit is Enabled)

### MagicFit Display:
- Label: "Estimate (preview)"
- Badge: No TrueQuote badge
- Color: Different from verified numbers
- Note: "Final numbers confirmed in Step 5"

### TrueQuote Display:
- Label: "TrueQuote Verified"
- Badge: TrueQuote badge
- Color: Verified/accent color
- Note: "Authenticated quote with traceability"

## MagicFit Integration Location

**Recommended:** Step 4 (Options)

**Flow:**
1. Step 4 generates MagicFit scenarios → `state.magicFit`
2. User selects scenario → `state.magicFit.selectedType`
3. Step 5 uses selection as intent → builds TrueQuote request
4. TrueQuote authenticates → commits to `state.calculations`
5. MagicFit display frozen/hidden → show TrueQuote verified numbers

**Current Status:**
- Step5MagicFit already uses TrueQuote only (clean)
- Ready for MagicFit integration in Step 4 if needed
