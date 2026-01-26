# Location Intelligence Strategy - TrueQuote™ Energy Consultant System

**Date:** January 25, 2026  
**Vision:** The wizard acts as an intelligent energy consultant using location-based intelligence  
**Goal:** Calculate accurate energy opportunities using STATE-based lookup tables for utility rates, solar potential, and industry-specific savings  

---

## 🎯 Strategic Vision

**The wizard should act like a professional energy consultant:**

1. **Location Intelligence** → Identifies energy opportunities by state/region
2. **Industry Intelligence** → Applies industry-specific power usage patterns
3. **Financial Intelligence** → Calculates accurate savings using lookup tables
4. **Quote Generation** → Produces TrueQuote™ SSOT-accurate bids

**User Journey:**
```
ZIP Code Entry → Google Maps API → STATE Recognition → Energy Profile Building
     ↓                 ↓                    ↓                      ↓
  94102          San Francisco, CA    CA Utility Rates     Office: 500kW peak
                                      5.8 sun hours         $0.22/kWh rate
                                      High TOU spread       20% arbitrage opp
```

---

## 🏗️ Current Infrastructure (Already Built)

### ✅ Database Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `zip_codes` | ZIP → City/State mapping | ✅ Created (Jan 3, 2025) |
| `utility_rates` | State/utility rate data | ✅ Created (Dec 2, 2024) |
| `solar_data_cache` | ZIP → Solar radiation cache | ✅ Created (Jan 3, 2025) |
| `business_lookup_cache` | Google Places cache (30-day TTL) | ✅ Created (Jan 22, 2026) |

### ✅ Services Layer

| Service | Function | Status |
|---------|----------|--------|
| `geocodingService.ts` | Google Maps geocoding | ✅ Built |
| `googlePlacesService.ts` | Business lookup | ✅ Built (Jan 22) |
| `utilityRateService.ts` | NREL + EIA rate lookup | ✅ Built (Jan 14) |
| `pvWattsService.ts` | NREL solar production | ✅ Built (Jan 14) |
| `locationEnrichmentService.ts` | Orchestrates all APIs | ✅ Built |

### ✅ Backend Proxy (Security)

| Component | Purpose | Status |
|-----------|---------|--------|
| `/server/index.js` | Express server (port 3001) | ✅ Built (Jan 22) |
| `/server/routes/places.js` | Google Places API proxy | ✅ Built |
| Vite proxy config | `/api` → `localhost:3001` | ✅ Configured |

---

## 🚨 Current Gap: Step 1 Location Intelligence

### Problem: Temporary Hardcoded Lookup
**File:** `src/components/wizard/v6/steps/Step1AdvisorLed.tsx`

```typescript
// ❌ TEMPORARY FIX (Jan 25, 2026) - Only covers 11 major states
function getStateFromZip(zip: string): string | null {
  const zipNum = parseInt(zip);
  if (zipNum >= 90000 && zipNum <= 96999) return "CA";
  if (zipNum >= 10000 && zipNum <= 14999) return "NY";
  // ... only 11 states total
  return null; // ⚠️ Fails for 39 other states!
}
```

**Issues:**
1. ❌ Only covers 11 states (CO, CA, NY, TX, FL, GA, IL, LA, AZ, OR, WA, DC)
2. ❌ Doesn't use database `zip_codes` table
3. ❌ Doesn't use Google Maps API
4. ❌ Doesn't enrich with utility rates or solar data

### Solution: Proper Location Intelligence Flow

