# Wizard V7 — File Map & Risk Audit

> Generated: Feb 4, 2026 · Branch: `feature/wizard-vnext-clean-20260130`  
> Baseline: 165/165 v7 tests pass · 6 test files · 0 TS errors in v7 scope

---

## Architecture Snapshot

```
User  ─── Step 1 Location ─── Step 2 Industry ─── Step 3 Profile ─── Step 4 Results
             │                     │                    │                    │
             ▼                     ▼                    ▼                    ▼
        gateLocation()       gateIndustry()       gateProfile()       gateResults()
             │                     │                    │                    │
             └──────────────── useWizardV7.ts (state machine) ──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     templateIndex.ts      registry.ts           pricingBridge.ts
     (4 JSON templates)    (12 adapters)         (→ calculateQuote SSOT)
              │                    │
              ▼                    ▼
     applyMapping.ts       contract.ts
     (rules + transforms)  (CalcRunResult type)
```

---

## Test Coverage Summary

| Test File                  | Tests   | Status      |
| -------------------------- | ------- | ----------- |
| `goldenTraces.test.ts`     | 57      | ✅ All pass |
| `wizardNoDeadEnds.test.ts` | 50      | ✅ All pass |
| `wizardStepGates.test.ts`  | 32      | ✅ All pass |
| `pricingSanity.test.ts`    | 16      | ✅ All pass |
| `templateDrift.test.ts`    | 6       | ✅ All pass |
| `adapterHardening.test.ts` | 4       | ✅ All pass |
| **Total**                  | **165** | **✅ 100%** |

---

## 1. Core Engine (`src/wizard/v7/`)

### 1.1 State Machine & Orchestrator

