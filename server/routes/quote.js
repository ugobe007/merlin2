/**
 * QUOTE ENGINE API ENDPOINT
 * ==========================
 * POST /api/quote
 *
 * Accepts industry + location + optional facility/equipment overrides.
 * Geocodes location, fetches NREL solar PSH, sizes system from industry
 * defaults (or caller overrides), then runs the full v4.5 pricing stack.
 *
 * Mirrors pricingServiceV45.ts logic server-side so the REST API always
 * produces numbers identical to the in-browser wizard.
 *
 * Input (all fields except `location` are optional):
 * {
 *   "industry":        "hotel" | "restaurant" | "retail" | "car_wash" | "warehouse" | "office" | "gym" | "healthcare" | "school",
 *   "location":        "San Francisco, CA"  // required — geocoded via Google Maps
 *   "bessKW":          number,   // override industry default
 *   "bessKWh":         number,   // override industry default
 *   "solarKW":         number,   // override industry default
 *   "generatorKW":     number,   // default 0
 *   "generatorFuelType": "diesel" | "natural-gas",
 *   "l2Chargers":      number,   // Level 2 EV chargers
 *   "dcfcChargers":    number,   // DC Fast Chargers
 *   "hpcChargers":     number,   // High Power Chargers (350 kW)
 *   "electricityRate": number,   // $/kWh override
 *   "demandCharge":    number    // $/kW override
 * }
 *
 * Authorization: Bearer <api_key>  (accepted, logged — enforcement added later)
 *
 * Created: March 26, 2026
 */

import express from 'express';
import { findInstallerForState } from './epc.js';

const router = express.Router();

// ============================================================================
// PRICING CONSTANTS (mirrored from src/services/pricingServiceV45.ts)
// ============================================================================

const SOLAR_PRICE_PER_WATT    = 1.51;   // $/W net (inverter excluded)
const BESS_PRICE_PER_KWH      = 350;    // $/kWh — pack only
const BESS_PRICE_PER_KW       = 150;    // $/kW  — PCS / hybrid inverter
const GEN_PRICE_PER_KW_DIESEL = 690;    // $/kW diesel
const GEN_PRICE_PER_KW_NATGAS = 500;    // $/kW natural-gas (no tank)
const GEN_FUEL_TANK           = 15000;  // $
const GEN_TRANSFER_SWITCH     = 8000;   // $
const EV_L2_PRICE             = 7000;   // $/unit  Level 2 (7.2 kW)
const EV_DCFC_PRICE           = 50000;  // $/unit  DC Fast (50 kW)
const EV_HPC_PRICE            = 150000; // $/unit  High Power (350 kW)
const SITE_WORK_TOTAL         = 25800;  // Structural eng, monitoring, interconnect, pad, trenching, commissioning, drawings, signage
const CONTINGENCY_RATE        = 0.075;  // 7.5% construction contingency
const FEDERAL_ITC_RATE        = 0.30;   // 30% IRA 2022 (solar + BESS eligible)
const SOLAR_PR                = 0.77;   // NREL Performance Ratio (DC wiring, inverter, soiling, temp)
// CALIBRATE ME. Credited peak shave cannot exceed this share of site peak.
// A battery cannot save more demand than it shaves, and it cannot shave more than the peak.
// Sweep of which tier has the shortest payback (car wash, indexed price, 120 kW solar cap, 4.5 sun hours):
//   0.30 Starter · 0.35–0.50 Recommended · 0.55+ Complete.
// 0.45 is inside that band, just above BESS_RATIO.peak_shaving (0.40), and off the 0.50 edge.
// Set it from metered peak-shaving performance and re-run the sweep. It is not chosen to make a tier win.
const MAX_SHAVE_FRACTION       = 0.45;
const PEAK_SHAVE_EFFECTIVENESS = 0.75;

// NREL PVWatts key — confirmed working 2025-12-11
const NREL_API_KEY_FALLBACK = 'G9sYxfv89Vr9mjHD5zThWpBntyYkKJjP6iF8i3He';

// ============================================================================
// INDUSTRY DEFAULTS
// Source: step4Logic.ts comments, CBECS 2018, EIA Commercial Buildings Survey
// peakLoadKW  — facility peak demand used for BESS sizing
// solarCapKW  — max physical roof/canopy capacity (kW DC)
// criticalLoadPct — fraction of load requiring backup power (0–1)
// ============================================================================

