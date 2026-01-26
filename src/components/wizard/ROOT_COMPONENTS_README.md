# Wizard Root-Level Support Components

These files in `/wizard/` root provide critical integration and shared functionality for WizardV6.

## ✅ Active Production Components

### Database-Driven Questionnaire System

**CompleteStep3Component.tsx** (1,081 lines)  
- **Purpose:** Database-driven questionnaire renderer for ALL industries
- **Used by:** `Step3Integration.tsx`
- **Renders:** Dynamic questions from `custom_questions` table via `CompleteQuestionRenderer`
- **Features:**
  - Real-time power calculation updates
  - Industry opportunity insights
  - Progress tracking
  - Database-driven, scales to all 21 active use cases

**Step3Integration.tsx** (235 lines)  
- **Purpose:** SSOT enforcement layer between WizardV6 and Step 3
- **Used by:** `v6/steps/Step3Details.tsx`
- **Enforces:** No derived fields written to state (e.g., `estimatedAnnualKwh`)
- **Contract:** Only raw user answers flow through, all calculations via TrueQuote™

**CompleteQuestionRenderer.tsx** (611 lines)  
- **Purpose:** Polymorphic question rendering engine
- **Used by:** `CompleteStep3Component.tsx`
- **Renders:** All question types (text, number, select, multi-select, slider, etc.)
- **Features:** Validation, help text, conditional visibility, icons

### Industry & Configuration Components

**IndustryOpportunityPanel.tsx** (437 lines)  
- **Purpose:** Industry-specific insights and opportunity scoring
- **Used by:** `CompleteStep3Component.tsx`
- **Displays:** Peak demand, energy costs, BESS savings potential per industry

**CompleteSolarPreviewCard.tsx** (240 lines)  
- **Purpose:** Solar configuration preview with production estimates
- **Used by:** _Currently orphaned_ (was used in older Step 4, may be integrated into v6 Step 4)
- **Features:** PVWatts integration, solar sizing logic

### Visual & UX Components

**CarWash16QVisuals.tsx**  
- **Purpose:** Car wash-specific confidence badges and warnings
- **Used by:** _May be integrated into Step 3 for car wash vertical_
- **Exports:** `ConfidenceBadge`, `ServiceUtilizationWarning`

**QuestionIconMap.tsx**  
- **Purpose:** Icon mapping for question field names
- **Used by:** `v6/step3/inputs/index.tsx`
- **Maps:** Field names (e.g., `bayTunnelCount`) → emoji icons

**ProgressSidebar.tsx**  
- **Purpose:** Simple progress sidebar component
- **Status:** _Orphaned_ - WizardV6 has its own progress UI
- **Candidate for:** Removal or integration into v6/layout/

### Helper Scripts

**carWashIntegration.ts** (143 lines)  
- **Purpose:** Maps WizardV6 state to car wash 16Q calculation inputs
- **Exports:**
  - `mapAnswersToCarWash16QInput()`
  - `calculateCarWashMetrics()`
  - `extractPowerMetrics()`
  - `extractBESSRecommendations()`

## File Dependencies

```
v6/steps/Step3Details.tsx
    ↓
Step3Integration.tsx (SSOT enforcement)
    ↓
CompleteStep3Component.tsx (DB-driven questionnaire)
    ├── CompleteQuestionRenderer.tsx (polymorphic inputs)
    └── IndustryOpportunityPanel.tsx (insights)

v6/step3/inputs/index.tsx
    ↓
QuestionIconMap.tsx (icon mapping)
```

## Cleanup Recommendations

### Move to v6/

These files are v6-specific and should live in `v6/components/`:
- `CompleteStep3Component.tsx` → `v6/components/CompleteStep3Component.tsx`
- `Step3Integration.tsx` → `v6/components/Step3Integration.tsx`
- `CompleteQuestionRenderer.tsx` → `v6/components/CompleteQuestionRenderer.tsx`
- `IndustryOpportunityPanel.tsx` → `v6/components/IndustryOpportunityPanel.tsx`
- `QuestionIconMap.tsx` → `v6/components/QuestionIconMap.tsx`
- `carWashIntegration.ts` → `v6/utils/carWashIntegration.ts`

### Evaluate & Integrate

- `CompleteSolarPreviewCard.tsx` - Integrate into v6 Step 4 or archive
- `CarWash16QVisuals.tsx` - Integrate into v6 Step 3 for car wash or archive
- `ProgressSidebar.tsx` - Remove (v6 has its own progress UI)

---

**Last Updated:** January 21, 2026  
**Status:** These files are production-critical for WizardV6
