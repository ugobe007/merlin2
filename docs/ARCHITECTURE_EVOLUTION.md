# Merlin Architecture Evolution

## Version Codenames

| Version | Codename | Date | Key Changes |
|---------|----------|------|-------------|
| v1.0 | **Porsche 911** | Dec 2025 | SSOT calculator architecture, TrueQuote Engine V2 |
| v1.1 | **Porsche 911 Targa** | Jan 14, 2026 | Conversational flow, dynamic questionnaire depth |

---

## 🏎️ Porsche 911 (v1.0) - December 2025

### Core Philosophy
"Like a Porsche 911 - pure engineering, no bloat, every component serves a purpose."

### Architecture Diagram
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            WIZARDV6 (UI Layer)                               │
│   Step 1-6 flow → collects user inputs → produces WizardState                │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    MERLIN ORCHESTRATOR (General Contractor)                  │
│   - Translates WizardState → MerlinRequest                                   │
│   - Routes to TrueQuote Engine                                               │
│   - Returns authenticated results                                            │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      TRUEQUOTE ENGINE V2 (Prime Sub)                         │
│   - Runs all calculators in sequence                                         │
│   - Delegates option generation to MagicFit                                  │
│   - Authenticates every quote with TrueQuote™ badge                          │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              ▼                            ▼                            ▼
     ┌────────────────┐         ┌────────────────┐           ┌────────────────┐
     │ loadCalculator │         │ bessCalculator │           │ solarCalculator│
     │ (Peak Demand)  │         │ (Battery Size) │           │ (PV Sizing)    │
     └────────────────┘         └────────────────┘           └────────────────┘
              │                            │                            │
              └────────────────────────────┼────────────────────────────┘
                                           ▼
                              ┌────────────────────────┐
                              │    MAGIC FIT           │
                              │ (Generate 3 Options)   │
                              └────────────────────────┘
