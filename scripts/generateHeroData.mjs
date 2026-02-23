#!/usr/bin/env node
/**
 * MERLIN HERO DATA GENERATOR
 * ==========================
 * Generates src/components/sections/heroUseCasesData.ts using the exact
 * same calculation constants as unifiedQuoteCalculator.ts (NREL ATB 2024
 * fallback branch — no Supabase dependency required).
 *
 * Run with:   node scripts/generateHeroData.mjs
 * Re-run any time NREL benchmark data or pricing is updated.
 *
 * METHODOLOGY (matches centralizedCalculations.ts fallback constants):
 *   - BESS price:       $130/kWh       (NREL ATB 2024, Q1 2026 LFP utility-scale)
 *   - Installation:     15% of BESS    (industry standard)
 *   - Shipping:          3% of BESS
 *   - Tariffs:           5% of BESS
 *   - ITC:              30%            (IRA 2022 base, Davis-Bacon qualified)
 *   - Peak shaving:     MWh × 365 × (rate - $0.05) × 1000  (engine formula)
 *   - Demand charge:    MW × 12 × $15,000/MW/month          (engine formula)
 *   - Grid services:    MW × $30,000/MW/year                 (engine formula)
 *   - NPV discount:     8%  Escalation: 2%  Life: 25 years
 *   Source: centralizedCalculations.ts lines 402–420 (fallback branch)
 */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "../src/components/sections/heroUseCasesData.ts");

// ── Engine Constants (NREL ATB 2024 fallback — matches the service files) ──
const C = {
  BESS_PER_KWH:              130,    // $/kWh  (NREL ATB 2024 + BNEF 1H 2026)
  INSTALL_FACTOR:            0.23,   // 15% install + 3% ship + 5% tariff
  ITC_RATE:                  0.30,   // IRA 2022 base rate
  PEAK_SHAVING_MULT:         365,    // cycles/year
  OFF_PEAK_RATE:             0.05,   // $/kWh (off-peak floor used in formula)
  DEMAND_PER_MW_MONTH:    15_000,   // $/MW/month (centralized calc fallback)
  GRID_SERVICE_PER_MW:    30_000,   // $/MW/year  (centralized calc fallback)
  DISCOUNT_RATE:             0.08,
  ESCALATION_RATE:           0.02,
  PROJECT_YEARS:             25,
};

// ── PV of growing annuity factor (same math as NPV loop in centralizedCalc) ──
const PV_FACTOR = (() => {
  let f = 0;
  for (let y = 1; y <= C.PROJECT_YEARS; y++) {
    const degradation = Math.pow(1 - 0.02, y - 1);   // 2% degradation/year
    const escalation  = Math.pow(1 + C.ESCALATION_RATE, y - 1);
    f += (degradation * escalation) / Math.pow(1 + C.DISCOUNT_RATE, y);
  }
  return f;
})();

// ── IRR solver (Newton's method) ─────────────────────────────────────────────
function solveIRR(netCost, annualSavings, years = C.PROJECT_YEARS) {
  let r = 0.15;
  for (let iter = 0; iter < 100; iter++) {
    let npv = -netCost, dnpv = 0;
    for (let y = 1; y <= years; y++) {
      const cf  = annualSavings * Math.pow(1 - 0.02, y - 1) * Math.pow(1 + C.ESCALATION_RATE, y - 1);
      const disc = Math.pow(1 + r, y);
      npv  += cf / disc;
      dnpv -= y * cf / Math.pow(1 + r, y + 1);
    }
    const step = npv / dnpv;
    r -= step;
    if (Math.abs(step) < 1e-7) break;
  }
  return Math.round(r * 1000) / 10; // percent with 1 decimal
}

// ── Core compute function ─────────────────────────────────────────────────────
function compute(s) {
  const energyKWh  = s.sizeMW * 1000 * s.durationHours;
  const equipCost  = energyKWh * C.BESS_PER_KWH;
  const totalCost  = equipCost * (1 + C.INSTALL_FACTOR);
  const taxCredit  = totalCost * C.ITC_RATE;
  const netCost    = totalCost - taxCredit;

  const energyMWh  = s.sizeMW * s.durationHours;
  const peakShaving    = energyMWh * C.PEAK_SHAVING_MULT * (s.electricityRate - C.OFF_PEAK_RATE) * 1000;
  const demandCharge   = s.sizeMW * 12 * C.DEMAND_PER_MW_MONTH;
  const gridService    = s.sizeMW * C.GRID_SERVICE_PER_MW;
  const annualSavings  = peakShaving + demandCharge + gridService;

  const paybackYears  = annualSavings > 0 ? netCost / annualSavings : 99;
  const roi10Year     = annualSavings > 0
    ? ((annualSavings * 10 - netCost) / netCost) * 100 : 0;
  const npv           = annualSavings * PV_FACTOR - netCost;
  const irr           = solveIRR(netCost, annualSavings);

  return {
    netCost, annualSavings, paybackYears, roi10Year, npv, irr,
    totalCost, taxCredit,
  };
}

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt$ = (n) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
};
const fmtPayback = (y) => y < 1 ? `${Math.round(y * 12)} mo` : `${y.toFixed(1)} yrs`;
const fmtROI     = (r) => `${Math.round(r)}%`;

