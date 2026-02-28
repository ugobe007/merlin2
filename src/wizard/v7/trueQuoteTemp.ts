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
  evInstallCost: number;
  evMonthlyRevenue: number;

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
  evInstallCost: 0,
  evMonthlyRevenue: 0,
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
// Sanity check result
// ─────────────────────────────────────────────────────────────────────────────

export interface SanityResult {
  /** true when there are zero hard errors (warnings are acceptable) */
  ok: boolean;
  /** Hard errors that should block display or trigger re-calculation */
  errors: string[];
  /** Soft warnings to surface in the UI as amber notices */
  warnings: string[];
}

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

  writeProfile(v: { peakLoadKW: number; durationHours: number; goals: string[] }): void {
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
    evInstallCost?: number;
    evMonthlyRevenue?: number;
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

  // ── Sanity check ─────────────────────────────────────────────────────────

  /**
   * verifySanity — internal confirmation step before results are rendered.
   *
   * Runs lightweight guard checks on every number that will appear in the
   * quote.  Callers should surface `errors` as hard blockers and `warnings`
   * as amber notices.  The check is intentionally non-blocking: a quote with
   * warnings is still shown — only `errors` suggest a re-calculation is needed.
   *
   * Categories checked:
   *   - Location data completeness
   *   - Utility rate plausibility ($/kWh)
   *   - Solar resource plausibility (peak sun hours)
   *   - Load sizing (kW > 0, not absurd)
   *   - Pricing math integrity (when pricingComplete)
   *   - Cost-per-kWh market bounds
   *   - Financial metrics range (payback, IRR, NPV)
   */
  verifySanity(): SanityResult {
    const d = this.data;
    const errors: string[] = [];
    const warnings: string[] = [];

    // ── Location ─────────────────────────────────────────────────────────────
    if (!d.state && !d.zip) {
      warnings.push("Location not set — using national average rates");
    }

    // ── Utility rate ─────────────────────────────────────────────────────────
    // US commercial rates: $0.05/kWh (industrial, AL) – $0.45/kWh (HI, CT extremes)
    if (d.utilityRate < 0.04) {
      errors.push(`Utility rate $${d.utilityRate.toFixed(3)}/kWh is below market minimum ($0.04)`);
    } else if (d.utilityRate > 0.6) {
      warnings.push(
        `Utility rate $${d.utilityRate.toFixed(3)}/kWh is unusually high (> $0.60) — verify location`
      );
    }

    // ── Solar resource ────────────────────────────────────────────────────────
    if (d.peakSunHours < 2.5) {
      warnings.push(
        `Peak sun hours ${d.peakSunHours} h/day seems low (< 2.5) — solar savings may be understated`
      );
    } else if (d.peakSunHours > 8.5) {
      warnings.push(`Peak sun hours ${d.peakSunHours} h/day exceeds realistic maximum (8.5)`);
    }

    // ── Load sizing ───────────────────────────────────────────────────────────
    if (d.peakLoadKW <= 0) {
      errors.push("Peak load is 0 kW — system sizing has not run");
    } else if (d.peakLoadKW > 500_000) {
      warnings.push(
        `Peak load ${d.peakLoadKW.toLocaleString()} kW is extremely high — verify facility size inputs`
      );
    }

    if (d.durationHours <= 0 || d.durationHours > 24) {
      warnings.push(`Storage duration ${d.durationHours} h is outside 1–24 h range`);
    }

    // ── Pricing integrity (only when pricing has run) ─────────────────────────
    if (d.pricingComplete) {
      if (d.grossCost <= 0) {
        errors.push("Gross cost is $0 — equipment pricing did not complete");
      }
      if (d.netCost < 0) {
        errors.push("Net cost is negative — tax credit exceeds project cost");
      }
      if (d.taxCredit > 0 && d.netCost > d.grossCost) {
        errors.push("Net cost exceeds gross cost — ITC calculation error");
      }
      if (d.annualSavings <= 0) {
        warnings.push("Annual savings is $0 — utility rate or load data may be incorrect");
      }

      // ── Cost per kWh market bounds ──────────────────────────────────────────
      const bessKWh = d.peakLoadKW > 0 ? d.peakLoadKW * d.durationHours : 0;
      if (bessKWh > 0 && d.grossCost > 0) {
        const costPerKWh = d.grossCost / bessKWh;
        if (costPerKWh < 50) {
          warnings.push(
            `System cost $${costPerKWh.toFixed(0)}/kWh is below NREL market floor ($50/kWh) — pricing may be misconfigured`
          );
        } else if (costPerKWh > 1_500) {
          warnings.push(
            `System cost $${costPerKWh.toFixed(0)}/kWh exceeds market ceiling ($1,500/kWh) — verify system size`
          );
        }
      }

      // ── Financial metrics range ───────────────────────────────────────────
      if (d.paybackYears > 0 && d.paybackYears < 0.5) {
        warnings.push(
          `Payback of ${d.paybackYears.toFixed(1)} years is suspiciously fast — double-check annual savings`
        );
      }
      if (d.paybackYears > 35) {
        warnings.push(
          `Payback of ${d.paybackYears.toFixed(0)} years exceeds typical project life — may be unfinanceable`
        );
      }
      if (d.irr < -20 || d.irr > 100) {
        warnings.push(`IRR of ${d.irr.toFixed(1)}% is outside the plausible range (-20% – 100%)`);
      }
      if (Number.isNaN(d.npv) || !Number.isFinite(d.npv)) {
        errors.push("NPV is NaN or Infinity — financial calculation error");
      }
      if (d.npv < -1_000_000_000) {
        errors.push("NPV is an extreme negative value — financial inputs are likely invalid");
      }
    }

    return { ok: errors.length === 0, errors, warnings };
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
