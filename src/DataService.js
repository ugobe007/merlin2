// ===============================================================================
// MERLIN ENERGY -- DataService.js
// Centralized API layer for live data enrichment
//
// APIs integrated:
//   1. NREL PVWatts v8        -- Solar production by lat/lng (FREE, DEMO_KEY or free key)
//   2. NASA POWER              -- Irradiance + temperature derating (FREE, no key)
//   3. EIA Open Data v2        -- State-level commercial electricity rates (FREE, free key)
//   4. Census Geocoding        -- ZIP -> lat/lng + FIPS census tract (FREE, no key)
//   5. OpenEI URDB v8          -- Utility-specific rates by ZIP (FREE, free key)
//   6. Energy Community Lookup -- FIPS tract -> energy community status (FREE, no key)
//
// All functions return null on failure (graceful degradation).
// Wizard A calls these via fetchLiveData() and passes results to Wizard B.
// ===============================================================================

// -- API Keys --
// NREL: Get a free key at https://developer.nrel.gov/signup/ (1,000 req/hr)
// OpenEI: Get a free key at https://openei.org/services/api/signup/ (1,000 req/hr)
// EIA: Get a free key at https://www.eia.gov/opendata/register.php (unlimited)
// Census: No key needed
// NASA POWER: No key needed

const NREL_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NREL_API_KEY) || 'DEMO_KEY';
const OPENEI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENEI_API_KEY) || '';
const EIA_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_EIA_API_KEY) || '';

// -- M-14: In-memory response cache with TTL --
const _cache = new Map();
const CACHE_TTL = {
  solar: 24 * 60 * 60 * 1000,   // 24hr -- solar production rarely changes
  nasa: 24 * 60 * 60 * 1000,    // 24hr -- climatology data stable
  eia: 60 * 60 * 1000,           // 1hr -- rates update monthly
  openei: 60 * 60 * 1000,        // 1hr -- utility rates
  census: 7 * 24 * 60 * 60 * 1000, // 7 days -- geo data very stable
  edgar: 4 * 60 * 60 * 1000,     // 4hr -- financials update quarterly
};
function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) { _cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key, data, ttlKey = 'eia') {
  _cache.set(key, { data, ts: Date.now(), ttl: CACHE_TTL[ttlKey] || 3600000 });
}

// -- Timeout helper --
const fetchWithTimeout = async (url, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

// -- M-11: Retry with exponential backoff (3 attempts) --
const fetchWithRetry = async (url, { timeoutMs = 8000, retries = 3, backoffMs = 1000 } = {}) => {
  // A-1: Pre-check network status -- skip API calls when offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn('[DataService] Device is offline -- skipping fetch:', url.substring(0, 60));
    return null;
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, timeoutMs);
      if (res.ok) return res;
      // Don't retry 4xx client errors (except 429 rate limit)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) return res;
      if (attempt < retries) await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt - 1)));
    } catch (err) {
      // E-7: Detect network errors specifically
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        console.warn(`[DataService] Network error (attempt ${attempt}/${retries}):`, err.message);
      }
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt - 1)));
    }
  }
  return fetchWithTimeout(url, timeoutMs); // Final fallback
};