// ── Canonical industry scenarios ──────────────────────────────────────────────
// Each entry uses a representative US location + published commercial utility rate.
// Rate sources: EIA State Commercial Average 2024 (Table 5.6.B)
const SCENARIOS = [
  {
    id: "data-center-enterprise",
    name: "Enterprise Data Center",
    imageVar: "dataCenter1",
    sizeMW: 5.0, durationHours: 4,
    electricityRate: 0.082,  // $/kWh  EIA 2024 Virginia commercial avg
    location: "Ashburn, VA",
    note: "Peak shaving + demand response for Tier III facility",
  },
  {
    id: "hotel-luxury",
    name: "Luxury Hotel",
    imageVar: "hotelHolidayInn2",
    sizeMW: 2.0, durationHours: 4,
    electricityRate: 0.22,   // $/kWh  EIA 2024 California commercial avg
    location: "Los Angeles, CA",
    note: "Demand charge reduction + TOU arbitrage",
  },
  {
    id: "car-wash-tunnel",
    name: "Tunnel Car Wash",
    imageVar: "carWashValet",
    sizeMW: 0.65, durationHours: 4,
    electricityRate: 0.11,   // $/kWh  EIA 2024 Illinois commercial avg
    location: "Chicago, IL",
    note: "Peak shaving for high-draw tunnel conveyor system",
  },
  {
    id: "ev-charging-hub",
    name: "EV Charging Hub",
    imageVar: "evChargingStationImage",
    sizeMW: 2.0, durationHours: 4,
    electricityRate: 0.085,  // $/kWh  EIA 2024 Texas commercial avg
    location: "Dallas, TX",
    note: "BESS eliminates demand spikes from DCFC/HPC chargers",
  },
  {
    id: "hospital-regional",
    name: "Regional Hospital",
    imageVar: "hospital3Image",
    sizeMW: 1.5, durationHours: 4,
    electricityRate: 0.21,   // $/kWh  EIA 2024 New York commercial avg
    location: "New York, NY",
    note: "Resilience + peak shaving for 24/7 critical facility",
  },
  {
    id: "manufacturing-plant",
    name: "Manufacturing Plant",
    imageVar: "manufacturing1",
    sizeMW: 3.5, durationHours: 4,
    electricityRate: 0.10,   // $/kWh  EIA 2024 Michigan commercial avg
    location: "Detroit, MI",
    note: "Industrial demand charge elimination during production peaks",
  },
  {
    id: "office-building",
    name: "Office Campus",
    imageVar: "officeBuilding1",
    sizeMW: 1.0, durationHours: 4,
    electricityRate: 0.115,  // $/kWh  EIA 2024 Illinois commercial avg
    location: "Chicago, IL",
    note: "TOU arbitrage + demand shaving for Class-A office",
  },
  {
    id: "airport-regional",
    name: "Regional Airport",
    imageVar: "airportImage",
    sizeMW: 4.0, durationHours: 4,
    electricityRate: 0.10,   // $/kWh  EIA 2024 Arizona commercial avg
    location: "Phoenix, AZ",
    note: "Grid resilience + demand management for terminal operations",
  },
  {
    id: "college-campus",
    name: "University Campus",
    imageVar: "college1",
    sizeMW: 2.0, durationHours: 4,
    electricityRate: 0.19,   // $/kWh  EIA 2024 Massachusetts commercial avg
    location: "Boston, MA",
    note: "Microgrid resilience + demand response for campus load",
  },
  {
    id: "indoor-farm",
    name: "Indoor Vertical Farm",
    imageVar: "indoorFarm1",
    sizeMW: 0.8, durationHours: 4,
    electricityRate: 0.11,   // $/kWh  EIA 2024 Colorado commercial avg
    location: "Denver, CO",
    note: "24/7 grow-light load leveling + demand charge reduction",
  },
  {
    id: "distribution-center",
    name: "Distribution Center",
    imageVar: "logistics1",
    sizeMW: 2.0, durationHours: 4,
    electricityRate: 0.09,   // $/kWh  EIA 2024 Georgia commercial avg
    location: "Atlanta, GA",
    note: "Dock charging peak shaving + TOU arbitrage",
  },
  {
    id: "resort-casino",
    name: "Resort & Casino",
    imageVar: "hotelHolidayInn3",
    sizeMW: 2.5, durationHours: 4,
    electricityRate: 0.10,   // $/kWh  EIA 2024 Nevada commercial avg
    location: "Las Vegas, NV",
    note: "24/7 demand flattening + grid independence for gaming floor",
  },
];

