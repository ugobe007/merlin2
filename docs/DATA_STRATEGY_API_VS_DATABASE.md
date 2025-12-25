# Data Strategy: Web APIs vs Database Storage

**Date:** January 3, 2025  
**Purpose:** Determine what data should be accessed via APIs vs. stored in database for Step 1 refactoring

---

## Executive Summary

**Recommendation: Hybrid Approach**
- Use **APIs** for real-time, frequently-changing data (utility rates, solar radiation)
- Use **Database** for static reference data (ZIP lookups, state mappings, international data)
- Use **Cache/Database** for frequently-accessed API data to reduce API calls

---

## Current System Analysis

### ✅ Already Using APIs
1. **Utility Rates** (`utilityRateService.ts`)
   - **Primary:** NREL URDB API (https://openei.org/services/doc/rest/util_rates/)
   - **Fallback:** EIA State Average Rates (static data)
   - **Cache:** 24-hour cache to reduce API calls
   - **Database:** `utility_rates` table exists (migration ready)

2. **Solar Data** (`solarSizingService.ts`)
   - **Current:** Static state-level peak sun hours
   - **Opportunity:** Could use NREL PVWatts API for more accurate data

---

## Data Category Analysis

### 1. ZIP Code → City/State Lookups

#### Options:

**Option A: Free Web APIs**
- **ZipCodeAPI.com** - Free tier: 10 requests/hour, 10 requests/day
- **Zippopotam.us** - Free, no API key required, rate limited
- **USPS Address API** - Free but requires registration
- **Google Geocoding API** - $5 per 1000 requests
- **OpenStreetMap Nominatim** - Free but strict rate limits

**Option B: Static Database**
- Store ~42,000 US ZIP codes in database
- One-time population, instant lookups
- No API limits or costs
- **File size:** ~2-5 MB (compressed)

**Recommendation: ⭐ Database (Option B)**
- **Why:** ZIP codes rarely change, instant lookups needed, no API costs/limits
- **Storage:** Single table `zip_codes` with columns: `zip_code`, `city`, `state_code`, `state_name`
- **Update frequency:** Quarterly/yearly (USPS publishes updates)

---

### 2. US State Electricity Rates

#### Options:

**Option A: API (Already Using)**
- **NREL URDB API** - Primary source (free, requires API key)
- **EIA API** - State averages (free, requires API key)
- **Current Implementation:** ✅ Using NREL with EIA fallback

**Option B: Database Cache**
- Cache frequently-accessed rates in `utility_rates` table
- Update from API on-demand or scheduled
- **Current Implementation:** ✅ Has cache layer

**Recommendation: ⭐ Hybrid (Current Approach)**
- **Keep:** API calls for latest rates
- **Add:** Database cache for frequently-accessed ZIPs
- **Benefit:** Reduced API calls, faster responses

---

### 3. Peak Sun Hours (Solar Radiation Data)

#### Options:

**Option A: NREL PVWatts API**
- **Free:** Yes (requires API key)
- **Accuracy:** High (uses NSRDB data)
- **Coverage:** US locations only
- **Endpoint:** `https://developer.nrel.gov/api/pvwatts/v6.json`

**Option B: NREL NSRDB API**
- **Free:** Yes (requires API key)
- **More granular:** Hourly data for specific coordinates
- **Coverage:** Global (limited resolution outside US)

**Option C: Static Database**
- Store state/city averages
- **Current Implementation:** ✅ Using static data in `solarSizingService.ts`

**Recommendation: ⭐ API with Database Cache**
- **Use API:** For accurate, location-specific data (coordinates-based)
- **Cache:** Store in database for frequently-accessed locations
- **Fallback:** Static state averages (current implementation)
- **Table:** Add `solar_data` table with `zip_code`, `peak_sun_hours`, `annual_ghi`, `last_updated`

---

### 4. International Location Data

#### Options:

**Option A: Geocoding APIs**
- **Google Geocoding API** - $5 per 1000 requests, excellent coverage
- **OpenStreetMap Nominatim** - Free but rate limited
- **HERE Geocoding API** - Paid, good coverage
- **MapBox Geocoding API** - Paid, good coverage

**Option B: Static Database**
- Store country/city mappings
- **Current:** ✅ International data exists in redesign file (~100 countries)

**Option C: Country-Specific APIs**
- Most countries have government APIs, but inconsistent coverage

**Recommendation: ⭐ Database with API Fallback**
- **Store:** Common countries/cities in database (80% of use cases)
- **Use API:** For rare countries or real-time validation
- **Why:** International APIs are expensive/limited, data changes infrequently

---

### 5. International Electricity Rates

#### Options:

**Option A: APIs**
- **Limited availability** - No single comprehensive API
- **Country-specific:** Some countries publish APIs, most don't
- **Commercial services:** Exist but expensive ($100+/month)

**Option B: Static Database**
- Store country-level averages
- Update quarterly/annually
- **Current:** ✅ International rates exist in redesign file

**Recommendation: ⭐ Database**
- **Why:** No reliable free API, rates change slowly, database is most practical
- **Update:** Manual updates quarterly from sources like IEA, World Bank
- **Table:** `international_utility_rates` with `country`, `rate_usd_per_kwh`, `last_updated`

---

### 6. International Solar Data

#### Options:

**Option A: NREL NSRDB API**
- **Free:** Yes (requires API key)
- **Coverage:** Global but limited resolution outside US
- **Accuracy:** High for US, moderate for international

**Option B: NASA POWER API**
- **Free:** Yes, no API key required
- **Coverage:** Global
- **Data:** Daily/monthly averages

**Option C: Static Database**
- Store country-level averages
- **Current:** ✅ International solar data exists in redesign file

**Recommendation: ⭐ API with Database Cache**
- **Use:** NASA POWER API for international locations (free, global coverage)
- **Cache:** Store in database for frequently-accessed countries
- **Fallback:** Static country averages

---

## Recommended Database Schema

### New Tables Needed:

```sql
-- ZIP Code Lookups (US only)
CREATE TABLE zip_codes (
    zip_code VARCHAR(5) PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    state_name VARCHAR(50) NOT NULL,
    county VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solar Data Cache (API results)
CREATE TABLE solar_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zip_code VARCHAR(5),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    peak_sun_hours DECIMAL(4, 2) NOT NULL,
    annual_ghi INTEGER, -- kWh/m²/year
    solar_rating VARCHAR(1), -- A, B, C, D, F
    source VARCHAR(50) DEFAULT 'nrel', -- 'nrel', 'nasa', 'static'
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(zip_code)
);

-- International Countries Data
CREATE TABLE international_countries (
    country_code VARCHAR(2) PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10),
    currency_symbol VARCHAR(10),
    currency_to_usd DECIMAL(10, 6),
    electricity_rate_usd DECIMAL(6, 4), -- $/kWh
    peak_sun_hours DECIMAL(4, 2),
    solar_rating VARCHAR(1),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- International Cities
CREATE TABLE international_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) REFERENCES international_countries(country_code),
    city_name VARCHAR(100) NOT NULL,
    tier INTEGER, -- 1-5 (population tier)
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    UNIQUE(country_code, city_name)
);
```

---

## Implementation Strategy for Step 1 Refactoring

### Phase 1: Use Existing Services ✅
- **Utility Rates:** Already using `utilityRateService.ts` + `useUtilityRates` hook
- **Solar Data:** Extend `solarSizingService.ts` to use NREL API with cache
- **ZIP Lookups:** Create `zip_codes` table and populate from USPS data

### Phase 2: Add API Integrations
1. **NREL PVWatts API** for solar radiation
   - Add to `solarSizingService.ts`
   - Cache results in `solar_data_cache` table

2. **Geocoding API** (optional, for address validation)
   - Use OpenStreetMap Nominatim (free) or Google (if budget allows)
   - Only for address validation, not primary ZIP lookups

### Phase 3: Static Data (International)
1. **International Data:** Populate `international_countries` and `international_cities` tables
2. **ZIP Codes:** Populate `zip_codes` table (one-time import)
3. **Update Frequency:** Quarterly reviews, annual major updates

---

## Cost Analysis

### API Costs (if using paid services):
- **Google Geocoding:** $5 per 1000 requests = $5-50/month (estimated)
- **NREL APIs:** ✅ Free (requires API key, free signup)
- **NASA POWER API:** ✅ Free (no API key required)
- **ZipCodeAPI.com:** Free tier sufficient for testing, paid for production

### Database Storage Costs:
- **ZIP Codes:** ~2-5 MB (negligible)
- **Solar Data Cache:** ~1-2 MB per 1000 locations (grows slowly)
- **International Data:** <1 MB (very small)

**Total:** Database storage is essentially free on Supabase (within free tier)

---

## Recommended Approach for Step 1 Refactoring

### ✅ Keep Static Data:
1. **US ZIP Code Lookups** → Database table
2. **State Names/Abbreviations** → Static constants (small, rarely changes)
3. **International Countries** → Database table (100+ countries, manageable)
4. **International Cities** → Database table (1000-2000 entries, manageable)

### ✅ Use APIs (with caching):
1. **Utility Rates** → Already implemented ✅
2. **Solar Radiation** → Add NREL PVWatts API integration
3. **ZIP Validation** → Optional geocoding API (only for validation)

### ⚠️ Don't Store:
1. **Full ZIP_DB** (~5000 entries) - Instead, use database table with all ZIPs
2. **Large static arrays** - Move to database tables for maintainability

---

## Action Items

1. **Immediate (Step 1 Refactoring):**
   - [x] Use existing `utilityRateService.ts` for rates
   - [ ] Create `zip_codes` table migration
   - [ ] Extend `solarSizingService.ts` to use NREL API
   - [ ] Move international data to database tables

2. **Short-term:**
   - [ ] Populate `zip_codes` table from USPS data
   - [ ] Create `solar_data_cache` table
   - [ ] Integrate NREL PVWatts API

3. **Long-term:**
   - [ ] Set up scheduled jobs for rate updates
   - [ ] Add monitoring for API usage/errors
   - [ ] Implement fallback strategies

---

## Conclusion

**For Step 1 Refactoring, we should:**

1. **✅ Use APIs for:**
   - Utility rates (already doing)
   - Solar radiation (add NREL API)
   - Real-time validation (optional)

2. **✅ Store in Database:**
   - ZIP code lookups (all US ZIPs)
   - International country/city data
   - Cached API results

3. **❌ Don't store as static constants:**
   - Large datasets (ZIP_DB, INTERNATIONAL_DATA arrays)
   - Data that changes frequently
   - Data available via reliable APIs

This approach gives us the best of both worlds: real-time accuracy where needed, with fast database lookups for reference data.