// ===============================================================================
// 1. NREL PVWatts v8 -- Solar production at exact lat/lng
//    Docs: https://developer.nrel.gov/docs/solar/pvwatts/v8/
//    Free: DEMO_KEY = 30 req/hr, registered key = 1,000 req/hr
// ===============================================================================
export async function fetchSolarProduction(lat, lng, systemKW = 1, moduleType = 1) {
  // M-5: moduleType: 0=Standard(PERC), 1=Premium(N-type/TOPCon), 2=Thin Film
  const ck = `solar:${lat.toFixed(2)}:${lng.toFixed(2)}:${systemKW}:${moduleType}`;
  const cached = cacheGet(ck); if (cached) return cached;
  try {
    const params = new URLSearchParams({
      api_key: NREL_API_KEY,
      lat: lat.toFixed(4),
      lon: lng.toFixed(4),
      system_capacity: systemKW.toString(),
      module_type: String(moduleType), // M-5: 0=Standard(PERC), 1=Premium(N-type/TOPCon), 2=Thin Film
      losses: '14',            // 14% system losses (industry standard for commercial)
      array_type: '1',         // 1 = Fixed (roof mount); 0 = Ground; 2 = 1-axis tracking
      tilt: '20',              // 20deg default for commercial flat roof
      azimuth: '180',          // Due south
      dc_ac_ratio: '1.2',     // Standard DC/AC ratio
    });
    const url = `https://developer.nrel.gov/api/pvwatts/v8.json?${params}`;
    const res = await fetchWithRetry(url, { timeoutMs: 10000 });
    if (!res || !res.ok) { // E-7b: null-safe for offline
      console.warn(`[DataService] PVWatts HTTP ${res?.status || 'offline'}`);
      return null;
    }
    const data = await res.json();
    if (data.errors?.length) {
      console.warn('[DataService] PVWatts errors:', data.errors);
      return null;
    }
    const o = data.outputs;
    if (!o || !o.ac_annual) return null;

    const result = {
      annualProductionPerKW: Math.round(o.ac_annual / systemKW),
      monthlyProduction: o.ac_monthly,      // Array[12] of kWh per month
      capacityFactor: +(o.capacity_factor / 100).toFixed(4),
      peakSunHours: +(o.ac_annual / systemKW / 365).toFixed(2),
      solrad_annual: o.solrad_annual,        // kWh/m2/day annual average
      solrad_monthly: o.solrad_monthly,      // Array[12]
      dc_monthly: o.dc_monthly,             // DC production before inverter
      _source: 'NREL PVWatts v8',
      _lat: lat,
      _lng: lng,
      _timestamp: new Date().toISOString(),
    };
    cacheSet(ck, result, 'solar');
    return result;
  } catch (err) {
    console.warn('[DataService] PVWatts fetch failed:', err.message);
    return null;
  }
}