```typescript
// ✅ CORRECT APPROACH - Use existing infrastructure
async function handleZipEntry(zipCode: string) {
  // STEP 1: Optimistic UI update (immediate feedback)
  updateState({
    zipCode,
    state: "", // Placeholder - will be filled by enrichment
    country: "US",
    currency: "USD",
  });

  // STEP 2: Database lookup (fastest - 5ms)
  const dbResult = await supabase
    .from('zip_codes')
    .select('city, state_code, state_name, latitude, longitude')
    .eq('zip_code', zipCode)
    .single();

  if (dbResult.data) {
    // ✅ STATE RECOGNIZED from database
    updateState({
      state: dbResult.data.state_code,
      city: dbResult.data.city,
      latitude: dbResult.data.latitude,
      longitude: dbResult.data.longitude,
    });

    // STEP 3: Enrich with energy intelligence (parallel)
    const [utilityData, solarData, weatherData] = await Promise.allSettled([
      getCommercialRateByZip(zipCode), // Utility rates
      getSolarDataByZip(zipCode),      // Solar peak hours
      getWeatherData(zipCode),         // Climate risk
    ]);

    // STEP 4: Calculate energy opportunities
    const energyProfile = {
      utilityRate: utilityData?.rate || 0.12,
      demandCharge: utilityData?.demandCharge || 15,
      solarPeakHours: solarData?.peak_sun_hours || 4.5,
      touSpread: utilityData?.hasTOU ? 0.15 : 0,
      arbitrageOpportunity: calculateArbitrageScore(utilityData),
    };

    updateState({ energyProfile });
  } else {
    // STEP 5: Fallback to Google Maps API (300ms)
    const geocoded = await geocodeLocation(zipCode);
    // Save to database for future lookups
  }
}
```

---

## 📊 Energy Intelligence Lookup Tables (State-Based)

### Table 1: Utility Rate Intelligence by State

**Database:** `utility_rates` table (already exists)

**Sample Data:**
| State | Avg Rate | Demand Charge | TOU Available | Peak/Off-Peak Spread | Arbitrage Score |
|-------|----------|---------------|---------------|---------------------|-----------------|
| CA | $0.2794/kWh | $25/kW | ✅ Yes | $0.15/kWh | 9/10 |
| NY | $0.1815/kWh | $22/kW | ✅ Yes | $0.12/kWh | 8/10 |
| TX | $0.1167/kWh | $18/kW | ✅ Yes | $0.10/kWh | 7/10 |
| FL | $0.1124/kWh | $15/kW | ❌ No | N/A | 3/10 |
| OH | $0.1095/kWh | $12/kW | ❌ No | N/A | 2/10 |

**Usage in Quote:**
```typescript
const utilityIntel = await getUtilityIntelligence(state);
const annualSavings = {
  demandChargeReduction: peakKW * utilityIntel.demandCharge * 12,
  energyArbitrage: utilityIntel.touSpread > 0.08 
    ? bessKWh * 365 * utilityIntel.touSpread 
    : 0,
  backup: criticalLoad * utilityIntel.avgRate * outageHours,
};
```

### Table 2: Solar Peak Hours by State

**Database:** `solar_data_cache` table (already exists)

**Sample Data:**
| State | Peak Sun Hours | Solar Rating | Capacity Factor | Best Tracker Gain |
|-------|---------------|--------------|-----------------|-------------------|
| AZ | 5.8 hrs/day | A+ | 26% | +35% |
| CA | 5.5 hrs/day | A | 25% | +30% |
| TX | 5.0 hrs/day | B+ | 22% | +28% |
| FL | 4.8 hrs/day | B | 21% | +25% |
| NY | 3.9 hrs/day | C | 17% | +20% |
| WA | 3.2 hrs/day | D | 14% | +18% |

**Usage in Quote:**
```typescript
const solarIntel = await getSolarIntelligence(state, zipCode);
const solarProduction = {
  annualKWh: solarKW * solarIntel.peakHours * 365,
  rating: solarIntel.rating, // Display: "☀️ A-rated solar location"
  recommendation: solarIntel.rating >= 'B' 
    ? "Excellent solar opportunity - high ROI"
    : "Moderate solar potential - consider wind hybrid",
};
```

### Table 3: Industry Power Usage Lookup (Already Exists)

**Database:** `custom_questions` table + `useCasePowerCalculations.ts`

**Sample Data:**
| Industry | kW per Unit | Unit Type | Load Factor | Critical % |
|----------|-------------|-----------|-------------|------------|
| Hotel | 1.5 kW/room | rooms | 65% | 50% |
| Hospital | 3.0 kW/bed | beds | 85% | 85% |
| Office | 1.8 kW/1000sqft | sqft | 55% | 40% |
| Data Center | 200 kW/rack | racks | 95% | 100% |
| Car Wash | 45 kW/bay | bays | 45% | 25% |
| EV Charging | 150 kW/charger | chargers | 35% | 60% |

