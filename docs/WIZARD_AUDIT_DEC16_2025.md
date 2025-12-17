# 🔍 WIZARD SYSTEM AUDIT - December 16, 2025

**CRITICAL**: This audit identifies the current state of the wizard system, including dead code, duplicate files, and architectural issues.

---

## 📊 EXECUTIVE SUMMARY

| Metric | Count | Concern Level |
|--------|-------|---------------|
| Total wizard .tsx files | **60** | 🔴 HIGH - Too many |
| Deprecated files still present | **8** | 🔴 HIGH - Should delete |
| Duplicate section files | **4** | 🔴 HIGH |
| SmartWizard references | **17 files** | 🔴 HIGH - Dead code |
| Files imported but never used | **3** | 🔴 HIGH |
| Line count of main wizard | **1,601** | 🟡 Goal was ~350 |

---

## ✅ WHAT IS ACTUALLY WORKING

The production flow uses **StreamlinedWizard.tsx** exclusively:

```
ENTRY POINTS:
├── merlin2.fly.dev/           → BessQuoteBuilder → StreamlinedWizard
├── merlin2.fly.dev/wizard     → StreamlinedWizard (direct)
├── merlin2.fly.dev/hotel      → HotelEnergy → StreamlinedWizard(hotel)
├── merlin2.fly.dev/car-wash   → CarWashEnergy → StreamlinedWizard(car-wash)
└── merlin2.fly.dev/ev-charging→ EVChargingEnergy → StreamlinedWizard(ev-charging)

WORKING SECTIONS:
[0] WelcomeLocationSection  → ✅ Working (state selection, rates)
[1] IndustrySection         → ✅ Working (30+ use case tiles)
[2] FacilityDetailsSection  → ✅ Working (database custom questions)
[3] GoalsSection            → ✅ Working (EV, Solar, Wind, Generator, Grid)
[4] ScenarioSection         → ✅ Working (Magic Fit 3 cards)
[5] ScenarioSectionV2       → ✅ Working (Two-column fine-tune)
[6] QuoteResultsSection     → ✅ Working (Final quote + exports)

WORKING MODALS:
├── AcceptCustomizeModal    → ✅ Critical (Accept/Customize choice)
├── ScenarioExplainerModal  → ✅ Explains Magic Fit
├── ConfigurationConfirmModal→ ✅ Confirm before quote
└── LeadCaptureModal        → ✅ Lead capture
```

---

## 🗺️ CURRENT FILE STRUCTURE

```
src/components/wizard/
├── StreamlinedWizard.tsx         # ✅ MAIN ENTRY POINT (1,601 lines)
│
├── sections/                      # Section components
│   ├── WelcomeLocationSection.tsx # ✅ ACTIVE (Section 0)
│   ├── IndustrySection.tsx        # ✅ ACTIVE (Section 1)
│   ├── FacilityDetailsSection.tsx # ✅ ACTIVE (Section 2)
│   ├── GoalsSection.tsx           # ✅ ACTIVE (Section 3) - 1,413 lines
│   ├── ScenarioSection.tsx        # ✅ ACTIVE (Section 4) - Magic Fit
│   ├── ScenarioSectionV2.tsx      # 🔴 DUPLICATE? Two-column
│   ├── ConfigurationSection.tsx   # 🔴 NOT USED in flow
│   ├── ConfigurationSectionV2.tsx # 🔴 NOT USED in flow
│   ├── QuoteResultsSection.tsx    # 🔴 OLD VERSION (789 lines)
│   ├── QuoteResultsSectionNew.tsx # ✅ ACTIVE via index.ts (890 lines)
│   ├── ScenarioComparison.tsx     # ✅ Used in sections
│   ├── MerlinRecommendationPanel.tsx # ✅ Used in GoalsSection
│   └── index.ts                   # Exports (aliased QuoteResultsSectionNew)
│
├── hooks/
│   ├── useStreamlinedWizard.ts    # ✅ MAIN HOOK (1,402 lines)
│   └── index.ts
│
├── constants/
│   ├── wizardConstants.ts         # ✅ Shared constants
│   └── index.ts
│
├── types/
│   ├── wizardTypes.ts             # ✅ Type definitions
│   └── index.ts
│
├── modals/
│   ├── ScenarioExplainerModal.tsx # ✅ Used
│   ├── ConfigurationConfirmModal.tsx # ✅ Used
│   ├── StepTransitionModal.tsx    # ⚠️ Check if used
│   └── SolarSizingModal.tsx       # ⚠️ Check if used
│
├── shared/
│   ├── AcceptCustomizeModal.tsx   # ✅ Critical modal
│   ├── WizardModeSelector.tsx     # ⚠️ Check if used
│   ├── WizardPowerProfile.tsx     # ⚠️ Check if used
│   └── WizardStepHelp.tsx         # ⚠️ Check if used
│
├── guided-flow/
│   ├── MerlinWizardModal.tsx      # 🔴 32KB - Separate modal wizard
│   └── index.ts
│
├── indicators/                    # Power indicators
│   ├── PowerGapIndicator.tsx
│   ├── PowerStatusCard.tsx
│   ├── SolarOpportunityIndicator.tsx
│   └── EnergyOpportunityBadge.tsx
│
├── navigation/
│   ├── WizardProgress.tsx
│   ├── WizardNavButtons.tsx
│   └── WizardTabs.tsx
│
├── _deprecated/                   # ⚠️ Should be DELETED
│   ├── SmartWizardModal.tsx       # OLD
│   ├── SmartWizardUseCases.tsx    # OLD
│   └── StreamlinedWizard.legacy.tsx # 267KB backup
│
├── steps_v3/                      # 🔴 EMPTY except 1 file
│   └── modules/
│       └── PowerCalculations.ts   # ⚠️ Is this used?
│
├── layout/                        # Layout components
├── widgets/                       # Widget components
│
├── PowerProfileTracker.tsx        # ✅ Used in sidebar
├── PowerGapIndicator.tsx          # 🔴 DUPLICATE of indicators/
├── PowerProfileIndicator.tsx      # ⚠️ Check if used
├── PowerGapVisualization.tsx      # ⚠️ Check if used
├── PowerProfileBadge.tsx          # ⚠️ Check if used
├── AIRecommendationPanel.tsx      # ⚠️ Check if used
├── AIStatusIndicator.tsx          # ⚠️ Check if used
├── AISquareFootageCalculator.tsx  # ⚠️ Check if used
├── AIWizardModal.tsx              # ⚠️ Check if used
├── InteractiveConfigDashboard.tsx # 🔴 NOT USED
├── LeadCaptureModal.tsx           # ✅ Used for lead capture
├── VirtualQuoteViewer.tsx         # ⚠️ Check if used
├── SimpleVirtualQuoteViewer.tsx   # ⚠️ Check if used
├── QuestionRenderer.tsx           # ✅ Used in FacilityDetails
├── AdvancedQuoteBuilderLanding.tsx # ✅ Used for Pro mode
├── InstallerDirectoryModal.tsx    # ⚠️ Check if used
├── IncentivesGuideModal.tsx       # ⚠️ Check if used
├── QuoteCompletePage.tsx          # ⚠️ Check if used
├── CalculationTransparency.tsx    # ⚠️ Check if used
├── WizardFooter.tsx               # ⚠️ Check if used
└── SmartWizardErrorBoundary.tsx   # ✅ Error boundary
```

