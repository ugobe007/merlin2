# Wizard V7 — Canonical Ownership Map

> One concept, one file, one owner. No duplicates. No drift.
> Updated: Feb 11, 2026

| Concept                  | Canonical File                                    | Notes                                         |
|--------------------------|---------------------------------------------------|-----------------------------------------------|
| **Page entry point**     | `src/pages/WizardV7Page.tsx`                      | Imported by App.tsx, ModalRenderer, Verticals  |
| **Runtime + state**      | `src/wizard/v7/hooks/useWizardV7.ts`              | useReducer SSOT, all actions, hydration        |
| **Step gates**           | `src/wizard/v7/gates/wizardStepGates.ts`          | `getGateForStep()` — ONLY gate logic           |
| **Internal proceed**     | `useWizardV7.ts → stepCanProceed()`               | Used by `goToStep()` + `gates` memo only       |
| **Advisor panel**        | `src/components/wizard/v7/shared/V7AdvisorPanel`  | Left rail — NO inline narration elsewhere      |
| **Error boundary**       | `src/components/wizard/v7/shared/WizardErrorBoundary` | Wraps WizardV7Page export                  |
| **Debug panel**          | `src/components/wizard/v7/debug/V7DebugPanel`     | Ctrl+Shift+D — dev only                       |
| **Industry metadata**    | `src/wizard/v7/industryMeta.ts`                   | Icons, labels, slug canonicalization           |
| **Calculator adapters**  | `src/wizard/v7/calculators/registry.ts`           | All industry calculator adapters               |
| **Field name aliases**   | `src/wizard/v7/calculators/ssotInputAliases.ts`   | Adapter → SSOT field translation               |
| **Curated questions**    | `src/wizard/v7/schema/curatedFieldsResolver.ts`   | Step 3 question schemas                        |
| **Templates (JSON)**     | `src/wizard/v7/templates/json/`                   | Per-industry question templates                |
| **Template manifest**    | `src/wizard/v7/templates/template-manifest.ts`    | Test contract definitions                      |
| **Feature flags**        | `src/wizard/v7/featureFlags.ts`                   | V7-specific toggles                            |
| **Step 4 add-ons**       | Wired in `src/pages/WizardV7Page.tsx` ONLY        | `recalculateWithAddOns` prop                   |
| **Power calculations**   | `src/services/useCasePowerCalculations.ts`         | SSOT — all industries                          |

## Rules

1. **Gate logic** lives ONLY in `wizardStepGates.ts` (public API) and `stepCanProceed()` inside `useWizardV7.ts` (internal).
   Never duplicate in page-level files.

2. **Advisor narration** lives ONLY in `V7AdvisorPanel`. No inline JSX narration in page files.

3. **Step wiring** (passing actions to step components) happens ONLY in `src/pages/WizardV7Page.tsx`.
   No second file may wire step props.

4. **Step order** is defined ONCE: `STEP_ORDER` in `src/pages/WizardV7Page.tsx`.
   Never redefine in hooks or step components.

5. **`export default`** for the wizard page exists ONLY in `src/pages/WizardV7Page.tsx`.
   Archived files use `export {}` to prevent accidental import.

## Validation

```bash
bash scripts/check-wizard-entry-point.sh
```

Catches: rogue WizardV7Page files, duplicate gate functions, orphan imports.
