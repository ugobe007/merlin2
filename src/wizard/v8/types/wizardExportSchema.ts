/**
 * WIZARD STATE EXPORT SCHEMA — V8 → Quote Builder Integration Contract
 *
 * Purpose:
 *   Defines the canonical shape and validation rules for wizard state export.
 *   Used by:
 *   1. wizard completion → quote builder handoff
 *   2. state serialization → URL/localStorage/API
 *   3. analytics event tracking → drop-off attribution
 *   4. customer dashboard → historical reference
 *
 * Principles:
 * ✓ Immutable contract — never rename/remove fields without migration
 * ✓ Semantic versioning — bump version if contract breaks
 * ✓ Nullable where uncertain — prefer null over default values
 * ✓ Provenance metadata — track data source and confidence
 * ✓ Validated on export — early error detection before transmission
 *
 * Version History:
 *   v1.0.0 (May 27, 2026) — Initial Phase 4 schema, includes energy stack profile
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION SCHEMAS (Runtime-safe)
// ─────────────────────────────────────────────────────────────────────────────

const LocationSchema = z.object({
  zip: z.string().min(3, "ZIP must be at least 3 chars"),
  city: z.string(),
  state: z.string().length(2),
  formattedAddress: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  country: z.enum(["US", "CA", "MX", "OTHER"]).default("US"),
});

const BusinessSchema = z.object({
  name: z.string().min(1, "Business name required"),
  address: z.string().optional(),
  formattedAddress: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string(),
  confidence: z.number().min(0).max(1),
});

const IntelSchema = z.object({
  utilityRate: z.number().min(0, "Utility rate must be >= 0"),
  demandCharge: z.number().min(0, "Demand charge must be >= 0"),
  utilityProvider: z.string().optional(),
  peakSunHours: z.number().min(0),
  solarGrade: z.enum(["A", "A-", "B+", "B", "B-", "C+", "C", "D"]),
  solarFeasible: z.boolean(),
  weatherProfile: z.string().optional(),
  avgTempF: z.number().optional(),
});

const ProfileInputSchema = z.object({
  baseLoadKW: z.number().min(0),
  peakLoadKW: z.number().min(0),
  criticalLoadPercent: z.number().min(0).max(100),
  roofAreaSqFt: z.number().min(0).optional(),
  generatorFuelType: z.enum(["none", "diesel", "ng", "dual-fuel"]).default("none"),
  evChargers: z
    .object({
      level2: z.number().min(0).default(0),
      dcfc50kw: z.number().min(0).default(0),
      hpc350kw: z.number().min(0).default(0),
    })
    .optional(),
});

const StackGoalSchema = z.object({
  bias: z.enum(["save_more", "save_most", "full_power"]),
  priorityGoal: z.string().optional(),
  capexBudget: z.number().min(0).optional(),
  paybackYearsTarget: z.number().min(1).max(30).optional(),
});

const TierSchema = z.object({
  label: z.enum(["Starter", "Recommended", "Complete"]),
  bessKW: z.number().min(0),
  bessKWh: z.number().min(0),
  solarKW: z.number().min(0),
  generatorKW: z.number().min(0),
  projectCostNet: z.number().min(0),
  annualSavings: z.number().min(0),
  paybackYears: z.number().min(0),
  npv: z.number(),
  irr: z.number(),
});

const EnergyStackProfileSchema = z.object({
  stackVariant: z.enum(["A", "B", "C", "D", "E", "F"]).optional(),
  selectedTier: z.enum(["Starter", "Recommended", "Complete"]).optional(),
  tiers: z.array(TierSchema),
  costStability: z.number().min(0).max(100).optional(),
  gridDependence: z.number().min(0).max(100).optional(),
  outrageResilience: z.number().min(0).max(100).optional(),
  peakExposure: z.number().min(0).max(100).optional(),
  roiEfficiency: z.number().min(0).max(100).optional(),
});

export const WizardExportSchema = z.object({
  // ─ Metadata ─────────────────────────────────────────────────────────────
  version: z.literal("1.0.0"),
  exportedAt: z.string().datetime(),
  sessionId: z.string().uuid(),
  wizardId: z.string().optional(),

  // ─ User Journey ─────────────────────────────────────────────────────────
  completedAt: z.string().datetime().optional(),
  stepsDuration: z.record(z.number()).optional(), // step → ms duration
  droppedAtStep: z.number().optional(), // if not completed
  completionPercent: z.number().min(0).max(100),

  // ─ Core Inputs ──────────────────────────────────────────────────────────
  location: LocationSchema,
  business: BusinessSchema.optional(),
  intel: IntelSchema,
  profileInputs: ProfileInputSchema,
  stackGoal: StackGoalSchema,

  // ─ Energy Stack Outcome ────────────────────────────────────────────────
  energyStack: EnergyStackProfileSchema.optional(),

  // ─ Audit Trail ──────────────────────────────────────────────────────────
  /** Data provenance: track which fields came from auto-detect vs. user input */
  provenance: z.record(z.enum(["user_input", "auto_detect", "fallback", "calculated"])).optional(),

  /** Warnings/info about solar exclusion, source limitations, etc. */
  auditNotes: z.array(z.string()).optional(),

  // ─ Next Hop ────────────────────────────────────────────────────────────
  /** QuoteBuilder will consume these to pre-fill configuration */
  suggestedQuoteMode: z.enum(["quick_quote", "advanced_config", "professional_model"]).optional(),
  suggestedAddOns: z.array(z.string()).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TYPESCRIPT TYPES (Inferred from schemas)
