/**
 * API CONFIGURATION
 * =================
 *
 * Created: January 26, 2026
 * Updated: February 2, 2026 - Added canonical helper functions
 * Purpose: Centralized API endpoint configuration for V7 wizard
 *
 * ENVIRONMENT-AWARE:
 * - Development: Vite proxy (/api -> localhost:3001)
 * - Production: Same-origin routing on Fly.io
 *
 * CANONICAL ENDPOINTS (backend contracts):
 * - POST /api/location/resolve  { query: string } → LocationCard
 * - POST /api/places/lookup-business  { query: string } → { results: BusinessCandidate[] }
 * - POST /api/places/place-details  { placeId: string } → PlaceDetails
 * - GET  /api/places/photo/:photoRef → image blob
 */

/**
 * Get base URL for backend API
 *
 * KEY INSIGHT: Always return empty string to use relative URLs.
 * Vite proxy handles /api/* -> localhost:3001 in dev.
 * In prod, same-origin routing handles it on Fly.io.
 */
export function getApiBaseUrl(): string {
  // Check for explicit override (e.g., separate API domain)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  }

  // Default: empty string = relative URLs
  // - Dev: Vite proxy forwards /api/* to localhost:3001
  // - Prod: Same-origin routing on Fly.io
  return "";
}

/**
 * Build full API URL for a given path
 *
 * @param path - API path (e.g., "/api/location/resolve")
 * @returns Full URL to API endpoint
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * API endpoint constants (canonical routes - do not change without backend sync)
 */
export const API_ENDPOINTS = {
  // Location endpoints
  LOCATION_RESOLVE: "/api/location/resolve",
  LOCATION_INTEL: "/api/location/intel",

  // Places endpoints
  PLACES_LOOKUP: "/api/places/lookup-business",
  PLACES_DETAILS: "/api/places/place-details",
  PLACES_PHOTO: "/api/places/photo",

  // Quote engine (to be implemented)
  QUOTE_RUN: "/api/quote/run",
  QUOTE_PRICING_FREEZE: "/api/quote/pricing-freeze",

  // Templates
  TEMPLATE_LOAD: "/api/templates/load",
  TEMPLATE_LIST: "/api/templates/list",
} as const;

/**
 * Helper to make API calls with error handling
 *
 * @param endpoint - API endpoint path
 * @param options - Fetch options
 * @returns Promise with typed response
 */
export async function apiCall<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildApiUrl(endpoint);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error: unknown) {
    console.error(`[apiCall] Failed: ${endpoint}`, error);
    throw error;
  }
}

/* ============================================================
   CANONICAL API HELPERS
   
   Use these instead of raw apiCall() for type safety and
   consistent payload shapes.
============================================================ */

/**
 * Location response from backend
 */
export interface LocationResolveResponse {
  ok: boolean;
  location?: {
    rawInput: string;
    formattedAddress: string;
    city: string;
    state: string;
    stateCode: string;
    postal: string;
    country: string;
    countryCode: string;
    lat: number;
    lon: number;
  };
  source?: string;
  confidence?: number;
  evidence?: {
    source: string;
    placeId?: string;
    locationType?: string;
    components?: string[];
  };
  reason?: string;
  notes?: string[];
}

/**
 * Resolve location from user input (ZIP, city, address)
 * 
 * @param query - User input (e.g., "89052", "Henderson, NV", "123 Main St")
 * @returns LocationCard or throws error
 */
export async function resolveLocation(query: string): Promise<LocationResolveResponse> {
  return apiCall<LocationResolveResponse>(API_ENDPOINTS.LOCATION_RESOLVE, {
    method: "POST",
    body: JSON.stringify({ query: query.trim() }),
  });
}

/**
 * Business candidate from Places lookup
 */
export interface BusinessCandidate {
  placeId: string;
  name: string;
  formattedAddress: string;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  photoRef?: string | null;
}

/**
 * Lookup businesses by name/location query
 * 
 * IMPORTANT: Build query as single string including location context:
 * - Good: "starbucks Henderson NV"
 * - Bad: { name: "starbucks", zip: "89052" }
 * 
 * @param query - Search query (business name + location for best results)
 * @returns Array of business candidates (max 5)
 */
export async function lookupBusiness(query: string): Promise<{ results: BusinessCandidate[] }> {
  return apiCall<{ results: BusinessCandidate[] }>(API_ENDPOINTS.PLACES_LOOKUP, {
    method: "POST",
    body: JSON.stringify({ query: query.trim() }),
  });
}

/**
 * Place details response
 */
export interface PlaceDetailsResponse {
  ok: boolean;
  place?: {
    placeId: string;
    name: string;
    formattedAddress: string;
    lat: number;
    lng: number;
    types?: string[];
    website?: string;
    phone?: string;
    openingHours?: string[];
    rating?: number;
    photos?: Array<{ photoReference: string; width: number; height: number }>;
  };
  error?: string;
}

/**
 * Get detailed place information by placeId
 * 
 * @param placeId - Google Place ID from lookup results
 * @returns Full place details
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse> {
  return apiCall<PlaceDetailsResponse>(API_ENDPOINTS.PLACES_DETAILS, {
    method: "POST",
    body: JSON.stringify({ placeId }),
  });
}

/**
 * Build photo URL for a place photo reference
 * 
 * @param photoReference - Photo reference from place lookup/details
 * @param maxWidth - Maximum image width (default 400)
 * @returns URL to proxy photo endpoint
 */
export function buildPhotoUrl(photoReference: string, maxWidth = 400): string {
  return buildApiUrl(`${API_ENDPOINTS.PLACES_PHOTO}/${photoReference}?maxwidth=${maxWidth}`);
}
