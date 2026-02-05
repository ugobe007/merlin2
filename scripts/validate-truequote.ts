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
 *   npx tsx scripts/validate-truequote.ts
 */

import fs from "node:fs";
import path from "node:path";

import { runContractQuoteCore, makeLayerATrace } from "../src/services/truequote/runContractQuoteCore";
import { runPricingQuoteCore } from "../src/services/truequote/runPricingQuoteCore";

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
  ok: boolean;
  layerA: ReturnType<typeof makeLayerATrace>;
  layerB?: any;
  warnings: string[];
};

(async () => {
  console.log("\n[TrueQuote] Starting validation harness...\n");

  const rows: ReportRow[] = [];

  for (const industry of INDUSTRIES) {
    console.log(`[TrueQuote] Validating ${industry}...`);
    
    const answers = FIXTURES[industry];

    // Run Layer A (contract quote)
    const a = runContractQuoteCore({ 
      industry, 
      answers, 
      locationZip: "89052",
      locationState: "NV",
    });
    const layerA = makeLayerATrace(a);

    const warnings = [...(a.warnings ?? [])];

    // Only run pricing if Layer A passes hard invariants
    let layerB: any = undefined;
    const hardFail = warnings.some(w =>
      w.includes("Peak load is ZERO") ||
      w.includes("Peak < Base") ||
      w.includes("Energy > peak×24h")
    );

    if (!hardFail) {
      try {
        const b = await runPricingQuoteCore(a);
        layerB = b;
        warnings.push(...(b.warnings ?? []));
      } catch (err) {
        warnings.push(`⚠️ Pricing failed: ${(err as Error).message}`);
      }
    } else {
      warnings.push("⚠️ Layer A hard fail - skipping pricing");
    }

    // Determine pass/fail (only hard failures count)
    const ok = !warnings.some(w => 
      w.includes("Peak load is ZERO") ||
      w.includes("Peak < Base") ||
      w.includes("Energy > peak×24h") ||
      w.includes("Pricing failed")
    );

    rows.push({ industry, ok, layerA, layerB, warnings });

    const status = ok ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${status} - ${warnings.length} warnings`);
  }

  const out = {
    ts: new Date().toISOString(),
    industries: rows.length,
    pass: rows.filter(r => r.ok).length,
    fail: rows.filter(r => !r.ok).length,
    rows,
  };

  const outPath = path.resolve(process.cwd(), "truequote-validation-report.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");

  console.log(`\n[TrueQuote] Validation complete → ${outPath}`);
  console.log(`[TrueQuote] Results: PASS=${out.pass} FAIL=${out.fail}`);
  
  // Print summary of failures
  const failures = rows.filter(r => !r.ok);
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
  process.exit(out.fail ? 1 : 0);
})().catch((e) => {
  console.error("[TrueQuote] Validation crashed:", e);
  process.exit(2);
});
