# Recommended Improvements - January 2026

Based on deep analysis of Merlin's architecture, here are prioritized improvements:

---

## ✅ COMPLETED THIS SESSION

| Item | Status | Files Changed |
|------|--------|---------------|
| Dead code → `_deprecated/` | ✅ Done | useTrueQuote.ts, TrueQuoteEngine.ts, Step3HotelEnergy.tsx |
| Fix deprecated imports | ✅ Done | trueQuoteMapper.ts (inlined TrueQuoteInput type) |
| Step 4 preview SSOT service | ✅ Done | Created step4PreviewService.ts |
| Runtime SSOT validation | ✅ Done | Created ssotValidation.ts |
| Typed industry inputs | ✅ Done | Created industryInputTypes.ts |
| Updated diagnostic scripts | ✅ Done | wizard-diagnostic.js, wizard-debug-dataflow.js |
| Updated documentation | ✅ Done | 4 docs updated for nested structure |

---

## 🔴 HIGH PRIORITY - Should Do Soon

### 1. **Consolidate TRUEQUOTE_CONSTANTS**

**Problem:** Constants are duplicated in multiple places:
- `src/services/_deprecated/TrueQuoteEngine.ts` - `TRUEQUOTE_CONSTANTS`
- `src/services/data/constants.ts` - `DEFAULTS`
- Some hardcoded values scattered in calculators

**Recommendation:**
```typescript
// Create single source: src/services/data/constants.ts
export const TRUEQUOTE_CONSTANTS = {
  // Migrate all from TrueQuoteEngine.ts
};

// Then update all imports to use this file
```

**Files to update:** ~8-10 files reference the old constants

---

### 2. **Remove QuoteEngine.ts (Legacy)**

**Location:** `src/core/calculations/QuoteEngine.ts`

**Problem:** Pre-Porsche 911 calculator, likely dead code but still present.

**Action:** 
1. Check for imports: `grep -r "from.*QuoteEngine" src/`
2. If unused, move to `_deprecated/`
3. If used, refactor callers to use TrueQuoteEngineV2

---

### 3. **Clean Up Test Files for Deprecated Code**

**Files referencing deprecated TrueQuoteEngine:**
- `tests/validation/TrueQuoteEngineAllIndustries.test.ts`
- `tests/validation/TrueQuoteValidation.test.ts`
- `src/tests/trueQuoteDataFlowTest.ts`

**Action:** Update tests to use TrueQuoteEngineV2 or mark as integration tests for legacy support.

---

### 4. **Step 4 Options → Use step4PreviewService**

**Current:** Step4Options.tsx has inline preview calculations
**Created:** `src/services/step4PreviewService.ts`

**Action:** Update Step4Options.tsx to import and use:
```typescript
import { calculateSolarPreview, calculateEvPreview } from '@/services/step4PreviewService';
```

---

## 🟡 MEDIUM PRIORITY - Nice to Have

### 5. **Add SSOT Validation to Key Components**

**Created:** `useSSOTValidation` hook in ssotValidation.ts

**Action:** Add to critical components:
```typescript
// In Step6Quote.tsx, WizardV6.tsx, etc.
import { useSSOTValidation } from '@/utils/ssotValidation';

useSSOTValidation(state.calculations, 'Step6Quote');
```

This will catch any future regressions where flat structure is accidentally used.

---

### 6. **Type the useCaseData.inputs in WizardState**

**Created:** `industryInputTypes.ts` with all industry types

**Action:** Update WizardState type:
```typescript
// In src/components/wizard/v6/types.ts
import type { IndustryInputs } from '@/types/industryInputTypes';

interface UseCaseData {
  inputs?: IndustryInputs;
  // ...
}
```

---

### 7. **Clean Up Documentation Folder**

**Current state:** 50+ markdown files in `docs/`, many are outdated audit logs.

**Recommendation:**
```
docs/
├── architecture/           # TRUEQUOTE_ARCHITECTURE_DIAGRAM.md, PORSCHE_911.md
├── audits/                 # Historical audit reports (archive)
├── guides/                 # Developer guides, setup docs
└── CHANGELOG.md            # Consolidated changes
```

---

### 8. **Add Pre-commit Hook for SSOT Validation**

**Action:** Create `.husky/pre-commit`:
```bash
#!/bin/sh
# Check for flat calculations access patterns
if grep -r "calculations\.bessKW" src/ --include="*.tsx" | grep -v "selected\." | grep -v "_deprecated"; then
  echo "❌ SSOT Violation: Use calculations.selected.bessKW, not calculations.bessKW"
  exit 1
fi
```

---

## 🟢 LOW PRIORITY - Future Improvements

### 9. **ValueTicker Component Optimization**

**Current:** ValueTicker reads from multiple state paths
**Improvement:** Create a `useValueTickerData` hook that centralizes data extraction

---

### 10. **Industry Profile Service Consolidation**

**Current:** Industry profiles spread across:
- `industryQuestionnaires.ts`
- `industryConfigs.ts` 
- `trueQuoteMapperConfig.ts`
- Database `use_cases` table

**Future:** Single `industryProfileService.ts` that:
- Loads from database on init
- Caches in memory
- Provides unified API

---

### 11. **Error Boundary for Wizard Steps**

**Add:** React error boundaries around each wizard step to prevent full wizard crash if one step has a calculation error.

---

### 12. **Storybook for Wizard Components**

**Future:** Add Storybook stories for:
- Step components in isolation
- TrueQuote badge variants
- Power level cards
- Quote results display

---

## 📊 Technical Debt Summary

| Category | Items | Effort |
|----------|-------|--------|
| Dead code cleanup | 3 files moved | ✅ Done |
| Duplicate constants | ~10 files | 2-3 hours |
| Legacy test updates | 3 test files | 1-2 hours |
| Type improvements | 2-3 files | 1 hour |
| Doc reorganization | 50+ files | 4-6 hours |

---

## 🎯 Recommended Next Steps (In Order)

1. **Consolidate TRUEQUOTE_CONSTANTS** → Single source of truth
2. **Wire up step4PreviewService** → Replace inline calculations in Step4Options
3. **Add useSSOTValidation** to Step6Quote and WizardV6
4. **Update legacy tests** to use TrueQuoteEngineV2
5. **Set up pre-commit hook** for SSOT pattern enforcement

---

*Generated: January 13, 2026*
