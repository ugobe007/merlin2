/**
 * ZIP CODE LOOKUP SERVICE - SSOT for ZIP → State/City Resolution
 * =================================================================
 * 
 * STRATEGY (Jan 25, 2026):
 * 1. Database lookup first (fastest - 5ms)
 * 2. Google Maps API fallback (if DB empty or ZIP not found - 300ms)
 * 3. Hardcoded ranges fallback (if API fails - instant)
 * 
 * This ensures Step 1 always works, even if:
 * - Database not seeded yet
 * - Google Maps API down/rate-limited
 * - Network issues
 */

import { supabase } from './supabaseClient';
import { geocodeLocation } from './geocodingService';

// ============================================================================
// TYPES
// ============================================================================

export interface ZipCodeResult {
  zipCode: string;
  city: string;
  state: string;        // 2-letter code (e.g., "CA")
  stateName: string;    // Full name (e.g., "California")
  latitude?: number;
  longitude?: number;
  source: 'database' | 'google-maps' | 'hardcoded';
}

// ============================================================================
// HARDCODED FALLBACK (Last Resort)
// ============================================================================

const ZIP_RANGES: Array<{
  min: number;
  max: number;
  state: string;
  stateName: string;
  city: string;
}> = [
  { min: 10000, max: 14999, state: 'NY', stateName: 'New York', city: 'New York' },
  { min: 20000, max: 20599, state: 'DC', stateName: 'District of Columbia', city: 'Washington' },
  { min: 30000, max: 31999, state: 'GA', stateName: 'Georgia', city: 'Atlanta' },
  { min: 32000, max: 34999, state: 'FL', stateName: 'Florida', city: 'Miami' },
  { min: 60000, max: 62999, state: 'IL', stateName: 'Illinois', city: 'Chicago' },
  { min: 70000, max: 71599, state: 'LA', stateName: 'Louisiana', city: 'New Orleans' },
  { min: 75000, max: 79999, state: 'TX', stateName: 'Texas', city: 'Dallas' },
  { min: 80000, max: 81999, state: 'CO', stateName: 'Colorado', city: 'Denver' },
  { min: 85000, max: 86999, state: 'AZ', stateName: 'Arizona', city: 'Phoenix' },
  { min: 90000, max: 96999, state: 'CA', stateName: 'California', city: 'Los Angeles' },
  { min: 97000, max: 97999, state: 'OR', stateName: 'Oregon', city: 'Portland' },
  { min: 98000, max: 99999, state: 'WA', stateName: 'Washington', city: 'Seattle' },
];

function hardcodedZipLookup(zipCode: string): ZipCodeResult | null {
  const zipNum = parseInt(zipCode);
  if (isNaN(zipNum)) return null;

  for (const range of ZIP_RANGES) {
    if (zipNum >= range.min && zipNum <= range.max) {
      return {
        zipCode,
        city: range.city,
        state: range.state,
        stateName: range.stateName,
        source: 'hardcoded',
      };
    }
  }

  return null;
}

// ============================================================================
// MAIN LOOKUP FUNCTION
// ============================================================================

/**
 * Lookup ZIP code with 3-tier fallback strategy
 * 
 * @param zipCode - 5-digit US ZIP code
 * @returns Location data with source attribution
 */
export async function lookupZipCode(zipCode: string): Promise<ZipCodeResult | null> {
  if (!zipCode || zipCode.length !== 5) {
    console.error('[ZipLookup] Invalid ZIP code format');
    return null;
  }

  const startTime = Date.now();

  // ========================================================================
  // TIER 1: Database Lookup (Fastest - 5ms)
  // ========================================================================
  try {
    const { data, error } = await supabase
      .from('zip_codes')
      .select('zip_code, city, state_code, state_name, latitude, longitude')
      .eq('zip_code', zipCode)
      .single();

    if (data && !error) {
      const elapsed = Date.now() - startTime;
      console.log(`[ZipLookup] ✅ Database hit (${elapsed}ms): ${data.city}, ${data.state_code}`);
      
      return {
        zipCode: data.zip_code,
        city: data.city,
        state: data.state_code,
        stateName: data.state_name,
        latitude: data.latitude,
        longitude: data.longitude,
        source: 'database',
      };
    }

    console.log('[ZipLookup] ⚠️ Database miss - trying Google Maps API');
  } catch (dbError) {
    console.error('[ZipLookup] Database error:', dbError);
  }

  // ========================================================================
  // TIER 2: Google Maps API (Slower - 300ms, but accurate)
  // ========================================================================
  try {
    const geocoded = await geocodeLocation(zipCode);
    
    if (geocoded) {
      const elapsed = Date.now() - startTime;
      console.log(`[ZipLookup] ✅ Google Maps hit (${elapsed}ms): ${geocoded.city}, ${geocoded.stateCode}`);

      const result: ZipCodeResult = {
        zipCode,
        city: geocoded.city,
        state: geocoded.stateCode!,
        stateName: geocoded.state || geocoded.stateCode!,
        latitude: geocoded.lat,
        longitude: geocoded.lon,
        source: 'google-maps',
      };

      // Save to database for future lookups (fire-and-forget)
      saveZipCodeToDatabase(result).catch(err => 
        console.warn('[ZipLookup] Failed to cache to DB:', err)
      );

      return result;
    }

    console.log('[ZipLookup] ⚠️ Google Maps failed - trying hardcoded fallback');
  } catch (apiError) {
    console.error('[ZipLookup] Google Maps error:', apiError);
  }

  // ========================================================================
  // TIER 3: Hardcoded Fallback (Instant, limited coverage)
  // ========================================================================
  const hardcoded = hardcodedZipLookup(zipCode);
  
  if (hardcoded) {
    const elapsed = Date.now() - startTime;
    console.log(`[ZipLookup] ✅ Hardcoded fallback (${elapsed}ms): ${hardcoded.city}, ${hardcoded.state}`);
    return hardcoded;
  }

  // ========================================================================
  // All tiers failed
  // ========================================================================
  const elapsed = Date.now() - startTime;
  console.error(`[ZipLookup] ❌ All lookup methods failed (${elapsed}ms)`);
  return null;
}

// ============================================================================
// HELPER: Save to Database
// ============================================================================

async function saveZipCodeToDatabase(data: ZipCodeResult): Promise<void> {
  const { error } = await supabase
    .from('zip_codes')
    .upsert({
      zip_code: data.zipCode,
      city: data.city,
      state_code: data.state,
      state_name: data.stateName,
      latitude: data.latitude,
      longitude: data.longitude,
    }, {
      onConflict: 'zip_code'
    });

  if (error) {
    console.error('[ZipLookup] Failed to save to database:', error);
  } else {
    console.log(`[ZipLookup] Cached ${data.zipCode} to database`);
  }
}

// ============================================================================
// UTILITY: Get State from ZIP (Synchronous - for optimistic updates)
// ============================================================================

/**
 * Quick synchronous state lookup for optimistic UI updates
 * Uses hardcoded ranges only - accurate for ~70% of population
 * 
 * @param zipCode - 5-digit ZIP code
 * @returns State code or null
 */
export function getQuickStateFromZip(zipCode: string): string | null {
  const result = hardcodedZipLookup(zipCode);
  return result?.state || null;
}
