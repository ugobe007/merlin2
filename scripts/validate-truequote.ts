#!/usr/bin/env tsx
/* eslint-disable no-console */

/**
 * TrueQuote Validation Harness
 * 
 * Runs Layer A (contract quote) + Layer B (pricing) across industries
 * with fixture answers to catch Step 3 config mismatches.
 * 
 * Outputs: truequote-validation-report.json
 * 
 * Usage:
 *   npm run truequote:validate           # Dev mode (warnings only)
 *   TRUEQUOTE_STRICT=1 npm run ...       # CI mode (fail on defaults)
 */

import fs from "node:fs";
import path from "node:path";

import { runContractQuoteCore, makeLayerATrace } from "../src/services/truequote/runContractQuoteCore";
import { runPricingQuoteCore } from "../src/services/truequote/runPricingQuoteCore";

// ============================================================
// Configuration
// ============================================================

/** Templates not yet implemented (SKIP instead of FAIL) */
const EXPECTED_MISSING_TEMPLATES = new Set([
  "ev_charging", // Remove when EV template is implemented
]);

/**
 * VALIDATION_REQUIRED: Industries that MUST emit validation envelopes.
 * Add to this set as calculators are migrated to v1 contract.
 * 
 * CI STRICT mode: Only industries in this set are required to pass validation.
 * Others: WARN on missing validation, but don't fail CI.
 * 
 * Phase 6: Gradual migration policy - prevents blocking unrelated PRs.
 */
const VALIDATION_REQUIRED = new Set<string>([
  "CAR_WASH_LOAD_V1_SSOT", // ✅ Migrated Jan 2026
  // Add here as you migrate:
  // "HOTEL_LOAD_V1_SSOT",
  // "DATA_CENTER_LOAD_V1_SSOT",
  // "EV_CHARGING_LOAD_V1_SSOT",
]);

/**
 * SUM_TOLERANCE: Per-industry error thresholds for sum consistency checks.
 * 
 * warn: % error threshold for warnings (non-blocking)
 * fail: % error threshold for hard failures (blocks Layer B)
 * 
 * Industries with tighter physics models should have tighter tolerances.
 * Data center: PUE + IT load well-defined → tighter tolerance
 */
const SUM_TOLERANCE: Record<string, { warn: number; fail: number }> = {
  default: { warn: 0.15, fail: 0.25 },        // 15% warn, 25% hard fail
  data_center: { warn: 0.10, fail: 0.15 },    // Tighter (PUE + IT load)
  ev_charging: { warn: 0.15, fail: 0.25 },    // Standard
  car_wash: { warn: 0.15, fail: 0.25 },       // Standard
};

/**
 * Get tolerance policy for an industry.
 */
function getTolerance(industry: string): { warn: number; fail: number } {
  return SUM_TOLERANCE[industry] ?? SUM_TOLERANCE.default;
}

/**
 * Explicit Status Taxonomy (Feb 5, 2026)
 * 
 * Prevents silent semantics drift as more engineers touch the harness.
 * 
 * PASS: All checks passed, validation complete
 * PASS_WARN: Passed but with warnings (not yet migrated, using defaults)
 * FAIL: Hard failure (validation required but missing/broken, invariant violation)
 * SKIP: Expected missing template (in EXPECTED_MISSING_TEMPLATES)
 * CRASH: Harness error (template load failed, calculator threw exception)
 */
type ValidationStatus = "PASS" | "PASS_WARN" | "FAIL" | "SKIP" | "CRASH";

/**
 * Determine final status based on harness state
 */
