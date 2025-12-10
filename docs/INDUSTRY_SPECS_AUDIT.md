# Industry Specs Implementation Audit

**Generated:** December 10, 2025  
**Purpose:** Verify that industry specifications are properly integrated into the SSOT

---

## Summary

| Use Case | Specs Received | Implemented in SSOT | Location | Status |
|----------|---------------|---------------------|----------|--------|
| **Data Center** | ✅ Full | ✅ Full | `useCasePowerCalculations.ts` lines 99-530 | ✅ COMPLETE |
| **Office Building** | ✅ Full | ✅ Full | `useCasePowerCalculations.ts` lines 544-612 | ✅ COMPLETE |
| **University/Campus** | ✅ Full | ✅ Full | `useCasePowerCalculations.ts` lines 615-688 | ✅ COMPLETE |
| **Airport** | ✅ Full | ✅ Full | `useCasePowerCalculations.ts` lines 690-850 | ✅ COMPLETE |
| **Hotel** | ✅ Full | ✅ Full | `useCasePowerCalculations.ts` lines 1870-2650 | ✅ COMPLETE |
| **Car Wash** | ✅ Full | ✅ Full | `useCasePowerCalculations.ts` lines 2940-3450 | ✅ COMPLETE |

---

## 1. DATA CENTER Specifications ✅

### Classifications (Implemented)
| Classification | IT Load Range | Total Facility | PUE | Status |
|---------------|---------------|----------------|-----|--------|
| Edge/Micro | 50-500 kW | 75-750 kW | 1.5-2.0 | ✅ |
| Small | 500-2,000 kW | 750-3,000 kW | 1.3-1.65 | ✅ |
| Medium | 2-10 MW | 3-15 MW | 1.2-1.45 | ✅ |
| Large | 10-50 MW | 15-75 MW | 1.1-1.30 | ✅ |
| Hyperscale | 50-300 MW | 75-450 MW | 1.05-1.20 | ✅ |

### Tier Standards (Implemented)
| Tier | BESS Multiplier | Duration | Source |
|------|-----------------|----------|--------|
| Tier I | 30% of IT load | 2 hours | Uptime Institute |
| Tier II | 40% of IT load | 3 hours | Uptime Institute |
| Tier III | 50% of IT load | 4 hours | Uptime Institute |
| Tier IV | 70% of IT load | 6 hours | Uptime Institute |

### BESS Sizing (Implemented)
```typescript
export const DATA_CENTER_BESS_SIZING = {
  edge: { sizeMWh: { min: 0.1, max: 0.5 }, powerMW: { min: 0.05, max: 0.2 } },
  small: { sizeMWh: { min: 0.5, max: 2 }, powerMW: { min: 0.2, max: 0.75 } },
  medium: { sizeMWh: { min: 2, max: 10 }, powerMW: { min: 0.75, max: 3 } },
  large: { sizeMWh: { min: 10, max: 50 }, powerMW: { min: 3, max: 15 } },
  hyperscale: { sizeMWh: { min: 40, max: 200 }, powerMW: { min: 10, max: 60 } },
};
```

### Grid Requirements (Implemented)
```typescript
export const DATA_CENTER_GRID_REQUIREMENTS = {
  edge: { voltageKV: 0.48, services: 1 },
  small: { voltageKV: 4.16, services: 2 },
  medium: { voltageKV: 13.8, services: 4 },
  large: { voltageKV: 34.5, services: 8 },
  hyperscale: { voltageKV: 69, services: 16 },
};
```

---

## 2. OFFICE BUILDING Specifications ✅

### Classifications (Implemented)
| Classification | Sq Ft Range | Peak Load | W/sqft | Status |
|---------------|-------------|-----------|--------|--------|
| Small Office | 10K-50K | 75-400 kW | 6-10 | ✅ |
| Medium Office | 50K-150K | 400-1,200 kW | 7-12 | ✅ |
| Large Office | 150K-500K | 1,200-4,000 kW | 8-14 | ✅ |
| High-Rise Tower | 500K-2M | 4,000-16,000 kW | 10-16 | ✅ |
| Corporate Campus | 1M-10M | 10-80 MW | 8-14 | ✅ |

### BESS Sizing (Implemented)
```typescript
export const OFFICE_BESS_SIZING = {
  smallOffice: { sizeMWh: { min: 0.05, max: 0.2 }, powerMW: { min: 0.025, max: 0.1 } },
  mediumOffice: { sizeMWh: { min: 0.2, max: 0.8 }, powerMW: { min: 0.05, max: 0.15 } },
  largeOffice: { sizeMWh: { min: 0.8, max: 3 }, powerMW: { min: 0.15, max: 0.5 } },
  highRiseTower: { sizeMWh: { min: 2, max: 10 }, powerMW: { min: 0.4, max: 1.5 } },
  corporateCampus: { sizeMWh: { min: 8, max: 50 }, powerMW: { min: 1, max: 8 } },
};
```