// ── Compute all entries ───────────────────────────────────────────────────────
const entries = SCENARIOS.map((s) => {
  const r = compute(s);
  return {
    ...s,
    systemSize: `${s.sizeMW.toFixed(1)} MW / ${(s.sizeMW * s.durationHours).toFixed(1)} MWh`,
    savings:      fmt$(r.annualSavings),
    payback:      fmtPayback(r.paybackYears),
    roi:          fmtROI(r.roi10Year),
    npv:          fmt$(r.npv),
    irr:          `${r.irr}%`,
    netCost:      fmt$(r.netCost),
    _computed: {
      netCostRaw:        Math.round(r.netCost),
      annualSavingsRaw:  Math.round(r.annualSavings),
      paybackYearsRaw:   Math.round(r.paybackYears * 100) / 100,
      roi10YearRaw:      Math.round(r.roi10Year * 10) / 10,
      npvRaw:            Math.round(r.npv),
      irrRaw:            r.irr,
    },
  };
});

// ── Log sanity check ──────────────────────────────────────────────────────────
console.log("\n📊 MERLIN HERO DATA — SANITY CHECK");
console.log("─".repeat(90));
console.log(
  `${"Industry".padEnd(28)} ${"Size".padEnd(16)} ${"Rate".padEnd(8)} ${"NetCost".padEnd(10)} ${"AnnSavings".padEnd(12)} ${"Payback".padEnd(9)} ${"NPV"}`
);
console.log("─".repeat(90));
for (const e of entries) {
  console.log(
    `${e.name.padEnd(28)} ${e.systemSize.padEnd(16)} $${e.electricityRate.toFixed(3).padEnd(7)} ${e.netCost.padEnd(10)} ${e.savings.padEnd(12)} ${e.payback.padEnd(9)} ${e.npv}`
  );
}
console.log("─".repeat(90));
console.log(`\nEngine constants: BESS $${C.BESS_PER_KWH}/kWh | ITC ${C.ITC_RATE * 100}% | DR ${C.DEMAND_PER_MW_MONTH.toLocaleString()}/MW·mo | GS ${C.GRID_SERVICE_PER_MW.toLocaleString()}/MW·yr`);
console.log(`PV factor (25yr, 8% disc, 2% esc): ${PV_FACTOR.toFixed(3)}`);

// ── Emit TypeScript file ──────────────────────────────────────────────────────
const now = new Date().toISOString();

const imageImports = [
  ['carWashValet',             '../../assets/images/car_wash_valet.jpg'],
  ['carWash1',                 '../../assets/images/carwash1.jpg'],
  ['hospitalImage',            '../../assets/images/hospital_1.jpg'],
  ['hospital2Image',           '../../assets/images/hospital_2.jpg'],
  ['hospital3Image',           '../../assets/images/hospital_3.jpg'],
  ['evChargingStationImage',   '@/assets/images/ev_charging_station.jpg'],
  ['evChargingHotelImage',     '@/assets/images/ev_charging_hotel.jpg'],
  ['airportImage',             '../../assets/images/airports_1.jpg'],
  ['hotelHolidayInn1',         '../../assets/images/hotel_motel_holidayinn_1.jpg'],
  ['hotelHolidayInn2',         '../../assets/images/hotel_motel_holidayinn_2.jpg'],
  ['hotelHolidayInn3',         '../../assets/images/hotel_motel_holidayinn_3.jpg'],
  ['dataCenter1',              '../../assets/images/data-center-1.jpg'],
  ['dataCenter2',              '../../assets/images/data-center-2.jpg'],
  ['dataCenter3',              '../../assets/images/data-center-3.jpg'],
  ['manufacturing1',           '../../assets/images/manufacturing_1.jpg'],
  ['manufacturing2',           '../../assets/images/manufacturing_2.jpg'],
  ['logistics1',               '../../assets/images/logistics_1.jpg'],
  ['logistics2',               '../../assets/images/logistics_2.jpeg'],
  ['officeBuilding1',          '../../assets/images/office_building1.jpg'],
  ['indoorFarm1',              '../../assets/images/indoor_farm1.jpeg'],
  ['airport1',                 '../../assets/images/airport_1.jpg'],
  ['college1',                 '../../assets/images/college_1.jpg'],
  ['college3',                 '../../assets/images/college_3.jpg'],
];