---

## 🔴 CRITICAL ISSUES

### Issue 1: TWO QuoteResultsSection Files
```
sections/QuoteResultsSection.tsx     → 789 lines (OLD)
sections/QuoteResultsSectionNew.tsx  → 890 lines (NEW, exported via index.ts)
```

**Problem**: `index.ts` aliases `QuoteResultsSectionNew` as `QuoteResultsSection`, but the old file still exists and could be accidentally imported.

**Fix**: Delete `QuoteResultsSection.tsx` (the old one).

---

### Issue 2: THREE Configuration Sections
```
sections/ConfigurationSection.tsx    → 1,052 lines
sections/ConfigurationSectionV2.tsx  → 653 lines
sections/ScenarioSectionV2.tsx       → 537 lines (also has sliders)
```

**Problem**: ConfigurationSection is imported but NOT rendered in the main flow. Only ScenarioSection and ScenarioSectionV2 are used.

**Fix**: Determine which is needed and delete the others.

---

### Issue 3: MerlinWizardModal (32KB) - Separate System
```
guided-flow/MerlinWizardModal.tsx → 32,158 bytes
```

**Status**: This is a SEPARATE modal-based wizard only used in ConfigurationSection (which isn't used).

**Fix**: If not needed, delete the entire `guided-flow/` directory.

---

### Issue 4: SmartWizard References (17 files still reference it)
```
src/components/BessQuoteBuilder.tsx
src/components/sections/HeroSection.tsx
src/components/AdvancedQuoteBuilder.tsx
src/components/wizard/AdvancedQuoteBuilderLanding.tsx
src/components/wizard/SmartWizardErrorBoundary.tsx
src/components/wizard/_deprecated/SmartWizardModal.tsx
src/components/wizard/_deprecated/SmartWizardUseCases.tsx
src/components/admin/UseCaseConfigManager.tsx
src/components/modals/RevenueGenerationModal.tsx
src/components/modals/CostSavingsModal.tsx
src/components/modals/ModalRenderer.tsx
src/components/modals/ModalManager.tsx
src/components/modals/SustainabilityModal.tsx
src/components/modals/RealWorldApplicationModal.tsx
src/components/advanced-builder/AdvancedBuilderLanding.tsx
src/components/advanced-builder/ToolCardsGrid.tsx
src/components/examples/UseCaseDatabaseMigrationExample.tsx
```

**Problem**: These may contain dead code or broken references.

---

### Issue 5: Empty/Orphaned Directories
```
steps_v3/           → Only has 1 file in modules/
steps_v3/modules/PowerCalculations.ts → Is this used?
```

---

## 🔵 CURRENT WORKING FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        StreamlinedWizard.tsx                                │
│                         (Entry Point)                                        │
│                                                                             │
│  Imports: useStreamlinedWizard (hook for ALL state management)              │
│                                                                             │
│  Sections Array:                                                            │
│    [0] WelcomeLocationSection  → State dropdown, electricity rates          │
│    [1] IndustrySection         → 30+ use case tiles                         │
│    [2] FacilityDetailsSection  → Custom questions from database             │
│    [3] GoalsSection            → EV, Solar, Wind, Generator, Grid           │
│    [4] ScenarioSection         → Magic Fit 3 cards (Savings/Balanced/Resilient)
│    [5] ScenarioSectionV2       → Two-column (if user chose Customize)       │
│    [6] QuoteResultsSection     → Final quote with export options            │
│                                                                             │
│  Modal Flow:                                                                │
│    Section 3 → Click Continue → advanceToSection(4)                         │
│    Section 4 → Select card → AcceptCustomizeModal appears                   │
│    Modal → Accept → advanceToSection(6)                                     │
│    Modal → Customize → advanceToSection(5)                                  │
│    Section 5 → Continue → advanceToSection(6)                               │
│                                                                             │
│  Step Labels (Fixed Dec 16, 2025):                                          │
│    Section 1: "Step 1 of 5"                                                 │
│    Section 2: "Step 2 of 5"                                                 │
│    Section 3: "Step 3 of 5 • Configure Add-ons"                             │
│    Section 4: "Step 4 of 5" (Magic Fit)                                     │
│    Section 5: "Step 4 of 5 • Fine-tune" (same step, sub-option)             │
│    Section 6: "Step 5 of 5 • Final Quote"                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 FILES TO DELETE (Recommended)

### High Priority - Dead Code:
1. `sections/QuoteResultsSection.tsx` (old version)
2. `sections/ConfigurationSection.tsx` (not in flow)
3. `sections/ConfigurationSectionV2.tsx` (not in flow)
4. `guided-flow/` directory (MerlinWizardModal not used)
5. `_deprecated/` directory (SmartWizard files)
6. `steps_v3/` directory (orphaned)
7. `PowerGapIndicator.tsx` (duplicate of indicators/)

### Medium Priority - Check Usage:
1. `InteractiveConfigDashboard.tsx`
2. `AIWizardModal.tsx`
3. `VirtualQuoteViewer.tsx`
4. `SimpleVirtualQuoteViewer.tsx`
5. `PowerProfileIndicator.tsx`
6. `PowerProfileBadge.tsx`
7. `PowerGapVisualization.tsx`

---

## 🧹 RECOMMENDED CLEANUP ACTIONS

### Phase 1: Delete Obviously Dead Code
```bash
# Delete deprecated directory
rm -rf src/components/wizard/_deprecated/

# Delete orphaned steps_v3
rm -rf src/components/wizard/steps_v3/

# Delete duplicate PowerGapIndicator
rm src/components/wizard/PowerGapIndicator.tsx

# Delete old QuoteResultsSection
rm src/components/wizard/sections/QuoteResultsSection.tsx

# Delete unused ConfigurationSection files
rm src/components/wizard/sections/ConfigurationSection.tsx
rm src/components/wizard/sections/ConfigurationSectionV2.tsx

# Delete MerlinWizardModal if not needed
rm -rf src/components/wizard/guided-flow/
```

### Phase 2: Clean SmartWizard References
- Update files that reference SmartWizard to use StreamlinedWizard
- Or remove dead code paths

### Phase 3: Consolidate Remaining Files
- Move isolated files into appropriate subdirectories
- Update imports

---

## ✅ WHAT IS WORKING

| Component | Status | Notes |
|-----------|--------|-------|
| Location selection | ✅ Working | Section 0 |
| Industry selection | ✅ Working | Section 1, 30+ tiles |
| Custom questions | ✅ Working | Database-driven |
| EV/Solar/Wind/Generator config | ✅ Working | In GoalsSection |
| Magic Fit 3 cards | ✅ Working | Section 4 |
| AcceptCustomizeModal | ✅ Working | Accept/Customize choice |
| Two-column comparison | ✅ Working | Section 5 |
| Final quote | ✅ Working | Section 6 |
| PDF/Excel export | ✅ Working | In QuoteResultsSection |
| Lead capture | ✅ Working | LeadCaptureModal |

---

## ⚠️ KNOWN ISSUES

1. **GoalsSection is 1,413 lines** - Too large, should be split
2. **Hook is 1,402 lines** - Too large, should be split
3. **Step labels were confusing** - Fixed Dec 16, 2025
4. **EV chargers in wrong section?** - User complained, may need UX review

---

## 📋 NEXT STEPS

1. **Approve this audit** - Confirm which files to delete
2. **Run cleanup script** - Delete dead code
3. **Test wizard flow** - Verify nothing broke
4. **Split large files** - GoalsSection, useStreamlinedWizard
5. **Document final architecture** - Update ARCHITECTURE.md

---

**Audit performed by**: GitHub Copilot  
**Date**: December 16, 2025  
**Files analyzed**: 60 .tsx files in wizard/