// ===============================================================================
// 2. NASA POWER -- Global irradiance and temperature data
//    Docs: https://power.larc.nasa.gov/docs/services/api/
//    Free: No key required, no rate limit (but be respectful)
// ===============================================================================
export async function fetchNASAPower(lat, lng) {
  const ck = `nasa:${lat.toFixed(2)}:${lng.toFixed(2)}`;
  const cached = cacheGet(ck); if (cached) return cached;
  try {
    const params = [
      'ALLSKY_SFC_SW_DWN',   // All Sky Surface Shortwave Downward Irradiance (GHI)
      'T2M',                  // Temperature at 2m (degC)
      'T2M_MAX',              // Max temperature
      'T2M_MIN',              // Min temperature
      'PRECTOTCORR',          // Precipitation
      'WS2M',                 // Wind speed at 2m
    ].join(',');
    const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=${params}&community=RE&longitude=${lng.toFixed(4)}&latitude=${lat.toFixed(4)}&format=JSON`;
    const res = await fetchWithRetry(url, { timeoutMs: 12000 });
    if (!res || !res.ok) { // E-7b: null-safe for offline
      console.warn(`[DataService] NASA POWER HTTP ${res?.status || 'offline'}`);
      return null;
    }
    const data = await res.json();
    const p = data.properties?.parameter;
    if (!p) return null;

    const avgGHI = p.ALLSKY_SFC_SW_DWN?.ANN || 4.5;
    const avgTemp = p.T2M?.ANN || 20;
    const maxTemp = p.T2M_MAX?.ANN || 30;

    // Temperature derating: panels lose ~0.4%/degC above 25degC (STC)
    // Use average of (avgTemp + maxTemp)/2 for daytime estimate
    const daytimeAvg = (avgTemp + maxTemp) / 2;
    const tempDeratingFactor = daytimeAvg > 25 ? +(1 - (daytimeAvg - 25) * 0.004).toFixed(4) : 1.0;

    const result = {
      avgGHI,                                // kWh/m2/day annual average
      monthlyGHI: p.ALLSKY_SFC_SW_DWN || {}, // Monthly GHI values
      avgTemp,                                // degC annual average
      maxTemp,                                // degC annual max average
      tempDeratingFactor,                     // Multiplier (0.90-1.00 typically)
      avgWindSpeed: p.WS2M?.ANN || 3,        // m/s
      avgPrecipitation: p.PRECTOTCORR?.ANN || 2.5, // mm/day
      _source: 'NASA POWER Climatology',
      _lat: lat,
      _lng: lng,
      _timestamp: new Date().toISOString(),
    };
    cacheSet(ck, result, 'nasa');
    return result;
  } catch (err) {
    console.warn('[DataService] NASA POWER fetch failed:', err.message);
    return null;
  }
}


// ===============================================================================
// 3. EIA Open Data v2 -- State-level commercial electricity rates
//    Docs: https://www.eia.gov/opendata/documentation.php
//    Free: Key from https://www.eia.gov/opendata/register.php (unlimited calls)
//    Fallback: Works without key for limited queries
// ===============================================================================
export async function fetchUtilityRate(state) {
  const ck = `eia:${state}`;
  const cached = cacheGet(ck); if (cached) return cached;
  try {
    const keyParam = EIA_API_KEY ? `&api_key=${EIA_API_KEY}` : '';
    const url = `https://api.eia.gov/v2/electricity/retail-sales/data/?frequency=monthly&data[0]=price&facets[sectorid][]=COM&facets[stateid][]=${state}&sort[0][column]=period&sort[0][direction]=desc&length=13${keyParam}`;
    const res = await fetchWithRetry(url, { timeoutMs: 8000 });
    if (!res || !res.ok) { // E-7b: null-safe for offline
      console.warn(`[DataService] EIA HTTP ${res?.status || 'offline'}`);
      return null;
    }
    const data = await res.json();
    const records = data.response?.data;
    if (!records?.length) return null;

    // Latest month's rate
    const latest = records[0];
    const latestRate = parseFloat(latest.price) / 100; // EIA reports cents/kWh -> $/kWh

    // Year-over-year comparison (same month, prior year)
    const priorYearRecord = records.find(r => {
      const latestDate = new Date(latest.period + '-01');
      const rDate = new Date(r.period + '-01');
      return Math.abs((latestDate - rDate) / (1000 * 60 * 60 * 24 * 30) - 12) < 2;
    });
    const yoyChangePct = priorYearRecord
      ? +((latest.price - priorYearRecord.price) / priorYearRecord.price * 100).toFixed(1)
      : null;

    // 12-month average for more stable rate
    const avg12 = records.length >= 12
      ? +(records.slice(0, 12).reduce((sum, r) => sum + parseFloat(r.price), 0) / Math.min(records.length, 12) / 100).toFixed(4)
      : latestRate;

    const result = {
      latestRate,                // Most recent month $/kWh
      avg12MonthRate: avg12,     // 12-month rolling average $/kWh
      period: latest.period,     // e.g. "2025-09"
      yoyChangePct,              // YoY change as percentage
      state,
      _source: 'EIA Open Data v2',
      _timestamp: new Date().toISOString(),
    };
    cacheSet(ck, result, 'eia');
    return result;
  } catch (err) {
    console.warn('[DataService] EIA fetch failed:', err.message);
    return null;
  }
}


// ===============================================================================
// 4. CENSUS GEOCODING -- ZIP -> exact lat/lng + FIPS census tract
//    Docs: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.pdf
//    Free: No key required, ~10,000/day
//    Bonus: FIPS tract enables Sec30C energy community auto-lookup
// ===============================================================================
export async function fetchZipCoords(zip) {
  const ck = `census:${zip}`;
  const cached = cacheGet(ck); if (cached) return cached;
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(zip)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const res = await fetchWithRetry(url, { timeoutMs: 10000 });
    if (!res || !res.ok) { // E-7b: null-safe for offline
      console.warn(`[DataService] Census Geocoding HTTP ${res?.status || 'offline'}`);
      return null;
    }
    const data = await res.json();
    const matches = data.result?.addressMatches;

    if (!matches?.length) {
      // Fallback: Try with "USA" appended for better matching
      const url2 = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(zip + ' USA')}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
      const res2 = await fetchWithRetry(url2, { timeoutMs: 8000 });
      if (!res2.ok) return null;
      const data2 = await res2.json();
      const matches2 = data2.result?.addressMatches;
      if (!matches2?.length) return null;
      return parseGeocoderMatch(matches2[0], zip);
    }

    return parseGeocoderMatch(matches[0], zip);
  } catch (err) {
    console.warn('[DataService] Census Geocoding failed:', err.message);
    return null;
  }
}

