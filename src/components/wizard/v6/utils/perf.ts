/**
 * Performance Instrumentation (DEV/TEST only)
 *
 * Lightweight performance tracking for wizard operations.
 * Only enabled in development, test, or perf modes.
 */

export type PerfEvent =
  | "step5_quote_start"
  | "step5_quote_end"
  | "tier_switch_start"
  | "tier_switch_end";

const ENABLED =
  import.meta.env.DEV || import.meta.env.MODE === "test" || import.meta.env.MODE === "perf";

/**
 * Mark a performance event
 *
 * @param name - Event name
 * @param detail - Optional detail object (logged in DEV)
 */
export function perfMark(name: PerfEvent, detail?: Record<string, unknown>) {
  if (!ENABLED || typeof performance === "undefined") return;

  try {
    performance.mark(name);
    if (detail) {
      console.log("[perf]", name, detail);
    }
  } catch (err) {
    // Silently fail if performance API is not available
    if (import.meta.env.DEV) {
      console.warn("[perf] Failed to mark:", name, err);
    }
  }
}

/**
 * Measure time between two performance marks
 *
 * @param label - Measurement label
 * @param start - Start mark name
 * @param end - End mark name
 * @returns PerformanceEntry or null
 */
export function perfMeasure(label: string, start: PerfEvent, end: PerfEvent) {
  if (!ENABLED || typeof performance === "undefined") return null;

  try {
    performance.measure(label, start, end);
    const entries = performance.getEntriesByName(label);
    const entry = entries[entries.length - 1];

    if (entry && "duration" in entry) {
      console.log(`[perf] ${label}: ${entry.duration.toFixed(2)}ms`);
    }

    return entry ?? null;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[perf] Failed to measure:", label, err);
    }
    return null;
  }
}

/**
 * Clear all performance marks and measures
 * Useful for test cleanup
 */
export function perfClear() {
  if (!ENABLED || typeof performance === "undefined") return;

  try {
    performance.clearMarks();
    performance.clearMeasures();
  } catch {
    // Silently fail
  }
}