| File                   | Lines | Role                                                                                       | Risk        | Tests                           | Notes                                                                                                                                                                                                                                                          |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------ | ----------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hooks/useWizardV7.ts` | 3,930 | Canonical state machine. ALL wizard state, effects, callbacks live here.                   | 🔴 **HIGH** | Indirect (gates, golden traces) | Largest file in v7. Contains location submission, industry selection, template loading, quote generation, confidence scoring, lifeSignals, answer provenance. Any change here has blast radius across entire wizard. Needs extraction into sub-hooks (see §6). |
| `WizardV7Page.tsx`     | 664   | Orchestrator — renders layout, advisor narration, step switching.                          | 🟡 MEDIUM   | None direct                     | Trending toward god-component. Narration text generation should move to dedicated module. Step rendering logic is clean.                                                                                                                                       |
| `featureFlags.ts`      | 94    | Two flags: `V7_ENABLE_GATED_STEP3` (default false), `V7_USE_CURATED_STEP3` (default true). | 🟢 LOW      | Referenced in gate tests        | Clean. Priority: Gated > Curated > Basic. Env + localStorage + default.                                                                                                                                                                                        |

### 1.2 Template Pipeline

| File                                   | Lines | Role                                                                                                                                           | Risk      | Tests                                   | Notes                                                                                                                        |
| -------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `templates/templateIndex.ts`           | 154   | Client-side registry. Imports 4 JSON templates (dataCenter, hotel, carWash, genericFacility). Exports `getTemplate()`, `listTemplates()`, etc. | 🟡 MEDIUM | goldenTraces, templateDrift             | Only 4 templates vs 21 active DB use cases. Coverage gap = industries that fall through to `genericFacility`.                |
| `templates/applyMapping.ts`            | 74    | Applies mapping rules (question ID → calculator input) with optional transforms.                                                               | 🟢 LOW    | goldenTraces (every trace exercises it) | Clean, well-tested. No changes needed.                                                                                       |
| `templates/transforms.ts`              | 204   | 8 transforms: `toNumber`, `yesNoToBool`, `defaultZero`, `percentToDecimal`, `inferHotelClass`, `mapWashType`, etc.                             | 🟢 LOW    | goldenTraces                            | Well-tested. `mapWashType` added in commit `300907f`. Each new industry may need new transforms.                             |
| `templates/template-manifest.ts`       | 236   | Machine-readable contract: template → calculator → validation binding. 6 entries.                                                              | 🟡 MEDIUM | 5 manifest integrity tests              | Must stay in sync with registry.ts adapters. Currently 6/12 adapters have manifest entries. Gap: 6 adapters not in manifest. |
| `templates/json/data-center.json`      | ~90   | 16-question template for data centers.                                                                                                         | 🟢 LOW    | goldenTraces (DC suite)                 | Stable.                                                                                                                      |
| `templates/json/hotel.json`            | ~90   | 16-question template for hotels.                                                                                                               | 🟢 LOW    | goldenTraces (hotel suite)              | Stable.                                                                                                                      |
| `templates/json/car-wash.json`         | ~100  | 16-question template for car washes.                                                                                                           | 🟢 LOW    | goldenTraces (car wash suite)           | Stable. Recent `mapWashType` fix.                                                                                            |
| `templates/json/generic-facility.json` | ~80   | Fallback template for any industry without a dedicated template.                                                                               | 🟡 MEDIUM | goldenTraces (fallback tests)           | Catch-all for 17+ industries. Important to verify generic adapter handles it.                                                |

### 1.3 Calculator Layer

| File                              | Lines  | Role                                                                                                        | Risk        | Tests                                                           | Notes                                                                                                                                                                                                                     |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `calculators/registry.ts`         | 1,018  | 12 calculator adapters + `CALCULATORS_BY_ID` map. Each adapter: `compute(inputs) → CalcRunResult`.          | 🔴 **HIGH** | goldenTraces (3 templated + 3 adapter-direct), adapterHardening | Core calculation engine. 6/12 adapters have CalcValidation envelopes (DC, Hotel, CarWash, EV, Hospital, Manufacturing). **6 adapters still need envelopes**: GENERIC, OFFICE, RETAIL, WAREHOUSE, RESTAURANT, GAS_STATION. |
| `calculators/contract.ts`         | 132    | Type definitions: `CalculatorContract`, `CalcRunResult`, `CalcInputs`, `CalcValidation`, `ContributorKeys`. | 🟢 LOW      | Used by all calculator tests                                    | Stable types. `CalcValidation` envelope is the TrueQuote harness layer.                                                                                                                                                   |
| `calculators/ssot-adapter-poc.ts` | 245    | **⚠️ DEAD CODE** — Proof-of-concept SSOT-delegating adapters. Never imported by anything.                   | ⬛ DEAD     | None                                                            | **Delete candidate**. Was a prototype showing how to route through `calculateUseCasePower()`. Ideas partially absorbed into registry.ts adapters.                                                                         |
| `calculators/registry.ts.backup`  | ~1,000 | **⚠️ DEAD CODE** — Old backup of registry before validation envelopes.                                      | ⬛ DEAD     | None                                                            | **Delete candidate**. Leftover from refactoring.                                                                                                                                                                          |

### 1.4 Pricing Layer

| File                            | Lines | Role                                                                                                                                                                              | Risk      | Tests                    | Notes                                                                        |
| ------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `pricing/pricingBridge.ts`      | 425   | Layer B bridge: `runPricingQuote(contract, config) → PricingQuoteResult`. Calls SSOT `calculateQuote()`. Includes industry sizing defaults, mock control, snapshot ID generation. | 🟡 MEDIUM | pricingSanity (indirect) | Clean architecture. Correctly calls SSOT. Mock control (`?mockPricing=fail   | slow`) is useful for testing. `INDUSTRY_SIZING_DEFAULTS` should eventually come from DB. |
| `pricing/mockPricingControl.ts` | ~60   | Dev-only mock control for pricing delays/failures.                                                                                                                                | 🟢 LOW    | None needed              | Dev utility. Clean.                                                          |
| `utils/pricingSanity.ts`        | 177   | Math poison detector: catches NaN, Infinity, negative totals. Non-blocking (warnings only).                                                                                       | 🟢 LOW    | 16 tests                 | Solid defensive layer. `sanityCheckQuote()` and `sanitizeQuoteForDisplay()`. |

### 1.5 Validation & Gates

| File                              | Lines | Role                                                                                                                                                        | Risk      | Tests               | Notes                                                                                                                                                                                                   |
| --------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gates/wizardStepGates.ts`        | 271   | Gate functions: `gateLocation()`, `gateIndustry()`, `gateProfile()`, `gateResults()`. Dispatcher: `getGateForStep()`. Step order constants.                 | 🟢 LOW    | 32 tests            | Rock-solid. Clean doctrine: each step asks exactly ONE question. Results step NEVER blocks. Has AI-agent relaxation escape hatch via localStorage.                                                      |
| `validation/templateValidator.ts` | 383   | Validates template structure: required fields, question IDs, mapping consistency, calculator contract alignment.                                            | 🟢 LOW    | Used in drift tests | Comprehensive 6-section validation. Returns structured `ValidationResult`. Not a bottleneck.                                                                                                            |
| `fsm/step3FSM.ts`                 | 376   | Formal state machine types + transition function for Step 3 flow. States: idle → loading_template → template_ready → part_active → generating_quote → done. | 🟡 MEDIUM | None direct         | Well-designed FSM but **unclear if actually used** in current Step 3 components. `Step3ProfileV7Curated` appears to manage its own state. Potential drift between FSM design and actual implementation. |

