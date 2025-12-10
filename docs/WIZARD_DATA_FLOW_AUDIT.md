# WIZARD DATA FLOW AUDIT

**Date**: December 9, 2025  
**Purpose**: Identify calculation inaccuracies, outdated parameters, and broken data flow in wizard workflows

---

## 📊 EXECUTIVE SUMMARY

### Critical Issues Found

| Severity | Issue | Location | Impact | Status |
|----------|-------|----------|--------|--------|
| 🔴 HIGH | Duplicate HOTEL_CLASS_PROFILES constants | HotelWizard.tsx vs useCasePowerCalculations.ts | Values may diverge | ✅ FIXED |
| 🔴 HIGH | Duplicate AMENITY_SPECS constants | HotelWizard.tsx vs useCasePowerCalculations.ts | Values may diverge | ✅ FIXED |
| 🟡 MEDIUM | Deprecated industryBaselines.ts still exists | src/utils/industryBaselines.ts | Risk of accidental usage | ⚠️ Already marked deprecated |
| 🟡 MEDIUM | Deprecated wizardHelpers.ts has power calculations | src/utils/wizardHelpers.ts | Duplicate logic | ✅ FIXED - Added deprecation warning |
| 🟡 MEDIUM | dataIntegrationService imports deprecated useCaseTemplates | src/services/dataIntegrationService.ts | Fallback bypasses SSOT | ⚠️ Acceptable for fallback |
| 🟢 LOW | USE_CASE_TEMPLATES has fallback usage | Multiple files | Intended for offline fallback | ⚠️ Acceptable |

### Fixes Applied (Dec 9, 2025)

1. **HotelWizard.tsx** - Now imports `HOTEL_CLASS_PROFILES` and `HOTEL_AMENITY_SPECS` from SSOT
2. **wizardHelpers.ts** - Added comprehensive deprecation warning with runtime console.warn

---

## 🗂️ DATA FLOW ARCHITECTURE

### Current Flow (Should Be)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER WIZARD INPUT                                     │
│          (StreamlinedWizard, HotelWizard, CarWashWizard, etc.)              │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              SINGLE SOURCE OF TRUTH LAYER                                    │
│                                                                             │
│  Power Calculations:                                                        │
│  └── useCasePowerCalculations.ts → calculateUseCasePower()                  │
│                                                                             │
│  Database-Driven Questions/Templates:                                        │
│  └── useCaseService.ts → getCustomQuestionsByUseCaseId()                    │
│                                                                             │
│  Baseline Sizing:                                                            │
│  └── baselineService.ts → calculateDatabaseBaseline()                       │
│                                                                             │
│  Equipment + Pricing:                                                        │
│  └── unifiedPricingService.ts → getBatteryPricing(), etc.                   │
│  └── equipmentCalculations.ts → calculateEquipmentBreakdown()               │
│                                                                             │
│  Financial Calculations:                                                     │
│  └── centralizedCalculations.ts → calculateFinancialMetrics()               │
│                                                                             │
│  Quote Generation:                                                           │
│  └── unifiedQuoteCalculator.ts → calculateQuote() ✅ MAIN ENTRY POINT       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Actual Flow (With Problems Highlighted)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER WIZARD INPUT                                     │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
          ┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐
          │ StreamlinedWizard│ │  HotelWizard  │ │  CarWashWizard  │
          │                 │ │               │ │                 │
          │ ✅ Uses SSOT    │ │ ⚠️ DUPLICATE  │ │ ✅ Uses SSOT    │
          │ calculateUseCasePower│ HOTEL_CLASS   │ calculateCarWash │
          │                 │ │ _PROFILES     │ │ EquipmentPower  │
          └────────┬────────┘ └───────┬───────┘ └────────┬────────┘
                   │                  │                   │
                   │     🔴 PROBLEM: │                   │
                   │     Local consts│                   │
                   │     may diverge │                   │
                   │     from SSOT   │                   │
                   │                  │                   │
                   ▼                  ▼                   ▼
          ┌─────────────────────────────────────────────────────┐
          │              calculateQuote() - SSOT                │
          │                                                     │
          │  ✅ Equipment priced via unifiedPricingService      │
          │  ✅ Financials via centralizedCalculations          │
          └─────────────────────────────────────────────────────┘