**Usage in Quote:**
```typescript
const industryProfile = getIndustryProfile('hotel', { rooms: 150 });
const energyLoad = {
  peakKW: industryProfile.rooms * 1.5, // 225 kW
  dailyKWh: peakKW * 24 * 0.65,        // Load factor
  criticalKW: peakKW * 0.50,           // Backup sizing
  bessRecommendation: peakKW * BESS_POWER_RATIOS.peak_shaving, // 90 kW BESS
};
```

---

## 🎯 Step-by-Step Implementation Plan

### Phase 1: Fix Step 1 Location Intelligence ✅ IN PROGRESS

**Current Status:** Temporary hardcoded lookup (11 states)  
**Target:** Full database + Google Maps integration

**Tasks:**
1. ✅ **DONE:** Database `zip_codes` table created
2. ✅ **DONE:** Google Maps API integrated
3. ✅ **DONE:** `enrichLocationData()` service built
4. ⏳ **TODO:** Replace `getStateFromZip()` with database lookup
5. ⏳ **TODO:** Populate `zip_codes` table with all 42,000 US ZIP codes

**Code Change Required:**
```typescript
// File: src/components/wizard/v6/steps/Step1AdvisorLed.tsx

// ❌ DELETE: Temporary hardcoded function (lines 68-83)
function getStateFromZip(zip: string): string | null {
  // ... hardcoded ranges
}

// ✅ REPLACE WITH: Database + API lookup
async function enrichZipCode(zipCode: string) {
  // Try database first (5ms)
  const { data } = await supabase
    .from('zip_codes')
    .select('city, state_code, state_name, latitude, longitude')
    .eq('zip_code', zipCode)
    .single();

  if (data) {
    return {
      city: data.city,
      state: data.state_code,
      stateName: data.state_name,
      lat: data.latitude,
      lon: data.longitude,
    };
  }

  // Fallback to Google Maps API (300ms)
  return await geocodeLocation(zipCode);
}
```

### Phase 2: Enrich with Energy Intelligence

**Target:** User sees energy opportunities BEFORE entering industry

**Display in Step 1 (after ZIP entry):**
```
┌─────────────────────────────────────────────────────┐
│ 📍 San Francisco, CA                                │
│                                                     │
│ ⚡ ENERGY OPPORTUNITIES                              │
│ • Utility Rate: $0.28/kWh (High - great for BESS) │
│ • Demand Charge: $25/kW (Peak shaving = 15% ROI)  │
│ • Solar Potential: ☀️ A-rated (5.5 hrs/day)       │
│ • TOU Spread: $0.15/kWh (Arbitrage opportunity)   │
│                                                     │
│ 💡 This location is EXCELLENT for:                 │
│    ✓ Peak shaving (high demand charges)           │
│    ✓ Solar + storage (A-rated sun + TOU rates)   │
│    ✓ Energy arbitrage (15¢ peak/off-peak spread) │
└─────────────────────────────────────────────────────┘
```

**Code:**
```typescript
// After ZIP enrichment, calculate opportunities
const opportunities = await calculateEnergyOpportunities({
  state: enriched.state,
  utilityRate: enriched.utility.rate,
  demandCharge: enriched.utility.demandCharge,
  solarHours: enriched.solar.peakHours,
  touSpread: enriched.utility.peakRate - enriched.utility.offPeakRate,
});

// Display opportunity scores
updateState({
  locationIntelligence: {
    peakShavingScore: opportunities.demandChargeScore, // 0-10
    arbitrageScore: opportunities.touScore,            // 0-10
    solarScore: opportunities.solarGrade,              // A-F → 10-0
    overallOpportunity: 'excellent' | 'good' | 'fair', // Avg of scores
  }
});
```

### Phase 3: Industry-Specific Savings Calculator

**Target:** Step 3 shows estimated savings BEFORE quote generation