### 1.6 Schema & Expression

| File                              | Lines | Role                                                                                                                                                                                                     | Risk      | Tests       | Notes                                                                                                                                                                                                                   |
| --------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema/curatedFieldsResolver.ts` | 622   | SSOT for Step 3 field definitions. `resolveStep3Schema(industry)` returns curated questions per industry. Priority: complete (car-wash) > legacy (hotel, ev, DC, etc.) > fallback (8 generic questions). | 🟡 MEDIUM | None direct | Key integration point. Only car-wash has "complete" curated schema. 9 industries use legacy `industryQuestionnaires.ts`. ~10 industries fall to 8-question generic fallback. Tier 1 blockers only defined for car-wash. |
| `expression/types.ts`             | 154   | Type definitions for the expression layer: `FieldCertainty`, `Phase`, `FieldExpressionProps`, visual mapping helpers.                                                                                    | 🟢 LOW    | None        | Clean types.                                                                                                                                                                                                            |
| `expression/hooks.ts`             | 266   | Hooks: `useFieldExpression()`, `usePhaseExpression()`, `useConfidenceExpression()`, `useExpression()`, `useSourceSummary()`. Bridge between lifeSignals and UI.                                          | 🟢 LOW    | None        | Clean hook layer. Consumes `WizardV7LifeSignals` from useWizardV7.                                                                                                                                                      |
| `expression/components.tsx`       | 600   | Visual expression components (Merlin lifeform UI).                                                                                                                                                       | 🟢 LOW    | None        | Presentation only. No calculation logic.                                                                                                                                                                                |

### 1.7 Telemetry & Debug

| File                             | Lines | Role                                                                                                                                                               | Risk   | Tests | Notes                                                |
| -------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----- | ---------------------------------------------------- |
| `telemetry/contractTelemetry.ts` | 202   | Fire-and-forget telemetry: contract run events, `ContractRunLogger` class. No PII. Dev → console, Prod → POST /api/telemetry.                                      | 🟢 LOW | None  | Clean. Best-effort delivery. Structured event types. |
| `debug/provenanceAudit.ts`       | 144   | Debug helper: audit Step 3 answer provenance by source (user, template_default, location_intel, business_detection). Attachable to `window.__MERLIN_PROVENANCE__`. | 🟢 LOW | None  | Dev utility. Useful for console forensics.           |

---

## 2. Step Components (`src/components/wizard/v7/`)

### 2.1 Active Steps

| File                              | Lines | Role                                                                                                                                                                             | Risk      | Notes                                                                                                                                                           |
| --------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `steps/Step1LocationV7.tsx`       | 647   | Location entry: ZIP/address input, Google Places business lookup, location confirmation, business profile card. Calls `/api/location/resolve` and `/api/places/lookup-business`. | 🟡 MEDIUM | Depends on server API being available. If server not running, location resolution fails. No offline fallback for geocoding. Business lookup is optional (good). |
| `steps/Step1LocationV7Clean.tsx`  | 9     | Thin re-export wrapper for Step1LocationV7.                                                                                                                                      | 🟢 LOW    | Can be deleted (adds no value).                                                                                                                                 |
| `steps/Step2IndustryV7.tsx`       | 293   | Industry selection grid. Receives industry list, handles selection callback.                                                                                                     | 🟢 LOW    | Clean. Presentation-focused.                                                                                                                                    |
| `steps/Step3ProfileV7.tsx`        | 477   | **Basic** Step 3: Renders template questions directly. Used when both feature flags are false.                                                                                   | 🟢 LOW    | Effectively superseded by Curated variant.                                                                                                                      |
| `steps/Step3ProfileV7Curated.tsx` | 654   | **Active default** Step 3: Uses `resolveStep3Schema()` from curatedFieldsResolver. Renders industry-specific curated questions with sections, icons, Merlin tips.                | 🟡 MEDIUM | Primary user-facing Step 3. Depends on curatedFieldsResolver quality. Only car-wash has full curated schema; others use legacy/fallback.                        |
| `steps/Step3GatedV7.tsx`          | 843   | **Feature-flagged OFF**. 4-part gated questionnaire with progress tracking, auto-completion, and part-by-part validation.                                                        | 🟡 MEDIUM | Not active. Largest step component. Potential future replacement for Curated if gating is desired.                                                              |
| `steps/Step4ResultsV7.tsx`        | 732   | Results display: pricing summary, equipment breakdown, TrueQuote badge, financial metrics, export. Consumes `PricingQuoteResult` from pricingBridge.                             | 🟡 MEDIUM | Heavy rendering logic. Needs to handle pricing failures gracefully (show banner, don't block).                                                                  |

### 2.2 Shared Components

| File                             | Lines | Role                                                                                         | Risk      | Notes                                                                                         |
| -------------------------------- | ----- | -------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `shared/WizardShellV7.tsx`       | 380   | Layout shell: sidebar progress, main content area, responsive design.                        | 🟢 LOW    | Structural.                                                                                   |
| `shared/Step3SystemAssist.tsx`   | 459   | System assistance panel for Step 3: smart suggestions, auto-fill, template hints.            | 🟡 MEDIUM | Complex logic for assistance. Verify it doesn't conflict with curatedFieldsResolver defaults. |
| `shared/IntelStrip.tsx`          | 245   | Intel display strip: utility rates, solar grade, weather risk. Consumes location intel data. | 🟢 LOW    | Currently shows placeholder data since `/api/location/intel` returns nulls.                   |
| `shared/BusinessProfileCard.tsx` | 203   | Displays business profile from Google Places: name, address, photo, rating.                  | 🟢 LOW    | Presentation only.                                                                            |
| `shared/WizardErrorBoundary.tsx` | 130   | React error boundary for wizard. Catches rendering errors, shows recovery UI.                | 🟢 LOW    | Safety net.                                                                                   |
| `shared/V7AdvisorPanel.tsx`      | 105   | Advisor panel component.                                                                     | 🟢 LOW    | Presentation.                                                                                 |
| `shared/BottomNavigation.tsx`    | 95    | Bottom navigation bar with back/next buttons.                                                | 🟢 LOW    | Clean.                                                                                        |
| `shared/ProgressTracker.tsx`     | 78    | Step progress indicator.                                                                     | 🟢 LOW    | Clean.                                                                                        |
| `shared/TopNavBar.tsx`           | 78    | Top navigation bar.                                                                          | 🟢 LOW    | Clean.                                                                                        |
| `shared/AdvisorHeader.tsx`       | ~50   | Advisor header with avatar and narration text.                                               | 🟢 LOW    | Clean.                                                                                        |

### 2.3 Admin & Debug

| File                                | Lines | Role                                                                 | Risk          | Notes                                   |
| ----------------------------------- | ----- | -------------------------------------------------------------------- | ------------- | --------------------------------------- |
| `admin/WizardHealthDashboardV2.tsx` | 382   | Admin dashboard: template coverage, calculator status, test results. | 🟢 LOW        | Admin-only.                             |
| `admin/WizardHealthDashboard.tsx`   | 221   | Older version of health dashboard.                                   | ⬛ SUPERSEDED | Candidate for removal (V2 replaces it). |
| `debug/V7DebugPanel.tsx`            | 340   | Dev debug panel: state inspector, answer viewer, gate status.        | 🟢 LOW        | Dev-only. Useful.                       |
| `debug/index.ts`                    | ~10   | Re-export barrel.                                                    | 🟢 LOW        |                                         |

### 2.4 Live Preview

| File                                    | Lines | Role                                                | Risk   | Notes                    |
| --------------------------------------- | ----- | --------------------------------------------------- | ------ | ------------------------ |
| `live-preview/LiveCalculationPanel.tsx` | 102   | Real-time calculation preview as user fills Step 3. | 🟢 LOW | Nice-to-have UI feature. |
| `live-preview/PowerGauge.tsx`           | 65    | Visual power gauge component.                       | 🟢 LOW | Presentation.            |
| `live-preview/SavingsCounter.tsx`       | 53    | Animated savings counter.                           | 🟢 LOW | Presentation.            |

### 2.5 Advisor

| File                          | Lines | Role                                           | Risk   | Notes         |
| ----------------------------- | ----- | ---------------------------------------------- | ------ | ------------- |
| `advisor/AIEnergyAdvisor.tsx` | 184   | AI advisor component with contextual guidance. | 🟢 LOW | Presentation. |
| `advisor/AdvisorAvatar.tsx`   | 47    | Animated advisor avatar.                       | 🟢 LOW | Presentation. |

### 2.6 Services

| File                         | Lines | Role                                       | Risk   | Notes        |
| ---------------------------- | ----- | ------------------------------------------ | ------ | ------------ |
| `services/useCaseCatalog.ts` | 80    | Industry catalog with metadata for Step 2. | 🟢 LOW | Static data. |

### 2.7 Archive (Dead Code)

| Folder            | Files   | Lines | Notes                                                                                                       |
| ----------------- | ------- | ----- | ----------------------------------------------------------------------------------------------------------- |
| `steps/_archive/` | 9 files | 2,160 | Old step variants. **Delete candidate** — all superseded by current steps. Index re-exports nothing useful. |

---

## 3. Server (`server/`)

| File                  | Lines | Role                                                                                                                                                                 | Risk              | Notes                                                                                                                                                                                                                                                                                                         |
| --------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.js`            | 56    | Express app on port 3001. CORS middleware. 4 route groups + `/health`.                                                                                               | 🟢 LOW            | Clean entry point.                                                                                                                                                                                                                                                                                            |
| `routes/location.js`  | 265   | `POST /resolve` — Google Geocoding → LocationCard with confidence. `POST /intel` — **Placeholder** (returns all nulls).                                              | 🟡 MEDIUM         | Resolve works well. **Intel is a stub** — needs wiring to `utilityRateService`, `pvWattsService`. This is the biggest server gap.                                                                                                                                                                             |
| `routes/places.js`    | 184   | `POST /lookup-business` — Google Places text search. `POST /place-details` — Place details. `GET /photo/:ref` — Photo proxy.                                         | 🟢 LOW            | Clean proxy layer. Works when API key configured.                                                                                                                                                                                                                                                             |
| `routes/templates.js` | 539   | `POST /load` — Load template by industry. `GET /list` — List templates. **Has its own inline `TEMPLATE_REGISTRY`** with 3 industries (car_wash, hotel, data_center). | 🔴 **HIGH DRIFT** | **CRITICAL FINDING**: This server registry is **never called by the client**. Client uses `templateIndex.ts` with local JSON imports. The server registry has different schema (options as `{value, label}` objects vs. flat strings in client JSON). This file is **dead code** in the current architecture. |
| `routes/telemetry.js` | 142   | `POST /` — Fire-and-forget telemetry ingestion. Rate-limited. `GET /health` — Health check.                                                                          | 🟢 LOW            | Clean. In-memory rate limiter (adequate for current scale).                                                                                                                                                                                                                                                   |

