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
  car_wash:      { peakLoadKW: 450,  solarCapKW: 120,  criticalLoadPct: 0.80, electricityRate: 0.13, demandCharge: 20 },
  carwash:       { peakLoadKW: 450,  solarCapKW: 120,  criticalLoadPct: 0.80, electricityRate: 0.13, demandCharge: 20 },
  warehouse:     { peakLoadKW: 400,  solarCapKW: 819,  criticalLoadPct: 0.30, electricityRate: 0.10, demandCharge: 12 },
  office:        { peakLoadKW: 200,  solarCapKW: 150,  criticalLoadPct: 0.40, electricityRate: 0.12, demandCharge: 15 },
  gym:           { peakLoadKW: 150,  solarCapKW: 60,   criticalLoadPct: 0.30, electricityRate: 0.13, demandCharge: 15 },
  healthcare:    { peakLoadKW: 1500, solarCapKW: 375,  criticalLoadPct: 0.90, electricityRate: 0.13, demandCharge: 20 },
  hospital:      { peakLoadKW: 1500, solarCapKW: 375,  criticalLoadPct: 0.90, electricityRate: 0.13, demandCharge: 20 },
  school:        { peakLoadKW: 200,  solarCapKW: 200,  criticalLoadPct: 0.40, electricityRate: 0.12, demandCharge: 13 },
  manufacturing: { peakLoadKW: 800,  solarCapKW: 450,  criticalLoadPct: 0.50, electricityRate: 0.10, demandCharge: 14 },
  default:       { peakLoadKW: 300,  solarCapKW: 100,  criticalLoadPct: 0.40, electricityRate: 0.12, demandCharge: 15 },
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
function calcAnnualReserves(solarKW, bessKWh) {
  return Math.round(
    1250                          // insurance rider
    + solarKW  * 1000 * 0.01     // inverter reserve ($10/kW/yr)
    + bessKWh  * BESS_PRICE_PER_KWH * 0.02  // BESS degradation reserve (2% pack/yr)
  );
}

// ── Vendor pricing lookup (queries equipment_pricing via Supabase REST) ───────
/**
 * Returns the lowest approved vendor BESS price from equipment_pricing,
 * or null if none is found or Supabase is not configured.
 * Uses fetch() — no extra dependency needed.
 */
async function getVendorBessPrice() {
  const sbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return null;

  try {
    const res = await fetch(
      `${sbUrl}/rest/v1/equipment_pricing?equipment_type=eq.battery&order=price_per_kwh.asc&limit=1` +
        `&select=price_per_kwh,price_per_kw,manufacturer,model`,
      {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          Accept: 'application/json',
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] ?? null; // { price_per_kwh, price_per_kw, manufacturer, model }
  } catch {
    return null;
  }
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
  const evCost      = l2Chargers * EV_L2_PRICE + dcfcChargers * EV_DCFC_PRICE + hpcChargers * EV_HPC_PRICE;
  const equipTotal  = solarCost + bessCost + genCost + evCost;
  const contingency = Math.round((equipTotal + SITE_WORK_TOTAL) * CONTINGENCY_RATE);
  const subTotal    = equipTotal + SITE_WORK_TOTAL + contingency;
  const merlinFees  = calculateMerlinFees(equipTotal);
  const totalInv    = subTotal + merlinFees.totalFee;
  const itc         = Math.round((solarCost + bessCost) * FEDERAL_ITC_RATE);
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
    netInvestment:           Math.round(totalInv - itc),
    annualReserves:          calcAnnualReserves(solarKW, bessKWh),
  };
}

function calcTierSavings(eq, electricityRate, demandCharge, psh) {
  const { bessKW, bessKWh, solarKW,
          l2Chargers = 0, dcfcChargers = 0, hpcChargers = 0 } = eq;
  const demandChargeSavings = bessKW * demandCharge * 12 * 0.75;
  const solarKWhProduced    = solarKW * psh * 365 * SOLAR_PR;
  const solarSavings        = solarKWhProduced * electricityRate;
  const evRevenue           = l2Chargers * 1350 + dcfcChargers * 18000 + hpcChargers * 60000;
  const gross               = demandChargeSavings + solarSavings + evRevenue;
  const reserves            = calcAnnualReserves(solarKW, bessKWh);
  return {
    demandChargeSavings: Math.round(demandChargeSavings),
    solarKWhProduced:    Math.round(solarKWhProduced),
    solarSavings:        Math.round(solarSavings),
    evChargingRevenue:   Math.round(evRevenue),
    grossAnnualSavings:  Math.round(gross),
    annualReserves:      reserves,
    netAnnualSavings:    Math.round(gross - reserves),
  };
}

