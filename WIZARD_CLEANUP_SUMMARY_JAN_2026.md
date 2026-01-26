# Wizard File System Cleanup - January 21, 2026

## Summary

Successfully cleaned up and documented the Merlin wizard file system architecture. WizardV6 is confirmed as the production wizard with clear documentation of all components and their relationships.

## Actions Completed

### 1. Architecture Documentation
**Created:** `WIZARD_ARCHITECTURE.md` in `/src/components/wizard/`
- Documents WizardV6 as current production wizard
- Maps out complete directory structure
- Explains v6/ as active production code
- Documents integration points with App.tsx and vertical landing pages
- Lists recent updates (Jan 16-21, 2026)

### 2. Deprecated Components Consolidated
**Moved to `_archive-jan-2026/`:**
- `EnhancedLocationStep.v2.tsx` (replaced by Step1AdvisorLed.tsx on Jan 19, 2026)
- Already archived: `Step3HotelEnergy.tsx` (replaced by unified Step3Details.tsx)

**Updated:** `_archive-jan-2026/README.md`
- Explains why each component was deprecated
- Documents what replaced them
- Provides migration guidance

**Removed:**
- Empty `steps/` directory (no longer needed)

### 3. Root-Level Components Documented
**Created:** `ROOT_COMPONENTS_README.md` in `/src/components/wizard/`
- Documents all root-level TSX files
- Explains purpose and usage of each component
- Maps component dependencies
- Identifies orphaned components (ProgressSidebar, CompleteSolarPreviewCard)
- Provides cleanup recommendations

**Key Root Components:**
- ✅ `Step3Integration.tsx` - SSOT enforcement layer
- ✅ `CompleteStep3Component.tsx` - Database-driven questionnaire
- ✅ `CompleteQuestionRenderer.tsx` - Polymorphic question renderer
- ✅ `IndustryOpportunityPanel.tsx` - Industry insights
- ✅ `QuestionIconMap.tsx` - Icon mapping
- ⚠️ `ProgressSidebar.tsx` - Orphaned (v6 has own progress UI)
- ⚠️ `CompleteSolarPreviewCard.tsx` - May need integration

### 4. Copilot Instructions Updated
**Updated:** `.github/copilot-instructions.md`
- Added comprehensive "WIZARDV6 ARCHITECTURE" section
- Documented WizardV6 as production wizard (Dec 28, 2025)
- Explained relationship to StreamlinedWizard (alternative/experimental)
- Mapped integration flow for Step 3 questionnaire
- Listed recent updates (Jan 16-21, 2026)
- Added comparison table: WizardV6 vs StreamlinedWizard
- Cross-referenced new documentation files

## File Structure (After Cleanup)

```
wizard/
├── WIZARD_ARCHITECTURE.md       ✅ NEW - Main architecture doc
├── ROOT_COMPONENTS_README.md    ✅ NEW - Root component guide
│
├── v6/                          ✅ PRODUCTION - WizardV6
│   ├── WizardV6.tsx            Main orchestrator (2,674 lines)
│   ├── steps/                  6 step components
│   ├── advisor/                MerlinAdvisor rail system
│   ├── micro-prompts/          Micro-interactions
│   ├── inputs/                 Form inputs
│   ├── layout/                 Layout components
│   └── utils/                  Utilities
│
├── shared/                      ✅ SHARED - Cross-wizard components
│   └── WizardBottomAdvisor.tsx
│
├── _archive-jan-2026/           ❌ DEPRECATED - Reference only
│   ├── README.md               ✅ UPDATED - Explains deprecations
│   ├── Step3HotelEnergy.tsx    (Archived earlier)
│   └── EnhancedLocationStep.v2.tsx  ✅ MOVED - Archived today
│
└── [Root TSX files]             ⚠️ INTEGRATION - Support components
    ├── CompleteStep3Component.tsx
    ├── CompleteQuestionRenderer.tsx
    ├── Step3Integration.tsx
    ├── IndustryOpportunityPanel.tsx
    ├── CompleteSolarPreviewCard.tsx
    ├── CarWash16QVisuals.tsx
    ├── QuestionIconMap.tsx
    ├── ProgressSidebar.tsx     (Orphaned - candidate for removal)
    └── carWashIntegration.ts
```

## Key Findings

### WizardV6 is Production
- **Active since:** December 28, 2025
- **Routes:** `/wizard` and `/wizard-v6`
- **Used by:** App.tsx, ModalManager.tsx, 3 vertical landing pages
- **Recent enhancements:** Advisor rail (Jan 16), Intelligence layer (Jan 18), Advisor-led Step 1 (Jan 19), TrueQuote™ Phase 5 (Jan 21)

### StreamlinedWizard Status
- Documented as "refactored from 4,677→280 lines" in Dec 2025
- NOT currently routed in App.tsx
- May be experimental/alternative implementation
- Kept for reference but WizardV6 is production

### Step 3 Integration Chain
```
WizardV6 → Step3Details → Step3Integration → CompleteStep3Component
                                           ↓
                                   Database custom_questions
```
This chain ensures SSOT compliance and database-driven questionnaires for all 21 active use cases.

## Recommendations for Future Cleanup

### Phase 2 (Optional)
1. **Move integration components into v6/**
   - `CompleteStep3Component.tsx` → `v6/components/`
   - `Step3Integration.tsx` → `v6/components/`
   - `CompleteQuestionRenderer.tsx` → `v6/components/`
   - `IndustryOpportunityPanel.tsx` → `v6/components/`
   - `QuestionIconMap.tsx` → `v6/components/`

2. **Evaluate orphaned components:**
   - `ProgressSidebar.tsx` - Remove (v6 has own progress UI)
   - `CompleteSolarPreviewCard.tsx` - Integrate into Step 4 or archive
   - `CarWash16QVisuals.tsx` - Integrate into Step 3 or archive

3. **Helper scripts:**
   - `carWashIntegration.ts` → `v6/utils/carWashIntegration.ts`

## Documentation Created

1. **WIZARD_ARCHITECTURE.md** - Main architecture reference
2. **ROOT_COMPONENTS_README.md** - Root component documentation
3. **Updated .github/copilot-instructions.md** - AI agent guidance
4. **Updated _archive-jan-2026/README.md** - Deprecation explanations
5. **This file** - Cleanup summary

## Benefits

✅ **Clear Production Path** - WizardV6 is unambiguously the production wizard  
✅ **Organized Deprecation** - Old components archived with explanations  
✅ **Documented Integration** - Step 3 flow is clearly mapped  
✅ **AI Agent Support** - Copilot instructions reflect current architecture  
✅ **Future-Ready** - Cleanup recommendations for Phase 2  

---

**Cleanup Date:** January 21, 2026  
**Production Wizard:** WizardV6 (v6/WizardV6.tsx)  
**Status:** ✅ Complete
