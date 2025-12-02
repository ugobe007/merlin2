# MERLIN CALCULATION ARCHITECTURE
## Single Sources of Truth - November 30, 2025

This document defines the **AUTHORITATIVE** calculation architecture for Merlin.
Any calculation not flowing through these services is a BUG.

---

## 🎯 CORE PRINCIPLE

**ONE ENTRY POINT FOR QUOTES:**
```typescript
import { calculateQuote } from '@/services/unifiedQuoteCalculator';

const quote = await calculateQuote({
  storageSizeMW: 3,
  durationHours: 2,
  solarMW: 1,
  windMW: 0,
  generatorMW: 2,
  region: 'europe',
  electricityRate: 0.15,
  includeNPV: true
});

// quote.costs.* - All equipment costs
// quote.financials.* - All financial metrics
// quote.equipment.* - Hardware breakdown
```

---

## 📊 ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                     │
│  (SmartWizard, CarWashWizard, AdvancedQuoteBuilder, etc.)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     unifiedQuoteCalculator.ts                                │
│                                                                              │
│   calculateQuote(params) → { costs, financials, equipment }                 │
│   estimatePayback(params) → quick UI preview                                │
│                                                                              │
│   This is the ONLY entry point for generating quotes.                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────────┐
│ useCasePower     │   │ unifiedPricing   │   │ centralized              │
│ Calculations.ts  │   │ Service.ts       │   │ Calculations.ts          │
│                  │   │                  │   │                          │
│ • calculateUse   │   │ • getBattery     │   │ • calculateFinancial     │
│   CasePower()    │   │   Pricing()      │   │   Metrics()              │
│ • Industry       │   │ • getInverter    │   │ • calculateNPV()         │
│   standards      │   │   Pricing()      │   │ • calculateIRR()         │
│ • ASHRAE/CBECS   │   │ • Database +     │   │ • calculatePayback()     │
│                  │   │   NREL ATB       │   │ • calculateROI()         │
└──────────────────┘   └──────────────────┘   └──────────────────────────┘
          │                                              │
          ▼                                              ▼
┌──────────────────┐                       ┌──────────────────────────┐
│ evCharging       │                       │ professionalFinancial    │
│ Calculations.ts  │                       │ Model.ts                 │
│                  │                       │                          │
│ • L2 (7-22 kW)   │                       │ • 3-statement model      │
│ • DCFC (50-150)  │                       │ • DSCR analysis          │
│ • HPC (250-350)  │                       │ • Levered/Unlevered IRR  │
│ • NO "LEVEL 3"!  │                       │ • Bank-ready output      │
└──────────────────┘                       └──────────────────────────┘
```

---

## 🗂️ FILE RESPONSIBILITIES

### ✅ CORE SERVICES (6 files) - DO NOT MODIFY WITHOUT REVIEW

| File | Responsibility | Key Functions |
|------|---------------|---------------|
| `unifiedQuoteCalculator.ts` | **ENTRY POINT** for all quotes | `calculateQuote()`, `estimatePayback()` |
| `useCasePowerCalculations.ts` | Industry power standards | `calculateUseCasePower()`, `calculateOfficePower()`, etc. |
| `evChargingCalculations.ts` | EV charger specs & costs | `calculateEVHubPower()`, `calculateEVHubCosts()` |
| `centralizedCalculations.ts` | Financial metrics | `calculateFinancialMetrics()`, NPV, IRR, ROI |
| `unifiedPricingService.ts` | Equipment pricing | `getBatteryPricing()`, `getInverterPricing()` |
| `professionalFinancialModel.ts` | Bank-ready reports | `generateProfessionalModel()` |

### ✅ SUPPORTING SERVICES (Keep)

| File | Responsibility |
|------|---------------|
| `baselineService.ts` | Database-driven BESS sizing |
| `powerGapAnalysis.ts` | Gap analysis / "aha moment" |
| `powerProfileService.ts` | Gamification scoring |
| `marketIntelligence.ts` | NREL ATB market data |
| `advancedBessAnalytics.ts` | ML/optimization features |
| `aiOptimizationService.ts` | AI recommendations |
| `dataIntegrationService.ts` | API orchestration |

### ❌ DEPRECATED SERVICES (Do not use)

| File | Reason | Use Instead |
|------|--------|-------------|
| `bessDataService.ts` | Duplicate financials | `unifiedQuoteCalculator.ts` |
| `pricingService.ts` | RM-based legacy pricing | `unifiedPricingService.ts` |
| `pricingConfigService.ts` | Duplicate interfaces | `unifiedPricingService.ts` |
| `pricingIntelligence.ts` | Merge with marketIntelligence | `marketIntelligence.ts` |

---

## 🔌 EV CHARGER STANDARDS

**THERE IS NO "LEVEL 3" CHARGER!**

The industry uses:

| Category | Power Range | Connector | Use Case |
|----------|-------------|-----------|----------|
| **Level 1** | 1.4-1.9 kW | J1772 | Residential |
| **Level 2** | 7-22 kW | J1772/Type 2 | Workplace, retail |
| **DCFC** | 50-150 kW | CCS/CHAdeMO | Fast charging |
| **HPC** | 250-350 kW | CCS | Ultra-fast, highway |

Use `evChargingCalculations.ts`:
```typescript
import { calculateEVHubPower, EV_CHARGER_SPECS } from '@/services/evChargingCalculations';

