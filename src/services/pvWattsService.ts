/**
 * ============================================================================
 * NREL PVWATTS INTEGRATION SERVICE
 * ============================================================================
 * 
 * Created: January 14, 2026
 * Purpose: Location-specific solar production estimates using NREL PVWatts API
 * 
 * ADDRESSES GAP: "Static solar production assumptions"
 * - Previous: Fixed capacity factor (e.g., 20%) for all locations
 * - Now: Location-specific hourly/monthly production from PVWatts
 * 
 * NREL PVWatts API:
 * - Endpoint: https://developer.nrel.gov/api/pvwatts/v8.json
 * - Provides: Hourly/monthly solar production by location
 * - Factors: Latitude, longitude, tilt, azimuth, system losses, weather data
 * 
 * DATA SOURCES (TrueQuote™ compliant):
 * - NREL PVWatts Version 8 (TMY3 weather data)
 * - NREL National Solar Radiation Database (NSRDB)
 * - NREL System Advisor Model (SAM) calculations
 * 
 * CACHING STRATEGY:
 * - Cache results by location (lat/lon rounded to 2 decimals)
 * - Results valid for 1 year (weather data doesn't change frequently)
 * - Fallback to regional estimates if API unavailable
 * ============================================================================
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PVWattsInput {
  /** System capacity in kW (DC) */
  systemCapacityKW: number;
  /** Address or location name (for geocoding) */
  address?: string;
  /** Latitude (if known) */
  lat?: number;
  /** Longitude (if known) */
  lon?: number;
  /** Zip code (US only) */
  zipCode?: string;
  /** Array tilt angle in degrees (default: latitude) */
  tilt?: number;
  /** Array azimuth (180 = south, default) */
  azimuth?: number;
  /** Module type: 0=Standard, 1=Premium, 2=Thin film */
  moduleType?: 0 | 1 | 2;
  /** Array type: 0=Fixed open rack, 1=Fixed roof mount, 2=1-axis tracker, 3=2-axis tracker */
  arrayType?: 0 | 1 | 2 | 3 | 4;
  /** System losses (%) default 14% */
  systemLosses?: number;
  /** DC to AC ratio (default 1.2) */
  dcACRatio?: number;
  /** Inverter efficiency (%) default 96% */
  inverterEfficiency?: number;
  /** Ground coverage ratio for tracking (default 0.4) */
  gcr?: number;
}

export interface PVWattsResult {
  /** Annual AC energy production (kWh) */
  annualProductionKWh: number;
  /** Capacity factor (%) */
  capacityFactor: number;
  /** Monthly production (kWh) */
  monthlyProductionKWh: number[];
  /** Hourly production (if requested) - 8760 values */
  hourlyProductionKWh?: number[];
  /** Solar resource data */
  solarResource: {
    /** Annual solar radiation (kWh/m²/day) */
    annualSolarRadiation: number;
    /** Average ambient temperature (°C) */
    avgTemperature: number;
    /** Weather station used */
    station: string;
    /** Distance to weather station (km) */
    stationDistance: number;
  };
  /** Location info */
  location: {
    lat: number;
    lon: number;
    city?: string;
    state?: string;
    timezone: number;
    elevation: number;
  };
  /** TrueQuote™ attribution */
  audit: {
    source: string;
    apiVersion: string;
    weatherData: string;
    calculatedAt: string;
    assumptions: Record<string, number | string>;
  };
}

