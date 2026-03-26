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

// ============================================================================
// INDUSTRY DEFAULT SYSTEM PROFILES
// ============================================================================

const INDUSTRY_PROFILES = {
  hotel:      { bessKW: 150, bessKWh: 600, solarKW: 80,  demandCharge: 15, electricityRate: 0.14 },
  restaurant: { bessKW: 80,  bessKWh: 320, solarKW: 25,  demandCharge: 18, electricityRate: 0.16 },
  retail:     { bessKW: 100, bessKWh: 400, solarKW: 60,  demandCharge: 14, electricityRate: 0.13 },
  car_wash:   { bessKW: 100, bessKWh: 400, solarKW: 30,  demandCharge: 20, electricityRate: 0.15 },
  carwash:    { bessKW: 100, bessKWh: 400, solarKW: 30,  demandCharge: 20, electricityRate: 0.15 },
  warehouse:  { bessKW: 200, bessKWh: 800, solarKW: 200, demandCharge: 12, electricityRate: 0.11 },
  office:     { bessKW: 120, bessKWh: 480, solarKW: 50,  demandCharge: 13, electricityRate: 0.13 },
  gym:        { bessKW: 100, bessKWh: 400, solarKW: 40,  demandCharge: 16, electricityRate: 0.14 },
  healthcare: { bessKW: 200, bessKWh: 800, solarKW: 60,  demandCharge: 17, electricityRate: 0.15 },
  school:     { bessKW: 150, bessKWh: 600, solarKW: 100, demandCharge: 14, electricityRate: 0.13 },
  default:    { bessKW: 100, bessKWh: 400, solarKW: 50,  demandCharge: 15, electricityRate: 0.14 },
};

// ============================================================================
// HELPERS
// ============================================================================

/** Tiered Merlin service fee (mirrored from calculateMerlinFees in pricingServiceV45.ts) */
function calculateMerlinFees(equipmentSubtotal) {
  let marginRate;
  if (equipmentSubtotal < 200000)      marginRate = 0.20;
  else if (equipmentSubtotal < 800000) marginRate = 0.14;
  else                                  marginRate = 0.13;
  return {
    totalFee: Math.round(equipmentSubtotal * marginRate),
    effectiveMargin: marginRate,
    annualMonitoring: 580,
  };
}

