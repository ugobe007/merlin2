# Merlin Production Readiness Roadmap: 62 → 100/100

**Baseline:** Run #3 = 62/100 (after today's 4 bug fixes, Run #4 estimated ~67/100)
**Target:** 100/100 ✅ APPROVED FOR DEPLOY
**Gap remaining:** 38 points across 8 categories

---

## Score Gap Summary

| Category               | Now | Target | Gap     | Effort |
| ---------------------- | --- | ------ | ------- | ------ |
| A. Logic & Calculation | 12  | 25     | **+13** | High   |
| B. TrueQuote Workflow  | 16  | 20     | **+4**  | Low    |
| C. ProQuote            | 8   | 15     | **+7**  | Medium |
| D. Industry Coverage   | 5   | 10     | **+5**  | Medium |
| E. UI/UX Quality       | 7   | 10     | **+3**  | Low    |
| F. Design System       | 4   | 5      | **+1**  | Low    |
| H. Mobile              | 3   | 5      | **+2**  | Low    |
| I. Performance         | 2   | 3      | **+1**  | Low    |

---

## Phase 1 — Quick Wins (~3 hrs · +11 pts)

_No architecture changes. All are surgical 1–20 line fixes._

### 1.1 F4: Title Case bug (+1 pt)

**File:** `src/wizard/v8/steps/Step5V8.tsx`  
**Fix:** Quote heading renders `"hotel Energy System"` (lowercase h).  
Search for the heading string and apply `.industry?.charAt(0).toUpperCase() + ...` or use `toTitleCase()` helper.

### 1.2 E8: TrueQuote Badge Routing (+1 pt)

**File:** `src/wizard/v8/steps/Step5V8.tsx` (and/or `WizardV8Page.tsx`)  
**Bug:** Clicking the TrueQuote™ badge opens the Deep Dive financial modal instead of the Data Sources modal.  
**Fix:** Separate `showFinancialModal` (Deep Dive button) from `showDataSourcesModal` (TrueQuote badge). Badge click → data sources overlay with NREL/EIA/StoreFAST citations.

### 1.3 A5.5 + A5: Three-Tier Restoration (+3 pts)

**File:** `src/wizard/v8/steps/Step4V8.tsx`  
**Context:** `step4Logic.ts::buildTiers()` already produces **3 tiers** (Starter / Recommended / Complete) with full financial models. Step4V8 intentionally hides the Starter tier at line ~577 (`// Hide STARTER`) and relabels the remaining 2 as "BEST VALUE" / "MAX POWER".  
**Fix:**

1. Remove the Starter-hiding filter (line ~577) so all 3 cards render
2. Replace the hardcoded `name: "BEST VALUE"` and `name: "MAX POWER"` display labels with `tier.label` (which is already "Starter" / "Recommended" / "Complete" from the engine)
3. Update `actions.selectTier(1)` default pre-select to `actions.selectTier(1)` (Recommended = index 1)
4. Style the 3 cards: Starter = slate, Recommended = emerald (BEST VALUE badge), Complete = purple

### 1.4 H2.2 + H3.1: Mobile polish (+2 pts)

**Files:**

- Measure nav arrows in wizard at 375px — if < 44px, add `min-w-[44px] min-h-[44px]` to arrow buttons (check `Step1V8.tsx`, `Step2V8.tsx` prev/next buttons)
- TrueQuote financial modal: add `max-h-[95vh] overflow-y-auto` guard at 375px so it doesn't overflow on mobile

### 1.5 E5: MagicFit Click Stability (+1 pt)

**File:** `src/wizard/v8/steps/Step4V8.tsx` or `Step3_5V8.tsx`  
**Bug:** "Build My Tiers" / "See your quote" required force-click during browser testing.  
**Fix:** Identify the button's disabled guard condition — likely waiting on `isBuilding` state that doesn't always reset. Add a timeout fallback: if `isBuilding` is true for > 8s, force-reset it.

### 1.6 I2: ProQuote sub-3s load (+1 pt)

**Files:** `src/components/ProQuote/` — heaviest: `QuotePreviewModal.tsx` (958 lines), `LandingView.tsx` (915 lines), `ProfessionalModelView.tsx` (872 lines)  
**Fix:** The Bank Model tab and Export modal are already used lazily. The 3s is primarily `professionalFinancialModel.ts` (1182 lines) being parsed synchronously. Options:

- Lazy-import `ProfessionalModelView` inside the ProQuote page (tab-switch triggered)
- Add `/* @vite-ignore */` dynamic import for the financial model service
- Move the bank model calculation to a web worker (bigger refactor)
  **Quick win:** Wrap `ProfessionalModelView` in a local `lazy()` inside `ProQuoteConfigurationPage.tsx` — only loads when "Bank Model" tab is clicked.

### 1.7 C3.3: ProQuote NPV Consistency (+2 pts)

