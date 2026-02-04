# V7 Step 3 Defaults System Assist — Architecture + Compliance Evidence

**Date:** 2026-02-01  
**Owner:** Wizard V7  
**Scope:** Step 3 (Profile + Gated variants), defaults apply/reset UX, SSOT helpers

---

## What changed (human summary)

- Introduced `Step3SystemAssist` (pure UI renderer for defaults controls)
- Centralized defaults existence + applicability queries in SSOT (`useWizardV7.ts`)
- Standardized deterministic `modifiedFieldCount` to protect reset confirmation UX
- Ensured all resets are scoped: `resetToDefaults({ partId })` (never `"all"`)

---

## Architecture wireframe (who owns what)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                                  UI LAYER                                    │
│                                                                              │
│  Step3ProfileV7              Step3GatedV7                                    │
│   - renders questions         - renders current part/questions               │
│   - computes modified         - computes modifiedFieldCount                  │
│     FieldCount                - calls actions (SSOT)                         │
│                                                                              │
│             ┌───────────────────────────────────────────────┐                │
│             │           Step3SystemAssist (PURE UI)          │               │
│             │  props: canApply/canReset/hasApplied           │               │
│             │         modifiedFieldCount, onApply/onReset    │               │
│             │  behavior: toasts + confirm for destructive    │               │
│             │  ❌ no template inspection                      │               │
│             └───────────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ calls (events) + queries (booleans)
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             SSOT: useWizardV7.ts                             │
│                                                                              │
│  State:                                                                      │
│   - step3Template (id, parts, questions, defaults)                           │
│   - step3Answers                                                             │
│   - step3DefaultsAppliedParts (key: templateId.partId)                       │
│   - step3PartIndex                                                           │
│                                                                              │
│  Actions (write):                                                            │
│   - setStep3Answer(questionId, value)                                        │
│   - applyStep3Defaults(partId)   (if present)                                │
│   - resetToDefaults({ partId })                                              │
│                                                                              │
│  Queries (read, SSOT-authoritative):                                         │
│   - hasDefaultsApplied(partId)                                               │
│   - partHasAnyDefaults(partId)                                               │
│   - canApplyDefaults(partId)                                                 │
│   - canResetToDefaults(partId)                                               │
│   - getDefaultForQuestion(questionId)                                        │
└──────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ feeds downstream calculations
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        TrueQuote™ / Contract + Math Layer                    │
│                                                                              │
│  Inputs: validated answers + template identity + selected industry/use-case  │
│  Outputs: deterministic calculations (pricing, options, MagicFit bands)      │
│                                                                              │
│  Key rule: UI never "decides" math. Math is SSOT/contract-owned.             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Workflow/state machine evidence

```text
States (per Part):
  IDLE
   |
   | (template loaded)
   v
  READY  ────────────────┐
   |                      |
   | user edits            | Apply Suggested Defaults (if canApplyDefaults)
   v                      |
  DIRTY                   |
   |                      |
   | Reset to Defaults    |
   v                      |
  READY  <────────────────┘

Guards (SSOT-owned):
  canApplyDefaults(partId)  = partHasAnyDefaults && !hasDefaultsApplied
  canResetToDefaults(partId)= partHasAnyDefaults

UI rule:
  - Show SystemAssist strip iff (canApply || canReset)
  - Confirm reset ONLY if modifiedFieldCount > 0 or unknown
```

---

## SSOT compliance checklist

| Rule | Status |
|------|--------|
| UI does not infer defaults existence (asks SSOT) | ✅ PASS |
| UI does not reset "all" from Step 3 surfaces | ✅ PASS |
| `getDefaultForQuestion` is SSOT authoritative (no overriding null) | ✅ PASS |
| `modifiedFieldCount` is part-scoped (Profile does not count other parts) | ✅ PASS |
| `Step3SystemAssist` has no SSOT internals (pure props + callbacks) | ✅ PASS |

---

## TrueQuote™ / math safety checklist

| Rule | Status |
|------|--------|
| Step 4 Options math validated against baseline fixtures | ⏳ TBD |
| Step 5 MagicFit low/med/high validated against baseline fixtures | ⏳ TBD |
| Edge case: missing answers defaults to deterministic value (no NaN) | ⏳ TBD |
| Rounding rules documented (kW/kWh, currency, percent) | ⏳ TBD |
| No UI-side calculations of pricing/magicfit outputs | ⏳ TBD |

---

## Test evidence (commands + results)

### 1) Typecheck

```bash
npx tsc --noEmit
```

**Result:** ✅ PASS (2026-02-01)

---