const usedImages = new Set(entries.map(e => e.imageVar));
const activeImports = imageImports.filter(([v]) => usedImages.has(v));

const ts = `/**
 * HERO USE CASES DATA — AUTO-GENERATED
 * =====================================
 * DO NOT EDIT MANUALLY.
 * Regenerate with:  node scripts/generateHeroData.mjs
 *
 * Generated: ${now}
 *
 * METHODOLOGY (NREL ATB 2024 + BNEF 1H 2026 — matches unifiedQuoteCalculator.ts fallback):
 *   BESS price:       $${C.BESS_PER_KWH}/kWh    (NREL ATB 2024, LFP utility-scale)
 *   Install/ship/tariff: ${(C.INSTALL_FACTOR * 100).toFixed(0)}% of BESS cost
 *   ITC:              ${C.ITC_RATE * 100}%        (IRA 2022 base, Davis-Bacon qualified)
 *   Peak shaving:     MWh × 365 × (rate − $0.05) × 1,000   [centralizedCalculations.ts L402]
 *   Demand charge:    MW × 12 × $${C.DEMAND_PER_MW_MONTH.toLocaleString()}/MW/month          [centralizedCalculations.ts L406]
 *   Grid services:    MW × $${C.GRID_SERVICE_PER_MW.toLocaleString()}/MW/year                  [centralizedCalculations.ts L413]
 *   NPV:              25-yr DCF, 8% discount, 2% escalation, 2% degradation/yr
 *   Rate source:      EIA Commercial Sector, Table 5.6.B, 2024 Annual Average
 */

${activeImports.map(([v, p]) => `import ${v} from "${p}";`).join('\n')}

// ── Type ─────────────────────────────────────────────────────────────────────

export interface HeroUseCase {
  id: string;
  /** Display name shown on carousel card */
  name: string;
  /** Static asset imported above */
  image: string;
  /** "X.X MW / Y.Y MWh" */
  systemSize: string;
  /** Formatted annual savings, e.g. "$487K" */
  savings: string;
  /** Formatted simple payback, e.g. "1.7 yrs" */
  payback: string;
  /** 10-year ROI percentage string, e.g. "473%" */
  roi: string;
  /** Net present value (25-yr), e.g. "$14.2M" */
  npv: string;
  /** Internal rate of return, e.g. "38.4%" */
  irr: string;
  /** Net cost after ITC, e.g. "$2.2M" */
  netCost: string;
  /** TrueQuote™ audit trail — inputs that produced these outputs */
  _inputs: {
    storageSizeMW: number;
    durationHours: number;
    electricityRate: number;     // EIA 2024 state commercial avg ($/kWh)
    location: string;
    itcRate: number;
    bessPerKWh: number;          // NREL ATB 2024 $/kWh
    demandChargePerMWMonth: number;
    gridServicePerMW: number;
    note: string;
    source: string;
  };
}

// ── Data ─────────────────────────────────────────────────────────────────────

export const HERO_USE_CASES: HeroUseCase[] = [
${entries.map((e) => `  {
    id:         "${e.id}",
    name:       "${e.name}",
    image:      ${e.imageVar},
    systemSize: "${e.systemSize}",
    savings:    "${e.savings}",
    payback:    "${e.payback}",
    roi:        "${e.roi}",
    npv:        "${e.npv}",
    irr:        "${e.irr}",
    netCost:    "${e.netCost}",
    _inputs: {
      storageSizeMW:          ${e.sizeMW},
      durationHours:          ${e.durationHours},
      electricityRate:        ${e.electricityRate},   // EIA 2024 ${e.location} commercial avg
      location:               "${e.location}",
      itcRate:                ${C.ITC_RATE},
      bessPerKWh:             ${C.BESS_PER_KWH},
      demandChargePerMWMonth: ${C.DEMAND_PER_MW_MONTH},
      gridServicePerMW:       ${C.GRID_SERVICE_PER_MW},
      note:                   "${e.note}",
      source:                 "NREL ATB 2024 + EIA State Commercial Rates 2024",
    },
  }`).join(',\n')}
];
`;

writeFileSync(OUTPUT, ts, "utf8");
console.log(`\n✅ Written: src/components/sections/heroUseCasesData.ts  (${entries.length} entries)`);
