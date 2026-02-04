# Wizard V7 Contract — Single Source of Truth

**Created:** Feb 1, 2026  
**Status:** ACTIVE — All navigation MUST use this contract  
**Shell wired:** ✅ `src/pages/WizardV7Page.tsx` uses gates (Feb 1, 2026)

---

## 🎯 Core Doctrine

> **Each step owns exactly ONE question: "Is this step complete?"**
>
> Nothing else can block navigation.  
> No pricing. No DB. No defaults. No global invariants.  
> Navigation must NEVER depend on future steps.

---

## 📋 Step Gate Contract

| Step | ID | Allowed to Block On | FORBIDDEN |
|------|------|---------------------|-----------|
| 1 - Location | `location` | ZIP (5 digits) OR confirmed address | Industry, profile, pricing |
| 2 - Industry | `industry` | Industry selection only | Location, profile, pricing |
| 3 - Profile | `profile` | Required questions answered | Pricing, defaults applied, quote ready |
| 4 - Results | `results` | **NOTHING** (read-only) | Everything — always navigable |

---

## 🏗️ Implementation Files

### Gate Functions — `src/wizard/v7/gates/wizardStepGates.ts`

```typescript
import { getGateForStep, canProceedFromStep } from "@/wizard/v7/gates";

// Check if current step is complete
const gate = getGateForStep("location", wizardState);
if (gate.canContinue) {
  // Allow navigation
}

// Shorthand
if (canProceedFromStep("industry", wizardState)) {
  goToNextStep();
}
```

### Gate Types (NO NULL — use undefined)

```typescript
type WizardStepId = "location" | "industry" | "profile" | "results";

type WizardGateResult = {
  canContinue: boolean;
  reason?: WizardGateReason;  // undefined when canContinue=true
};

type WizardGateReason =
  | "zip-incomplete"
  | "address-incomplete"
  | "industry-missing"
  | "profile-incomplete"
  | "profile-required-missing";
```

---

## ❌ FORBIDDEN Patterns

### 1. Cross-Step Gating

```typescript
// ❌ NEVER — Location checking industry
function gateLocation(state) {
  if (!state.industry) return { canContinue: false }; // WRONG!
}

// ✅ CORRECT — Location only checks location
function gateLocation(state) {
  if (!state.location?.zip) return { canContinue: false, reason: "zip-incomplete" };
  return { canContinue: true };
}
```

### 2. Async Gating

```typescript
// ❌ NEVER — Gate checking pricing
function gateProfile(state) {
  if (!state.pricing?.isReady) return { canContinue: false }; // WRONG!
}

// ✅ CORRECT — Profile only checks answers
function gateProfile(state) {
  if (state.step3Complete) return { canContinue: true };
  // Check required questions...
}
```

### 3. Direct Action Calls in Steps (FIXED Feb 1, 2026)

```typescript
// ❌ NEVER — Step calling optional actions that may not exist
function Step3Profile({ actions }) {
  if (actions.canApplyDefaults()) { // CRASHES if action doesn't exist
    actions.applyDefaults();
  }
}

// ✅ CORRECT — Step uses MINIMAL action contract
function Step3Profile({ state, actions }) {
  // Only use actions that are GUARANTEED to exist
  const setAnswer = actions?.setStep3Answer;
  if (setAnswer) {
    setAnswer("rooms", 150);
  }
}
```

**Step3ProfileV7 Minimal Contract (Feb 1, 2026):**
```typescript
type Props = {
  state: WizardState;
  actions?: {
    setStep3Answer?: (id: string, value: unknown) => void;
    submitStep3?: (answers?: Record<string, unknown>) => Promise<void>;
    goBack?: () => void;
  };
};
```

**Actions we DO NOT pass to Step3ProfileV7:**
- ~~canApplyDefaults~~ — Caused crashes
- ~~canResetToDefaults~~ — Not needed
- ~~hasDefaultsApplied~~ — Not needed
- ~~markDefaultsApplied~~ — Not needed
- ~~resetToDefaults~~ — Not needed
- ~~applyStep3Defaults~~ — Not needed
- ~~getDefaultForQuestion~~ — Not needed