**After user answers industry questions:**
```typescript
// Industry: Hotel (150 rooms)
const industryProfile = calculateHotelPowerSimple({
  rooms: 150,
  hotelClass: 'midscale',
  amenities: ['pool', 'restaurant'],
  electricityRate: state.energyProfile.utilityRate,
});

// Expected output:
{
  peakKW: 225,              // 150 rooms × 1.5 kW/room
  dailyKWh: 3510,           // 225 kW × 24 hrs × 0.65 load factor
  annualCost: 153846,       // 3510 kWh/day × 365 × $0.12/kWh
  
  // BESS Savings Estimate (before full quote)
  bessSavings: {
    demandCharge: 40500,    // 225 kW × $25/kW × 12 months × 60% reduction
    energyArbitrage: 23400, // 180 kWh BESS × 365 days × $0.15 TOU spread
    total: 63900,           // Annual savings
    paybackEstimate: 4.2,   // Years (based on 4hr BESS @ $300k)
  }
}
```

**Display in Step 3:**
```
┌─────────────────────────────────────────────────────┐
│ 🏨 MIDSCALE HOTEL ENERGY PROFILE                    │
│                                                     │
│ Peak Demand: 225 kW                                │
│ Daily Usage: 3,510 kWh                             │
│ Annual Cost: $153,846                              │
│                                                     │
│ 💰 ESTIMATED BESS SAVINGS                           │
│ • Demand Charge Reduction: $40,500/year           │
│ • Energy Arbitrage: $23,400/year                  │
│ • Total Annual Savings: $63,900                   │
│ • Estimated Payback: 4.2 years                    │
│                                                     │
│ ✨ Recommended System: 225 kW / 900 kWh (4 hrs)   │
└─────────────────────────────────────────────────────┘
```

### Phase 4: TrueQuote™ Quote Generation

**Target:** Step 6 generates SSOT-accurate quote with full audit trail

**Current Flow:**
```typescript
// Step 6: Generate quote button clicked
const quote = await QuoteEngine.generateQuote({
  // Location intelligence
  zipCode: state.zipCode,
  state: state.state,
  
  // Industry profile (from Step 3)
  useCase: state.selectedIndustry,
  industryData: state.industryAnswers,
  
  // Energy profile (from Step 1 enrichment)
  electricityRate: state.energyProfile.utilityRate,
  demandCharge: state.energyProfile.demandCharge,
  solarPeakHours: state.energyProfile.solarPeakHours,
  
  // System sizing (from Step 5)
  storageSizeMW: state.batteryKW / 1000,
  durationHours: state.durationHours,
  solarMW: state.solarKW / 1000,
});

// Returns TrueQuote™ with audit trail
{
  equipment: { ... },
  costs: { ... },
  financials: {
    npv: 1_250_000,
    irr: 0.145,
    paybackYears: 4.2,
    
    // ✅ TrueQuote™ Attribution
    sources: {
      utilityRate: "NREL URDB - Pacific Gas & Electric (2024)",
      demandCharge: "EIA State Average - California Commercial (2024)",
      solarProduction: "NREL PVWatts - San Francisco, CA (5.5 hrs/day)",
      bessCapex: "NREL ATB 2024 - $110/kWh (4-hour lithium-ion)",
      itc: "IRA 2022 - 30% base + 10% domestic content bonus",
    }
  }
}
```

---

## 📦 Data Seeding Requirements

### Critical: Populate Database Tables

