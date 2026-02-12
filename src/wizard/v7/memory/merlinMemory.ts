/**
 * MERLIN MEMORY — Persistent Data Store for Wizard V7
 * ====================================================
 * 
 * DESIGN PRINCIPLE:
 *   Steps are momentary. Memory is persistent.
 *   Each step reads what it needs, writes its output, then is forgotten.
 *   The wizard never "looks back" at step-specific rendering state.
 * 
 * WHAT GOES IN MEMORY:
 *   ✅ Location (ZIP, state, city, coordinates)
 *   ✅ Goals (user's energy objectives)
 *   ✅ Industry (selected or inferred slug)
 *   ✅ Profile (answers from Step 3 questionnaire)
 *   ✅ Sizing (peak kW, BESS kWh, duration, etc.)
 *   ✅ Add-ons (solar, generator, EV config)
 *   ✅ Quote (final pricing output)
 * 
 * WHAT DOES NOT GO IN MEMORY:
 *   ❌ UI state (which step is active, modal open/closed)
 *   ❌ Transient flags (locationConfirmed, goalsConfirmed, isBusy)
 *   ❌ Form field values mid-edit (draft text, partial inputs)
 *   ❌ Error messages, loading states, animation state
 * 
 * USAGE:
 *   import { merlinMemory } from '@/wizard/v7/memory/merlinMemory';
 *   
 *   // Write (from any step)
 *   merlinMemory.set('location', { zip: '89052', state: 'NV', ... });
 *   
 *   // Read (from any step)
 *   const loc = merlinMemory.get('location');
 *   
 *   // Subscribe (for React hook)
 *   const unsub = merlinMemory.subscribe('location', (value) => { ... });
 *   
 *   // Check if step data exists
 *   if (merlinMemory.has('industry')) { ... }
 * 
 * Created: Feb 11, 2026
 */

// ============================================================================
// MEMORY SLOT TYPES
// ============================================================================

export type EnergyGoal =
  | "lower_bills"
  | "backup_power"
  | "reduce_carbon"
  | "energy_independence"
  | "reduce_demand_charges";

/** Step 1 output: Where is this project? */
export interface MemoryLocation {
  zip: string;
  state?: string;
  city?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  utilityRate?: number;       // $/kWh from location intel
  demandCharge?: number;      // $/kW from location intel
  peakSunHours?: number;      // from location intel
}

/** Step 1 output: What does the user want? */
export interface MemoryGoals {
  selected: EnergyGoal[];
  confirmedAt: number;        // timestamp
}

/** Step 2 output: What industry? */
export interface MemoryIndustry {
  slug: string;               // canonical slug (e.g., "hotel", "data_center")
  label?: string;             // display name
  inferred: boolean;          // true if auto-detected from business name
  confidence?: number;        // inference confidence (0-1)
}

/** Step 2.5 output: Business info (optional) */
export interface MemoryBusiness {
  name?: string;
  address?: string;
  placeId?: string;
}

/** Step 3 output: Facility profile */
export interface MemoryProfile {
  answers: Record<string, unknown>;  // questionnaire answers
  peakLoadKW: number;                // calculated peak load
  avgLoadKW?: number;                // average load
  energyKWhPerDay?: number;          // daily energy
  dutyCycle?: number;                // duty cycle (0-1)
  contributors?: Record<string, number>; // kW contributors breakdown
}

/** Step 3 → pricing bridge: System sizing */
export interface MemorySizing {
  bessKWh: number;
  bessKW: number;
  durationHours: number;
  solarKW?: number;
  generatorKW?: number;
  windKW?: number;
}

/** Step 4 output: Add-on selections */
export interface MemoryAddOns {
  includeSolar: boolean;
  solarKW: number;
  includeGenerator: boolean;
  generatorKW: number;
  generatorFuelType?: string;
  includeWind: boolean;
  windKW: number;
  updatedAt: number;
}

/** Step 5/6 output: Quote result */
export interface MemoryQuote {
  peakLoadKW?: number;
  bessKWh?: number;
  bessMW?: number;
  capexUSD?: number;
  totalCost?: number;
  netCost?: number;
  annualSavingsUSD?: number;
  annualSavings?: number;
  paybackYears?: number;
  roiPercent?: number;
  npv?: number;
  irr?: number;
  tier?: "starter" | "recommended" | "beast";  // MagicFit selection
  generatedAt: number;
}

