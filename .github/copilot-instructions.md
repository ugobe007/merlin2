# Copilot Instructions for Merlin BESS Quote Builder

## 🚀 BUSINESS STRATEGY - READ FIRST!

**BEFORE making ANY changes, read these files:**

1. **`MERLIN_STRATEGIC_ROADMAP.md`** - 5-phase business plan (Dec 2025)
   - Merlin = Platform/Engine powering SMB verticals + Merlin Pro
   - Revenue model: SaaS + Lead Gen + API

2. **`docs/MERLIN_ARCHITECTURE_EVOLUTION.md`** - Architecture scaling plan (Dec 11, 2025)
   - TrueQuote™ as core differentiator
   - Migration to @merlin/truequote-core package
   - Pro vs SMB vs API product separation

## 🎯 TRUEQUOTE™ IS THE FUTURE

**TrueQuote™** = Every number in a quote is traceable to an authoritative source.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MERLIN TRUEQUOTE™ ENGINE                               │
│                    (Future: @merlin/truequote-core)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current SSOT Files → Future Package Location:                              │
│  ├── unifiedQuoteCalculator.ts    → @merlin/truequote-core/engine/         │
│  ├── centralizedCalculations.ts   → @merlin/truequote-core/engine/         │
│  ├── equipmentCalculations.ts     → @merlin/truequote-core/engine/         │
│  ├── useCasePowerCalculations.ts  → @merlin/truequote-core/engine/         │
│  └── benchmarkSources.ts          → @merlin/truequote-core/truequote/      │
│                                                                             │
│  Key Principle: ALL quotes include audit trail (sources, methodology)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**When building NEW features, ask:**
- Does this support TrueQuote™ source attribution?
- Is this a Pro feature, SMB feature, or shared?
- Can this be extracted to the core engine later?

### TrueQuote™ UI Components (Dec 2025)

**Quote display components** in `src/components/quotes/`:
- `QuoteLineItemWithSource` - Cost line item with source attribution tooltip
- `SourceAttributionTooltip` - Hover tooltip showing benchmark source details
- `SourceBadge` - Visual badge for source type (government, industry, academic)
- `QuoteAuditSection` - Expandable section with full source methodology

**TrueQuote™ badges** in `src/components/shared/TrueQuoteBadge.tsx`:
- `TrueQuoteBadge` - Small badge indicating TrueQuote verified
- `TrueQuoteBanner` - Full banner with source methodology description

**Benchmark sources** in `src/services/benchmarkSources.ts`:
- `AUTHORITATIVE_SOURCES` - All benchmark sources with metadata
- `PRICING_BENCHMARKS` - Equipment-specific pricing benchmarks
- Key sources: `nrel-atb-2024`, `nrel-cost-benchmark-2024`, `ira-2022`

**Current Integration (Dec 2025):**
- ✅ `QuoteResultsSection.tsx` - Investment Summary uses `QuoteLineItemWithSource`
- ✅ Sources shown: BESS (NREL ATB 2024), Solar (NREL Cost Benchmark), Installation (NREL), ITC (IRA 2022)
- ✅ "View TrueQuote™ Sources" button expands source attribution list
- ✅ **NEW**: Sizing Methodology v2.0 with IEEE/MDPI/NREL sources displayed in audit trail

### BESS Sizing Methodology v2.0 (Dec 11, 2025)

**All sizing ratios are benchmark-backed and traceable:**

| Ratio | Value | Source |
|-------|-------|--------|
| BESS/Peak (peak shaving) | 0.40 | IEEE 4538388, MDPI Energies 11(8):2048 |
| BESS/Peak (arbitrage) | 0.50 | Industry practice |
| BESS/Peak (resilience) | 0.70 | IEEE 446-1995 (Orange Book) |
| BESS/Peak (microgrid) | 1.00 | NREL microgrid standards |
| Solar ILR (DC-coupled) | 1.40 | NREL ATB 2024 PV-Plus-Battery |
| Solar ILR (aggressive) | 1.70 | EIA Today in Energy |
| Generator Reserve | 1.25 | LADWP, NEC 700/701/702, WPP Guide |

**Critical Load % by Industry (for generator sizing):**

| Industry | Critical % | Source |
|----------|------------|--------|
| Data Center | 100% | IEEE 446-1995, Tier III/IV |
| Hospital | 85% | NEC 517, NFPA 99 |
| Airport | 55% | FAA requirements |
| Hotel | 50% | LADWP commercial guidance |
| Manufacturing | 60% | IEEE 446-1995 |
| Retail | 40% | LADWP commercial guidance |
| Warehouse | 35% | Industry practice |
| Car Wash | 25% | Minimal critical load |

**Helper Functions** in `benchmarkSources.ts`:
- `getBESSSizingRatioWithSource(useCase)` - Returns ratio + full citation
- `getSolarILRWithSource(couplingType)` - Returns ILR + full citation
- `getCriticalLoadWithSource(industryType)` - Returns % + citation
- `getGeneratorReserveMarginWithSource()` - Returns margin + citation
- `generateSizingAuditTrail(params)` - Complete TrueQuote™ audit trail

**Constants** in `wizardConstants.ts`:
- `BESS_POWER_RATIOS` - Use case ratios (peak_shaving: 0.40, etc.)
- `CRITICAL_LOAD_PERCENTAGES` - Industry-specific critical load %
- `SOLAR_BATTERY_RATIOS` - ILR by coupling type
- `GENERATOR_RESERVE_MARGIN` - 1.25 (25% reserve)
- `calculateSystemSizing(params)` - Complete sizing function with metadata

## 🎨 UI/UX DESIGN - READ SECOND!

**BEFORE making ANY UI changes, read:** `DESIGN_NOTES.md` in project root
- Contains current design specifications, color palette, component layouts
- Updated after each design session
- **AI agents MUST update this file after significant UI changes**

---

## ⚠️ CRITICAL: Single Sources of Truth

**SSOT ARCHITECTURE DIAGRAM (Updated Jan 2026):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ANY COMPONENT NEEDING QUOTES                             │
│            (AdvancedQuoteBuilder, StreamlinedWizard, WizardV6)              │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│             unifiedQuoteCalculator.calculateQuote()                         │
│                    ✅ TRUE SSOT ENTRY POINT                                 │
│                                                                             │
│  Input: { storageSizeMW, durationHours, solarMW, windMW, generatorMW,      │
│           location, zipCode, electricityRate, gridConnection, useCase,     │
│           batteryChemistry, itcConfig, includeAdvancedAnalysis }           │
│                                                                             │
│  Returns: QuoteResult { equipment, costs, financials, metadata }            │
│                                                                             │
│  METADATA NOW INCLUDES (Jan 2026):                                          │
│  ├── itcDetails (IRA 2022 dynamic ITC breakdown)                            │
│  ├── utilityRates (dynamic rate lookup by zip code)                         │
│  ├── degradation (battery chemistry + year-by-year capacity)                │
│  ├── solarProduction (PVWatts-based estimates)                              │
│  └── advancedAnalysis (8760 hourly + Monte Carlo if requested)              │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌──────────────────┐  ┌────────────────────┐  ┌────────────────────────────┐
│ Equipment Calc   │  │ Financial Calc     │  │ Dynamic Services (NEW)     │
│                  │  │                    │  │                            │
│ batteries        │  │ NPV, IRR, ROI      │  │ utilityRateService         │
│ inverters        │  │ paybackYears       │  │   └─ getCommercialRateByZip│
│ transformers     │  │ demandChargeSavings│  │ itcCalculator              │
│ solar/wind       │  │                    │  │   └─ estimateITC           │
│ generators       │  │                    │  │ batteryDegradationService  │
└──────────────────┘  └────────────────────┘  │   └─ estimateDegradation   │
                                              │ pvWattsService             │
                                              │   └─ estimateSolarProd     │
                                              │ hourly8760AnalysisService  │
                                              │   └─ estimate8760Savings   │
                                              │ monteCarloService          │
                                              │   └─ estimateRiskMetrics   │
                                              └────────────────────────────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer B: MARGIN POLICY ENGINE (Feb 2026)                                   │
│  truequoteV2Adapter.ts → applyMarginPolicy()                                │
│  ├── sellPriceTotal = baseCostTotal + marginDollars                         │
│  ├── Single insertion point (Steps 4/5/6 passive)                           │
│  └── maxMarginCapApplied in audit trail                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**CALCULATION ARCHITECTURE - SIX PILLARS + FEB 2026 INTEGRATIONS:**

1. **Quote Calculator** → `unifiedQuoteCalculator.ts` (Updated Jan 2026)
   - **USE THIS FOR ALL QUOTE CALCULATIONS**
   - `calculateQuote()` - Complete quote with equipment + financials
   - `estimatePayback()` - Quick estimate for UI previews
   - Orchestrates all other services
   - ✅ **SINGLE ENTRY POINT** for quote generation
   - ⚠️ **IMPORTANT**: NEVER call `calculateFinancialMetrics()` directly from components - always use `calculateQuote()` which orchestrates both equipment AND financial calculations
   - **NEW INPUT OPTIONS (Jan 2026):**
     - `zipCode` - Auto-fetches utility rates
     - `itcConfig` - Dynamic ITC calculation per IRA 2022
     - `batteryChemistry` - Degradation modeling (lfp, nmc, nca, flow-vrb, sodium-ion)
     - `includeAdvancedAnalysis` - Enables 8760 hourly + Monte Carlo

2. **Power/Demand Calculations** → `useCasePowerCalculations.ts`
   - Industry-standard peak demand values (ASHRAE, CBECS, Energy Star)
   - Individual calculators: `calculateOfficePower()`, `calculateHotelPower()`, etc.
   - Master function: `calculateUseCasePower(slug, useCaseData)`
   - ✅ **SINGLE SOURCE OF TRUTH** for all power calculations

3. **EV Charging Hub Calculations** → `evChargingCalculations.ts` (Nov 30, 2025)
   - **USE FOR ALL EV CHARGING CONFIGURATIONS**
   - Supports: Level 2 (7/11/19/22 kW), DCFC (50/150 kW), HPC (250/350 kW)
   - `calculateEVHubPower()` - Power requirements with concurrency
   - `calculateEVHubCosts()` - Hardware, installation, make-ready costs
   - `calculateEVHubBESSSize()` - Recommended BESS for peak shaving
   - ⚠️ **NO "Level 3" EXISTS** - Industry uses L1, L2, DCFC, HPC
   - ✅ **SINGLE SOURCE OF TRUTH** for EV charging calculations
   - 📝 **INTEGRATION STATUS**: Currently standalone - not integrated into `calculateQuote()` flow (see gaps below)

4. **Financial Calculations** → `centralizedCalculations.ts`
   - `calculateFinancialMetrics()` - NPV, IRR, ROI, payback
   - Database-driven constants (not hardcoded)
   - Advanced analysis: sensitivity, risk, Monte Carlo
   - ✅ **SINGLE SOURCE OF TRUTH** for all financial metrics
   - ⚠️ **NEVER call directly from components** - use `calculateQuote()` instead

5. **Equipment Pricing** → `src/utils/equipmentCalculations.ts` (NOTE: in utils/ not services/)
   - `calculateEquipmentBreakdown()` - Batteries, inverters, transformers
   - **FIXED Nov 28**: Small systems (< 1 MW) now priced per-kWh, not per-unit
   - Market intelligence integration via NREL ATB 2024
   - ✅ **SINGLE SOURCE OF TRUTH** for BESS equipment costs
   - 📍 **Location**: `src/utils/equipmentCalculations.ts` (not in services/)

6. **Professional Financial Model** → `professionalFinancialModel.ts` (Nov 29, 2025)
   - **USE FOR BANK/INVESTOR-READY DOCUMENTS**
   - `generateProfessionalModel()` - Full 3-statement model with DSCR
   - Features: 3-Statement Model, DSCR, Levered/Unlevered IRR, MACRS, Revenue Stacking
   - `generateSensitivityMatrix()` - Parameter sensitivity for banks
   - ✅ **SINGLE SOURCE OF TRUTH** for professional project finance