### 2) Unit tests

```bash
npm test
```

**Result:** ✅ MOSTLY PASS (2026-02-01)

**Summary:**
- All core baseline calculation tests: ✅ PASS
- All use case tests (20 industries): ✅ PASS
- QuoteEngine tests: ✅ PASS (except 1 pre-existing validation test)
- Template drift detection: ✅ PASS
- Adapter hardening: ✅ PASS
- Step 3 contract tests: ✅ PASS

**Pre-existing failures (unrelated to Step3SystemAssist):**
- `carWash16QCalculator.test.ts` - TrueQuote source attribution (2 tests) - needs source mapping
- `QuoteEngine.test.ts` - `gridConnection` enum validation (1 test) - test expectation mismatch

---

### 3) E2E (wizard smoke)

```bash
npx playwright test --grep "All Industries - Smoke Tests" --reporter=line
```

**Result:** ✅ 11/11 PASS (2026-02-01)

```
✅ Hotel / Hospitality flow completed successfully
✅ Car Wash flow completed successfully
✅ EV Charging Hub flow completed successfully
✅ Data Center flow completed successfully
✅ Manufacturing flow completed successfully
✅ Hospital / Healthcare flow completed successfully
✅ University / Campus flow completed successfully
✅ Retail / Commercial flow completed successfully
✅ Restaurant flow completed successfully
✅ Office Building flow completed successfully
✅ Truck Stop / Travel Center flow completed successfully
11 passed (50.9s)
```

---

### 4) MagicFit Invariant Tests (Step 4/5 math foundation)

```bash
npx vitest run tests/integration/magicfit-invariants.test.ts
```

**Result:** ✅ 8/8 PASS (2026-02-01)

```
✅ should have at least one fixture loaded
✅ should produce no NaN/Infinity for any fixture
✅ should have monotonic band ordering (low ≤ mid ≤ high)
✅ should have non-negative currency values
✅ should have positive kW/kWh values
✅ [SYNTHETIC] should handle minimal base calculation
✅ [SYNTHETIC] should handle UPS mode (no solar, no generator)
✅ [SYNTHETIC] should handle full generation mode (solar + generator)
```

**Key findings from test output:**
| Scenario | Starter | Perfect Fit | Beast Mode | BESS Multiplier |
|----------|---------|-------------|------------|-----------------|
| UPS Mode (no solar/gen) | 2400 kWh, $510k | 2500 kWh, $531k | 2500 kWh, $531k | 1.5-2x |
| Full Generation (solar+gen) | 200 kWh, $239k | 200 kWh, $292k | 300 kWh, $455k | 1x |

**Invariants validated:**
1. ✅ No NaN/Infinity in any numeric output
2. ✅ Monotonic band ordering: starter ≤ perfectFit ≤ beastMode
3. ✅ All currency values are finite and ≥ 0
4. ✅ All kW/kWh values are positive

---

### 5) Step 3 regression checklist

- [ ] Apply defaults appears only when `canApplyDefaults(partId)`
- [ ] Reset confirms only when `modifiedFieldCount > 0` or unknown
- [ ] Profile + Gated both use `equalish()` semantics
- [ ] Status chip shows after apply (when `hasApplied && !canApply`)
- [ ] Template switch preserves applied state correctly

---

## Key files (SSOT surfaces)

| File | Purpose | Math Risk |
|------|---------|-----------|
| `src/hooks/useWizardV7.ts` | State + actions + queries | Low (state only) |
| `src/components/wizard/v7/steps/Step3ProfileV7.tsx` | Profile questionnaire | Low (UI + count) |
| `src/components/wizard/v7/steps/Step3GatedV7.tsx` | Gated questionnaire | Low (UI + count) |
| `src/components/wizard/v7/shared/Step3SystemAssist.tsx` | Pure UI defaults strip | None (pure UI) |
| `src/components/wizard/v7/steps/Step4ResultsV7.tsx` | Results display | Low (display only) |
| `src/services/MagicFit.ts` | MagicFit bands (3 tiers) | **HIGH** |
| `src/services/TrueQuoteEngineV2.ts` | Quote orchestrator | **HIGH** |
| `src/services/calculators/financialCalculator.ts` | NPV/IRR/ROI | **HIGH** |

---

## Math SSOT Files (Step 4/5 audit targets)

### V7 Wizard Math Surface
- `src/components/wizard/v7/steps/Step4ResultsV7.tsx` - Results display (reads from SSOT, no UI math)
- Note: V7 does NOT have a separate Step 5 yet; MagicFit is in V6

