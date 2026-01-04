# Service Deprecation Status

## Porsche 911 Architecture Migration

### ✅ NEW ARCHITECTURE (USE THESE)
```
src/services/
├── merlin/index.ts              # Public API entry point
├── MerlinOrchestrator.ts        # General contractor
├── TrueQuoteEngineV2.ts         # Prime sub (SSOT for quotes)
├── MagicFit.ts                  # Option generation
├── contracts.ts                 # Type definitions
├── calculators/
│   ├── loadCalculator.ts        # Peak demand calculations
│   ├── bessCalculator.ts        # Battery sizing
│   ├── solarCalculator.ts       # Solar sizing
│   ├── generatorCalculator.ts   # Generator sizing
│   ├── evCalculator.ts          # EV charger sizing
│   └── financialCalculator.ts   # ROI, NPV, payback
├── validators/
│   └── proposalValidator.ts     # Quote authentication
└── data/
    ├── constants.ts             # SSOT fallback constants
    ├── stateElectricityRates.ts # US state rates
    └── internationalRates.ts    # International rates
```

### ⚠️ DEPRECATED (BEING PHASED OUT)
| File | Status | Used By | Migration Target |
|------|--------|---------|------------------|
| TrueQuoteEngine.ts | DEPRECATED | useTrueQuote.ts, loadCalculator.ts | Q1 2026 |

### ✅ STILL ACTIVE (NOT DEPRECATED)
| File | Purpose | Notes |
|------|---------|-------|
| centralizedCalculations.ts | Financial metrics (NPV, IRR) | Many components depend on it |
| utilityRateService.ts | Utility rate lookups | SSOT for utility data |
| calculationConstantsService.ts | Database constants | SSOT for constants |
| unifiedPricingService.ts | Equipment pricing | SSOT for prices |
| stateIncentivesService.ts | State incentives | SSOT for incentives |

### Migration Notes

**What moved to new architecture:**
- Industry-specific load calculations → `loadCalculator.ts`
- BESS sizing logic → `bessCalculator.ts`
- Solar sizing logic → `solarCalculator.ts`
- Quote generation flow → `MerlinOrchestrator.ts` → `TrueQuoteEngineV2.ts`
- Option generation → `MagicFit.ts`

**What stays in place:**
- `centralizedCalculations.ts` - Still used by many components for financial metrics
- `utilityRateService.ts` - SSOT for utility rates
- `calculationConstantsService.ts` - SSOT for database constants

**Next steps (future work):**
1. Move TRUEQUOTE_CONSTANTS to data/constants.ts
2. Move INDUSTRY_CONFIGS to data/industryConfigs.ts  
3. Update useTrueQuote.ts to use TrueQuoteEngineV2
4. Delete old TrueQuoteEngine.ts