```

---

## 🔴 CRITICAL DUPLICATIONS

### 1. HOTEL_CLASS_PROFILES (Duplicate #1)

**File 1**: `src/components/verticals/HotelWizard.tsx` (Line 59)
```typescript
const HOTEL_CLASS_PROFILES = {
  economy: { kWhPerRoom: 25, peakKWPerRoom: 1.5, name: 'Economy/Budget', hvacTons: 0.5 },
  midscale: { kWhPerRoom: 35, peakKWPerRoom: 2.0, name: 'Midscale', hvacTons: 0.75 },
  upscale: { kWhPerRoom: 50, peakKWPerRoom: 2.5, name: 'Upscale', hvacTons: 1.0 },
  luxury: { kWhPerRoom: 75, peakKWPerRoom: 3.5, name: 'Luxury/Resort', hvacTons: 1.5 },
};
```

**File 2 (SSOT)**: `src/services/useCasePowerCalculations.ts` (Line 227)
```typescript
export const HOTEL_CLASS_PROFILES = {
  economy: { kWhPerRoom: 25, peakKWPerRoom: 1.5, name: 'Economy/Budget', hvacTons: 0.5 },
  midscale: { kWhPerRoom: 35, peakKWPerRoom: 2.0, name: 'Midscale', hvacTons: 0.75 },
  upscale: { kWhPerRoom: 50, peakKWPerRoom: 2.5, name: 'Upscale', hvacTons: 1.0 },
  luxury: { kWhPerRoom: 75, peakKWPerRoom: 3.5, name: 'Luxury/Resort', hvacTons: 1.5 },
};
```

**Status**: Values currently match, BUT if SSOT is updated, HotelWizard will use stale values!

**FIX REQUIRED**: HotelWizard should import from SSOT:
```typescript
import { HOTEL_CLASS_PROFILES, type HotelClass } from '@/services/useCasePowerCalculations';
```

---

### 2. AMENITY_SPECS (Duplicate #2)

**File 1**: `src/components/verticals/HotelWizard.tsx` (Line 66)
```typescript
const AMENITY_SPECS = {
  pool: { name: 'Pool & Hot Tub', peakKW: 50, dailyKWh: 300, icon: Waves },
  restaurant: { name: 'Restaurant/Kitchen', peakKW: 75, dailyKWh: 400, icon: Coffee },
  // ...
};
```

**File 2 (SSOT)**: `src/services/useCasePowerCalculations.ts` (Line 240)
```typescript
export const HOTEL_AMENITY_SPECS = {
  pool: { name: 'Pool & Hot Tub', peakKW: 50, dailyKWh: 300 },
  restaurant: { name: 'Restaurant/Kitchen', peakKW: 75, dailyKWh: 400 },
  // ...
};
```

**Note**: SSOT version doesn't have icons (UI concern) - that's acceptable. The power values MUST match.

**FIX REQUIRED**: HotelWizard should import power values from SSOT and add icons locally:
```typescript
import { HOTEL_AMENITY_SPECS } from '@/services/useCasePowerCalculations';