**Bug:** Bank Model shows NPV -$0.34M; main ProQuote panel shows NPV $0.1M. Same session, same inputs.  
**Root cause:** Main panel NPV uses `professionalFinancialModel.calculateNPV()` with one set of cash flows; Bank Model tab uses a separate NPV function with different debt service deductions.  
**Fix:** The Bank Model NPV should display **levered NPV** (after debt service) while the main panel shows **unlevered NPV** (before debt) — these should be LABELED differently, not shown as the same metric. Add "(Levered)" and "(Unlevered)" labels to distinguish them rather than making them equal.

---

## Phase 2 — SSOT Violations · A1 (4-6 hrs · +5 pts)

_17 violations across 9 industries. Pattern: wizard state uses field name X but the SSOT audit script expects field name Y._

### Violation Map

| Industry        | Missing Fields                                 | Fix                                                                                                   |
| --------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| car-wash        | `bayCount`, `tunnelCount`                      | Alias in calculator input mapping: `bayCount: state.carWashBays ?? state.bayCount ?? state.bays ?? 8` |
| data-center     | `rackCount`, `itLoadKW`                        | Alias in DC calculator: `rackCount: state.serverRacks ?? state.racks ?? state.rackCount ?? 50`        |
| ev-charging     | `level2Count`, `dcFastCount`, `ultraFastCount` | Map from `state.level2Chargers`, `state.dcfcChargers`, `state.hpcChargers` (already in state)         |
| apartment       | `unitCount`                                    | Alias: `unitCount: state.units ?? state.apartmentUnits ?? state.numUnits ?? 100`                      |
| office          | `buildingSqFt`                                 | Alias: `buildingSqFt: state.squareFootage ?? state.officeSqFt ?? state.sqft ?? 50000`                 |
| cold-storage    | `storageVolume`                                | Alias: `storageVolume: state.coldStorageSqFt ?? state.warehouseSqFt ?? state.volume ?? 20000`         |
| casino          | `gamingFloorSize`, `gamingFloorSqFt`           | Alias to same value: `gamingFloorSqFt: state.casinoFloorSqFt ?? state.sqft ?? 30000`                  |
| government      | `buildingSqFt`                                 | Same as office alias                                                                                  |
| shopping-center | `totalSqFt`                                    | Alias: `totalSqFt: state.mallSqFt ?? state.retailSqFt ?? state.sqft ?? 200000`                        |

**Approach:** Edit each industry's calculator input adapter (in `src/wizard/v7/step3/adapters/` or the relevant integration file) to accept the field names already present in wizard state. Do NOT change wizard state field names — only add aliases at the calculator boundary.

**After fix:** Re-run `npx vite-node scripts/audit-ssot-truequote-violations.ts` → must show 0 violations.

---

## Phase 3 — Industry Calculator Coverage · D1 (4-6 hrs · +2 pts)

_6 active industries missing dedicated 16Q calculators: manufacturing, retail, restaurant, agriculture, warehouse, college._

**Pattern to follow:** Look at `src/wizard/v7/calculators/hotel16QCalculator.ts` — each calculator exports a `calculate(inputs)` function and a `MANIFEST` entry.

### Calculators to build:

| Industry          | Key load drivers                             | Peak kW estimate                                   |
| ----------------- | -------------------------------------------- | -------------------------------------------------- |
| **manufacturing** | Motor HP, shifts/day, production hours       | `motorHP × 0.746 × shiftsMultiplier × utilization` |
| **retail**        | Store sqft, operating hours, HVAC zone       | `sqft × 15W/sqft × (hours/8760)`                   |
| **restaurant**    | Seats, kitchen equipment kW, operating hours | `(kitchenKW + seatsKW) × peakFactor`               |
| **agriculture**   | Acres, irrigation pump HP, cold storage      | `pumpHP × 0.746 × irrigationHours/day`             |
| **warehouse**     | Sqft, dock doors, refrigeration zone         | `sqft × 8W/sqft + dockDoors × 5kW`                 |
| **college**       | Students, building sqft, labs/day            | `sqft × 20W/sqft × classScheduleFactor`            |

Each calculator: ~80-120 lines. Register each in `src/wizard/v7/calculators/index.ts`.

---

## Phase 4 — Full Industry D2 Validation (2-3 hrs · +3 pts)

_Browser-walk all 17 remaining industries through the full wizard (Steps 0→6) and confirm outputs are non-zero and plausible._

**Efficient approach:** Write a headless Playwright script `scripts/run-all-industry-walks.ts` that:

1. Navigates to `/wizard`
2. Selects "Guided Wizard"
3. Enters ZIP 89101
4. Selects each industry
5. Clicks through with defaults
6. Verifies Step 5 renders a non-zero quote

Industries to cover (17): car-wash, EV charging, data-center, hospital, manufacturing, retail, restaurant, office, agriculture, warehouse, cold-storage, casino, indoor-farm, airport, college, government, shopping-center.

---

## Phase 5 — ProQuote C Category (3-4 hrs · +5 remaining pts)

### C4: Export Downloads (+2 pts)