The gate handles completion; the step just edits answers.

---

## 🔧 Navigation Implementation

### In Wizard Shell (ONE place)

```typescript
import { getGateForStep, getNextStep, getGateReasonMessage } from "@/wizard/v7/gates";

function WizardShell({ currentStep, state, onNavigate }) {
  const gate = getGateForStep(currentStep, state);
  const nextStep = getNextStep(currentStep);
  
  return (
    <Button
      disabled={!gate.canContinue}
      onClick={() => onNavigate(nextStep)}
      title={gate.reason ? getGateReasonMessage(gate.reason) : undefined}
    >
      {nextStep ? "Continue" : "Finish"}
    </Button>
  );
}
```

### Where Navigation Logic Lives

| Component | Can Check Gates? | Can Navigate? | Can Block? |
|-----------|------------------|---------------|------------|
| WizardShell | ✅ YES | ✅ YES | ✅ YES |
| Step1Location | ❌ NO | ❌ NO | ❌ NO |
| Step2Industry | ❌ NO | ❌ NO | ❌ NO |
| Step3Profile | ❌ NO | ❌ NO | ❌ NO |
| Step4Results | ❌ NO | ❌ NO | ❌ NO |

---

## 📦 Pricing & Defaults — Lazy, Non-Blocking

### Pricing Rules

1. **Lazy**: Calculate when inputs change, not on navigation
2. **Idempotent**: Same inputs → same output
3. **Non-blocking**: Never prevent step navigation
4. **Graceful failure**: Show banner, not dead wizard

### Where Pricing Runs

```typescript
// ✅ CORRECT — Effect triggered by input changes
useEffect(() => {
  if (state.step3Complete && state.industry) {
    calculatePricing(state).then(setPricing).catch(showPricingError);
  }
}, [state.step3Complete, state.industry, state.step3Answers]);

// ❌ WRONG — Pricing in gate
function gateProfile(state) {
  if (!state.pricing) return { canContinue: false }; // BLOCKS NAVIGATION!
}
```

### Default Application

```typescript
// ✅ CORRECT — Defaults in reducer/service
function applyIndustryDefaults(industry: string, state: WizardState) {
  const defaults = getIndustryDefaults(industry);
  return { ...state, step3Answers: { ...defaults, ...state.step3Answers } };
}

// ❌ WRONG — Defaults in step render
function Step3({ actions }) {
  actions.canApplyDefaults(); // MAY CRASH
}
```

---

## 🧪 Testing Strategy

### Unit Test Gates (No Browser)

```bash
npx vitest run src/wizard/v7/gates/__tests__/wizardStepGates.test.ts
```

All 32 tests must pass:
- Location gate isolation
- Industry gate isolation
- Profile gate isolation
- Results always-allow
- Contract enforcement

### Unit Test Pricing (No Browser)

```bash
npx vitest run tests/integration/magicfit-invariants.test.ts
```

### E2E Smoke Test (Later)

Only after unit tests green:

```bash
./scripts/safe-playwright.sh tests/e2e/wizard-happy-path.spec.ts
```

---

## 🚨 Debugging Checklist

### "Next" Button Disabled?

1. Check which step is active
2. Call `getGateForStep(stepId, state)` in console
3. If `canContinue: false`, check `reason`
4. Fix the SPECIFIC gate input (ZIP, industry, or answers)

### Pricing Shows $0 or NaN?

1. Check if `step3Complete` is true
2. Check if `step3Answers` has required fields
3. Pricing failure should NEVER block navigation
4. If blocking → gate is wrong → fix gate

### Action Crash ("X is not a function")?