### Server Drift Analysis

```
CLIENT (templateIndex.ts)          SERVER (templates.js)
─────────────────────────          ──────────────────────
4 JSON templates:                  3 inline templates:
  • data-center                      • car_wash
  • hotel                            • hotel
  • car-wash                         • data_center
  • generic-facility

Schema: flat string options        Schema: {value, label} objects
Loaded: import at build time       Loaded: POST /api/templates/load
Used by: useWizardV7.ts            Used by: NOTHING (dead endpoint)
```

**Verdict**: Server `templates.js` should be **deleted or deprecated**. It creates a false sense of API-driven templates while the actual system is client-side JSON imports.

---

## 4. Data Layer Dependencies

| File                                            | Lines | Role                                                                           | How Used                                                             |
| ----------------------------------------------- | ----- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `src/data/carwash-questions-complete.config.ts` | 727   | Complete car wash question definitions with sections, tips, icons, validation. | Imported by `curatedFieldsResolver.ts` for car-wash industry.        |
| `src/data/industryQuestionnaires.ts`            | 1,308 | Legacy question definitions for ~10 industries.                                | Imported by `curatedFieldsResolver.ts` for legacy schema resolution. |

---

## 5. Identified Bottlenecks

### 🔴 Critical (Fix Before User Testing)

| #   | Issue                                                | Impact                                                                                                                    | File(s)                                         | Fix                                                                                                                          |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| B1  | **useWizardV7.ts is 3,930 lines**                    | Any change has blast radius across entire wizard. Hard to reason about, test, or extend.                                  | `hooks/useWizardV7.ts`                          | Extract sub-hooks: `useLocationStep()`, `useIndustryStep()`, `useProfileStep()`, `useQuoteGeneration()`, `useLifeSignals()`. |
| B2  | **Only 4 client templates** for 21 active industries | 17 industries use `genericFacility` template → fewer questions → less accurate quotes.                                    | `templates/templateIndex.ts`, `templates/json/` | Add templates for top 5 next industries (EV, hospital, warehouse, retail, office).                                           |
| B3  | **6/12 adapters missing CalcValidation**             | No kW contributor breakdown for GENERIC, OFFICE, RETAIL, WAREHOUSE, RESTAURANT, GAS_STATION. TrueQuote traces incomplete. | `calculators/registry.ts`                       | Add CalcValidation envelopes to remaining 6 adapters.                                                                        |
| B4  | **Location intel stub**                              | `/api/location/intel` returns all nulls. No utility rates, no solar grade, no weather risk. IntelStrip shows empty.       | `server/routes/location.js`                     | Wire to existing services: `utilityRateService.getCommercialRateByZip()`, `pvWattsService.estimateSolarProduction()`.        |

