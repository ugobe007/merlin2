# EDIT RULES - Vineet Feature Implementation
## Date: January 4, 2026

Before ANY code change, verify:

## Rule 1: SSOT Compliance
- [ ] All constants come from `src/services/data/constants.ts` or database
- [ ] No hardcoded values that should be configurable
- [ ] Check Meta page (/meta) shows correct source
- [ ] Use `getConstant()` for DB values, fallback to constants.ts

## Rule 2: TrueQuote Policy
- [ ] All calculations flow through TrueQuoteEngineV2 or modular calculators
- [ ] No duplicate calculation logic
- [ ] Results must be verifiable via TrueQuoteVerifyBadge
- [ ] Financial calculations use `calculateFinancials()` from financialCalculator.ts

## Rule 3: Wizard Logic Integrity
- [ ] State flows correctly: Step1 → Step2 → Step3 → Step4 → Step5 → Step6
- [ ] `wizardState` updates propagate to all dependent components
- [ ] No breaking changes to WizardContext or useWizard hook
- [ ] Navigation guards remain intact

## Rule 4: No Orphaned/Garbage Code
- [ ] Remove old code when replacing functionality
- [ ] No commented-out blocks left behind
- [ ] Unused imports removed
- [ ] No duplicate function definitions

## Rule 5: Database Schema Integrity
- [ ] No direct DB writes without checking schema
- [ ] New fields added via migrations
- [ ] Foreign key relationships preserved
- [ ] RLS policies maintained

## Pre-Edit Checklist
1. [ ] Read current file completely
2. [ ] Identify what state/props are used
3. [ ] Check calculator imports
4. [ ] Verify SSOT sources
5. [ ] Plan minimal changes

## Post-Edit Checklist
1. [ ] npm run typecheck passes
2. [ ] Test wizard flow manually
3. [ ] Check /meta page still works
4. [ ] Verify calculations unchanged (unless intentional)
5. [ ] Git commit with clear message
