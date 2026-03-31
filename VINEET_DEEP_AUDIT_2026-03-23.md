# Merlin Deep Audit (Vineet Review)

Date: 2026-03-23
Scope: Wizard V8 + core quote logic + known Vineet feedback themes

## 0) Where your IP file is

Your IP file exists at [IP_DISCLOSURE.md](IP_DISCLOSURE.md).

---

## 1) Audit method

- Code review of Wizard V8 flow in:
  - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
  - [src/wizard/v8/wizardState.ts](src/wizard/v8/wizardState.ts)
  - [src/wizard/v8/step4Logic.ts](src/wizard/v8/step4Logic.ts)
  - [src/wizard/v8/WizardV8Page.tsx](src/wizard/v8/WizardV8Page.tsx)
  - [src/wizard/v8/steps/Step1V8.tsx](src/wizard/v8/steps/Step1V8.tsx)
  - [src/wizard/v8/steps/Step3V8.tsx](src/wizard/v8/steps/Step3V8.tsx)
  - [src/wizard/v8/steps/Step3_5V8.tsx](src/wizard/v8/steps/Step3_5V8.tsx)
  - [src/wizard/v8/steps/Step4V8.tsx](src/wizard/v8/steps/Step4V8.tsx)
  - [src/wizard/v8/steps/Step5V8.tsx](src/wizard/v8/steps/Step5V8.tsx)
- Feedback baselines reviewed:
  - [VINEET_FEEDBACK_JAN3.md](VINEET_FEEDBACK_JAN3.md)
  - [VINEET_FEATURES_PLAN.md](VINEET_FEATURES_PLAN.md)
  - [EXECUTIVE_SUMMARY_FOR_VINEET.md](EXECUTIVE_SUMMARY_FOR_VINEET.md)
- Static checks run:
  - Typecheck: pass
  - Wizard V8 tests: 3 files passed, 115 tests passed, 7 skipped
  - Focused lint: warnings only (no hard errors)

---

## 2) Executive status (today)

- Critical logic path for solar auto-skip is fixed in [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts).
- Tier synthesis and pricing pipeline is coherent and test-backed in [src/wizard/v8/step4Logic.ts](src/wizard/v8/step4Logic.ts).
- Main high-risk issues now are:
  1. hardcoded Google API keys,
  2. lingering hook-dependency lint warnings,
  3. UX parity gaps vs Vineet’s January checklist (some still open).

---

## 3) Security / compliance findings

### High risk (must fix)

1. Hardcoded Google API key in front-end:
   - [src/wizard/v8/steps/Step1V8.tsx](src/wizard/v8/steps/Step1V8.tsx)
2. Hardcoded Google API key in service:
   - [src/services/geocodingService.ts](src/services/geocodingService.ts)

Impact: key leakage, quota abuse, billing risk, policy risk.

### Medium risk

3. Excessive runtime logging in production paths:
   - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
   - [src/wizard/v8/step4Logic.ts](src/wizard/v8/step4Logic.ts)
   - [src/wizard/v8/steps/Step4V8.tsx](src/wizard/v8/steps/Step4V8.tsx)
   - [src/wizard/v8/steps/Step5V8.tsx](src/wizard/v8/steps/Step5V8.tsx)

---

## 4) Logic integrity findings

### Confirmed good

1. Single-state-bus architecture is consistent:
   - [src/wizard/v8/wizardState.ts](src/wizard/v8/wizardState.ts)
2. Auto-skip + metadata dispatch path now present:
   - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
3. Solar physical gate + sun feasibility gate enforced:
   - [src/wizard/v8/step4Logic.ts](src/wizard/v8/step4Logic.ts)
4. Tier rebuild invalidation key includes addon + intel dimensions:
   - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
5. Step 3.5 addon selections persist into tier build path:
   - [src/wizard/v8/WizardV8Page.tsx](src/wizard/v8/WizardV8Page.tsx)

### Needs hardening

6. Hook dependency hygiene warnings (can hide stale closure bugs):
   - [src/wizard/v8/WizardV8Page.tsx](src/wizard/v8/WizardV8Page.tsx)
   - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
7. Unused suppression comments and minor dead vars:
   - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
   - [src/wizard/v8/utils/buildV8ExportData.ts](src/wizard/v8/utils/buildV8ExportData.ts)

---