### 🟡 Medium (Fix During Polish Phase)

| #   | Issue                                                           | Impact                                                                                                                                     | File(s)                             | Fix                                                                          |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | ---------------------------------------------------------------------------- |
| B5  | **Server templates.js is dead code**                            | Creates confusion. Developers may update server templates thinking they matter. Drift vector.                                              | `server/routes/templates.js`        | Delete or add `DEPRECATED` banner. Redirect effort to client JSON templates. |
| B6  | **Step3 FSM not wired**                                         | `fsm/step3FSM.ts` defines formal state machine but `Step3ProfileV7Curated` manages its own state. Drift between design and implementation. | `fsm/step3FSM.ts`, Step3 components | Either wire FSM into Step3Curated or mark FSM as aspirational.               |
| B7  | **curatedFieldsResolver only has Tier 1 blockers for car-wash** | Other industries have no Tier 1 blocker definitions → gating behavior undefined.                                                           | `schema/curatedFieldsResolver.ts`   | Add Tier 1 blockers for top 5 industries.                                    |
| B8  | **WizardV7Page narration in orchestrator**                      | Advisor narration text logic bloats the page component.                                                                                    | `WizardV7Page.tsx`                  | Extract narration to `advisor/narrativeEngine.ts`.                           |

### 🟢 Low (Cleanup)