7. **Margin Policy Engine** → `marginPolicyEngine.ts` + `truequoteV2Adapter.ts` (Feb 2026)
   - **SINGLE INSERTION POINT** for margin calculations
   - `applyMarginPolicy()` - Apply commercial margin to base costs
   - Integrated via `generateTrueQuoteV2()` in adapter
   - Steps 4/5/6 of WizardV6 consume `sellPriceTotal` - NEVER compute margin themselves
   - ✅ **SINGLE SOURCE OF TRUTH** for sell price commercialization
   - See **MARGIN POLICY ENGINE** section below for full details

**KNOWN GAPS (as of Dec 2025):**

| Gap | Current State | Status |
|-----|---------------|--------|
| Fuel Cell Pricing | ✅ FIXED - Added to `equipmentCalculations.ts` via DB | Database: `fuel_cell_default` config |
| Natural Gas Generator | ✅ FIXED - Already in DB, now used in code | Database: `generator_default.natural_gas_per_kw` |
| EV Chargers in Quote | ⚠️ Partially integrated via `industryData` | Needs full `evChargingCalculations.ts` integration |

**Dec 2025 Fixes Applied:**
1. ✅ `equipmentCalculations.ts` now accepts `options.generatorFuelType` (diesel/natural-gas/dual-fuel)
2. ✅ `equipmentCalculations.ts` now supports fuel cells via `options.fuelCellMW` and `options.fuelCellType`
3. ✅ `unifiedQuoteCalculator.ts` passes fuel type parameters through to equipment breakdown
4. ✅ `AdvancedQuoteBuilder.tsx` passes fuel type and fuel cell config to SSOT
5. ✅ Added `fuel_cell_default` pricing config to SEED_INITIAL_DATA.sql
6. ✅ **ALL generator fuel types default to `'natural-gas'`** (not diesel) - Fixed Dec 2025
7. ✅ `baselineService.ts` now uses database `custom_questions` table instead of hardcoded `USE_CASE_TEMPLATES`
8. ✅ `src/data/useCaseTemplates.ts` marked as **DEPRECATED** - Use `useCaseService` methods instead
9. ✅ All code defaults in `useCasePowerCalculations.ts` aligned with database values
10. ✅ Field name priority order fixed: DB column names (snake_case) checked first
11. ✅ **Solar pricing now uses scale-based pricing** - Dec 10, 2025
    - `getSolarPricing(solarMW)` now accepts optional size parameter
    - < 5 MW: `$0.85/W` (commercial) from `solar_default.commercial_per_watt`
    - ≥ 5 MW: `$0.65/W` (utility) from `solar_default.utility_scale_per_watt`
    - FIXED: StreamlinedWizard was using flat $2.50/W (SEIA rooftop) instead of scale-based

**Solar Pricing Standard (Dec 10, 2025):**
Solar uses **scale-based pricing** from `pricing_configurations.solar_default`:
- `commercial_per_watt`: $0.85/W (< 5 MW systems)
- `utility_scale_per_watt`: $0.65/W (≥ 5 MW systems)
- `small_scale_per_watt`: $1.10/W (optional, for < 100 kW residential)

⚠️ **DO NOT** use `calculation_constants.solar_cost_per_watt` ($2.50/W) - that's SEIA rooftop (fully installed with soft costs), not appropriate for direct cost estimates.

**Generator Fuel Type Standard (Dec 2025):**
ALL use cases default to `'natural-gas'` for generators. This is set in:
- `src/types/wizardState.ts` - fuelType default
- `src/hooks/useWizardFormState.ts` - initial state (2 places)
- `src/utils/equipmentCalculations.ts` - fallback
- `src/services/unifiedQuoteCalculator.ts` - default
- `src/services/unifiedPricingService.ts` - NREL_GENERATOR_PRICING
- `src/core/calculations/QuoteEngine.ts` - cache key

**Database Pricing Configs (in Supabase `pricing_configurations`):**
```sql
-- Solar (scale-based pricing) - Dec 2025 SSOT
'solar_default': {
  "commercial_per_watt": 0.85,      -- < 5 MW systems
  "utility_scale_per_watt": 0.65,   -- ≥ 5 MW systems
  "small_scale_per_watt": 1.10,     -- < 100 kW (optional)
  "tracking_upcharge": 0.08
}

-- Generator (all fuel types)
'generator_default': {
  "diesel_per_kw": 800,
  "natural_gas_per_kw": 700,
  "dual_fuel_per_kw": 900
}

-- Fuel Cell (all technology types)
'fuel_cell_default': {
  "hydrogen_per_kw": 3000,
  "natural_gas_fc_per_kw": 2500,
  "solid_oxide_per_kw": 4000,
  "installation_multiplier": 1.25
}
```

**PROTECTED FILES - DO NOT MODIFY WITHOUT REVIEW:**
- `advancedFinancialModeling.ts` - IRR-based pricing models
- `useCasePowerCalculations.ts` - Industry power standards
- `evChargingCalculations.ts` - EV charger specs and pricing
- `centralizedCalculations.ts` - Financial formulas
- `equipmentCalculations.ts` - Equipment pricing logic
- `professionalFinancialModel.ts` - Bank-ready 3-statement model
- `baselineService.ts` - Database-driven BESS sizing + calculateBESSSize()
- `dataIntegrationService.ts` - Unified API (uses baselineService)
- `marketDataIntegrationService.ts` - Market data from RSS/web sources (NEW Dec 10, 2025)
- `utilityRateService.ts` - Dynamic utility rate lookup (NEW Jan 2026)
- `itcCalculator.ts` - IRA 2022 Investment Tax Credit calculator (NEW Jan 2026)
- `equipmentPricingTiersService.ts` - Equipment pricing with markup (NEW Jan 2026)
- `batteryDegradationService.ts` - Cycle + calendar aging models (NEW Jan 2026)
- `pvWattsService.ts` - NREL PVWatts solar production (NEW Jan 2026)
- `hourly8760AnalysisService.ts` - Full year hourly dispatch simulation (NEW Jan 2026)
- `monteCarloService.ts` - Probabilistic P10/P50/P90 analysis (NEW Jan 2026)
- `marginPolicyEngine.ts` - **Commercial margin policy (NEW Feb 2026)** - DO NOT BYPASS

## 💰 MARGIN POLICY ENGINE (Feb 1, 2026)

**The commercial layer that transforms base costs into sell prices.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer A: Market/Base Pricing (SSOT - TrueQuote)                            │
│  ├── equipmentPricingTiersService.ts                                        │
│  ├── pricingTierService.ts                                                  │
│  └── collected_market_prices table                                          │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer B: MARGIN POLICY ENGINE (marginPolicyEngine.ts)                      │
│  ├── Deal size bands (scale discount curve)                                 │
│  ├── Product-class margins (BESS vs Solar vs EV)                            │
│  ├── Risk/complexity adjusters                                              │
│  ├── Customer segment adjusters (EPC partner, government)                   │
│  ├── Floor/ceiling guards (prevents insane quotes)                          │
│  └── Full audit trail for trust                                             │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 4/5/6 - Render sell prices (not math problems)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**KEY PRINCIPLE:**
- TrueQuote computes "base cost" (SSOT market truth)
- MarginPolicy applies "sell price policy" (commercialization)
- If we mix them, drift detection becomes impossible

**SINGLE INSERTION POINT (Feb 1, 2026):**
- `generateTrueQuoteV2()` in `truequoteV2Adapter.ts` calls `applyMarginPolicy()`
- This is the ONLY place margin is calculated
- WizardV6 Steps 4/5/6 consume `sellPriceTotal` from the envelope - NEVER compute margin themselves
- `QuoteCostsV2` now includes: `sellPriceTotal`, `baseCostTotal`, `marginDollars`

**v1.1.0 Improvements (Feb 1, 2026):**
- **maxMarginPercent is a HARD CAP**: Overrides band floor for competitive bids
- **Negative margin protection**: `sellPrice >= baseCost` invariant always
- **Quote-level guards with real enforcement**: `quoteUnits` input enables $/kWh_total checks
- **maxMarginCapApplied in audit trail**: Tracks when hard cap was applied

**Margin Bands by Deal Size:**
| Deal Size | Margin Range | Target |
|-----------|--------------|--------|
| <$500K (Micro) | 18-25% | 20% |
| $500K-$1.5M (Small) | 15-20% | 18% |
| $1.5M-$3M (Small+) | 10-15% | 12% |
| $3M-$5M (Mid) | 8-12% | 10% |
| $5M-$10M (Mid+) | 6-9% | 7.5% |
| $10M-$20M (Large) | 4-7% | 5.5% |
| $20M-$100M (Enterprise) | 2-5% | 3.5% |
| $100M+ (Mega) | 0.5-2% | 1.2% |

**Product-Class Multipliers:**
| Product | Multiplier | Reason |
|---------|------------|--------|
| BESS | 1.0x | Standard |
| Solar | 0.75x | Commoditized |
| EV Charger | 1.1x | Install complexity |
| Microgrid | 1.2x | High complexity |
| EMS Software | 1.25x | Software premium |
| Labor | +15% | Fixed adder |

**Usage in Code:**
```typescript
// RECOMMENDED: Use TrueQuoteV2 envelope (margin already applied)
import { generateTrueQuoteV2 } from '@/services/truequoteV2Adapter';

const envelope = await generateTrueQuoteV2(input);
// envelope.marginPolicy.sellPriceTotal ← Use this in UI
// envelope.outputs.costs.sellPriceTotal ← Also available here

// LOWER-LEVEL: Direct margin policy (for testing/custom scenarios)
import { applyMarginPolicy, estimateMargin } from '@/services/marginPolicyEngine';

const result = applyMarginPolicy({
  lineItems: [...],
  totalBaseCost: 2_000_000,
  riskLevel: 'standard',
  customerSegment: 'direct',
  maxMarginPercent: 0.08, // Optional: hard cap for competitive bids
  quoteUnits: { bess: 4000 }, // Optional: enables quote-level guards
});

// Quick UI preview
const { sellPrice, marginPercent, marginBand } = estimateMargin(2_000_000, 'bess');
```

**Database Tables (migration: `20260201_margin_policy_engine.sql`):**
- `margin_policy_bands` - Deal size → margin %
- `margin_policy_products` - Product-class multipliers
- `margin_policy_risk_adjusters` - Risk complexity adders
- `margin_policy_segment_adjusters` - Customer segment discounts
- `margin_policy_price_guards` - Floor/ceiling guards
- `margin_audit_log` - Audit trail

**Test Coverage (43 tests in `tests/integration/margin-policy.test.ts`):**
- Tier 0: Band selection (10 tests)
- Tier 1: Product multipliers (7 tests)
- Tier 2: Clamping behavior (4 tests)
- Tier 3: No double-margin invariant (4 tests)
- Tier 4: End-to-end quote policy (8 tests)
- Tier 5: Convenience functions (2 tests)
- Tier 6: Trust anchors (5 tests) - negative margin, hard cap, quote guards
- Price guard coverage (3 tests)

**DYNAMIC UTILITY RATES (Jan 14, 2026):**
Utility rates are now **dynamically fetched by zip code** via `utilityRateService.ts`:

**Functions:**
- `getUtilityRatesByZip(zipCode)` - Full utility data for a zip code
- `getCommercialRateByZip(zipCode)` - Simplified commercial rate lookup
- `getBESSSavingsOpportunity(zipCode)` - BESS ROI score by location

**Database Tables:**
- `utility_rates` - Cached rate data by zip code
- `utility_companies` - 31 major utilities (PG&E, ConEd, FPL, etc.)
- `utility_service_territories` - Zip-to-utility mapping

