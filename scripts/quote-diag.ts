/* scripts/quote-diag.ts
 *
 * TrueQuote / Calculator Diagnostic Harness
 * ---------------------------------------
 * Purpose:
 * - Run Layer A (calculator) + Layer B (pricing) repeatedly
 * - Stress Step 3 configuration mappings with controlled variants
 * - Detect unit/config mismatches via invariants + monotonic checks
 *
 * Usage:
 *   npx tsx scripts/quote-diag.ts
 *
 * Notes:
 * - This is DEV tooling: no CI assumptions.
 * - Uses wizard V7 calculator contracts directly.
 */

import { createHash } from "node:crypto";

// Import calculator registry
import { CALCULATORS_BY_ID, getCalculator } from "../src/wizard/v7/calculators/registry.js";
import type { CalcInputs, CalcRunResult } from "../src/wizard/v7/calculators/contract.js";

// -------------------------------
// Helpers
// -------------------------------
type AnyObj = Record<string, unknown>;

function stableHash(obj: unknown): string {
  const json = JSON.stringify(obj, Object.keys(obj as AnyObj).sort());
  return createHash("sha256").update(json).digest("hex").slice(0, 12);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

type Issue = {
  severity: "warn" | "error";
  code: string;
  message: string;
  data?: AnyObj;
};

function loadInvariants(load: {
  baseLoadKW?: number | null;
  peakLoadKW?: number | null;
  energyKWhPerDay?: number | null;
}): Issue[] {
  const issues: Issue[] = [];
  const base = load.baseLoadKW ?? null;
  const peak = load.peakLoadKW ?? null;
  const kwh = load.energyKWhPerDay ?? null;

  if (base == null || peak == null) {
    issues.push({
      severity: "error",
      code: "LOAD_MISSING",
      message: "Missing baseLoadKW or peakLoadKW in load profile.",
      data: { base, peak },
    });
    return issues;
  }

  if (!isFiniteNumber(base) || !isFiniteNumber(peak)) {
    issues.push({
      severity: "error",
      code: "LOAD_NAN",
      message: "base/peak is NaN/Infinity.",
      data: { base, peak },
    });
  }

  if (base < 0 || peak < 0) {
    issues.push({
      severity: "error",
      code: "LOAD_NEGATIVE",
      message: "Negative kW in load profile (unit/config bug).",
      data: { base, peak },
    });
  }

  if (base > peak) {
    issues.push({
      severity: "error",
      code: "BASE_GT_PEAK",
      message: "baseLoadKW > peakLoadKW (logic bug).",
      data: { base, peak },
    });
  }

  if (kwh != null && isFiniteNumber(kwh) && kwh < 0) {
    issues.push({
      severity: "error",
      code: "KWH_NEGATIVE",
      message: "Negative energyKWhPerDay (logic bug).",
      data: { kwh },
    });
  }

  // Gentle sanity warnings
  if (peak > 5000) {
    issues.push({
      severity: "warn",
      code: "PEAK_HUGE",
      message: "Peak load > 5,000 kW (possible unit mismatch).",
      data: { peak },
    });
  }
  if (kwh != null && isFiniteNumber(kwh) && kwh > 200000) {
    issues.push({
      severity: "warn",
      code: "KWH_HUGE",
      message: "Energy/day unusually high (possible throughput/unit mismatch).",
      data: { kwh },
    });
  }

  return issues;
}

function fmtMoney(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `$${Math.round(v).toLocaleString("en-US")}`;
}

function fmtNum(v: number | null | undefined, suffix = ""): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const n = Math.round(v * 100) / 100;
  return `${n}${suffix}`;
}

function printIssues(issues: Issue[]) {
  if (issues.length === 0) return;
  for (const iss of issues) {
    const tag = iss.severity === "error" ? "❌" : "⚠️";
    console.log(`${tag} ${iss.code}: ${iss.message}`);
    if (iss.data) console.log("   ", JSON.stringify(iss.data));
  }
}

