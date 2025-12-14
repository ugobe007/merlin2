# Merlin Updates - December 4, 2025
## Systematic Enhancements Across All Verticals

**Status:** 🚧 In Progress  
**SSOT Compliance:** ✅ Required  
**TrueQuote™ Compliance:** ✅ Required  
**Scope:** Cross-vertical improvements to solar validation, revenue calculations, and UX consistency

---

## 📋 IMPLEMENTATION PHASES

### **PHASE 1: Solar Infrastructure Enhancement** (Priority: HIGH)
Expand solar capabilities with ground-mount, carport, and validation across all verticals.

#### 1.1 Ground-Mount Solar Option ✅
**Objective:** Allow facilities to specify ground-mount solar when roof space is insufficient  
**SSOT Location:** `src/services/useCasePowerCalculations.ts`  
**TrueQuote™ Sources:** 
- NREL Solar Land Use Requirements (2021)
- SEIA Ground-Mount Best Practices Guide
- DOE Solar Energy Technologies Office

**Implementation:**
- Add `GROUND_MOUNT_SOLAR_CONSTRAINTS` constant
- Add `calculateGroundMountSolarCapacity()` function
- Ground area required: ~5-6 acres per MW (fixed-tilt) or 7-8 acres per MW (single-axis tracking)
- UI: Radio button choice: Rooftop / Ground-Mount / Carport

**Files to Modify:**
- `useCasePowerCalculations.ts` - Add ground-mount calculations
- `CarWashWizard.tsx` - Add ground-mount UI option
- `HotelWizard.tsx` - Add ground-mount UI option
- `EVChargingWizard.tsx` - Add ground-mount UI option

---

#### 1.2 Carport Solar Calculator ✅
**Objective:** Calculate solar capacity for customer parking area coverage  
**SSOT Location:** `src/services/useCasePowerCalculations.ts`  
**TrueQuote™ Sources:**
- EV charging + solar carport dual-purpose design standards
- Typical parking space: 9' × 18' = 162 sq ft
- Carport solar: 10-12W per sq ft usable (lower than roof due to height/shading)

**Implementation:**
- Add `CARPORT_SOLAR_CONSTRAINTS` constant
- Add `calculateCarportSolarCapacity()` function
- Input: Number of parking spaces
- Output: Solar kW potential + shading/charging benefits

**Files to Modify:**
- `useCasePowerCalculations.ts` - Add carport calculations
- `CarWashWizard.tsx` - Add parking spaces input
- `HotelWizard.tsx` - Add parking spaces input
- `EVChargingWizard.tsx` - Add parking spaces input (priority - EV charging hubs)

---

#### 1.3 Zip Code Solar Irradiance (NREL PVWatts API) 🔄
**Objective:** Replace state-level solar estimates with precise zip code data  
**SSOT Location:** `src/services/solarIrradianceService.ts` (NEW)  
**TrueQuote™ Sources:**
- NREL PVWatts API v6 (authoritative solar production estimates)
- TMY3 (Typical Meteorological Year) data by location

**Implementation:**
- Create new service: `solarIrradianceService.ts`
- Functions: `getSolarIrradianceByZip()`, `estimateAnnualProduction()`
- Cache results in localStorage/Supabase to avoid API rate limits
- Fallback to state-level if API unavailable
- API Key: Free NREL Developer API (rate limit: 1,000 calls/hour)

**Files to Create:**
- `src/services/solarIrradianceService.ts` - New SSOT service
- `src/types/solarIrradiance.types.ts` - Type definitions

**Files to Modify:**
- `unifiedQuoteCalculator.ts` - Integrate zip-level solar production
- All wizard files - Add zip code input validation
- `.env.example` - Add `VITE_NREL_API_KEY`

---

#### 1.4 Hotel Roof Validation 🔄
**Objective:** Add physical roof constraints for hotels (similar to car wash)  
**SSOT Location:** `useCasePowerCalculations.ts`  
**TrueQuote™ Sources:**
- American Hotel & Lodging Association (AHLA) building standards
- Typical hotel roof: 15,000-50,000 sq ft (varies by floors and footprint)
- Usable roof: 60-70% (lower than car wash due to HVAC, vents, penthouses)

**Implementation:**
- Add `HOTEL_FACILITY_CONSTRAINTS` constant
- Add `validateHotelSolarCapacity()` function
- Scale by hotel class: Economy (smaller roof), Luxury (larger roof but more rooftop equipment)

**Files to Modify:**
- `useCasePowerCalculations.ts` - Add hotel validation
- `HotelWizard.tsx` - Add validation UI and warnings

---

### **PHASE 2: Revenue Enhancement - Net Metering** (Priority: HIGH)

#### 2.1 Net Metering Revenue Calculations ✅
**Objective:** Add "Generate Revenue" goal with grid export revenue projections  
**SSOT Location:** `src/services/centralizedCalculations.ts`  
**TrueQuote™ Sources:**
- DSIRE (Database of State Incentives for Renewables & Efficiency)
- State Public Utility Commission (PUC) net metering rates by state
- FERC (Federal Energy Regulatory Commission) wholesale rates

**Implementation:**
- Add `NET_METERING_RATES_BY_STATE` constant (50 states + territories)
- Add `calculateNetMeteringRevenue()` function
- Revenue = (Solar generation - On-site consumption) × Export rate
- Include: Retail rate credit, wholesale rate, time-of-use multipliers
- Cap: Many states limit export to 100-120% of annual consumption