**Integration with calculateQuote():**
```typescript
// Now accepts zipCode for dynamic rate lookup
const result = await calculateQuote({
  storageSizeMW: 2.0,
  durationHours: 4,
  zipCode: '94102',  // NEW: Auto-fetches rates from EIA/NREL
  // electricityRate not needed - auto-looked up!
});

// Result includes rate attribution
result.metadata.utilityRates = {
  electricityRate: 0.2794,
  demandCharge: 25,
  utilityName: 'Pacific Gas & Electric',
  source: 'eia',
  confidence: 'high',
  state: 'CA',
};
```

**Data Sources:**
- EIA State Average Rates (2024) - All 50 states + DC
- Major utility rate schedules (30+ utilities)
- OpenEI integration ready (requires API key)

**DYNAMIC ITC CALCULATOR (Jan 14, 2026):**
ITC is now **calculated dynamically** per IRA 2022 rules via `itcCalculator.ts`:

**Previous:** Hardcoded 30% ITC for all projects
**Now:** 6-70% based on project type, labor compliance, location bonuses

**ITC Rate Structure (IRA 2022):**
| Component | Rate | Requirements |
|-----------|------|--------------|
| Base Rate | 6% | All projects |
| Prevailing Wage Bonus | +24% | Davis-Bacon wages + apprenticeship (projects ≥1 MW) |
| Energy Community Bonus | +10% | Coal closure, brownfield, or fossil fuel employment area |
| Domestic Content Bonus | +10% | 100% US steel, 40%+ US manufactured components |
| Low-Income Tier 1 | +10% | Located in low-income community (<5 MW) |
| Low-Income Tier 2 | +20% | Serves low-income residents (<5 MW) |

**Functions:**
- `calculateITC(input)` - Full ITC calculation with breakdown
- `estimateITC(type, cost, mw, pwa)` - Quick estimate for UI
- `isEnergyCommunity(zipCode)` - Check energy community status
- `getMaxITCRate(type)` - Maximum possible ITC for project type

**Example:**
```typescript
const itc = calculateITC({
  projectType: 'bess',
  capacityMW: 5.0,
  totalCost: 5_000_000,
  prevailingWage: true,
  apprenticeship: true,
  energyCommunity: 'coal-closure',
  domesticContent: true,
});
// Returns: { totalRate: 0.50, creditAmount: 2_500_000, ... }
```

**EQUIPMENT PRICING TIERS (Jan 14, 2026):**
Equipment pricing now supports **markup configuration** via `equipmentPricingTiersService.ts`:

**Markup Percentages:**
| Equipment Type | Markup |
|---------------|--------|
| EMS Software | 30% |
| Microgrid Controller | 25% |
| SCADA | 20% |
| Switchgear | 20% |
| Transformer | 18% |
| DC/AC Panels | 18% |
| BMS | 15% |
| Inverter/PCS | 15% |
| EV Charger | 15% |
| Global Default | 15% |
| BESS | 12% |
| ESS Enclosure | 12% |
| Generator | 12% |
| Solar | 10% |

**Functions:**
- `getEquipmentPrice(type, tier, size)` - Returns `{ price, priceWithMarkup, markupPercentage }`
- `getMarkupPercentage(equipmentType)` - Get markup % for equipment
- `getAllMarkupConfigs()` - List all markup configurations
- `updateMarkupConfig(type, percentage)` - Admin: update markup %

**BATTERY DEGRADATION SERVICE (Jan 14, 2026):**
Battery capacity degradation modeling via `batteryDegradationService.ts`:

**Previous:** Flat capacity assumed over 25 years
**Now:** Combined cycle + calendar aging per NREL/PNNL research

**Chemistry-Specific Parameters:**
| Chemistry | Calendar Aging | Cycles to 80% | Warranty |
|-----------|----------------|---------------|----------|
| LFP | 1.5%/year | 4,000 | 15 years |
| NMC | 2.0%/year | 2,500 | 10 years |
| NCA | 2.2%/year | 2,000 | 10 years |
| Flow (VRB) | 0.5%/year | 20,000 | 20 years |
| Sodium-Ion | 2.5%/year | 3,000 | 10 years |

**Functions:**
- `calculateDegradation(input)` - Full year-by-year capacity projection
- `estimateDegradation(chemistry, years)` - Quick estimate for UI
- `calculateDegradationFinancialImpact(degradation, revenue)` - NPV impact of degradation
- `calculateAugmentationStrategy(degradation, minCapacity)` - When to add capacity

**Example:**
```typescript
const degradation = calculateDegradation({
  chemistry: 'lfp',
  initialCapacityKWh: 4000,
  cyclesPerYear: 365,
  averageDoD: 0.8,
  projectYears: 25,
});
// Returns: { yearlyCapacity: [...], endOfLife: { finalCapacityPct: 62.3 }, ... }

// Calculate financial impact
const impact = calculateDegradationFinancialImpact(degradation, 500000);
// Returns: { degradationImpactPct: 18.5, withDegradationNPV: 4_100_000, ... }
```

**NREL PVWATTS INTEGRATION (Jan 14, 2026):**
Location-specific solar production via `pvWattsService.ts`:

**Previous:** Fixed capacity factor (20%) for all locations
**Now:** Location-specific production from NREL PVWatts API

**Regional Capacity Factors (fallback):**
| Region | Capacity Factor |
|--------|-----------------|
| Southwest (AZ, NM, NV) | 22-23% |
| California | 21% |
| Texas | 19% |
| Florida | 18% |
| Northeast | 13-14% |
| Pacific NW | 13-14% |
| Hawaii | 21% |

**Functions:**
- `getPVWattsEstimate(input)` - Full API call with monthly production
- `estimateSolarProduction(kW, state, arrayType)` - Quick estimate (no API)
- `calculateSolarBESSIntegration(solar, bess)` - Storage utilization metrics

**Example:**
```typescript
// Full API estimate
const solar = await getPVWattsEstimate({
  systemCapacityKW: 500,
  zipCode: '94102',
  arrayType: 2,  // 1-axis tracker
});
// Returns: { annualProductionKWh: 892340, capacityFactor: 20.4, monthlyProductionKWh: [...] }

// Quick estimate (no API call)
const quick = estimateSolarProduction(500, 'CA', 'tracker');
// Returns: { annualProductionKWh: 930000, capacityFactor: 26.6 }
```

**API Requirements:**
- Get free API key at: https://developer.nrel.gov/signup/
- Set `VITE_NREL_API_KEY` in environment variables
- Falls back to regional estimates if API unavailable

**8760 HOURLY ANALYSIS SERVICE (Jan 14, 2026):**
Full-year hourly simulation for accurate BESS financial analysis via `hourly8760AnalysisService.ts`:

**Previous:** Annual savings = simple multipliers (not time-of-use aware)
**Now:** 8760-hour simulation with TOU rates, load profiles, solar production

**Simulation Capabilities:**
- Time-of-Use (TOU) arbitrage: Buy low, sell/use high
- Peak shaving: Reduce demand charges during peaks
- Solar self-consumption: Store excess PV for later use
- Demand response: Revenue from grid services

**Load Profiles Available:**
| Profile Type | Description |
|-------------|-------------|
| commercial-office | 8am-6pm weekday peak |
| commercial-retail | 10am-9pm, higher weekends |
| industrial | Flat 24/7 with slight daytime increase |
| hotel | Morning and evening peaks |
| hospital | Relatively flat |
| data-center | Very flat 24/7 |
| ev-charging | Evening peak (commuter charging) |
| warehouse | Daytime operations only |

**Functions:**
- `run8760Analysis(input)` - Full year simulation with hourly dispatch
- `estimate8760Savings(bessKWh, bessKW, loadType, rate, demandCharge)` - Quick estimate

**Example:**
```typescript
const result = run8760Analysis({
  bessCapacityKWh: 4000,
  bessPowerKW: 1000,
  loadProfileType: 'commercial-office',
  annualLoadKWh: 2_000_000,
  peakDemandKW: 500,
  rateStructure: { type: 'tou', touPeriods: [...] },
  demandCharge: 20,
  strategy: 'hybrid',
});
// Returns: {
//   summary: { annualSavings, touArbitrageSavings, peakShavingSavings, ... },
//   monthly: [...],
//   hourlyDispatch: [...8760 hours...],
//   audit: { methodology, sources, ... }
// }
```

**MONTE CARLO SENSITIVITY SERVICE (Jan 14, 2026):**
Probabilistic analysis for bankable BESS project financials via `monteCarloService.ts`:

**Previous:** Point estimates don't capture uncertainty
**Now:** P10/P50/P90 scenarios, sensitivity tornado charts, risk metrics

**Variables Modeled:**
| Variable | Default Uncertainty |
|----------|-------------------|
| Electricity Rate | ±15% |
| Battery Degradation | ±20% |
| Capacity Factor | ±12% |
| Equipment Cost | ±10% |
| Demand Charges | ±15% |
| Solar Production | ±8% |

**Functions:**
- `runMonteCarloSimulation(input)` - Full 10,000 iteration simulation
- `estimateRiskMetrics(baseNPV, projectCost)` - Quick P10/P90 estimate

**Example:**
```typescript
const result = runMonteCarloSimulation({
  baseNPV: 2_500_000,
  baseIRR: 0.12,
  basePayback: 6.5,
  projectCost: 5_000_000,
  annualSavings: 500_000,
  iterations: 10000,
  itcConfig: { baseRate: 0.30, pwaRisk: 0.05 },
});
// Returns: {
//   percentiles: {
//     npv: { p10: 1_800_000, p50: 2_400_000, p90: 3_100_000 },
//     irr: { p10: 8.5, p50: 11.8, p90: 15.2 },
//     payback: { p10: 5.5, p50: 6.8, p90: 8.5 }
//   },
//   statistics: {
//     probabilityPositiveNPV: 92.5,
//     probabilityHurdleRate: 78.3,
//     valueAtRisk95: 1_200_000,
//   },
//   sensitivity: [...tornado chart data...],
//   distributions: { npv: [...histogram...], irr: [...] }
// }
```

**Risk Metrics Provided:**
- P10/P50/P90 for NPV, IRR, payback
- Probability of positive NPV
- Probability of achieving hurdle rate (8%)
- Value at Risk (VaR) at 95% confidence
- Conditional VaR (expected loss below VaR)
- Sensitivity ranking (tornado chart data)

**MARKET DATA SOURCES (Dec 10, 2025):**
RSS feeds and market data sources are now **database-driven** via `market_data_sources` table:
- `getMarketDataSources()` - Get all active sources
- `getRSSSourcesForEquipment(type)` - Get RSS feeds for specific equipment
- `getMarketAdjustedPrice(type, default, region)` - Get market-adjusted pricing
- `saveMarketPrice(data)` - Save extracted pricing data

**Database table**: `market_data_sources`
- Contains 40+ pre-seeded sources: NREL, BNEF, PV Magazine, Energy Storage News, etc.
- Equipment categories: `bess`, `solar`, `wind`, `generator`, `inverter`, `ev-charger`
- Source types: `rss_feed`, `api`, `web_scrape`, `data_provider`, `government`, `manufacturer`

**Migrations**:
- `database/migrations/20251210_market_data_sources.sql` - Core tables
- `database/migrations/20251210_add_bess_pricing_sources.sql` - 80+ BESS sources
- `database/migrations/20251210_add_solar_bess_carwash_sources.sql` - Solar, car wash vertical
- `database/migrations/20251210_expanded_equipment_scraping.sql` - All equipment types + scraping infrastructure

**DAILY MARKET SCRAPING SYSTEM (Dec 10, 2025):**

Automated daily scraping for market pricing and regulatory updates:

**Equipment Types Tracked:**
- BESS (battery energy storage), ESS, BMS
- Solar, Wind
- Generators (combustion, linear/Mainspring, fuel cells)
- Inverters, Transformers, Switchgear
- DC/AC Panels
- EV Chargers (Level 1, Level 2, DCFC, HPC)
- Microgrids, Hybrid Systems
- AI Energy Management

