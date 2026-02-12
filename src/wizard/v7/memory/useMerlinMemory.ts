/**
 * useMerlinMemory — React hook for Merlin Memory
 * ================================================
 * 
 * Subscribes to specific memory slots. Re-renders ONLY when that slot changes.
 * Much lighter than the full wizard state (4,800+ lines of reducer).
 * 
 * USAGE:
 *   // Read a single slot (re-renders when it changes)
 *   const location = useMerlinMemory('location');
 *   
 *   // Read multiple slots
 *   const { location, goals } = useMerlinMemoryMulti('location', 'goals');
 *   
 *   // Write (doesn't need a hook — use singleton directly)
 *   import { merlinMemory } from './merlinMemory';
 *   merlinMemory.set('location', { zip: '89052' });
 * 
 * Created: Feb 11, 2026
 */

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import {
  merlinMemory,
  type MemorySlotKey,
  type MerlinMemorySlots,
} from "./merlinMemory";

// ============================================================================
// SINGLE SLOT HOOK (most common)
// ============================================================================

/**
 * Subscribe to a single memory slot. Returns the value (or null).
 * Re-renders ONLY when this specific slot changes.
 */
export function useMerlinMemory<K extends MemorySlotKey>(
  key: K
): MerlinMemorySlots[K] | null {
  // Use useSyncExternalStore for tear-free reads
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return merlinMemory.subscribe(key, onStoreChange);
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    return merlinMemory.get(key);
  }, [key]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ============================================================================
// MULTI-SLOT HOOK (for steps that need 2-3 slots)
// ============================================================================

type SlotValues<K extends MemorySlotKey[]> = {
  [I in keyof K]: K[I] extends MemorySlotKey ? MerlinMemorySlots[K[I]] | null : never;
};

/**
 * Subscribe to multiple memory slots at once.
 * Returns a tuple of values in the same order as the keys.
 * Re-renders when ANY of the specified slots change.
 * 
 * Usage:
 *   const [location, goals] = useMerlinMemorySlots('location', 'goals');
 */
export function useMerlinMemorySlots<K extends MemorySlotKey[]>(
  ...keys: K
): SlotValues<K> {
  const [, forceRender] = useState(0);
  const keysRef = useRef(keys);
  keysRef.current = keys;

  useEffect(() => {
    const unsubs = keysRef.current.map((key) =>
      merlinMemory.subscribe(key, () => {
        forceRender((n) => n + 1);
      })
    );
    return () => unsubs.forEach((fn) => fn());
  }, [keys.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return keys.map((key) => merlinMemory.get(key)) as SlotValues<K>;
}

// ============================================================================
// CONVENIENCE: NAMED MULTI-SLOT HOOK
// ============================================================================

type NamedSlots<K extends MemorySlotKey> = {
  [P in K]: MerlinMemorySlots[P] | null;
};

/**
 * Subscribe to multiple slots, returned as a named object.
 * 
 * Usage:
 *   const { location, goals, industry } = useMerlinMemoryMap('location', 'goals', 'industry');
 */
export function useMerlinMemoryMap<K extends MemorySlotKey>(
  ...keys: K[]
): NamedSlots<K> {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const unsubs = keys.map((key) =>
      merlinMemory.subscribe(key, () => {
        forceRender((n) => n + 1);
      })
    );
    return () => unsubs.forEach((fn) => fn());
  }, [keys.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const result: Partial<NamedSlots<K>> = {};
  for (const key of keys) {
    (result as Record<string, unknown>)[key] = merlinMemory.get(key);
  }
  return result as NamedSlots<K>;
}

// ============================================================================
// WRITE HELPERS (thin wrappers for type safety)
// ============================================================================

/** Hook that returns a setter for a specific slot */
export function useMerlinMemorySet<K extends MemorySlotKey>(key: K) {
  return useCallback(
    (value: MerlinMemorySlots[K]) => {
      merlinMemory.set(key, value);
    },
    [key]
  );
}

// ============================================================================
// SESSION HOOK
// ============================================================================

/** Returns the memory session ID (stable for the browser tab lifetime) */
export function useMerlinSessionId(): string {
  return merlinMemory.getSessionId();
}