```

### Key Components
| Component | File | Purpose |
|-----------|------|---------|
| MerlinOrchestrator | `services/MerlinOrchestrator.ts` | General contractor - routes requests |
| TrueQuoteEngineV2 | `services/TrueQuoteEngineV2.ts` | SSOT for all quote calculations |
| MagicFit | `services/MagicFit.ts` | Generates Starter/Professional/Enterprise options |
| Calculators | `services/calculators/*.ts` | Domain-specific calculation modules |
| Contracts | `services/contracts.ts` | Type definitions and validators |

### SSOT Rules (Still in Effect)
1. **ALL quotes** flow through `generateQuote()` → MerlinOrchestrator → TrueQuoteEngineV2
2. **NO calculations** in UI components - only raw input collection
3. **Step 5** is the ONLY step that calls `generateQuote()`
4. **TrueQuote™ badge** authenticates every quote result

---

## 🏎️ Porsche 911 Targa (v1.1) - January 14, 2026

### What Changed
The Targa variant keeps the core Porsche 911 engine but adds:
- **Removable roof panel** = Dynamic questionnaire depth (show fewer/more questions)
- **Improved airflow** = Conversational flow with Merlin advisor guidance
- **Better visibility** = Real-time savings preview before quote generation

### New Architecture Layers
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         WIZARDV6 - TARGA ENHANCEMENTS                        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ STEP 1: Location + Industry Selection                                  │ │
│  │  ├── SavingsPreviewPanel (ESTIMATE only, isEstimate=true)              │ │
│  │  │    └── Uses INDUSTRY_AVERAGES, NOT TrueQuote                        │ │
│  │  └── Shows potential savings range before Step 5                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ STEP 2: Industry + Business Size Selection                             │ │
│  │  ├── Industry tiles (existing)                                         │ │
│  │  ├── Sub-industry selection (NEW)                                      │ │
│  │  └── BusinessSizePanel (NEW) → Sets questionnaireDepth                 │ │
│  │       ├── micro/small   → 'minimal' depth (8-10 questions)             │ │
│  │       ├── medium        → 'standard' depth (14-16 questions)           │ │
│  │       └── large/enterprise → 'detailed' depth (20-24 questions)        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ STEP 3: Questionnaire (NOW DYNAMIC)                                    │ │
│  │  ├── Questions filtered by question_tier (essential/standard/detailed) │ │
│  │  ├── shouldShowByDepth() determines visibility                         │ │
│  │  └── Still enforces assertNoDerivedFieldsInStep3() contract            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ STEPS 4-6: UNCHANGED                                                   │ │
│  │  └── Still uses Porsche 911 core engine (MerlinOrchestrator → SSOT)    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### New Database Schema
```sql
-- 1. Sub-industries (e.g., "hotel" → "Boutique Hotel", "Extended Stay")
sub_industries (
  id, use_case_id, name, slug, icon, typical_size_range, 
  default_business_size_tier, sort_order
)

-- 2. Business size tiers (determines questionnaire depth)
business_size_tiers (
  id, use_case_id, tier_code, tier_name, size_min, size_max,
  questionnaire_depth, typical_annual_energy_kwh
)

-- 3. Question tiers (already existed, now actively used)
custom_questions.question_tier = 'essential' | 'standard' | 'detailed'
```

### New Components
| Component | File | Purpose |
|-----------|------|---------|
| SavingsPreviewPanel | `v6/components/SavingsPreviewPanel.tsx` | Shows ESTIMATE savings in Step 1 |
| BusinessSizePanel | `v6/components/BusinessSizePanel.tsx` | Selects size → sets questionnaire depth |
| subIndustryService | `services/subIndustryService.ts` | Fetches sub-industries from DB |

### Questionnaire Depth Logic
```typescript
// In CompleteStep3Component.tsx
function shouldShowByDepth(
  questionTier: 'essential' | 'standard' | 'detailed',
  questionnaireDepth: 'minimal' | 'standard' | 'detailed'
): boolean {
  if (questionTier === 'essential') return true;  // Always shown
  if (questionTier === 'standard') return questionnaireDepth !== 'minimal';
  if (questionTier === 'detailed') return questionnaireDepth === 'detailed';
  return true;
}
```

### SSOT Compliance (Unchanged!)
The Targa variant does NOT modify the core calculation engine:

| Concern | Porsche 911 | Porsche 911 Targa | Status |
|---------|-------------|-------------------|--------|
| Quote calculations | TrueQuoteEngineV2 | TrueQuoteEngineV2 | ✅ Same |
| Entry point | generateQuote() | generateQuote() | ✅ Same |
| Financial metrics | centralizedCalculations | centralizedCalculations | ✅ Same |
| Equipment pricing | equipmentCalculations | equipmentCalculations | ✅ Same |
| Step 5 = only calculation point | Yes | Yes | ✅ Same |

**SavingsPreviewPanel explicitly marks all values as `isEstimate: true`** - these are NOT TrueQuote values.

---

## Migration Summary

### Files Added (Targa)
```
src/
├── components/wizard/v6/components/
│   ├── BusinessSizePanel.tsx          # NEW
│   └── SavingsPreviewPanel.tsx        # NEW
├── services/
│   └── subIndustryService.ts          # NEW
└── types/
    └── index.ts (updated)             # Added BusinessSizeTier, SubIndustry

database/migrations/
├── 20260114_add_sub_industries.sql    # NEW
├── 20260114_add_business_size_tiers.sql # NEW
└── 20260114_assign_question_tiers.sql # NEW
```

### Files Modified (Targa)
```
src/components/wizard/v6/
├── types/index.ts                     # Added businessSizeTier, questionnaireDepth
├── steps/Step1Location.tsx            # Added SavingsPreviewPanel
├── steps/Step2Industry.tsx            # Added BusinessSizePanel
└── steps/CompleteStep3Component.tsx   # Added shouldShowByDepth filtering
```

### Icon Mappings Added
```
src/components/wizard/QuestionIconMap.tsx
# Added 16+ new option value mappings:
blowers, cold_water, dcfast, level2_only, vfd, no_plans, enhanced,
hrs, days, unsure, sqft, flex_serve, blower_only, multi_pump,
1-2, 3-4, 5-6, 11, 13, 14, 15, 18
```

---

## Version Naming Convention

| Codename | Meaning |
|----------|---------|
| **Porsche 911** | Core architecture - solid, reliable, performance-focused |
| **Porsche 911 Targa** | Same engine + open-top flexibility (dynamic questionnaire) |
| **Porsche 911 Turbo** | (Future) Same core + AI acceleration |
| **Porsche 911 GT3** | (Future) Racing-grade for enterprise/API deployments |

---

## Quick Reference: What Goes Where

| Need To... | Use This | Part of |
|------------|----------|---------|
| Generate a quote | `MerlinOrchestrator.generateQuote()` | Porsche 911 |
| Show estimate savings | `SavingsPreviewPanel` with `isEstimate: true` | Targa |
| Determine questionnaire length | `BusinessSizePanel` → `questionnaireDepth` | Targa |
| Filter questions by depth | `shouldShowByDepth()` in Step 3 | Targa |
| Calculate financial metrics | `centralizedCalculations.ts` | Porsche 911 |
| Look up equipment prices | `equipmentCalculations.ts` | Porsche 911 |
| Validate quote authenticity | `TrueQuoteVerifyBadge` | Porsche 911 |

---

## Future Roadmap

### v1.2 - Porsche 911 Turbo (Planned Q2 2026)
- AI-powered question skipping based on industry patterns
- Predictive defaults from similar businesses
- Smart validation that suggests corrections

### v2.0 - Porsche 911 GT3 (Planned Q4 2026)
- Full API extraction for third-party integrations
- Multi-quote comparison engine
- Enterprise-grade audit logging

---

*Document created: January 14, 2026*
*Last updated: January 14, 2026*
