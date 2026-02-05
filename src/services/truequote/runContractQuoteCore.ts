/* eslint-disable no-console */

/**
 * Pure Layer A Contract Quote Runner
 * 
 * Deterministic, no React hooks, can run in Node scripts.
 * Extracts the core TrueQuote Layer A logic from useWizardV7.
 */

import { getTemplate } from "@/wizard/v7/templates/templateIndex";
import { CALCULATORS_BY_ID } from "@/wizard/v7/calculators/registry";
import { applyTemplateMapping } from "@/wizard/v7/templates/mappingEngine";
import { getSizingDefaults } from "@/wizard/v7/pricing/sizingDefaults";

export type WizardIndustry = string;

export type ContractQuoteArgs = {
  industry: WizardIndustry;
  answers: Record<string, unknown>;
  // optional: pass location/intel if you already have it
  locationZip?: string;
  locationState?: string;
};

export type LoadProfile = {
  baseLoadKW: number;
  peakLoadKW: number;
  energyKWhPerDay: number;
};

export type ContractQuoteComputed = {
  dutyCycle?: number;
  kWContributors?: Record<string, number>;
  assumptions?: string[];
  warnings?: string[];
};

export type ContractQuoteResult = {
  industry: WizardIndustry;
  template: { industry: string; version?: string; calculator?: string };
  inputsUsed: Record<string, unknown>;
  loadProfile: LoadProfile;
  sizingHints?: Record<string, unknown>;
  computed: ContractQuoteComputed;
  warnings: string[];
  missingInputs?: string[];
  inputFallbacks?: Record<string, { value: unknown; reason: string }>;
  isProvisional?: boolean;
};

