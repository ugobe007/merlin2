# 🏎️ Porsche 911 Targa Architecture

**Version:** 1.1  
**Codename:** Porsche 911 Targa  
**Date:** January 14, 2026  
**Status:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Wizard Flow (6 Steps)](#wizard-flow-6-steps)
4. [SSOT Calculation Pipeline](#ssot-calculation-pipeline)
5. [New Targa Features](#new-targa-features)
6. [Database Schema](#database-schema)
7. [Component Reference](#component-reference)
8. [Code Examples](#code-examples)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### The Porsche 911 Analogy

| Car Part | Merlin Equivalent | Purpose |
|----------|-------------------|---------|
| **Engine** | TrueQuoteEngineV2 | Core calculation power |
| **Transmission** | MerlinOrchestrator | Routes power to wheels |
| **Steering** | WizardV6 | User controls direction |
| **Dashboard** | MerlinBar | Real-time feedback |
| **Targa Top** | Dynamic Questionnaire | Flexible, removable coverage |

### Why "Targa"?

The Targa variant of the 911 has a **removable roof panel** - same powerful engine, but with flexibility:

- **Same core engine** = TrueQuoteEngineV2 (unchanged from v1.0)
- **Removable top** = Questions can be shown/hidden based on business size
- **Better visibility** = Savings preview shown early (before final quote)

---

## Architecture Diagram

### Full System Overview

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                                 USER INTERFACE                                      │
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                           WIZARD V6 (6 Steps)                               │  │
│  │                                                                             │  │
│  │   Step 1         Step 2          Step 3        Step 4      Step 5    Step 6│  │
│  │   Location       Industry        Questions     Options     Generate  Review│  │
│  │   ┌─────┐        ┌─────┐         ┌─────┐       ┌─────┐     ┌─────┐  ┌─────┐│  │
│  │   │State│───────▶│Type │────────▶│Q&A  │──────▶│Solar│────▶│QUOTE│─▶│SHOW ││  │
│  │   │Zip  │        │Size │         │Form │       │EV   │     │     │  │     ││  │
│  │   └─────┘        └─────┘         └─────┘       │Gen  │     └─────┘  └─────┘│  │
│  │      │              │                          └─────┘        │            │  │
│  │      │              │                                         │            │  │
│  │      ▼              ▼                                         │            │  │
│  │  ┌────────┐    ┌────────────┐                                 │            │  │
│  │  │Savings │    │BusinessSize│                                 │            │  │
│  │  │Preview │    │Panel       │                                 │            │  │
│  │  │ESTIMATE│    │(sets depth)│                                 │            │  │
│  │  └────────┘    └────────────┘                                 │            │  │
│  └───────────────────────────────────────────────────────────────┼────────────┘  │
│                                                                   │               │
└───────────────────────────────────────────────────────────────────┼───────────────┘
                                                                    │
                                     ┌──────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER (SSOT)                                    │
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                    MERLIN ORCHESTRATOR                                      │  │
│  │                    (General Contractor)                                     │  │
│  │                                                                             │  │
│  │    WizardState ──▶ MerlinRequest ──▶ TrueQuoteEngineV2 ──▶ Result          │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                              │
│                                     ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                    TRUEQUOTE ENGINE V2                                      │  │
│  │                    (Prime Subcontractor)                                    │  │
│  │                                                                             │  │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │  │
│  │   │   LOAD   │  │   BESS   │  │  SOLAR   │  │GENERATOR │  │    EV    │     │  │
│  │   │Calculator│  │Calculator│  │Calculator│  │Calculator│  │Calculator│     │  │
│  │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │  │
│  │        │             │             │             │             │           │  │
│  │        └─────────────┴─────────────┼─────────────┴─────────────┘           │  │
│  │                                    ▼                                        │  │
│  │                          ┌──────────────────┐                              │  │
│  │                          │    MAGIC FIT     │                              │  │
│  │                          │ (3 Options Gen)  │                              │  │
│  │                          └────────┬─────────┘                              │  │
│  │                                   │                                         │  │
│  │                                   ▼                                         │  │
│  │                          ┌──────────────────┐                              │  │
│  │                          │   FINANCIAL      │                              │  │
│  │                          │   Calculator     │                              │  │
│  │                          │ (NPV, IRR, ROI)  │                              │  │
│  │                          └────────┬─────────┘                              │  │
│  │                                   │                                         │  │
│  │                                   ▼                                         │  │
│  │                          ┌──────────────────┐                              │  │
│  │                          │  PROPOSAL        │                              │  │
│  │                          │  Validator       │                              │  │
│  │                          │ (TrueQuote™)     │                              │  │
│  │                          └──────────────────┘                              │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                            │
│                                                                                    │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│   │ use_cases  │  │  custom_   │  │  pricing_  │  │  utility_  │                 │
│   │            │  │ questions  │  │  configs   │  │   rates    │                 │
│   └────────────┘  └────────────┘  └────────────┘  └────────────┘                 │
│                                                                                    │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐                                 │
│   │    sub_    │  │  business_ │  │  question_ │    ◀── NEW IN TARGA            │
│   │ industries │  │ size_tiers │  │   tiers    │                                 │
│   └────────────┘  └────────────┘  └────────────┘                                 │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Wizard Flow (6 Steps)

### Step-by-Step Breakdown

```
STEP 1: LOCATION                          STEP 2: INDUSTRY
┌─────────────────────────────┐           ┌─────────────────────────────┐
│ • Select US State           │           │ • Select Industry Type      │
│ • Enter ZIP code            │           │ • Select Sub-Industry       │
│ • View utility rate         │           │ • Select Business Size      │
│                             │           │   (micro/small/medium/large)│
│ [NEW] SavingsPreviewPanel   │           │                             │
│ Shows ESTIMATE range        │           │ [NEW] BusinessSizePanel     │
│ ($17K-$111K potential)      │           │ Sets questionnaireDepth     │
└─────────────────────────────┘           └─────────────────────────────┘
            │                                         │
            ▼                                         ▼
STEP 3: QUESTIONNAIRE                     STEP 4: OPTIONS
┌─────────────────────────────┐           ┌─────────────────────────────┐
│ Dynamic question filtering: │           │ • Solar configuration       │
│                             │           │ • EV charger options        │
│ minimal  → 8-10 questions   │           │ • Generator selection       │
│ standard → 14-16 questions  │           │                             │
│ detailed → 20-24 questions  │           │ Preview costs for each      │
│                             │           │ option (not SSOT quotes)    │
│ Questions come from DB      │           │                             │
│ filtered by question_tier   │           │                             │
└─────────────────────────────┘           └─────────────────────────────┘
            │                                         │
            ▼                                         ▼
STEP 5: GENERATE QUOTE (SSOT)             STEP 6: REVIEW & EXPORT
┌─────────────────────────────┐           ┌─────────────────────────────┐
│ *** ONLY SSOT ENTRY POINT ***           │ • Display 3 tier options    │
│                             │           │   (Starter/Pro/Enterprise)  │
│ generateQuote() called      │           │                             │
│       │                     │           │ • TrueQuote™ verified badge │
│       ▼                     │           │                             │
│ MerlinOrchestrator          │           │ • Export: PDF, Word, Excel  │
│       │                     │           │                             │
│       ▼                     │           │ • Save to portfolio         │
│ TrueQuoteEngineV2           │           │                             │
│       │                     │           │ • Request RFQ               │
│       ▼                     │           │                             │
│ Authenticated Result        │           │                             │
└─────────────────────────────┘           └─────────────────────────────┘
```

### State Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         WIZARD STATE                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Location Data          Industry Data         Questionnaire Data     │
│  ─────────────          ─────────────         ──────────────────     │
│  • state: "CA"          • industry: "hotel"   • answers: {...}       │
│  • zipCode: "90210"     • subIndustry: "..."  • peakDemandKW: 450    │
│  • utilityRate: 0.22    • businessSizeTier:   • annualKWh: 1.2M      │
│                           "medium"            • ...                   │
│                         • questionnaireDepth:                        │
│                           "standard"                                 │
│                                                                      │
│  Options Data           Calculations (SSOT)                          │
│  ────────────           ────────────────────                         │
│  • wantsSolar: true     • base: { from TrueQuote }                   │
│  • solarSizeKW: 150     • selected: { chosen tier }                  │
│  • wantsEV: false       • options: [starter, pro, enterprise]        │
│  • wantsGenerator: true • authenticated: true                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## SSOT Calculation Pipeline

### The Golden Rule

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ALL QUOTES MUST FLOW THROUGH:                                      ║
║                                                                      ║
║   generateQuote() → MerlinOrchestrator → TrueQuoteEngineV2           ║
║                                                                      ║
║   NO EXCEPTIONS. NO SHORTCUTS. NO COMPONENT-LEVEL CALCULATIONS.      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Pipeline Steps

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: User clicks "Generate Quote"                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. ORCHESTRATOR VALIDATION                                                  │
│    • Validate WizardState has required fields                               │
│    • Check state, industry, peakDemandKW exist                              │
│    • Return TrueQuoteRejection if invalid                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. BUILD MERLIN REQUEST                                                     │
│    • Map WizardState → MerlinRequest                                        │
│    • Extract industry, location, energy data                                │
│    • Include user preferences (solar, EV, generator)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. LOAD CALCULATOR                                                          │
│    • Calculate peak demand from industry + answers                          │
│    • Apply industry-specific formulas                                       │
│    • Output: { peakDemandKW, annualConsumptionKWh, loadProfile }            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. BESS CALCULATOR                                                          │
│    • Size battery based on peak demand + goals                              │
│    • Apply duration hours (typically 2-4 hours)                             │
│    • Output: { bessKW, bessKWh, bessCapexPerKWh }                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. SOLAR CALCULATOR (if user wants solar)                                   │
│    • Size PV system for offset goals                                        │
│    • Cap by rooftop square footage                                          │
│    • Output: { solarKW, solarCapex, annualProductionKWh }                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. GENERATOR CALCULATOR (if user wants generator)                           │
│    • Size for critical load coverage                                        │
│    • Select fuel type (natural-gas default)                                 │
│    • Output: { generatorKW, generatorCapex, fuelType }                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 7. EV CALCULATOR (if user wants EV chargers)                                │
│    • Size charger infrastructure                                            │
│    • Calculate revenue potential                                            │
│    • Output: { evChargers, evCapex, annualRevenue }                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 8. MAGIC FIT (Option Generation)                                            │
│    • Generate 3 system configurations:                                      │
│      - Starter: Minimum viable (covers 60% peak)                            │
│      - Professional: Balanced (covers 80% peak)                             │
│      - Enterprise: Full coverage (covers 100%+ peak)                        │
│    • Each option is independently priced                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 9. FINANCIAL CALCULATOR                                                     │
│    • Calculate for each option:                                             │
│      - NPV (25-year, 7% discount rate)                                      │
│      - IRR (project internal rate of return)                                │
│      - Simple payback (years)                                               │
│      - ROI (10-year, 25-year)                                               │
│      - Annual savings (demand charge + energy arbitrage)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 10. PROPOSAL VALIDATOR (TrueQuote™ Authentication)                          │
│     • Hash all inputs + outputs                                             │
│     • Generate TrueQuote signature                                          │
│     • Add timestamp + version                                               │
│     • Output: TrueQuoteAuthenticatedResult                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ RESULT: TrueQuoteAuthenticatedResult                                        │
│                                                                             │
│ {                                                                           │
│   authenticated: true,                                                      │
│   signature: "TQ-2026-...",                                                 │
│   timestamp: "2026-01-14T...",                                              │
│   base: { peakDemandKW, bessKW, bessKWh, ... },                             │
│   options: [                                                                │
│     { tier: "starter", capex: 125000, payback: 4.2, ... },                  │
│     { tier: "professional", capex: 185000, payback: 3.8, ... },             │
│     { tier: "enterprise", capex: 275000, payback: 3.5, ... }                │
│   ]                                                                         │
│ }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## New Targa Features

### 1. SavingsPreviewPanel (Step 1)

**Purpose:** Show potential savings BEFORE Step 5 to build engagement

**Key Rules:**
- Uses `INDUSTRY_AVERAGES` (NOT TrueQuote)
- All values marked with `isEstimate: true`
- Shows range: "$17K - $111K potential annual savings"
- Clearly labeled "ESTIMATE" in UI

```typescript
// Location: src/components/wizard/v6/components/SavingsPreviewPanel.tsx

interface SavingsPreviewPanelProps {
  state: string;
  industry: string;
  isEstimate: true;  // ALWAYS TRUE - Never from SSOT
}
```

### 2. BusinessSizePanel (Step 2)

**Purpose:** Set questionnaire depth based on business size

**Flow:**
```
User selects size → Sets businessSizeTier → Maps to questionnaireDepth
                                                    │
                    ┌───────────────────────────────┼───────────────────┐
                    │                               │                   │
                    ▼                               ▼                   ▼
              micro/small                       medium              large/enterprise
                    │                               │                   │
                    ▼                               ▼                   ▼
              'minimal'                        'standard'          'detailed'
              8-10 questions                   14-16 questions     20-24 questions
```

### 3. Dynamic Question Filtering (Step 3)

**Database Column:** `custom_questions.question_tier`

**Values:**
- `essential` - Always shown (peak demand, energy bills, BESS goals)
- `standard` - Shown for medium+ (amenities, operating hours)
- `detailed` - Shown for large+ (growth plans, specific equipment)

**Filter Logic:**
```typescript
function shouldShowByDepth(
  questionTier: 'essential' | 'standard' | 'detailed',
  questionnaireDepth: 'minimal' | 'standard' | 'detailed'
): boolean {
  if (questionTier === 'essential') return true;
  if (questionTier === 'standard') return questionnaireDepth !== 'minimal';
  if (questionTier === 'detailed') return questionnaireDepth === 'detailed';
  return true;
}
```

---

## Database Schema

### New Tables (Targa)

```sql
-- 1. SUB-INDUSTRIES
-- Specializations within each industry (e.g., hotel → boutique, extended stay)
CREATE TABLE sub_industries (
  id UUID PRIMARY KEY,
  use_case_id UUID REFERENCES use_cases(id),
  name TEXT NOT NULL,                    -- "Boutique Hotel"
  slug TEXT NOT NULL,                    -- "boutique-hotel"
  icon TEXT,                             -- "🏨" or "Hotel"
  description TEXT,
  typical_size_range JSONB,              -- {"min": 20, "max": 80, "unit": "rooms"}
  default_business_size_tier TEXT,       -- "small"
  default_energy_intensity NUMERIC,      -- kWh per unit
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 2. BUSINESS SIZE TIERS
-- Maps business sizes to questionnaire depth
CREATE TABLE business_size_tiers (
  id UUID PRIMARY KEY,
  use_case_id UUID REFERENCES use_cases(id),
  tier_code TEXT NOT NULL,               -- "micro", "small", "medium", "large", "enterprise"
  tier_name TEXT NOT NULL,               -- "Small Hotel (20-80 rooms)"
  size_min INTEGER,
  size_max INTEGER,
  size_unit TEXT,                        -- "rooms", "sqft", "bays", "chargers"
  questionnaire_depth TEXT NOT NULL,     -- "minimal", "standard", "detailed"
  typical_peak_demand_kw INTEGER,
  typical_annual_energy_kwh INTEGER,
  typical_monthly_bill_usd INTEGER
);

-- 3. QUESTION TIER COLUMN (added to existing table)
ALTER TABLE custom_questions 
ADD COLUMN question_tier TEXT DEFAULT 'standard'
CHECK (question_tier IN ('essential', 'standard', 'detailed'));

-- Indexes for performance
CREATE INDEX idx_custom_questions_tier ON custom_questions(question_tier);
CREATE INDEX idx_custom_questions_use_case_tier ON custom_questions(use_case_id, question_tier);
```

### Question Tier Distribution

| Industry | Essential | Standard | Detailed | Total |
|----------|-----------|----------|----------|-------|
| Hotel | 8 | 8 | 10 | 26 |
| Car Wash | 8 | 6 | 7 | 21 |
| EV Charging | 8 | 6 | 7 | 21 |
| Data Center | 8 | 6 | 7 | 21 |
| Hospital | 7 | 6 | 7 | 20 |
| Manufacturing | 7 | 6 | 7 | 20 |
| ... | ... | ... | ... | ... |

---

## Component Reference

### File Locations

```
src/
├── components/wizard/v6/
│   ├── WizardV6.tsx                    # Main wizard container
│   ├── types/index.ts                  # WizardState, types
│   ├── components/
│   │   ├── SavingsPreviewPanel.tsx     # [TARGA] Step 1 estimate
│   │   ├── BusinessSizePanel.tsx       # [TARGA] Step 2 size selector
│   │   ├── MerlinBar.tsx               # Top advisor bar
│   │   ├── ValueTicker.tsx             # Savings ticker
│   │   └── TrueQuoteVerifyBadge.tsx    # Quote authentication
│   └── steps/
│       ├── Step1Location.tsx           # Location + preview
│       ├── Step2Industry.tsx           # Industry + size
│       ├── CompleteStep3Component.tsx  # Dynamic questionnaire
│       ├── Step4Options.tsx            # Solar/EV/Generator
│       ├── Step5Generate.tsx           # SSOT quote generation
│       └── Step6Quote.tsx              # Results display
│
├── services/
│   ├── MerlinOrchestrator.ts           # General contractor
│   ├── TrueQuoteEngineV2.ts            # Prime sub (SSOT)
│   ├── MagicFit.ts                     # Option generator
│   ├── contracts.ts                    # Type definitions
│   ├── subIndustryService.ts           # [TARGA] Sub-industry DB
│   └── calculators/
│       ├── loadCalculator.ts           # Peak demand
│       ├── bessCalculator.ts           # Battery sizing
│       ├── solarCalculator.ts          # PV sizing
│       ├── generatorCalculator.ts      # Generator sizing
│       ├── evCalculator.ts             # EV charger sizing
│       └── financialCalculator.ts      # NPV, IRR, ROI
│
└── database/migrations/
    ├── 20260114_add_sub_industries.sql
    ├── 20260114_add_business_size_tiers.sql
    └── 20260114_assign_question_tiers.sql
```

### Key Exports

```typescript
// Entry point for quotes
import { generateQuote } from '@/services/MerlinOrchestrator';

// Types
import type { WizardState, BusinessSizeTier, QuestionnaireDepth } from '@/components/wizard/v6/types';
import type { MerlinRequest, TrueQuoteAuthenticatedResult } from '@/services/contracts';

// Sub-industry service
import { getSubIndustries, getBusinessSizeTiers } from '@/services/subIndustryService';

// Question filtering
import { shouldShowByDepth } from '@/components/wizard/v6/steps/CompleteStep3Component';
```

---

## Code Examples

### 1. Generating a Quote (Step 5)

```typescript
// In Step5Generate.tsx
import { generateQuote } from '@/services/MerlinOrchestrator';

async function handleGenerateQuote() {
  setLoading(true);
  
  const result = await generateQuote(wizardState);
  
  if ('authenticated' in result && result.authenticated) {
    // Success - update state with SSOT result
    updateState({
      calculations: {
        base: result.base,
        options: result.options,
        selected: result.options[1], // Default to Professional
      }
    });
    goToStep(6);
  } else {
    // Rejection - show error
    setError(result.reason);
  }
  
  setLoading(false);
}
```

### 2. Filtering Questions by Depth (Step 3)

```typescript
// In CompleteStep3Component.tsx
function shouldShowByDepth(
  questionTier: 'essential' | 'standard' | 'detailed',
  questionnaireDepth: 'minimal' | 'standard' | 'detailed'
): boolean {
  if (questionTier === 'essential') return true;
  if (questionTier === 'standard') return questionnaireDepth !== 'minimal';
  if (questionTier === 'detailed') return questionnaireDepth === 'detailed';
  return true;
}

// Usage
const filteredQuestions = allQuestions.filter(q => 
  shouldShowByDepth(q.question_tier, state.questionnaireDepth)
);
```

### 3. Setting Business Size (Step 2)

```typescript
// In BusinessSizePanel.tsx
function handleSizeSelect(tier: BusinessSizeTier) {
  const depthMap: Record<BusinessSizeTier, QuestionnaireDepth> = {
    'micro': 'minimal',
    'small': 'minimal',
    'medium': 'standard',
    'large': 'detailed',
    'enterprise': 'detailed',
  };
  
  updateState({
    businessSizeTier: tier,
    questionnaireDepth: depthMap[tier],
  });
  
  // Auto-advance to Step 3
  goToStep(3);
}
```

### 4. Showing Savings Preview (Step 1)

```typescript
// In SavingsPreviewPanel.tsx
// IMPORTANT: This is NOT SSOT - it's an estimate only

const INDUSTRY_AVERAGES = {
  hotel: { minSavings: 25000, maxSavings: 150000 },
  'car-wash': { minSavings: 8000, maxSavings: 45000 },
  // ...
};

function SavingsPreviewPanel({ state, industry }: Props) {
  const averages = INDUSTRY_AVERAGES[industry];
  
  return (
    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
      <div className="text-xs text-emerald-400 mb-1">
        ⚠️ ESTIMATE ONLY - Not a TrueQuote™
      </div>
      <div className="text-2xl font-bold text-emerald-300">
        ${formatNumber(averages.minSavings)} - ${formatNumber(averages.maxSavings)}
      </div>
      <div className="text-sm text-slate-400">
        Potential annual savings for {industry} in {state}
      </div>
    </div>
  );
}
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Questions not filtering | `question_tier` is NULL | Run migration to assign tiers |
| BusinessSizePanel not showing | Missing `questionnaireDepth` in state | Check Step 2 integration |
| Quote showing NaN | Missing required inputs | Check WizardState validation |
| TrueQuote rejection | Invalid state data | Check MerlinOrchestrator logs |

### Debug Logging

```typescript
// Enable verbose logging in MerlinOrchestrator
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║           MERLIN ORCHESTRATOR v1.0.0                  ║');
console.log('╠═══════════════════════════════════════════════════════╣');
console.log('║  Translating wizard state → TrueQuote request...      ║');
console.log('╚═══════════════════════════════════════════════════════╝');
```

### Validation Hooks

```typescript
// In Step 6, verify SSOT compliance
import { useSSOTValidation } from '@/utils/ssotValidation';

function Step6Quote({ state }) {
  const { isValid, errors } = useSSOTValidation(state.calculations);
  
  if (!isValid) {
    console.error('SSOT Validation Failed:', errors);
  }
}
```

---

## Quick Reference Card

```
┌────────────────────────────────────────────────────────────────────────┐
│                    PORSCHE 911 TARGA QUICK REFERENCE                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  SSOT ENTRY POINT:                                                     │
│  generateQuote(wizardState) → MerlinOrchestrator → TrueQuoteEngineV2   │
│                                                                        │
│  QUESTION DEPTHS:                                                      │
│  minimal (8-10) │ standard (14-16) │ detailed (20-24)                  │
│                                                                        │
│  BUSINESS SIZE → DEPTH:                                                │
│  micro/small → minimal │ medium → standard │ large/enterprise → detailed│
│                                                                        │
│  ESTIMATES vs SSOT:                                                    │
│  SavingsPreviewPanel = ESTIMATE (Step 1) ⚠️                            │
│  generateQuote() = SSOT (Step 5) ✅                                    │
│                                                                        │
│  KEY FILES:                                                            │
│  • MerlinOrchestrator.ts - General contractor                          │
│  • TrueQuoteEngineV2.ts - Prime sub (SSOT)                             │
│  • BusinessSizePanel.tsx - Size selector (Targa)                       │
│  • CompleteStep3Component.tsx - Question filtering (Targa)             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.1 (Targa)*  
*Last Updated: January 14, 2026*  
*Architecture: Porsche 911 Targa*
