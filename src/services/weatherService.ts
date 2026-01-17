/**
 * Weather Service
 * 
 * Fetches weather data from Visual Crossing and National Weather Service
 * to provide climate context for energy system sizing.
 * 
 * Created: Jan 17, 2026
 * Updated: Jan 17, 2026 - Added Google Geocoding for precise coordinates
 */

import { getCoordinatesFromZip } from './geocodingService';

const VISUAL_CROSSING_API_KEY = 'HQLBWQ3D3YLYKF2NLJL68EW4C';

export interface WeatherData {
  profile: string; // "Hot & Humid", "Cold & Dry", "Temperate", etc.
  extremes: string; // "Frequent heatwaves", "Harsh winters", "Mild year-round"
  avgTempF?: number;
  avgHighF?: number;
  avgLowF?: number;
  heatingDegreeDays?: number;
  coolingDegreeDays?: number;
  source: 'visual-crossing' | 'nws' | 'cache';
}

interface VisualCrossingResponse {
  days?: Array<{
    temp: number;
    tempmax: number;
    tempmin: number;
  }>;
  currentConditions?: {
    temp: number;
  };
}

interface NWSPointResponse {
  properties?: {
    forecast?: string;
    forecastHourly?: string;
    observationStations?: string;
  };
}

/**
 * Determine weather profile from temperature data
 */
function determineProfile(avgTemp: number, avgHigh: number, avgLow: number): string {
  if (avgHigh > 85 && avgTemp > 70) {
    return "Hot & Humid";
  } else if (avgLow < 32 && avgTemp < 45) {
    return "Cold & Dry";
  } else if (avgHigh > 80 && avgLow < 40) {
    return "High Variability";
  } else if (avgTemp >= 60 && avgTemp <= 75) {
    return "Temperate";
  } else if (avgTemp < 60) {
    return "Cool";
  }
  return "Moderate";
}

/**
 * Determine extremes from temperature range
 */
function determineExtremes(avgHigh: number, avgLow: number, avgTemp: number): string {
  const range = avgHigh - avgLow;
  
  if (avgHigh > 95) {
    return "Frequent heatwaves";
  } else if (avgLow < 20) {
    return "Harsh winters";
  } else if (range > 50) {
    return "Extreme temperature swings";
  } else if (range < 20) {
    return "Mild year-round";
  } else if (avgTemp > 80) {
    return "High cooling load";
  } else if (avgTemp < 40) {
    return "High heating load";
  }
  return "Moderate climate";
}

/**
 * Calculate heating/cooling degree days (base 65°F)
 */
function calculateDegreeDays(avgTemp: number): { heating: number; cooling: number } {
  const BASE = 65;
  const heating = Math.max(0, BASE - avgTemp) * 365;
  const cooling = Math.max(0, avgTemp - BASE) * 365;
  return { heating, cooling };
}

/**
 * Fetch weather data from Visual Crossing API
 */