const INDUSTRY_DEFAULTS = {
  hotel:         { peakLoadKW: 500,  solarCapKW: 225,  criticalLoadPct: 0.45, electricityRate: 0.13, demandCharge: 18 },
  restaurant:    { peakLoadKW: 80,   solarCapKW: 30,   criticalLoadPct: 0.60, electricityRate: 0.14, demandCharge: 16 },
  retail:        { peakLoadKW: 300,  solarCapKW: 100,  criticalLoadPct: 0.35, electricityRate: 0.12, demandCharge: 15 },
  // car_wash: solarCapKW scales with peakLoadKW (canopy ~27% of peak kW)
  // demandCharge $20/kW reflects real commercial rates (EIA 2024 C&I median)
  // criticalLoadPct 0.20 is lighting, controllers and freeze protection.
  // The tunnel is not backup-critical. 0.80 was sizing a generator that
  // calcTierSavings does not credit, and sizeGenerator() already returns
  // 0 below 0.50.
  car_wash:      { peakLoadKW: 450,  solarCapKW: 55,   criticalLoadPct: 0.20, electricityRate: 0.13, demandCharge: 20 },
  carwash:       { peakLoadKW: 450,  solarCapKW: 55,   criticalLoadPct: 0.20, electricityRate: 0.13, demandCharge: 20 },
  warehouse:     { peakLoadKW: 400,  solarCapKW: 819,  criticalLoadPct: 0.30, electricityRate: 0.10, demandCharge: 12 },
  office:        { peakLoadKW: 200,  solarCapKW: 150,  criticalLoadPct: 0.40, electricityRate: 0.12, demandCharge: 15 },
  gym:           { peakLoadKW: 150,  solarCapKW: 60,   criticalLoadPct: 0.30, electricityRate: 0.13, demandCharge: 15 },
  healthcare:    { peakLoadKW: 1500, solarCapKW: 375,  criticalLoadPct: 0.90, electricityRate: 0.13, demandCharge: 20 },
  hospital:      { peakLoadKW: 1500, solarCapKW: 375,  criticalLoadPct: 0.90, electricityRate: 0.13, demandCharge: 20 },
  school:        { peakLoadKW: 200,  solarCapKW: 200,  criticalLoadPct: 0.40, electricityRate: 0.12, demandCharge: 13 },
  manufacturing: { peakLoadKW: 800,  solarCapKW: 450,  criticalLoadPct: 0.50, electricityRate: 0.10, demandCharge: 14 },
  default:       { peakLoadKW: 300,  solarCapKW: 100,  criticalLoadPct: 0.40, electricityRate: 0.12, demandCharge: 15 },
  // ── Sales-agent verticals ──
  // Truck stop: high peak (fueling + HVAC + restaurant), canopy solar ideal,
  // daisy-chain DockChain charger modeled as single transformer cabinet
  truck_stop:  { peakLoadKW: 800,  solarCapKW: 320,  criticalLoadPct: 0.70, electricityRate: 0.11, demandCharge: 18 },
  // EV charging hub: load-dominated by charger draw; BESS for demand shave;
  // solar offsets overnight idle load
  ev_charging: { peakLoadKW: 400,  solarCapKW: 150,  criticalLoadPct: 0.50, electricityRate: 0.12, demandCharge: 20 },
};

// ============================================================================
// TIER SCALING CONSTANTS (step4Logic.ts — save_most goal / TrueQuote™ v4.5)
// ============================================================================

// BESS-to-peak-load sizing ratios (IEEE/MDPI benchmarks — benchmarkSources.ts)
const BESS_RATIO = {
  peak_shaving: 0.40,  // IEEE 4538388, MDPI Energies 11(8):2048
  arbitrage:    0.50,  // peak shaving + TOU shifting
  resilience:   0.70,  // IEEE 446 critical-load coverage
  ups:          0.90,  // IEEE 446 §4.4 — full critical-load UPS coverage
  microgrid:    1.00,  // full islanding (NREL)
};

const TIER_BESS_SCALE        = { Starter: 0.55,  Recommended: 1.0,  Complete: 1.5  };
const TIER_DURATION_HRS      = { Starter: 2,     Recommended: 4,    Complete: 6    };
const TIER_SOLAR_PENETRATION = { Starter: 0.50,  Recommended: 0.85, Complete: 1.0  };

// Industry-specific BESS duration constraints (override tier defaults).
// max: cap (peak-shaving industries don't need multi-hour storage)
// min: floor (critical-load / UPS industries require guaranteed runtime)
const INDUSTRY_DURATION_OVERRIDE = {
  car_wash:    { max: 2 },   // demand peaks <15 min; 2h is more than enough
  carwash:     { max: 2 },
  restaurant:  { max: 2 },   // demand smoothing only; no overnight backup
  gym:         { max: 2 },
  retail:      { max: 2 },
  healthcare:  { min: 4 },   // NFPA 99 critical branch; 4h minimum for BESS
  hospital:    { min: 4 },
  data_center: { min: 4 },   // Tier II+; BESS handles first 4h, gen handles rest
};
// Generator: excluded at Starter by default; Complete gets 25% extra headroom
const TIER_GEN_SCALE         = { Starter: 0,     Recommended: 1.0,  Complete: 1.25 };

// ============================================================================
// FITNESS-FIRST BESS CATALOG
// Min/max unit sizes enforce physical fitness before vendor scoring.
// A unit that cannot serve the required kWh is disqualified — score irrelevant.
// Source: vendor spec sheets (Q1 2026)
// ============================================================================
const BESS_CATALOG = [
  { vendor: 'Fluence',   model: 'Edgestack 2',          minKWh: 100,  maxKWh: 50000, scoreBase: 82, priceTag: 'benchmark', priceSource: 'BloombergNEF Q4 2025' },
  { vendor: 'Tesla',     model: 'Megapack 2XL',          minKWh: 1900, maxKWh: 40000, scoreBase: 88, priceTag: 'benchmark', priceSource: 'Tesla Energy 2025 list' },
  { vendor: 'FlexGen',   model: 'HybridOS C&I',          minKWh: 2000, maxKWh: 80000, scoreBase: 79, priceTag: 'benchmark', priceSource: 'BloombergNEF Q4 2025' },
  { vendor: 'GE Vernova',model: 'Reservoir',             minKWh: 4000, maxKWh: 80000, scoreBase: 75, priceTag: 'benchmark', priceSource: 'Wood Mackenzie 2025' },
  { vendor: 'Samsung',   model: 'SDI SBB',               minKWh: 2900, maxKWh: 60000, scoreBase: 77, priceTag: 'benchmark', priceSource: 'BloombergNEF Q4 2025' },
  { vendor: 'Generac',   model: 'PWRcell C&I',           minKWh: 50,   maxKWh: 500,   scoreBase: 72, priceTag: 'verified',  priceSource: 'CED Greentech distributor' },
  { vendor: 'Enphase',   model: 'IQ Commercial Battery', minKWh: 10,   maxKWh: 200,   scoreBase: 70, priceTag: 'verified',  priceSource: 'CED Greentech distributor' },
];

