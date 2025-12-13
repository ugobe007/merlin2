# Merlin Architecture Evolution: TrueQuote-First Strategy

**Created:** December 11, 2025  
**Purpose:** Scalable architecture roadmap for Merlin platform evolution  
**Author:** Architecture Planning Session

---

## Executive Summary

This document outlines how to evolve Merlin from a monolithic React application into a scalable, multi-product platform with **TrueQuote™** at its core.

### Current State
- **321 TypeScript files** in `/src`
- **4.2 MB** of component code
- **1.5 MB** of services
- Single React application deployed to Fly.io
- All features in one bundle

### Future State
- **Merlin Core Engine** (TrueQuote™ API)
- **Multiple frontends** (Pro, SMB, API)
- **White-label capability** for partnerships
- **Microservices-ready** architecture

---

## 🏗️ Proposed Architecture: TrueQuote-Centric

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MERLIN TRUEQUOTE™ ENGINE                              │
│                         (The Crown Jewel - API First)                           │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    @merlin/truequote-core (npm package)                 │   │
│  │                                                                         │   │
│  │  ├── QuoteEngine           ← Main entry point                          │   │
│  │  ├── TrueQuote             ← Source attribution system                 │   │
│  │  ├── EquipmentCalculator   ← NREL ATB pricing                          │   │
│  │  ├── FinancialCalculator   ← NPV, IRR, LCOS, StoreFAST                 │   │
│  │  ├── PowerCalculator       ← Use case power requirements               │   │
│  │  ├── BenchmarkRegistry     ← Authoritative source citations            │   │
│  │  └── AuditMetadata         ← JSON export for verification              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Outputs: QuoteResult + TrueQuoteAudit (every quote is cite-ready)             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            │                           │                           │
            ▼                           ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│   MERLIN PRO          │   │   SMB VERTICALS       │   │   MERLIN API          │
│   (Professional)      │   │   (Consumer)          │   │   (B2B / White-Label) │
│                       │   │                       │   │                       │
│   merlinpro.energy    │   │   • carwashenergy.com │   │   api.merlin.energy   │
│                       │   │   • hotelpower.com    │   │                       │
│   Features:           │   │   • evchargingroi.com │   │   Features:           │
│   • AdvancedQuoteBldr │   │                       │   │   • REST API          │
│   • 3-Statement Model │   │   Features:           │   │   • Webhooks          │
│   • PDF/Word/Excel    │   │   • StreamlinedWizard │   │   • White-label       │
│   • Vendor Selection  │   │   • Quick ROI calc    │   │   • Usage metering    │
│   • Multi-scenario    │   │   • Lead capture      │   │   • Partner portal    │
│   • Bank-ready docs   │   │   • Simple exports    │   │   • Custom branding   │
│                       │   │                       │   │                       │
│   $99-299/mo         │   │   Free + Lead Gen     │   │   $500-5000/mo        │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
```

---

## 📁 Proposed Folder Restructure

### Current (Monolithic)
```
src/
├── components/      ← 4.2 MB, 40+ top-level files
├── services/        ← 1.5 MB, 68 files, mixed responsibilities
├── utils/
├── hooks/
├── core/
└── ...
```

### Proposed (Domain-Driven)
```
src/
├── @merlin/
│   └── truequote-core/          ← EXTRACTABLE NPM PACKAGE
│       ├── engine/
│       │   ├── QuoteEngine.ts           ← Main orchestrator
│       │   ├── EquipmentCalculator.ts   ← From equipmentCalculations.ts
│       │   ├── FinancialCalculator.ts   ← From centralizedCalculations.ts
│       │   └── PowerCalculator.ts       ← From useCasePowerCalculations.ts
│       ├── truequote/
│       │   ├── TrueQuoteService.ts      ← Source attribution
│       │   ├── BenchmarkRegistry.ts     ← From benchmarkSources.ts
│       │   ├── AuditMetadata.ts         ← Audit trail generation
│       │   └── DeviationDetector.ts     ← Flag >15% deviations
│       ├── pricing/
│       │   ├── NRELPricingAdapter.ts    ← NREL ATB data
│       │   ├── MarketDataAdapter.ts     ← Live market data
│       │   └── RegionalAdjustments.ts   ← Location-based pricing
│       ├── types/
│       │   └── index.ts                 ← All shared types
│       └── index.ts                     ← Public API exports
│
├── apps/
│   ├── pro/                     ← MERLIN PRO FEATURES
│   │   ├── components/
│   │   │   ├── AdvancedQuoteBuilder/
│   │   │   ├── ProfessionalExports/
│   │   │   ├── MultiScenarioAnalysis/
│   │   │   └── VendorSelection/
│   │   ├── hooks/
│   │   └── views/
│   │
│   ├── smb/                     ← SMB VERTICAL FEATURES
│   │   ├── components/
│   │   │   ├── wizard/          ← StreamlinedWizard (refactored)
│   │   │   └── verticals/       ← CarWash, Hotel, EV pages
│   │   └── hooks/
│   │
│   └── api/                     ← API-SPECIFIC CODE
│       ├── routes/
│       ├── middleware/
│       └── webhooks/
│
├── shared/                      ← SHARED UI COMPONENTS
│   ├── components/
│   │   ├── badges/              ← TrueQuote badges, trust badges
│   │   ├── forms/               ← Shared form components
│   │   ├── modals/
│   │   └── charts/
│   ├── hooks/
│   └── utils/
│
├── infrastructure/              ← EXISTING (keep)
│   ├── database/
│   ├── auth/
│   └── logging/
│
└── legacy/                      ← DEPRECATION HOLDING PEN
    └── _deprecated/             ← Files being phased out
