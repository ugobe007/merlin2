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

**CALCULATION ARCHITECTURE - SIX PILLARS:**

1. **Quote Calculator** → `unifiedQuoteCalculator.ts` (NEW - Nov 28, 2025)
   - **USE THIS FOR ALL QUOTE CALCULATIONS**
   - `calculateQuote()` - Complete quote with equipment + financials
   - `estimatePayback()` - Quick estimate for UI previews
   - Orchestrates all other services
   - ✅ **SINGLE ENTRY POINT** for quote generation

2. **Power/Demand Calculations** → `useCasePowerCalculations.ts`
   - Industry-standard peak demand values (ASHRAE, CBECS, Energy Star)
   - Individual calculators: `calculateOfficePower()`, `calculateHotelPower()`, etc.
   - Master function: `calculateUseCasePower(slug, useCaseData)`
   - ✅ **SINGLE SOURCE OF TRUTH** for all power calculations

3. **EV Charging Hub Calculations** → `evChargingCalculations.ts` (NEW - Nov 30, 2025)
   - **USE FOR ALL EV CHARGING CONFIGURATIONS**
   - Supports: Level 2 (7/11/19/22 kW), DCFC (50/150 kW), HPC (250/350 kW)
   - `calculateEVHubPower()` - Power requirements with concurrency
   - `calculateEVHubCosts()` - Hardware, installation, make-ready costs
   - `calculateEVHubBESSSize()` - Recommended BESS for peak shaving
   - ⚠️ **NO "Level 3" EXISTS** - Industry uses L1, L2, DCFC, HPC
   - ✅ **SINGLE SOURCE OF TRUTH** for EV charging calculations

4. **Financial Calculations** → `centralizedCalculations.ts`
   - `calculateFinancialMetrics()` - NPV, IRR, ROI, payback
   - Database-driven constants (not hardcoded)
   - Advanced analysis: sensitivity, risk, Monte Carlo
   - ✅ **SINGLE SOURCE OF TRUTH** for all financial metrics

5. **Equipment Pricing** → `equipmentCalculations.ts`
   - `calculateEquipmentBreakdown()` - Batteries, inverters, transformers
   - **FIXED Nov 28**: Small systems (< 1 MW) now priced per-kWh, not per-unit
   - Market intelligence integration via NREL ATB 2024
   - ✅ **SINGLE SOURCE OF TRUTH** for BESS equipment costs

6. **Professional Financial Model** → `professionalFinancialModel.ts` (NEW - Nov 29, 2025)
   - **USE FOR BANK/INVESTOR-READY DOCUMENTS**
   - `generateProfessionalModel()` - Full 3-statement model with DSCR
   - Features: 3-Statement Model, DSCR, Levered/Unlevered IRR, MACRS, Revenue Stacking
   - `generateSensitivityMatrix()` - Parameter sensitivity for banks
   - ✅ **SINGLE SOURCE OF TRUTH** for professional project finance

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
// ❌ NEVER do this:
const cost = storageSizeMW * durationHours * 300000; // Hardcoded!
const payback = cost / savings; // Manual calculation!

// ✅ ALWAYS do this:
import { calculateQuote } from '@/services/unifiedQuoteCalculator';
const quote = await calculateQuote({ storageSizeMW, durationHours, ... });
// Use quote.financials.paybackYears, quote.costs.netCost, etc.
```

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

3. **Wizard Architecture (UPDATED Dec 1, 2025)**:
   - ✅ **StreamlinedWizard** is the SINGLE SOURCE OF TRUTH for all wizard flows
   - SmartWizardV2/V3 have been REMOVED from codebase
   - StreamlinedWizard uses `centralizedCalculations.ts` for all financial metrics

4. **Modal Props**: ModalManager has 20+ prop type errors. Use ModalRenderer for all new modals.

5. **Database Sizing**: EV Charging has special sizing logic in `baselineService.ts` (user kW input overrides template).

6. **Region Pricing**: Different pricing by region (North America, Europe, Asia, Middle East). Use `unifiedPricingService.ts` which handles regional variations.

## Project Documentation

Key docs in root:
- `ARCHITECTURE_GUIDE.md` - Comprehensive system overview
- `SERVICES_ARCHITECTURE.md` - Service layer reference (790 lines)
- `CALCULATION_CONSOLIDATION_COMPLETE.md` - Financial calculation migration
- `SUPABASE_SETUP.md` - Database schema and setup
- `CALCULATION_FILES_AUDIT.md` - Single source of truth documentation (NEW)

For AI data collection features, see `AI_SYSTEM_IMPLEMENTATION_COMPLETE.md`.