/** All memory slots — the complete "brain" of the wizard */
export interface MerlinMemorySlots {
  location: MemoryLocation;
  goals: MemoryGoals;
  industry: MemoryIndustry;
  business: MemoryBusiness;
  profile: MemoryProfile;
  sizing: MemorySizing;
  addOns: MemoryAddOns;
  quote: MemoryQuote;
}

export type MemorySlotKey = keyof MerlinMemorySlots;

// ============================================================================
// MEMORY STORE (Singleton)
// ============================================================================

type Listener<K extends MemorySlotKey> = (value: MerlinMemorySlots[K] | null) => void;
type AnyListener = (key: MemorySlotKey) => void;

const SESSION_STORAGE_KEY = "merlin_memory_v7";

// Lazy-loaded validator (avoids circular dependency at module init)
let _validatorMod: typeof import("./truequoteValidator") | null = null;
let _validatorLoading = false;

function getValidator() {
  if (!_validatorMod && !_validatorLoading) {
    _validatorLoading = true;
    import("./truequoteValidator").then(mod => {
      _validatorMod = mod;
    }).catch(() => { /* non-fatal */ });
  }
  return _validatorMod;
}

class MerlinMemoryStore {
  private slots: Partial<MerlinMemorySlots> = {};
  private listeners: { [K in MemorySlotKey]?: Set<Listener<K>> } = {};
  private globalListeners = new Set<AnyListener>();
  private sessionId: string;
  private _lastReport: import("./truequoteValidator").TrueQuoteReport | null = null;

  constructor() {
    this.sessionId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.hydrate();
  }

  /** Get the last TrueQuote validation report */
  get lastReport() { return this._lastReport; }

  // ── READ ──────────────────────────────────────────────────────────────────

  /** Get a memory slot value (or null if not set) */
  get<K extends MemorySlotKey>(key: K): MerlinMemorySlots[K] | null {
    return (this.slots[key] as MerlinMemorySlots[K]) ?? null;
  }

  /** Check if a memory slot has been written */
  has(key: MemorySlotKey): boolean {
    return key in this.slots && this.slots[key] != null;
  }

  /** Get all populated slots (for debugging / export) */
  snapshot(): Partial<MerlinMemorySlots> {
    return { ...this.slots };
  }

  // ── WRITE ─────────────────────────────────────────────────────────────────

  /** Write a value to a memory slot. Notifies subscribers. Runs TrueQuote™ validation. */
  set<K extends MemorySlotKey>(key: K, value: MerlinMemorySlots[K]): void {
    this.slots[key] = value;
    this.persist();
    this.notify(key);

    // ── TrueQuote™ Continuous Validation ────────────────────────────────
    this.runValidation(key, value);

    if (import.meta.env.DEV) {
      console.log(`[MerlinMemory] 💾 ${key} =`, value);
    }
  }

  /** Run TrueQuote™ validation on a slot write */
  private runValidation<K extends MemorySlotKey>(key: K, value: MerlinMemorySlots[K]): void {
    try {
      const mod = getValidator();
      if (!mod) return; // Validator not loaded yet (first write)

      // Quick per-slot validation
      const violations = mod.validateSlot(key, value, this.slots);

      // Full report (for checksum + compliance badge)
      this._lastReport = mod.validateMemory(this.slots, this.sessionId);

      // Log violations in dev mode
      if (import.meta.env.DEV && violations.length > 0) {
        const errors = violations.filter(v => v.severity === "error");
        const warnings = violations.filter(v => v.severity === "warning");
        if (errors.length > 0) {
          console.warn(`[TrueQuote™] 🔴 ${errors.length} error(s) on ${key}:\n${mod.formatViolations(violations)}`);
        } else if (warnings.length > 0) {
          console.info(`[TrueQuote™] 🟡 ${warnings.length} warning(s) on ${key}:\n${mod.formatViolations(violations)}`);
        }
      }
    } catch {
      // Validation should never crash the wizard
    }
  }

  /** Merge partial data into an existing slot (shallow merge) */
  patch<K extends MemorySlotKey>(key: K, patch: Partial<MerlinMemorySlots[K]>): void {
    const current = this.slots[key] ?? ({} as MerlinMemorySlots[K]);
    this.slots[key] = { ...current, ...patch } as MerlinMemorySlots[K];
    this.persist();
    this.notify(key);

    if (import.meta.env.DEV) {
      console.log(`[MerlinMemory] 📝 ${key} patched:`, patch);
    }
  }

