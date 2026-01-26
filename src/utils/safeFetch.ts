/**
 * Safe Fetch Utility - Jan 25, 2026
 * 
 * Bulletproof fetching for optional data endpoints
 * Handles 429 (rate limit), 404 (not found), 400 (bad request) gracefully
 * with memory caching to prevent hammering endpoints
 */

interface CacheEntry {
  ts: number;
  data: any;
}

const memoryCache = new Map<string, CacheEntry>();

export interface SafeFetchOptions {
  /** Cache time-to-live in milliseconds (default: 5 minutes) */
  ttlMs?: number;
  /** Additional headers to send */
  headers?: Record<string, string>;
  /** Request method (default: GET) */
  method?: string;
  /** Request body for POST/PUT */
  body?: any;
}

/**
 * Fetch JSON from an optional endpoint with caching and graceful failure
 * 
 * Returns null on any failure (429, 404, 400, network error)
 * Never throws - safe to use without try/catch
 * 
 * @example
 * const markupConfig = await fetchOptionalJSON("/api/pricing_markup_config");
 * if (markupConfig) {
 *   // Use data
 * } else {
 *   // Use defaults
 * }
 */
export async function fetchOptionalJSON<T = any>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<T | null> {
  const { ttlMs = 5 * 60_000, headers, method = "GET", body } = options;
  
  // Check cache first (for GET requests)
  if (method === "GET") {
    const cached = memoryCache.get(url);
    if (cached && Date.now() - cached.ts < ttlMs) {
      if (import.meta.env.DEV) {
        console.debug(`[SafeFetch] Cache hit: ${url}`);
      }
      return cached.data as T;
    }
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(url, fetchOptions);

    // Handle rate limiting - hard stop, don't retry
    if (res.status === 429) {
      if (import.meta.env.DEV) {
        console.warn(`[SafeFetch] Rate limited (429): ${url} - using cached/default data`);
      }
      return null;
    }

    // Handle not found - endpoint doesn't exist, stop trying
    if (res.status === 404) {
      if (import.meta.env.DEV) {
        console.debug(`[SafeFetch] Not found (404): ${url} - using default data`);
      }
      // Cache the 404 so we don't keep hammering
      if (method === "GET") {
        memoryCache.set(url, { ts: Date.now(), data: null });
      }
      return null;
    }

    // Handle bad request - wrong params, invalid filter, RLS deny
    if (res.status === 400) {
      if (import.meta.env.DEV) {
        console.debug(`[SafeFetch] Bad request (400): ${url} - check params/filters`);
      }
      return null;
    }

    // Any other non-OK status
    if (!res.ok) {
      if (import.meta.env.DEV) {
        console.debug(`[SafeFetch] Error ${res.status}: ${url}`);
      }
      return null;
    }

    // Success - parse and cache
    const data = await res.json();
    
    if (method === "GET") {
      memoryCache.set(url, { ts: Date.now(), data });
    }
    
    return data as T;

  } catch (error) {
    // Network error, CORS, parse error, etc.
    if (import.meta.env.DEV) {
      console.debug(`[SafeFetch] Exception: ${url}`, error);
    }
    return null;
  }
}

/**
 * Clear the memory cache (useful for testing or forced refresh)
 */
export function clearFetchCache(urlPattern?: string) {
  if (urlPattern) {
    // Clear matching URLs
    const regex = new RegExp(urlPattern);
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  } else {
    // Clear all
    memoryCache.clear();
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getFetchCacheStats() {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
  };
}
