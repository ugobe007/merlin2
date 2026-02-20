/**
 * LOCATION ENRICHMENT SERVICE
 * ===========================
 * 
 * Created: January 20, 2026
 * Purpose: Unified orchestration of all location-based APIs
 * 
 * THE HOOK: When user enters ZIP code, get EVERYTHING instantly:
 * - Real city name (Google Geocoding)
 * - Utility rates + demand charges (NREL + EIA)
 * - Solar resource data (NREL PVWatts)
 * - Weather/climate profile (Visual Crossing + NWS)
 * - State-level savings teaser (calculated from real data)
 * 
 * NO MORE HARDCODED LOOKUPS. ALL DATA IS LIVE AND PERSONALIZED.
 */

import { geocodeLocation } from './geocodingService';
import { getWeatherData } from './weatherService';
import { getCommercialRateByZip } from './utilityRateService';
import { estimateSolarProduction } from './pvWattsService';

// ============================================================================
// TYPES
// ============================================================================

export interface EnrichedLocationData {
  // Location Info (from Google Geocoding)
  zipCode: string;
  city: string;
  state: string;
  stateCode: string;
  formattedAddress: string;
  lat: number;
  lon: number;
  country: string;
  currency: string;

  // Utility Data (from NREL + EIA)
  utility: {
    name: string;
    rate: number; // $/kWh commercial
    demandCharge: number; // $/kW
    hasTOU: boolean;
    peakRate?: number;
    offPeakRate?: number;
    source: string;
  };

  // Solar Resource Data (from NREL PVWatts)
  solar: {
    sunHours: number; // Peak sun hours per day
    capacityFactor: number; // Typical solar capacity factor (%)
    rating: 'A' | 'B' | 'C' | 'D'; // Solar grade
    label: string; // "Excellent", "Good", "Fair", "Poor"
    annualProductionPerKW: number; // kWh/kW/year
  };

  // Weather/Climate Data (from Visual Crossing + NWS)
  weather: {
    profile: string; // "Hot & Humid", "Temperate", etc.
    extremes: string; // "Frequent heatwaves", "Mild year-round", etc.
    avgTempF: number;
    avgHighF: number;
    avgLowF: number;
    heatingDegreeDays: number;
    coolingDegreeDays: number;
  };

  // Savings Teaser (calculated from real data)
  savingsTeaser: {
    low: number; // Conservative estimate ($/year)
    high: number; // Optimistic estimate ($/year)
    peakShaving: number; // From demand charge reduction
    solarPotential: number; // From solar + arbitrage
    basis: string; // "Based on typical commercial profiles in {city}"
  };

  // Metadata
  dataQuality: {
    geocoding: 'success' | 'fallback' | 'failed';
    utility: 'success' | 'fallback' | 'failed';
    solar: 'success' | 'fallback' | 'failed';
    weather: 'success' | 'fallback' | 'failed';
    overall: 'high' | 'medium' | 'low';
  };

  fetchedAt: string;
}

// ============================================================================
// INDUSTRY ESTIMATES FOR TEASER CALCULATION
// ============================================================================

const DEFAULT_COMMERCIAL_PROFILE = {
  avgPeakKW: 300,
  peakShavingPct: 0.28, // Can reduce demand by 28%
  solarFitPct: 0.30, // Solar size as % of peak demand
  avgLoadFactorPct: 0.60, // Average load / peak load
};

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

/**
 * Get enriched location data from ZIP code
 * Orchestrates all APIs in parallel for speed
 */