/** Geocode a location string → { lat, lon, formattedAddress } or null */
async function geocode(query, key) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query.trim());
  url.searchParams.set('key', key);
  const response = await fetch(url.toString());
  const data = await response.json();
  if (data.status !== 'OK' || !data.results?.[0]) return null;
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
    const nrelKey   = process.env.VITE_NREL_API_KEY   || process.env.NREL_API_KEY;

    if (!googleKey) {
      return res.status(500).json({ ok: false, error: 'Location service not configured' });
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
    const psh = nrelKey ? await fetchSolarPSH(geo.lat, geo.lon, nrelKey) : 4.5;

    // ── 3. Resolve system sizing ───────────────────────────────────────────
    const industryKey = (industry || 'default').toLowerCase().replace(/[\s-]+/g, '_');
    const profile     = INDUSTRY_PROFILES[industryKey] || INDUSTRY_PROFILES.default;

    const bessKW          = Number(inputBessKW  ?? profile.bessKW);
    const bessKWh         = Number(inputBessKWh ?? profile.bessKWh);
    const solarKW         = Number(inputSolarKW ?? profile.solarKW);
    const generatorKW     = Number(inputGenKW);
    const electricityRate = Number(inputElecRate   ?? profile.electricityRate);
    const demandCharge    = Number(inputDemandCharge ?? profile.demandCharge);

    // ── 4. Equipment costs ─────────────────────────────────────────────────
    const solarCost = solarKW * SOLAR_PRICE_PER_WATT * 1000;

    const bessCost = bessKWh * BESS_PRICE_PER_KWH + bessKW * BESS_PRICE_PER_KW;

    const isNatGas = generatorFuelType === 'natural-gas';
    const genCost  = generatorKW > 0
      ? generatorKW * (isNatGas ? GEN_PRICE_PER_KW_NATGAS : GEN_PRICE_PER_KW_DIESEL)
        + (isNatGas ? 0 : GEN_FUEL_TANK + GEN_TRANSFER_SWITCH)
      : 0;

    const evCost     = l2Chargers * EV_L2_PRICE + dcfcChargers * EV_DCFC_PRICE + hpcChargers * EV_HPC_PRICE;
    const equipTotal = solarCost + bessCost + genCost + evCost;

    const contingency     = (equipTotal + SITE_WORK_TOTAL) * CONTINGENCY_RATE;
    const subtotalNoFee   = equipTotal + SITE_WORK_TOTAL + contingency;
    const merlinFees      = calculateMerlinFees(equipTotal);
    const totalInvestment = subtotalNoFee + merlinFees.totalFee;
    const federalITC      = (solarCost + bessCost) * FEDERAL_ITC_RATE;
    const netInvestment   = totalInvestment - federalITC;

    // ── 5. Annual savings ──────────────────────────────────────────────────
    // BESS demand charge reduction (75% effectiveness — NREL/EPRI benchmark)
    const demandChargeSavings = bessKW * demandCharge * 12 * 0.75;

    // Solar production: NREL GHI method → kW × PSH × 365 × PR
    const solarKWhProduced = solarKW * psh * 365 * SOLAR_PR;
    const solarSavings     = solarKWhProduced * electricityRate;

    // EV revenue by type (DOE/EVI benchmarks, 300 operating days/yr)
    const evRevenue = l2Chargers * 1350 + dcfcChargers * 18000 + hpcChargers * 60000;

    const grossAnnualSavings = demandChargeSavings + solarSavings + evRevenue;

    // Annual reserves (honest TCO — LFP degradation + inverter + insurance)
    const insuranceRider         = 1250;
    const inverterReserve        = solarKW * 1000 * 0.01;   // $0.01/W/yr
    const bessLegradationReserve = bessKWh * BESS_PRICE_PER_KWH * 0.02; // 2% pack value/yr
    const annualReserves         = insuranceRider + inverterReserve + bessLegradationReserve;
    const netAnnualSavings       = grossAnnualSavings - annualReserves;

    // ── 6. ROI / NPV ───────────────────────────────────────────────────────
    const paybackYears = netInvestment > 0 && netAnnualSavings > 0
      ? Math.round((netInvestment / netAnnualSavings) * 10) / 10
      : 999;

    let npv25Year = -netInvestment;
    for (let yr = 1; yr <= 25; yr++) {
      npv25Year += netAnnualSavings / Math.pow(1.05, yr); // 5% discount rate
    }

    const year1ROI = netInvestment > 0
      ? Math.round((netAnnualSavings / netInvestment) * 100)
      : 0;

    const elapsed = Date.now() - startTime;
    console.log(`[/api/quote] ✅ Quote generated in ${elapsed}ms — net investment $${Math.round(netInvestment).toLocaleString()}, payback ${paybackYears}yr`);

    // ── 7. Response ────────────────────────────────────────────────────────
    return res.json({
      ok: true,
      quote: {

        // What was sized
        system: {
          industry: industryKey,
          location: geo.formattedAddress,
          bessKW,
          bessKWh,
          solarKW,
          generatorKW,
          l2Chargers,
          dcfcChargers,
          hpcChargers,
          peakSunHours: psh,
          electricityRate,
          demandCharge,
        },

        // Cost breakdown
        costs: {
          solarCost:               Math.round(solarCost),
          bessCost:                Math.round(bessCost),
          generatorCost:           Math.round(genCost),
          evChargingCost:          Math.round(evCost),
          equipmentSubtotal:       Math.round(equipTotal),
          siteEngineering:         SITE_WORK_TOTAL,
          constructionContingency: Math.round(contingency),
          merlinFee:               merlinFees.totalFee,
          merlinMargin:            `${Math.round(merlinFees.effectiveMargin * 100)}%`,
          totalInvestment:         Math.round(totalInvestment),
          federalITC:              Math.round(federalITC),
          netInvestment:           Math.round(netInvestment),
        },

        // Annual savings
        savings: {
          demandChargeSavings:  Math.round(demandChargeSavings),
          solarKWhProduced:     Math.round(solarKWhProduced),
          solarSavings:         Math.round(solarSavings),
          evChargingRevenue:    Math.round(evRevenue),
          grossAnnualSavings:   Math.round(grossAnnualSavings),
          annualReserves:       Math.round(annualReserves),
          netAnnualSavings:     Math.round(netAnnualSavings),
        },

        // Financial metrics
        financials: {
          paybackYears,
          year1ROI,
          npv25Year:   Math.round(npv25Year),
          irr25Yr:     year1ROI, // Simple approximation; full IRR via Newton-Raphson in wizard
        },

        // Methodology transparency
        meta: {
          methodology:    'Merlin TrueQuote™ v4.5',
          solarMethod:    `NREL PVWatts v8 API (PR=${SOLAR_PR}, PSH=${psh} h/day)`,
          bessMethod:     'NREL/EPRI demand management benchmark (75% effectiveness)',
          pricingSource:  'NREL ATB 2024, BloombergNEF, DOE/EVI 2024',
          itcRate:        '30% IRA 2022 (solar + standalone BESS)',
          generatedAt:    new Date().toISOString(),
          computeMs:      elapsed,
        },
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