function determineStatus(params: {
  hasTemplate: boolean;
  hasValidation: boolean;
  isValidationRequired: boolean;
  hasHardFailure: boolean;
  hasWarnings: boolean;
  industry: string;
}): ValidationStatus {
  const { hasTemplate, hasValidation, isValidationRequired, hasHardFailure, hasWarnings, industry } = params;

  // SKIP: Template missing and expected
  if (!hasTemplate && EXPECTED_MISSING_TEMPLATES.has(industry)) {
    return "SKIP";
  }

  // FAIL: Template missing and STRICT mode (unexpected gap)
  if (!hasTemplate && STRICT) {
    return "FAIL";
  }

  // CRASH: Treat unexpected missing template as crash in non-STRICT
  if (!hasTemplate) {
    return "CRASH";
  }

  // FAIL: Hard failure (missing validation when required, invariant violation)
  if (hasHardFailure) {
    return "FAIL";
  }

  // PASS_WARN: Not yet migrated (no validation envelope) or has soft warnings
  if (!hasValidation || hasWarnings) {
    return "PASS_WARN";
  }

  // PASS: Clean pass
  return "PASS";
}

/** CI strict mode: fail on defaulted inputs */
const STRICT_MODE = process.env.TRUEQUOTE_STRICT === "1";

// ============================================================
// Industry-Specific Invariants
// ============================================================

type TraceBundle = ReturnType<typeof makeLayerATrace>;

type Invariant = {
  id: string;
  description: string;
  check: (trace: TraceBundle) => string | null; // return error msg or null
};

const INVARIANTS_BY_INDUSTRY: Record<string, Invariant[]> = {
  car_wash: [
    {
      id: "cw_process_share_band",
      description: "Process loads (dryers+pumps+vacuums) share of peak load within expected band (80-95%)",
      check: (t) => {
        const peak = t.loadProfile?.peakLoadKW ?? 0;
        const process = t.computed?.kWContributors?.process ?? 0;
        if (peak <= 0) return null; // already caught by global invariants
        const share = process / peak;
        if (share < 0.80 || share > 0.95) {
          return `Process share ${(share * 100).toFixed(1)}% out of band (80-95%). process=${process.toFixed(1)}kW, peak=${peak.toFixed(1)}kW`;
        }
        return null;
      },
    },
  ],
  hotel: [
    {
      id: "hotel_base_load_physics",
      description: "Hotel base load should be a substantial fraction of peak (35-80%)",
      check: (t) => {
        const peak = t.loadProfile?.peakLoadKW ?? 0;
        const base = t.loadProfile?.baseLoadKW ?? 0;
        if (peak <= 0) return null;

        const ratio = base / peak;
        if (ratio < 0.35 || ratio > 0.80) {
          return `Base/Peak ratio ${(ratio * 100).toFixed(0)}% outside 35-80% band. base=${base.toFixed(1)}kW, peak=${peak.toFixed(1)}kW`;
        }
        return null;
      },
    },
    {
      id: "hotel_hvac_scales_with_rooms",
      description: "HVAC share should be plausible (30-60% of peak, class-aware)",
      check: (t) => {
        const peak = t.loadProfile?.peakLoadKW ?? 0;
        if (peak <= 0) return null;

        const contrib = t.computed?.kWContributors;
        const hvac = contrib?.hvac ?? 0;
        const share = hvac / peak;

        if (share < 0.30 || share > 0.60) {
          return `HVAC share ${(share * 100).toFixed(0)}% outside 30-60% band. hvac=${hvac.toFixed(1)}kW, peak=${peak.toFixed(1)}kW`;
        }
        return null;
      },
    },
    {
      id: "hotel_process_share_band",
      description: "Process loads (kitchen+laundry+pool) should be 15-35% of peak",
      check: (t) => {
        const peak = t.loadProfile?.peakLoadKW ?? 0;
        if (peak <= 0) return null;

        const contrib = t.computed?.kWContributors;
        const process = contrib?.process ?? 0;
        const share = process / peak;

        if (share < 0.15 || share > 0.35) {
          return `Process share ${(share * 100).toFixed(0)}% outside 15-35% band. process=${process.toFixed(1)}kW, peak=${peak.toFixed(1)}kW`;
        }
        return null;
      },
    },
  ],
  data_center: [
    {
      id: "dc_pue_affects_energy",
      description: "PUE properly affects total energy vs IT load",
      check: (t) => {
        const pue = t.inputsUsed?.pue ?? 1.5;
        const itLoad = t.computed?.kWContributors?.itLoad ?? 0;
        const totalPeak = t.loadProfile?.peakLoadKW ?? 0;
        if (itLoad <= 0 || totalPeak <= 0) return null;
        const observedPUE = totalPeak / itLoad;
        // Allow 10% tolerance
        const tolerance = 0.10;
        if (Math.abs(observedPUE - pue) / pue > tolerance) {
          return `Observed PUE ${observedPUE.toFixed(2)} doesn't match input PUE ${pue.toFixed(2)} (tolerance: ${(tolerance * 100).toFixed(0)}%). itLoad=${itLoad.toFixed(1)}kW, total=${totalPeak.toFixed(1)}kW`;
        }
        return null;
      },
    },
  ],
};