  /** Clear a single slot */
  clear(key: MemorySlotKey): void {
    delete this.slots[key];
    this.persist();
    this.notify(key);

    if (import.meta.env.DEV) {
      console.log(`[MerlinMemory] 🗑️ ${key} cleared`);
    }
  }

  /** Reset ALL memory (new session) */
  reset(): void {
    const keys = Object.keys(this.slots) as MemorySlotKey[];
    this.slots = {};
    this.sessionId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.persist();

    // Notify all cleared slots
    for (const key of keys) {
      this.notify(key);
    }
    for (const listener of this.globalListeners) {
      listener("location"); // signal global reset
    }

    if (import.meta.env.DEV) {
      console.log("[MerlinMemory] 🔄 Full reset");
    }
  }

  // ── SUBSCRIBE ─────────────────────────────────────────────────────────────

  /** Subscribe to changes on a specific slot. Returns unsubscribe function. */
  subscribe<K extends MemorySlotKey>(key: K, listener: Listener<K>): () => void {
    if (!this.listeners[key]) {
      (this.listeners as Record<string, Set<Listener<K>>>)[key] = new Set();
    }
    (this.listeners[key] as Set<Listener<K>>).add(listener);

    return () => {
      (this.listeners[key] as Set<Listener<K>>)?.delete(listener);
    };
  }

  /** Subscribe to ANY slot change. Returns unsubscribe function. */
  subscribeAll(listener: AnyListener): () => void {
    this.globalListeners.add(listener);
    return () => {
      this.globalListeners.delete(listener);
    };
  }

  // ── SESSION ID ────────────────────────────────────────────────────────────

  getSessionId(): string {
    return this.sessionId;
  }

  /** Run full TrueQuote™ validation on all slots. Returns report. */
  validate(): import("./truequoteValidator").TrueQuoteReport | null {
    try {
      const mod = getValidator();
      if (!mod) return null;
      this._lastReport = mod.validateMemory(this.slots, this.sessionId);
      return this._lastReport;
    } catch {
      return null;
    }
  }

  /** Get the current memory checksum (null if never validated) */
  get checksum(): string | null {
    return this._lastReport?.checksum ?? null;
  }

  // ── INTERNAL ──────────────────────────────────────────────────────────────

  private notify<K extends MemorySlotKey>(key: K): void {
    const slotListeners = this.listeners[key] as Set<Listener<K>> | undefined;
    if (slotListeners) {
      const value = this.get(key);
      for (const listener of slotListeners) {
        try {
          listener(value);
        } catch (err) {
          console.error(`[MerlinMemory] Listener error on ${key}:`, err);
        }
      }
    }

    for (const listener of this.globalListeners) {
      try {
        listener(key);
      } catch (err) {
        console.error("[MerlinMemory] Global listener error:", err);
      }
    }
  }

  private persist(): void {
    try {
      const data = JSON.stringify({
        sessionId: this.sessionId,
        slots: this.slots,
        savedAt: Date.now(),
      });
      sessionStorage.setItem(SESSION_STORAGE_KEY, data);
    } catch {
      // sessionStorage full or unavailable — non-fatal
    }
  }

  private hydrate(): void {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.slots && typeof parsed.slots === "object") {
        this.slots = parsed.slots;
        this.sessionId = parsed.sessionId ?? this.sessionId;
        if (import.meta.env.DEV) {
          const slotKeys = Object.keys(this.slots);
          console.log(`[MerlinMemory] 🔮 Hydrated ${slotKeys.length} slots:`, slotKeys);
        }
      }
    } catch {
      // Corrupted storage — start fresh
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/** Global singleton — the wizard's persistent brain */
export const merlinMemory = new MerlinMemoryStore();

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/** Check if Step 1 is complete (location + goals saved) */
export function isStep1Complete(): boolean {
  return merlinMemory.has("location") && merlinMemory.has("goals");
}

/** Check if Step 2 is complete (industry selected) */
export function isStep2Complete(): boolean {
  return merlinMemory.has("industry");
}

/** Check if Step 3 is complete (profile with valid peak load) */
export function isStep3Complete(): boolean {
  const profile = merlinMemory.get("profile");
  return profile != null && profile.peakLoadKW > 0;
}

/** Get the effective electricity rate (from location intel or fallback) */
export function getEffectiveRate(): number {
  return merlinMemory.get("location")?.utilityRate ?? 0.12;
}

/** Get effective demand charge */
export function getEffectiveDemandCharge(): number {
  return merlinMemory.get("location")?.demandCharge ?? 15;
}