function parseGeocoderMatch(match, zip) {
  const lat = parseFloat(match.coordinates?.y);
  const lng = parseFloat(match.coordinates?.x);
  if (isNaN(lat) || isNaN(lng)) return null;

  const geos = match.geographies || {};
  const tract = geos['Census Tracts']?.[0];
  const county = geos['Counties']?.[0];

  const result = {
    lat,
    lng,
    zip,
    fipsTract: tract?.GEOID || null,      // e.g. "26163542200" (state+county+tract)
    tractName: tract?.NAME || null,        // e.g. "5422"
    fipsCounty: county?.GEOID || null,     // e.g. "26163"
    countyName: county?.NAME || null,      // e.g. "Wayne"
    state: match.addressComponents?.state || null,
    matchedAddress: match.matchedAddress || null,
    _source: 'Census Geocoding API',
    _timestamp: new Date().toISOString(),
  };
  cacheSet(ck, result, 'census');
  return result;
}


// ===============================================================================
// 5. OpenEI URDB v8 -- Utility-specific rate schedules by ZIP
//    Docs: https://openei.org/services/doc/rest/util_rates/
//    Free: Key from https://openei.org/services/api/signup/ (1,000 req/hr)
//    Returns: Utility name, rate schedule, TOU rates, demand charges, NEM export
// ===============================================================================
export async function fetchUtilityByZip(zip) {
  const ck = `openei:${zip}`;
  const cached = cacheGet(ck); if (cached) return cached;
  if (!OPENEI_API_KEY) {
    console.info('[DataService] OpenEI API key not configured -- skipping URDB lookup');
    return null;
  }
  try {
    const params = new URLSearchParams({
      version: '8',
      format: 'json',
      api_key: OPENEI_API_KEY,
      address: zip,
      sector: 'Commercial',
      detail: 'full',
      limit: '5',
    });
    const url = `https://api.openei.org/utility_rates?${params}`;
    const res = await fetchWithRetry(url, { timeoutMs: 10000 });
    if (!res || !res.ok) { // E-7b: null-safe for offline
      console.warn(`[DataService] OpenEI HTTP ${res?.status || 'offline'}`);
      return null;
    }
    const data = await res.json();
    const items = data.items;
    if (!items?.length) return null;

    // Pick the best rate schedule: non-expired, commercial
    const now = new Date();
    const validRates = items.filter(r => {
      if (r.enddate && new Date(r.enddate) < now) return false;
      return true;
    });
    const rate = validRates[0] || items[0];

    // Parse energy rate structure
    const energyRates = parseEnergyRates(rate.energyratestructure);
    const demandRates = parseDemandRates(rate.demandratestructure);

    const result = {
      utilityName: rate.utility || 'Unknown Utility',
      rateName: rate.name || 'Default Commercial',
      rateId: rate.label || null,
      eiaid: rate.eiaid || null,

      // Energy rates
      avgRate: energyRates.weightedAvg,       // $/kWh weighted average
      peakRate: energyRates.peak,             // $/kWh peak period
      offPeakRate: energyRates.offPeak,       // $/kWh off-peak period
      midPeakRate: energyRates.midPeak,       // $/kWh mid-peak (if TOU)
      isTOU: energyRates.isTOU,              // Boolean: is this a TOU rate?

      // Demand charges
      demandCharge: demandRates.flatRate,      // $/kW demand charge
      peakDemandCharge: demandRates.peak,      // $/kW peak demand

      // NEM / Export
      sellRate: rate.sellkwh || null,           // $/kWh export credit (if NEM)
      hasNEM: !!(rate.sellkwh && rate.sellkwh > 0),

      // Fixed charges
      fixedMonthlyCharge: rate.fixedmonthlycharge || 0,
      minMonthlyCharge: rate.minmonthlycharge || 0,

      // Metadata
      startDate: rate.startdate || null,
      endDate: rate.enddate || null,
      uri: rate.uri || null,
      _allRates: validRates.slice(0, 5).map(r => ({ name: r.name, eiaid: r.eiaid })),
      _source: 'OpenEI URDB v8',
      _timestamp: new Date().toISOString(),
    };
    cacheSet(ck, result, 'openei');
    return result;
  } catch (err) {
    console.warn('[DataService] OpenEI fetch failed:', err.message);
    return null;
  }
}

