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
  // USPS prefix assignment table — covers all 50 states, DC, and territories
  // Source: https://pe.usps.com/text/pub65/pub65apx_002.htm
  // Order: ascending by min ZIP prefix
  { min: 501, max: 544, state: 'NY', stateName: 'New York', city: 'Holtsville' },       // IRS center
  { min: 1001, max: 2799, state: 'MA', stateName: 'Massachusetts', city: 'Boston' },
  { min: 2801, max: 2999, state: 'RI', stateName: 'Rhode Island', city: 'Providence' },
  { min: 3001, max: 3899, state: 'NH', stateName: 'New Hampshire', city: 'Manchester' },
  { min: 3901, max: 4999, state: 'ME', stateName: 'Maine', city: 'Portland' },
  { min: 5001, max: 5999, state: 'VT', stateName: 'Vermont', city: 'Burlington' },
  { min: 6001, max: 6999, state: 'CT', stateName: 'Connecticut', city: 'Hartford' },
  { min: 7001, max: 8999, state: 'NJ', stateName: 'New Jersey', city: 'Newark' },
  { min: 10001, max: 14999, state: 'NY', stateName: 'New York', city: 'New York' },
  { min: 15001, max: 19699, state: 'PA', stateName: 'Pennsylvania', city: 'Philadelphia' },
  { min: 19700, max: 19999, state: 'DE', stateName: 'Delaware', city: 'Wilmington' },
  { min: 20001, max: 20599, state: 'DC', stateName: 'District of Columbia', city: 'Washington' },
  { min: 20600, max: 21999, state: 'MD', stateName: 'Maryland', city: 'Baltimore' },
  { min: 22001, max: 24699, state: 'VA', stateName: 'Virginia', city: 'Richmond' },
  { min: 24700, max: 26899, state: 'WV', stateName: 'West Virginia', city: 'Charleston' },
  { min: 27001, max: 28999, state: 'NC', stateName: 'North Carolina', city: 'Charlotte' },
  { min: 29001, max: 29999, state: 'SC', stateName: 'South Carolina', city: 'Charleston' },
  { min: 30001, max: 31999, state: 'GA', stateName: 'Georgia', city: 'Atlanta' },
  { min: 32001, max: 34999, state: 'FL', stateName: 'Florida', city: 'Miami' },
  { min: 35001, max: 36999, state: 'AL', stateName: 'Alabama', city: 'Birmingham' },
  { min: 37001, max: 38599, state: 'TN', stateName: 'Tennessee', city: 'Nashville' },
  { min: 38600, max: 39799, state: 'MS', stateName: 'Mississippi', city: 'Jackson' },
  { min: 40001, max: 42799, state: 'KY', stateName: 'Kentucky', city: 'Louisville' },
  { min: 43001, max: 45999, state: 'OH', stateName: 'Ohio', city: 'Columbus' },
  { min: 46001, max: 47999, state: 'IN', stateName: 'Indiana', city: 'Indianapolis' },
  { min: 48001, max: 49999, state: 'MI', stateName: 'Michigan', city: 'Detroit' },
  { min: 50001, max: 52899, state: 'IA', stateName: 'Iowa', city: 'Des Moines' },
  { min: 53001, max: 54999, state: 'WI', stateName: 'Wisconsin', city: 'Milwaukee' },
  { min: 55001, max: 56799, state: 'MN', stateName: 'Minnesota', city: 'Minneapolis' },
  { min: 57001, max: 57799, state: 'SD', stateName: 'South Dakota', city: 'Sioux Falls' },
  { min: 58001, max: 58899, state: 'ND', stateName: 'North Dakota', city: 'Fargo' },
  { min: 59001, max: 59999, state: 'MT', stateName: 'Montana', city: 'Billings' },
  { min: 60001, max: 62999, state: 'IL', stateName: 'Illinois', city: 'Chicago' },
  { min: 63001, max: 65999, state: 'MO', stateName: 'Missouri', city: 'Kansas City' },
  { min: 66001, max: 67999, state: 'KS', stateName: 'Kansas', city: 'Wichita' },
  { min: 68001, max: 69399, state: 'NE', stateName: 'Nebraska', city: 'Omaha' },
  { min: 70001, max: 71499, state: 'LA', stateName: 'Louisiana', city: 'New Orleans' },
  { min: 71600, max: 72999, state: 'AR', stateName: 'Arkansas', city: 'Little Rock' },
  { min: 73001, max: 74999, state: 'OK', stateName: 'Oklahoma', city: 'Oklahoma City' },
  { min: 75001, max: 79999, state: 'TX', stateName: 'Texas', city: 'Dallas' },
  { min: 80001, max: 81699, state: 'CO', stateName: 'Colorado', city: 'Denver' },
  { min: 82001, max: 83199, state: 'WY', stateName: 'Wyoming', city: 'Cheyenne' },
  { min: 83201, max: 83899, state: 'ID', stateName: 'Idaho', city: 'Boise' },
  { min: 84001, max: 84799, state: 'UT', stateName: 'Utah', city: 'Salt Lake City' },
  { min: 85001, max: 86599, state: 'AZ', stateName: 'Arizona', city: 'Phoenix' },
  { min: 87001, max: 88499, state: 'NM', stateName: 'New Mexico', city: 'Albuquerque' },
  { min: 88901, max: 89899, state: 'NV', stateName: 'Nevada', city: 'Las Vegas' },
  { min: 90001, max: 96199, state: 'CA', stateName: 'California', city: 'Los Angeles' },
  { min: 96700, max: 96899, state: 'HI', stateName: 'Hawaii', city: 'Honolulu' },
  { min: 97001, max: 97999, state: 'OR', stateName: 'Oregon', city: 'Portland' },
  { min: 98001, max: 99499, state: 'WA', stateName: 'Washington', city: 'Seattle' },
  { min: 99501, max: 99999, state: 'AK', stateName: 'Alaska', city: 'Anchorage' },
  // US Territories
  { min: 600, max: 988, state: 'PR', stateName: 'Puerto Rico', city: 'San Juan' },
  { min: 800, max: 805, state: 'VI', stateName: 'US Virgin Islands', city: 'Charlotte Amalie' },
  { min: 96900, max: 96999, state: 'GU', stateName: 'Guam', city: 'Hagatna' },
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
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
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
        city: geocoded.city ?? '',
        state: geocoded.stateCode ?? '',
        stateName: ((geocoded.state || geocoded.stateCode) ?? '') as string,
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