**Topics Tracked:**
- Pricing updates ($/kWh, $/W, $/kW)
- Regulations and incentives (ITC, PTC, IRA, tariffs)
- Net metering policies
- State/federal rebates

**Scraping Infrastructure:**

| Component | File | Purpose |
|-----------|------|---------|
| Service | `src/services/marketDataScraper.ts` | Core scraping logic, RSS parsing, price extraction |
| Script | `scripts/run-daily-scrape.ts` | CLI runner for local/CI execution |
| Edge Function | `supabase/functions/daily-market-scrape/index.ts` | Supabase cron job |
| GitHub Action | `.github/workflows/daily-market-scrape.yml` | 6 AM UTC daily trigger |

**Database Tables:**
- `market_data_sources` - 140+ configured sources
- `scraped_articles` - Fetched content with NLP classification
- `collected_market_prices` - Extracted pricing data points
- `regulatory_updates` - Tax credits, rebates, tariffs
- `scrape_jobs` - Job scheduling and tracking

**Key Functions:**
```typescript
import { runDailyScrape, classifyContent, extractPrices } from '@/services/marketDataScraper';

// Run full daily scrape
const results = await runDailyScrape();
// Returns: { sourcesProcessed, articlesFound, articlesSaved, pricesExtracted, errors }

// Classify content for equipment mentions
const { equipment, topics, relevanceScore } = classifyContent(articleText);

// Extract prices from text
const prices = extractPrices(text, ['bess', 'solar']);
// Returns: [{ equipment: 'bess', price: 125, unit: 'kWh', confidence: 0.8 }]
```

**Running the Scraper:**
```bash
# Local development
npx tsx scripts/run-daily-scrape.ts

# Via GitHub Actions (automatic daily at 6 AM UTC)
# Or manual trigger from Actions tab

# Via Supabase cron (deploy edge function first)
supabase functions deploy daily-market-scrape
```

**PRICING POLICIES (Dec 10, 2025):**
Database-driven pricing weights for market data aggregation:

**Database table**: `pricing_policies`
- Defines how to weight different data sources
- Industry floor/ceiling bounds from NREL/BNEF
- Regional multipliers for different markets

**Key columns:**
- `source_weights` - JSON: how much to trust each source type (government=35, data_provider=30, manufacturer=20, etc.)
- `frequency_weights` - JSON: recency weights (daily=0.95, weekly=0.85, monthly=0.70)
- `industry_floor/ceiling` - Price bounds from authoritative sources
- `industry_guidance_weight` - How much to blend market data with industry guidance (0.40 = 40%)
- `regional_multipliers` - Price adjustments by region (europe=1.15, asia-pacific=0.85)

**Service functions** (in `marketDataIntegrationService.ts`):
- `getPricingPolicies(equipmentType?)` - Get all active policies
- `getActivePricingPolicy(equipmentType)` - Get policy for specific equipment
- `calculateWeightedPrice(type, region, capacity)` - Calculate weighted average using policy
- `saveCollectedPrice(data)` - Save extracted price point
- `getCollectedPrices(type, options)` - Get collected prices with filters
- `verifyCollectedPrice(id, notes)` - Admin: verify a price point

**Database table**: `collected_market_prices`
- Stores individual price points extracted from sources
- Links to `market_data_sources` via `source_id`
- Tracks confidence, verification, extraction method

**Example: Calculate weighted BESS price:**
```typescript
import { calculateWeightedPrice } from '@/services/marketDataIntegrationService';

const result = await calculateWeightedPrice('bess', 'north-america', 5.0);
// Returns: {
//   weightedPrice: 112.50,  // $/kWh (Dec 2025 market rate)
//   sampleCount: 15,
//   confidence: 0.85,
//   floorPrice: 100,        // Current market minimum
//   ceilingPrice: 175,      // Market ceiling
//   priceRangeLow: 95.63,   // -15%
//   priceRangeHigh: 129.38  // +15%
// }
```

**BESS Pricing Standard (Dec 2025):**
BESS is now **$100-125/kWh** based on latest vendor quotes and pricing sheets.
- Floor: $100/kWh (competitive utility-scale)
- Ceiling: $175/kWh (includes installation margin)
- Typical: $110-125/kWh for 4-hour systems

**DEPRECATED - DO NOT USE:**
- ❌ `bessDataService.calculateBESSFinancials()` - Use `unifiedQuoteCalculator.calculateQuote()`
- ❌ `pricingService.calculateROI()` - Use `centralizedCalculations.calculateFinancialMetrics()`
- ❌ `marketIntelligence.simplePayback` - Use `calculateFinancialMetrics().paybackYears`
- ❌ `InteractiveConfigDashboard` hardcoded prices - Use `calculateEquipmentBreakdown()`
- ❌ ANY hardcoded $/kWh values - Use `getBatteryPricing()` from unifiedPricingService
- ❌ "Level 3 chargers" - **NO SUCH THING** - Use DCFC or HPC
- ❌ `src/data/useCaseTemplates.ts` - **DEPRECATED Dec 2025** - Use `useCaseService` methods instead
- ❌ Hardcoded `RSS_SOURCES` array - Use database `market_data_sources` table

**FORBIDDEN PATTERNS:**
```typescript
// ❌ NEVER do this in components:
const cost = storageSizeMW * durationHours * 300000; // Hardcoded pricing!
const payback = cost / savings; // Manual calculation!
const demandChargeSavings = storageSizeMW * 1000 * demandCharge * 12; // Rogue calculation!

// ❌ NEVER call calculateFinancialMetrics() directly from components:
import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
const financials = await calculateFinancialMetrics({...}); // WRONG - misses equipment costs!

// ✅ ALWAYS do this:
import { calculateQuote } from '@/services/unifiedQuoteCalculator';
const quote = await calculateQuote({ storageSizeMW, durationHours, ... });
// Use quote.financials.paybackYears, quote.costs.netCost, etc.
// This orchestrates BOTH equipment pricing AND financial metrics correctly
```

**SSOT VIOLATION AUDIT (Dec 2025):**
- ✅ `AdvancedQuoteBuilder.tsx` - FIXED to use `calculateQuote()`
- ✅ `StreamlinedWizard.tsx` - FIXED Dec 5, 2025: Now passes generatorMW, generatorFuelType, gridConnection, windMW + has Grid Connection UI
- ✅ `HotelWizard.tsx` - FIXED to pass generatorMW + gridConnection + has Mode Selector
- ✅ `CarWashWizard.tsx` - FIXED Dec 2025: has quoteMode + gridConnection state + Mode Selector UI
- ✅ `EVChargingWizard.tsx` - FIXED Dec 2025: has quoteMode + gridConnection state + Mode Selector UI
- ✅ `HotelEnergy.tsx` - FIXED Dec 6, 2025: Uses `calculateHotelPowerSimple()` from SSOT
- ✅ `CarWashEnergy.tsx` - FIXED Dec 6, 2025: Uses `calculateCarWashPowerSimple()` from SSOT
- ✅ `EVChargingEnergy.tsx` - FIXED Dec 6, 2025: Uses `calculateEVChargingPowerSimple()` from SSOT
- ⚠️ `InteractiveConfigDashboard.tsx` - Needs audit for direct calculation calls
- ⚠️ `QuoteResultsPanel.tsx` - Needs audit for rogue calculations

**USE CASES IN DATABASE (26 total, 21 active after Dec 11, 2025 cleanup):**
All these use cases flow through StreamlinedWizard → calculateQuote():

| DB Slug | Name | Category | Questions | Configs | Status |
|---------|------|----------|-----------|---------|--------|
| `apartment` | Apartment Complex | Residential | 16 | 1 | ✅ SSOT |
| `car-wash` | Car Wash | Commercial | 16 | 1 | ✅ SSOT (also has CarWashWizard) |
| `warehouse` | Warehouse & Logistics | Industrial | 16 | 1 | ✅ SSOT |
| `data-center` | Data Center | Commercial | 8 | 1 | ✅ SSOT |
| `ev-charging` | EV Charging Station | Commercial | 16 | 1 | ✅ SSOT (also has EVChargingWizard) |
| `gas-station` | Gas Station | Commercial | 16 | 1 | ✅ SSOT |
| `hospital` | Hospital | Institutional | 16 | 1 | ✅ SSOT |
| `hotel` | Hotel | Commercial | 16 | 2 | ✅ SSOT (also has HotelWizard) |
| `indoor-farm` | Indoor Farm | Agricultural | 16 | 1 | ✅ SSOT |
| `manufacturing` | Manufacturing Facility | Industrial | 16 | 1 | ✅ SSOT |
| `microgrid` | Microgrid & Renewable | Commercial | 16 | 1 | ✅ SSOT (Premium) |
| `office` | Office Building | Commercial | 16 | 3 | ✅ SSOT |
| `government` | Government & Public | Institutional | 16 | 1 | ✅ SSOT (Premium) |
| `residential` | Residential | Residential | 16 | 1 | ✅ SSOT |
| `retail` | Retail & Commercial | Commercial | 16 | 1 | ✅ SSOT |
| `shopping-center` | Shopping Center/Mall | Commercial | 16 | 1 | ✅ SSOT |
| `college` | College & University | Institutional | 16 | 1 | ✅ SSOT (Premium) |
| `airport` | Airport | Institutional | 16 | 1 | ✅ SSOT (Premium) |
| `casino` | Casino & Gaming | Commercial | 16 | 1 | ✅ SSOT (Premium) |
| `agricultural` | Agricultural | Agricultural | 16 | 1 | ✅ SSOT (Premium) |
| `cold-storage` | Cold Storage | Industrial | 16 | 1 | ✅ SSOT (Premium) |

**CLEANED UP (Dec 11, 2025):**
| DB Slug | Action | Reason |
|---------|--------|--------|
| `ev-fast-charging` | ❌ DELETED | Duplicate of `ev-charging` |
| `peak-shaving-commercial` | ⏸️ DEACTIVATED | Application type → use `primaryBESSApplication` question |
| `energy-arbitrage-utility` | ⏸️ DEACTIVATED | Application type → use `primaryBESSApplication` question |
| `backup-critical-infrastructure` | ⏸️ DEACTIVATED | Application type → use `primaryBESSApplication` question |
| `hotel-hospitality` | ⏸️ INACTIVE | Duplicate of `hotel` |

See `CALCULATION_FILES_AUDIT.md` for complete architecture documentation.

**NEW: `primaryBESSApplication` Question (Dec 11, 2025):**
Added to all 21 active use cases. Options:
- `peak_shaving` - Reduce demand charges during peak periods (default)
- `energy_arbitrage` - Buy low, sell/use high (time-of-use optimization)
- `backup_power` - Critical load protection during outages
- `demand_response` - Participate in utility DR programs for revenue
- `renewable_integration` - Maximize solar/wind self-consumption
- `load_shifting` - Move energy consumption to off-peak hours
- `frequency_regulation` - Grid services revenue (utility scale)
- `stacked` - Multiple applications (advanced)

**SSOT DEFAULTS (Aligned Dec 2025):**
Code defaults in `useCasePowerCalculations.ts` MUST match database `custom_questions` defaults:

| Use Case | Field | Default Value | Source |
|----------|-------|---------------|--------|
| hotel | roomCount | 150 | DB `custom_questions` |
| hospital | bedCount | 200 | DB `custom_questions` |
| warehouse | warehouseSqFt | 200,000 | DB `custom_questions` |
| apartment | unitCount | 100 | DB `custom_questions` |
| car-wash | bayCount | 4 | DB `custom_questions` |
| manufacturing | squareFootage | 100,000 | DB `custom_questions` |
| airport | annualPassengers | 5,000,000 | DB `custom_questions` |
| casino | gamingFloorSqft | 100,000 | DB `custom_questions` |
| ev-charging | level2Chargers / dcfcChargers | 12 / 8 | DB `custom_questions` |