// ─────────────────────────────────────────────────────────────────────────────

export type Location = z.infer<typeof LocationSchema>;
export type Business = z.infer<typeof BusinessSchema>;
export type LocationIntel = z.infer<typeof IntelSchema>;
export type ProfileInputs = z.infer<typeof ProfileInputSchema>;
export type StackGoal = z.infer<typeof StackGoalSchema>;
export type Tier = z.infer<typeof TierSchema>;
export type EnergyStackProfile = z.infer<typeof EnergyStackProfileSchema>;
export type WizardExport = z.infer<typeof WizardExportSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION & EXPORT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely export wizard state to a validated, serializable object.
 * Catches validation errors early — returns error details for logging/alerts.
 */
export function exportWizardState(state: unknown): {
  success: boolean;
  data?: WizardExport;
  errors?: z.ZodError;
} {
  try {
    const validated = WizardExportSchema.parse(state);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Wizard state export validation failed:", error.flatten());
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Generate a minimal export for quick-quote or demo mode.
 * Excludes optional fields that may not be available mid-flow.
 */
export function exportWizardStatePartial(state: Partial<WizardExport>): WizardExport {
  return WizardExportSchema.parse({
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    sessionId: crypto.randomUUID?.() || `temp-${Date.now()}`,
    completionPercent: 0,
    ...state,
  });
}

/**
 * Compatibility check: verify exported state can feed into quote builder.
 */
export function canQuoteBuilderConsume(exported: WizardExport): {
  canConsume: boolean;
  missingFields: string[];
} {
  const required = [
    "location.zip",
    "intel.utilityRate",
    "profileInputs.baseLoadKW",
    "stackGoal.bias",
  ];

  const missingFields = required.filter((field) => {
    const [root, key] = field.split(".");
    const val = (exported as unknown as Record<string, Record<string, unknown>>)[root]?.[key];
    return val === undefined || val === null;
  });

  return {
    canConsume: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Generate a stable hash of export state for caching/deduplication.
 */
export function hashWizardExport(exported: WizardExport): string {
  const canonical = JSON.stringify({
    location: exported.location,
    business: exported.business?.name,
    intel: {
      rate: exported.intel.utilityRate,
      dc: exported.intel.demandCharge,
    },
    profile: {
      base: exported.profileInputs.baseLoadKW,
      peak: exported.profileInputs.peakLoadKW,
    },
    goal: exported.stackGoal.bias,
  });

  // Simple FNV-1a hash for deterministic cache key
  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash).toString(16);
}