// ============================================================
// Universal Invariants (Applied to ALL Industries)
// ============================================================

/**
 * Universal invariants catch nonsense-mix bugs from bad heuristics.
 * These checks apply to ALL industries after industry-specific invariants.
 * 
 * Skip threshold: Only run when peak >= 50 kW to avoid false positives on tiny facilities.
 */
const UNIVERSAL_INVARIANTS: Invariant[] = [
  {
    id: "nonsense_mix_all_tiny",
    description: "Suspicious mix: no single contributor exceeds 10% (peak>=50kW)",
    check: (t) => {
      const peak = t.loadProfile?.peakLoadKW ?? 0;
      if (peak < 50) return null;

      const contrib = t.computed?.kWContributors ?? {};
      const values = Object.values(contrib).filter((v) => typeof v === "number" && v > 0);
      if (values.length === 0) return null;

      const maxKW = Math.max(...values);
      const maxShare = maxKW / peak;

      if (maxShare < 0.10) {
        return `Suspicious: max contributor ${(maxShare * 100).toFixed(0)}% (<10%). peak=${peak.toFixed(1)}kW, max=${maxKW.toFixed(1)}kW`;
      }
      return null;
    },
  },
  {
    id: "nonsense_mix_smeared_equally",
    description: "Suspicious mix: 4+ contributors but none exceeds 20% (peak>=50kW)",
    check: (t) => {
      const peak = t.loadProfile?.peakLoadKW ?? 0;
      if (peak < 50) return null;

      const contrib = t.computed?.kWContributors ?? {};
      const values = Object.values(contrib).filter((v) => typeof v === "number" && v > 0);
      const nonZeroCount = values.length;
      if (nonZeroCount < 4) return null;

      const maxKW = Math.max(...values);
      const maxShare = maxKW / peak;

      if (maxShare < 0.20) {
        return `Suspicious: ${nonZeroCount} contributors but max ${(maxShare * 100).toFixed(0)}% (<20%). peak=${peak.toFixed(1)}kW`;
      }
      return null;
    },
  },
];

// ============================================================
// Fixtures
// ============================================================

// Minimal fixture answers per industry (expand as needed)
const FIXTURES: Record<string, Record<string, any>> = {
  car_wash: {
    facilityType: "tunnel",
    tunnelOrBayCount: 1,
    operatingHours: { start: "08:00", end: "18:00" },
    daysPerWeek: 7,
    dailyVehicles: 150,
    waterHeaterType: "gas",
    dryerConfiguration: { type: "standard", count: 6 },
    pumpConfiguration: { type: "high_pressure", count: 4 },
    electricityRate: 0.15,
    demandCharge: 20,
  },
  hotel: {
    rooms: 120,
    occupancyRate: 0.75,
    operatingHours: 24,
    daysPerWeek: 7,
    hotelClass: "midscale",
    amenities: ["pool", "restaurant"],
    electricityRate: 0.14,
    demandCharge: 18,
  },
  ev_charging: {
    level2Chargers: 12,
    level2PowerKW: 11,
    dcfcChargers: 8,
    dcfcPowerKW: 150,
    operatingHours: 24,
    daysPerWeek: 7,
    utilizationRate: 0.6,
    electricityRate: 0.12,
    demandCharge: 15,
  },
  data_center: {
    rackCount: 50,
    kWPerRack: 8,
    pue: 1.5,
    redundancy: "2n",
    operatingHours: 24,
    daysPerWeek: 7,
    electricityRate: 0.10,
    demandCharge: 25,
  },
};