| #   | Issue                                                   | Impact                                       | File(s)                                                                                          | Fix                                                              |
| --- | ------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| B9  | Dead files                                              | Clutter, confusion                           | `ssot-adapter-poc.ts`, `registry.ts.backup`, `steps/_archive/`, `WizardHealthDashboard.tsx` (V1) | Delete all.                                                      |
| B10 | `Step1LocationV7Clean.tsx` is 9-line wrapper            | Adds no value                                | `steps/Step1LocationV7Clean.tsx`                                                                 | Delete, update any imports.                                      |
| B11 | Pricing sizing defaults hardcoded in `pricingBridge.ts` | Should come from DB for TrueQuote compliance | `pricing/pricingBridge.ts` `INDUSTRY_SIZING_DEFAULTS`                                            | Move to `pricing_configurations` table or `benchmarkSources.ts`. |

---

## 6. Actionable Commits (Priority Order)

### Phase 0: Cleanup (Safe, immediate)

```
Commit 1: Delete dead code
  - rm src/wizard/v7/calculators/ssot-adapter-poc.ts
  - rm src/wizard/v7/calculators/registry.ts.backup
  - rm -rf src/components/wizard/v7/steps/_archive/
  - rm src/components/wizard/v7/steps/Step1LocationV7Clean.tsx
  - rm src/components/wizard/v7/admin/WizardHealthDashboard.tsx (V1)
  - Add DEPRECATED banner to server/routes/templates.js
  Tests: 165/165 still pass (no imports to these files)
```

