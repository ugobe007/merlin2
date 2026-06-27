/**
 * useSiteCopy — reads AI-managed copy from the `site_copy` Supabase table.
 *
 * Falls back to DEFAULTS for every key so the site always renders even if
 * the DB is unreachable or a key has not been seeded yet.
 *
 * Usage:
 *   const { copy, loading } = useSiteCopy();
 *   <h1>{copy('hero_headline_prefix')}</h1>
 *   <p>{copy('hero_subtext')}</p>
 *   // JSON arrays stored as JSON strings:
 *   const accents = copy<string[]>('hero_accent_lines', []);
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ── Hardcoded defaults (always used as fallback) ─────────────────────────────
export const SITE_COPY_DEFAULTS: Record<string, string> = {
  hero_headline_prefix: "Reduce Utility Risk",
  hero_accent_lines: JSON.stringify([
    "Through Energy Stacking.",
    "Into an Energy Strategy.",
    "Before Utility Risk Hits Growth.",
  ]),
  hero_subtext:
    "Merlin compares utility power, storage, solar, generators, and flexible loads to recommend the right energy architecture for your business.",
  hero_badge_text: "Independent B2B Energy Intelligence",
  hero_proof_items: JSON.stringify([
    "Free & Instant",
    "No Utility Login Required",
    "CFO-Ready Report",
  ]),
  modal_headline: "Get your free energy analysis",
  modal_subtext: "See how much you could save on your energy bill.",
  modal_cta_text: "Get My Free Analysis",
  nav_cta_text: "Get Started",
  hero_cta_primary: "Get Your Free Energy Report",
  hero_cta_secondary: "See How It Works",
};

// ── Module-level cache so multiple components share one fetch ─────────────────
let _cache: Record<string, string> | null = null;
let _cachePromise: Promise<Record<string, string>> | null = null;

async function fetchSiteCopy(): Promise<Record<string, string>> {
  if (_cache) return _cache;
  if (_cachePromise) return _cachePromise;

  _cachePromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("site_copy")
        .select("key, value");
      if (error) throw error;
      const result: Record<string, string> = { ...SITE_COPY_DEFAULTS };
      for (const row of data ?? []) {
        if (row.key && row.value != null) result[row.key] = row.value;
      }
      _cache = result;
      return result;
    } catch (_e) {
      // DB unreachable — return defaults, don't cache so next render retries
      _cachePromise = null;
      return { ...SITE_COPY_DEFAULTS };
    }
  })();

  return _cachePromise;
}

// Invalidate cache when AI loop writes new values (call from admin dashboard)
export function invalidateSiteCopyCache() {
  _cache = null;
  _cachePromise = null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useSiteCopy() {
  const [copyMap, setCopyMap] = useState<Record<string, string>>(
    _cache ?? SITE_COPY_DEFAULTS
  );
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) return; // already loaded
    setLoading(true);
    fetchSiteCopy().then((m) => {
      setCopyMap(m);
      setLoading(false);
    });
  }, []);

  // copy(key) returns string; copy<T>(key, fallback) parses JSON for arrays
  const copy = useCallback(
    function get<T = string>(key: string, jsonFallback?: T): T extends string ? string : T {
      const raw = copyMap[key] ?? SITE_COPY_DEFAULTS[key] ?? "";
      if (jsonFallback !== undefined) {
        try {
          return JSON.parse(raw) as T extends string ? string : T;
        } catch {
          return (jsonFallback ?? raw) as T extends string ? string : T;
        }
      }
      return raw as T extends string ? string : T;
    },
    [copyMap]
  );

  return { copy, loading, copyMap };
}