export interface PVWattsError {
  error: string;
  code: number;
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PVWATTS_API_BASE = 'https://developer.nrel.gov/api/pvwatts/v8.json';

// API key should be set in environment variables
// Get a free key at: https://developer.nrel.gov/signup/
const PVWATTS_API_KEY = import.meta.env.VITE_NREL_API_KEY || 'DEMO_KEY';

// In-memory PVWatts result cache (keyed by lat/lon rounded to 2 decimals + capacity)
// Avoids redundant API calls for the same location (P2b — Feb 2026)
const pvWattsCache = new Map<string, { result: PVWattsResult; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function makeCacheKey(lat: number, lon: number, capacityKW: number, arrayType: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)},${capacityKW.toFixed(0)},${arrayType}`;
}

// Warn once about DEMO_KEY (rate-limited to 30 req/hr)
let _demoKeyWarned = false;

/**
 * Regional capacity factor estimates (fallback when API unavailable)
 * Based on NREL Solar Resource data
 */
export const REGIONAL_CAPACITY_FACTORS: Record<string, number> = {
  // Southwest (highest solar resource)
  'AZ': 0.23, 'NM': 0.22, 'NV': 0.22, 'CA': 0.21, 'UT': 0.20,
  // Southern states
  'TX': 0.19, 'FL': 0.18, 'LA': 0.17, 'MS': 0.17, 'AL': 0.17,
  'GA': 0.17, 'SC': 0.17, 'NC': 0.16, 'OK': 0.18, 'AR': 0.17,
  // Mid-Atlantic
  'VA': 0.16, 'MD': 0.15, 'DE': 0.15, 'NJ': 0.15, 'PA': 0.14,
  // Northeast
  'NY': 0.14, 'CT': 0.14, 'RI': 0.14, 'MA': 0.14, 'VT': 0.13,
  'NH': 0.13, 'ME': 0.13,
  // Midwest
  'OH': 0.14, 'IN': 0.14, 'IL': 0.15, 'MI': 0.13, 'WI': 0.14,
  'MN': 0.14, 'IA': 0.15, 'MO': 0.16, 'KS': 0.18, 'NE': 0.17,
  'SD': 0.16, 'ND': 0.15,
  // Mountain West
  'CO': 0.20, 'WY': 0.18, 'MT': 0.16, 'ID': 0.17,
  // Pacific Northwest (lower solar)
  'WA': 0.13, 'OR': 0.14,
  // Hawaii (excellent solar)
  'HI': 0.21,
  // Alaska (limited solar)
  'AK': 0.10,
};

/**
 * Default system parameters based on NREL recommendations
 */
export const DEFAULT_SYSTEM_PARAMS = {
  moduleType: 0 as const,      // Standard crystalline silicon
  arrayType: 0 as const,       // Fixed open rack
  systemLosses: 14,            // 14% total losses
  dcACRatio: 1.2,              // DC/AC ratio
  inverterEfficiency: 96,      // 96% inverter efficiency
  gcr: 0.4,                    // Ground coverage ratio for trackers
};

// ============================================================================
// ZIP CODE TO LAT/LON MAPPING (Sample - would use geocoding API in production)
// ============================================================================

// Sample major city coordinates by zip prefix
const ZIP_COORDINATES: Record<string, { lat: number; lon: number; city: string; state: string }> = {
  // California
  '90': { lat: 34.05, lon: -118.24, city: 'Los Angeles', state: 'CA' },
  '91': { lat: 34.18, lon: -118.31, city: 'Glendale', state: 'CA' },
  '92': { lat: 33.74, lon: -117.83, city: 'Orange County', state: 'CA' },
  '93': { lat: 35.37, lon: -119.02, city: 'Bakersfield', state: 'CA' },
  '94': { lat: 37.77, lon: -122.42, city: 'San Francisco', state: 'CA' },
  '95': { lat: 37.34, lon: -121.89, city: 'San Jose', state: 'CA' },
  // Texas
  '75': { lat: 32.78, lon: -96.80, city: 'Dallas', state: 'TX' },
  '77': { lat: 29.76, lon: -95.37, city: 'Houston', state: 'TX' },
  '78': { lat: 29.42, lon: -98.49, city: 'San Antonio', state: 'TX' },
  // New York
  '10': { lat: 40.71, lon: -74.01, city: 'New York City', state: 'NY' },
  '11': { lat: 40.75, lon: -73.87, city: 'Queens', state: 'NY' },
  '12': { lat: 42.65, lon: -73.75, city: 'Albany', state: 'NY' },
  // Florida
  '33': { lat: 25.76, lon: -80.19, city: 'Miami', state: 'FL' },
  '34': { lat: 27.95, lon: -82.46, city: 'Tampa', state: 'FL' },
  '32': { lat: 30.33, lon: -81.66, city: 'Jacksonville', state: 'FL' },
  // Arizona
  '85': { lat: 33.45, lon: -112.07, city: 'Phoenix', state: 'AZ' },
  '86': { lat: 35.20, lon: -111.65, city: 'Flagstaff', state: 'AZ' },
  // Illinois
  '60': { lat: 41.88, lon: -87.63, city: 'Chicago', state: 'IL' },
  // Pennsylvania
  '19': { lat: 39.95, lon: -75.16, city: 'Philadelphia', state: 'PA' },
  '15': { lat: 40.44, lon: -79.99, city: 'Pittsburgh', state: 'PA' },
  // Georgia
  '30': { lat: 33.75, lon: -84.39, city: 'Atlanta', state: 'GA' },
  // Washington
  '98': { lat: 47.61, lon: -122.33, city: 'Seattle', state: 'WA' },
  // Massachusetts
  '02': { lat: 42.36, lon: -71.06, city: 'Boston', state: 'MA' },
  // Colorado
  '80': { lat: 39.74, lon: -104.99, city: 'Denver', state: 'CO' },
  // Nevada
  '89': { lat: 36.17, lon: -115.14, city: 'Las Vegas', state: 'NV' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get coordinates from zip code
 */
function getCoordinatesFromZip(zipCode: string): { lat: number; lon: number; city: string; state: string } | null {
  const prefix = zipCode.substring(0, 2);
  return ZIP_COORDINATES[prefix] || null;
}

/**
 * Calculate optimal tilt angle based on latitude
 * Rule of thumb: tilt = latitude for annual optimization
 */
function getOptimalTilt(latitude: number): number {
  // For fixed systems, tilt ≈ latitude gives best annual production
  // Slightly lower tilt favors summer; higher favors winter
  return Math.abs(latitude);
}

// ============================================================================
// MAIN API FUNCTION
// ============================================================================

/**
 * Get solar production estimate from NREL PVWatts API
 * 
 * @param input - PVWatts calculation inputs
 * @returns Solar production estimate with monthly breakdown
 */
export async function getPVWattsEstimate(input: PVWattsInput): Promise<PVWattsResult> {
  // Resolve location
  let lat = input.lat;
  let lon = input.lon;
  let locationInfo: { city?: string; state?: string } = {};

  if (!lat || !lon) {
    if (input.zipCode) {
      const coords = getCoordinatesFromZip(input.zipCode);
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
        locationInfo = { city: coords.city, state: coords.state };
      } else {
        throw new Error(`Unable to geocode zip code: ${input.zipCode}`);
      }
    } else if (input.address) {
      // Would use geocoding API here - for now, throw error
      throw new Error('Address geocoding not implemented. Please provide lat/lon or zipCode.');
    } else {
      throw new Error('Location required: provide lat/lon, zipCode, or address');
    }
  }

  // Build API request parameters
  const tilt = input.tilt ?? getOptimalTilt(lat);

  // P2b — Check cache first (Feb 2026)
  const cacheKey = makeCacheKey(lat, lon, input.systemCapacityKW, input.arrayType ?? DEFAULT_SYSTEM_PARAMS.arrayType);
  const cached = pvWattsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    if (import.meta.env.DEV) {
      console.log(`☀️ [PVWatts] Cache hit for ${cacheKey}`);
    }
    return cached.result;
  }

  // P2b — Warn about DEMO_KEY rate limits (Feb 2026)
  if (PVWATTS_API_KEY === 'DEMO_KEY' && !_demoKeyWarned) {
    _demoKeyWarned = true;
    console.warn(
      '⚠️ [PVWatts] Using DEMO_KEY — limited to 30 requests/hour.\n' +
      '   Get a free API key at: https://developer.nrel.gov/signup/\n' +
      '   Set VITE_NREL_API_KEY in your .env file.'
    );
  }

  const params = new URLSearchParams({
    api_key: PVWATTS_API_KEY,
    lat: lat.toString(),
    lon: lon.toString(),
    system_capacity: input.systemCapacityKW.toString(),
    azimuth: (input.azimuth ?? 180).toString(),
    tilt: tilt.toString(),
    array_type: (input.arrayType ?? DEFAULT_SYSTEM_PARAMS.arrayType).toString(),
    module_type: (input.moduleType ?? DEFAULT_SYSTEM_PARAMS.moduleType).toString(),
    losses: (input.systemLosses ?? DEFAULT_SYSTEM_PARAMS.systemLosses).toString(),
    dc_ac_ratio: (input.dcACRatio ?? DEFAULT_SYSTEM_PARAMS.dcACRatio).toString(),
    inv_eff: (input.inverterEfficiency ?? DEFAULT_SYSTEM_PARAMS.inverterEfficiency).toString(),
    gcr: (input.gcr ?? DEFAULT_SYSTEM_PARAMS.gcr).toString(),
    timeframe: 'monthly', // Get monthly data
  });

  try {
    const response = await fetch(`${PVWATTS_API_BASE}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`PVWatts API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new Error(`PVWatts API error: ${data.errors.join(', ')}`);
    }

    const outputs = data.outputs;
    const stationInfo = data.station_info || {};

    // Calculate capacity factor
    const annualProductionKWh = outputs.ac_annual;
    const maxPossible = input.systemCapacityKW * 8760; // kW * hours/year
    const capacityFactor = annualProductionKWh / maxPossible;

    const result: PVWattsResult = {
      annualProductionKWh: Math.round(annualProductionKWh),
      capacityFactor: Math.round(capacityFactor * 1000) / 10, // As percentage
      monthlyProductionKWh: outputs.ac_monthly.map((v: number) => Math.round(v)),
      solarResource: {
        annualSolarRadiation: outputs.solrad_annual,
        avgTemperature: 25, // Would come from detailed output
        station: stationInfo.station || 'Unknown',
        stationDistance: stationInfo.distance || 0,
      },
      location: {
        lat,
        lon,
        city: stationInfo.city || locationInfo.city,
        state: stationInfo.state || locationInfo.state,
        timezone: stationInfo.tz || -8,
        elevation: stationInfo.elev || 0,
      },
      audit: {
        source: 'NREL PVWatts API v8',
        apiVersion: '8.0',
        weatherData: 'TMY3 (Typical Meteorological Year)',
        calculatedAt: new Date().toISOString(),
        assumptions: {
          tilt,
          azimuth: input.azimuth ?? 180,
          systemLosses: input.systemLosses ?? DEFAULT_SYSTEM_PARAMS.systemLosses,
          dcACRatio: input.dcACRatio ?? DEFAULT_SYSTEM_PARAMS.dcACRatio,
          arrayType: ['Fixed Open Rack', 'Fixed Roof', '1-Axis Tracker', '1-Axis Backtracker', '2-Axis Tracker'][input.arrayType ?? 0],
          moduleType: ['Standard', 'Premium', 'Thin Film'][input.moduleType ?? 0],
        },
      },
    };

    // P2b — Store in cache (Feb 2026)
    pvWattsCache.set(cacheKey, { result, timestamp: Date.now() });
    // Evict old entries if cache grows too large
    if (pvWattsCache.size > 200) {
      const oldest = [...pvWattsCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) pvWattsCache.delete(oldest[0]);
    }

    return result;

  } catch (error) {
    // Return estimate using regional data as fallback
    console.warn('PVWatts API failed, using regional estimate:', error);
    return getRegionalEstimate(input, lat, lon, locationInfo);
  }
}

// ============================================================================
// FALLBACK REGIONAL ESTIMATE
// ============================================================================

/**
 * Regional estimate when API is unavailable
 */
function getRegionalEstimate(
  input: PVWattsInput,
  lat: number,
  lon: number,
  locationInfo: { city?: string; state?: string }
): PVWattsResult {
  const state = locationInfo.state || 'CA';
  const capacityFactor = REGIONAL_CAPACITY_FACTORS[state] ?? 0.17;
  
  // Calculate annual production
  const annualProductionKWh = input.systemCapacityKW * 8760 * capacityFactor;
  
  // Estimate monthly distribution (seasonal variation)
  const monthlyFactors = [
    0.065, 0.070, 0.085, 0.090, 0.095, 0.100, // Jan-Jun
    0.100, 0.095, 0.090, 0.080, 0.070, 0.060, // Jul-Dec
  ];
  const monthlyProductionKWh = monthlyFactors.map(f => 
    Math.round(annualProductionKWh * f)
  );

  return {
    annualProductionKWh: Math.round(annualProductionKWh),
    capacityFactor: capacityFactor * 100,
    monthlyProductionKWh,
    solarResource: {
      annualSolarRadiation: capacityFactor * 6, // Rough estimate
      avgTemperature: 20,
      station: 'Regional estimate (API unavailable)',
      stationDistance: 0,
    },
    location: {
      lat,
      lon,
      city: locationInfo.city,
      state: locationInfo.state,
      timezone: -8, // Default PST
      elevation: 0,
    },
    audit: {
      source: 'Regional estimate (NREL NSRDB averages)',
      apiVersion: 'fallback',
      weatherData: 'State-level averages from NREL National Solar Radiation Database',
      calculatedAt: new Date().toISOString(),
      assumptions: {
        state,
        capacityFactor,
        note: 'API unavailable - using regional capacity factor estimate',
      },
    },
  };
}

// ============================================================================
// SIMPLIFIED ESTIMATE FUNCTION
// ============================================================================

/**
 * Quick solar production estimate without API call
 * Uses regional capacity factors for instant response
 * 
 * @param systemCapacityKW - System size in kW
 * @param state - US state abbreviation
 * @param arrayType - Array mounting type
 * @returns Simple annual production estimate
 */
export function estimateSolarProduction(
  systemCapacityKW: number,
  state: string = 'CA',
  arrayType: 'fixed' | 'tracker' = 'fixed'
): {
  annualProductionKWh: number;
  capacityFactor: number;
  productionPerKW: number;
} {
  let capacityFactor = REGIONAL_CAPACITY_FACTORS[state.toUpperCase()] ?? 0.17;
  
  // Trackers increase production by ~25-30%
  if (arrayType === 'tracker') {
    capacityFactor *= 1.27;
  }

  const annualProductionKWh = systemCapacityKW * 8760 * capacityFactor;
  const productionPerKW = 8760 * capacityFactor; // kWh per kW installed

  return {
    annualProductionKWh: Math.round(annualProductionKWh),
    capacityFactor: Math.round(capacityFactor * 1000) / 10,
    productionPerKW: Math.round(productionPerKW),
  };
}

// ============================================================================
// SOLAR + BESS INTEGRATION
// ============================================================================

/**
 * Calculate how much solar production can be stored in BESS
 * 
 * @param solarProductionKWh - Annual solar production (kWh)
 * @param bessCapacityKWh - BESS capacity (kWh)
 * @param bessCyclesPerDay - Average BESS cycles per day
 * @returns Storage utilization metrics
 */
export function calculateSolarBESSIntegration(
  solarProductionKWh: number,
  bessCapacityKWh: number,
  bessCyclesPerDay: number = 1
): {
  annualStorableKWh: number;
  storageUtilization: number;
  solarCaptureRate: number;
  recommendedBESSSize: number;
} {
  // BESS can store X kWh per day
  const dailyStorageCapacity = bessCapacityKWh * bessCyclesPerDay;
  const annualStorageCapacity = dailyStorageCapacity * 365;

  // Solar production that can be stored
  const dailySolarKWh = solarProductionKWh / 365;
  const annualStorableKWh = Math.min(annualStorageCapacity, solarProductionKWh);

  // Utilization metrics
  const storageUtilization = annualStorableKWh / annualStorageCapacity;
  const solarCaptureRate = annualStorableKWh / solarProductionKWh;

  // Recommended BESS size to capture all solar
  // Assuming 80% of daily solar occurs in peak hours (4-5 hours)
  const peakSolarKW = dailySolarKWh * 0.8 / 4; // Approximate peak power
  const recommendedBESSKWh = dailySolarKWh * 0.6; // Store 60% of daily production

  return {
    annualStorableKWh: Math.round(annualStorableKWh),
    storageUtilization: Math.round(storageUtilization * 100),
    solarCaptureRate: Math.round(solarCaptureRate * 100),
    recommendedBESSSize: Math.round(recommendedBESSKWh),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getPVWattsEstimate,
  estimateSolarProduction,
  calculateSolarBESSIntegration,
  REGIONAL_CAPACITY_FACTORS,
  DEFAULT_SYSTEM_PARAMS,
};