const INDUSTRIES = Object.keys(FIXTURES);

type ReportRow = {
  industry: string;
  status: "pass" | "fail" | "skip";
  layerA?: ReturnType<typeof makeLayerATrace>;
  layerB?: any;
  warnings: string[];
  skipReason?: string;
};

// ============================================================
// Main Harness
// ============================================================

(async () => {
  console.log("\n[TrueQuote] Starting validation harness...");
  console.log(`[TrueQuote] Mode: ${STRICT_MODE ? "STRICT (CI)" : "DEV"}\n`);

  const rows: ReportRow[] = [];
  const scoreboard: string[] = [];

  for (const industry of INDUSTRIES) {
    const answers = FIXTURES[industry];

    // Check for expected missing templates
    if (EXPECTED_MISSING_TEMPLATES.has(industry)) {
      rows.push({
        industry,
        status: "skip",
        warnings: [],
        skipReason: "missing template (expected)",
      });
      scoreboard.push(`${industry.padEnd(15)} SKIP    missing template (expected)`);
      continue;
    }

    let layerA: TraceBundle | undefined;
    let layerB: any = undefined;
    const warnings: string[] = [];
    let status: "pass" | "fail" = "pass";

    try {
      // Run Layer A (contract quote)
      const a = runContractQuoteCore({ 
        industry, 
        answers, 
        locationZip: "89052",
        locationState: "NV",
      });
      layerA = makeLayerATrace(a);
      warnings.push(...(a.warnings ?? []));

      // ============================================================
      // VALIDATION CONTRACT CHECK (with allowlist gating)
      // ============================================================
      
      const validationVersion = layerA.computed?.version;
      const hasValidation = !!validationVersion;
      
      // ✅ Check calculator ID from template (not industry string - future-proof)
      const calculatorId = layerA.template?.calculator?.id || "UNKNOWN";
      const isValidationRequired = VALIDATION_REQUIRED.has(calculatorId);
      
      // Version mismatch check (only for industries with validation)
      if (hasValidation && validationVersion !== "v1") {
        status = "fail";
        warnings.push(`⚠️ Validation contract version mismatch: expected v1, got ${validationVersion}`);
      }
      
      // Missing validation check (gated by calculator ID allowlist)
      if (!hasValidation && isValidationRequired) {
        status = "fail";
        warnings.push(`❌ Validation envelope REQUIRED for calculator ${calculatorId}`);
      } else if (!hasValidation && !isValidationRequired) {
        // Not yet migrated - WARN but don't fail
        warnings.push(`ℹ️  Validation envelope not provided (calculator not yet migrated)`);
      }

      // ============================================================
      // SUM CONSISTENCY CHECK (universal invariant with per-industry tolerance)
      // ============================================================
      
      const contrib = layerA.computed?.kWContributors || {};
      const contribSum = Object.values(contrib).reduce((sum, kw) => sum + (kw || 0), 0);
      const peak = layerA.loadProfile?.peakLoadKW || 1;
      const sumError = Math.abs(contribSum - peak) / peak;
      const tolerance = getTolerance(industry);

      // Apply per-industry tolerance thresholds (only if validation provided)
      if (sumError > tolerance.warn && peak > 0 && hasValidation) {
        warnings.push(
          `⚠️ Contributors sum ${contribSum.toFixed(1)}kW vs peak ${peak.toFixed(1)}kW (${(sumError * 100).toFixed(1)}% error > ${(tolerance.warn * 100).toFixed(0)}% tolerance)`
        );
      }

      // Check global invariants (physics sanity)
      // Hard fail logic: only fail on sum error if validation is REQUIRED (allowlist)
      const hardFail = warnings.some(w =>
        w.includes("Peak load is ZERO") ||
        w.includes("Peak < Base") ||
        w.includes("Energy > peak×24h") ||
        w.includes("version mismatch") ||
        w.includes("REQUIRED but missing")
      ) || (sumError > tolerance.fail && hasValidation && isValidationRequired);

      if (hardFail) {
        status = "fail";
        warnings.push("⚠️ Layer A hard fail - skipping pricing");
      } else {
        // Run Layer B (pricing)
        try {
          const b = await runPricingQuoteCore(a);
          layerB = b;
          warnings.push(...(b.warnings ?? []));

          // Check for pricing failures
          if (!b.capexUSD || !b.annualSavingsUSD || !b.roiYears) {
            status = "fail";
            warnings.push("⚠️ Pricing produced invalid outputs");
          }

          // STRICT MODE: Fail on pricing-critical defaults (only when Layer B is invoked)
          // Pricing-critical: electricityRate, demandCharge, location
          // Non-critical: location (if Layer A-only test)
          if (STRICT_MODE && layerA.inputFallbacks) {
            const fallbacks = Object.keys(layerA.inputFallbacks);
            const pricingCritical = fallbacks.filter(f =>
              f === "electricityRate" || f === "demandCharge" || f === "location"
            );
            
            if (pricingCritical.length > 0) {
              status = "fail";
              warnings.push(
                `⚠️ STRICT MODE: Pricing-critical defaults used: ${pricingCritical.join(", ")}`
              );
            }
            
            // Log non-critical defaults as info (don't fail)
            const nonCritical = fallbacks.filter(f => !pricingCritical.includes(f));
            if (nonCritical.length > 0) {
              warnings.push(
                `ℹ️ Non-critical defaults: ${nonCritical.join(", ")}`
              );
            }
          }
        } catch (err) {
          status = "fail";
          warnings.push(`⚠️ Pricing failed: ${(err as Error).message}`);
        }
      }

      // Check industry-specific invariants (only if validation provided)
      if (hasValidation) {
        const industryInvariants = INVARIANTS_BY_INDUSTRY[industry] ?? [];
        for (const inv of industryInvariants) {
          const error = inv.check(layerA);
          if (error) {
            status = "fail";
            warnings.push(`⚠️ ${inv.id}: ${error}`);
          }
        }

        // Check universal invariants (only if validation provided)
        for (const inv of UNIVERSAL_INVARIANTS) {
          const error = inv.check(layerA);
          if (error) {
            warnings.push(`⚠️ universal.${inv.id}: ${error}`);
          }
        }
      }

    } catch (err) {
      status = "fail";
      warnings.push(`⚠️ Template load failed: ${(err as Error).message}`);
    }

    rows.push({ industry, status, layerA, layerB, warnings });

    // Build scoreboard line with contributor mix
    const defaultCount = layerA?.inputFallbacks ? Object.keys(layerA.inputFallbacks).length : 0;
    const warnCount = warnings.filter(w => w.startsWith("ℹ️")).length;
    const peak = layerA?.loadProfile?.peakLoadKW ?? 0;
    const capex = layerB?.capexUSD ?? 0;
    const roi = layerB?.roiYears ?? 0;

    // ✅ Format status with PASS_WARN taxonomy
    const statusStr = status === "pass" ? "PASS" : status === "skip" ? "SKIP" : "FAIL";
    const peakStr = peak > 0 ? `peak=${peak >= 1000 ? (peak/1000).toFixed(1) + "MW" : peak.toFixed(0) + "kW"}` : "";
    const capexStr = capex > 0 ? `capex=$${capex >= 1e6 ? (capex/1e6).toFixed(2) + "M" : (capex/1e3).toFixed(0) + "k"}` : "";
    const roiStr = roi > 0 ? `roi=${roi.toFixed(1)}y` : "";
    
    // ✅ Add val= field for instant PR visibility
    const valVersion = layerA?.computed?.version;
    const valStr = valVersion ? `val=${valVersion}` : "val=none";
    
    // Format contributor mix (compact PR-friendly format with smart thresholds)
    const contrib = layerA?.computed?.kWContributors || {};
    const mixParts: string[] = [];
    // [fullKey, shortKey, threshold%] - only show if >= threshold
    const keys: Array<[string, string, number]> = [
      ["process", "proc", 1],      // Always show if >0%
      ["hvac", "hvac", 1],          // Always show if >0%
      ["lighting", "light", 1],     // Always show if >0%
      ["controls", "ctrl", 1],      // Always show if >0%
      ["itLoad", "it", 2],          // Only if >=2% (data centers)
      ["cooling", "cool", 2],       // Only if >=2% (data centers)
      ["charging", "chrg", 2],      // Only if >=2% (EV stations)
      ["other", "othr", 3],         // Only if >=3% (catch-all)
    ];
    
    if (peak > 0) {
      for (const [fullKey, shortKey, threshold] of keys) {
        const kw = contrib[fullKey] || 0;
        const pct = Math.round((kw / peak) * 100);
        if (pct >= threshold) {
          mixParts.push(`${shortKey}${pct}`);
        }
      }
    }
    const mixStr = mixParts.length > 0 ? `mix=${mixParts.join(" ")}` : "mix=none";
    
    const defaultStr = `defaults=${defaultCount}`;
    const warnStr = `warnings=${warnCount}`;

    scoreboard.push(
      `${industry.padEnd(15)} ${statusStr.padEnd(6)} ${peakStr.padEnd(11)} ${capexStr.padEnd(12)} ${roiStr.padEnd(7)} ${valStr.padEnd(7)} ${mixStr.padEnd(36)} ${defaultStr.padEnd(11)} ${warnStr}`
    );
  }

  // ============================================================
  // Output Results
  // ============================================================

  const passCount = rows.filter(r => r.status === "pass").length;
  const failCount = rows.filter(r => r.status === "fail").length;
  const skipCount = rows.filter(r => r.status === "skip").length;

  const out = {
    ts: new Date().toISOString(),
    mode: STRICT_MODE ? "strict" : "dev",
    industries: rows.length,
    pass: passCount,
    fail: failCount,
    skip: skipCount,
    rows,
  };

  const outPath = path.resolve(process.cwd(), "truequote-validation-report.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");

  // ✅ Emit tiny summary artifact for PR diffs (Feb 5, 2026)
  const summary = rows
    .filter(r => r.status !== "skip") // Exclude SKIP from summary
    .map((r) => ({
      industry: r.industry,
      status: r.status,
      peak: r.layerA?.loadProfile?.peakLoadKW,
      base: r.layerA?.loadProfile?.baseLoadKW,
      energy: r.layerA?.loadProfile?.energyKWhPerDay,
      capex: r.layerB?.capexUSD, // Fixed: flat structure
      roi: r.layerB?.roiYears,   // Fixed: flat structure
      valVersion: r.layerA?.computed?.version || null,
      mix: r.layerA?.computed?.kWContributors
        ? Object.entries(r.layerA.computed.kWContributors)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${k}:${v}`)
            .join(" ")
        : null,
      defaultsUsed: r.layerA?.inputsUsed?.defaults?.length || 0,
    }));

  const summaryPath = path.resolve(process.cwd(), "truequote-validation-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");

  // ============================================================
  // Print Scoreboard
  // ============================================================

  console.log("\n[TrueQuote] Scoreboard:\n");
  scoreboard.forEach(line => console.log(line));

  console.log(`\n[TrueQuote] Full report: ${outPath}`);
  console.log(`[TrueQuote] PR diff summary: ${summaryPath}`);
  console.log(`[TrueQuote] Results: PASS=${passCount} FAIL=${failCount} SKIP=${skipCount}`);
  
  // Print failure details
  const failures = rows.filter(r => r.status === "fail");
  if (failures.length > 0) {
    console.log(`\n[TrueQuote] Failed industries:`);
    failures.forEach(f => {
      console.log(`  ❌ ${f.industry}:`);
      f.warnings.filter(w => w.startsWith("⚠️")).forEach(w => {
        console.log(`     ${w}`);
      });
    });
  }

  console.log("");

  // ✅ CI exit code: fail on FAIL or CRASH (PASS_WARN is ok)
  // SKIP is expected (not an error condition)
  if (failCount > 0) {
    console.error(`\n❌ CI FAIL: ${failCount} industries failed validation\n`);
    process.exit(1);
  }
  
  console.log(`\n✅ CI PASS: All ${passCount} industries validated successfully\n`);
  process.exit(0);
})().catch((e) => {
  console.error("[TrueQuote] Validation crashed:", e);
  process.exit(2);
});