### Phase 1: Template Coverage (Accuracy improvement)

```
Commit 2: Add EV charging template
  - Create templates/json/ev-charging.json (16 questions)
  - Add mapping rules + transforms
  - Add manifest entry (upgrade from adapter-only)
  - Add golden trace tests
  Tests: +5-8 new tests

Commit 3: Add hospital template
  - Same pattern as Commit 2
  Tests: +5-8 new tests

Commit 4: Add remaining CalcValidation envelopes
  - GENERIC, OFFICE, RETAIL, WAREHOUSE, RESTAURANT, GAS_STATION adapters
  - Update manifest with adapter-only entries
  Tests: +18-30 new traces (completeness gate already covers)
```

### Phase 2: Location Intel (UX improvement)

```
Commit 5: Wire location intel endpoint
  - Import utilityRateService in server/routes/location.js
  - Import pvWattsService for solar grade
  - Return real data from /api/location/intel
  - Update IntelStrip to show real values
  Tests: Add server-side test for intel endpoint
```

### Phase 3: Hook Extraction (Maintainability)

```
Commit 6: Extract useLocationStep from useWizardV7
Commit 7: Extract useProfileStep from useWizardV7
Commit 8: Extract useQuoteGeneration from useWizardV7
  Goal: useWizardV7.ts from 3,930 → ~1,500 lines (orchestrator only)
  Tests: All 165 tests still pass (pure refactor)
```

---

## 7. Line Count Summary

### Source Code (active, excluding tests)

| Category                       | Files  | Lines       |
| ------------------------------ | ------ | ----------- |
| Core engine (`src/wizard/v7/`) | 20     | ~8,400      |
| Step components (active)       | 7      | ~3,800      |
| Shared components              | 10     | ~1,800      |
| Admin/Debug/Advisor            | 6      | ~1,200      |
| Live preview                   | 3      | ~220        |
| Server routes                  | 4      | ~1,190      |
| **Total active source**        | **50** | **~16,600** |

### Dead Code (delete candidates)