---

## 3. UNIVERSITY/CAMPUS Specifications ✅

### Classifications (Implemented)
| Classification | Enrollment | Peak Load | kW/Student | Status |
|---------------|-----------|-----------|------------|--------|
| Small College | 1K-5K | 5-28 MW | 2-4 | ✅ |
| Medium University | 5K-15K | 22-115 MW | 3-5 | ✅ |
| Large University | 15K-35K | 75-420 MW | 4-6 | ✅ |
| Major Research | 35K-60K | 235 MW-1.25 GW | 5-8 | ✅ |
| Mega University | 60K-100K | 630 MW-3.7 GW | 5-7 | ✅ |

### BESS Sizing (Implemented)
```typescript
export const UNIVERSITY_BESS_SIZING = {
  smallCollege: { sizeMWh: { min: 0.5, max: 2 }, powerMW: { min: 0.2, max: 0.75 } },
  mediumUniversity: { sizeMWh: { min: 2, max: 10 }, powerMW: { min: 0.75, max: 3 } },
  largeUniversity: { sizeMWh: { min: 10, max: 40 }, powerMW: { min: 3, max: 12 } },
  majorResearch: { sizeMWh: { min: 30, max: 120 }, powerMW: { min: 10, max: 40 } },
  megaUniversity: { sizeMWh: { min: 80, max: 300 }, powerMW: { min: 25, max: 100 } },
};
```

---

## 4. AIRPORT Specifications ✅

### Classifications (Implemented)
| Classification | Annual Passengers | Facility Load | Peak Demand | Status |
|---------------|------------------|---------------|-------------|--------|
| Small Regional | < 1M | 2-10 MW | 2-6 MW | ✅ |
| Medium Regional | 1-5M | 10-30 MW | 6-18 MW | ✅ |
| Large Regional | 5-15M | 30-75 MW | 18-55 MW | ✅ |
| Major Hub | 15-50M | 75-200 MW | 55-175 MW | ✅ |
| Mega Hub | 50-150M | 150-350 MW | 125-300 MW | ✅ |

### BESS Sizing (Implemented)
```typescript
export const AIRPORT_BESS_SIZING = {
  smallRegional: { sizeMWh: { min: 1, max: 4 }, powerMW: { min: 0.3, max: 1.5 } },
  mediumRegional: { sizeMWh: { min: 4, max: 15 }, powerMW: { min: 1.5, max: 5 } },
  largeRegional: { sizeMWh: { min: 15, max: 50 }, powerMW: { min: 5, max: 15 } },
  majorHub: { sizeMWh: { min: 50, max: 150 }, powerMW: { min: 15, max: 50 } },
  megaHub: { sizeMWh: { min: 100, max: 300 }, powerMW: { min: 40, max: 100 } },
};
```

---

## 5. HOTEL Specifications ✅

### Real-World Solar Benchmark: Marriott Lancaster, PA ⭐ NEW
First fully solar-powered Marriott hotel in the US (6+ years operational):

| Metric | Value | Derived |
|--------|-------|---------|
| Rooms | 133 | - |
| Solar Panels | 2,700 | 20.3 panels/room |
| Annual Consumption | 1,177,000 kWh | 8,850 kWh/room/year |
| Daily Consumption | - | 24.2 kWh/room/day |
| Annual Generation | 1,239,000 kWh | 105% offset |
| CO₂ Avoided (6.5 yrs) | ~6,000 metric tons | ~923 tons/year |
| LED Impact | -15% demand | Verified |

**Source:** Marriott International sustainability report, December 2025

### Facility Types (Implemented)
| Classification | Room Range | Connected Load | Peak Load | kW/Room | Status |
|---------------|-----------|----------------|-----------|---------|--------|
| Small/Boutique | 20-75 | 150-400 kW | 100-300 kW | 5-8 | ✅ |
| Medium/Select-Service | 75-150 | 400-800 kW | 300-600 kW | 5-7 | ✅ |
| Large/Full-Service | 150-400 | 800 kW-2 MW | 600 kW-1.5 MW | 5-8 | ✅ |
| Luxury/Resort | 200-500 | 1.5-4 MW | 1-3 MW | 8-12 | ✅ |
| Corporate/Convention | 300-1000 | 2.5-6 MW | 1.8-4.5 MW | 6-10 | ✅ |

### Equipment Power Database (Implemented)
All equipment categories with min/max/typical values by facility type:
- ✅ HVAC Systems (chillers, cooling towers, pumps, AHUs, exhaust fans)
- ✅ Domestic Hot Water (heaters, recirculation, boosters)
- ✅ Lighting (guest rooms, lobby, corridors, parking, exterior)
- ✅ Food Service (coolers, freezers, ovens, ranges, dishwashers)
- ✅ Laundry (washers, dryers, ironers)
- ✅ Vertical Transport (elevators, escalators)
- ✅ Pool/Spa (pumps, heaters, jets)
- ✅ IT/Telecom (servers, WiFi, POS)