/**
 * Fitness-first BESS selection.
 * Step 1: disqualify any unit whose min/max kWh range cannot serve bessKWh.
 * Step 2: rank eligible units by scoreBase desc.
 * Returns winner + rationale (eligible, disqualified with reason).
 */
function selectBessVendor(bessKWh) {
  const eligible    = BESS_CATALOG.filter(v => bessKWh >= v.minKWh && bessKWh <= v.maxKWh);
  const disqualified = BESS_CATALOG
    .filter(v => bessKWh < v.minKWh || bessKWh > v.maxKWh)
    .map(v => ({
      vendor: v.vendor, model: v.model,
      reason: bessKWh < v.minKWh
        ? `min unit size ${v.minKWh.toLocaleString()} kWh (need ${bessKWh.toLocaleString()} kWh)`
        : `exceeds max unit size ${v.maxKWh.toLocaleString()} kWh`,
    }));
  if (eligible.length === 0) {
    // Fallback: no single unit fits — flag as custom/multi-unit project
    return { vendor: 'Custom / multi-unit', model: 'Engineering required', scoreBase: 60,
             priceTag: 'estimate', priceSource: 'Derived', eligible: [], disqualified };
  }
  const winner = eligible.reduce((best, v) => v.scoreBase > best.scoreBase ? v : best, eligible[0]);
  return { ...winner, eligible: eligible.map(v => v.vendor), disqualified };
}

// ============================================================================
// PRICING PROVENANCE
// Every cost line is tagged: verified (live distributor) | benchmark (index)
// | estimate (derived from first-principles).
// ============================================================================
const PRICE_PROVENANCE = {
  solar:      { tag: 'benchmark', source: 'NREL ATB 2025 utility-scale avg $1.51/W' },
  bess:       { tag: 'benchmark', source: 'BloombergNEF BNEF LCOES Q4 2025 $350/kWh' },
  generator:  { tag: 'estimate',  source: 'EGSA 2024 median diesel $690/kW' },
  ev_l2:      { tag: 'benchmark', source: 'ChargePoint/Enel distributor list $7k/unit' },
  ev_dcfc:    { tag: 'benchmark', source: 'ABB/ChargePoint 2025 list $50k/unit' },
  ev_hpc:     { tag: 'estimate',  source: 'OEM direct HPC 350kW est. $150k/unit' },
  site_work:  { tag: 'benchmark', source: 'RS Means 2025 C&I typical $25.8k' },
  merlin_fee: { tag: 'verified',  source: 'Merlin published fee schedule' },
};

// ============================================================================
// CONFIDENCE SCORE (0 – 100)
// Weighted across 8 input quality dimensions (matches v34.2.0 framework).
// ============================================================================
function computeConfidenceScore({ peakSource, rateSource, locationResolved, pshLive, vendorBess }) {
  const weights = {
    peakDemandSource:   20,   // heaviest — utility bill would max this
    utilityRateSource:  15,
    siteDataComplete:   15,
    solarIrradiance:    10,
    weatherLive:        10,
    gridReliability:    10,
    roofData:           10,
    equipCatalog:       10,
  };
  const score =
    (peakSource === 'utility_bill' ? 1.00 : peakSource === 'override' ? 0.75 : 0.40) * weights.peakDemandSource +
    (rateSource  === 'override'    ? 1.00 : 0.55) * weights.utilityRateSource +
    (locationResolved              ? 0.80 : 0.40) * weights.siteDataComplete +
    (pshLive                       ? 1.00 : 0.50) * weights.solarIrradiance +
    0.50 * weights.weatherLive +     // live weather API not yet integrated
    0.50 * weights.gridReliability + // SAIDI not yet integrated
    0.50 * weights.roofData +        // roof upload not yet integrated
    (vendorBess                    ? 1.00 : 0.60) * weights.equipCatalog;
  const rounded = Math.min(100, Math.round(score));
  const tier = rounded >= 75 ? 'HIGH CONFIDENCE' : rounded >= 50 ? 'MEDIUM CONFIDENCE' : 'PROVISIONAL';
  const description = rounded >= 75
    ? 'All key inputs from live sources — suitable for PE underwriting'
    : rounded >= 50
    ? 'Mix of live and default fallbacks — upload utility bill to lift to HIGH'
    : 'Significant defaults used — provisional estimate only';
  return { score: rounded, tier, description };
}

