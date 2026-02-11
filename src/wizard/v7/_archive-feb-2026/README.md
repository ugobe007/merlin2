# Archived V7 Files (Feb 2026)

## WizardV7Page.orphan.DO_NOT_IMPORT.tsx

**Archived:** Feb 11, 2026
**Original path:** `src/wizard/v7/WizardV7Page.tsx`
**Reason:** Orphaned duplicate of `src/pages/WizardV7Page.tsx`

### History
- Created during initial V7 development as a co-located page component
- A `src/pages/WizardV7Page.tsx` was later created for the router convention
- The original was never cleaned up and continued to drift
- Feb 7, 2026: Marked for deletion in BUGFIX_SUMMARY_FEB7.md but was recreated by a subsequent agent
- Feb 11, 2026: Finally archived

### Problems it caused
1. **Duplicate `stepCanProceed()` function** — conflicted with the canonical one in `useWizardV7.ts`
2. **Duplicate `getPhase()` function** — only existed here, not used by production
3. **Stale prop wiring** — passed `setStep3Answers` (typo) instead of `setStep3Answer`, used `Step4MagicFitV7` which production doesn't render
4. **Pre-existing TS errors** — `canNext` used before declaration, masking real issues
5. **Confusing for AI agents** — agents would edit the wrong file

### Production file
`src/pages/WizardV7Page.tsx` — imported by `App.tsx`, `ModalRenderer`, `VerticalLandingPage`

**DO NOT IMPORT FROM THIS DIRECTORY.**

---

## WizardV7Page_BROKEN.tsx.bak

**Archived:** Feb 11, 2026
**Original path:** `src/pages/WizardV7Page_BROKEN.tsx.bak`
**Reason:** Old broken backup (392 lines) with stale imports (`WizardShellV7` from wrong path, `merlin-theme.css` that may not exist). No consumers — was never imported.