// Local enhancement for UI
const AMENITY_ICONS = {
  pool: Waves,
  restaurant: Coffee,
  // ...
};
```

---

## 🟡 DEPRECATED FILES STILL IN USE

### 1. `src/utils/industryBaselines.ts` (352 lines)

**Status**: Marked deprecated but still exists  
**Risk**: Some imports may accidentally use this instead of baselineService

**Current consumers** (grep results):
- `scripts/migrate-industry-baselines.ts` - Migration script (OK to keep)
- `docs/` - Documentation references (OK)

**Action**: Verify no runtime code imports from this file.

---

### 2. `src/utils/wizardHelpers.ts` (323 lines)

**Contains**: 
- `getPowerDensity()` - Duplicate of SSOT
- `getScaleFactor()` - Duplicate of logic in useSystemCalculations.ts

**Current consumers**:
- None found in runtime code (good!)

**Action**: Should be deleted or marked deprecated with deprecation warning.

---

### 3. `src/data/useCaseTemplates.ts` (4052 lines)

**Status**: Marked deprecated, used ONLY for:
1. Migration reference (`templateMigrationService.ts`)
2. Fallback if database unavailable (`dataIntegrationService.ts`)

**Issue**: `dataIntegrationService.ts` line 30 still imports:
```typescript
import { getUseCaseBySlug } from '../data/useCaseTemplates';
```

**Risk**: If database fails, fallback uses potentially stale template data.

**Action**: This is acceptable as fallback, BUT ensure database is primary source.

---

## 📋 FILE-BY-FILE ANALYSIS

### Calculation Files Status

| File | Status | SSOT Compliant | Notes |
|------|--------|----------------|-------|
| `useCasePowerCalculations.ts` | ✅ SSOT | ✅ Yes | Power calculations master |
| `baselineService.ts` | ✅ SSOT | ✅ Yes | Database-driven baseline |
| `centralizedCalculations.ts` | ✅ SSOT | ✅ Yes | Financial calculations |
| `unifiedQuoteCalculator.ts` | ✅ SSOT | ✅ Yes | Main entry point |
| `equipmentCalculations.ts` | ✅ SSOT | ✅ Yes | Equipment pricing |
| `unifiedPricingService.ts` | ✅ SSOT | ✅ Yes | Battery/Solar pricing |
| `evChargingCalculations.ts` | ✅ SSOT | ✅ Yes | EV charger calcs |
| `industryBaselines.ts` | ⚠️ DEPRECATED | ❌ No | Should not be used |
| `wizardHelpers.ts` | ⚠️ DEPRECATED | ❌ No | Has duplicate functions |

### Wizard Files Status

| File | Status | Uses SSOT | Issues Found |
|------|--------|-----------|--------------|
| `StreamlinedWizard.tsx` | ✅ Good | ✅ Yes | Uses `calculateUseCasePower()` |
| `HotelWizard.tsx` | ⚠️ Issues | Partial | Has duplicate HOTEL_CLASS_PROFILES |
| `CarWashWizard.tsx` | ✅ Good | ✅ Yes | Uses `calculateCarWashEquipmentPower()` |
| `EVChargingWizard.tsx` | ✅ Good | ✅ Yes | Uses SSOT EV calcs |
| `HotelEnergy.tsx` | ✅ Good | ✅ Yes | Uses `calculateHotelPowerSimple()` |
| `CarWashEnergy.tsx` | ✅ Good | ✅ Yes | Uses `calculateCarWashPowerSimple()` |
| `EVChargingEnergy.tsx` | ✅ Good | ✅ Yes | Uses `calculateEVChargingPowerSimple()` |

### Hooks Status

| File | Status | Uses SSOT | Issues Found |
|------|--------|-----------|--------------|
| `useSystemCalculations.ts` | ⚠️ Mixed | Partial | Has deprecated `calculateScaleFactor()` function |
| `useSmartWizard.ts` | ✅ Good | ✅ Yes | Uses `calculateDatabaseBaseline()` |
| `useFinancialMetrics.ts` | ✅ Good | ✅ Yes | Uses centralizedCalculations |

---

## 🔧 RECOMMENDED FIXES

### Priority 1: Fix HotelWizard.tsx Duplications

```typescript
// BEFORE (duplicate constants)
const HOTEL_CLASS_PROFILES = { ... };
const AMENITY_SPECS = { ... };

// AFTER (import from SSOT)
import { 
  HOTEL_CLASS_PROFILES, 
  HOTEL_AMENITY_SPECS,
  type HotelClass,
  type HotelAmenity 
} from '@/services/useCasePowerCalculations';

// Add icons separately for UI
const AMENITY_ICONS: Record<HotelAmenity, LucideIcon> = {
  pool: Waves,
  restaurant: Coffee,
  spa: Thermometer,
  fitnessCenter: Dumbbell,
  evCharging: Car,
  laundry: Wind,
  conferenceCenter: Building2,
};
```

### Priority 2: Deprecate wizardHelpers.ts

Add deprecation header and warning:
```typescript
/**
 * @deprecated This file is deprecated. Use:
 * - calculateUseCasePower() from useCasePowerCalculations.ts for power density
 * - calculateDatabaseBaseline() from baselineService.ts for scale factors
 */
