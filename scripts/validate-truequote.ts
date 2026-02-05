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
      id: "cw_dryers_share_band",
      description: "Dryers share of peak load within expected band (30-85%)",
      check: (t) => {
        const peak = t.loadProfile?.peakLoadKW ?? 0;
        const dryers = t.computed?.kWContributors?.drying ?? 0;
        if (peak <= 0) return null; // already caught by global invariants
        const share = dryers / peak;
        if (share < 0.30 || share > 0.85) {
          return `Dryers share ${(share * 100).toFixed(1)}% out of band (30-85%). dryers=${dryers.toFixed(1)}kW, peak=${peak.toFixed(1)}kW`;
        }
        return null;
      },
    },
    {
      id: "cw_pumps_share_reasonable",
      description: "Water pumps share of peak load reasonable (10-40%)",
      check: (t) => {
        const peak = t.loadProfile?.peakLoadKW ?? 0;
        const pumps = t.computed?.kWContributors?.waterPumps ?? 0;
        if (peak <= 0) return null;
        const share = pumps / peak;
        if (share < 0.10 || share > 0.40) {
          return `Water pumps share ${(share * 100).toFixed(1)}% out of band (10-40%). pumps=${pumps.toFixed(1)}kW, peak=${peak.toFixed(1)}kW`;
        }
        return null;
      },
    },
  ],
  hotel: [
    {
      id: "hotel_hvac_scales_with_rooms",
      description: "HVAC load scales reasonably with room count",
      check: (t) => {
        const rooms = t.inputsUsed?.room_count ?? 0;
        const hvac = t.computed?.kWContributors?.hvac ?? 0;
        if (rooms <= 0) return null;
        const hvacPerRoom = hvac / rooms;
        // Expect 0.5-3 kW per room for HVAC
        if (hvacPerRoom < 0.5 || hvacPerRoom > 3.0) {
          return `HVAC per room ${hvacPerRoom.toFixed(2)}kW out of band (0.5-3.0). hvac=${hvac.toFixed(1)}kW, rooms=${rooms}`;
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

      // Check global invariants (physics sanity)
      const hardFail = warnings.some(w =>
        w.includes("Peak load is ZERO") ||
        w.includes("Peak < Base") ||
        w.includes("Energy > peak×24h")
      );

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

          // STRICT MODE: Fail on defaulted inputs
          if (STRICT_MODE && layerA.inputFallbacks) {
            const fallbacks = Object.keys(layerA.inputFallbacks);
            if (fallbacks.length > 0) {
              status = "fail";
              warnings.push(`⚠️ STRICT MODE: Used default inputs: ${fallbacks.join(", ")}`);
            }
          }
        } catch (err) {
          status = "fail";
          warnings.push(`⚠️ Pricing failed: ${(err as Error).message}`);
        }
      }

      // Check industry-specific invariants
      const industryInvariants = INVARIANTS_BY_INDUSTRY[industry] ?? [];
      for (const inv of industryInvariants) {
        const error = inv.check(layerA);
        if (error) {
          status = "fail";
          warnings.push(`⚠️ ${inv.id}: ${error}`);
        }
      }

    } catch (err) {
      status = "fail";
      warnings.push(`⚠️ Template load failed: ${(err as Error).message}`);
    }

    rows.push({ industry, status, layerA, layerB, warnings });

    // Build scoreboard line
    const defaultCount = layerA?.inputFallbacks ? Object.keys(layerA.inputFallbacks).length : 0;
    const warnCount = warnings.filter(w => w.startsWith("ℹ️")).length;
    const peak = layerA?.loadProfile?.peakLoadKW ?? 0;
    const capex = layerB?.capexUSD ?? 0;
    const roi = layerB?.roiYears ?? 0;

    const statusStr = status === "pass" ? "PASS" : "FAIL";
    const peakStr = peak > 0 ? `peak=${peak >= 1000 ? (peak/1000).toFixed(1) + "MW" : peak.toFixed(0) + "kW"}` : "";
    const capexStr = capex > 0 ? `capex=$${capex >= 1e6 ? (capex/1e6).toFixed(2) + "M" : (capex/1e3).toFixed(0) + "k"}` : "";
    const roiStr = roi > 0 ? `roi=${roi.toFixed(1)}y` : "";
    const defaultStr = `defaults=${defaultCount}`;
    const warnStr = `warnings=${warnCount}`;

    scoreboard.push(
      `${industry.padEnd(15)} ${statusStr.padEnd(7)} ${peakStr.padEnd(13)} ${capexStr.padEnd(14)} ${roiStr.padEnd(9)} ${defaultStr.padEnd(11)} ${warnStr}`
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

  // ============================================================
  // Print Scoreboard
  // ============================================================

  console.log("\n[TrueQuote] Scoreboard:\n");
  scoreboard.forEach(line => console.log(line));

  console.log(`\n[TrueQuote] Report: ${outPath}`);
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

  // Exit non-zero if any fail (good for CI)
  process.exit(failCount > 0 ? 1 : 0);
})().catch((e) => {
  console.error("[TrueQuote] Validation crashed:", e);
  process.exit(2);
});