## 5) Vineet checklist reconciliation (deep status map)

### Priority 1 (Critical)

1. Zip validation (`9999`/`8888` style guard): **PARTIAL**
   - Length/format check exists in [src/wizard/v8/steps/Step1V8.tsx](src/wizard/v8/steps/Step1V8.tsx)
   - Explicit blocked-zip policy is not present.
2. Home button functionality: **UNKNOWN / likely shell-level**
   - No explicit home button in V8 step component files.
3. Remove Start Over button: **OPEN (still present)**
   - Start-over fixed button exists in [src/wizard/v8/WizardV8Page.tsx](src/wizard/v8/WizardV8Page.tsx)
4. International countries/cities database: **PARTIAL-RESOLVED**
   - Country list + flow exists in [src/wizard/v8/steps/Step1V8.tsx](src/wizard/v8/steps/Step1V8.tsx)
   - Full city DB is not in code (country-first approach).
5. Step 3 icon mapping issues: **PARTIAL**
   - New addon icons in Step 3.5 look consistent in [src/wizard/v8/steps/Step3_5V8.tsx](src/wizard/v8/steps/Step3_5V8.tsx)
   - Original Step 3 icon mismatch report may have targeted old V6/V7 visuals.
6. Exterior loads not affecting calc: **UNVERIFIED in this pass**
   - Step 3 schema-driven answers pass through to calc path; needs targeted fixture test.