const config = {
  level2_7kw: 100,   // 100 × 7 kW L2 chargers
  dcfc_150kw: 20,    // 20 × 150 kW DC fast
  hpc_350kw: 16      // 16 × 350 kW high power
};

const power = calculateEVHubPower(config, 70); // 70% concurrency
// power.totalPowerMW = 9.3 MW
// power.peakDemandMW = 6.5 MW
```

---

## 📝 FIELD NAME STANDARDS

### EV Charging Fields (in custom_questions)
```
level2_7kw      - Number of 7 kW Level 2 chargers
level2_11kw     - Number of 11 kW Level 2 chargers  
level2_19kw     - Number of 19.2 kW Level 2 chargers
level2_22kw     - Number of 22 kW Level 2 chargers
dcfc_50kw       - Number of 50 kW DC fast chargers
dcfc_150kw      - Number of 150 kW DC fast chargers
hpc_250kw       - Number of 250 kW high power chargers
hpc_350kw       - Number of 350 kW high power chargers
```

### Legacy Field Names (supported for backward compatibility)
```
level1Count            → maps to Level 1 (1.9 kW)
level2Count            → maps to level2_19kw
dcfastCount            → maps to dcfc_150kw
numberOfLevel2Chargers → maps to level2_19kw
numberOfDCFastChargers → maps to dcfc_150kw
```

---

## 🚨 FORBIDDEN PATTERNS

```typescript
// ❌ NEVER do this:
const cost = storageSizeMW * durationHours * 300000;  // Hardcoded pricing!
const payback = cost / savings;                       // Manual calculation!
import { calculateBESSFinancials } from './bessDataService'; // Deprecated!
import { calculateROI } from './pricingService';      // Deprecated!

// ✅ ALWAYS do this:
import { calculateQuote } from '@/services/unifiedQuoteCalculator';
const quote = await calculateQuote({ storageSizeMW, durationHours, ... });
```

---

## 🧪 VALIDATION

Run this to verify West London EV Hub calculations:
```bash
npx tsx scripts/validate_west_london.ts
```

Expected output:
- Total Power: 9,300 kW (9.3 MW) ✅
- Peak Demand (70%): 6,510 kW (6.5 MW) ✅
- EV Hardware (USD): ~$6.8M → £5M GBP ✅

---

## 📅 Migration Timeline

| Date | Action |
|------|--------|
| Nov 30, 2025 | Architecture documented |
| Dec 2025 | Remove deprecated imports from components |
| Jan 2026 | Delete deprecated service files |

---

*Last updated: November 30, 2025*
*Maintainer: Architecture Team*