### MagicFit Service (3-tier options)
- `src/services/MagicFit.ts` (663 lines)
  - `generateMagicFitProposal()` - Main entry
  - `TIER_CONFIG` - Starter (0.7x), Perfect Fit (1.0x), Beast Mode (1.25x)
  - `BESS_UPSIZE_CONFIG` - Multipliers for UPS mode scenarios

### TrueQuote Engine
- `src/services/TrueQuoteEngineV2.ts`
  - Orchestrates: base calculation → MagicFit → authentication
  - Calls `generateMagicFitProposal()` at line 285

### Financial Calculator
- `src/services/calculators/financialCalculator.ts`
  - `calculateFinancials()` - NPV, IRR, ROI, payback
  - Called by MagicFit for each tier

---

## Fixture Definition (IMPORTANT — Co-pilot Policy)

**In Merlin V7, "business fixtures" are the DB-backed industry templates (Step3Template / business templates).**

### Policy A — "Fixtures are DB templates"

- A "business fixture" means: template identity (industry/use case → templateId/version) + defaults + question schema from the DB
- UI components **NEVER** define fixtures
- Math tests **NEVER** define fixtures manually unless explicitly marked as "synthetic unit tests"
- Tests must not invent fixtures in code

### Policy B — "Template identity is part of the golden"

Any math output snapshot **MUST** be keyed by:
- `templateId`
- `templateVersion` (or `updated_at` hash)
- `industry` / `useCase`
- Calculator version (TrueQuote/engine version)

Because otherwise you can't explain a drift.

### Testing Model (Tier 1 + Tier 2)

**Tier 1 — Integration "truth" tests (DB-backed)**
- Goal: "Given the current DB template for Industry X, the pipeline produces deterministic outputs"
- Pull template from DB (same path as production)
- Run: mapping → calculator → Step4 options → MagicFit low/med/high
- Assert: no NaN, no negative where impossible, monotonic bands (low ≤ mid ≤ high), rounding rules
- Snapshot selected outputs (not entire object) to keep diffs readable

**Tier 2 — Golden snapshot tests (exported DB templates)**
- Goal: CI stability and drift detection without live DB
- Export templates from DB into `tests/fixtures/templates/<templateId>.json`
- Run calculator path against those JSON templates
- Snapshot results into `tests/goldens/<templateId>.magicfit.json`
- Drift requires an intentional "golden update" PR

### Fixture Paths

```
tests/
├── fixtures/
│   └── templates/           # DB-exported template JSON (versioned)
│       ├── hotel.json
│       ├── car_wash.json
│       ├── data_center.json
│       └── ...
├── goldens/
│   └── magicfit/            # Expected MagicFit outputs (versioned)
│       ├── hotel.magicfit.json
│       ├── car_wash.magicfit.json
│       └── ...
└── integration/
    └── magicfit.test.ts     # DB-backed integration tests
```

### Co-pilot Instructions

When starting Step 4/5 edits:
1. **Fixtures are DB templates** — Do not create in-code "fixtures" for industries
2. Any test fixture must come from the template loader path (DB) or a DB-exported JSON snapshot keyed by templateId/version
3. **Step 4/5 UI must not perform calculations** — it renders SSOT/TrueQuote outputs only

---

## Helpers added (equalish / isEmptyish)

Both `Step3ProfileV7` and `Step3GatedV7` now include these helpers for deterministic `modifiedFieldCount`:

```typescript
// Treat null/undefined/""/whitespace as empty
function isEmptyish(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string" && v.trim() === "") return true;
  return false;
}

// Shallow equality for primitives, arrays, objects
function equalish(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (isEmptyish(a) && isEmptyish(b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  if (typeof a === "object" && typeof b === "object" && a !== null && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}
```

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-02-01 | Initial Step3SystemAssist contract locked | Copilot |
| 2026-02-01 | Added async error handling (apply/reset) | Copilot |
| 2026-02-01 | Fixed terminology: "suggested" not "recommended" | Copilot |
| 2026-02-01 | Tightened render guard (no dead strip) | Copilot |
| 2026-02-01 | Added equalish/isEmptyish for value comparison | Copilot |
| 2026-02-01 | Scoped Profile modifiedFieldCount to profile questions only | Copilot |
| 2026-02-01 | Fixed fallback semantics (SSOT null is authoritative) | Copilot |

---

## Next steps

1. **Step 4 Options audit** — validate options math against fixtures
2. **Step 5 MagicFit audit** — validate band computation (low/mid/high)
3. **Add math snapshot tests** — catch drift immediately
4. **Document rounding rules** — kW, kWh, $, %, hours
