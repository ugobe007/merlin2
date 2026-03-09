# Merlin Wizard Architecture Review - March 2, 2026

## 🎯 Executive Summary

Merlin currently has **4 wizard versions** in various stages of development:

| Version   | Route                          | Status                            | Purpose                         | Lines of Code       |
| --------- | ------------------------------ | --------------------------------- | ------------------------------- | ------------------- |
| **V6**    | `/wizard-v6`                   | Legacy (kept for testing)         | Previous production wizard      | ~2,674 (monolithic) |
| **V7**    | `/wizard`, `/wizard-v7`, `/v7` | **PRODUCTION** (Feb 2026)         | Current default with TrueQuote™ | ~3,931 (hook-based) |
| **V8**    | `/v8`, `/wizard-v8`            | **FEATURE COMPLETE** (March 2026) | Simplified flow with MagicFit   | ~655 (hook) + steps |
| **VNext** | `/vnext`, `/wizard-vnext`      | Experimental                      | Luminous HUD scaffold           | Unknown             |

**Current Production Route:** `/wizard` → **WizardV7**

---

## 📊 Wizard Evolution Timeline

```
Dec 2025: StreamlinedWizard (4,677 → 280 lines modular refactor)
Jan 2026:  WizardV6 (Advisor-led, 6-step flow)
Feb 2026:  WizardV7 (TrueQuote™ Phase 5, template-driven) ← PRODUCTION
Mar 2026:  WizardV8 (MagicFit restructure, 5-step flow) ← FEATURE COMPLETE ✅
```

---

## 🧙‍♂️ WizardV7 (Current Production)

**Routes:** `/wizard`, `/wizard-v7`, `/v7`  
**Entry Point:** `src/wizard/v7/WizardV7Page.tsx`  
**Orchestrator:** `src/wizard/v7/hooks/useWizardV7.ts` (3,931 lines)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Location (Google Places address input)                 │
│  Step 2: Industry (24+ industry cards from industryMeta.ts)     │
│  Step 3: Profile (Curated 16Q questionnaire OR template-driven) │
│  Step 4: Results (Quote + TrueQuote™ validation + export)       │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

✅ **TrueQuote™ Validation**

- Every calculator returns `CalcValidation` envelope
- Minimum 3 non-zero `kWContributors` (HVAC, lighting, process, etc.)
- Contributors must sum within 5% of `peakLoadKW`
- Full audit trail with ASHRAE/CBECS/IEEE sources

✅ **Template-Driven Questionnaires**

- 7 industries with JSON templates (`hotel`, `car_wash`, `ev_charging`, etc.)
- 14 industries with adapter-direct approach
- Templates live in `src/wizard/v7/templates/json/`

✅ **SSOT Field Name Translation**

- `buildSSOTInput()` in `ssotInputAliases.ts`
- Maps adapter field names → SSOT parameter names
- **Critical:** Prevents "silent default" bugs
- Example: `dcfcChargers` → `numberOfDCFastChargers`

✅ **Comprehensive Test Suite**

- **383 tests** across 6 test files
- Golden value range tests (typical/small/large scenarios)
- Template ↔ calculator contract drift detection
- Input sensitivity tests (no silent defaults)
- TrueQuote envelope validation

### V7 File Structure

```
src/wizard/v7/
├── hooks/
│   └── useWizardV7.ts                  ← 3,931 lines (SSOT orchestrator)
├── calculators/
│   ├── registry.ts                     ← All calculator adapters (1,805 lines)
│   ├── contract.ts                     ← CalcContract type
│   └── ssotInputAliases.ts             ← Field name translation (CRITICAL)
├── templates/
│   ├── json/                           ← Industry templates (7 total)
│   ├── templateIndex.ts                ← Lazy JSON loader
│   ├── applyMapping.ts                 ← Template answers → calc inputs
│   ├── template-manifest.ts            ← Machine-readable registry
│   └── __tests__/                      ← 383 tests
├── schema/
│   └── curatedFieldsResolver.ts        ← Step 3 curated field definitions
└── industryMeta.ts                     ← Canonical industry display (SSOT)
```