```

---

## 🎯 TrueQuote™ as the Core Product

### Why TrueQuote-First?

| Competitor Pain Point | TrueQuote™ Solution | Business Value |
|----------------------|---------------------|----------------|
| Black-box pricing | Every line item cited | Trust + differentiation |
| Unverifiable assumptions | Audit metadata export | Bank-ready quotes |
| Proprietary formulas | NREL/StoreFAST aligned | Industry credibility |
| No methodology docs | Public whitepaper | Sales enablement |

### TrueQuote™ Core API Design

```typescript
// @merlin/truequote-core/index.ts

export interface TrueQuoteInput {
  // System configuration
  storageSizeMW: number;
  durationHours: number;
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  
  // Location & use case
  location: string;
  useCase: string;
  electricityRate: number;
  demandCharge?: number;
  
  // Options
  gridConnection: 'on-grid' | 'off-grid' | 'limited';
  includeAuditTrail?: boolean;  // TrueQuote feature
  vendorPreferences?: string[]; // Pro feature
}

export interface TrueQuoteResult {
  // Quote data
  quote: {
    equipment: EquipmentBreakdown;
    costs: CostBreakdown;
    financials: FinancialMetrics;
  };
  
  // TrueQuote™ exclusive
  trueQuote: {
    certified: boolean;
    version: string;
    methodology: string;
    sources: SourceAttribution[];
    assumptions: AuditableAssumption[];
    deviations: DeviationFlag[];
    exportable: {
      json: string;
      excel: Buffer;
      pdf: Buffer;
    };
  };
  
  // Metadata
  meta: {
    calculatedAt: Date;
    engineVersion: string;
    cacheKey: string;
  };
}

// Main entry point
export class TrueQuoteEngine {
  static async generateQuote(input: TrueQuoteInput): Promise<TrueQuoteResult>;
  static async quickEstimate(sizeMW: number, hours: number, rate: number): Promise<QuickEstimate>;
  static calculatePower(useCase: string, data: Record<string, any>): PowerResult;
  static getBenchmarkSources(): BenchmarkSource[];
}
```

---

## 📦 Phased Migration Plan

### Phase 1: Extract TrueQuote Core (2-3 weeks)
```
Week 1-2:
├── Create @merlin/truequote-core structure
├── Move calculation files:
│   ├── unifiedQuoteCalculator.ts → engine/QuoteEngine.ts
│   ├── centralizedCalculations.ts → engine/FinancialCalculator.ts
│   ├── equipmentCalculations.ts → engine/EquipmentCalculator.ts
│   ├── useCasePowerCalculations.ts → engine/PowerCalculator.ts
│   └── benchmarkSources.ts → truequote/BenchmarkRegistry.ts
├── Create barrel exports (index.ts)
└── Update imports across app