---

## Project Overview

Merlin is a Battery Energy Storage System (BESS) financial analysis and quote generation platform. React + TypeScript + Vite frontend with Supabase backend, deployed on Fly.io.

## Architecture Patterns

### Service Layer is Source of Truth
**Critical**: All business logic lives in `src/services/`, NOT in components.

- `useCasePowerCalculations.ts` - **ALL power/demand calculations** (NEW)
- `centralizedCalculations.ts` - All financial calculations (NPV, IRR, ROI, payback)
- `baselineService.ts` - Database-driven baseline recommendations
- `useCaseService.ts` - Database interface for use case templates
- `equipmentCalculations.ts` - Equipment breakdown and pricing
- `advancedFinancialModeling.ts` - Professional-grade DCF analysis

**Never** implement calculation logic in components. Always extend or use services.

### Import Path Convention
Use `@/` alias for all imports from `src/`:
```typescript
import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
import { calculateUseCasePower } from '@/services/useCasePowerCalculations';
import type { CustomQuestion } from '@/types/useCase.types';
```

Configured in `vite.config.ts` and `tsconfig.json`. Never use relative paths like `../../../services`.

### Modal System - Use ModalRenderer
Two modal systems exist, but **only use ModalRenderer.tsx**:
- ✅ `src/components/modals/ModalRenderer.tsx` - Current, working system
- ❌ `src/components/modals/ModalManager.tsx` - Legacy with prop mismatches

Modal state managed via `useModalManager` hook. Add new modals to `ModalRenderer` only.

### Database Integration
Supabase is the backend. Connection configured via `.env`:
```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Database interactions go through `src/services/useCaseService.ts`. Core tables:
- `use_cases` - Industry templates (30+ use cases with tier restrictions)
- `use_case_configurations` - Sizing presets by scale
- `equipment_templates` - Equipment specifications
- `saved_quotes` - User quote portfolio
- `users` - Auth + tier management (FREE/PREMIUM/ADMIN)

### Type Safety
Types centralized in `src/types/index.ts`. Always update types when adding fields:
```typescript
// CORRECT: Add to central types first
interface FinancialCalculationInput {
  systemCost: number;
  annualSavings: number;
  // ... new field here
}
```

## Critical Calculation Flow

**Calculation Hierarchy** (preserve fast paths, validate accuracy):

1. User inputs → `useCaseService.ts` fetches template
2. Template + answers → `baselineService.ts` calculates sizing (✅ PROTECTED)
3. Sizing + region → `unifiedPricingService.ts` gets equipment costs (✅ PROTECTED)
4. **Fast path**: Components calculate quick results for immediate UI feedback
5. **Validation**: Compare with `centralizedCalculations.ts` in development (non-blocking)
6. **Enhanced metrics**: Optional async call for NPV/IRR/advanced metrics (when needed)

**Example**:
```typescript
// In StreamlinedWizard.tsx or any component
const baseline = await calculateDatabaseBaseline(template, answers);
const pricing = await getBatteryPricing(baseline.bessKwh);

// ✅ CRITICAL: Always call centralizedCalculations for financials
import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
const financials = await calculateFinancialMetrics({
  storageSizeMW: baseline.powerMW,
  durationHours: baseline.durationHrs,
  electricityRate: 0.12,
  solarMW: solarMWp,
  equipmentCost: pricing.totalCost,
  installationCost: pricing.installation,
  includeNPV: true  // Get NPV, IRR, discounted payback
});

// Now use financials.npv, financials.irr, financials.paybackYears, etc.
```

**What `calculateFinancialMetrics()` returns**:
- Simple metrics: `paybackYears`, `roi10Year`, `roi25Year`
- Advanced metrics: `npv`, `irr`, `discountedPayback`, `levelizedCostOfStorage`
- All costs: `equipmentCost`, `totalProjectCost`, `netCost` (after tax credits)
- All savings: `peakShavingSavings`, `demandChargeSavings`, `annualSavings`
- Database-sourced constants (never hardcoded values)

## Tier System & Feature Gating

Three user tiers with distinct capabilities:

- **FREE**: 5 basic use cases, 3 saved quotes, simple export
- **PREMIUM**: All 30+ use cases, unlimited saves, Word/Excel export with appendices
- **ADMIN**: Full access + admin panel, vendor management, pricing controls

Check tier before showing features:
```typescript
const user = authService.getCurrentUser();
if (user?.tier === 'PREMIUM' || user?.tier === 'ADMIN') {
  // Show advanced features
}
```

## Common Workflows

### Adding a New Use Case
1. Add to Supabase `use_cases` table (SQL or admin panel)
2. Create custom questions in `use_case_configurations`
3. Add baseline calculations to `baselineService.ts` if industry-specific
4. Test with StreamlinedWizard (at `/wizard` route)

### Modifying Financial Calculations
1. **DO NOT MODIFY** protected services: `advancedFinancialModeling.ts`, `baselineService.ts`, `unifiedPricingService.ts`
2. For new calculations: Add validation using `calculationValidator.ts` (see CALCULATION_RECONCILIATION_STRATEGY.md)
3. Only replace deprecated calls: `bessDataService.calculateBESSFinancials()` in `dataIntegrationService.ts`
4. Add tests that validate within 5% tolerance
5. **Pre-launch**: Zero breaking changes allowed

### Adding UI Components
1. Create in appropriate `src/components/` subdirectory
2. Use TypeScript, define prop interfaces
3. Import types from `@/types/`
4. Connect to services, never implement logic
5. For modals: add to ModalRenderer + useModalManager hook

## Testing & Build

```bash
npm run dev              # Local dev server (port 5178)
npm run build            # TypeScript check + Vite build
npm run safe-build       # Backup + build
flyctl deploy            # Deploy to production
```

**Always** run `npm run build` before committing to catch type errors.

## Known Gotchas

1. **Calculation Duplication**: Don't create new calculation functions. **ALWAYS** use `centralizedCalculations.ts`:
   ```typescript
   // ❌ NEVER create manual calculations
   const payback = cost / savings;
   
   // ✅ ALWAYS use centralized service
   import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
   const result = await calculateFinancialMetrics({ storageSizeMW, durationHours, ... });
   ```

2. **Deprecated Services - DO NOT USE**:
   - ✅ `bessDataService.getBESSFinancialInputs()` - NOW database-driven (fixed Nov 2025)
   - ⚠️ `bessDataService.calculateBESSFinancials()` - uses database inputs via getBESSFinancialInputs()
   - ❌ `industryStandardFormulas.calculateFinancialMetrics()` - name conflict, deprecated
   - ✅ **Use `centralizedCalculations.calculateFinancialMetrics()` for ALL financial calculations**

3. **Wizard Architecture (REFACTORED Dec 11, 2025)**:
   - ✅ **StreamlinedWizard** is MODULAR — 280 lines (was 4,677 lines)
   - See **STREAMLINED WIZARD ARCHITECTURE** section below for full details
   - **Vertical landing pages** (HotelEnergy, CarWashEnergy, EVChargingEnergy) use StreamlinedWizard with `initialUseCase` prop

4. **Modal Props**: ModalManager has 20+ prop type errors. Use ModalRenderer for all new modals.

5. **Database Sizing**: EV Charging has special sizing logic in `baselineService.ts` (user kW input overrides template).

6. **Region Pricing**: Different pricing by region (North America, Europe, Asia, Middle East). Use `unifiedPricingService.ts` which handles regional variations.

---

## 🧙‍♂️ STREAMLINED WIZARD ARCHITECTURE (Dec 11, 2025)

**The StreamlinedWizard was refactored from 4,677 lines to 280 lines via modular extraction.**

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         StreamlinedWizard.tsx                               │
│                      (~280 lines - Lean Orchestrator)                       │
│                                                                             │
│  - Renders header, sidebar, and section components                          │
│  - Manages section navigation (progress indicators)                         │
│  - Passes all state from useStreamlinedWizard hook                          │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    useStreamlinedWizard.ts Hook                             │
│                      (~633 lines - State + Effects)                         │
│                                                                             │
│  - All 20+ useState hooks centralized                                       │
│  - All useEffect hooks for data sync                                        │
│  - Callbacks: generateQuote(), handleIndustrySelect(), etc.                 │
│  - Integrates with QuoteEngine.generateQuote() for SSOT                     │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│  constants/        │  │  types/            │  │  sections/         │
│  wizardConstants.ts│  │  wizardTypes.ts    │  │  (6 section files) │
│  (294 lines)       │  │  (284 lines)       │  │                    │
│                    │  │                    │  │  ├─ Section 0:     │
│  GOAL_OPTIONS      │  │  WizardState       │  │  │  WelcomeLoc...  │
│  FACILITY_PRESETS  │  │  DEFAULT_STATE     │  │  ├─ Section 1:     │
│  US_STATES         │  │  RFQFormState      │  │  │  IndustrySec... │
│  SOLAR/WIND_PRESETS│  │  Section Props     │  │  ├─ Section 2:     │
│                    │  │  CustomQuestion    │  │  │  FacilityDet... │
└────────────────────┘  └────────────────────┘  │  ├─ Section 3:     │
                                                │  │  GoalsSection   │
                                                │  ├─ Section 4:     │
                                                │  │  Configuration  │
                                                │  └─ Section 5:     │
                                                │     QuoteResults   │
                                                └────────────────────┘
```

### File Structure

```
src/components/wizard/
├── StreamlinedWizard.tsx        # 280 lines - Orchestrator
├── constants/
│   ├── index.ts                 # Re-exports
│   └── wizardConstants.ts       # 294 lines - All shared constants
├── types/
│   ├── index.ts                 # Re-exports
│   └── wizardTypes.ts           # 284 lines - State & prop types
├── hooks/
│   ├── index.ts                 # Re-exports
│   └── useStreamlinedWizard.ts  # 633 lines - All state management
├── sections/
│   ├── index.ts                 # Re-exports all sections
│   ├── WelcomeLocationSection.tsx    # Section 0: Location
│   ├── IndustrySection.tsx           # Section 1: Use case selection
│   ├── FacilityDetailsSection.tsx    # Section 2: Custom questions
│   ├── GoalsSection.tsx              # Section 3: Goals + add-ons
│   ├── ConfigurationSection.tsx      # Section 4: System sizing
│   └── QuoteResultsSection.tsx       # Section 5: Results + export
└── _deprecated/
    ├── StreamlinedWizard.legacy.tsx  # Original 4,677 lines (archived)
    ├── SmartWizardModal.tsx          # Legacy modal
    └── SmartWizardUseCases.tsx       # Legacy use case picker
```

### SSOT Compliance

The hook's `generateQuote()` callback calls the SSOT:

```typescript
// useStreamlinedWizard.ts - generateQuote callback
const result = await QuoteEngine.generateQuote({
  storageSizeMW: wizardState.batteryKW / 1000,
  durationHours: wizardState.durationHours,
  location: wizardState.state,
  electricityRate: wizardState.electricityRate,
  useCase: wizardState.selectedIndustry,
  solarMW: wizardState.solarKW / 1000,
  windMW: wizardState.windTurbineKW / 1000,
  generatorMW: wizardState.generatorKW / 1000,
  generatorFuelType: fuelTypeMap[wizardState.generatorFuel] || 'natural-gas',
  gridConnection: gridMap[wizardState.gridConnection] || 'on-grid',
});
```

### Importing Components

```typescript
// From orchestrator or other files:
import StreamlinedWizard from '@/components/wizard/StreamlinedWizard';

// From sections (for testing or extension):
import { GoalsSection, ConfigurationSection } from '@/components/wizard/sections';

// From types (for TypeScript):
import type { WizardState, GoalsSectionProps } from '@/components/wizard/types';

// From constants (for reuse):
import { GOAL_OPTIONS, US_STATES, FACILITY_PRESETS } from '@/components/wizard/constants';

// From hooks (for custom wizard implementations):
import { useStreamlinedWizard } from '@/components/wizard/hooks';
```