// Parse OpenEI energy rate structure into useful values
function parseEnergyRates(structure) {
  const result = { weightedAvg: null, peak: null, offPeak: null, midPeak: null, isTOU: false };
  if (!structure || !Array.isArray(structure)) return result;

  const allRates = [];
  structure.forEach((period) => {
    if (!Array.isArray(period)) return;
    period.forEach((tier) => {
      if (tier && typeof tier.rate === 'number' && tier.rate > 0) {
        allRates.push(tier.rate);
      }
    });
  });

  if (allRates.length === 0) return result;

  result.weightedAvg = +(allRates.reduce((a, b) => a + b, 0) / allRates.length).toFixed(5);
  result.peak = +Math.max(...allRates).toFixed(5);
  result.offPeak = +Math.min(...allRates).toFixed(5);
  result.isTOU = structure.length > 1 || (result.peak !== result.offPeak);

  const uniqueRates = [...new Set(allRates)].sort((a, b) => a - b);
  if (uniqueRates.length >= 3) {
    result.midPeak = +uniqueRates[Math.floor(uniqueRates.length / 2)].toFixed(5);
  }
  return result;
}

// Parse OpenEI demand rate structure
function parseDemandRates(structure) {
  const result = { flatRate: null, peak: null };
  if (!structure || !Array.isArray(structure)) return result;

  const allRates = [];
  structure.forEach((period) => {
    if (!Array.isArray(period)) return;
    period.forEach((tier) => {
      if (tier && typeof tier.rate === 'number' && tier.rate > 0) {
        allRates.push(tier.rate);
      }
    });
  });

  if (allRates.length === 0) return result;
  result.flatRate = +Math.min(...allRates).toFixed(2);
  result.peak = +Math.max(...allRates).toFixed(2);
  return result;
}


// ===============================================================================
// 6. ENERGY COMMUNITY LOOKUP -- Is this census tract an IRA energy community?
//    Source: IRS Notice 2023-47 + DOE annual updates
//    Based on: Coal closure communities, brownfield sites, fossil fuel employment
//    Bonus: +10% ITC adder if project is in energy community
// ===============================================================================

// County-level FIPS codes for energy communities (coal closure + fossil fuel employment)
// Source: DOE IRA Energy Community dataset, 2025 update
// Format: 5-digit county FIPS (state2 + county3)
// Covers ~300 counties. Full dataset at energycommunities.gov
const ENERGY_COMMUNITY_COUNTIES = new Set([
  // Appalachian coal -- WV
  '54005','54011','54015','54019','54025','54039','54043','54045',
  '54047','54055','54059','54067','54075','54079','54081','54089',
  // Appalachian coal -- KY
  '21013','21019','21025','21043','21051','21063','21071','21089',
  '21095','21109','21115','21119','21121','21125','21127','21131',
  '21133','21147','21153','21159','21165','21175','21189','21193',
  '21195','21197','21199','21203','21205','21231','21235','21237',
  // Appalachian -- TN
  '47001','47013','47025','47035','47049','47129','47133','47137','47141','47151',
  // Appalachian -- VA
  '51027','51051','51105','51167','51169','51185','51195','51720',
  // Appalachian -- PA
  '42003','42005','42007','42021','42031','42033','42051','42059','42063','42065','42083',
  // Appalachian -- OH
  '39009','39013','39019','39029','39031','39059','39067','39073',
  '39079','39081','39105','39111','39119','39127','39157',
  // Illinois Basin -- IL
  '17055','17065','17069','17121','17145','17151','17153','17165','17185','17191','17193',
  // Illinois Basin -- IN
  '18019','18021','18027','18051','18055','18083','18101','18125',
  // Wyoming / Montana / N. Dakota
  '56005','56007','56009','56011','56019','56023','56025','56037',
  '30003','30009','30011','30037','30055','30075','30087','30095',
  '38007','38011','38025','38033','38055','38057','38065','38089',
  // Western coal -- CO, UT, NM
  '08077','08081','08085','08093','08107',
  '49007','49015','49019',
  '35031','35045',
  // Texas oil & gas
  '48003','48013','48033','48059','48105','48115','48135','48147',
  '48169','48173','48203','48227','48235','48243','48263','48301',
  '48317','48329','48353','48357','48359','48371','48383','48389',
  '48393','48415','48431','48461',
  // Oklahoma oil & gas
  '40011','40015','40017','40019','40025','40037','40039','40047',
  '40049','40051','40073','40079','40081','40083','40093','40097',
  '40107','40109','40119','40125','40137','40141','40143','40149',
  // Louisiana
  '22001','22003','22005','22007','22011','22013','22015','22019',
  '22023','22027','22029','22031','22039','22041','22045','22047',
  '22049','22051','22053','22055','22057','22059','22063','22067',
  // Alaska
  '02185','02188','02261','02290',
  // Michigan (brownfield areas)
  '26075','26115','26145',
]);