export type TrueQuoteTraceBundle = {
  ts: string;
  layer: "A";
  template: ContractQuoteResult["template"];
  inputsUsed: ContractQuoteResult["inputsUsed"];
  loadProfile: ContractQuoteResult["loadProfile"];
  computed: ContractQuoteResult["computed"];
  sizingHints: ContractQuoteResult["sizingHints"];
  warnings: string[];
  missingInputs?: string[];
  inputFallbacks?: ContractQuoteResult["inputFallbacks"];
};

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function runContractQuoteCore(args: ContractQuoteArgs): ContractQuoteResult {
  const tpl = getTemplate(args.industry);
  
  if (!tpl) {
    return {
      industry: args.industry,
      template: { industry: String(args.industry), version: undefined, calculator: undefined },
      inputsUsed: {},
      loadProfile: { baseLoadKW: 0, peakLoadKW: 0, energyKWhPerDay: 0 },
      computed: {},
      warnings: [`⚠️ Missing template for industry "${args.industry}"`],
      isProvisional: true,
    };
  }

  const calculatorId = tpl.calculator.id;
  const calc = CALCULATORS_BY_ID[calculatorId];

  if (!calc) {
    return {
      industry: args.industry,
      template: { industry: tpl.industry, version: tpl.version, calculator: calculatorId },
      inputsUsed: {},
      loadProfile: { baseLoadKW: 0, peakLoadKW: 0, energyKWhPerDay: 0 },
      computed: {},
      warnings: [`⚠️ Missing calculator for id "${calculatorId}"`],
      isProvisional: true,
    };
  }

  const warnings: string[] = [];

  // Apply template mapping (answers → canonical calculator inputs)
  const inputs = applyTemplateMapping(tpl, args.answers);

  // Run calculator
  const computed = calc.compute(inputs as any);

  // Extract load profile
  const loadProfile: LoadProfile = {
    baseLoadKW: computed.baseLoadKW ?? 0,
    peakLoadKW: computed.peakLoadKW ?? 0,
    energyKWhPerDay: computed.energyKWhPerDay ?? 0,
  };

  // --- HARD invariants (these should never be violated) ---
  if (num(loadProfile.peakLoadKW) <= 0) warnings.push("⚠️ Peak load is ZERO/NEGATIVE");
  if (num(loadProfile.baseLoadKW) < 0) warnings.push("⚠️ Base load is NEGATIVE");
  if (num(loadProfile.energyKWhPerDay) < 0) warnings.push("⚠️ Energy/day is NEGATIVE");
  if (num(loadProfile.peakLoadKW) < num(loadProfile.baseLoadKW)) warnings.push("⚠️ Peak < Base (impossible)");
  if (num(loadProfile.energyKWhPerDay) > num(loadProfile.peakLoadKW) * 24 * 1.05) {
    warnings.push("⚠️ Energy > peak×24h (impossible)");
  }

  // Duty cycle sanity
  const dc = computed?.dutyCycle;
  if (typeof dc === "number" && (dc < 0 || dc > 1.25)) {
    warnings.push("⚠️ Duty cycle out of range [0, 1.25]");
  }

  // Contributor sanity (no negatives, no NaN)
  const contrib = computed?.kWContributors ?? {};
  for (const [k, v] of Object.entries(contrib)) {
    const n = num(v, NaN);
    if (!Number.isFinite(n)) warnings.push(`⚠️ kWContributors["${k}"] is NaN/invalid`);
    if (Number.isFinite(n) && n < 0) warnings.push(`⚠️ kWContributors["${k}"] is negative`);
  }

  // Get sizing hints (industry-specific defaults)
  const sizingDefaults = getSizingDefaults(tpl.industry);
  const sizingHints = {
    storageToPeakRatio: sizingDefaults.ratio,
    durationHours: sizingDefaults.hours,
    source: `industry:${tpl.industry}`,
  };

  // Collect inputs used for audit trail
  const inputsUsed = {
    electricityRate: (inputs as any)?.electricityRate ?? 0.12,
    demandCharge: (inputs as any)?.demandCharge ?? 15,
    location: args.locationState ?? "unknown",
    industry: tpl.industry,
    gridMode: (inputs as any)?.gridMode ?? "grid_tied",
    ...inputs, // Include all mapped inputs for full transparency
  };

  // Detect input fallbacks
  const inputFallbacks: Record<string, { value: unknown; reason: string }> = {};
  if (inputsUsed.electricityRate === 0.12) {
    inputFallbacks.electricityRate = { value: 0.12, reason: "default rate (no location intel)" };
  }
  if (inputsUsed.demandCharge === 15) {
    inputFallbacks.demandCharge = { value: 15, reason: "default demand charge" };
  }
  if (inputsUsed.location === "unknown") {
    inputFallbacks.location = { value: "unknown", reason: "no state provided" };
  }

  // Detect missing inputs from calculator warnings
  const missingInputs = computed.warnings
    ?.filter((w: string) => w.toLowerCase().includes("missing"))
    .map((w: string) => w.split(":")[0].trim()) ?? [];

  // Provisional heuristics
  const isProvisional = Boolean(
    missingInputs.length || 
    Object.keys(inputFallbacks).length || 
    warnings.some(w => w.startsWith("⚠️"))
  );

  // Merge warnings from calculator
  if (computed.warnings && computed.warnings.length > 0) {
    warnings.push(...computed.warnings.map((w: string) => `⚠️ ${w}`));
  }

  // DEV trace (mirrors useWizardV7 console logging)
  if (process.env.NODE_ENV === "development") {
    console.group(`[TrueQuote] Load Profile Consistency: ${tpl.industry}`);
    console.log("Template:", { industry: tpl.industry, version: tpl.version, calculator: calculatorId });
    console.log("Inputs Used:", inputsUsed);
    console.log("Load Profile:", loadProfile);
    console.log("Duty Cycle:", computed?.dutyCycle ?? "not provided");
    console.log("kW Contributors:", computed?.kWContributors ?? "not provided");
    if (warnings.length) console.warn("Warnings:", warnings);
    console.groupEnd();
  }

  return {
    industry: args.industry,
    template: { industry: tpl.industry, version: tpl.version, calculator: calculatorId },
    inputsUsed,
    loadProfile,
    sizingHints,
    computed: {
      dutyCycle: computed.dutyCycle,
      kWContributors: computed.kWContributors,
      assumptions: computed.assumptions,
      warnings: computed.warnings,
    },
    warnings,
    missingInputs,
    inputFallbacks,
    isProvisional,
  };
}

export function makeLayerATrace(result: ContractQuoteResult): TrueQuoteTraceBundle {
  return {
    ts: new Date().toISOString(),
    layer: "A",
    template: result.template,
    inputsUsed: result.inputsUsed,
    loadProfile: result.loadProfile,
    computed: result.computed,
    sizingHints: result.sizingHints,
    warnings: result.warnings,
    missingInputs: result.missingInputs,
    inputFallbacks: result.inputFallbacks,
  };
}