function calcROI(netInvestment, netAnnualSavings) {
  if (netInvestment <= 0 || netAnnualSavings <= 0) {
    return { paybackYears: 999, year1ROI: 0, roi10Year: 0, roi25Year: 0, npv25Year: Math.round(-netInvestment) };
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
  };
  const costs   = calcTierCosts(eq, priceOverrides);
  const savings = calcTierSavings(eq, p.electricityRate, p.demandCharge, p.psh);
  const roi     = calcROI(costs.netInvestment, savings.netAnnualSavings);
  return {
    label: tierLabel,
    equipment: { solarKW, bessKW, bessKWh, durationHrs, generatorKW,
                 l2Chargers: p.l2Chargers, dcfcChargers: p.dcfcChargers, hpcChargers: p.hpcChargers },
    costs,
    savings,
    roi,
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

    if (!googleKey) {
      return res.status(500).json({ ok: false, error: 'Location service not configured' });
    }

    // ── 0. Fetch vendor BESS pricing (non-blocking — falls back to constants) ──
    const vendorBess = await getVendorBessPrice();
    const priceOverrides = {};
    if (vendorBess?.price_per_kwh) {
      const vendorPerKwh = Number(vendorBess.price_per_kwh);
      // Only apply if vendor price is cheaper than our default constant
      if (vendorPerKwh > 0 && vendorPerKwh < BESS_PRICE_PER_KWH) {
        priceOverrides.bessPerKwh = vendorPerKwh;
        if (vendorBess.price_per_kw) priceOverrides.bessPerKw = Number(vendorBess.price_per_kw);
        console.log(
          `[/api/quote] 🏷️  Using vendor BESS price: $${vendorPerKwh}/kWh` +
          ` from ${vendorBess.manufacturer ?? 'vendor'} (default: $${BESS_PRICE_PER_KWH}/kWh)`
        );
      }
    }

    // ── 1. Geocode location ────────────────────────────────────────────────
    const geo = await geocode(location, googleKey);
    if (!geo) {
      return res.status(400).json({
        ok: false,
        error: `Could not geocode "${location}". Try a city+state or ZIP code.`,
      });
    }

    // ── 2. Fetch solar resource (NREL PVWatts) ─────────────────────────────
    const psh = await fetchSolarPSH(geo.lat, geo.lon, nrelKey);

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
      generatorFuelType,
      bessApplication: req.body.bessApplication ?? 'peak_shaving',
      industryKey,
      // Optional single-system overrides (bypass auto-sizing when provided)
      overrideSolarKW: inputSolarKW != null ? Number(inputSolarKW) : null,
      overrideGenKW:   inputGenKW   > 0     ? Number(inputGenKW)   : null,
      psh,
    };

    // ── 4. Build three tiers ───────────────────────────────────────────────
    const tiers = {
      starter:     buildTier('Starter',     p, priceOverrides),
      recommended: buildTier('Recommended', p, priceOverrides),
      complete:    buildTier('Complete',     p, priceOverrides),
    };

    const elapsed = Date.now() - startTime;
    const rec = tiers.recommended;
    console.log(`[/api/quote] ✅ ${elapsed}ms — ${geo.formattedAddress} PSH=${psh}h | Rec: $${rec.costs.netInvestment.toLocaleString()} net, ${rec.roi.paybackYears}yr payback`);

    // ── 5. Response ────────────────────────────────────────────────────────
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
      meta: {
        methodology:   'Merlin TrueQuote™ v4.5',
        solarMethod:   `NREL PVWatts v8 (PR=${SOLAR_PR}, PSH=${psh} h/day)`,
        bessMethod:    'NREL/EPRI demand charge benchmark (75% effectiveness)',
        pricingSource: 'NREL ATB 2024, BloombergNEF, DOE/EVI 2024',
        itcRate:       '30% IRA 2022 §48 (solar + standalone BESS)',
        generatedAt:   new Date().toISOString(),
        computeMs:     elapsed,
        tierLabels:    ['Starter', 'Recommended', 'Complete'],
        notes: [
          'Starter: no generator by default; 50% solar; 2h BESS duration',
          'Recommended: generator if criticalLoadPct ≥ 0.50; 85% solar; 4h BESS',
          'Complete: full headroom; 100% solar; 6h BESS; +25% generator capacity',
          'Savings are NET of annual operating reserves (insurance + inverter + BESS degradation)',
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
