/**
 * TrueQuoteTemp — Canonical Wizard Session Store
 * ================================================
 * Single source of truth for all wizard data between Steps 1–6.
 *
 * DESIGN PRINCIPLES:
 * - Written SYNCHRONOUSLY in event handlers (never in useEffect)
 * - Read DIRECTLY by Steps 5 and 6 at render time (no snapshot freeze)
 * - Persisted to sessionStorage so page refresh doesn't lose progress
 * - Flat structure — no nested reactive subscriptions needed
 * - Each Step owns its own write keys; later steps never overwrite earlier ones
 *
 * WRITE OWNERS:
 *   Step 1 → location, utilityRate, demandCharge, peakSunHours
 *   Step 2 → industry
 *   Step 3 → peakLoadKW, durationHours, goals
 *   Step 4 → includeSolar/solarKW, includeEV/evChargerKW,
 *             includeGenerator/generatorKW, includeWind/windKW
 *   Pricing→ pricingComplete, grossCost, taxCredit, netCost,
 *             annualSavings, paybackYears, roi5Year, roi10Year, npv, irr
 *   Step 5 → selectedTierKey
 *
 * READ OWNERS:
 *   Step 5 reads everything written by Steps 1–4 + Pricing
 *   Step 6 reads everything
 */

const STORAGE_KEY = "tqt_v1";

// ─────────────────────────────────────────────────────────────────────────────
// Data contract
// ─────────────────────────────────────────────────────────────────────────────

export interface TrueQuoteTempData {
  // ── Step 1: Location ────────────────────────────────────────────────────
  state: string;
  zip: string;
  city: string;
  utilityRate: number;
  demandCharge: number;
  peakSunHours: number;

  // ── Step 2: Industry ────────────────────────────────────────────────────
  industry: string;

  // ── Step 3: Profile ─────────────────────────────────────────────────────
  peakLoadKW: number;
  durationHours: number;
  goals: string[];

  // ── Step 4: Add-ons ─────────────────────────────────────────────────────
  includeSolar: boolean;
  solarKW: number;
  includeGenerator: boolean;
  generatorKW: number;
  generatorFuelType: string;
  includeWind: boolean;
  windKW: number;
  includeEV: boolean;
  evChargerKW: number;

  // ── Pricing output ──────────────────────────────────────────────────────
  pricingComplete: boolean;
  grossCost: number;
  taxCredit: number;
  netCost: number;
  annualSavings: number;
  paybackYears: number;
  roi5Year: number;
  roi10Year: number;
  roi25Year: number;
  npv: number;
  irr: number;

  // ── Step 5: Selected tier ───────────────────────────────────────────────
  selectedTierKey: string | null;

  // ── Meta ─────────────────────────────────────────────────────────────────
  sessionId: string;
  updatedAt: number;
}

const DEFAULTS: TrueQuoteTempData = {
  state: "",
  zip: "",
  city: "",
  utilityRate: 0.12,
  demandCharge: 15,
  peakSunHours: 5,
  industry: "",
  peakLoadKW: 0,
  durationHours: 4,
  goals: [],
  includeSolar: false,
  solarKW: 0,
  includeGenerator: false,
  generatorKW: 0,
  generatorFuelType: "natural-gas",
  includeWind: false,
  windKW: 0,
  includeEV: false,
  evChargerKW: 0,
  pricingComplete: false,
  grossCost: 0,
  taxCredit: 0,
  netCost: 0,
  annualSavings: 0,
  paybackYears: 0,
  roi5Year: 0,
  roi10Year: 0,
  roi25Year: 0,
  npv: 0,
  irr: 0,
  selectedTierKey: null,
  sessionId: "",
  updatedAt: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Store implementation
// ─────────────────────────────────────────────────────────────────────────────

class TrueQuoteTempStore {
  private data: TrueQuoteTempData;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.data = this._load();
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  get(): TrueQuoteTempData {
    return this.data;
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  /** Merge a partial update. All calls are synchronous — safe from event handlers. */
  patch(partial: Partial<TrueQuoteTempData>): void {
    this.data = { ...this.data, ...partial, updatedAt: Date.now() };
    this._persist();
    this._notify();
  }

  /** Replace the full store (use only on session start). */
  reset(sessionId: string): void {
    this.data = { ...DEFAULTS, sessionId, updatedAt: Date.now() };
    this._persist();
    this._notify();
  }

  /** Subscribe to any change. Returns unsubscribe fn. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ── Step-specific write helpers (named for clarity) ───────────────────────

  writeLocation(v: {
    state: string;
    zip: string;
    city: string;
    utilityRate: number;
    demandCharge: number;
    peakSunHours: number;
  }): void {
    this.patch(v);
  }

  writeIndustry(industry: string): void {
    this.patch({ industry });
  }

  writeProfile(v: {
    peakLoadKW: number;
    durationHours: number;
    goals: string[];
  }): void {
    this.patch(v);
  }

  writeAddOns(v: {
    includeSolar: boolean;
    solarKW: number;
    includeGenerator: boolean;
    generatorKW: number;
    generatorFuelType: string;
    includeWind: boolean;
    windKW: number;
    includeEV: boolean;
    evChargerKW: number;
  }): void {
    this.patch(v);
  }

  writePricing(v: {
    pricingComplete: boolean;
    grossCost: number;
    taxCredit: number;
    netCost: number;
    annualSavings: number;
    paybackYears: number;
    roi5Year: number;
    roi10Year: number;
    roi25Year: number;
    npv: number;
    irr: number;
  }): void {
    this.patch(v);
  }

  writeSelectedTier(key: string): void {
    this.patch({ selectedTierKey: key });
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  private _persist(): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // sessionStorage unavailable (private mode, quota exceeded) — no-op
    }
  }

  private _load(): TrueQuoteTempData {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TrueQuoteTempData>;
        return { ...DEFAULTS, ...parsed };
      }
    } catch {
      // corrupt or missing — fall through to defaults
    }
    return { ...DEFAULTS };
  }

  private _notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton export
// ─────────────────────────────────────────────────────────────────────────────

export const TrueQuoteTemp = new TrueQuoteTempStore();