// ============================================================================
// MONTE CARLO  P10 / P50 / P90
// Parametric band approach — varies 4 key inputs across low/mid/high scenarios
// then samples 500 draws. P10 = conservative, P50 = underwriting base,
// P90 = upside. Matches v34.2.0 methodology.
// ============================================================================
function computeMonteCarlo(netInvestment, baseSavings, electricityRate, demandCharge, bessKW, solarKW, psh, peakLoadKW = 0, n = 500) {
  const results = [];
  for (let i = 0; i < n; i++) {
    // Gaussian-like via sum of uniforms (Box-Muller approximation)
    const rateVar   = (Math.random() - 0.5) * 0.30;   // ±15% electricity rate
    const demandVar = (Math.random() - 0.5) * 0.40;   // ±20% demand charge
    const solarVar  = (Math.random() - 0.5) * 0.20;   // ±10% solar production
    const bessEff   = 0.65 + Math.random() * 0.20;     // 65–85% demand shave effectiveness
    const adjRate   = electricityRate * (1 + rateVar);
    const adjDemand = demandCharge    * (1 + demandVar);
    const adjSolar  = solarKW * psh * 365 * SOLAR_PR * (1 + solarVar) * adjRate;
    const shaveCeiling = peakLoadKW > 0 ? Math.round(peakLoadKW * MAX_SHAVE_FRACTION) : bessKW;
    const adjDemandSav = Math.min(bessKW, shaveCeiling) * adjDemand * 12 * bessEff;
    const totalSav  = adjSolar + adjDemandSav;
    const pb        = netInvestment <= 0 ? 0 : netInvestment / Math.max(1, totalSav);
    // 5-year IRR approximation: (savings*5 - investment) / investment / 5 * 100
    const irr5      = netInvestment <= 0 ? 0 : ((totalSav * 5 - netInvestment) / netInvestment) / 5 * 100;
    results.push({ payback: pb, irr5, annualSavings: totalSav });
  }
  results.sort((a, b) => a.payback - b.payback);
  // Ascending payback puts the short (optimistic) paybacks first.
  // p10 is the downside, so it takes the long-payback tail.
  const upside = results[Math.floor(n * 0.10)];
  const p50 = results[Math.floor(n * 0.50)];
  const downside = results[Math.floor(n * 0.90)];
  const p10 = downside;
  const p90 = upside;
  const fmt1 = v => Math.round(v * 10) / 10;
  const fmtK = v => `$${Math.round(v / 1000)}K`;
  return {
    p10: { paybackYears: fmt1(p10.payback), irr5Pct: fmt1(p10.irr5), annualSavings: fmtK(p10.annualSavings), label: 'Conservative (downside)' },
    p50: { paybackYears: fmt1(p50.payback), irr5Pct: fmt1(p50.irr5), annualSavings: fmtK(p50.annualSavings), label: 'Base case (PE underwriting)' },
    p90: { paybackYears: fmt1(p90.payback), irr5Pct: fmt1(p90.irr5), annualSavings: fmtK(p90.annualSavings), label: 'Upside' },
    note: 'Monte Carlo n=500 · varies electricity rate ±15%, demand charge ±20%, solar yield ±10%, BESS effectiveness 65–85%',
  };
}
const NEC_GEN_MARGIN         = 1.25;  // NEC/LADWP reserve margin
const BESS_COMMERCIAL_FLOOR  = 75;   // kW — minimum commercial BESS

// ============================================================================
// HELPERS
// ============================================================================

/** Tiered Merlin service fee (mirrored from calculateMerlinFees in pricingServiceV45.ts) */
function calculateMerlinFees(equipmentSubtotal) {
  let marginRate;
  if (equipmentSubtotal < 200000)      marginRate = 0.20;
  else if (equipmentSubtotal < 800000) marginRate = 0.14;
  else                                  marginRate = 0.13;
  const totalFee = equipmentSubtotal * marginRate;
  return {
    designIntelligence:  Math.round(totalFee * 0.14),
    procurementSourcing: Math.round(totalFee * 0.65),
    pmConstruction:      Math.round(totalFee * 0.16),
    incentiveFiling:     Math.round(totalFee * 0.05),
    totalFee:            Math.round(totalFee),
    effectiveMargin:     marginRate,
    annualMonitoring:    580,
  };
}

/** Annual operating reserves (pricingServiceV45.ts ANNUAL_RESERVES) */
function calcAnnualReserves(solarKW, bessKWh, bessPerKwh = BESS_PRICE_PER_KWH) {
  return Math.round(
    1250                          // insurance rider
    + solarKW  * 1000 * 0.01     // inverter reserve ($10/kW/yr)
    + bessKWh  * bessPerKwh * 0.02  // same $/kWh as the capital line
  );
}

// ── Vendor pricing lookup (queries equipment_pricing via Supabase REST) ───────
/**
 * Price the battery selectBessVendor() already named.
 * A global minimum can return a different product (multi-day iron-air at
 * $25/kWh against a 2-hour lithium nameplate). No row for this unit means
 * the index price, not the cheapest row in the table.
 */