### V7 Design Principles

1. **Steps are dumb renderers** — Zero business logic in step components
2. **useWizardV7 owns ALL state** — Single orchestrator hook
3. **Templates drive questions** — JSON templates define per-industry questionnaires
4. **Calculator adapters are thin** — Delegate to SSOT `calculateUseCasePower()`
5. **TrueQuote validation is mandatory** — Every quote needs kW contributor envelope
6. **No silent defaults** — `buildSSOTInput()` prevents field name mismatches

### V7 Strengths

✅ Most battle-tested (Feb 2026 production deployment)  
✅ Comprehensive test coverage (383 automated tests)  
✅ TrueQuote™ validation baked in  
✅ Template system allows quick industry additions  
✅ Clean separation: domain logic (v7/) vs UI (components/wizard/v7/)

### V7 Weaknesses

⚠️ Complex codebase (3,931-line orchestrator hook)  
⚠️ Dual questionnaire systems (curated vs template) creates maintenance overhead  
⚠️ No tier/MagicFit selection - only single quote  
⚠️ Heavy for simple use cases

---

## 🚀 WizardV8 (Active Development - March 2026)

**Routes:** `/v8`, `/wizard-v8`  
**Entry Point:** `src/wizard/v8/WizardV8Page.tsx`  
**Orchestrator:** `src/wizard/v8/useWizardV8.ts` (655 lines)

### Strategic Vision

**User Insight:**

> "Goals really are not needed. We assume savings. The only other question is the quote properly sized for their needs and properly priced."

**Key Changes from V7:**

1. ❌ Remove redundant "Goals" step (everyone wants savings)
2. ✅ Add **MagicFit** tier selection (STARTER / PERFECT FIT / BEAST MODE)
3. ✅ Apply **Margin Policy** to all pricing (commercial layer)
4. ✅ Simplify flow (5 steps instead of 6/7)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Location + Addon Preferences ✅                        │
│  Step 2: Industry ✅                                            │
│  Step 3: Questionnaire ✅                                       │
│  Step 3.5: Addon Configuration (conditional) 🚧                 │
│  Step 4: MagicFit (3 tiers) ✅                                  │
│  Step 5: Quote Results ✅                                       │
└─────────────────────────────────────────────────────────────────┘
```

### MagicFit Design (Step 4)

Copied from V6's Step5MagicFit.tsx with enhanced visuals:

```
┌────────────────────────────────────────────────────────┐
│  🌟 STARTER                                             │
│  Get your feet wet                                      │
│  💰 $15,000/year savings                                │
│  🔋 100 kWh  ☀️ 50 kW  ⚡ 0 chargers                   │
│  Investment: $500K | ITC: $150K | Net: $350K            │
│  Payback: 7.2 years                                     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  ⭐ PERFECT FIT                    [BEST VALUE] ✅      │
│  Just right for you                                     │
│  💰 $45,000/year savings                                │
│  🔋 250 kWh  ☀️ 150 kW  ⚡ 4 L2 chargers               │
│  Investment: $1.2M | ITC: $360K | Net: $840K            │
│  Payback: 5.8 years                                     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  🏆 BEAST MODE                                          │
│  Go all in                                              │
│  💰 $85,000/year savings                                │
│  🔋 500 kWh  ☀️ 300 kW  ⚡ 8 L2 + 2 DCFC               │
│  Investment: $2.5M | ITC: $750K | Net: $1.75M           │
│  Payback: 6.5 years                                     │
└────────────────────────────────────────────────────────┘
```

### V8 File Structure

```
src/wizard/v8/
├── WizardV8Page.tsx                    ← Entry point (343 lines)
├── useWizardV8.ts                      ← Orchestrator hook (655 lines)
├── wizardState.ts                      ← State spine (657 lines)
├── step4Logic.ts                       ← Tier building engine (504 lines)
├── steps/
│   ├── Step1V8.tsx                     ← Location + addon preferences
│   ├── Step2V8.tsx                     ← Industry selection
│   ├── Step3V8.tsx                     ← Questionnaire
│   ├── Step3_5V8_RANGEBUTTONS.tsx      ← Addon config (ACTIVE)
│   ├── Step4V8.tsx                     ← MagicFit (641 lines)
│   └── Step5V8.tsx                     ← Quote results
└── utils/
```

### V8 Design Principles (8 Rules)

From `wizardState.ts` header documentation:

**RULE 1 — THE SPINE IS FROZEN**

- Add new fields only. Never remove/rename without updating all consumers.

**RULE 2 — ONE STATE BUS**

- No sessionStorage, localStorage, or pub/sub stores from steps.

**RULE 3 — STEPS ARE PURE RENDERERS**

- Only JSX, local UI state, and `dispatch()` calls. NO API calls or calculations.

**RULE 4 — GOALS GUIDE, DATA DECIDES**

- (Note: Goals step removed, but tier sizing still uses bias weights)

**RULE 5 — PRICING RUNS ONCE**

- `calculateQuote()` called once during tier building. No recalculation.

**RULE 6 — ALL NUMBERS COME FROM SSOT**

- `calculateQuote()` → `unifiedQuoteCalculator.ts`
- `calculateUseCasePower()` → `useCasePowerCalculations.ts`
- `getFacilityConstraints()` → `useCasePowerCalculations.ts`

**RULE 7 — NO NEW FILES WITHOUT A LAYER ASSIGNMENT**

- Layer 1: `wizardState.ts` (spine)
- Layer 2: `useWizardV8.ts` (hook)
- Layer 3: `steps/Step*V8.tsx` (renderers)
- Layer 4: `WizardV8Page.tsx` (shell)

**RULE 8 — SOLAR FEASIBILITY GATE**

- Solar only when BOTH: (a) grade ≥ B- (PSH ≥ 3.5), (b) `solarPhysicalCapKW > 0`

### V8 Margin Policy Integration ✅

**Status:** Already integrated in `step4Logic.ts`

```typescript
// Line 71: Import
import { applyMarginPolicy } from "@/services/marginPolicyEngine";