7. Solar sizing not changing with room size: **RESOLVED**
   - Reactive area-driven update exists in [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
   - Tier logic consumes `solarPhysicalCapKW` in [src/wizard/v8/step4Logic.ts](src/wizard/v8/step4Logic.ts)
8. Generator YES/NO flow: **RESOLVED**
   - Explicit toggle + scope path in [src/wizard/v8/steps/Step3_5V8.tsx](src/wizard/v8/steps/Step3_5V8.tsx)
9. Generator size mismatch Step4 vs Quote: **POTENTIAL / needs regression test**
   - Display and calculation paths are separate components; should add snapshot test pair.
10. Coverage always 100%: **PARTIAL**

- No hardcoded 100% found in tier logic, but explicit coverage metric display appears absent in V8 step files.

11. Back resets EV charger to 0: **IMPROVED but needs explicit test**

- Persistence logic exists in [src/wizard/v8/WizardV8Page.tsx](src/wizard/v8/WizardV8Page.tsx)

12. State credits (CA/MA) not showing: **OPEN**

- Step5 currently shows Federal ITC prominently in [src/wizard/v8/steps/Step5V8.tsx](src/wizard/v8/steps/Step5V8.tsx)

### Priority 2 (UX)

- Several UX asks are partially addressed (improved cards, flows).
- Still open from Vineet list:
  - explicit state credit line item,
  - some sizing/wording consistency in Step 3,
  - slider range/units parity asks,
  - stronger completion gating in some branches.

### Priority 3 (Enhanced)

- Right-side cost panel style asks: **PARTIAL**
- Sticky top bar: **UNVERIFIED in this pass**
- Dynamic coverage metric with changing selections: **PARTIAL/OPEN**

---

## 6) Test and quality evidence

- Typecheck: pass
- Wizard V8 tests: pass
  - 3 test files, 115 passing tests, 7 skipped
  - file set under [src/wizard/v8/**tests**](src/wizard/v8/__tests__)
- Lint warnings remain in:
  - [src/wizard/v8/WizardV8Page.tsx](src/wizard/v8/WizardV8Page.tsx)
  - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
  - [src/wizard/v8/utils/buildV8ExportData.ts](src/wizard/v8/utils/buildV8ExportData.ts)

---

## 7) Recommended next sprint (highest ROI)

1. Security pass (immediate)
   - Remove hardcoded API keys and enforce env-only access.
2. Reliability pass
   - Resolve hook dependency warnings and remove stale eslint disables.
3. Vineet parity pass
   - Add blocked-zip policy and state-credit line items.
   - Add generator-size and EV-persistence regression tests.
4. Product polish
   - Add explicit dynamic coverage metric UI (if required by sales narrative).

---

## 8) Conclusion

The core Wizard V8 architecture is strong and materially improved. The major remaining gaps are now concentrated in security hygiene, lint discipline, and a few high-visibility UX parity items from Vineet’s original checklist.

# Merlin Deep Audit (Vineet Review)

Date: 2026-03-23
Scope: Wizard V8 + core quote logic + known Vineet feedback themes

## 0) Where your IP file is

Your IP file exists at [IP_DISCLOSURE.md](IP_DISCLOSURE.md).

---

## 1) Audit method

- Code review of Wizard V8 flow in:
  - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
  - [src/wizard/v8/wizardState.ts](src/wizard/v8/wizardState.ts)
  - [src/wizard/v8/step4Logic.ts](src/wizard/v8/step4Logic.ts)
  - [src/wizard/v8/WizardV8Page.tsx](src/wizard/v8/WizardV8Page.tsx)
  - [src/wizard/v8/steps/Step1V8.tsx](src/wizard/v8/steps/Step1V8.tsx)
  - [src/wizard/v8/steps/Step3V8.tsx](src/wizard/v8/steps/Step3V8.tsx)
  - [src/wizard/v8/steps/Step3_5V8.tsx](src/wizard/v8/steps/Step3_5V8.tsx)
  - [src/wizard/v8/steps/Step4V8.tsx](src/wizard/v8/steps/Step4V8.tsx)
  - [src/wizard/v8/steps/Step5V8.tsx](src/wizard/v8/steps/Step5V8.tsx)
- Feedback baselines reviewed:
  - [VINEET_FEEDBACK_JAN3.md](VINEET_FEEDBACK_JAN3.md)
  - [VINEET_FEATURES_PLAN.md](VINEET_FEATURES_PLAN.md)
  - [EXECUTIVE_SUMMARY_FOR_VINEET.md](EXECUTIVE_SUMMARY_FOR_VINEET.md)
- Static checks run:
  - Typecheck: pass
  - Wizard V8 tests: 3 files passed, 115 tests passed, 7 skipped
  - Focused lint: warnings only (no hard errors)

---

## 2) Executive status (today)

- Critical logic path for solar auto-skip is fixed in [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts).
- Tier synthesis and pricing pipeline is coherent and test-backed in [src/wizard/v8/step4Logic.ts](src/wizard/v8/step4Logic.ts).
- Main high-risk issues now are:
  1. hardcoded Google API keys,
  2. lingering hook-dependency lint warnings,
  3. UX parity gaps vs Vineet’s January checklist (some still open).

---

## 3) Security / compliance findings

### High risk (must fix)

1. Hardcoded Google API key in front-end:
   - [src/wizard/v8/steps/Step1V8.tsx](src/wizard/v8/steps/Step1V8.tsx)
2. Hardcoded Google API key in service:
   - [src/services/geocodingService.ts](src/services/geocodingService.ts)

Impact: key leakage, quota abuse, billing risk, policy risk.

### Medium risk

3. Excessive runtime logging in production paths:
   - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
   - [src/wizard/v8/step4Logic.ts](src/wizard/v8/step4Logic.ts)
   - [src/wizard/v8/steps/Step4V8.tsx](src/wizard/v8/steps/Step4V8.tsx)
   - [src/wizard/v8/steps/Step5V8.tsx](src/wizard/v8/steps/Step5V8.tsx)

---

## 4) Logic integrity findings

### Confirmed good

1. Single-state-bus architecture is consistent:
   - [src/wizard/v8/wizardState.ts](src/wizard/v8/wizardState.ts)
2. Auto-skip + metadata dispatch path now present:
   - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
3. Solar physical gate + sun feasibility gate enforced:
   - [src/wizard/v8/step4Logic.ts](src/wizard/v8/step4Logic.ts)
4. Tier rebuild invalidation key includes addon + intel dimensions:
   - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
5. Step 3.5 addon selections persist into tier build path:
   - [src/wizard/v8/WizardV8Page.tsx](src/wizard/v8/WizardV8Page.tsx)

### Needs hardening

6. Hook dependency hygiene warnings (can hide stale closure bugs):
   - [src/wizard/v8/WizardV8Page.tsx](src/wizard/v8/WizardV8Page.tsx)
   - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
7. Unused suppression comments and minor dead vars:
   - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
   - [src/wizard/v8/utils/buildV8ExportData.ts](src/wizard/v8/utils/buildV8ExportData.ts)

---

## 5) Vineet checklist reconciliation (deep status map)

## Priority 1 (Critical)

1. Zip validation (`9999`/`8888` style guard): **PARTIAL**
   - Length/format check exists in [src/wizard/v8/steps/Step1V8.tsx](src/wizard/v8/steps/Step1V8.tsx)
   - Explicit blocked-zip policy is not present.
2. Home button functionality: **UNKNOWN / likely shell-level**
   - No explicit home button in V8 step component files.
3. Remove Start Over button: **OPEN (still present)**
   - Start-over fixed button exists in [src/wizard/v8/WizardV8Page.tsx](src/wizard/v8/WizardV8Page.tsx)
4. International countries/cities database: **PARTIAL-RESOLVED**
   - Country list + flow exists in [src/wizard/v8/steps/Step1V8.tsx](src/wizard/v8/steps/Step1V8.tsx)
   - Full city DB is not in code (country-first approach).
5. Step 3 icon mapping issues: **PARTIAL**
   - New addon icons in Step 3.5 look consistent in [src/wizard/v8/steps/Step3_5V8.tsx](src/wizard/v8/steps/Step3_5V8.tsx)
   - Original Step 3 icon mismatch report may have targeted old V6/V7 visuals.
6. Exterior loads not affecting calc: **UNVERIFIED in this pass**
   - Step 3 schema-driven answers pass through to calc path; needs targeted fixture test.
7. Solar sizing not changing with room size: **RESOLVED**
   - Reactive area-driven update exists in [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
   - Tier logic consumes `solarPhysicalCapKW` in [src/wizard/v8/step4Logic.ts](src/wizard/v8/step4Logic.ts)
8. Generator YES/NO flow: **RESOLVED**
   - Explicit toggle + scope path in [src/wizard/v8/steps/Step3_5V8.tsx](src/wizard/v8/steps/Step3_5V8.tsx)
9. Generator size mismatch Step4 vs Quote: **POTENTIAL / needs regression test**
   - Display and calculation paths are separate components; should add snapshot test pair.
10. Coverage always 100%: **PARTIAL**

- No hardcoded 100% found in tier logic, but explicit coverage metric display appears absent in V8 step files.

11. Back resets EV charger to 0: **IMPROVED but needs explicit test**

- Persistence logic exists in [src/wizard/v8/WizardV8Page.tsx](src/wizard/v8/WizardV8Page.tsx)

12. State credits (CA/MA) not showing: **OPEN**

- Step5 currently shows Federal ITC prominently in [src/wizard/v8/steps/Step5V8.tsx](src/wizard/v8/steps/Step5V8.tsx)

## Priority 2 (UX)

- Several UX asks are partially addressed (improved cards, flows).
- Still open from Vineet list:
  - explicit state credit line item,
  - some sizing/wording consistency in Step 3,
  - slider range/units parity asks,
  - stronger completion gating in some branches.

## Priority 3 (Enhanced)

- Right-side cost panel style asks: **PARTIAL**
- Sticky top bar: **UNVERIFIED in this pass**
- Dynamic coverage metric with changing selections: **PARTIAL/OPEN**

---

## 6) Test and quality evidence

- Typecheck: pass
- Wizard V8 tests: pass
  - 3 test files, 115 passing tests, 7 skipped
  - file set under [src/wizard/v8/**tests**](src/wizard/v8/__tests__)
- Lint warnings remain in:
  - [src/wizard/v8/WizardV8Page.tsx](src/wizard/v8/WizardV8Page.tsx)
  - [src/wizard/v8/useWizardV8.ts](src/wizard/v8/useWizardV8.ts)
  - [src/wizard/v8/utils/buildV8ExportData.ts](src/wizard/v8/utils/buildV8ExportData.ts)

---

## 7) Recommended next sprint (highest ROI)

1. Security pass (immediate)
   - Remove hardcoded API keys and enforce env-only access.
2. Reliability pass
   - Resolve hook dependency warnings and remove stale eslint disables.
3. Vineet parity pass
   - Add blocked-zip policy and state-credit line items.
   - Add generator-size and EV-persistence regression tests.
4. Product polish
   - Add explicit dynamic coverage metric UI (if required by sales narrative).

---

## 8) Conclusion

The core Wizard V8 architecture is strong and materially improved. The major remaining gaps are now concentrated in security hygiene, lint discipline, and a few high-visibility UX parity items from Vineet’s original checklist.