export function checkEnergyCommunity(fipsTract, fipsCounty) {
  const countyCode = fipsCounty || (fipsTract ? fipsTract.substring(0, 5) : null);
  if (countyCode && ENERGY_COMMUNITY_COUNTIES.has(countyCode)) {
    return {
      isEnergyCommunity: true,
      method: 'county_match',
      confidence: 'HIGH',
      countyFips: countyCode,
      note: 'County is in DOE energy community dataset (coal closure or fossil fuel employment)',
      verifyUrl: 'https://energycommunities.gov/energy-community-tax-credit-bonus/',
    };
  }
  return {
    isEnergyCommunity: false,
    method: 'county_match',
    confidence: 'MEDIUM',
    countyFips: countyCode,
    note: 'Not in embedded energy community dataset. May still qualify -- verify at energycommunities.gov',
    verifyUrl: 'https://energycommunities.gov/energy-community-tax-credit-bonus/',
  };
}


// ===============================================================================
// COMBINED: fetchAllLocationData -- One-call enrichment for Wizard A
// ===============================================================================
export async function fetchAllLocationData(zip, state, fallbackCoords = [42.4, -83.5]) {
  const result = {
    coords: null, pv: null, nasa: null, eia: null, openei: null, energyCommunity: null,
    _fetchedAt: new Date().toISOString(), _errors: [],
  };

  // Phase 1: Precise coordinates
  try { result.coords = await fetchZipCoords(zip); }
  catch (err) { result._errors.push(`Census: ${err.message}`); }

  const lat = result.coords?.lat || fallbackCoords[0];
  const lng = result.coords?.lng || fallbackCoords[1];
  const coordSource = result.coords ? 'census_zip' : 'state_centroid';

  // Phase 2: All data in parallel
  const [pvRes, nasaRes, eiaRes, openeiRes] = await Promise.allSettled([
    fetchSolarProduction(lat, lng, 1),
    fetchNASAPower(lat, lng),
    fetchUtilityRate(state),
    fetchUtilityByZip(zip),
  ]);

  if (pvRes.status === 'fulfilled' && pvRes.value) {
    result.pv = pvRes.value;
    result.pv._coordSource = coordSource;
  } else { result._errors.push(`PVWatts: ${pvRes.reason?.message || 'failed'}`); }

  if (nasaRes.status === 'fulfilled' && nasaRes.value) { result.nasa = nasaRes.value; }
  else { result._errors.push(`NASA: ${nasaRes.reason?.message || 'failed'}`); }

  if (eiaRes.status === 'fulfilled' && eiaRes.value) { result.eia = eiaRes.value; }
  else { result._errors.push(`EIA: ${eiaRes.reason?.message || 'failed'}`); }

  if (openeiRes.status === 'fulfilled' && openeiRes.value) { result.openei = openeiRes.value; }
  else if (OPENEI_API_KEY) { result._errors.push(`OpenEI: ${openeiRes.reason?.message || 'failed'}`); }

  // Phase 3: Energy community check
  if (result.coords?.fipsTract || result.coords?.fipsCounty) {
    result.energyCommunity = checkEnergyCommunity(result.coords.fipsTract, result.coords.fipsCounty);
  }

  return result;
}


