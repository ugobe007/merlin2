# 🎯 TrueQuote Architecture - Product & Fulfillment Model
**Date**: December 25, 2025  
**Status**: Core Architecture Design

---

## 🏆 TrueQuote: The Product

**TrueQuote is our product differentiator** - guaranteed accuracy within 3% of industry benchmarks, with full traceability to authoritative sources.

### Core Value Proposition

1. **Accuracy**: 3% threshold enforced by validation service
2. **Traceability**: Every number links to NREL, DOE, IEEE, etc.
3. **Audit Trail**: Complete calculation history
4. **Compliance**: Industry benchmark validation

---

## 🏢 Merlin Energy: The Brand & Backend Fulfillment

**Merlin Energy** is the overall brand that:
- Powers all vertical sites (carwashenergy.com, hotelenergy.com, etc.)
- Provides backend fulfillment for all quotes
- Organizes vendors and secures quotes
- Validates pricing against market data
- Handles installation and services

### Fulfillment Flow

```
Customer Quote (TrueQuote Validated)
  ↓
Merlin Energy Backend
  ↓
┌─────────────────────────────────────────┐
│  VENDOR MANAGEMENT & VALIDATION         │
└─────────────────────────────────────────┘
  ↓
1. Organize vendors (vendor portal)
2. Secure vendor quotes
3. Validate against market pricing
4. Harmonize pricing via ML agent
5. Assemble final quote
  ↓
┌─────────────────────────────────────────┐
│  INSTALLATION & SERVICES                │
└─────────────────────────────────────────┘
  ↓
1. Project management
2. Installation coordination
3. BESS system delivery
4. Solar, generators, EV chargers
5. Inverters, BMS, ESS components
6. Commissioning and handover
```

---

## 📊 Market-Driven Pricing Architecture

### The Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│  MARKET DATA COLLECTION                                     │
└─────────────────────────────────────────────────────────────┘
  ↓
1. RSS Feeds (industry news, pricing updates)
2. Web Scraping (vendor sites, market reports)
3. Vendor Submissions (approved products)
  ↓
┌─────────────────────────────────────────────────────────────┐
│  DATABASE STORAGE                                           │
└─────────────────────────────────────────────────────────────┘
  ↓
- equipment_pricing table (vendor + market data)
- market_pricing_data table (historical trends)
- ai_training_data table (ML training)
  ↓
┌─────────────────────────────────────────────────────────────┐
│  ML AGENT - HARMONIZATION                                  │
└─────────────────────────────────────────────────────────────┘
  ↓
1. Analyze price trends
2. Identify outliers
3. Harmonize pricing across sources
4. Generate pricing recommendations
5. Update pricing models (with admin approval)
  ↓
┌─────────────────────────────────────────────────────────────┐
│  PRICING SERVICE - UNIFIED PRICING                         │
└─────────────────────────────────────────────────────────────┘
  ↓
Priority Order:
1. Vendor pricing (approved products) - HIGHEST CONFIDENCE
2. Market data (scraper + ML harmonized)
3. Database constants (calculation_constants table)
4. NREL ATB 2024 fallback
  ↓
┌─────────────────────────────────────────────────────────────┐
│  QUOTE ENGINE - SSOT CALCULATIONS                          │
└─────────────────────────────────────────────────────────────┘
  ↓
- Uses unified pricing service
- Calculates equipment costs
- Calculates financial metrics
- Generates complete quote
  ↓
┌─────────────────────────────────────────────────────────────┐
│  TRUEQUOTE VALIDATION                                       │
└─────────────────────────────────────────────────────────────┘
  ↓
- Validates against industry benchmarks (3% threshold)
- Checks source attribution
- Verifies audit trail
- Ensures compliance
  ↓
┌─────────────────────────────────────────────────────────────┐
│  QUOTE PRESENTATION                                         │
└─────────────────────────────────────────────────────────────┘
  ↓
