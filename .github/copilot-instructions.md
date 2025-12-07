# Copilot Instructions for Merlin BESS Quote Builder

## 🚀 BUSINESS STRATEGY - READ FIRST!

**BEFORE making ANY changes, read:** `MERLIN_STRATEGIC_ROADMAP.md` in project root
- Contains the 5-phase business plan
- Merlin = Platform/Engine powering SMB verticals + Merlin Pro
- Updated December 1, 2025

## 🎨 UI/UX DESIGN - READ SECOND!

**BEFORE making ANY UI changes, read:** `DESIGN_NOTES.md` in project root
- Contains current design specifications, color palette, component layouts
- Updated after each design session
- **AI agents MUST update this file after significant UI changes**

---

## ⚠️ CRITICAL: Single Sources of Truth

**SSOT ARCHITECTURE DIAGRAM (Updated Dec 2025):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ANY COMPONENT NEEDING QUOTES                             │
│            (AdvancedQuoteBuilder, StreamlinedWizard, etc.)                  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│             unifiedQuoteCalculator.calculateQuote()                         │
│                    ✅ TRUE SSOT ENTRY POINT                                 │
│                                                                             │
│  Input: { storageSizeMW, durationHours, solarMW, windMW, generatorMW,      │
│           location, electricityRate, gridConnection, useCase }              │
│                                                                             │
│  Returns: QuoteResult { equipment, costs, financials, metadata }            │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
           ┌────────────────────┴────────────────────┐
           ▼                                         ▼
┌──────────────────────────────────┐   ┌──────────────────────────────────────┐
│  equipmentCalculations.ts        │   │  centralizedCalculations.ts          │
│  calculateEquipmentBreakdown()   │   │  calculateFinancialMetrics()         │
│                                  │   │                                      │
│  Returns:                        │   │  Returns:                            │
│  ├── batteries (NREL ATB 2024)   │   │  ├── annualSavings                   │
│  ├── inverters (DB pricing)      │   │  ├── paybackYears                    │
│  ├── transformers (DB pricing)   │   │  ├── NPV, IRR, ROI                   │
│  ├── switchgear (DB pricing)     │   │  └── demandChargeSavings             │
│  ├── solar (via useCaseService)  │   │                                      │
│  ├── wind (via useCaseService)   │   │  Uses: Database-driven constants     │
│  └── generators (DB pricing)     │   │  (NOT hardcoded values)              │
└───────────────────┬──────────────┘   └──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      unifiedPricingService.ts                                │
│                 getBatteryPricing() + marketIntelligence                     │
│                                                                              │
│  Data Sources:                                                               │
│  ├── NREL ATB 2024 (primary)                                                 │
│  ├── pricing_configurations table (Supabase)                                 │
│  └── Regional adjustments by location                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**CALCULATION ARCHITECTURE - SIX PILLARS:**

1. **Quote Calculator** → `unifiedQuoteCalculator.ts` (Nov 28, 2025)
   - **USE THIS FOR ALL QUOTE CALCULATIONS**
   - `calculateQuote()` - Complete quote with equipment + financials
   - `estimatePayback()` - Quick estimate for UI previews
   - Orchestrates all other services
   - ✅ **SINGLE ENTRY POINT** for quote generation
   - ⚠️ **IMPORTANT**: NEVER call `calculateFinancialMetrics()` directly from components - always use `calculateQuote()` which orchestrates both equipment AND financial calculations

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

**Database Pricing Configs (in Supabase `pricing_configurations`):**
```sql
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

**DEPRECATED - DO NOT USE:**
- ❌ `bessDataService.calculateBESSFinancials()` - Use `unifiedQuoteCalculator.calculateQuote()`
- ❌ `pricingService.calculateROI()` - Use `centralizedCalculations.calculateFinancialMetrics()`
- ❌ `marketIntelligence.simplePayback` - Use `calculateFinancialMetrics().paybackYears`
- ❌ `InteractiveConfigDashboard` hardcoded prices - Use `calculateEquipmentBreakdown()`
- ❌ ANY hardcoded $/kWh values - Use `getBatteryPricing()` from unifiedPricingService
- ❌ "Level 3 chargers" - **NO SUCH THING** - Use DCFC or HPC

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

**USE CASES COVERED BY STREAMLINED WIZARD (18+):**
All these use cases flow through StreamlinedWizard → calculateQuote():
| Slug | Category | Status |
|------|----------|--------|
| apartment-building | Residential | ✅ SSOT |
| car-wash | Commercial | ✅ SSOT (also has CarWashWizard) |
| distribution-center | Industrial | ✅ SSOT |
| edge-data-center | Commercial | ✅ SSOT |
| ev-charging | Transportation | ✅ SSOT (also has EVChargingWizard) |
| gas-station | Commercial | ✅ SSOT |
| hospital | Commercial | ✅ SSOT |
| hotel / hotel-hospitality | Commercial | ✅ SSOT (also has HotelWizard) |
| indoor-farm | Agriculture | ✅ SSOT |
| manufacturing | Industrial | ✅ SSOT |
| microgrid | Renewable | ✅ SSOT |
| office | Commercial | ✅ SSOT |
| public-building | Government | ✅ SSOT |
| residential | Residential | ✅ SSOT |
| retail | Commercial | ✅ SSOT |
| shopping-center | Commercial | ✅ SSOT |
| university | Education | ✅ SSOT |

See `CALCULATION_FILES_AUDIT.md` for complete architecture documentation.

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

3. **Wizard Architecture (UPDATED Dec 5, 2025)**:
   - ✅ **StreamlinedWizard** is the SINGLE SOURCE OF TRUTH for generic wizard flows
   - **Vertical Wizards** (HotelWizard, CarWashWizard, EVChargingWizard) are specialized
   - See **VERTICAL WIZARD STANDARDS** section below for requirements

4. **Modal Props**: ModalManager has 20+ prop type errors. Use ModalRenderer for all new modals.

5. **Database Sizing**: EV Charging has special sizing logic in `baselineService.ts` (user kW input overrides template).

6. **Region Pricing**: Different pricing by region (North America, Europe, Asia, Middle East). Use `unifiedPricingService.ts` which handles regional variations.

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
- `src/components/verticals/HotelWizard.tsx` - **REFERENCE** (most complete)
- `src/components/verticals/CarWashWizard.tsx` - ✅ Now has mode selector + gridConnection state
- `src/components/verticals/EVChargingWizard.tsx` - ✅ Now has mode selector + gridConnection state
- `src/components/wizard/shared/` - Shared components (WizardPowerProfile, WizardStepHelp, etc.)

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