### Simple Hotel Profiles (For landing pages)
```typescript
export const HOTEL_CLASS_PROFILES_SIMPLE = {
  economy: { name: 'Economy/Budget', kWhPerRoom: 25, peakKWPerRoom: 1.5 },
  midscale: { name: 'Midscale', kWhPerRoom: 35, peakKWPerRoom: 2.2 },
  upscale: { name: 'Upscale', kWhPerRoom: 50, peakKWPerRoom: 3.2 },
  luxury: { name: 'Luxury', kWhPerRoom: 75, peakKWPerRoom: 4.5 },
};
```

---

## 6. CAR WASH Specifications ✅

### Equipment Power Database (Implemented)
| Equipment Category | Power Range | Status |
|-------------------|-------------|--------|
| Conveyor Systems | 4-8 kW | ✅ |
| Washing Equipment | 20-35 kW | ✅ |
| High-Pressure Systems | 15-25 kW | ✅ |
| Chemical Application | 3-8 kW | ✅ |
| Drying Systems | 30-90 kW | ✅ (Largest consumer) |
| Vacuum Systems | 15-60 kW | ✅ |
| Water Heating | 1-50 kW | ✅ |
| Air Compression | 4-12 kW | ✅ |
| Water Reclamation | 3-10 kW | ✅ |
| Facility Loads | 5-20 kW | ✅ |

### Automation Levels (Implemented)
```typescript
export const CAR_WASH_AUTOMATION_LEVELS = {
  legacy: { powerMultiplier: 0.85, additionalKW: 2 },
  standard: { powerMultiplier: 1.0, additionalKW: 4 },
  modern: { powerMultiplier: 1.08, additionalKW: 8 },
};
```

### Simple Car Wash Profiles (For landing pages)
```typescript
export const CAR_WASH_POWER_PROFILES_SIMPLE = {
  selfService: { name: 'Self-Service', peakKWPerBay: 8, kWhPerBay: 50 },
  automatic: { name: 'In-Bay Automatic', peakKWPerBay: 45, kWhPerBay: 200 },
  tunnel: { name: 'Conveyor Tunnel', peakKWPerBay: 80, kWhPerBay: 400 },
  fullService: { name: 'Full-Service', peakKWPerBay: 120, kWhPerBay: 600 },
};
```

---

## Integration Verification

### Are specs being used in calculations?

| Use Case | Wizard Uses SSOT | Landing Page Uses SSOT | Quote Generation Uses SSOT |
|----------|------------------|------------------------|---------------------------|
| Data Center | ✅ via `calculateDataCenterPowerSimple()` | ✅ via `calculateDataCenterPowerSimple()` | ✅ via `calculateQuote()` |
| Office | ✅ via `calculateOfficePowerSimple()` | ✅ via `calculateOfficePowerSimple()` | ✅ via `calculateQuote()` |
| University | ✅ via `calculateUniversityPowerSimple()` | N/A | ✅ via `calculateQuote()` |
| Airport | ✅ via `calculateAirportPowerSimple()` | N/A | ✅ via `calculateQuote()` |
| Hotel | ✅ via `calculateHotelPowerSimple()` | ✅ via `calculateHotelPowerSimple()` | ✅ via `calculateQuote()` |
| Car Wash | ✅ via `calculateCarWashPowerSimple()` | ✅ via `calculateCarWashPowerSimple()` | ✅ via `calculateQuote()` |

---

## Data Sources (All Cited)

| Source | Categories Used |
|--------|-----------------|
| Uptime Institute | Data Center Tier standards |
| ASHRAE 90.1 | Office, Hotel HVAC standards |
| ASHRAE TC 9.9 | Data Center thermal guidelines |
| CBECS 2018 | Commercial building energy benchmarks |
| Energy Star | Building performance benchmarks |
| FAA AC 150/5370-2G | Airport electrical standards |
| ICAO | International airport standards |
| APPA | University power benchmarks |
| Carnegie Classification | University sizing |
| ICA (International Carwash Association) | Car wash equipment standards |
| SAE J1772 | EV charger standards |

---

## Recommendations

### ✅ Complete
1. All 5 use case specifications have been fully integrated
2. Industry sources are properly cited
3. Equipment power databases are comprehensive
4. Classification ranges match provided specs
5. BESS sizing recommendations are implemented
6. Grid interconnection requirements are documented

### 🔄 Optional Enhancements
1. Add dynamic database lookup for specs (currently hardcoded in TS)
2. Add seasonal variation factors (partially implemented)
3. Add regional climate adjustments for HVAC loads
4. Add more granular equipment breakdowns for hospitals

---

*Last Updated: December 10, 2025*