// ===============================================================================
// EXPORT: Supplier financials stub (used by Wizard B import)
// ===============================================================================
export async function fetchSupplierFinancials(supplierName) {
  // SSOT #29: Live SEC EDGAR fetch -- CIK lookup -> 10-K/Q XBRL data
  const ck = `edgar:${supplierName}`;
  const cached = cacheGet(ck); if (cached) return cached;

  // Map supplier names to SEC CIK numbers (public companies only)
  const CIK_MAP = {
    'SolarEdge': '0001419612',
    'Enphase': '0001463258',
    'Tesla': '0001318605',
    'Canadian Solar': '0001375877',
    'JinkoSolar': '0001481513',
    'Generac': '0001474735',
    'ChargePoint': '0001777393',
    'First Solar': '0001274494',
    'Maxeon': '0001796898',
    'Sungrow': null, // Not SEC-listed (China A-shares only)
    'BYD': null,     // Not SEC-listed (HK/Shenzhen only)
  };

  const cik = CIK_MAP[supplierName];
  if (!cik) return null; // Not a US-listed company

  try {
    // SEC EDGAR company facts API (XBRL structured data)
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
    const res = await fetchWithRetry(url, { timeoutMs: 10000, retries: 2 });
    if (!res || !res.ok) { // E-7b: null-safe for offline
      console.warn(`[EDGAR] HTTP ${res?.status || 'offline'} for ${supplierName}`); return null;
    }
    const data = await res.json();
    const facts = data?.facts?.['us-gaap'] || {};

    // Extract key financial metrics from most recent filing
    const getLatest = (concept) => {
      const units = facts[concept]?.units?.['USD'] || [];
      // Filter to annual filings (10-K), sort by end date descending
      const annual = units.filter(u => u.form === '10-K').sort((a, b) => b.end?.localeCompare(a.end));
      return annual[0]?.val ?? null;
    };

    const revenue = getLatest('Revenues') || getLatest('RevenueFromContractWithCustomerExcludingAssessedTax');
    const totalAssets = getLatest('Assets');
    const totalLiabilities = getLatest('Liabilities');
    const currentAssets = getLatest('AssetsCurrent');
    const currentLiabilities = getLatest('LiabilitiesCurrent');
    const retainedEarnings = getLatest('RetainedEarningsAccumulatedDeficit');
    const ebit = getLatest('OperatingIncomeLoss');
    const workingCapital = (currentAssets && currentLiabilities) ? currentAssets - currentLiabilities : null;
    const equity = (totalAssets && totalLiabilities) ? totalAssets - totalLiabilities : null;

    // Altman Z-Score (manufacturing version): 1.2*X1 + 1.4*X2 + 3.3*X3 + 0.6*X4 + 1.0*X5
    let zScore = null;
    if (totalAssets && totalAssets > 0 && revenue) {
      const X1 = (workingCapital || 0) / totalAssets;
      const X2 = (retainedEarnings || 0) / totalAssets;
      const X3 = (ebit || 0) / totalAssets;
      const X4 = (equity || 0) / Math.max(totalLiabilities || 1, 1);
      const X5 = revenue / totalAssets;
      zScore = +(1.2 * X1 + 1.4 * X2 + 3.3 * X3 + 0.6 * X4 + 1.0 * X5).toFixed(2);
    }

    const result = {
      name: supplierName,
      cik,
      revenue,
      totalAssets,
      totalLiabilities,
      equity,
      workingCapital,
      ebit,
      zScore,
      distressLevel: zScore !== null ? (zScore < 1.8 ? 'distress' : zScore < 3.0 ? 'caution' : 'safe') : 'unknown',
      _source: 'SEC EDGAR XBRL',
      _timestamp: new Date().toISOString(),
    };
    cacheSet(ck, result, 'edgar');
    return result;
  } catch (err) {
    console.warn(`[EDGAR] Fetch failed for ${supplierName}:`, err.message);
    return null;
  }
}

// ===============================================================================
// UTILITY: Data provenance badges for UI display
// ===============================================================================
export function getDataProvenanceBadges(liveData) {
  if (!liveData) return [];
  const badges = [];
  if (liveData.pv) {
    badges.push({
      label: liveData.pv._coordSource === 'census_zip' ? 'PVWatts (ZIP)' : 'PVWatts (State)',
      color: liveData.pv._coordSource === 'census_zip' ? '#34d399' : '#fbbf24',
    });
  }
  if (liveData.nasa) badges.push({ label: 'NASA POWER', color: '#60a5fa' });
  if (liveData.eia) badges.push({ label: 'EIA Rates', color: '#a78bfa' });
  if (liveData.openei) badges.push({ label: liveData.openei.utilityName, color: '#34d399' });
  if (liveData.coords) badges.push({ label: 'Census Tract', color: '#f472b6' });
  if (liveData.energyCommunity?.isEnergyCommunity) badges.push({ label: 'Energy Community Y', color: '#fbbf24' });
  return badges;
}
