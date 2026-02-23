// Utility helpers extracted from WizardV6.tsx (Op5 - Feb 2026)
// Pure TS — no React dependency

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function deepMerge<T>(base: T, patch: Partial<T>): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = Array.isArray(base) ? [...(base as unknown[])] : { ...(base as object) };

  for (const [k, v] of Object.entries(patch as object)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prev = (base as any)[k];

    // arrays: replace (don't merge)
    if (Array.isArray(v)) {
      out[k] = v;
      continue;
    }

    // objects: recurse
    if (isPlainObject(v) && isPlainObject(prev)) {
      out[k] = deepMerge(prev, v);
      continue;
    }

    // primitives / null / undefined: assign
    out[k] = v;
  }

  return out as T;
}