### Key Benefits

| Metric | Before | After |
|--------|--------|-------|
| Main file lines | 4,677 | 280 |
| useState hooks | 20+ scattered | Centralized in hook |
| useEffect hooks | 12+ scattered | Organized in hook |
| Testability | Difficult | Each section testable |
| Reusability | None | Constants/types shared |

### Deprecated Files (DO NOT IMPORT)

```typescript
// ❌ NEVER import from _deprecated/
import StreamlinedWizard from './wizard/_deprecated/StreamlinedWizard.legacy';

// ✅ ALWAYS use the new modular version:
import StreamlinedWizard from '@/components/wizard/StreamlinedWizard';
```

---

## 🧙‍♂️ WIZARDV6 ARCHITECTURE (Jan 2026)

**WizardV6 is the CURRENT PRODUCTION WIZARD** (as of Dec 28, 2025).

**Routes:** `/wizard` and `/wizard-v6`  
**Main File:** `src/components/wizard/v6/WizardV6.tsx` (2,674 lines)  
**Architecture:** Comprehensive 6-step wizard with advisor-led UX

### WizardV6 Architecture

```
wizard/
├── v6/                           ✅ ACTIVE - Production wizard
│   ├── WizardV6.tsx             Main orchestrator (2,674 lines)
│   ├── types.ts                 State types, constants, confidence model
│   ├── constants.ts             Wizard configuration
│   │
│   ├── steps/                   ✅ Step components (6 steps)
│   │   ├── Step1AdvisorLed.tsx      ✅ Advisor-led location/industry (Jan 19)
│   │   ├── EnhancedStep2Industry.tsx
│   │   ├── Step3Details.tsx         ✅ Database-driven questionnaire
│   │   ├── Step4Options.tsx     
│   │   ├── Step5MagicFit.tsx    
│   │   └── Step6Quote.tsx       
│   │
│   ├── advisor/                 MerlinAdvisor rail system (Jan 16)
│   │   ├── AdvisorRail.tsx      
│   │   ├── AdvisorPublisher.tsx 
│   │   └── PowerGaugeWidget.tsx 
│   │
│   ├── micro-prompts/           Micro-interaction components
│   ├── inputs/                  Form input components
│   ├── layout/                  Layout components
│   ├── shared/                  Shared v6 components
│   ├── step3/                   Step 3 utilities
│   └── utils/                   Utility functions
│
├── shared/                       ✅ Shared across wizard versions
│   └── WizardBottomAdvisor.tsx  Bottom advisor component
│
├── _archive-jan-2026/            ❌ DEPRECATED - Reference only
│   ├── README.md                Explains deprecation reasons
│   ├── Step3HotelEnergy.tsx     Old industry-specific component
│   └── EnhancedLocationStep.v2.tsx  Old location step (Jan 21)
│
└── [Root TSX files]              ⚠️ Integration/support components
    ├── CompleteStep3Component.tsx      Database-driven Step 3
    ├── CompleteQuestionRenderer.tsx    Question rendering logic
    ├── Step3Integration.tsx            Step 3 SSOT enforcement
    ├── IndustryOpportunityPanel.tsx    Industry insights
    ├── CompleteSolarPreviewCard.tsx    Solar configuration
    ├── CarWash16QVisuals.tsx          Car wash visuals
    ├── QuestionIconMap.tsx            Question icon mapping
    ├── ProgressSidebar.tsx            (Orphaned - candidate for removal)
    └── carWashIntegration.ts          Car wash data mapping
```

### Key Integration Flow (Step 3 Questionnaire)

```
WizardV6.tsx
    ↓ (renders)
v6/steps/Step3Details.tsx (thin wrapper)
    ↓ (delegates to)
Step3Integration.tsx (SSOT enforcement - no derived fields)
    ↓ (renders)
CompleteStep3Component.tsx (DB-driven questionnaire for ALL industries)
    ├── CompleteQuestionRenderer.tsx (polymorphic question types)
    └── IndustryOpportunityPanel.tsx (industry insights)
    ↓ (loads questions from)
Database: custom_questions table (21 active use cases)
```

### Recent WizardV6 Updates (Jan 2026)

**Jan 21, 2026: TrueQuote™ Phase 5**
- Integrated `computeTrueQuoteSizing()` from `truequote.ts`
- Added confidence modeling via `calculateModelConfidence()`

**Jan 19, 2026: Advisor-Led Step 1**
- Replaced old location step with `Step1AdvisorLed.tsx`
- 2-panel design: Conversational advisor + clean form panel
- Progressive complexity disclosure

**Jan 18, 2026: Intelligence Layer**
- Added adaptive UX via `intelligence.ts` service
- Integrated Site Score™ calculator
- Context-aware goal suggestions

**Jan 16, 2026: MerlinAdvisor Rail**
- Added `AdvisorRail.tsx` and `AdvisorPublisher.tsx`
- Real-time advisor updates based on user inputs

### WizardV6 is Used By:

1. **Main App Router** (`/App.tsx`) - Routes `/wizard` and `/wizard-v6`
2. **Vertical Landing Pages:**
   - `CarWashEnergy.tsx` - Can launch WizardV6
   - `EVChargingEnergy.tsx` - Can launch WizardV6
   - `HotelEnergy.tsx` - Can launch WizardV6
3. **Modal System** (`ModalManager.tsx`) - Opens wizard in modal

### WizardV6 vs StreamlinedWizard

| Feature | WizardV6 | StreamlinedWizard |
|---------|----------|-------------------|
| **Status** | ✅ Production (Jan 2026) | ⚠️ Legacy/Alternative |
| **Lines** | 2,674 (monolithic) | 280 (modular) |
| **Architecture** | Single-file orchestrator | Hook-based modular |
| **Advisor UX** | ✅ Advisor rail + micro-prompts | Basic |
| **Intelligence** | ✅ Intelligence layer | No |
| **Site Score™** | ✅ Yes | No |
| **TrueQuote™** | ✅ Phase 5 integration | Basic |
| **Step 3** | DB-driven (21 industries) | DB-driven (21 industries) |
| **Routes** | `/wizard`, `/wizard-v6` | N/A (not routed) |

**⚠️ NOTE:** StreamlinedWizard was documented in Dec 2025 as refactored from 4,677→280 lines, but WizardV6 is the actual production wizard in Jan 2026. StreamlinedWizard may be an experimental branch or alternative implementation.

### DO NOT MODIFY WITHOUT REVIEW:

**Critical WizardV6 Files:**
- `v6/WizardV6.tsx` - Main orchestrator
- `v6/types.ts` - State management contract
- `v6/steps/Step3Details.tsx` - Questionnaire integration
- `Step3Integration.tsx` - SSOT enforcement
- `CompleteStep3Component.tsx` - Database-driven questions

**See Also:**
- `/src/components/wizard/WIZARD_ARCHITECTURE.md` - Full architecture doc
- `/src/components/wizard/ROOT_COMPONENTS_README.md` - Root component guide
- `/src/components/wizard/_archive-jan-2026/README.md` - Deprecated components

---

## 🏢 VERTICAL WIZARD STANDARDS (Dec 2025)

**All vertical wizards MUST follow these standards for SSOT compliance:**

### Required calculateQuote() Parameters

Every vertical wizard's `generateQuote()` function MUST pass ALL of these to `calculateQuote()`:

```typescript
const result = await calculateQuote({
  storageSizeMW: Math.max(0.1, storageSizeMW),
  durationHours,
  location: state,
  electricityRate: stateData.rate,
  useCase: 'vertical-slug',  // e.g., 'hotel', 'car-wash', 'ev-charging'
  
  // ⚠️ REQUIRED: Renewables/generators (even if 0)
  solarMW: hasSolar ? solarKW / 1000 : 0,
  generatorMW: hasGenerator ? generatorKW / 1000 : 0,
  generatorFuelType: 'diesel' | 'natural-gas' | 'dual-fuel',  // Based on vertical
  gridConnection: 'on-grid' | 'off-grid' | 'limited',
  
  // ⚠️ OPTIONAL: Fuel cells (if vertical supports)
  fuelCellMW: hasFuelCell ? fuelCellKW / 1000 : 0,
  fuelCellType: 'hydrogen' | 'natural-gas-fc' | 'solid-oxide',
});
```

### Vertical-Specific Generator Fuel Types
| Vertical | Default Fuel Type | Reason |
|----------|------------------|--------|
| Hotel | `diesel` | Traditional backup power, reliable |
| Car Wash | `natural-gas` | Cleaner, quieter for customer-facing |
| EV Charging | `natural-gas` | Lower emissions at charging station |
| Hospital | `diesel` | Critical backup, proven reliability |
| Data Center | `natural-gas` | Lower emissions, continuous operation |

### Required UI Features (Updated Dec 6, 2025)

| Feature | Component | StreamlinedWizard | HotelWizard | CarWashWizard | EVChargingWizard |
|---------|-----------|-------------------|-------------|---------------|------------------|
| **Mode Selector** | `quoteMode` state + inline UI | N/A (uses `onOpenAdvanced` prop) | ✅ Has | ✅ Has | ✅ Has |
| **Grid Connection State** | `gridConnection` state | ✅ Simple string type | ✅ Full object | ✅ Full object | ✅ Full object |
| **Grid Connection UI** | User-facing grid status selector | ✅ Has | ✅ Has | ✅ ADDED Dec 6 | ✅ ADDED Dec 6 |
| **Power Profile** | `WizardPowerProfile` from shared | ✅ PowerProfileTracker | ✅ | ✅ | ✅ |
| **Step Help** | `WizardStepHelp` from shared | N/A (has own help) | ✅ | ✅ | ✅ |
| **Export** | `generatePDF/Word/Excel` from `@/utils/quoteExport` | ✅ | ⚠️ Manual | ⚠️ Manual | ✅ Uses shared |

**Note**: StreamlinedWizard has different architecture:
- Uses `onOpenAdvanced` prop for Pro mode (button in header)
- Uses simple `gridConnection: 'on-grid' | 'off-grid' | 'limited'` that matches SSOT `calculateQuote()` interface directly
- Has Grid Connection selector UI in Section 3 (Goals & Preferences)

### Mode Selector Pattern (ALL VERTICALS NOW HAVE)

```tsx
// State
const [quoteMode, setQuoteMode] = useState<'select' | 'pro' | 'guided'>('select');

// In content area:
{quoteMode === 'select' && (
  // Mode selection screen - Pro vs Guided
)}

{quoteMode === 'pro' && (
  // Pro mode redirect to advanced builder
)}

{quoteMode === 'guided' && currentStep === 0 && (
  // Guided wizard step 0
)}
```

### Grid Connection State Pattern (ALL VERTICALS NOW HAVE)

```tsx
// State
const [gridConnection, setGridConnection] = useState({
  status: 'grid-tied' as 'grid-tied' | 'off-grid' | 'grid-backup-only',
  gridReliability: 'reliable' as 'reliable' | 'occasional-outages' | 'frequent-outages' | 'unreliable',
  gridCostConcern: false,
  wantGridIndependence: false,
});

// In generateQuote():
const gridConnectionType = gridConnection.status === 'off-grid' ? 'off-grid' : 
                           gridConnection.status === 'grid-backup-only' ? 'limited' : 'on-grid';

const result = await calculateQuote({
  // ... other params
  gridConnection: gridConnectionType,
});
```

### Wizard Files Location
- `src/components/wizard/StreamlinedWizard.tsx` - **PRODUCTION WIZARD** (modular, SSOT-compliant)
- `src/components/wizard/shared/` - Shared components (WizardPowerProfile, WizardStepHelp, etc.)
- `src/components/verticals/_deprecated/` - Legacy vertical wizards (NOT USED - archived Dec 2025)
  - HotelWizard.tsx, CarWashWizard.tsx, EVChargingWizard.tsx

