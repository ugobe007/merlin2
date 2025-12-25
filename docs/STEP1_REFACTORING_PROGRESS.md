# Step 1 Refactoring Progress

**Started:** January 3, 2025  
**Status:** In Progress

## Overview

Refactoring the 3915-line `Step1LocationGoals (1).jsx` file into a maintainable TypeScript structure following the recommended approach:

1. ✅ Extract data to separate files
2. ⏳ Split into smaller components  
3. ⏳ Migrate to TypeScript
4. ⏳ Convert inline styles to Tailwind
5. ⏳ Integrate with existing services

## Data Extraction Progress

### Completed ✅
- `src/utils/step1Helpers.ts` - Helper functions (getSolarRatingFromSunHours, etc.)
- `src/data/step1GoalsData.ts` - Goals data (6 goals)

### In Progress ⏳
- US State Data (`step1LocationData.ts`):
  - STATE_ELECTRICITY_RATES (50 states + territories)
  - STATE_SUNSHINE_HOURS (50 states + territories)
  - STATE_NAMES (state code → full name mapping)
  - ZIP_RANGES (3-digit prefix → state mapping)
  - ZIP_PREFIX_CITIES (3-digit prefix → city mapping)
  - ZIP_DB (5000+ ZIP codes → [city, state] pairs) - **LARGE DATASET**
  - getDefaultCityForState helper

- International Data (`step1InternationalData.ts`):
  - countryFlags (100+ countries)
  - INTERNATIONAL_DATA (100+ countries with rates, sun hours, cities) - **LARGE DATASET**

### Estimated Data Size
- ZIP_DB: ~5000+ entries
- INTERNATIONAL_DATA: ~100 countries × ~5-10 cities each = ~500-1000 entries
- Total extracted data: ~6000+ entries

## Component Structure Plan

```
Step1LocationGoals.tsx (Main orchestrator)
├── LocationTypeToggle.tsx (US/International toggle)
├── USLocationInput.tsx
│   ├── ZipCodeInput
│   ├── StateDropdown
│   ├── CityInput (auto-populated)
│   └── StreetAddressInput
├── InternationalLocationInput.tsx
│   ├── CountrySelector
│   ├── CitySelector (tiered)
│   └── StreetAddressInput
├── GeographicInsights.tsx
│   ├── SolarMetricCard
│   └── CommercialRatePopup / RatingLegendPopup
└── GoalsSelection.tsx
    └── GoalCard (6 goals with progress indicator)
```

## Next Steps

1. Complete data extraction (US state data, international data)
2. Create component skeletons with TypeScript interfaces
3. Convert inline styles to Tailwind (preserve visual design)
4. Integrate with `useUtilityRates` hook (hybrid approach)
5. Test with wizard state management

## Notes

- The ZIP_DB dataset is very large (~5000 entries). Consider lazy loading or pagination if needed.
- International data is comprehensive but may need periodic updates.
- Static data serves as fallback; primary data source should be API services where available.

