# MagicFit / Step 3-5 Test Runbook

**Last Updated:** 2026-02-01  
**Owner:** Merlin Engineering

---

## When to Run This Battery

Run the **full test battery** whenever you touch:

- `src/components/wizard/v7/hooks/useWizardV7.ts`
- `src/components/wizard/v7/steps/*`
- `src/services/MagicFit.ts` or TrueQuote calculators
- `src/services/marginPolicyEngine.ts` (pricing policy)
- Template export scripts or fixture structures
- Contracts/types affecting calculation shape (`src/core/contracts/*`)

---

## Test Battery Commands

```bash
# 0) Export fixtures from DB (source truth)
npx tsx scripts/export-templates-to-fixtures.ts --all

# 1) Typecheck
npx tsc --noEmit

# 2) Unit tests
npm test

# 3) MagicFit invariants on ALL 23 exported fixtures
npx vitest run tests/integration/magicfit-invariants.test.ts

# 4) Margin Policy Engine tests (43 tests with trust anchors)
npx vitest run tests/integration/margin-policy.test.ts

# 5) E2E wizard smoke (all industries)
npx playwright test --grep "All Industries - Smoke Tests" --reporter=line
```

---

## Expected Results

| Test Suite | Expected | Notes |
|------------|----------|-------|
| Fixture Export | 23 templates | All active industries |
| TypeScript | ✅ Clean | No errors |
| MagicFit Invariants | 17/17 pass | Trust anchors + canary goldens + policy |
| Margin Policy | 43/43 pass | Band selection + clamping + trust anchors |
| E2E Smoke | 11/11 pass | All industries complete flow |

**Total: 60 tests** (17 MagicFit + 43 Margin Policy)

---

## Margin Policy Trust Anchors (v1.1.0)

The margin policy tests include 5 critical trust anchor tests:

1. **Negative margin protection**: `sellPrice >= baseCost` always
2. **Hard cap semantics**: `maxMarginPercent` is absolute ceiling (overrides band floor)
3. **Quote-level guards**: $/kWh_total bounds enforced when `quoteUnits` provided
4. **No double-margin**: Margin applied exactly once per quote
5. **Blended margin consistency**: Math is mathematically correct

---

## MagicFit Invariant Coverage

The invariant tests check **ALL 23 templates** for:

1. **No NaN/Infinity** in any output field
2. **Monotonic band ordering**: `starter ≤ perfectFit ≤ beastMode`
3. **Non-negative currency**: `totalCost ≥ 0`, `netCost ≥ 0`
4. **Positive kW/kWh**: All power/energy values `> 0`

Plus synthetic edge cases:
- Minimal base calculation
- UPS mode (no solar, no generator)
- Full generation mode (solar + generator)

---

## Fixture Identity Fields

Each exported fixture includes:

```json
{
  "_meta": {
    "exportedAt": "2026-02-01T...",
    "exporterVersion": "1.0.0",
    "sourceTable": "use_cases + custom_questions"
  },
  "templateId": "uuid-from-db",
  "templateVersion": "2026-01-15T...",
  ...
}
```

Use these for drift detection and audit trails.

---

## If Tests Fail

1. **Fixture export fails**: Check Supabase credentials in `.env`
2. **TypeScript fails**: Fix type errors before proceeding
3. **MagicFit NaN**: Check contract alignment in `buildBaseCalcFromFixture()`
4. **MagicFit band ordering**: Check multiplier configs in `MagicFit.ts`
5. **E2E fails**: Check if template structure changed in DB

---

## Mandatory Documentation

If tests pass after a major change, create:

```
docs/wizard/v7/changes/YYYY-MM-DD_<topic>.md
```

Using the template in [2026-02-01_step3_systemassist_magicfit_fixtures.md](./changes/2026-02-01_step3_systemassist_magicfit_fixtures.md).

---

## Quick Smoke Check

For a quick sanity check (not full battery):

```bash
# Quick: TypeScript + MagicFit invariants only
npx tsc --noEmit && npx vitest run tests/integration/magicfit-invariants.test.ts
```

This catches most math issues without the full E2E run.