| Category                         | Files  | Lines      |
| -------------------------------- | ------ | ---------- |
| `ssot-adapter-poc.ts`            | 1      | 245        |
| `registry.ts.backup`             | 1      | ~1,000     |
| `steps/_archive/`                | 9      | 2,160      |
| `WizardHealthDashboard.tsx` (V1) | 1      | 221        |
| `Step1LocationV7Clean.tsx`       | 1      | 9          |
| **Total dead code**              | **13** | **~3,635** |

### Test Code

| Category                   | Files | Lines      |
| -------------------------- | ----- | ---------- |
| `goldenTraces.test.ts`     | 1     | 670        |
| `wizardNoDeadEnds.test.ts` | 1     | 343        |
| `wizardStepGates.test.ts`  | 1     | 322        |
| `pricingSanity.test.ts`    | 1     | 169        |
| `templateDrift.test.ts`    | 1     | 306        |
| `adapterHardening.test.ts` | 1     | 174        |
| **Total test code**        | **6** | **~1,984** |

---

## 8. Template → Calculator → SSOT Coverage Matrix

| Industry      | Client Template    | Calculator Adapter        | CalcValidation | Manifest        | Golden Traces    | Status            |
| ------------- | ------------------ | ------------------------- | -------------- | --------------- | ---------------- | ----------------- |
| data_center   | ✅ JSON            | ✅ `DC_LOAD_V1_16Q`       | ✅ Envelope    | ✅ Full         | 4 traces         | 🟢 Complete       |
| hotel         | ✅ JSON            | ✅ `HOTEL_LOAD_V1_16Q`    | ✅ Envelope    | ✅ Full         | 5 traces         | 🟢 Complete       |
| car_wash      | ✅ JSON            | ✅ `CAR_WASH_LOAD_V1_16Q` | ✅ Envelope    | ✅ Full         | 5 traces         | 🟢 Complete       |
| ev_charging   | ❌ No template     | ✅ `EV_CHARGING_V1`       | ✅ Envelope    | ⚠️ Adapter-only | 2 traces         | 🟡 Needs template |
| hospital      | ❌ No template     | ✅ `HOSPITAL_V1`          | ✅ Envelope    | ⚠️ Adapter-only | 2 traces         | 🟡 Needs template |
| manufacturing | ❌ No template     | ✅ `MANUFACTURING_V1`     | ✅ Envelope    | ⚠️ Adapter-only | 2 traces         | 🟡 Needs template |
| office        | ❌ No template     | ✅ `OFFICE_V1`            | ❌ No envelope | ❌ None         | 0 traces         | 🔴 Needs all      |
| retail        | ❌ No template     | ✅ `RETAIL_V1`            | ❌ No envelope | ❌ None         | 0 traces         | 🔴 Needs all      |
| warehouse     | ❌ No template     | ✅ `WAREHOUSE_V1`         | ❌ No envelope | ❌ None         | 0 traces         | 🔴 Needs all      |
| restaurant    | ❌ No template     | ✅ `RESTAURANT_V1`        | ❌ No envelope | ❌ None         | 0 traces         | 🔴 Needs all      |
| gas_station   | ❌ No template     | ✅ `GAS_STATION_V1`       | ❌ No envelope | ❌ None         | 0 traces         | 🔴 Needs all      |
| generic       | ✅ JSON (fallback) | ✅ `GENERIC_V1`           | ❌ No envelope | ❌ None         | 2 fallback tests | 🟡 Needs envelope |

**Coverage: 3/12 complete · 3/12 partial · 6/12 minimal**

---

## 9. Risk Legend

| Icon | Level  | Meaning                                                 |
| ---- | ------ | ------------------------------------------------------- |
| 🔴   | HIGH   | Change here could break wizard or produce wrong numbers |
| 🟡   | MEDIUM | Important but not immediately dangerous                 |
| 🟢   | LOW    | Stable, well-tested, or presentation-only               |
| ⬛   | DEAD   | Not imported/used anywhere. Safe to delete.             |