**Files to Create:**
- `src/services/netMeteringService.ts` - New SSOT service
- `src/data/netMeteringRates.ts` - State-by-state rates

**Files to Modify:**
- `centralizedCalculations.ts` - Integrate revenue calculations
- `wizardConstants.ts` - Add "Generate Revenue" to GOAL_OPTIONS
- All wizard files - Add UI for revenue goal

---

### **PHASE 3: UX Consistency - Accept/Customize Modal** (Priority: MEDIUM)

#### 3.1 Shared Accept/Customize Modal Component 🔄
**Objective:** Create reusable modal for all verticals  
**Location:** `src/components/wizard/shared/AcceptCustomizeModal.tsx`

**Features:**
- AI recommendation summary (BESS, Solar, Generator, Payback, Savings)
- Two-choice buttons: Accept AI Setup / Customize Configuration
- Branded with TrueQuote™ badge
- Configurable color scheme per vertical

**Files to Create:**
- `src/components/wizard/shared/AcceptCustomizeModal.tsx`
- `src/components/wizard/shared/AcceptCustomizeModal.types.ts`

---

#### 3.2 Apply to Hotel Wizard ✅
**Files to Modify:**
- `HotelWizard.tsx` - Import and use shared modal
- Add state: `showAcceptCustomizeModal`, `userQuoteChoice`

---

#### 3.3 Apply to EV Charging Wizard ✅
**Files to Modify:**
- `EVChargingWizard.tsx` - Import and use shared modal
- Add state: `showAcceptCustomizeModal`, `userQuoteChoice`

---

#### 3.4 Apply to StreamlinedWizard ✅
**Files to Modify:**
- `StreamlinedWizard.tsx` - Import and use shared modal
- Add after Configuration section (Section 4)
- Show modal before Quote Results (Section 5)

---

## 📊 IMPLEMENTATION ORDER

### **Week 1 (Dec 4-8, 2025)**
1. ✅ Ground-mount solar constraints (SSOT)
2. ✅ Carport solar calculator (SSOT)
3. ✅ Create shared AcceptCustomizeModal component
4. ✅ Apply modal to HotelWizard
5. ✅ Apply modal to EVChargingWizard

### **Week 2 (Dec 9-13, 2025)**
6. 🔄 NREL PVWatts API integration
7. 🔄 Hotel roof validation
8. 🔄 Net metering service creation
9. 🔄 Apply modal to StreamlinedWizard

### **Week 3 (Dec 14-18, 2025)**
10. 🔄 State-by-state net metering rates data
11. 🔄 UI for "Generate Revenue" goal
12. 🔄 Testing and validation across all verticals
13. 🔄 Documentation updates

---

## 🎯 SUCCESS CRITERIA

### **SSOT Compliance Checklist:**
- [ ] All solar calculations in `useCasePowerCalculations.ts`
- [ ] All financial calculations in `centralizedCalculations.ts`
- [ ] All net metering data in dedicated service
- [ ] No hardcoded values in components
- [ ] All functions properly typed and documented

### **TrueQuote™ Compliance Checklist:**
- [ ] All calculations cite authoritative sources
- [ ] NREL, DSIRE, SEIA sources documented
- [ ] State PUC rates linked to official sources
- [ ] Industry standards (AHLA, ICA, ICWG) cited
- [ ] Methodology visible to users in tooltips/help text

### **UX Consistency Checklist:**
- [ ] Accept/Customize modal in all 4 wizards (Car Wash ✅, Hotel, EV, Streamlined)
- [ ] Solar validation warnings consistent across verticals
- [ ] Zip code input standardized
- [ ] Revenue calculations displayed consistently

---

## 📁 FILE STRUCTURE

```
src/
├── services/
│   ├── useCasePowerCalculations.ts (EXISTING - expand)
│   ├── centralizedCalculations.ts (EXISTING - expand)
│   ├── solarIrradianceService.ts (NEW - NREL API)
│   ├── netMeteringService.ts (NEW - Revenue)
│   └── groundMountSolarService.ts (NEW - Ground/Carport)
├── data/
│   ├── netMeteringRates.ts (NEW - State rates)
│   └── solarConstraints.ts (NEW - Industry standards)
├── components/
│   └── wizard/
│       └── shared/
│           ├── AcceptCustomizeModal.tsx (NEW)
│           ├── AcceptCustomizeModal.types.ts (NEW)
│           └── SolarValidationWarning.tsx (NEW - reusable)
└── types/
    ├── solarIrradiance.types.ts (NEW)
    └── netMetering.types.ts (NEW)
```

---

## 🔗 DEPENDENCIES

### **External APIs:**
- NREL PVWatts API v6: https://developer.nrel.gov/docs/solar/pvwatts/v6/
- DSIRE Database: https://www.dsireusa.org/

### **Environment Variables:**
```bash
VITE_NREL_API_KEY=your_api_key_here
```

### **NPM Packages (if needed):**
- None required - using native fetch()

---

## 📝 NOTES

- All changes must pass TypeScript compilation
- All changes must maintain existing functionality
- All changes must be backward compatible
- Build and deploy after each phase completion
- Update DESIGN_NOTES.md with UI changes

---

**Last Updated:** December 4, 2025  
**Next Review:** After Phase 1 completion