function monotonicCheck(name: string, xs: Array<{ label: string; x: number; peak: number; kwh: number }>) {
  const sorted = [...xs].sort((a, b) => a.x - b.x);

  let okPeak = true;
  let okKwh = true;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].peak + 1e-6 < sorted[i - 1].peak) okPeak = false;
    if (sorted[i].kwh + 1e-6 < sorted[i - 1].kwh) okKwh = false;
  }

  if (okPeak && okKwh) {
    console.log(`✅ Monotonic OK: ${name}`);
    return;
  }

  console.log(`❌ Monotonic FAIL: ${name}`);
  for (const r of sorted) {
    console.log(`   ${r.label} | x=${r.x} | peak=${fmtNum(r.peak, "kW")} | kWh/d=${fmtNum(r.kwh)}`);
  }
}

// -------------------------------
// Variant definitions
// -------------------------------

type Variant = {
  id: string;
  label: string;
  calculatorId: string;
  answers: Record<string, unknown>;
};

// ========== CAR WASH ==========
function baseCarWashAnswers(): Record<string, unknown> {
  return {
    wash_type: "Tunnel (single)",
    bay_count: 1,
    tunnel_length_ft: 120,
    cars_per_day_avg: 250,
    cars_per_hour_peak: 30,
    operating_hours_per_day: 12,
    days_per_week: 7,
    dryer_present: true,
    dryer_kw: 40,
    water_heating_type: "gas",
    uses_hot_water: true,
    reclaim_system: true,
    vacuum_count: 8,
    vacuum_kw_each: 2.5,
    monthly_kwh: 15000,
    peak_demand_kw: 100,
    demand_charge: true,
    demand_charge_rate: 20,
  };
}

function makeCarWashVariants(): Variant[] {
  const base = baseCarWashAnswers();

  return [
    {
      id: "cw_baseline",
      label: "Car Wash baseline",
      calculatorId: "car_wash_load_v1",
      answers: { ...base },
    },
    {
      id: "cw_more_hours",
      label: "Car Wash longer hours",
      calculatorId: "car_wash_load_v1",
      answers: { ...base, operating_hours_per_day: 18 },
    },
    {
      id: "cw_more_vehicles",
      label: "Car Wash higher throughput",
      calculatorId: "car_wash_load_v1",
      answers: { ...base, cars_per_day_avg: 450, cars_per_hour_peak: 50 },
    },
    {
      id: "cw_big_dryers",
      label: "Car Wash more dryers",
      calculatorId: "car_wash_load_v1",
      answers: { ...base, dryer_kw: 80 },
    },
    {
      id: "cw_more_vacuums",
      label: "Car Wash more vacuums",
      calculatorId: "car_wash_load_v1",
      answers: { ...base, vacuum_count: 16 },
    },
    {
      id: "cw_low_traffic",
      label: "Car Wash low traffic",
      calculatorId: "car_wash_load_v1",
      answers: { ...base, cars_per_day_avg: 120, cars_per_hour_peak: 15, operating_hours_per_day: 10 },
    },
  ];
}

// ========== DATA CENTER ==========
function baseDataCenterAnswers(): Record<string, unknown> {
  return {
    it_load_kw: 500,
    peak_it_load_kw: 600,
    avg_utilization_pct: 70,
    growth_pct_24mo: 20,
    power_capacity_kw: 800,
    tier: "Tier 3",
    redundancy: "N+1",
    required_runtime_min: 240,
    generator_present: true,
    ups_present: true,
    cooling_type: "CRAC",
    pue: 1.5,
    cooling_peak_kw: 300,
    monthly_kwh: 360000,
    peak_demand_kw: 800,
    demand_charge: true,
    demand_charge_rate: 25,
  };
}

function makeDataCenterVariants(): Variant[] {
  const base = baseDataCenterAnswers();

  return [
    {
      id: "dc_baseline",
      label: "Data Center baseline",
      calculatorId: "dc_load_v1",
      answers: { ...base },
    },
    {
      id: "dc_more_it_load",
      label: "Data Center higher IT load",
      calculatorId: "dc_load_v1",
      answers: { ...base, it_load_kw: 1000, peak_it_load_kw: 1200 },
    },
    {
      id: "dc_lower_pue",
      label: "Data Center better efficiency",
      calculatorId: "dc_load_v1",
      answers: { ...base, pue: 1.2 },
    },
    {
      id: "dc_higher_utilization",
      label: "Data Center higher utilization",
      calculatorId: "dc_load_v1",
      answers: { ...base, avg_utilization_pct: 90 },
    },
    {
      id: "dc_tier4",
      label: "Data Center Tier 4",
      calculatorId: "dc_load_v1",
      answers: { ...base, tier: "Tier 4", redundancy: "2N" },
    },
  ];
}