console.warn('wizardHelpers.ts is deprecated - use useCasePowerCalculations.ts');
```

### Priority 3: Audit useSystemCalculations.ts

The `calculateScaleFactor()` function should:
1. Be removed or
2. Delegate to a centralized service

---

## 📊 PARAMETER COMPARISON

### Hotel Power Calculations

| Parameter | useCasePowerCalculations (SSOT) | HotelWizard (Local) | Match? |
|-----------|--------------------------------|---------------------|--------|
| economy.peakKWPerRoom | 1.5 | 1.5 | ✅ |
| midscale.peakKWPerRoom | 2.0 | 2.0 | ✅ |
| upscale.peakKWPerRoom | 2.5 | 2.5 | ✅ |
| luxury.peakKWPerRoom | 3.5 | 3.5 | ✅ |
| pool.peakKW | 50 | 50 | ✅ |
| restaurant.peakKW | 75 | 75 | ✅ |

**Current Status**: Values match, but architecture is wrong (duplicated).

### Power Density Standards

| Use Case | useCasePowerCalculations (W/sqft) | wizardHelpers (W/sqft) | Match? |
|----------|-----------------------------------|------------------------|--------|
| office | 6.0 | 6 | ✅ |
| datacenter | 150 | 150 | ✅ |
| hotel | 9* | 9 | ⚠️ Different approach |
| warehouse | 2.0 | 5 | ❌ MISMATCH! |
| retail | 8.0 | 10 | ❌ MISMATCH! |
| hospital | 10 kW/bed | 20 W/sqft | ⚠️ Different units |

*Hotel uses kW/room in SSOT, not W/sqft

**CRITICAL**: `wizardHelpers.ts` has DIFFERENT values than SSOT for warehouse and retail!

---

## 🎯 ACTION ITEMS

### Immediate (This Week)

1. [ ] **Fix HotelWizard imports** - Import HOTEL_CLASS_PROFILES from SSOT
2. [ ] **Fix HotelWizard amenities** - Import HOTEL_AMENITY_SPECS from SSOT
3. [ ] **Add deprecation warning** to wizardHelpers.ts
4. [ ] **Verify** no runtime code uses industryBaselines.ts

### Short-term (This Sprint)

5. [ ] **Delete or refactor** wizardHelpers.ts
6. [ ] **Audit useSystemCalculations.ts** - Remove duplicate calculateScaleFactor
7. [ ] **Add unit tests** to verify SSOT values match expected industry standards
8. [ ] **Create CI check** to prevent duplicate constants

### Long-term (Next Quarter)

9. [ ] **Move all power profiles to database** - pricing_configurations table
10. [ ] **Create admin UI** to update power profiles without code changes
11. [ ] **Add version tracking** to detect when SSOT changes

---

## 📁 FILES TO REVIEW

| File Path | Reason |
|-----------|--------|
| `src/components/verticals/HotelWizard.tsx` | Duplicate constants |
| `src/utils/wizardHelpers.ts` | Deprecated, has mismatched values |
| `src/utils/industryBaselines.ts` | Deprecated, verify not used |
| `src/hooks/wizard/useSystemCalculations.ts` | Has deprecated functions |
| `src/services/dataIntegrationService.ts` | Imports deprecated useCaseTemplates |

---

## ✅ VERIFIED COMPLIANT FILES

These files correctly use the SSOT architecture:

- `StreamlinedWizard.tsx` - Uses `calculateUseCasePower()`
- `CarWashWizard.tsx` - Uses `calculateCarWashEquipmentPower()`
- `EVChargingWizard.tsx` - Uses SSOT EV calculations
- `HotelEnergy.tsx` - Uses `calculateHotelPowerSimple()`
- `CarWashEnergy.tsx` - Uses `calculateCarWashPowerSimple()`
- `EVChargingEnergy.tsx` - Uses `calculateEVChargingPowerSimple()`
- `QuoteEngine.ts` - Uses `calculateUseCasePower()`
- `baselineService.ts` - Uses database + useCasePowerCalculations