1. Step is calling wizard action directly
2. Remove the action call from step
3. Move logic to reducer/effect/service

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `src/wizard/v7/gates/wizardStepGates.ts` | Gate functions (SSOT) |
| `src/wizard/v7/gates/index.ts` | Public exports |
| `src/wizard/v7/gates/__tests__/wizardStepGates.test.ts` | Gate unit tests |
| `scripts/kill-dev.sh` | Kill stuck processes |
| `scripts/safe-playwright.sh` | Timeout-wrapped E2E runner |
| `playwright.config.ts` | webServer DISABLED |

---

## ✅ Compliance Checklist

Before merging any wizard changes:

- [ ] Gates only check their OWN step's completion
- [ ] No cross-step dependencies in gates
- [ ] No pricing/DB/async in gates
- [ ] Results gate always returns `canContinue: true`
- [ ] Navigation controlled in ONE place (shell)
- [ ] Steps don't call wizard actions directly
- [ ] Gate unit tests pass (32/32)
- [ ] Pricing failures show banner, not dead wizard


---

## 📋 Implementation Progress (Feb 1, 2026)

| Phase | Status | Notes |
|-------|--------|-------|
| A. Playwright webServer disabled | ✅ | playwright.config.ts |
| B. Hard timeout wrapper | ✅ | scripts/safe-playwright.sh |
| 1-3. Gate SSOT created | ✅ | 32 tests passing |
| 4. Shell wired to gates | ✅ | WizardV7Page.tsx |
| 5. Step3ProfileV7 cleaned | ✅ | No action crashes |
| 6. Pricing non-blocking | ✅ | pricingSanity.ts + 16 tests |
| 7. E2E smoke test | ⏳ | After manual verification |

---

## 💰 Phase 6: Pricing Non-Blocking (Feb 1, 2026)

### Doctrine

> **Pricing failures NEVER block navigation.**
> Bad math becomes visible warnings, not errors.
> User can retry from Results page.

### Architecture

```
submitStep3() → setStep3Complete(true) → setStep("results") → runPricingSafe()
                                                                    │
                                                                    ▼
                                                        ┌───────────────────┐
                                                        │ sanityCheckQuote  │
                                                        │ (NaN/Inf/neg)     │
                                                        └─────────┬─────────┘
                                                                  │
                                              ┌───────────────────┼───────────────────┐
                                              ▼                   ▼                   ▼
                                     PRICING_SUCCESS      PRICING_SUCCESS      PRICING_ERROR
                                     (no warnings)        (with warnings)       (show banner)
```

### New State Fields

```typescript
// WizardState additions
pricingStatus: "idle" | "pending" | "ok" | "error";
pricingFreeze: PricingFreeze | null;
pricingWarnings: string[];         // Math sanity warnings
pricingError: string | null;       // Fatal error message
pricingUpdatedAt: number | null;   // Timestamp
```

### New Intents

```typescript
| { type: "PRICING_START" }
| { type: "PRICING_SUCCESS"; freeze: PricingFreeze; quote: QuoteOutput; warnings: string[] }
| { type: "PRICING_ERROR"; error: string }
| { type: "PRICING_RETRY" }
```

### Sanity Checks (pricingSanity.ts)

The `sanityCheckQuote()` function detects:
- NaN/Infinity anywhere in the quote object
- Negative totalCost/capexTotal
- Zero storageSizeMW or durationHours
- ROI > 100 years (unreasonable)
- Negative annual savings beyond threshold

### Results Page Behavior

| pricingStatus | UI Behavior |
|---------------|-------------|
| `"idle"` | Show "Calculating..." |
| `"pending"` | Show spinner |
| `"ok"` | Show quote + optional warning banner |
| `"error"` | Show error banner + Retry button |

### Test Coverage

```bash
npx vitest run src/wizard/v7/utils/__tests__/pricingSanity.test.ts
# 16 tests passing
```

### Files Added/Modified

| File | Change |
|------|--------|
| `src/wizard/v7/utils/pricingSanity.ts` | NEW: Math poison detector |
| `src/wizard/v7/utils/__tests__/pricingSanity.test.ts` | NEW: 16 unit tests |
| `src/wizard/v7/hooks/useWizardV7.ts` | Added pricing FSM + runPricingSafe |