// ========== HOTEL ==========
function baseHotelAnswers(): Record<string, unknown> {
  // USE ACTUAL DATABASE FIELD NAMES (TrueQuote Policy)
  // Database schema from custom_questions table uses camelCase
  return {
    roomCount: 150,  // Database field (camelCase)
    occupancyRate: 70,  // Database field
    hotelClass: "midscale",  // Database field
    hotelAmenities: ["laundry_onsite", "restaurant", "bar", "pool"],  // Database array field
    hvacType: "central_ac",  // Database field
    waterHeating: "gas",  // Database field
    monthlyElectricitySpend: "15000-30000",  // Database field (string range)
    utilityRateStructure: "demand",  // Database field
  };
}

function makeHotelVariants(): Variant[] {
  const base = baseHotelAnswers();

  return [
    {
      id: "hotel_baseline",
      label: "Hotel baseline",
      calculatorId: "hotel_load_v1",
      answers: { ...base },
    },
    {
      id: "hotel_more_rooms",
      label: "Hotel larger (250 rooms)",
      calculatorId: "hotel_load_v1",
      answers: { ...base, roomCount: 250 },  // Use database field name
    },
    {
      id: "hotel_higher_occupancy",
      label: "Hotel higher occupancy",
      calculatorId: "hotel_load_v1",
      answers: { ...base, occupancyRate: 85 },  // Use database field name
    },
    {
      id: "hotel_full_amenities",
      label: "Hotel full amenities",
      calculatorId: "hotel_load_v1",
      answers: { ...base, hotelAmenities: [...(base.hotelAmenities as string[]), "spa", "fitness_center", "conference_center"] },
    },
    {
      id: "hotel_electric_water",
      label: "Hotel electric hot water",
      calculatorId: "hotel_load_v1",
      answers: { ...base, waterHeating: "electric_tank" },  // Use database field name
    },
  ];
}

function makeVariants(): Variant[] {
  return [
    ...makeCarWashVariants(),
    ...makeDataCenterVariants(),
    ...makeHotelVariants(),
  ];
}

// -------------------------------
// Harness runner
// -------------------------------

function runOne(variant: Variant) {
  const calc = getCalculator(variant.calculatorId);
  
  if (!calc) {
    console.error(`❌ Calculator not found: ${variant.calculatorId}`);
    return null;
  }

  const inputs: CalcInputs = variant.answers as CalcInputs;
  const outputs: CalcRunResult = calc.compute(inputs);

  const load = outputs ?? {};
  const fallbacks: string[] = [];  // Calculators don't track fallbacks directly

  const loadIssues = loadInvariants({
    baseLoadKW: load.baseLoadKW,
    peakLoadKW: load.peakLoadKW,
    energyKWhPerDay: load.energyKWhPerDay,
  });

  const peak = load.peakLoadKW ?? null;
  const base = load.baseLoadKW ?? null;
  const kwh = load.energyKWhPerDay ?? null;

  const snapshotId = stableHash({ calculatorId: variant.calculatorId, inputs, outputs });

  console.log("");
  console.log("============================================================");
  console.log(`🧪 ${variant.id} — ${variant.label}`);
  console.log("------------------------------------------------------------");
  console.log(`Load: base=${fmtNum(base, "kW")} peak=${fmtNum(peak, "kW")} kWh/day=${fmtNum(kwh)}`);
  console.log(`Warnings: ${outputs.warnings?.length ?? 0}`);
  console.log(`Assumptions: ${outputs.assumptions?.length ?? 0}`);
  console.log(`Snapshot: ${snapshotId}`);

  printIssues(loadIssues);

  return {
    id: variant.id,
    label: variant.label,
    x_primaryMetric: extractPrimaryMetric(variant),
    x_secondaryMetric: extractSecondaryMetric(variant),
    peak: Number(peak ?? NaN),
    kwh: Number(kwh ?? NaN),
  };
}