---

## 🏭 INDUSTRY LANDING PAGE STANDARDS (Dec 6, 2025)

**All industry landing pages MUST follow these standards for SSOT compliance:**

### Landing Page Architecture Pattern

Every landing page (`*Energy.tsx`) follows the EXACT same architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LANDING PAGE (e.g., HotelEnergy.tsx)                     │
│                                                                             │
│  Local wrapper: calculateXxxPower()                                         │
│  ├── Maps component state to SSOT input format                              │
│  ├── Calls SSOT function (e.g., calculateHotelPowerSimple)                  │
│  └── Returns { peakKW, dailyKWh, demandChargeImpact }                       │
└─────────────────────────────────────────┬───────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SSOT SERVICE                                             │
│                                                                             │
│  useCasePowerCalculations.ts:                                               │
│  ├── calculateHotelPowerSimple()                                            │
│  ├── calculateCarWashPowerSimple()                                          │
│  └── HOTEL_CLASS_PROFILES_SIMPLE, CAR_WASH_POWER_PROFILES_SIMPLE            │
│                                                                             │
│  evChargingCalculations.ts:                                                 │
│  ├── calculateEVChargingPowerSimple()                                       │
│  └── EV_CHARGER_SPECS_SIMPLE                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Current Landing Pages (SSOT Compliant Dec 6, 2025)

| File | SSOT Service | SSOT Function | Status |
|------|--------------|---------------|--------|
| `HotelEnergy.tsx` | `useCasePowerCalculations.ts` | `calculateHotelPowerSimple()` | ✅ SSOT |
| `CarWashEnergy.tsx` | `useCasePowerCalculations.ts` | `calculateCarWashPowerSimple()` | ✅ SSOT |
| `EVChargingEnergy.tsx` | `evChargingCalculations.ts` | `calculateEVChargingPowerSimple()` | ✅ SSOT |

### Required Pattern for All Landing Pages

**1. Import from SSOT service:**
```typescript
import { 
  calculateHotelPowerSimple, 
  HOTEL_CLASS_PROFILES_SIMPLE, 
  HOTEL_AMENITY_POWER_SIMPLE,
  type HotelClassSimple,
  type HotelAmenitySimple
} from '@/services/useCasePowerCalculations';
```

**2. Local display-only constants:**
```typescript
// UI display constants (names, descriptions) - NOT calculation values
const HOTEL_CLASS_DISPLAY = {
  economy: { name: 'Economy/Budget', description: 'Basic amenities' },
  midscale: { name: 'Midscale', description: 'Standard amenities + breakfast' },
  // ...
};

// State rates for UI and calculation (can stay local)
const STATE_RATES: Record<string, { rate: number; demandCharge: number }> = { ... };
```

**3. Local wrapper function calls SSOT:**
```typescript
function calculateHotelPower(inputs: HotelInputs): { peakKW: number; dailyKWh: number; demandChargeImpact: number } {
  // Map local state to SSOT input format
  const amenities: HotelAmenitySimple[] = [];
  if (inputs.hasPool) amenities.push('pool');
  // ... map other fields
  
  // Call SSOT calculator
  const result = calculateHotelPowerSimple({
    rooms: inputs.numberOfRooms,
    hotelClass: inputs.hotelClass,
    amenities,
    electricityRate: stateData.rate,
  });
  
  // Return in local format expected by component
  return { 
    peakKW: result.peakKW, 
    dailyKWh: Math.round(result.peakKW * 24 * 0.4),
    demandChargeImpact: result.peakKW * stateData.demandCharge 
  };
}
```

### SSOT Simple Functions (Added Dec 6, 2025)

**useCasePowerCalculations.ts exports:**
```typescript
// Constants
export const HOTEL_CLASS_PROFILES_SIMPLE = { economy, midscale, upscale, luxury };
export const HOTEL_AMENITY_POWER_SIMPLE = { pool, restaurant, spa, fitness, evCharging };
export const CAR_WASH_POWER_PROFILES_SIMPLE = { selfService, automatic, tunnel, fullService };

// Types
export type HotelClassSimple = 'economy' | 'midscale' | 'upscale' | 'luxury';
export type HotelAmenitySimple = 'pool' | 'restaurant' | 'spa' | 'fitness' | 'evCharging';
export type CarWashTypeSimple = 'selfService' | 'automatic' | 'tunnel' | 'fullService';

// Functions
export function calculateHotelPowerSimple(input: HotelPowerSimpleInput): HotelPowerSimpleResult;
export function calculateCarWashPowerSimple(input: CarWashPowerSimpleInput): CarWashPowerSimpleResult;
```

**evChargingCalculations.ts exports:**
```typescript
// Constants
export const EV_CHARGER_SPECS_SIMPLE = { level2: 7.2kW, dcfc: 150kW, hpc: 250kW };

// Functions
export function calculateEVChargingPowerSimple(input: EVChargingPowerSimpleInput): EVChargingPowerSimpleResult;
```

### Adding a New Industry Landing Page

Follow this checklist for SSOT compliance:

1. **Add SSOT function to service:**
   - If power-based: Add to `useCasePowerCalculations.ts`
   - If EV-related: Add to `evChargingCalculations.ts`
   - Export constants, types, and function

2. **Create landing page component:**
   - Import SSOT function and types
   - Create local display constants (names/descriptions only)
   - Create local wrapper that calls SSOT
   - Keep STATE_RATES local (or import from shared)

3. **Test pattern:**
   ```typescript
   // ✅ CORRECT: Calls SSOT
   const result = calculateXxxPowerSimple({ ... });
   
   // ❌ WRONG: Embedded calculation
   const peakKW = rooms * kWPerRoom * 0.75;
   ```

4. **Verify build passes:**
   ```bash
   npm run build
   ```

### FORBIDDEN in Landing Pages

```typescript
// ❌ NEVER embed power constants with calculation values
const POWER_PROFILES = {
  economy: { kWhPerRoom: 25, peakKWPerRoom: 1.5 },  // WRONG - move to SSOT
};

// ❌ NEVER do inline calculations
let peakKW = numberOfRooms * profile.peakKWPerRoom;
peakKW += amenityPower.pool;
peakKW *= 0.75;  // WRONG - all this belongs in SSOT

// ✅ CORRECT: Single call to SSOT
const result = calculateHotelPowerSimple({ rooms, hotelClass, amenities, rate });
```

---

## Project Documentation

Key docs in root:
- `ARCHITECTURE_GUIDE.md` - Comprehensive system overview
- `SERVICES_ARCHITECTURE.md` - Service layer reference (790 lines)
- `CALCULATION_CONSOLIDATION_COMPLETE.md` - Financial calculation migration
- `SUPABASE_SETUP.md` - Database schema and setup
- `CALCULATION_FILES_AUDIT.md` - Single source of truth documentation (NEW)

For AI data collection features, see `AI_SYSTEM_IMPLEMENTATION_COMPLETE.md`.

---

## 🧙‍♂️ WIZARD V7 ARCHITECTURE (Feb 2026)

**WizardV7 is the NEXT-GENERATION PRODUCTION WIZARD** (launched Feb 2026).

**Route:** `/v7`
**Entry:** `src/wizard/v7/WizardV7Page.tsx`
**Orchestrator:** `src/wizard/v7/hooks/useWizardV7.ts` (3,931 lines)
**Architecture:** 4-step wizard with template-driven questionnaires + TrueQuote™ validation

### V7 Design Principles

1. **Steps are dumb renderers** — ZERO business logic in step components
2. **useWizardV7 owns ALL state** — single orchestrator hook
3. **Templates drive questions** — JSON templates define per-industry questionnaires
4. **Calculator adapters are thin** — delegate to SSOT `calculateUseCasePower()`
5. **TrueQuote validation is mandatory** — every quote needs kW contributor envelope
6. **No silent defaults** — `buildSSOTInput()` translates field names to prevent SSOT falls through to default

### File Structure

```
src/wizard/v7/                          ← Domain logic (no React)
├── hooks/
│   └── useWizardV7.ts                  ← 3,931 lines — SSOT orchestrator
├── calculators/
│   ├── registry.ts                     ← All calculator adapters (1,805 lines)
│   ├── contract.ts                     ← CalcContract type (per-industry metadata)
│   └── ssotInputAliases.ts             ← Field-name translation layer
├── templates/
│   ├── templateIndex.ts                ← Template loader (lazy JSON imports)
│   ├── applyMapping.ts                 ← Template answers → calculator inputs
│   ├── template-manifest.ts            ← Machine-readable template registry
│   ├── transforms.ts                   ← Answer transform functions
│   ├── validator.ts                    ← Template JSON schema validation
│   ├── types.ts                        ← Template type definitions
│   └── __tests__/                      ← 383 tests across 6 files
│       ├── goldenTraces.test.ts        ← Golden value range tests (all industries)
│       ├── trueQuoteSanity.test.ts     ← TrueQuote envelope + contributor checks
│       ├── templateDrift.test.ts       ← Template ↔ calculator contract drift
│       ├── inputSensitivity.test.ts    ← Input changes → output changes
│       ├── contractGuards.test.ts      ← CalcContract schema tests
│       └── adapterHardening.test.ts    ← Edge cases, boundary values
├── schema/
│   └── curatedFieldsResolver.ts        ← Step 3 curated field definitions
├── expression/                         ← lifeSignals-driven UI layer
│   ├── components.tsx                  ← Confidence bars, phase indicators
│   ├── hooks.ts                        ← useExpressionEngine()
│   ├── types.ts                        ← LifeSignals, Phase types
│   └── index.ts
├── gates/
│   └── wizardStepGates.ts              ← Step transition validators
├── fsm/
│   └── step3FSM.ts                     ← Step 3 finite state machine
├── pricing/
│   └── pricingBridge.ts                ← Price calculation integration
├── telemetry/
│   └── contractTelemetry.ts            ← Runtime contract violation logging
├── validation/
│   └── templateValidator.ts            ← Template structure validator
├── debug/
│   └── provenanceAudit.ts              ← Data provenance tracing
├── featureFlags.ts                     ← V7 feature flags
├── industryMeta.ts                     ← Canonical industry icons/labels/metadata
└── WizardV7Page.tsx                    ← Entry point (React)

src/components/wizard/v7/               ← UI components (React only)
├── steps/
│   ├── Step1LocationV7.tsx             ← Google Places address input
│   ├── Step2IndustryV7.tsx             ← Industry card grid (from industryMeta)
│   ├── Step3ProfileV7Curated.tsx       ← ✅ ACTIVE — Curated 16Q questionnaire
│   ├── Step3ProfileV7.tsx              ← Alternative: template-driven renderer
│   ├── Step3GatedV7.tsx                ← Alternative: FSM-gated step 3
│   ├── Step4ResultsV7.tsx              ← Quote results + export
│   └── index.ts
├── shared/
│   ├── WizardShellV7.tsx               ← Layout shell
│   ├── TopNavBar.tsx                   ← Header navigation
│   ├── BottomNavigation.tsx            ← Step navigation buttons
│   ├── ProgressTracker.tsx             ← Step progress indicator
│   ├── IntelStrip.tsx                  ← Intelligence strip
│   ├── WizardErrorBoundary.tsx         ← Error boundary
│   └── ...
├── live-preview/
│   ├── LiveCalculationPanel.tsx        ← Real-time power gauge
│   ├── PowerGauge.tsx                  ← kW visualization
│   └── SavingsCounter.tsx              ← Savings animation
├── advisor/
│   ├── AIEnergyAdvisor.tsx             ← Advisor chat panel
│   └── AdvisorAvatar.tsx               ← Advisor avatar
├── admin/
│   └── WizardHealthDashboardV2.tsx     ← Admin monitoring
└── debug/
    └── V7DebugPanel.tsx                ← Debug overlay
```