async function fetchVisualCrossing(zipCode: string): Promise<WeatherData | null> {
  try {
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${zipCode}/last30days?unitGroup=us&key=${VISUAL_CROSSING_API_KEY}&include=days`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Visual Crossing API error:', response.status);
      return null;
    }

    const data: VisualCrossingResponse = await response.json();
    if (!data.days || data.days.length === 0) {
      return null;
    }

    // Calculate averages from last 30 days
    const temps = data.days.map(d => d.temp);
    const highs = data.days.map(d => d.tempmax);
    const lows = data.days.map(d => d.tempmin);

    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const avgHigh = highs.reduce((a, b) => a + b, 0) / highs.length;
    const avgLow = lows.reduce((a, b) => a + b, 0) / lows.length;

    const { heating, cooling } = calculateDegreeDays(avgTemp);

    return {
      profile: determineProfile(avgTemp, avgHigh, avgLow),
      extremes: determineExtremes(avgHigh, avgLow, avgTemp),
      avgTempF: Math.round(avgTemp),
      avgHighF: Math.round(avgHigh),
      avgLowF: Math.round(avgLow),
      heatingDegreeDays: Math.round(heating),
      coolingDegreeDays: Math.round(cooling),
      source: 'visual-crossing',
    };
  } catch (error) {
    console.error('Visual Crossing fetch error:', error);
    return null;
  }
}

/**
 * Fetch weather data from National Weather Service API
 * NWS provides free, detailed US weather data without API key
 */
async function fetchNWS(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    // Step 1: Get forecast grid point
    const pointUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
    const pointResponse = await fetch(pointUrl, {
      headers: { 'User-Agent': 'Merlin Energy Advisor (contact@merlinbess.com)' },
    });

    if (!pointResponse.ok) {
      console.warn('NWS points API error:', pointResponse.status);
      return null;
    }

    const pointData: NWSPointResponse = await pointResponse.json();
    if (!pointData.properties?.forecast) {
      return null;
    }

    // For now, return basic climate data based on lat/lon
    // Full implementation would fetch historical climate normals
    const avgTemp = lat < 35 ? 75 : lat < 40 ? 65 : lat < 45 ? 55 : 50;
    const avgHigh = avgTemp + 15;
    const avgLow = avgTemp - 15;

    const { heating, cooling } = calculateDegreeDays(avgTemp);

    return {
      profile: determineProfile(avgTemp, avgHigh, avgLow),
      extremes: determineExtremes(avgHigh, avgLow, avgTemp),
      avgTempF: Math.round(avgTemp),
      avgHighF: Math.round(avgHigh),
      avgLowF: Math.round(avgLow),
      heatingDegreeDays: Math.round(heating),
      coolingDegreeDays: Math.round(cooling),
      source: 'nws',
    };
  } catch (error) {
    console.error('NWS fetch error:', error);
    return null;
  }
}

/**
 * Get weather data for a location
 * 
 * Strategy:
 * 1. Try Visual Crossing with ZIP code (30-day history)
 * 2. If that fails, geocode ZIP to get coordinates
 * 3. Use coordinates with NWS API
 * 4. Fall back to regional estimates if all else fails
 */
export async function getWeatherData(
  zipCode: string,
  lat?: number,
  lon?: number
): Promise<WeatherData | null> {
  // Try Visual Crossing with ZIP code
  const vcData = await fetchVisualCrossing(zipCode);
  if (vcData) {
    return vcData;
  }

  // If no coordinates provided, geocode the ZIP code
  let coords = lat && lon ? { lat, lon } : null;
  if (!coords) {
    coords = await getCoordinatesFromZip(zipCode);
  }

  // Try NWS with coordinates
  if (coords) {
    const nwsData = await fetchNWS(coords.lat, coords.lon);
    if (nwsData) {
      return nwsData;
    }
  }

  // Return basic estimate based on ZIP code prefix
  const zipPrefix = zipCode.substring(0, 3);
  const region = getRegionFromZipPrefix(zipPrefix);
  return getDefaultWeatherForRegion(region);
}

/**
 * Determine region from ZIP code prefix (simplified)
 */
function getRegionFromZipPrefix(prefix: string): string {
  const p = parseInt(prefix);
  if (p >= 330 && p <= 349) return 'southeast'; // FL, GA, AL
  if (p >= 850 && p <= 865) return 'southwest'; // AZ, NM
  if (p >= 900 && p <= 961) return 'west-coast'; // CA
  if (p >= 970 && p <= 999) return 'northwest'; // OR, WA
  if (p >= 600 && p <= 629) return 'midwest'; // IL, IN
  if (p >= 100 && p <= 149) return 'northeast'; // NY, MA
  return 'central';
}

/**
 * Get default weather data for a region (fallback)
 */
function getDefaultWeatherForRegion(region: string): WeatherData {
  const defaults: Record<string, WeatherData> = {
    'southeast': {
      profile: 'Hot & Humid',
      extremes: 'High cooling load',
      avgTempF: 72,
      avgHighF: 85,
      avgLowF: 60,
      heatingDegreeDays: 1500,
      coolingDegreeDays: 2500,
      source: 'cache',
    },
    'southwest': {
      profile: 'Hot & Dry',
      extremes: 'Frequent heatwaves',
      avgTempF: 75,
      avgHighF: 92,
      avgLowF: 58,
      heatingDegreeDays: 1200,
      coolingDegreeDays: 3000,
      source: 'cache',
    },
    'west-coast': {
      profile: 'Temperate',
      extremes: 'Mild year-round',
      avgTempF: 65,
      avgHighF: 75,
      avgLowF: 55,
      heatingDegreeDays: 1800,
      coolingDegreeDays: 800,
      source: 'cache',
    },
    'northwest': {
      profile: 'Cool & Wet',
      extremes: 'Moderate climate',
      avgTempF: 55,
      avgHighF: 65,
      avgLowF: 45,
      heatingDegreeDays: 3500,
      coolingDegreeDays: 200,
      source: 'cache',
    },
    'midwest': {
      profile: 'High Variability',
      extremes: 'Extreme temperature swings',
      avgTempF: 55,
      avgHighF: 75,
      avgLowF: 35,
      heatingDegreeDays: 5000,
      coolingDegreeDays: 1000,
      source: 'cache',
    },
    'northeast': {
      profile: 'Cold & Dry',
      extremes: 'Harsh winters',
      avgTempF: 50,
      avgHighF: 65,
      avgLowF: 35,
      heatingDegreeDays: 5500,
      coolingDegreeDays: 800,
      source: 'cache',
    },
    'central': {
      profile: 'Moderate',
      extremes: 'Moderate climate',
      avgTempF: 60,
      avgHighF: 75,
      avgLowF: 45,
      heatingDegreeDays: 3000,
      coolingDegreeDays: 1500,
      source: 'cache',
    },
  };

  return defaults[region] || defaults['central'];
}