function extractPrimaryMetric(variant: Variant): number {
  // Extract the primary varying metric for each industry
  if (variant.id.startsWith("cw_")) {
    return Number(variant.answers.averageWashesPerDay ?? variant.answers.cars_per_day_avg ?? 0);
  } else if (variant.id.startsWith("dc_")) {
    return Number(variant.answers.itLoadKW ?? variant.answers.it_load_kw ?? 0);
  } else if (variant.id.startsWith("hotel_")) {
    return Number(variant.answers.roomCount ?? variant.answers.room_count ?? 0);  // Database field
  }
  return 0;
}

function extractSecondaryMetric(variant: Variant): number {
  // Extract the secondary varying metric for each industry
  if (variant.id.startsWith("cw_")) {
    return Number(variant.answers.dryer_kw ?? 0) + Number(variant.answers.vacuum_count ?? 0);
  } else if (variant.id.startsWith("dc_")) {
    return Number(variant.answers.pue ?? 0) * 100;
  } else if (variant.id.startsWith("hotel_")) {
    return Number(variant.answers.occupancyRate ?? variant.answers.occupancy_avg_pct ?? 0);  // Database field
  }
  return 0;
}

function main() {
  console.log("🔎 TrueQuote / Calculator Diagnostic Harness");
  console.log("   - Running Layer A (calculator) over variants");
  console.log("   - Testing: Car Wash, Data Center, Hotel");
  console.log("   - Looking for monotonic breaks + invariants");

  const variants = makeVariants();

  const results: Array<ReturnType<typeof runOne>> = [];
  for (const v of variants) {
    const result = runOne(v);
    if (result) results.push(result);
  }

  console.log("");
  console.log("============================================================");
  console.log("📈 Monotonic Checks (should NOT go backwards)");
  console.log("============================================================");

  // Group by industry
  const carWash = results.filter((r) => r && r.id.startsWith("cw_"));
  const dataCenter = results.filter((r) => r && r.id.startsWith("dc_"));
  const hotel = results.filter((r) => r && r.id.startsWith("hotel_"));

  // Car Wash checks
  console.log("");
  console.log("🚗 CAR WASH");
  console.log("------------------------------------------------------------");
  
  monotonicCheck(
    "cars/day ↑ => peak/kWh should ↑",
    carWash
      .filter((r) => r.id.includes("vehicles") || r.id.includes("baseline") || r.id.includes("low_traffic"))
      .map((r) => ({ label: r.id, x: r.x_primaryMetric, peak: r.peak, kwh: r.kwh }))
  );

  monotonicCheck(
    "dryer kW ↑ => peak should ↑",
    carWash
      .filter((r) => r.id.includes("dryers") || r.id.includes("baseline"))
      .map((r) => ({ label: r.id, x: r.x_secondaryMetric, peak: r.peak, kwh: r.kwh }))
  );

  // Data Center checks
  console.log("");
  console.log("🖥️  DATA CENTER");
  console.log("------------------------------------------------------------");
  
  monotonicCheck(
    "IT load ↑ => peak should ↑",
    dataCenter
      .filter((r) => r.id.includes("it_load") || r.id.includes("baseline"))
      .map((r) => ({ label: r.id, x: r.x_primaryMetric, peak: r.peak, kwh: r.kwh }))
  );

  monotonicCheck(
    "PUE ↓ => peak should ↓ (lower is better)",
    dataCenter
      .filter((r) => r.id.includes("pue") || r.id.includes("baseline"))
      .map((r) => ({ label: r.id, x: r.x_secondaryMetric, peak: r.peak, kwh: r.kwh }))
      .sort((a, b) => b.x - a.x) // Reverse sort - lower PUE should have lower peak
  );

  // Hotel checks
  console.log("");
  console.log("🏨 HOTEL");
  console.log("------------------------------------------------------------");
  
  monotonicCheck(
    "room count ↑ => peak should ↑",
    hotel
      .filter((r) => r.id.includes("rooms") || r.id.includes("baseline"))
      .map((r) => ({ label: r.id, x: r.x_primaryMetric, peak: r.peak, kwh: r.kwh }))
  );

  monotonicCheck(
    "occupancy ↑ => peak/kWh should ↑",
    hotel
      .filter((r) => r.id.includes("occupancy") || r.id.includes("baseline"))
      .map((r) => ({ label: r.id, x: r.x_secondaryMetric, peak: r.peak, kwh: r.kwh }))
  );

  console.log("");
  console.log("✅ Done.");
}

main();

// -------------------------------