**File:** `src/components/ProQuote/Export/QuotePreviewModal.tsx`  
**Test:** Click "Export to Excel" and "Export to PDF" buttons — confirm file downloads (not 404/auth error).  
**Fix if broken:** The export endpoints may require a logged-in session. Add a guest export mode that generates a client-side XLSX using `xlsx` package and PDF using `jspdf` — both already imported.

### C5.3: Sensitivity Analysis (+1 pt)

**File:** `src/components/ProQuote/Views/ProfessionalModelView.tsx` + `professionalFinancialModel.ts`  
**Test:** Adjust a slider (e.g. electricity rate) and confirm the 3-statement model updates without re-generating from scratch.  
**Fix:** The sensitivity re-run may be debounced too aggressively. Reduce debounce from ~800ms to 300ms for the sensitivity section only.

---

## Phase 6 — A Category Remaining (2-3 hrs · +5 pts)

### A1 Final Proof (+5 pts — after Phase 2)

Re-run SSOT audit and browser Deep Dive test to confirm ITC and ROI match between Deep Dive and main quote on a fresh Hotel session.

### A2 BESS Sizing All Industries (+2 pts)

Run `npx vite-node scripts/comprehensive-calculation-audit-all-industries.ts` — currently 18/18 pass at ±20%. Confirm they also pass at ±10% (the stricter tolerance). If any fail at ±10%, trace the formula and tighten sizing logic.

### A3.3 Demand Charge Savings (+2 pts)

**File:** `src/wizard/v8/step4Logic.ts` → `calculateAnnualSavings()`  
**Verify:** For a Hotel at $10/kW demand, 585 kW peak, 100% shaving would be $10 × 585 × 12 = $70,200/yr. Confirm the demand savings component is within 20% of that. Log the breakdown.

### A4 Solar Feasibility Gate (+1 pt remaining)

**File:** `src/wizard/v8/step4Logic.ts`  
**Verify:** For a grade-F location (PSH < 3.0), solar kW should return 0 — not just low. Confirm the gate condition `if (sunHoursPerDay < 3.0) return 0` exists and fires.

---

## Phase 7 — B Category Remaining (2 hrs · +4 pts)

### B4.3: Retry on Fail (+1 pt)

**File:** Location fetch in `Step1V8.tsx`  
**Test:** Enter an invalid ZIP (e.g., `00000`), confirm an error message renders with a retry input — not a white screen.

### B5: Back Navigation + Recalculate (+2 pts)

**Test:** From Step 5, click Back → go back to Step 4 → click "Build My Tiers" again → verify new tiers render (not stale).  
**Fix if stale:** `useWizardV8.ts` `goToStep()` should clear `state.tiers` and `state.selectedTierIndex` when going backwards past Step 4.

### B6.7 Deep Dive Full Consistency (+1 pt)

After Phase 2 fixes, re-test Deep Dive ITC, ROI, and NPV all match the main quote values exactly.

---

## Execution Order & Score Trajectory

```
After Phase 1 (Quick Wins)     → ~78/100
After Phase 2 (SSOT)           → ~83/100
After Phase 3 (D1 Calculators) → ~85/100
After Phase 4 (D2 Validation)  → ~88/100
After Phase 5 (ProQuote C)     → ~93/100
After Phase 6 (A remaining)    → ~97/100
After Phase 7 (B remaining)    → ~100/100
```

---

## Files Changed Per Phase

| Phase | Files                                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------------- |
| 1     | `Step5V8.tsx`, `Step4V8.tsx`, `Step3_5V8.tsx`, `ProQuoteConfigurationPage.tsx`, `ProfessionalModelView.tsx` |
| 2     | `src/wizard/v7/step3/adapters/*.ts` (8 files), `step4Logic.ts` aliases                                      |
| 3     | 6 new calculator files in `src/wizard/v7/calculators/` + `index.ts`                                         |
| 4     | New `scripts/run-all-industry-walks.ts`                                                                     |
| 5     | `QuotePreviewModal.tsx`, `ProfessionalModelView.tsx`, `professionalFinancialModel.ts`                       |
| 6     | `step4Logic.ts`, `comprehensive-calculation-audit-all-industries.ts`                                        |
| 7     | `Step1V8.tsx`, `useWizardV8.ts`                                                                             |

---

## Gate Criteria Before Each Run

| Run    | Must Pass                                                                   |
| ------ | --------------------------------------------------------------------------- |
| Run #4 | Today's 4 bug fixes verified in browser                                     |
| Run #5 | Phase 1 + 2 complete; SSOT audit = 0 violations; 3 tiers visible in browser |
| Run #6 | Phase 3 + 4 complete; D1 = 12/12 calculators; D2 = 18/18 industries walk    |
| Run #7 | Phase 5 + 6 + 7 complete; ProQuote exports download; A2 ±10% all pass       |

---

_Roadmap version: 1.0 · Created: 2026-03-29 · Owner: GitHub Copilot_