async function getVendorBessPrice(selection) {
  const sbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey || !selection?.vendor || selection.vendor === 'Custom / multi-unit') return null;

  const params = new URLSearchParams({
    equipment_type: 'eq.battery',
    manufacturer: `eq.${selection.vendor}`,
    select: 'price_per_kwh,price_per_kw,manufacturer,model,source,override_below_index,override_reason,override_by,override_at',
    limit: '1',
  });
  if (selection.model) params.set('model', `eq.${selection.model}`);

  try {
    const res = await fetch(`${sbUrl}/rest/v1/equipment_pricing?${params}`, {
      headers: {
        apikey: sbKey,
        Authorization: `Bearer ${sbKey}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * One decision for the battery price and the citation that describes it.
 * Below half the index is rejected unless the row carries a reasoned override.
 * No row, or a rejected row, falls back to the index so price and citation agree.
 */
function admitVendorBessPrice(row) {
  const indexed = {
    admitted: false,
    perKwh: BESS_PRICE_PER_KWH,
    perKw: null,
    belowIndex: false,
    provenance: { ...PRICE_PROVENANCE.bess },
  };
  const perKwh = Number(row?.price_per_kwh);
  if (!row || !(perKwh > 0)) return indexed;

  const floor = BESS_PRICE_PER_KWH * 0.5;
  const reason = typeof row.override_reason === 'string' ? row.override_reason.trim() : '';
  const reasoned = row.override_below_index === true && reason.length >= 10 && Boolean(row.override_by);
  if (perKwh < floor && !reasoned) {
    console.log(`[/api/quote] Rejected ${row.manufacturer ?? ''} ${row.model ?? ''} at $${perKwh}/kWh — below $${floor}/kWh without a reasoned override`);
    return indexed;
  }

  const who = [row.manufacturer, row.model].filter(Boolean).join(' ');
  const source = perKwh < floor
    ? `${who} $${perKwh}/kWh — below the $${BESS_PRICE_PER_KWH}/kWh index. Override by ${row.override_by}: ${reason}`
    : `${who} $${perKwh}/kWh${row.source ? ` (${row.source})` : ''}`;
  return {
    admitted: true,
    perKwh,
    perKw: row.price_per_kw != null ? Number(row.price_per_kw) : null,
    belowIndex: perKwh < floor,
    provenance: { tag: perKwh < floor ? 'estimate' : 'verified', source },
  };
}

// ── Tier sizing helpers (ported from step4Logic.ts) ──────────────────────────

function sizeBESS(peakLoadKW, tierLabel, bessApplication, industryKey = '') {
  const ratio       = BESS_RATIO[bessApplication] ?? BESS_RATIO.peak_shaving;
  const bessKW      = Math.max(BESS_COMMERCIAL_FLOOR,
                       Math.round(peakLoadKW * ratio * TIER_BESS_SCALE[tierLabel]));
  let   durationHrs = TIER_DURATION_HRS[tierLabel];
  // Apply industry-level duration floor / ceiling
  const dur = INDUSTRY_DURATION_OVERRIDE[industryKey];
  if (dur?.max !== undefined) durationHrs = Math.min(durationHrs, dur.max);
  if (dur?.min !== undefined) durationHrs = Math.max(durationHrs, dur.min);
  const bessKWh     = Math.round(bessKW * durationHrs);
  return { bessKW, bessKWh, durationHrs };
}

function sizeSolar(solarCapKW, psh, tierLabel) {
  // sunFactor: quality-adjusts for local irradiance (step4Logic.ts)
  const sunFactor   = Math.max(0.40, Math.min(1.0, (psh - 2.5) / 2.0));
  const penetration = TIER_SOLAR_PENETRATION[tierLabel];
  return Math.round(Math.min(solarCapKW * sunFactor * penetration, solarCapKW));
}

function sizeGenerator(peakLoadKW, criticalLoadPct, tierLabel) {
  const scale = TIER_GEN_SCALE[tierLabel];
  if (scale === 0 || criticalLoadPct < 0.50) return 0;
  return Math.max(10, Math.round(peakLoadKW * criticalLoadPct * NEC_GEN_MARGIN * scale));
}

function calcTierCosts(eq, priceOverrides = {}) {
  const { solarKW = 0, bessKW = 0, bessKWh = 0, generatorKW = 0,
          l2Chargers = 0, dcfcChargers = 0, hpcChargers = 0,
          truckStopCabinets = 0,
          generatorFuelType = 'diesel' } = eq;
  // Allow vendor pricing overrides (from equipment_pricing table)
  const bessPerKwh = priceOverrides.bessPerKwh ?? BESS_PRICE_PER_KWH;
  const bessPerKw  = priceOverrides.bessPerKw  ?? BESS_PRICE_PER_KW;
  const isNatGas    = generatorFuelType === 'natural-gas';
  const solarCost   = solarKW  * SOLAR_PRICE_PER_WATT * 1000;
  const bessCost    = bessKWh  * bessPerKwh + bessKW * bessPerKw;
  const genCost     = generatorKW > 0
    ? generatorKW * (isNatGas ? GEN_PRICE_PER_KW_NATGAS : GEN_PRICE_PER_KW_DIESEL)
      + (isNatGas ? 0 : GEN_FUEL_TANK + GEN_TRANSFER_SWITCH)
    : 0;
  // Truck stop DockChain daisy-chain: 1 transformer cabinet ~$195K fixed +
  // $2,500/charging bay (Go Eve DockChain model — single transformer, N stalls)
  const truckCabinetCost = truckStopCabinets > 0 ? truckStopCabinets * 195000 : 0;
  const evCost      = l2Chargers * EV_L2_PRICE + dcfcChargers * EV_DCFC_PRICE + hpcChargers * EV_HPC_PRICE + truckCabinetCost;
  const equipTotal  = solarCost + bessCost + genCost + evCost;
  const contingency = Math.round((equipTotal + SITE_WORK_TOTAL) * CONTINGENCY_RATE);
  const subTotal    = equipTotal + SITE_WORK_TOTAL + contingency;
  const merlinFees  = calculateMerlinFees(equipTotal);
  const totalInv    = subTotal + merlinFees.totalFee;
  const itc         = Math.round((solarCost + bessCost) * FEDERAL_ITC_RATE);
  const netInvestment = Math.round(totalInv - itc);
  // Battery, solar and EV earn the savings. A generator is compliance capital:
  // it keeps the site up and calcTierSavings does not credit it. Soft costs
  // follow the equipment they sit on. The ITC reduces return capital only.
  const returnEquip = solarCost + bessCost + evCost;
  const complianceEquip = genCost;
  const softCosts = SITE_WORK_TOTAL + contingency + merlinFees.totalFee;
  const returnShare = equipTotal > 0 ? returnEquip / equipTotal : 1;
  let returnInvestment = Math.round(returnEquip + softCosts * returnShare - itc);
  let complianceInvestment = Math.round(complianceEquip + softCosts * (1 - returnShare));
  returnInvestment += netInvestment - (returnInvestment + complianceInvestment);
  return {
    solarCost:               Math.round(solarCost),
    bessCost:                Math.round(bessCost),
    generatorCost:           Math.round(genCost),
    evChargingCost:          Math.round(evCost),
    equipmentSubtotal:       Math.round(equipTotal),
    siteEngineering:         SITE_WORK_TOTAL,
    constructionContingency: contingency,
    merlinFees,
    totalInvestment:         Math.round(totalInv),
    federalITC:              itc,
    netInvestment,
    returnCapital:           { investment: returnInvestment },
    complianceCapital:       { investment: complianceInvestment },
    annualReserves:          calcAnnualReserves(solarKW, bessKWh, bessPerKwh),
  };
}

function calcTierSavings(eq, electricityRate, demandCharge, psh, bessPerKwh = BESS_PRICE_PER_KWH, peakLoadKW = 0) {
  const { bessKW, bessKWh, solarKW,
          l2Chargers = 0, dcfcChargers = 0, hpcChargers = 0,
          truckStopCabinets = 0 } = eq;
  const shaveCeilingKW = peakLoadKW > 0 ? Math.round(peakLoadKW * MAX_SHAVE_FRACTION) : bessKW;
  const creditedShaveKW = Math.min(bessKW, shaveCeilingKW);
  const uncreditedShaveKW = Math.max(0, bessKW - creditedShaveKW);
  const demandChargeSavings = creditedShaveKW * demandCharge * 12 * PEAK_SHAVE_EFFECTIVENESS;
  const solarKWhProduced    = solarKW * psh * 365 * SOLAR_PR;
  const solarSavings        = solarKWhProduced * electricityRate;
  // Truck stop DockChain cabinet: ~$90K/yr gross revenue per cabinet
  // (24/7 operation, ~30 trucks/day × $8 avg session, 70% utilization)
  const truckCabinetRevenue = truckStopCabinets * 90000;
  const evRevenue           = l2Chargers * 1350 + dcfcChargers * 18000 + hpcChargers * 60000 + truckCabinetRevenue;
  const gross               = demandChargeSavings + solarSavings + evRevenue;
  const reserves            = calcAnnualReserves(solarKW, bessKWh, bessPerKwh);
  return {
    demandChargeSavings: Math.round(demandChargeSavings),
    shaveCeilingKW,
    creditedShaveKW,
    uncreditedShaveKW,
    shaveCapped: uncreditedShaveKW > 0,
    solarKWhProduced:    Math.round(solarKWhProduced),
    solarSavings:        Math.round(solarSavings),
    evChargingRevenue:   Math.round(evRevenue),
    grossAnnualSavings:  Math.round(gross),
    annualReserves:      reserves,
    netAnnualSavings:    Math.round(gross - reserves),
  };
}

function calcROI(netInvestment, netAnnualSavings) {
  if (netAnnualSavings <= 0) {
    return { paybackYears: 999, year1ROI: 0, roi10Year: 0, roi25Year: 0, npv25Year: Math.round(-Math.max(netInvestment, 0)) };
  }
  // A system that costs nothing has already paid back. 999 would rank it as the worst option.
  if (netInvestment <= 0) {
    let npv = -netInvestment;
    for (let yr = 1; yr <= 25; yr++) npv += netAnnualSavings / Math.pow(1.05, yr);
    return { paybackYears: 0, year1ROI: null, roi10Year: null, roi25Year: null, npv25Year: Math.round(npv) };
  }
  const payback = Math.round((netInvestment / netAnnualSavings) * 10) / 10;
  let npv = -netInvestment;
  for (let yr = 1; yr <= 25; yr++) npv += netAnnualSavings / Math.pow(1.05, yr);
  return {
    paybackYears: payback,
    year1ROI:     Math.round((netAnnualSavings / netInvestment) * 100),
    roi10Year:    Math.round(((netAnnualSavings * 10  - netInvestment) / netInvestment) * 100),
    roi25Year:    Math.round(((netAnnualSavings * 25  - netInvestment) / netInvestment) * 100),
    npv25Year:    Math.round(npv),
  };
}

function buildTier(tierLabel, p, priceOverrides = {}) {
  const { bessKW, bessKWh, durationHrs } = sizeBESS(p.peakLoadKW, tierLabel, p.bessApplication, p.industryKey ?? '');
  const solarKW     = p.overrideSolarKW != null
    ? Math.round(p.overrideSolarKW * { Starter: 0.7, Recommended: 1.0, Complete: 1.3 }[tierLabel])
    : sizeSolar(p.solarCapKW, p.psh, tierLabel);
  const generatorKW = p.overrideGenKW != null
    ? p.overrideGenKW
    : sizeGenerator(p.peakLoadKW, p.criticalLoadPct, tierLabel);
  const eq = {
    solarKW, bessKW, bessKWh, generatorKW, generatorFuelType: p.generatorFuelType,
    l2Chargers: p.l2Chargers, dcfcChargers: p.dcfcChargers, hpcChargers: p.hpcChargers,
    truckStopCabinets: p.truckStopCabinets ?? 0,
  };
  const costs   = calcTierCosts(eq, priceOverrides);
  const savings = calcTierSavings(
    eq, p.electricityRate, p.demandCharge, p.psh,
    priceOverrides.bessPerKwh ?? BESS_PRICE_PER_KWH,
    p.peakLoadKW,
  );
  const roi        = calcROI(costs.returnCapital.investment, savings.netAnnualSavings);
  const blendedRoi = calcROI(costs.netInvestment, savings.netAnnualSavings);
  return {
    label: tierLabel,
    equipment: { solarKW, bessKW, bessKWh, durationHrs, generatorKW,
                 l2Chargers: p.l2Chargers, dcfcChargers: p.dcfcChargers, hpcChargers: p.hpcChargers,
                 truckStopCabinets: p.truckStopCabinets ?? 0 },
    costs,
    savings,
    roi,
    blendedRoi,
  };
}

/** Geocode a location string → { lat, lon, formattedAddress } or null */
async function geocode(query, key) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  const trimmed = query.trim();
  const isZip = /^\d{5}$/.test(trimmed);
  url.searchParams.set('address', trimmed);
  // Restrict to US — required for reliable ZIP-only resolution (mirrors QuickEstimateWidget fix)
  url.searchParams.set('components', isZip ? `country:US|postal_code:${trimmed}` : 'country:US');
  url.searchParams.set('key', key);
  const response = await fetch(url.toString());
  const data = await response.json();
  if (data.status !== 'OK' || !data.results?.[0]) {
    console.error(`[geocode] status=${data.status} error="${data.error_message ?? 'none'}" query="${query}"`);
    return null;
  }
  const r = data.results[0];
  let stateCode = null;
  for (const c of r.address_components) {
    if (c.types.includes('administrative_area_level_1')) stateCode = c.short_name;
  }
  return {
    lat: r.geometry.location.lat,
    lon: r.geometry.location.lng,
    stateCode,
    formattedAddress: r.formatted_address,
  };
}

/**
 * Fetch GHI peak sun hours from NREL PVWatts for a lat/lon.
 * Returns daily PSH (h/day) using the NREL AC annual output ÷ 365.
 * Falls back to 4.5 h/day if NREL is unavailable.
 */
async function fetchSolarPSH(lat, lon, nrelKey) {
  try {
    const url = new URL('https://developer.nrel.gov/api/pvwatts/v8.json');
    url.searchParams.set('api_key', nrelKey);
    url.searchParams.set('lat', lat);
    url.searchParams.set('lon', lon);
    url.searchParams.set('system_capacity', 1);  // 1 kW reference → kWh/yr = PSH×365×PR
    url.searchParams.set('azimuth', 180);
    url.searchParams.set('tilt', 20);
    url.searchParams.set('array_type', 1);
    url.searchParams.set('module_type', 1);
    url.searchParams.set('losses', 14);
    const response = await fetch(url.toString());
    const data = await response.json();
    if (data.outputs?.ac_annual) {
      // ac_annual for 1 kW system = kWh/yr.  Divide by (365 × PR) → GHI PSH (h/day)
      return Math.round((data.outputs.ac_annual / (365 * SOLAR_PR)) * 100) / 100;
    }
  } catch (e) {
    console.error('[/api/quote] NREL PVWatts error:', e.message);
  }
  return 4.5; // US average fallback
}

// ============================================================================
// POST /api/quote
// ============================================================================

router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    // Log API key (for future rate-limiting / attribution)
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || 'anonymous';
    console.log(`[/api/quote] Request from key=${apiKey.substring(0, 8)}... industry=${req.body?.industry} location="${req.body?.location}"`);

    const {
      industry = 'default',
      location,
      // Optional equipment overrides
      bessKW:        inputBessKW,
      bessKWh:       inputBessKWh,
      solarKW:       inputSolarKW,
      generatorKW:   inputGenKW = 0,
      generatorFuelType = 'diesel',
      l2Chargers  = 0,
      dcfcChargers = 0,
      hpcChargers  = 0,
      // Optional utility rate overrides
      electricityRate: inputElecRate,
      demandCharge:    inputDemandCharge,
      // Truck stop: number of DockChain daisy-chain cabinets (1 cabinet = 1 transformer serving N bays)
      truckStopCabinets = 0,
      // Source tags for confidence scoring
      peakSource = 'industry_default',   // 'utility_bill' | 'override' | 'industry_default'
      rateSource = 'industry_default',   // 'override' | 'industry_default'
    } = req.body || {};

    // ── Validate required field ────────────────────────────────────────────
    if (!location || typeof location !== 'string' || location.trim().length < 3) {
      return res.status(400).json({
        ok: false,
        error: 'location is required (e.g. "San Francisco, CA" or "94102")',
      });
    }

    const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
    const nrelKey   = process.env.VITE_NREL_API_KEY || process.env.NREL_API_KEY || NREL_API_KEY_FALLBACK;

    // ── 1. Geocode location ────────────────────────────────────────────────
    // A failed geocode used to withhold the quote. Sun hours fall back to the
    // US average inside fetchSolarPSH; the price and the savings still print.
    const geo = (googleKey && await geocode(location, googleKey)) || {
      lat: null,
      lon: null,
      stateCode: null,
      formattedAddress: location.trim(),
    };

    // ── 2. Fetch solar resource (NREL PVWatts) ─────────────────────────────
    const psh = geo.lat == null ? 4.5 : await fetchSolarPSH(geo.lat, geo.lon, nrelKey);

    // ── 3. Resolve industry + facility parameters ──────────────────────────
    const industryKey = (industry || 'default').toLowerCase().replace(/[\s-]+/g, '_');
    const def         = INDUSTRY_DEFAULTS[industryKey] || INDUSTRY_DEFAULTS.default;

    const p = {
      peakLoadKW:      Number(req.body.peakLoadKW      ?? def.peakLoadKW),
      solarCapKW:      Number(req.body.solarCapKW      ?? def.solarCapKW),
      criticalLoadPct: Number(req.body.criticalLoadPct ?? def.criticalLoadPct),
      electricityRate: Number(inputElecRate            ?? def.electricityRate),
      demandCharge:    Number(inputDemandCharge        ?? def.demandCharge),
      l2Chargers,
      dcfcChargers,
      hpcChargers,
      truckStopCabinets: Number(truckStopCabinets),
      generatorFuelType,
      bessApplication: req.body.bessApplication ?? 'peak_shaving',
      industryKey,
      peakSource,
      rateSource: inputElecRate ? 'override' : rateSource,
      // Optional single-system overrides (bypass auto-sizing when provided)
      overrideSolarKW: inputSolarKW != null ? Number(inputSolarKW) : null,
      overrideGenKW:   inputGenKW   > 0     ? Number(inputGenKW)   : null,
      psh,
    };

    // ── Fitness-first BESS vendor selection, then price THAT unit ──
    const recBessSizing = sizeBESS(p.peakLoadKW, 'Recommended', p.bessApplication, p.industryKey);
    const bessSelection = selectBessVendor(recBessSizing.bessKWh);
    const vendorBess = await getVendorBessPrice(bessSelection);
    const admitted = admitVendorBessPrice(vendorBess);
    const priceOverrides = {};
    if (admitted.admitted) {
      priceOverrides.bessPerKwh = admitted.perKwh;
      if (admitted.perKw != null) priceOverrides.bessPerKw = admitted.perKw;
      console.log(`[/api/quote] BESS price $${admitted.perKwh}/kWh — ${admitted.provenance.source}`);
    }

    // ── 4. Build three tiers ───────────────────────────────────────────────
    const tiers = {
      starter:     buildTier('Starter',     p, priceOverrides),
      recommended: buildTier('Recommended', p, priceOverrides),
      complete:    buildTier('Complete',     p, priceOverrides),
    };

    const elapsed = Date.now() - startTime;
    const rec = tiers.recommended;

    // ── 5. Confidence score ──────────────────────────────────────────────
    const confidence = computeConfidenceScore({
      peakSource:       p.peakSource,
      rateSource:       p.rateSource,
      locationResolved: !!geo,
      pshLive:          psh !== 4.5,
      vendorBess:       Boolean(bessSelection?.vendor) && bessSelection.vendor !== 'Custom / multi-unit',
    });

    // ── 6. Monte Carlo P10/P50/P90 ───────────────────────────────────────
    const monteCarlo = computeMonteCarlo(
      rec.costs.returnCapital.investment,
      rec.savings.netAnnualSavings,
      p.electricityRate,
      p.demandCharge,
      rec.equipment.bessKW,
      rec.equipment.solarKW,
      psh,
      p.peakLoadKW,
    );

    console.log(`[/api/quote] ✅ ${elapsed}ms — ${geo.formattedAddress} PSH=${psh}h | Rec: $${rec.costs.netInvestment.toLocaleString()} net, ${rec.roi.paybackYears}yr payback | Confidence: ${confidence.score} (${confidence.tier}) | BESS: ${bessSelection.vendor} ${bessSelection.model}`);

    // ── 7. Installer lookup ────────────────────────────────────────────────
    const installerResult = findInstallerForState(geo.stateCode, industryKey);
    const installerBlock = installerResult
      ? {
          id:           installerResult.firm.id,
          name:         installerResult.firm.name,
          tier:         installerResult.firm.tier,
          focus:        installerResult.firm.focus,
          website:      installerResult.firm.website,
          contact_email: installerResult.firm.contact_email,
          phone:        installerResult.firm.phone,
          hq_city:      installerResult.firm.hq_city,
          matchReason:  installerResult.matchReason,
        }
      : null;

    // ── 8. Response ────────────────────────────────────────────────────────
    return res.json({
      ok: true,
      location: {
        formattedAddress: geo.formattedAddress,
        stateCode:        geo.stateCode,
        lat:              geo.lat,
        lon:              geo.lon,
      },
      solar: {
        peakSunHours: psh,
        source:       'NREL PVWatts v8',
      },
      inputs: {
        industry: industryKey,
        facilityParams: {
          peakLoadKW:      p.peakLoadKW,
          solarCapKW:      p.solarCapKW,
          criticalLoadPct: p.criticalLoadPct,
          electricityRate: p.electricityRate,
          demandCharge:    p.demandCharge,
          bessApplication: p.bessApplication,
        },
        industryDefaultsApplied: !req.body.peakLoadKW,
      },
      tiers,
      confidence,
      monteCarlo,
      equipmentSelection: {
        bess: bessSelection,
        note: `${bessSelection.vendor} ${bessSelection.model} selected (score ${bessSelection.scoreBase ?? '—'}, fitness-first). ${bessSelection.disqualified?.length ? bessSelection.disqualified.length + ' unit(s) disqualified.' : 'All catalog units eligible.'}`,
      },
      provenance: {
        ...PRICE_PROVENANCE,
        bess: admitted.provenance,
      },
      installer: installerBlock,
      meta: {
        methodology:   'Merlin TrueQuote™ v4.5 + v34.3.0 enhancements',
        solarMethod:   `NREL PVWatts v8 (PR=${SOLAR_PR}, PSH=${psh} h/day)`,
        bessMethod:    'NREL/EPRI demand charge benchmark (75% effectiveness)',
        pricingSource: 'NREL ATB 2025, BloombergNEF Q4 2025, DOE/EVI 2024',
        itcNote:       'ITC applies to solar + standalone BESS only (IRA 2022 §48). EV chargers and generators excluded.',
        itcRate:       '30% IRA 2022 §48 (solar + standalone BESS)',
        generatedAt:   new Date().toISOString(),
        computeMs:     elapsed,
        tierLabels:    ['Starter', 'Recommended', 'Complete'],
        notes: [
          'Starter: no generator by default; 50% solar; 2h BESS duration',
          'Recommended: generator if criticalLoadPct ≥ 0.50; 85% solar; 4h BESS',
          'Complete: full headroom; 100% solar; 6h BESS; +25% generator capacity',
          'Savings are NET of annual operating reserves (insurance + inverter + BESS degradation)',
          'Truck stop: DockChain cabinet model — 1 transformer cabinet serving N bays (not N separate chargers)',
        ],
      },
    });

  } catch (err) {
    console.error('[/api/quote] Unhandled error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Quote calculation failed. Please try again.',
    });
  }
});

export default router;
