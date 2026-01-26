# Wizard Architecture - January 2026

## Current Production Wizard: WizardV6

**Active Implementation:** `/src/components/wizard/v6/WizardV6.tsx`  
**Routes:** `/wizard` and `/wizard-v6`  
**Status:** ✅ Production (as of Dec 28, 2025)

### Architecture Overview

```
wizard/
├── v6/                           ✅ ACTIVE - Production wizard
│   ├── WizardV6.tsx             Main orchestrator (2,674 lines)
│   ├── types.ts                 State types, constants, confidence model
│   ├── constants.ts             Wizard configuration
│   ├── steps/                   Step components
│   │   ├── Step1AdvisorLed.tsx  ✅ Advisor-led location/industry (Jan 19, 2026)
│   │   ├── EnhancedStep2Industry.tsx
│   │   ├── Step3Details.tsx     ✅ Database-driven questionnaire
│   │   ├── Step4Options.tsx     
│   │   ├── Step5MagicFit.tsx    
│   │   └── Step6Quote.tsx       
│   ├── advisor/                 MerlinAdvisor rail system
│   │   ├── AdvisorRail.tsx      
│   │   ├── AdvisorPublisher.tsx 
│   │   ├── PowerGaugeWidget.tsx 
│   │   └── ...
│   ├── micro-prompts/           Micro-interaction components
│   ├── inputs/                  Form inputs
│   ├── layout/                  Layout components
│   ├── shared/                  Shared v6 components
│   ├── step3/                   Step 3 utilities
│   └── utils/                   Utility functions
│
├── shared/                       ✅ Shared across wizard versions
│   └── WizardBottomAdvisor.tsx  Bottom advisor component
│
├── steps/                        ⚠️ Legacy - mostly deprecated
│   └── EnhancedLocationStep.v2.tsx  (Replaced by Step1AdvisorLed)
│
├── _archive-jan-2026/            ❌ DEPRECATED - Reference only
│   ├── README.md                Explains why files were deprecated
│   └── Step3HotelEnergy.tsx     Old industry-specific component
│
└── [Root TSX files]              ⚠️ Integration/support components
    ├── CompleteStep3Component.tsx      Database-driven Step 3
    ├── CompleteQuestionRenderer.tsx    Question rendering logic
    ├── Step3Integration.tsx            Step 3 SSOT enforcement
    ├── IndustryOpportunityPanel.tsx    Industry insights
    ├── CompleteSolarPreviewCard.tsx    Solar configuration
    ├── CarWash16QVisuals.tsx          Car wash specific visuals
    ├── QuestionIconMap.tsx            Question icon mapping
    ├── ProgressSidebar.tsx            Progress tracking
    └── carWashIntegration.ts          Car wash data mapping
```

## Key Integration Points

### WizardV6 is Used By:
1. **Main App Router** (`/App.tsx`) - Routes `/wizard` and `/wizard-v6`
2. **Vertical Landing Pages:**
   - `CarWashEnergy.tsx` - Can launch wizard
   - `EVChargingEnergy.tsx` - Can launch wizard
   - `HotelEnergy.tsx` - Can launch wizard
3. **Modal System** (`ModalManager.tsx`) - Opens wizard in modal context

### WizardV6 Integrates With:

**TrueQuote™ Services:**
- `truequote.ts` - `computeTrueQuoteSizing()` for BESS sizing
- `siteScoreCalculator.ts` - Site Score™ calculation
- `intelligence.ts` - Adaptive UX intelligence layer

**Data Services:**
- `bufferService.ts` - State persistence across steps
- Database via `Step3Details` → `Step3Integration` → `CompleteStep3Component`

**SSOT Calculation Flow:**
```
WizardV6 → Step3Details → Step3Integration → CompleteStep3Component
                                           ↓
                                   Database custom_questions
                                           ↓
                                   useCasePowerCalculations.ts
                                           ↓
                                   QuoteEngine.generateQuote()
```

## Recent Changes (Jan 2026)

### Jan 21, 2026: TrueQuote™ Phase 5
- Integrated `computeTrueQuoteSizing()` for sizing recommendations
- Added confidence modeling with `calculateModelConfidence()`

### Jan 19, 2026: Advisor-Led Step 1
- Replaced old location step with `Step1AdvisorLed.tsx`
- 2-panel design: Conversational advisor + form panel

### Jan 18, 2026: Intelligence Layer
- Added adaptive UX via `intelligence.ts` service
- Integrated Site Score™ calculator

### Jan 16, 2026: MerlinAdvisor Rail
- Added `AdvisorRail.tsx` and `AdvisorPublisher.tsx`
- Context-aware advisor system

## Deprecated Components

See [_archive-jan-2026/README.md](./_archive-jan-2026/README.md) for details on:
- `Step3HotelEnergy.tsx` - Replaced by unified `Step3Details.tsx`
- Old location steps - Replaced by `Step1AdvisorLed.tsx`

## File Naming Conventions

- `WizardV6.tsx` - Main orchestrator
- `Step{N}{Name}.tsx` - Step components
- `{Feature}Prompt.tsx` - Micro-prompts in micro-prompts/
- `{Feature}Widget.tsx` - Advisor widgets in advisor/
- `Complete{Feature}.tsx` - Database-driven integration components

## Do NOT Modify Without Review

These files are critical to production wizard:
- `WizardV6.tsx` - Main orchestrator
- `types.ts` - State management contract
- `Step3Details.tsx` - Questionnaire integration
- `Step3Integration.tsx` - SSOT enforcement
- `CompleteStep3Component.tsx` - Database-driven questions

## Future Cleanup Opportunities

1. **Root TSX Files**: Some may be candidates for moving into `v6/components/`
2. **Legacy steps/**: `EnhancedLocationStep.v2.tsx` could move to _archive-jan-2026/
3. **Consolidate**: Consider moving all v6-specific support files into `v6/` directory

---

**Last Updated:** January 21, 2026  
**Active Wizard:** WizardV6 (v6/WizardV6.tsx)  
**Primary Route:** `/wizard`