Week 3:
├── Add TrueQuote audit trail to every quote
├── Create source attribution system
├── Test all calculation paths
└── Document public API
```

### Phase 2: Separate Pro vs SMB Features (2-3 weeks)
```
Week 4-5:
├── Create apps/pro/ directory
├── Move advanced features:
│   ├── AdvancedQuoteBuilder → apps/pro/
│   ├── ProfessionalFinancialModeling → apps/pro/
│   ├── VendorManager → apps/pro/
│   └── QuoteTemplates → apps/pro/
├── Create apps/smb/ directory
├── Move streamlined features:
│   ├── wizard/ → apps/smb/wizard/
│   └── verticals/ → apps/smb/verticals/
└── Implement feature gating

Week 6:
├── Create shared/ directory
├── Extract common components
├── Update routing for Pro vs SMB
└── Test both paths end-to-end
```

### Phase 3: API Layer (2-3 weeks)
```
Week 7-8:
├── Create apps/api/ directory
├── Design REST API endpoints:
│   ├── POST /api/v1/quotes
│   ├── POST /api/v1/quick-estimate
│   ├── GET /api/v1/use-cases
│   └── GET /api/v1/benchmark-sources
├── Add authentication (API keys)
├── Add rate limiting
├── Add usage metering

Week 9:
├── Create partner portal UI
├── Add webhook support
├── Add white-label configuration
└── Document API for partners
```

### Phase 4: White-Label Infrastructure (2-3 weeks)
```
Week 10-11:
├── Multi-tenant database schema
├── Custom branding system:
│   ├── Logo upload
│   ├── Color themes
│   ├── Custom domains
│   └── Partner watermarks
├── Billing integration (Stripe)
└── Partner onboarding flow

Week 12:
├── Launch partner program
├── First white-label deployment
└── Revenue share tracking
```

---

## 💰 Revenue Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REVENUE STREAMS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────┐   │
│  │ MERLIN PRO      │   │ SMB VERTICALS   │   │ MERLIN API              │   │
│  │ (SaaS)          │   │ (Lead Gen)      │   │ (B2B)                   │   │
│  ├─────────────────┤   ├─────────────────┤   ├─────────────────────────┤   │
│  │                 │   │                 │   │                         │   │
│  │ Starter: $49/mo │   │ Free tier       │   │ Starter: $500/mo        │   │
│  │ • 10 quotes     │   │ Lead capture    │   │ • 1,000 API calls       │   │
│  │ • Basic export  │   │                 │   │ • Standard support      │   │
│  │                 │   │ Lead Sales:     │   │                         │   │
│  │ Pro: $149/mo    │   │ $500-2,000/lead │   │ Growth: $2,000/mo       │   │
│  │ • Unlimited     │   │                 │   │ • 10,000 API calls      │   │
│  │ • TrueQuote™    │   │ Revenue Share:  │   │ • White-label           │   │
│  │ • Word/Excel    │   │ 2-5% on deals   │   │ • Webhooks              │   │
│  │                 │   │                 │   │                         │   │
│  │ Enterprise:     │   │                 │   │ Enterprise: $5,000/mo   │   │
│  │ $299/mo         │   │                 │   │ • Unlimited calls       │   │
│  │ • Multi-user    │   │                 │   │ • Custom domain         │   │
│  │ • API access    │   │                 │   │ • SLA guarantee         │   │
│  │ • Priority      │   │                 │   │ • Dedicated support     │   │
│  └─────────────────┘   └─────────────────┘   └─────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Technical Decisions

### 1. TrueQuote Core as Extractable Package

**Why:** Enables multiple deployment targets (web, API, white-label)

```typescript
// Can be used in any context
import { TrueQuoteEngine } from '@merlin/truequote-core';

// Web app
const quote = await TrueQuoteEngine.generateQuote(input);

// API endpoint
app.post('/api/v1/quotes', async (req, res) => {
  const quote = await TrueQuoteEngine.generateQuote(req.body);
  res.json(quote);
});