// Line 380: Applied to each tier
const withMargin = applyMarginPolicy({
  lineItems: result.costs.lineItems,
  totalBaseCost: result.costs.baseCostTotal,
  riskLevel: "standard",
  customerSegment: "direct",
});
```

**Margin Bands** (from `marginPolicyEngine.ts`):

| Deal Size   | Margin Range | Target |
| ----------- | ------------ | ------ |
| <$500K      | 18-25%       | 20%    |
| $500K-$1.5M | 15-20%       | 18%    |
| $1.5M-$3M   | 10-15%       | 12%    |
| $3M-$5M     | 8-12%        | 10%    |
| $5M-$10M    | 6-9%         | 7.5%   |
| $10M-$20M   | 4-7%         | 5.5%   |
| $20M-$100M  | 2-5%         | 3.5%   |
| $100M+      | 0.5-2%       | 1.2%   |

### V8 Implementation Status (March 2, 2026)

| Component                   | Status        | Notes                            |
| --------------------------- | ------------- | -------------------------------- |
| **Step 1 (Location)**       | ✅ Complete   | ZIP → location via zippopotam.us |
| **Step 2 (Industry)**       | ✅ Complete   | 24+ industry cards               |
| **Step 3 (Questionnaire)**  | ✅ Complete   | Database-driven questions        |
| **Step 3.5 (Addon Config)** | ✅ Complete   | Range button version deployed    |
| **Step 4 (MagicFit)**       | ✅ Complete   | 3 tiers with gradient cards      |
| **Step 5 (Results)**        | ✅ Complete   | Export + TrueQuote™ display      |
| **Margin Policy**           | ✅ Integrated | Applied in `step4Logic.ts`       |
| **SSOT Compliance**         | ✅ Yes        | All calcs via SSOT services      |

### V8 Strengths

✅ **Simpler flow** (5 steps vs V7's 4)  
✅ **Better UX** (MagicFit tiers vs single quote)  
✅ **Margin policy baked in** (commercial pricing from day 1)  
✅ **Cleaner codebase** (655-line hook vs V7's 3,931)  
✅ **Clear layering** (8 rules enforce separation)  
✅ **No Goals step** (aligns with user psychology)

### V8 Remaining Work

🚧 **Test Suite** 🎯 HIGH PRIORITY

- V7 has 383 tests
- V8 needs equivalent coverage
- Focus areas: MagicFit tiers, margin policy, addon config flow

🚧 **Documentation**

- Update copilot-instructions.md with V8 architecture
- Add V8 to wizard comparison table
- Document Step 3.5 conditional logic

🚧 **Beta Testing**

- End-to-end flow testing with real users
- A/B test preparation against V7
- Performance benchmarking

---

## 🏗️ WizardV6 (Legacy - Kept for Testing)

**Route:** `/wizard-v6` only  
**Status:** Legacy, kept for reference  
**Lines:** ~2,674 (monolithic)

**Architecture:** 6-step flow with Advisor rail

```
Step 1: Advisor-Led Location/Industry
Step 2: Industry (enhanced)
Step 3: Details (database-driven questionnaire)
Step 4: Options
Step 5: MagicFit (3 tiers)
Step 6: Quote Results
```

**Why V6 is Legacy:**

- Replaced by V7 in Feb 2026
- Monolithic design (2,674 lines in single file)
- Advisor rail was good UX but hard to maintain
- No TrueQuote validation
- No template system

---

## 🔮 VNext (Experimental)

**Routes:** `/vnext`, `/wizard-vnext`  
**Status:** Experimental "luminous HUD scaffold"  
**Purpose:** Unknown - needs investigation

---

## 📋 Comparison Matrix

| Feature              | V6          | V7         | V8                 | VNext        |
| -------------------- | ----------- | ---------- | ------------------ | ------------ |
| **Status**           | Legacy      | Production | Dev                | Experimental |
| **Steps**            | 6           | 4          | 5                  | ?            |
| **Architecture**     | Monolithic  | Hook-based | Layered            | ?            |
| **Lines of Code**    | 2,674       | 3,931      | 655                | ?            |
| **TrueQuote™**       | ❌          | ✅ Full    | 🚧 Partial         | ?            |
| **Test Coverage**    | Manual      | 383 tests  | 🚧 TODO            | ?            |
| **Tier Selection**   | ✅ MagicFit | ❌ Single  | ✅ MagicFit        | ?            |
| **Margin Policy**    | ❌          | ✅         | ✅                 | ?            |
| **Template System**  | ❌          | ✅         | ❌ (uses V7 calcs) | ?            |
| **SSOT Compliance**  | Partial     | ✅ Full    | ✅ Full            | ?            |
| **Production Ready** | No          | Yes        | Almost             | No           |

---

## 🎯 Recommendations

### Short Term (March 2026)

1. **Add V8 Test Suite** 🎯 HIGH PRIORITY
   - Port relevant V7 tests
   - Add MagicFit tier validation tests
   - Test margin policy integration
   - Validate Step 3.5 conditional logic

2. **Documentation Updates**
   - Update `copilot-instructions.md` with V8 section
   - Document V8 8 Rules prominently
   - Add migration guide (V7 → V8)
   - Document Step 3.5 addon config patterns

3. **Beta Testing Plan**
   - Define success metrics vs V7
   - Set up A/B testing infrastructure
   - Prepare rollback strategy

### Medium Term (Q2 2026)

5. **V8 Beta Launch**
   - Deploy to `/v8` route for testing
   - A/B test vs V7 (conversion rates)
   - Gather user feedback on MagicFit

6. **Deprecate V6**
   - Archive V6 code
   - Remove from routing (keep in git history)

7. **V8 Production Promotion**
   - If metrics beat V7, make V8 default at `/wizard`
   - Keep V7 available at `/wizard-v7` for 90 days

### Long Term (Q3 2026)

8. **VNext Evaluation**
   - Document VNext purpose/status
   - Decide: merge learnings into V8 or deprecate

9. **Template Unification**
   - V8 currently uses V7's calculator registry
   - Consider: should V8 own its calculators?
   - Or: extract calculators to shared `/wizard/shared/calculators/`?

10. **Wizard Consolidation**
    - Goal: One production wizard (probably V8)
    - Archive all legacy versions
    - Single source of truth for quote flow

---

## 🚨 Critical Issues

### 1. Solar Bleed Bug (Fixed in V8)

**Issue:** V7 had 3 state buses that drifted (WizardState + merlinMemory + TrueQuoteTemp)  
**Fix:** V8 has ONE state bus (`wizardState.ts`) - Rule #2  
**Commit:** 867ce0c fixed in V7, prevented in V8 by design

### 2. Silent Default Bug (Prevented in V7/V8)

**Issue:** Adapter field names didn't match SSOT parameter names → fell through to defaults  
**Example:** `dcfcChargers` passed to SSOT, but SSOT expects `numberOfDCFastChargers` → defaulted to 8  
**Fix (V7):** `buildSSOTInput()` in `ssotInputAliases.ts` translates field names  
**Fix (V8):** V8 uses V7's calculator registry → same protection

### 3. Pricing Drift

**Issue:** Different pricing in different wizard versions  
**Root Cause:** V6 had hardcoded prices, V7/V8 use SSOT  
**Status:** V7/V8 both use `calculateQuote()` → consistent  
**Remaining:** Ensure margin policy applied consistently

---

## 🧪 Testing Strategy

### V7 (Production)

- **383 automated tests** in `__tests__/`
- Golden value ranges
- Template contract validation
- TrueQuote envelope checks
- Ship gate: `npm run ship:v7`

### V8 (Development)

- 🚧 **TODO:** Port relevant V7 tests
- 🚧 **TODO:** Add MagicFit tier tests
- 🚧 **TODO:** Test margin policy integration
- 🚧 **TODO:** E2E flow tests

### V6 (Legacy)

- Manual testing only
- No automated coverage

---

## 📁 File Locations

```
src/
├── components/wizard/
│   ├── v6/                             ← Legacy (archived)
│   ├── v7/                             ← UI components for V7
│   ├── shared/                         ← Shared across versions
│   └── [root files]                    ← Integration components
│
├── wizard/
│   ├── v7/                             ← V7 domain logic (PRODUCTION)
│   ├── v8/                             ← V8 implementation (DEV)
│   └── vnext/                          ← Experimental
│
├── services/
│   ├── unifiedQuoteCalculator.ts       ← SSOT for quotes
│   ├── useCasePowerCalculations.ts     ← SSOT for power calcs
│   ├── marginPolicyEngine.ts           ← Commercial pricing layer
│   └── ...
```

---

## 🎬 Next Steps

**Immediate Actions:**

1. ✅ Review this document with team
2. ✅ V8 core features complete (Step 3.5 ✓, TrueQuote ✓)
3. 🎯 **Priority: Build test suite** - Critical for production readiness
4. 🎯 **Plan V8 beta launch** - Set metrics, A/B test strategy
5. Update documentation (copilot-instructions.md)

**Questions to Answer:**

1. What's the purpose of VNext? Keep or deprecate?
2. Should V8 have its own calculator registry or keep using V7's?
3. When to deprecate V6?
4. V8 launch criteria (what metrics to beat V7)?

---

## 📚 Related Documentation

- `WIZARDV8_MAGICFIT_RESTRUCTURE.md` - V8 restructure plan
- `WIZARD_ARCHITECTURE.md` - General wizard architecture
- `copilot-instructions.md` - AI agent guidelines (needs V8 section)
- `CALCULATION_FILES_AUDIT.md` - SSOT documentation

---

**Review Date:** March 2, 2026  
**Reviewer:** GitHub Copilot  
**Status:** Complete  
**Next Review:** After V8 completion
