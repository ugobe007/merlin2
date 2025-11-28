# Copilot Instructions for Merlin BESS Quote Builder

## ⚠️ CRITICAL: Single Sources of Truth

**CALCULATION ARCHITECTURE - THREE PILLARS:**

1. **Power/Demand Calculations** → `useCasePowerCalculations.ts` (NEW - Nov 2025)
   - Industry-standard peak demand values (ASHRAE, CBECS, Energy Star)
   - Individual calculators: `calculateOfficePower()`, `calculateHotelPower()`, etc.
   - Master function: `calculateUseCasePower(slug, useCaseData)`
   - ✅ **SINGLE SOURCE OF TRUTH** for all power calculations

2. **Financial Calculations** → `centralizedCalculations.ts`
   - `calculateFinancialMetrics()` - NPV, IRR, ROI, payback
   - Database-driven constants (not hardcoded)
   - Advanced analysis: sensitivity, risk, Monte Carlo
   - ✅ **SINGLE SOURCE OF TRUTH** for all financial metrics

3. **Equipment Pricing** → `equipmentCalculations.ts`
   - `calculateEquipmentBreakdown()` - Batteries, inverters, transformers
   - Database-driven pricing from `pricing_configurations` table
   - Market intelligence integration
   - ✅ **SINGLE SOURCE OF TRUTH** for equipment costs

**PROTECTED FILES - DO NOT MODIFY WITHOUT REVIEW:**
- `advancedFinancialModeling.ts` - IRR-based pricing models
- `useCasePowerCalculations.ts` - Industry power standards

**DEPRECATED - DO NOT USE:**
- ❌ `bessDataService.calculateBESSFinancials()` - Use `centralizedCalculations.calculateFinancialMetrics()`
- ❌ `useSystemCalculations.getPowerDensity()` - Use `useCasePowerCalculations.calculateUseCasePower()`
- ❌ `useSystemCalculations.calculateEVChargingConfig()` - Use `useCasePowerCalculations.calculateEVChargingPower()`
- ❌ `useAdvancedSystemCalculations.getBESSPricePerKwh()` - Use `equipmentCalculations.ts`

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
// In SmartWizardV2.tsx or any component
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
4. Test with SmartWizardV2

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

3. **SmartWizardV2 Missing Financial Calculations**:
   - Current wizard calculates equipment costs but NOT financial metrics
   - Must add `calculateFinancialMetrics()` call after equipment breakdown
   - See `CALCULATION_AUDIT_REPORT.md` for fix

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