### Data Flow: Template → Calculator → Quote

```
┌─────────────────────────────────────────────────────────────────────┐
│  Step 3: User answers questions                                     │
│  (Step3ProfileV7Curated renders curated fields)                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ answers: Record<string, any>
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  applyTemplateMapping(answers, template.mapping)                    │
│  Converts question IDs → calculator input keys                      │
│  Applies transforms (parseFloat, booleans, option maps)             │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ calcInputs: Record<string, any>
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  buildSSOTInput(industry, calcInputs)                               │
│  Translates adapter field names → SSOT field names                  │
│  e.g., dcfcChargers → numberOfDCFastChargers                       │
│  ⚠️ CRITICAL: Prevents "silent default" bug class                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ ssotData: Record<string, any>
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Calculator adapter (from CALCULATORS_BY_ID in registry.ts)         │
│  Thin wrapper that calls SSOT:                                      │
│    calculateUseCasePower(slug, ssotData)                             │
│  Returns: { peakLoadKW, validation: CalcValidation }                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CalcValidation envelope (TrueQuote™)                               │
│  ├── version: "v1"                                                  │
│  ├── kWContributors: { hvac: 120, lighting: 30, process: 50, ... } │
│  ├── dutyCycle: 0.55                                                │
│  ├── contributorShares: { hvac: 0.48, lighting: 0.12, ... }       │
│  ├── assumptions: ["ASHRAE 90.1", "4 W/sqft HVAC"]                │
│  └── details: { sqFt: 50000, wattsPerSqFt: 4.5, ... }            │
│                                                                     │
│  VALIDATION RULES:                                                  │
│  - version must be "v1" for TrueQuote badge                        │
│  - ≥3 non-zero kWContributors                                      │
│  - contributor sum within 5% of peakLoadKW                          │
│  - dutyCycle in [0, 1]                                              │
│  - non-empty assumptions[]                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Industry Calculator Registry

Every industry has a registered calculator adapter in `registry.ts`:

| Industry | Calculator ID | Template? | Curated? | Status |
|----------|--------------|-----------|----------|--------|
| data_center | `dc_load_v1` | ✅ JSON | ✅ | Full TrueQuote |
| hotel | `hotel_load_v1` | ✅ JSON | ✅ | Full TrueQuote |
| car_wash | `car_wash_load_v1` | ✅ JSON | ✅ | Full TrueQuote |
| ev_charging | `ev_charging_load_v1` | ✅ JSON | ✅ | Full TrueQuote |
| hospital | `hospital_load_v1` | ✅ JSON | ✅ | Full TrueQuote |
| manufacturing | `manufacturing_load_v1` | ✅ JSON | ✅ | Full TrueQuote |
| office | `office_load_v1` | ✅ JSON | ✅ | Full TrueQuote |
| retail | `retail_load_v1` | — | ✅ | Adapter-direct |
| warehouse | `warehouse_load_v1` | — | ✅ | Adapter-direct |
| restaurant | `restaurant_load_v1` | — | ✅ | Adapter-direct |
| gas_station | `gas_station_load_v1` | — | ✅ | Adapter-direct |
| healthcare | (maps to hospital) | — | ✅ | Alias |
| other | `generic_ssot_v1` | — | — | Fallback (no TrueQuote) |

### SSOT Input Aliases (Critical)

The `buildSSOTInput()` function in `ssotInputAliases.ts` prevents the **#1 silent bug class**: adapter field names that don't match SSOT function parameter names.

**How it works:**
```typescript
// SSOT_ALIASES truth table:
// adapter field → SSOT field → SSOT alternates → default
{
  ev_charging: {
    level2Chargers: { ssotField: "numberOfLevel2Chargers", ssotDefault: 12 },
    dcfcChargers:   { ssotField: "numberOfDCFastChargers", ssotDefault: 8 },
  },
  office: {
    squareFootage:  { ssotField: "officeSqFt", ssotDefault: 50000 },
  },
  // ...
}
```

**⚠️ RULE: Every calculator adapter MUST call `buildSSOTInput()` before passing data to SSOT.**

```typescript
// ✅ CORRECT — field names translated
const ssotData = buildSSOTInput("ev_charging", { level2Chargers: 10, dcfcChargers: 4 });
const result = calculateUseCasePower("ev-charging", ssotData);
// ssotData = { numberOfLevel2Chargers: 10, numberOfDCFastChargers: 4 }

// ❌ WRONG — SSOT doesn't recognize "dcfcChargers", falls through to default=8
const result = calculateUseCasePower("ev-charging", { level2Chargers: 10, dcfcChargers: 4 });
```

### Feature Flags

In `featureFlags.ts`:

| Flag | Default | Effect |
|------|---------|--------|
| `V7_USE_CURATED_STEP3` | `true` | Use curated schema (not backend templates) |
| `V7_ENABLE_GATED_STEP3` | `false` | FSM-gated step 3 (experimental) |
| `V7_ENABLE_EXPRESSION` | `true` | lifeSignals expression layer |
| `V7_ENABLE_DEBUG_PANEL` | `false` | Debug overlay |
| `V7_PRICING_BRIDGE` | `true` | Real pricing integration |

### Industry Metadata (SSOT)

`src/wizard/v7/industryMeta.ts` is the **canonical source** for industry display properties:

```typescript
import { INDUSTRY_META, getIndustryMeta, canonicalizeSlug } from '@/wizard/v7/industryMeta';

const meta = getIndustryMeta('data-center');
// → { icon: '🖥️', label: 'Data Center', slug: 'data_center', hasTemplate: true }

canonicalizeSlug('healthcare');  // → 'hospital'
canonicalizeSlug('car-wash');    // → 'car_wash'
canonicalizeSlug('EV_Charging'); // → 'ev_charging'
```

Step2IndustryV7 imports from this SSOT. Any new industry display needs should go here.

### Template JSON Format

Templates live in `src/wizard/v7/templates/json/`:

```json
{
  "industry": "car_wash",
  "version": "car_wash.v1.0.0",
  "calculator": "car_wash_load_v1",
  "questions": [
    {
      "id": "wash_type",
      "label": "Wash type",
      "type": "select",
      "options": [
        { "value": "tunnel", "label": "Tunnel (conveyor)" },
        { "value": "automatic", "label": "In-Bay Automatic" },
        { "value": "self_service", "label": "Self-Service Bays" }
      ],
      "default": "tunnel"
    },
    {
      "id": "bay_count",
      "label": "Number of bays / tunnels",
      "type": "number",
      "default": 4,
      "validation": { "min": 1, "max": 20 }
    }
  ],
  "mapping": [
    { "from": "wash_type", "to": "washType" },
    { "from": "bay_count", "to": "bayTunnelCount", "transform": "parseFloat" }
  ],
  "defaults": {
    "wash_type": "tunnel",
    "bay_count": 4
  }
}
```

### Template Manifest

`template-manifest.ts` is a machine-readable registry that test suites use to validate contracts:

```typescript
interface ManifestEntry {
  industrySlug: string;
  templateVersion: string;
  calculatorId: string;
  validationVersion: string;           // "v1" for TrueQuote
  requiredQuestionIds: string[];        // Questions template MUST have
  requiredCalcFields: string[];         // Fields calculator MUST receive
  contributorKeysExpected: string[];    // kW contributors in validation envelope
  dutyCycleRange: [number, number];     // Expected duty cycle bounds
  typicalPeakKWRange: [number, number]; // Sanity bounds
  detailKeys: string[];                 // Extra detail fields
  ssotInputAliases: Record<string, AliasEntry>; // Field name mapping
}
```

### Test Architecture (383 tests)

Run with: `npm run test:v7` or `npx vitest run src/wizard/v7/`

| Test File | Count | Purpose |
|-----------|-------|---------|
| `goldenTraces.test.ts` | ~120 | Per-industry golden value range tests (typical/small/large) |
| `trueQuoteSanity.test.ts` | ~60 | TrueQuote envelope validity for all templates |
| `templateDrift.test.ts` | ~50 | Template ↔ calculator contract alignment |
| `inputSensitivity.test.ts` | ~50 | Input changes produce output changes (no silent defaults) |
| `contractGuards.test.ts` | ~40 | CalcContract schema and structural checks |
| `adapterHardening.test.ts` | ~30 | Edge cases, boundary values, NaN protection |
| (+ gates, pricing) | ~30 | Step gate validation, pricing sanity |

**Ship gate:** `npm run ship:v7` (typecheck + test:v7 + build)

### Adding a New Industry to V7

1. **Add calculator adapter** in `registry.ts`:
   - Create `YOUR_INDUSTRY_LOAD_V1_SSOT` adapter
   - Call `buildSSOTInput(industry, inputs)` before SSOT
   - Register in `CALCULATORS_BY_ID`
   - Return `{ peakLoadKW, validation: CalcValidation }`

2. **Add SSOT aliases** in `ssotInputAliases.ts`:
   - Map adapter field names → SSOT field names
   - Include `ssotDefault` for each field

3. **Add to manifest** in `template-manifest.ts`:
   - Define `ManifestEntry` with required fields/questions

4. **Add curated fields** in `curatedFieldsResolver.ts`:
   - Define questions with types, options, validation

5. **Add to industryMeta.ts**:
   - Icon, label, slug, description, hasTemplate

6. **Add golden trace tests** in `goldenTraces.test.ts`:
   - typical, small, large scenarios with expected kW ranges

7. **Run full test suite:** `npm run ship:v7`

### Curated Step 3 (Active Path)

`Step3ProfileV7Curated.tsx` renders questions from `curatedFieldsResolver.ts`.

**Input types rendered:**
- **Button cards** — for ≤6 option questions (ALL current questions)
- **Number input** — with inline unit suffix, smart placeholder, min/max validation
- **Toggle** — Yes/No as two button cards
- **Slider** — for continuous ranges (currently no questions use this)

**⚠️ UI Rules:**
- NO `<select>` dropdowns — all options rendered as button cards
- NO toast spam — validation shown inline with amber highlight
- Units shown IN-FIELD (absolute-positioned suffix, e.g., "kW", "sq ft")
- Smart placeholders from `q.smartDefault`

### Null-Safety Pattern (Critical)

```typescript
// ❌ WRONG — 0 is falsy, falls through to default
const count = Number(inputs.dcfcChargers) || 8;

// ✅ CORRECT — preserves explicit zero
const count = inputs.dcfcChargers != null ? Number(inputs.dcfcChargers) : 8;
```

This pattern MUST be used for ALL numeric inputs in calculator adapters.

### PROTECTED V7 FILES — DO NOT MODIFY WITHOUT REVIEW:

- `useWizardV7.ts` — SSOT orchestrator (3,931 lines)
- `registry.ts` — Calculator adapter registry
- `ssotInputAliases.ts` — Field name translation layer
- `template-manifest.ts` — Test contract definitions
- `curatedFieldsResolver.ts` — Curated field schemas
- `contract.ts` — CalcContract type definition
- `useCasePowerCalculations.ts` — SSOT power calculations (in `src/services/`)

### V7 vs V6 Comparison

| Feature | V7 | V6 |
|---------|----|----|
| **Steps** | 4 (location → industry → profile → results) | 6 (+ options + magic fit) |
| **Orchestrator** | `useWizardV7.ts` hook | `WizardV6.tsx` monolith |
| **Questionnaire** | Template/curated-driven | Database-driven |
| **Calculator** | Adapter registry + SSOT | Direct SSOT |
| **Validation** | TrueQuote CalcValidation envelope | Basic checks |
| **Field names** | `buildSSOTInput()` translation | Direct mapping |
| **Tests** | 383 automated (golden + drift + sanity) | Manual + e2e |
| **Expression** | lifeSignals (confidence, phases) | Advisor rail |