**1. ZIP Codes Table (42,000 records)**
- Source: USPS ZIP Code Database (free)
- File: Download from [Download US Zip Codes](https://www.unitedstateszipcodes.org/zip-code-database/)
- Import script needed: `scripts/seed-zip-codes.ts`

**2. Utility Rates Table (Already Seeded)**
- ✅ 31 major utilities already seeded
- ✅ All 50 states + DC covered with EIA averages

**3. Solar Data Cache (Optional - API fills on demand)**
- NREL PVWatts API auto-populates
- Can pre-seed top 100 cities for faster lookups

---

## 🚀 Implementation Priority

### High Priority (This Week)
1. ✅ **DONE:** Fix Step 1 temporary hardcoded lookup
2. ⏳ **TODO:** Seed `zip_codes` table with all US ZIPs
3. ⏳ **TODO:** Replace `getStateFromZip()` with database lookup
4. ⏳ **TODO:** Display energy opportunities in Step 1

### Medium Priority (Next Week)
5. ⏳ **TODO:** Industry savings calculator in Step 3
6. ⏳ **TODO:** Pre-quote estimate before Step 6
7. ⏳ **TODO:** Full TrueQuote™ attribution in Step 6

### Low Priority (Future Enhancement)
8. ⏳ **TODO:** International location support (Canada, Mexico)
9. ⏳ **TODO:** Weather pattern analysis (hurricanes, heatwaves)
10. ⏳ **TODO:** Utility rate change forecasting

---

## 💡 Quick Win: Excel Template for State Energy Intelligence

**You mentioned:** "I could map this out in an Excel file"

**Suggested Excel Structure:**

| Sheet 1: State Utility Intelligence |
| State | Avg Rate | Demand Charge | TOU? | Peak Rate | Off-Peak | Arbitrage Score | Notes |
|-------|----------|---------------|------|-----------|----------|-----------------|-------|
| CA | 0.2794 | 25 | Yes | 0.35 | 0.20 | 9/10 | Excellent for BESS |
| ... | ... | ... | ... | ... | ... | ... | ... |

| Sheet 2: State Solar Intelligence |
| State | Peak Sun Hours | Rating | Capacity Factor | Best Array | Notes |
|-------|----------------|--------|-----------------|------------|-------|
| AZ | 5.8 | A+ | 26% | 1-axis tracker | Top solar state |
| ... | ... | ... | ... | ... | ... |

| Sheet 3: Industry Power Profiles |
| Industry | Unit Type | kW per Unit | Load Factor | Critical % | Typical Add-ons |
|----------|-----------|-------------|-------------|------------|-----------------|
| Hotel | rooms | 1.5 | 65% | 50% | Pool, restaurant, EV chargers |
| ... | ... | ... | ... | ... | ... |

**Import Process:**
1. Create Excel file with above structure
2. Export as CSV (3 files)
3. Import script: `scripts/import-energy-intelligence.ts`
4. Populates lookup tables in database

---

## ✅ Summary: What Exists vs What's Needed

### ✅ Already Built (Use It!)
- ✅ Database tables (`zip_codes`, `utility_rates`, `solar_data_cache`)
- ✅ Google Maps API integration (`geocodingService.ts`)
- ✅ Utility rate lookup (`utilityRateService.ts`)
- ✅ Solar data lookup (`pvWattsService.ts`)
- ✅ Location enrichment orchestrator (`locationEnrichmentService.ts`)
- ✅ Backend API proxy (security for Google API keys)

### ⚠️ Needs Fixing
- ⚠️ Step 1 hardcoded ZIP lookup (replace with database)
- ⚠️ Missing `zip_codes` data seeding (42,000 records)
- ⚠️ Energy opportunity display in Step 1 (not shown to user)
- ⚠️ Industry savings calculator (not integrated in Step 3)

### 📋 Immediate Action Items

1. **Seed ZIP codes table** (20 min)
   ```bash
   # Download: https://www.unitedstateszipcodes.org/zip-code-database/
   # Import: npx tsx scripts/seed-zip-codes.ts
   ```

2. **Fix Step1AdvisorLed.tsx** (30 min)
   - Replace hardcoded `getStateFromZip()` with database lookup
   - Add energy opportunity display after ZIP entry

3. **Create energy intelligence lookup** (1 hour)
   - Excel file with state rates, solar data, industry profiles
   - Import script to populate database

4. **Test end-to-end** (30 min)
   - Enter ZIP → See state + energy opportunities
   - Select industry → See power profile + estimated savings
   - Generate quote → Full TrueQuote™ attribution

---

**This document serves as the roadmap for transforming WizardV6 into a true energy consultant system with intelligent location-based analysis and industry-specific savings calculations.**