- TrueQuote badge displayed
- Source attribution shown
- Audit trail available
- Ready for customer review
```

---

## 🏗️ Modular Architecture for Vertical Sites

### Structure

```
merlin2/ (Monorepo)
├── packages/
│   ├── core/                    # @merlin/core
│   │   ├── calculations/        # SSOT calculations
│   │   ├── validation/          # TrueQuote validation
│   │   ├── pricing/             # Market-driven pricing
│   │   └── constants/           # Database-backed constants
│   │
│   ├── wizard/                  # @merlin/wizard
│   │   ├── WizardV5.tsx         # Reusable wizard component
│   │   ├── steps/               # Wizard steps
│   │   ├── components/          # Shared components
│   │   └── design-system/       # Theming system
│   │
│   └── verticals/
│       ├── carwash/             # CarWash config & theme
│       ├── hotel/               # Hotel config & theme
│       └── evcharging/          # EV Charging config & theme
│
├── apps/
│   ├── merlin-main/             # Main Merlin site
│   ├── carwash-site/            # carwashenergy.com
│   ├── hotel-site/              # hotelenergy.com
│   └── evcharging-site/         # evchargingenergy.com
│
└── src/                         # Current codebase (migrating)
```

### How It Works

1. **Vertical Sites** (carwashenergy.com, etc.)
   - Standalone domains
   - Use `@merlin/wizard` component
   - Configured with vertical-specific theme
   - All calculations via `@merlin/core`

2. **Core Package** (`@merlin/core`)
   - SSOT for all calculations
   - TrueQuote validation
   - Market-driven pricing
   - Shared across all verticals

3. **Wizard Package** (`@merlin/wizard`)
   - Reusable wizard component
   - Configurable theming
   - Industry pre-selection
   - No calculation logic (uses `@merlin/core`)

---

## 🔒 SSOT & TrueQuote Compliance

### How SSOT is Maintained

1. **Single Calculation Engine**
   - All quotes use `@merlin/core/calculations`
   - No duplicate calculation logic
   - Version-controlled and tested

2. **Database-Backed Constants**
   - `calculation_constants` table (SSOT)
   - Updated without code deployment
   - Shared across all verticals

3. **Market-Driven Pricing**
   - Scraper → Database → ML Agent → Pricing Service
   - Vendor submissions integrated
   - Real-time market intelligence

### How TrueQuote is Maintained

1. **Validation Service**
   - `@merlin/core/validation/trueQuoteValidator`
   - 3% accuracy threshold enforced
   - Industry benchmark checking
   - Source attribution required

2. **Audit Trail**
   - Every calculation step logged
   - Source attribution for all values
   - Complete traceability

3. **Compliance Checking**
   - All quotes validated before presentation
   - TrueQuote badge only shown if compliant
   - Non-compliant quotes flagged for review

---

## 💼 Business Model Integration

### Quote Generation (TrueQuote)

1. Customer uses vertical site (e.g., carwashenergy.com)
2. Wizard collects requirements
3. `@merlin/core` calculates quote (SSOT)
4. TrueQuote validation ensures accuracy
5. Quote presented with TrueQuote badge

### Backend Fulfillment (Merlin Energy)

1. Customer accepts quote
2. Merlin Energy backend receives quote
3. Vendor management:
   - Organize vendors via vendor portal
   - Secure vendor quotes
   - Validate against market pricing
   - Harmonize via ML agent
4. Final quote assembly:
   - Compare vendor quotes
   - Select best options
   - Validate pricing (even though margins built in)
   - Assemble final quote
5. Installation & services:
   - Project management
   - Coordinate installation
   - Deliver BESS system
   - Install solar, generators, EV chargers
   - Install inverters, BMS, ESS
   - Commission and handover

---

## 🎯 Why This Architecture Works

### For TrueQuote (Product)

- ✅ **Accuracy**: 3% threshold enforced
- ✅ **Traceability**: Every number has a source
- ✅ **Compliance**: Industry benchmark validation
- ✅ **Audit Trail**: Complete calculation history

### For Merlin Energy (Brand/Fulfillment)

- ✅ **Market-Driven Pricing**: Scraper → ML → Database → Pricing
- ✅ **Vendor Integration**: Vendor portal → Pricing service
- ✅ **Validation**: All quotes validated before fulfillment
- ✅ **Scalability**: Modular architecture supports growth

### For Vertical Sites

- ✅ **Standalone**: Separate domains, no cross-contamination
- ✅ **Shared Core**: SSOT maintained across all sites
- ✅ **TrueQuote Compliant**: All sites use same validation
- ✅ **Branded**: Each site can have its own branding

---

## 📋 Implementation Status

### Phase 1: Core Extraction (Current)
- [x] Monorepo structure created
- [x] `@merlin/core` package structure
- [ ] Extract calculation services
- [ ] Extract validation services
- [ ] Extract pricing services
- [ ] Test SSOT compliance

### Phase 2: Wizard Extraction
- [ ] Extract wizard component
- [ ] Add configuration system
- [ ] Add theming system
- [ ] Test wizard in isolation

### Phase 3: CarWash POC
- [ ] Create carwash-site app
- [ ] Integrate wizard
- [ ] Test TrueQuote compliance
- [ ] Deploy to carwashenergy.com

---

## 🔗 Related Documents

- `docs/MODULAR_ARCHITECTURE_PROPOSAL.md` - Full architecture proposal
- `MIGRATION_PLAN.md` - Step-by-step migration guide
- `packages/core/README.md` - Core package documentation




