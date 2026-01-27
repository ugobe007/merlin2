/**
 * API CONFIGURATION
 * =================
 *
 * Created: January 26, 2026
 * Purpose: Centralized API endpoint configuration for V7 wizard
 *
 * ENVIRONMENT-AWARE:
 * - Development: http://localhost:3001
 * - Production: Uses VITE_API_BASE_URL or same-origin
 */

/**
 * Get base URL for backend API
 *
 * In development: Points to local Express server (port 3001)
 * In production: Uses environment variable or same-origin
 */
export function getApiBaseUrl(): string {
  // Check for explicit override
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Development mode - use local server
  if (import.meta.env.DEV) {
    return "http://localhost:3001";
  }

  // Production - assume API on same origin (Fly.io deployment)
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
 * API endpoint constants
 */
export const API_ENDPOINTS = {
  // Location endpoints
  LOCATION_RESOLVE: "/api/location/resolve",
  LOCATION_INTEL: "/api/location/intel",

  // Places endpoints (existing)
  PLACES_LOOKUP: "/api/places/lookup-business",
  PLACES_DETAILS: "/api/places/place-details",
  PLACES_PHOTO: "/api/places/photo",

  // Quote engine (to be implemented)
  QUOTE_RUN: "/api/quote/run",
  QUOTE_PRICING_FREEZE: "/api/quote/pricing-freeze",

  // Templates (to be implemented)
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