// White-label partner
const quote = await TrueQuoteEngine.generateQuote({
  ...partnerInput,
  branding: partnerConfig.branding,
});
```

### 2. Feature Gating by Product

```typescript
// src/shared/hooks/useFeatureGate.ts
export function useFeatureGate() {
  const { user, subscription } = useAuth();
  
  return {
    // Pro features
    canAccessAdvancedBuilder: subscription?.tier === 'pro' || subscription?.tier === 'enterprise',
    canExportWord: subscription?.tier !== 'free',
    canAccessVendorSelection: subscription?.tier === 'enterprise',
    
    // TrueQuote features (always available for differentiation)
    canAccessTrueQuote: true,
    canExportAuditTrail: subscription?.tier !== 'free',
    
    // API features
    hasApiAccess: subscription?.tier === 'enterprise' || subscription?.type === 'api',
  };
}
```

### 3. Audit Trail by Default

Every quote, regardless of tier, includes TrueQuote certification:

```typescript
// Every quote result
{
  quote: { /* standard data */ },
  trueQuote: {
    certified: true,
    sources: [
      { component: "Battery", source: "NREL ATB 2024", value: "$150/kWh" },
      { component: "Financial", source: "NREL StoreFAST", methodology: "25yr, 8% discount" },
    ],
    // Free tier: view only
    // Paid tier: full export capability
  }
}
```

---

## 📊 Migration Metrics

### Files to Move/Reorganize

| Current Location | New Location | Priority |
|------------------|--------------|----------|
| `services/unifiedQuoteCalculator.ts` | `@merlin/truequote-core/engine/` | P0 |
| `services/centralizedCalculations.ts` | `@merlin/truequote-core/engine/` | P0 |
| `utils/equipmentCalculations.ts` | `@merlin/truequote-core/engine/` | P0 |
| `services/useCasePowerCalculations.ts` | `@merlin/truequote-core/engine/` | P0 |
| `services/benchmarkSources.ts` | `@merlin/truequote-core/truequote/` | P0 |
| `components/wizard/` | `apps/smb/wizard/` | P1 |
| `components/verticals/` | `apps/smb/verticals/` | P1 |
| `components/AdvancedQuoteBuilder.tsx` | `apps/pro/components/` | P1 |
| `components/shared/TrueQuoteBadge.tsx` | `shared/components/badges/` | P2 |
| `services/vendorService.ts` | `apps/pro/services/` | P2 |

### Code Reduction Goals

| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| Top-level components | 40+ | 10 | Move to apps/, shared/ |
| Services files | 68 | 30 | Consolidate, move to core |
| Duplicate calculations | ~5 paths | 1 path | TrueQuote core only |
| Bundle size | 2.6 MB | 1.5 MB | Code splitting |

---

## 🚀 Implementation Roadmap

```
                                    2025                           2026
                    ──────────────────────────────────────────────────────────
                    Dec          Jan          Feb          Mar          Apr
                    ──────────────────────────────────────────────────────────
PHASE 1: Core       ████████████
Extract             TrueQuote Core Package
                    
PHASE 2: Split                   ████████████
Pro/SMB                          Feature separation
                    
PHASE 3: API                                  ████████████
Layer                                         REST API + Portal
                    
PHASE 4: White                                             ████████████
Label                                                      Partner infra
                    
LAUNCH                                                                  🚀
                                                                   Partners
```

---

## ✅ Next Steps (Immediate)

1. **Create `@merlin/truequote-core/` directory structure**
2. **Move core calculation files** (QuoteEngine, Financial, Equipment, Power)
3. **Create barrel exports** with clean public API
4. **Update all imports** to use new paths
5. **Add TrueQuote audit metadata** to every quote response
6. **Test all calculation paths** with the new structure

---

## 📝 Summary

**TrueQuote™ is the differentiator.** Every architectural decision should support:

1. **Cite-ready quotes** — Every number has a source
2. **Multi-product delivery** — Pro, SMB, API all use same core
3. **White-label ready** — Partners can deploy their own Merlin
4. **Scalable growth** — Clean separation enables team scaling

The goal is to transform Merlin from a *feature-rich application* into a **platform** that powers multiple products and partnerships, with TrueQuote™ as the moat that competitors cannot easily replicate.

---

*Document created: December 11, 2025*
*Next review: January 2026*