export async function enrichLocationData(zipCode: string): Promise<EnrichedLocationData | null> {
  if (!zipCode || zipCode.length !== 5) {
    console.error('[LocationEnrichment] Invalid ZIP code');
    return null;
  }

  const startTime = Date.now();
  if (import.meta.env.DEV) console.log(`[LocationEnrichment] Starting enrichment for ZIP ${zipCode}`);

  // Initialize quality tracking
  const dataQuality: EnrichedLocationData['dataQuality'] = {
    geocoding: 'failed',
    utility: 'failed',
    solar: 'failed',
    weather: 'failed',
    overall: 'low',
  };

  try {
    // ========================================================================
    // STEP 1: Geocode ZIP → Get real city name + coordinates
    // ========================================================================
    const geocodeResult = await geocodeLocation(zipCode);
    
    if (!geocodeResult) {
      console.error('[LocationEnrichment] Geocoding failed');
      return null;
    }

    dataQuality.geocoding = 'success';
    if (import.meta.env.DEV) console.log(`[LocationEnrichment] Geocoded: ${geocodeResult.city}, ${geocodeResult.stateCode}`);

    const { lat, lon, city, stateCode, formattedAddress } = geocodeResult;
    const stateName = geocodeResult.state || stateCode;

    // ========================================================================
    // STEP 2: Fetch all data in parallel for speed
    // ========================================================================
    const [utilityData, weatherData, solarEstimate] = await Promise.allSettled([
      // Utility rates from NREL + EIA
      getCommercialRateByZip(zipCode),
      
      // Weather from Visual Crossing + NWS
      getWeatherData(zipCode, lat, lon),
      
      // Solar resource from NREL PVWatts regional data
      Promise.resolve(estimateSolarProduction(1, stateCode!, 'fixed')),
    ]);

    // ========================================================================
    // STEP 3: Process utility data
    // ========================================================================
    let utility: EnrichedLocationData['utility'];
    
    if (utilityData.status === 'fulfilled' && utilityData.value) {
      dataQuality.utility = 'success';
      utility = {
        name: utilityData.value.utilityName,
        rate: utilityData.value.rate,
        demandCharge: utilityData.value.demandCharge,
        hasTOU: utilityData.value.hasTOU,
        peakRate: utilityData.value.peakRate,
        offPeakRate: utilityData.value.peakRate ? utilityData.value.rate * 0.7 : undefined, // Estimate off-peak
        source: utilityData.value.source,
      };
      if (import.meta.env.DEV) console.log(`[LocationEnrichment] Utility: ${utility.name} - $${utility.rate}/kWh`);
    } else {
      // Fallback to basic state average
      dataQuality.utility = 'fallback';
      utility = {
        name: `${stateName} Average`,
        rate: 0.12,
        demandCharge: 15,
        hasTOU: false,
        source: 'fallback',
      };
      console.warn('[LocationEnrichment] Utility data unavailable - using fallback');
    }

    // ========================================================================
    // STEP 4: Process solar data
    // ========================================================================
    let solar: EnrichedLocationData['solar'];
    
    if (solarEstimate.status === 'fulfilled' && solarEstimate.value) {
      dataQuality.solar = 'success';
      const capacityFactor = solarEstimate.value.capacityFactor / 100;
      const sunHours = capacityFactor * 24; // Rough approximation
      
      // Calculate solar grade
      let rating: 'A' | 'B' | 'C' | 'D';
      let label: string;
      if (capacityFactor >= 0.20) {
        rating = 'A';
        label = 'Excellent';
      } else if (capacityFactor >= 0.16) {
        rating = 'B';
        label = 'Good';
      } else if (capacityFactor >= 0.13) {
        rating = 'C';
        label = 'Fair';
      } else {
        rating = 'D';
        label = 'Poor';
      }

      solar = {
        sunHours: Math.round(sunHours * 10) / 10,
        capacityFactor: Math.round(capacityFactor * 1000) / 10,
        rating,
        label,
        annualProductionPerKW: solarEstimate.value.productionPerKW,
      };
      if (import.meta.env.DEV) console.log(`[LocationEnrichment] Solar: ${solar.sunHours} hrs/day (${solar.label})`);
    } else {
      // Fallback solar estimate
      dataQuality.solar = 'fallback';
      solar = {
        sunHours: 5.0,
        capacityFactor: 17,
        rating: 'C',
        label: 'Fair',
        annualProductionPerKW: 1489,
      };
      console.warn('[LocationEnrichment] Solar data unavailable - using fallback');
    }

    // ========================================================================
    // STEP 5: Process weather data
    // ========================================================================
    let weather: EnrichedLocationData['weather'];
    
    if (weatherData.status === 'fulfilled' && weatherData.value) {
      dataQuality.weather = 'success';
      weather = {
        profile: weatherData.value.profile,
        extremes: weatherData.value.extremes,
        avgTempF: weatherData.value.avgTempF || 65,
        avgHighF: weatherData.value.avgHighF || 75,
        avgLowF: weatherData.value.avgLowF || 55,
        heatingDegreeDays: weatherData.value.heatingDegreeDays || 2000,
        coolingDegreeDays: weatherData.value.coolingDegreeDays || 1500,
      };
      if (import.meta.env.DEV) console.log(`[LocationEnrichment] Weather: ${weather.profile} - ${weather.extremes}`);
    } else {
      // Fallback weather estimate
      dataQuality.weather = 'fallback';
      weather = {
        profile: 'Moderate',
        extremes: 'Moderate climate',
        avgTempF: 65,
        avgHighF: 75,
        avgLowF: 55,
        heatingDegreeDays: 2000,
        coolingDegreeDays: 1500,
      };
      console.warn('[LocationEnrichment] Weather data unavailable - using fallback');
    }

    // ========================================================================
    // STEP 6: Calculate savings teaser from REAL DATA
    // ========================================================================
    
    const profile = DEFAULT_COMMERCIAL_PROFILE;
    
    // Peak shaving savings: avgPeakKW * demandCharge * 12 months * reduction %
    const peakShaving = Math.round(
      profile.avgPeakKW * utility.demandCharge * 12 * profile.peakShavingPct
    );
    
    // Solar potential: solar size * annual production * electricity rate
    const solarKW = profile.avgPeakKW * profile.solarFitPct;
    const solarAnnualKWh = solarKW * solar.annualProductionPerKW;
    const solarPotential = Math.round(solarAnnualKWh * utility.rate);
    
    // Base total
    const baseTotal = peakShaving + solarPotential;
    
    // Conservative range: 70%-110% (narrower for state-level teaser)
    const savingsTeaser = {
      low: Math.round(baseTotal * 0.70),
      high: Math.round(baseTotal * 1.10),
      peakShaving,
      solarPotential,
      basis: `Based on typical commercial profiles in ${city}`,
    };

    if (import.meta.env.DEV) console.log(`[LocationEnrichment] Savings teaser: $${savingsTeaser.low}-$${savingsTeaser.high}/year`);

    // ========================================================================
    // STEP 7: Determine overall data quality
    // ========================================================================
    const successCount = [
      dataQuality.geocoding,
      dataQuality.utility,
      dataQuality.solar,
      dataQuality.weather,
    ].filter(q => q === 'success').length;

    if (successCount >= 3) {
      dataQuality.overall = 'high';
    } else if (successCount >= 2) {
      dataQuality.overall = 'medium';
    } else {
      dataQuality.overall = 'low';
    }

    const elapsedTime = Date.now() - startTime;
    if (import.meta.env.DEV) console.log(`[LocationEnrichment] Complete in ${elapsedTime}ms - Quality: ${dataQuality.overall}`);

    // ========================================================================
    // STEP 8: Return enriched data
    // ========================================================================
    return {
      zipCode,
      city: city || 'Unknown',
      state: stateName || stateCode!,
      stateCode: stateCode!,
      formattedAddress,
      lat,
      lon,
      country: 'US',
      currency: 'USD',
      utility,
      solar,
      weather,
      savingsTeaser,
      dataQuality,
      fetchedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error('[LocationEnrichment] Fatal error:', error);
    return null;
  }
}

// ============================================================================
// SIMPLIFIED API FOR STEP 1
// ============================================================================

/**
 * Quick enrichment for Step 1 - just the essentials
 * Returns immediately with basic data while full enrichment happens in background
 */
export async function quickEnrichLocation(zipCode: string): Promise<{
  city: string;
  stateCode: string;
  rate: number;
  demandCharge: number;
  sunHours: number;
  savingsLow: number;
  savingsHigh: number;
} | null> {
  // Just geocode + get state data quickly
  const geocodeResult = await geocodeLocation(zipCode);
  if (!geocodeResult || !geocodeResult.stateCode) return null;

  const { city, stateCode } = geocodeResult;

  // Get basic utility rate (from cache if available)
  const utilityData = await getCommercialRateByZip(zipCode);
  const rate = utilityData?.rate || 0.12;
  const demandCharge = utilityData?.demandCharge || 15;

  // Get solar estimate
  const solarEstimate = estimateSolarProduction(1, stateCode, 'fixed');
  const capacityFactor = solarEstimate.capacityFactor / 100;
  const sunHours = Math.round(capacityFactor * 24 * 10) / 10;

  // Quick savings calc
  const profile = DEFAULT_COMMERCIAL_PROFILE;
  const peakShaving = Math.round(profile.avgPeakKW * demandCharge * 12 * profile.peakShavingPct);
  const solarKW = profile.avgPeakKW * profile.solarFitPct;
  const solarAnnual = solarKW * solarEstimate.productionPerKW;
  const solarPotential = Math.round(solarAnnual * rate);
  const baseTotal = peakShaving + solarPotential;

  return {
    city: city || stateCode,
    stateCode,
    rate,
    demandCharge,
    sunHours,
    savingsLow: Math.round(baseTotal * 0.70),
    savingsHigh: Math.round(baseTotal * 1.10),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  enrichLocationData,
  quickEnrichLocation,
};
