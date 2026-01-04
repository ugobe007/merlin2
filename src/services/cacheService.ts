/**
 * Simple In-Memory Cache Service
 *
 * Provides caching for frequently accessed data like baseline configurations.
 * Reduces database queries and improves performance.
 *
 * Features:
 * - TTL (Time-To-Live) expiration
 * - LRU (Least Recently Used) eviction
 * - Size limits
 * - Cache statistics
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private defaultTTL: number; // milliseconds
  private stats: { hits: number; misses: number };

  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // Default: 5 minutes
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > this.defaultTTL) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count and move to end (LRU)
    entry.hits++;
    this.stats.hits++;

    // Re-insert to update position
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear specific pattern (e.g., all baseline calculations)
   */
  clearPattern(pattern: string): number {
    let cleared = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }

  /**
   * Get all cache keys (for debugging)
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.defaultTTL) {
        this.cache.delete(key);
        pruned++;
      }
    }

    return pruned;
  }
}

// Create singleton instances for different data types
export const baselineCache = new CacheService(50, 10 * 60 * 1000); // 10 min TTL, 50 entries
export const useCaseCache = new CacheService(100, 30 * 60 * 1000); // 30 min TTL, 100 entries
export const calculationCache = new CacheService(200, 5 * 60 * 1000); // 5 min TTL, 200 entries

// Auto-prune every 5 minutes
setInterval(
  () => {
    baselineCache.prune();
    useCaseCache.prune();
    calculationCache.prune();
  },
  5 * 60 * 1000
);

// Export cache service class for custom instances
export default CacheService;
