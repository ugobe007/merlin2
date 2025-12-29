/**
 * useStableMemo - Memoization hook with deep equality comparison
 * 
 * Prevents unnecessary recalculations when object references change
 * but contents remain the same.
 * 
 * Usage:
 * const stableValue = useStableMemo(() => expensiveCalculation(data), [data]);
 */

import { useMemo, useRef } from 'react';

/**
 * Deep equality check for objects
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  
  if (keysA.length !== keysB.length) return false;
  
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * Normalize an object for stable comparison
 * - Sorts keys
 * - Removes undefined values
 * - Handles nested objects
 */
function normalizeObject(obj: any): any {
  if (obj == null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(normalizeObject);
  
  const normalized: Record<string, any> = {};
  const sortedKeys = Object.keys(obj).sort();
  
  for (const key of sortedKeys) {
    const value = obj[key];
    if (value !== undefined) {
      normalized[key] = typeof value === 'object' && value !== null && !Array.isArray(value)
        ? normalizeObject(value)
        : value;
    }
  }
  
  return normalized;
}

/**
 * Memoization hook that uses deep equality for dependencies
 * 
 * @param factory - Function that returns the memoized value
 * @param deps - Dependencies array (objects are compared by deep equality)
 * @returns Memoized value
 */
export function useStableMemo<T>(
  factory: () => T,
  deps: any[]
): T {
  const prevDepsRef = useRef<any[]>([]);
  const prevValueRef = useRef<T | null>(null);
  
  // Normalize dependencies for comparison
  const normalizedDeps = deps.map(dep => 
    typeof dep === 'object' && dep !== null && !Array.isArray(dep)
      ? normalizeObject(dep)
      : dep
  );
  
  // Check if dependencies actually changed using deep equality
  const depsChanged = normalizedDeps.length !== prevDepsRef.current.length ||
    normalizedDeps.some((dep, i) => !deepEqual(dep, prevDepsRef.current[i]));
  
  if (depsChanged) {
    prevDepsRef.current = normalizedDeps;
    prevValueRef.current = factory();
  }
  
  return prevValueRef.current!;
}

/**
 * Create a stable hash from an object for comparison
 */
export function createStableHash(obj: any): string {
  const normalized = normalizeObject(obj);
  return JSON.stringify(normalized);
}

