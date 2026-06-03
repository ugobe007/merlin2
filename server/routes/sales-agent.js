/**
 * SALES AGENT — Prospect Discovery, Auto-Quote, Outreach
 * ========================================================
 * 
 * POST /api/sales-agent/discover
 *   Scrapes Google Places for car washes / EV charging / truck stops in a
 *   given city/state, enriches each record, stores in smb_leads, and (if
 *   requested) fires the quote + email pipeline.
 *
 *   Body: {
 *     location: "Las Vegas, NV",
 *     verticals: ["car_wash", "ev_charging", "truck_stop"],  // optional, default all
 *     autoQuote: true,   // generate a pre-built quote for each prospect
 *     autoEmail: false,  // send intro email (requires autoQuote=true)
 *     maxPerVertical: 20 // default 20
 *   }
 *
 * POST /api/sales-agent/quote/:leadId
 *   Regenerate / force a quote for a specific smb_lead.
 *
 * POST /api/sales-agent/email/:leadId
 *   Send (or resend) the intro email for a specific smb_lead.
 *
 * GET /api/sales-agent/leads
 *   List smb_leads with status summary.
 *
 * Created: April 2026
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

const router = express.Router();

// ── Clients (lazy-init — env vars not available at module parse time) ─────────
let _supabase = null;
let _resend = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    _resend = new Resend(key || 'placeholder');
  }
  return _resend;
}

function getGoogleMapsKey() {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
}
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://merlinenergy.net';
const FROM_EMAIL = 'StackQuote by Merlin <hello@merlin.energy>';
const REPLY_EMAIL = 'sales@merlinenergy.net';
const BOOKING_MAILTO = `mailto:sales@merlinenergy.net?subject=${encodeURIComponent('Let\u2019s schedule a call — StackQuote by Merlin')}&body=${encodeURIComponent('Hi,\n\nI\u2019d love to walk through my energy savings analysis. Please let me know a few times that work for a 20-minute call.\n\nThanks,')}`;

// ── Vertical → Google Places search config ───────────────────────────────────
const VERTICAL_CONFIG = {
  car_wash: {
    query: 'car wash',
    type: 'car_wash',
    industry: 'car_wash',
    label: 'Car Wash',
    peakLoadKW: 450,
    emailSubjectHook: 'Your {{name}} energy costs — we ran the numbers',
    emailBodyHook: 'Car wash facilities typically pay $18–$22/kW in demand charges — we modeled your location.',
  },
  ev_charging: {
    query: 'EV charging station electric vehicle charging',
    type: 'electric_vehicle_charging_station',
    industry: 'ev_charging',
    label: 'EV Charging Station',
    peakLoadKW: 600,
    quoteParams: { dcfcChargers: 2, bessApplication: 'peak_shaving' },
    emailSubjectHook: 'Free BESS analysis for {{name}}',
    emailBodyHook: 'EV charging demand spikes are the #1 cost driver for operators. We pre-built a savings model for your location.',
  },
  truck_stop: {
    query: 'truck stop travel center Loves Flying J Pilot',
    type: 'gas_station',
    industry: 'truck_stop',
    label: 'Truck Stop / Travel Center',
    peakLoadKW: 800,
    quoteParams: { truckStopCabinets: 1, bessApplication: 'peak_shaving' },
    emailSubjectHook: '{{name}} — energy savings analysis (pre-built)',
    emailBodyHook: 'Truck stops and travel centers are prime candidates for solar + BESS. We modeled your facility.',
  },
  hotel: {
    query: 'hotel',
    type: 'lodging',
    industry: 'hotel',
    label: 'Hotel',
    peakLoadKW: 500,
    emailSubjectHook: '{{name}} — your energy savings opportunity',
    emailBodyHook: 'Hotels rank in the top 3 commercial building types for solar + BESS ROI. We ran your numbers.',
  },
};

// ── Daily Deal Agent intelligence reused for prospect outreach ──────────────
// Mirrors the promotional voice from agents/daily-deal.ts: fact → pain point →
// proof → TrueQuote CTA. Keep this server-side so Sales Agent emails can use it
// without importing TypeScript agent code into the production Express runtime.
const PROMO_OUTREACH_INTEL = {
  car_wash: {
    driver: 'compressors, dryers, pumps, and conveyor motors spike during rush periods',
    context: 'Tunnel car washes often draw 400–800 kW in short bursts — and that single peak can set your demand charge for the entire billing month.',
    painPoint: 'Most operators are paying a premium for 15 minutes of load. A storage layer eliminates that exposure.',
    subject: '{{name}} — your Energy Stack analysis is ready',
  },
  ev_charging: {
    driver: 'fast chargers add peak demand the moment a vehicle plugs in — storage buffers that spike before it hits the meter',
    context: 'Ten 150 kW fast chargers look like a small factory to the utility. Without storage, every session is a demand event.',
    painPoint: 'The right storage layer can cut demand charges 40–60% and remove transformer-upgrade pressure as you scale.',
    subject: '{{name}} — Energy Stack model for your charging network',
  },
  truck_stop: {
    driver: 'fuel pumps, refrigeration, restaurant, HVAC, lighting, and EV charging all land on one meter',
    context: 'Travel centers are becoming full energy hubs — and the stacked load profile creates significant demand exposure.',
    painPoint: 'Operators who build a storage layer now are locking in rates before utility interconnection rules tighten.',
    subject: '{{name}} — Energy Stack analysis for your travel center',
  },
  hotel: {
    driver: 'HVAC, laundry, kitchen, and pool loads peak simultaneously during high-occupancy periods',
    context: 'Hotels sit in the top tier of commercial demand-charge exposure — and carry dual exposure to both peak demand and evening TOU rates.',
    painPoint: 'A coordinated Energy Stack — storage + solar + demand response — can address both in a single capital project.',
    subject: '{{name}} — your Energy Stack quote is ready',
  },
  manufacturing: {
    driver: 'production line startup, HVAC, compressors, and process equipment create predictable demand spikes',
    context: 'Manufacturing facilities at this scale typically carry $200K–$1.5M/yr in combined demand-charge and utility exposure.',
    painPoint: 'An Energy Stack modeled to your shift schedule can cut that exposure without touching production.',
    subject: '{{name}} — Energy Stack analysis for your facility',
  },
  data_center: {
    driver: 'UPS systems, cooling, and compute load run 24/7 with no margin for interruption',
    context: 'Data centers face $1M+ annual utility exposure — and resilience requirements that most storage configurations can satisfy simultaneously.',
    painPoint: 'A co-located BESS layer cuts costs and replaces legacy UPS infrastructure in a single asset.',
    subject: '{{name}} — power resilience + Energy Stack model',
  },
  logistics: {
    driver: 'dock equipment, refrigeration, lighting, and EV fleet charging create overlapping demand windows',
    context: 'Warehouse and distribution centers are among the strongest candidates for solar + demand-charge storage.',
    painPoint: 'EV fleet electrification will double your peak exposure within 3 years. The stack needs to be in place first.',
    subject: '{{name}} — Energy Stack model for your distribution center',
  },
  healthcare: {
    driver: 'medical equipment, HVAC, lighting, and backup requirements create both cost and resilience exposure',
    context: 'Medical facilities have a dual mandate: reduce operating cost and guarantee backup power.',
    painPoint: 'A BESS-led Energy Stack addresses both in a single capital project — and often qualifies for accelerated ITC.',
    subject: '{{name}} — energy resilience + savings stack',
  },
  casino: {
    driver: '24/7 lighting, HVAC, kitchen, entertainment systems, and hotel rooms create one of the highest sustained demand profiles in commercial real estate',
    context: 'Casino resort properties typically carry $300K–$800K/yr in addressable demand-charge exposure.',
    painPoint: 'A co-located Energy Stack can cut that exposure while providing the backup resilience your operations require.',
    subject: '{{name}} — Energy Stack analysis for your property',
  },
  airport: {
    driver: 'terminal HVAC, baggage systems, gate power, and ground support electrification stack on a single utility connection',
    context: 'Airports are among the best candidates for large-scale solar + storage: wide roof area, predictable load, and resilience requirements.',
    painPoint: 'Federal infrastructure incentives and ITC stacking make the economics stronger than most operators realize.',
    subject: '{{name}} — airport Energy Stack analysis',
  },
  energy_project: {
    driver: 'project-scale energy infrastructure benefits from optimized stack design before interconnection is filed',
    context: 'We identified your project in recent coverage and built a first-pass Energy Stack model.',
    painPoint: 'ITC stacking, BESS sizing, and 25-yr NPV can shift materially depending on stack configuration.',
    subject: '{{name}} — Energy Stack model for your project',
  },
};

// ── Google Places — Text Search ───────────────────────────────────────────────
async function searchPlaces(query, location, maxResults = 20) {
  const GOOGLE_MAPS_KEY = getGoogleMapsKey();
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', `${query} in ${location}`);
  url.searchParams.set('key', GOOGLE_MAPS_KEY);

  const results = [];
  let pageToken = null;

  while (results.length < maxResults) {
    const reqUrl = pageToken
      ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${GOOGLE_MAPS_KEY}`
      : url.toString();

    const resp = await fetch(reqUrl);
    const data = await resp.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.warn(`[SalesAgent] Places API error: ${data.status}`, data.error_message);
      break;
    }

    results.push(...(data.results || []));
    pageToken = data.next_page_token;
    if (!pageToken || results.length >= maxResults) break;

    // Google requires a short delay before using next_page_token
    await new Promise(r => setTimeout(r, 2000));
  }

  return results.slice(0, maxResults);
}

// ── Google Places — Place Details (for phone, website) ───────────────────────
async function getPlaceDetails(placeId) {
  const GOOGLE_MAPS_KEY = getGoogleMapsKey();
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'name,formatted_phone_number,website,formatted_address,rating,user_ratings_total,opening_hours,price_level');
  url.searchParams.set('key', GOOGLE_MAPS_KEY);

  const resp = await fetch(url.toString());
  const data = await resp.json();
  return data.result || {};
}

// ── Auto-quote: call our own /api/quote endpoint ──────────────────────────────
async function generateQuote(industry, location, peakLoadKW, extraParams = {}) {
  const resp = await fetch(`${APP_BASE_URL}/api/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ industry, location, bessKW: Math.round(peakLoadKW * 0.4), ...extraParams }),
  });
  if (!resp.ok) return null;
  return resp.json();
}

// ── Store a shared quote and return its public URL ────────────────────────────
async function storeSharedQuote(leadId, quoteData, businessName, industry) {
  const shareToken = crypto.randomUUID();
  const shortCode = shareToken.replace(/-/g, '').slice(0, 12); // e.g. "a1b2c3d4e5f6"

  const { data, error } = await getSupabase().from('shared_quotes').insert({
    share_token: shareToken,
    short_code: shortCode,
    quote_data: quoteData,
    business_name: businessName,
    industry,
    source: 'sales_agent',
    smb_lead_id: leadId,
    is_public: true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  }).select('id').single();

  if (error) {
    console.error('[SalesAgent] Failed to store shared quote:', error.message);
    return null;
  }

  return `${APP_BASE_URL}/quote/${shareToken}`;
}

// ── Extract key numbers from a quote response ────────────────────────────────
function extractQuoteHighlights(quoteData) {
  if (!quoteData) return null;
  const rec = quoteData.tiers?.recommended || quoteData.recommended;
  if (!rec) return null;
  const confidence = quoteData.confidence || null;
  const monteCarlo = quoteData.monteCarlo || null;
  const fmt = (n) => n != null ? Math.round(n).toLocaleString('en-US') : null;
  const savings    = rec.savings?.netAnnualSavings;
  const payback    = rec.roi?.paybackYears;
  const npv        = rec.roi?.npv25Year;
  const solarKW    = rec.equipment?.solarKW;
  const bessKW     = rec.equipment?.bessKW;
  const bessKWh    = rec.equipment?.bessKWh;
  const net        = rec.costs?.netInvestment;
  return {
    annualSavings: savings != null ? `$${fmt(savings)}/yr` : null,
    payback:       payback != null ? `${payback} yrs` : null,
    npv25:         npv    != null ? `$${fmt(npv)}` : null,
    solarKW:       solarKW != null ? `${fmt(solarKW)} kW` : null,
    bessKW:        bessKW  != null ? `${fmt(bessKW)} kW / ${fmt(bessKWh)} kWh` : null,
    netInvestment: net     != null ? `$${fmt(net)}` : null,
    confidence:    confidence ? { score: confidence.score, tier: confidence.tier } : null,
    p50Payback:    monteCarlo?.p50?.paybackYears ?? null,
    p50IRR:        monteCarlo?.p50?.irr5Pct ?? null,
    p50Savings:    monteCarlo?.p50?.annualSavings ?? null,
    bessVendor:    quoteData.equipmentSelection?.bess?.vendor ?? null,
    bessModel:     quoteData.equipmentSelection?.bess?.model ?? null,
    installer:     quoteData.installer ?? null,
  };
}

function buildOutreachSubject(businessName, vertical) {
  const cfg = VERTICAL_CONFIG[vertical] || VERTICAL_CONFIG.car_wash;
  const intel = PROMO_OUTREACH_INTEL[vertical] || PROMO_OUTREACH_INTEL.car_wash;
  return (intel.subject || cfg.emailSubjectHook).replace('{{name}}', businessName);
}

function buildPromotionalOutreachBody({ vertical, quoteData }) {
  const cfg = VERTICAL_CONFIG[vertical] || VERTICAL_CONFIG.car_wash;
  const intel = PROMO_OUTREACH_INTEL[vertical] || PROMO_OUTREACH_INTEL.car_wash;
  const hi = extractQuoteHighlights(quoteData);
  const proofPoints = [
    hi?.annualSavings ? `estimated annual savings of <strong style="color:#ffffff;">${hi.annualSavings}</strong>` : null,
    hi?.payback ? `payback around <strong style="color:#ffffff;">${hi.payback}</strong>` : null,
    hi?.npv25 ? `25-year NPV near <strong style="color:#ffffff;">${hi.npv25}</strong>` : null,
  ].filter(Boolean);
  const proofLine = proofPoints.length > 0
    ? `The first-pass model shows ${proofPoints.join(', ')}.`
    : 'The first-pass model estimates annual savings, system sizing, payback period, and 25-year NPV from live utility and benchmark data.';

  return [
    `Because ${intel.driver}, storage sizing is worth checking before the next utility bill cycle.`,
    `${intel.context} ${intel.painPoint}`,
    `I ran a first-pass StackQuote™ for your ${cfg.label.toLowerCase()} facility. ${proofLine}`,
    'If the numbers are directionally useful, review the quote. If they are off, reply with a utility bill and I will tighten the assumptions.',
  ].join('<br><br>');
}

// ── Send intro email via Resend ───────────────────────────────────────────────
// Build email HTML — shared by preview and send
function buildEmailHtml({ businessName, vertical, quoteUrl, location, customBody, quoteData }) {
  const body = customBody || buildPromotionalOutreachBody({ vertical, quoteData });
  const hi = extractQuoteHighlights(quoteData);

  // Stats strip — only shown when we have real numbers
  const statsStrip = hi ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        ${hi.annualSavings ? `<td style="text-align:center;padding:12px 8px;background:rgba(234,179,8,0.06);border-radius:8px;">
          <div style="color:#EAB308;font-size:22px;font-weight:800;letter-spacing:-0.5px;">${hi.annualSavings}</div>
          <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-top:3px;">Est. Annual Savings</div>
        </td>` : ''}
        ${hi.payback ? `<td style="width:12px;"></td><td style="text-align:center;padding:12px 8px;background:rgba(16,185,129,0.06);border-radius:8px;">
          <div style="color:#10b981;font-size:22px;font-weight:800;letter-spacing:-0.5px;">${hi.payback}</div>
          <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-top:3px;">Payback Period</div>
        </td>` : ''}
        ${hi.npv25 ? `<td style="width:12px;"></td><td style="text-align:center;padding:12px 8px;background:rgba(99,102,241,0.06);border-radius:8px;">
          <div style="color:#818cf8;font-size:22px;font-weight:800;letter-spacing:-0.5px;">${hi.npv25}</div>
          <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-top:3px;">25-Year NPV</div>
        </td>` : ''}
      </tr>
    </table>
    ${(hi.solarKW || hi.bessKW) ? `<p style="color:#475569;font-size:12px;margin:0 0 8px;">
      Stack: ${[hi.solarKW ? `${hi.solarKW} solar` : null, hi.bessKW ? `${hi.bessKW} BESS` : null, hi.bessVendor ? `${hi.bessVendor} ${hi.bessModel || ''}`.trim() : null].filter(Boolean).join(' · ')}
      ${hi.netInvestment ? `· ${hi.netInvestment} net after incentives` : ''}
    </p>` : ''}
    ${hi.p50Payback ? `<p style="color:#475569;font-size:11px;margin:0 0 20px;background:#f8fafc;border-radius:6px;padding:8px 12px;border-left:3px solid #eab308;">
      📊 Monte Carlo P50 · ${hi.p50Payback}-yr payback · ${hi.p50IRR}% 5-yr IRR · ${hi.p50Savings}/yr
      ${hi.confidence ? ` · <strong>${hi.confidence.tier}</strong> (${hi.confidence.score}/100)` : ''}
    </p>` : ''}
  ` : `<p style="color:#cbd5e1;font-size:14px;margin:0 0 20px;line-height:1.5;">
    Annual savings · Payback period · Solar + BESS stack sizing · 25-yr NPV
  </p>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#060D1F;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:20px;margin-bottom:28px;">
      <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
        Merlin Energy
        <span style="font-size:12px;color:#64748b;font-weight:400;margin-left:6px;">Energy Stacking™</span>
      </span>
    </div>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hi ${businessName} team,
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${body}
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 16px;">
      I built a first-pass <strong style="color:#ffffff;">Energy Stack</strong> for your ${location} facility —
      a coordinated model of solar, battery storage, demand response, and available incentives
      sized to your actual load profile.
    </p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 28px;padding:14px 18px;background:rgba(255,255,255,0.03);border-left:3px solid rgba(234,179,8,0.4);border-radius:0 6px 6px 0;">
      The goal isn't technology adoption — it's <strong style="color:#e2e8f0;">optimization.</strong>
      The right stack pays for itself. The wrong one just adds complexity. This model shows you the difference.
    </p>
    <div style="background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.25);border-radius:12px;padding:24px;margin-bottom:28px;">
      <p style="color:#EAB308;font-size:13px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.08em;">
        Your Energy Stack Quote — ${location}
      </p>
      ${statsStrip}
      <a href="${quoteUrl}"
         style="display:inline-block;background:#EAB308;color:#000;font-size:15px;font-weight:700;
                padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
        View Full Stack Analysis →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 8px;">
      Want to walk through the stack assumptions together?
    </p>
    <a href="${BOOKING_MAILTO}"
       style="color:#38bdf8;font-size:14px;text-decoration:none;font-weight:600;">
      Schedule a 20-minute call →
    </a>
    <p style="color:#475569;font-size:12px;margin:6px 0 0;">Or reply with a utility bill and I'll tighten the model. <a href="mailto:sales@merlinenergy.net" style="color:#38bdf8;text-decoration:none;">sales@merlinenergy.net</a></p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.5;margin:24px 0 0;">— Alex<br><span style="color:#64748b;font-size:12px;">Merlin Energy · Energy Stacking™</span></p>
    ${hi?.installer ? `
    <div style="margin-top:28px;padding:14px 18px;background:rgba(59,130,246,0.06);border-left:3px solid #3b82f6;border-radius:6px;">
      <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Installation Partner</p>
      <p style="margin:0;font-size:14px;color:#e2e8f0;font-weight:600;">${hi.installer.name}
        <span style="color:#94a3b8;font-weight:400;font-size:13px;"> · ${hi.installer.hq_city}</span>
      </p>
      <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${hi.installer.focus?.slice(0, 90)}${hi.installer.focus?.length > 90 ? '…' : ''}</p>
    </div>` : ''}
    <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:40px;padding-top:20px;">
      <p style="color:#334155;font-size:12px;line-height:1.5;margin:0;">
        Merlin Energy · Las Vegas, NV
      </p>
      <p style="color:#1e293b;font-size:11px;margin:6px 0 0;">
        This analysis was generated using publicly available facility data, live utility rates, and NREL solar irradiance.
        Numbers are estimates and should be verified by a licensed engineer before capital commitment.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SMART EMAIL TARGETING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tier 1 — generic department aliases, ordered by expected response rate
 * for energy / facilities proposals.
 */
const TIER1_ALIASES = [
  'sales',
  'info',
  'businessdevelopment',
  'projects',
  'facilities',
  'operations',
  'engineering',
  'sustainability',
  'energy',
  'procurement',
];

/**
 * Build a ranked list of email addresses to try for a given domain.
 *
 * Priority:
 *   1. Known contacts (firstName, lastName, title — if provided)
 *   2. Tier-1 department aliases
 *
 * Returns an array like:
 *   [
 *     { email: 'facilities@acme.com', tier: 1, label: 'Facilities Dept' },
 *     { email: 'bob.smith@acme.com',  tier: 0, label: 'Bob Smith (Director of Operations)' },
 *     ...
 *   ]
 *
 * @param {string} domain   e.g. "acme.com"
 * @param {Array}  contacts Array of { firstName, lastName, title } known contacts (optional)
 * @param {number} maxTier1 How many Tier-1 aliases to include (default 4)
 */
function buildEmailTargets(domain, contacts = [], maxTier1 = 4) {
  if (!domain) return [];
  const d = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const targets = [];

  // Named contacts — all common format variations
  for (const c of contacts) {
    if (!c.firstName || !c.lastName) continue;
    const fn = c.firstName.toLowerCase().replace(/[^a-z]/g, '');
    const ln = c.lastName.toLowerCase().replace(/[^a-z]/g, '');
    const fi = fn[0];
    const formats = [
      `${fn}.${ln}`,
      `${fi}${ln}`,
      `${fi}.${ln}`,
      `${fn}_${ln}`,
      `${fn}`,
    ];
    for (const fmt of formats) {
      targets.push({
        email: `${fmt}@${d}`,
        tier: 0,
        label: `${c.firstName} ${c.lastName}${c.title ? ` (${c.title})` : ''}`,
        firstName: c.firstName,
        lastName: c.lastName,
      });
    }
  }

  // Tier-1 department aliases
  for (const alias of TIER1_ALIASES.slice(0, maxTier1)) {
    targets.push({
      email: `${alias}@${d}`,
      tier: 1,
      label: `${alias}@ alias`,
    });
  }

  return targets;
}

/**
 * Given a company domain and optional known contacts, return the best
 * flat list of email addresses to include as "To" recipients.
 *
 * For a cold outreach blast we recommend:
 *   - 0 known contacts → top 4 Tier-1 aliases
 *   - 1+ known contacts → all name variants for known contacts + top 2 aliases
 *
 * @param {string} domain
 * @param {Array}  contacts
 * @returns {string[]}  de-duped email list
 */
function resolveOutreachEmails(domain, contacts = [], contactEmail = null) {
  // No domain at all — fall back to the explicit contact_email if provided
  if (!domain) return contactEmail ? [contactEmail] : [];
  const hasContacts = contacts.length > 0;
  const tier1Count  = hasContacts ? 2 : 4;
  const targets     = buildEmailTargets(domain, contacts, tier1Count);

  // Named contacts: use only the top 2 format variants per person
  const seen = new Set();
  const result = [];
  const namedByPerson = {};

  for (const t of targets) {
    if (t.tier === 0) {
      const key = `${t.firstName}_${t.lastName}`;
      namedByPerson[key] = (namedByPerson[key] || 0) + 1;
      if (namedByPerson[key] > 2) continue; // only top 2 formats per person
    }
    if (!seen.has(t.email)) {
      seen.add(t.email);
      result.push(t.email);
    }
  }

  return result;
}

// ─── Export helpers for use in route handlers ────────────────────────────────
// (used by /discover, /email/:leadId, and /news-projects)

async function sendIntroEmail({ recipients, businessName, vertical, quoteUrl, location, customSubject, customBody, quoteData }) {
  const subject = customSubject || buildOutreachSubject(businessName, vertical);
  const html = buildEmailHtml({ businessName, vertical, quoteUrl, location, customBody, quoteData });

  const toList = Array.isArray(recipients) ? recipients : [recipients];
  const results = [];

  for (const to of toList) {
    try {
      const result = await getResend().emails.send({ from: FROM_EMAIL, to, subject, html, reply_to: REPLY_EMAIL, bcc: REPLY_EMAIL });
      results.push({ to, success: true, id: result.data?.id });
    } catch (err) {
      console.error('[SalesAgent] Resend error:', err.message);
      results.push({ to, success: false, error: err.message });
    }
  }

  const anySuccess = results.some(r => r.success);
  return { success: anySuccess, results };
}

// ── Upsert a prospect into smb_leads ─────────────────────────────────────────
function cleanBusinessName(raw) {
  // Remove highway exit prefixes like "Exit 46: ", "Exit I-15: ", etc.
  return raw.replace(/^Exit\s+[\w-]+:\s*/i, '').trim();
}

async function upsertLead(place, details, vertical) {
  const cfg = VERTICAL_CONFIG[vertical];
  const record = {
    name: cleanBusinessName(place.name),
    site_slug: place.place_id,   // satisfy NOT NULL; place_id is unique & stable
    place_id: place.place_id,
    vertical,
    industry: cfg.industry,
    address: place.formatted_address || details.formatted_address,
    phone: details.formatted_phone_number || null,
    website: details.website || null,
    google_rating: place.rating || null,
    google_reviews: place.user_ratings_total || null,
    lat: place.geometry?.location?.lat || null,
    lng: place.geometry?.location?.lng || null,
    status: 'discovered',
    source: 'google_places',
  };

  // Upsert on place_id to avoid duplicates
  const { data, error } = await getSupabase()
    .from('smb_leads')
    .upsert(record, { onConflict: 'place_id', ignoreDuplicates: false })
    .select('id, name, status')
    .single();

  if (error) {
    throw new Error(`DB upsert failed: ${error.message}`);
  }
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/sales-agent/discover
 * Main pipeline: discover → profile → quote → email
 */
router.post('/discover', async (req, res) => {
  const {
    location = 'Las Vegas, NV',
    verticals = ['car_wash', 'ev_charging', 'truck_stop', 'hotel'],
    autoQuote = true,
    autoEmail = false,
    maxPerVertical = 10,
  } = req.body || {};

  if (!getGoogleMapsKey()) {
    return res.status(503).json({ error: 'Google Maps API key not configured' });
  }

  const results = { location, discovered: 0, quoted: 0, emailed: 0, errors: [], leads: [] };

  for (const vertical of verticals) {
    const cfg = VERTICAL_CONFIG[vertical];
    if (!cfg) {
      results.errors.push(`Unknown vertical: ${vertical}`);
      continue;
    }

    console.log(`[SalesAgent] Searching ${cfg.label} in ${location}…`);

    let places;
    try {
      places = await searchPlaces(cfg.query, location, maxPerVertical);
    } catch (err) {
      results.errors.push(`Places search failed for ${vertical}: ${err.message}`);
      continue;
    }

    console.log(`[SalesAgent] Found ${places.length} places for ${vertical}`);
    if (places.length === 0) {
      results.errors.push(`No places found for ${vertical} in ${location}`);
      continue;
    }

    for (const place of places) {
      try {
        // 1. Get enriched details
        const details = await getPlaceDetails(place.place_id);

        // 2. Store in smb_leads
        const lead = await upsertLead(place, details, vertical);
        if (!lead) continue;

        results.discovered++;
        const leadResult = { id: lead.id, name: lead.name, vertical, status: 'discovered' };

        // 3. Auto-quote
        if (autoQuote) {
          const quoteData = await generateQuote(cfg.industry, location, cfg.peakLoadKW, cfg.quoteParams || {});
          if (quoteData) {
            const quoteUrl = await storeSharedQuote(lead.id, quoteData, place.name, cfg.industry);
            if (quoteUrl) {
              await getSupabase().from('smb_leads')
                .update({ quote_url: quoteUrl, status: 'quoted' })
                .eq('id', lead.id);
            // Cache quote_data for email highlights
            getSupabase().from('smb_leads').update({ quote_data: quoteData }).eq('id', lead.id).then(() => {}).catch(() => {});
              leadResult.quoteUrl = quoteUrl;
              leadResult.status = 'quoted';
              results.quoted++;
            }

              // 4. Email review gate — discovery never sends prospect emails directly.
              if (autoEmail && quoteUrl) {
                leadResult.emailReviewRequired = true;
                results.errors.push(`${place.name}: email queued for human review; auto-send is disabled`);
            }
          }
        }

        results.leads.push(leadResult);

      } catch (err) {
        console.error(`[SalesAgent] Error processing ${place.name}:`, err.message);
        results.errors.push(`${place.name}: ${err.message}`);
      }

      // Polite rate limiting
      await new Promise(r => setTimeout(r, 200));
    }
  }

  res.json({ ok: true, ...results });
});

/**
 * GET /api/sales-agent/shared-quote/:token
 * Public read-only quote payload for emailed Sales Agent quote links.
 */
router.get('/shared-quote/:token', async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: 'Missing quote token' });
  }

  const { data, error } = await getSupabase()
    .from('shared_quotes')
    .select('id, share_token, short_code, business_name, industry, quote_data, created_at, expires_at, is_public')
    .or(`share_token.eq.${token},short_code.eq.${token}`)
    .single();

  if (error || !data || data.is_public === false) {
    return res.status(404).json({ error: 'Quote not found' });
  }

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return res.status(410).json({ error: 'Quote link has expired' });
  }

  res.json({
    ok: true,
    quote: {
      businessName: data.business_name,
      industry: data.industry,
      quoteData: data.quote_data,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      highlights: extractQuoteHighlights(data.quote_data),
    },
  });
});

/**
 * GET /api/sales-agent/email-targets/:leadId
 * Resolve and return the tiered email targets for a lead without sending anything.
 * Used by the UI to preview who will receive the outreach.
 */
router.get('/email-targets/:leadId', async (req, res) => {
  const { leadId } = req.params;
  const { data: lead, error } = await getSupabase()
    .from('smb_leads').select('id, name, website, contacts').eq('id', leadId).single();

  if (error || !lead) return res.status(404).json({ error: 'Lead not found' });

  if (!lead.website) return res.json({ ok: true, domain: null, targets: [], note: 'No website on file' });

  let domain, contacts = [];
  try {
    domain = new URL(lead.website).hostname.replace(/^www\./, '');
    if (lead.contacts) contacts = typeof lead.contacts === 'string' ? JSON.parse(lead.contacts) : lead.contacts;
  } catch (_) {}

  const targets = buildEmailTargets(domain, contacts, 4);
  const resolved = resolveOutreachEmails(domain, contacts, lead.contact_email);

  res.json({ ok: true, domain, targets, resolved });
});

/**
 * POST /api/sales-agent/quote/:leadId
 * Regenerate quote for a specific lead
 */
router.post('/quote/:leadId', async (req, res) => {
  const { leadId } = req.params;

  const { data: lead, error } = await getSupabase()
    .from('smb_leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const cfg = VERTICAL_CONFIG[lead.vertical] || VERTICAL_CONFIG.car_wash;
  const quoteData = await generateQuote(cfg.industry, lead.address || 'Las Vegas, NV', cfg.peakLoadKW, cfg.quoteParams || {});

  if (!quoteData) {
    return res.status(502).json({ error: 'Quote generation failed' });
  }

  const quoteUrl = await storeSharedQuote(lead.id, quoteData, lead.name, cfg.industry);

  await getSupabase().from('smb_leads')
    .update({ quote_url: quoteUrl, status: 'quoted' })
    .eq('id', leadId);
  // Cache quote_data for email highlights (column added in migration 20260427)
  getSupabase().from('smb_leads').update({ quote_data: quoteData }).eq('id', leadId).then(() => {}).catch(() => {});

  res.json({ ok: true, leadId, quoteUrl, highlights: extractQuoteHighlights(quoteData) });
});

/**
 * POST /api/sales-agent/email/:leadId
 * Send intro email for a specific lead
 */
router.post('/email/:leadId', async (req, res) => {
  const { leadId } = req.params;
  const { recipients, customSubject, customBody, previewOnly } = req.body || {};

  const { data: lead, error } = await getSupabase()
    .from('smb_leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) return res.status(404).json({ error: 'Lead not found' });
  if (!lead.quote_url) return res.status(400).json({ error: 'No quote URL — run /quote/:leadId first' });

  // Derive default recipients using smart tiered targeting
  let toList = recipients;
  if (!toList || toList.length === 0) {
    if (lead.website) {
      try {
        const domain = new URL(lead.website).hostname.replace(/^www\./, '');
        // Parse any named contacts stored on the lead (JSON array: [{firstName,lastName,title}])
        let contacts = [];
        if (lead.contacts) {
          try { contacts = typeof lead.contacts === 'string' ? JSON.parse(lead.contacts) : lead.contacts; } catch (_) {}
        }
        toList = resolveOutreachEmails(domain, contacts, lead.contact_email);
      } catch (_) {
        toList = lead.contact_email ? [lead.contact_email] : [];
      }
    }
    if ((!toList || toList.length === 0) && lead.contact_email) {
      toList = [lead.contact_email];
    }
    if ((!toList || toList.length === 0) && !previewOnly) {
      return res.status(400).json({ error: 'No recipients. Provide recipients array or ensure lead has a website.' });
    }
  }

  // Load quote data for highlights (from smb_leads.quote_data or shared_quotes)
  let quoteData = lead.quote_data || null;
  if (!quoteData && lead.quote_url) {
    try {
      const token = lead.quote_url.split('/quote/')[1];
      if (token) {
        const { data: sq } = await getSupabase()
          .from('shared_quotes').select('quote_data').eq('share_token', token).single();
        quoteData = sq?.quote_data || null;
      }
    } catch (_) {}
  }

  // Preview mode — return subject + html without sending
  if (previewOnly) {
    const subject = customSubject || buildOutreachSubject(lead.name, lead.vertical || 'car_wash');
    const html = buildEmailHtml({
      businessName: lead.name,
      vertical: lead.vertical || 'car_wash',
      quoteUrl: lead.quote_url,
      location: lead.address || 'your area',
      customBody,
      quoteData,
    });
    return res.json({ ok: true, previewOnly: true, subject, html, recipients: toList, highlights: extractQuoteHighlights(quoteData) });
  }

  const emailResult = await sendIntroEmail({
    recipients: toList,
    businessName: lead.name,
    vertical: lead.vertical || 'car_wash',
    quoteUrl: lead.quote_url,
    location: lead.address || 'your area',
    customSubject,
    customBody,
    quoteData,
  });

  if (emailResult.success) {
    await getSupabase().from('smb_leads')
      .update({
        email_sent_at: new Date().toISOString(),
        status: 'emailed',
        contact_email: toList.join(', '),
        notes: `Sent to: ${toList.join(', ')}`,
      })
      .eq('id', leadId);
  }

  res.json({ ok: emailResult.success, leadId, recipients: toList, results: emailResult.results });
});

/**
 * GET /api/sales-agent/leads
 * List all smb_leads with summary stats
 */
router.get('/leads', async (req, res) => {
  const { vertical, status, limit = 100 } = req.query;

  let q = getSupabase().from('smb_leads').select('*').order('created_at', { ascending: false }).limit(Number(limit));
  if (vertical) q = q.eq('vertical', vertical);
  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });

  const stats = (data || []).reduce((acc, l) => {
    acc.total++;
    acc[l.status] = (acc[l.status] || 0) + 1;
    acc.byVertical[l.vertical] = (acc.byVertical[l.vertical] || 0) + 1;
    return acc;
  }, { total: 0, byVertical: {} });

  res.json({ ok: true, stats, leads: data });
});

// ═══════════════════════════════════════════════════════════════════════════
// NEWS PROJECT SCRAPER — find active energy projects from Google News RSS
// POST /api/sales-agent/news-projects
// ═══════════════════════════════════════════════════════════════════════════

const NEWS_PROJECT_FEEDS = [
  // Construction / Expansion signals
  { url: 'https://news.google.com/rss/search?q=manufacturing+facility+expansion+construction+energy&hl=en-US&gl=US&ceid=US:en', industry: 'manufacturing', label: 'Manufacturing' },
  { url: 'https://news.google.com/rss/search?q=data+center+construction+opening+power&hl=en-US&gl=US&ceid=US:en', industry: 'data_center', label: 'Data Center' },
  { url: 'https://news.google.com/rss/search?q=warehouse+distribution+center+opening+new&hl=en-US&gl=US&ceid=US:en', industry: 'logistics', label: 'Warehouse / Logistics' },
  { url: 'https://news.google.com/rss/search?q=hotel+resort+construction+opening+2025+2026&hl=en-US&gl=US&ceid=US:en', industry: 'hotel', label: 'Hotel / Hospitality' },
  { url: 'https://news.google.com/rss/search?q=hospital+medical+center+expansion+construction&hl=en-US&gl=US&ceid=US:en', industry: 'healthcare', label: 'Healthcare' },
  { url: 'https://news.google.com/rss/search?q=car+wash+tunnel+opening+new+construction&hl=en-US&gl=US&ceid=US:en', industry: 'car_wash', label: 'Car Wash' },
  { url: 'https://news.google.com/rss/search?q=EV+charging+hub+depot+fleet+electrification&hl=en-US&gl=US&ceid=US:en', industry: 'ev_charging', label: 'EV Charging' },
  { url: 'https://news.google.com/rss/search?q=solar+battery+storage+BESS+commercial+project&hl=en-US&gl=US&ceid=US:en', industry: 'energy_project', label: 'Energy Project (BESS/Solar)' },
  { url: 'https://news.google.com/rss/search?q=casino+resort+expansion+construction+Nevada&hl=en-US&gl=US&ceid=US:en', industry: 'casino', label: 'Casino / Resort' },
  { url: 'https://news.google.com/rss/search?q=airport+terminal+expansion+construction&hl=en-US&gl=US&ceid=US:en', industry: 'airport', label: 'Airport' },
];

// Map news industry slug → sales-agent vertical config key
const NEWS_INDUSTRY_TO_VERTICAL = {
  manufacturing: 'hotel',   // closest peakLoad proxy; override below
  data_center:   'ev_charging',
  logistics:     'truck_stop',
  hotel:         'hotel',
  healthcare:    'hotel',
  car_wash:      'car_wash',
  ev_charging:   'ev_charging',
  energy_project:'truck_stop',
  casino:        'hotel',
  airport:       'ev_charging',
};

// Peak load overrides for news-discovered industries (kW)
const NEWS_INDUSTRY_PEAK_KW = {
  manufacturing:  1200,
  data_center:    2000,
  logistics:       600,
  hotel:           500,
  healthcare:      900,
  car_wash:        450,
  ev_charging:     600,
  energy_project:  800,
  casino:          700,
  airport:        1000,
};

const NEWS_INDUSTRY_EMAIL_HOOKS = {
  manufacturing:  { subject: '{{name}} — Energy Stack analysis for your new facility', body: 'Manufacturing facilities at this scale typically carry $200K–$1.5M/yr in demand-charge and utility exposure. We built a coordinated Energy Stack model sized to your site.' },
  data_center:    { subject: '{{name}} — power resilience + Energy Stack model', body: 'Data centers face $1M+ annual utility exposure — and resilience requirements. A co-located BESS layer addresses both. We ran the numbers for your facility.' },
  logistics:      { subject: '{{name}} — Energy Stack model for your distribution center', body: 'Warehouse and distribution centers are strong candidates for solar + demand-charge storage — especially with EV fleet electrification on the horizon. We pre-built your stack.' },
  hotel:          { subject: '{{name}} — your Energy Stack quote is ready', body: 'Hotels rank in the top tier of commercial solar + BESS ROI candidates. HVAC, laundry, and kitchen loads create compounding peak-shaving opportunity.' },
  healthcare:     { subject: '{{name}} — energy resilience + savings stack', body: 'Medical facilities have a dual mandate: reduce operating cost and guarantee backup power. An Energy Stack addresses both in a single capital project.' },
  car_wash:       { subject: '{{name}} — your Energy Stack analysis is ready', body: 'Tunnel car washes draw 400–800 kW in short bursts — and that peak sets the demand charge for the entire month. We modeled your location.' },
  ev_charging:    { subject: '{{name}} — Energy Stack model for your charging network', body: 'Fast charger demand spikes are the #1 cost driver for EV operators. A storage buffer in the stack can cut demand charges 40–60%. We ran your numbers.' },
  energy_project: { subject: '{{name}} — Energy Stack model for your project', body: 'We identified your project in recent coverage and built a first-pass Energy Stack analysis — system sizing, ITC stacking, and 25-yr NPV included.' },
  casino:         { subject: '{{name}} — Energy Stack analysis for your property', body: 'Casino resort facilities run 24/7 with significant sustained peak exposure. A coordinated Energy Stack typically yields $300K–$800K/yr in addressable savings.' },
  airport:        { subject: '{{name}} — airport Energy Stack analysis', body: 'Airports are ideal for large-scale solar + storage stacking: wide roof area, predictable demand profile, and federal resilience incentives that stack with ITC.' },
};

/**
 * Parse Google News RSS feed and extract articles.
 * Server-side: no CORS proxy needed.
 */
async function parseNewsFeed(url) {
  try {
    const { default: fetch } = await import('node-fetch').catch(() => ({ default: globalThis.fetch }));
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Merlin Energy news scanner)' }, signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const xml = await resp.text();

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const title       = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/))?.[1] || '';
      const link        = (block.match(/<link>(.*?)<\/link>/) || [])[1] || '';
      const description = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || block.match(/<description>(.*?)<\/description>/))?.[1] || '';
      const pubDate     = (block.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || '';
      const source      = (block.match(/<source[^>]*>(.*?)<\/source>/))?.[1] || '';
      if (title) items.push({ title, link, description: description.replace(/<[^>]+>/g, '').trim().slice(0, 400), pubDate, source });
    }
    return items.slice(0, 20);
  } catch (err) {
    console.warn(`[NewsProjects] Feed parse error: ${err.message}`);
    return [];
  }
}

/**
 * Extract company name, location (city, state), and project specs from an article.
 * Uses OpenAI if available; falls back to heuristic regex.
 */
async function extractProjectDetails(title, description, industry) {
  const text = `${title}\n${description}`;

  // Try OpenAI extraction
  const OPENAI_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (OPENAI_KEY) {
    try {
      const { default: fetch } = await import('node-fetch').catch(() => ({ default: globalThis.fetch }));
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0,
          max_tokens: 300,
          messages: [
            { role: 'system', content: 'Extract structured data from an energy/business news article. Return ONLY valid JSON with keys: companyName (string), city (string or null), state (string 2-letter or null), projectSizeMW (number or null), projectSizeKWh (number or null), contactDomain (string or null, company website domain), confidence (0-100). If you cannot determine a field, use null.' },
            { role: 'user', content: `Industry: ${industry}\n\nText:\n${text}` },
          ],
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (resp.ok) {
        const data = await resp.json();
        const raw = data.choices?.[0]?.message?.content?.trim() || '';
        const jsonMatch = raw.match(/\{[\s\S]+\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.companyName && parsed.confidence > 40) return parsed;
        }
      }
    } catch (_) {}
  }

  // Heuristic fallback
  const stateAbbr = text.match(/\b([A-Z]{2})\b/g)?.find(s =>
    ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].includes(s)
  ) || null;
  const cityMatch = text.match(/(?:in|at|near|of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s+[A-Z]{2}/)?.[1] || null;
  const mwMatch   = text.match(/(\d+(?:\.\d+)?)\s*MW/i)?.[1];
  const mwhMatch  = text.match(/(\d+(?:\.\d+)?)\s*MWh/i)?.[1];

  // First quoted or capitalized entity heuristic
  const firstEntity = title.match(/^([A-Z][A-Za-z0-9\s&,.''-]+?)(?:\s+(?:to|will|plans|announces|opens|breaks|begins|expands|launches))/)?.[1]?.trim()
    || title.split(/\s+[-–—]\s+/)[0]?.trim()
    || null;

  return {
    companyName: firstEntity,
    city: cityMatch,
    state: stateAbbr,
    projectSizeMW: mwMatch ? parseFloat(mwMatch) : null,
    projectSizeKWh: mwhMatch ? parseFloat(mwhMatch) * 1000 : null,
    contactDomain: null,
    confidence: firstEntity && stateAbbr ? 55 : 30,
  };
}

/**
 * Build a deduplication key from company + title
 */
function newsLeadKey(companyName, title) {
  return `${(companyName || '').toLowerCase().replace(/\W+/g, '-')}-${title.toLowerCase().replace(/\W+/g, '-').slice(0, 40)}`;
}

/**
 * POST /api/sales-agent/news-projects
 * Scrape Google News RSS → extract energy project specs → auto-quote → optionally email.
 *
 * Body: {
 *   industries: ['manufacturing','data_center','hotel',...] // optional; default all
 *   autoQuote: true,
 *   autoEmail: false,
 *   minConfidence: 40,   // skip extracted records below this threshold (0-100)
 * }
 */
router.post('/news-projects', async (req, res) => {
  const {
    industries = null,    // null = all
    autoQuote  = true,
    autoEmail  = false,
    minConfidence = 40,
  } = req.body || {};

  const feeds = industries
    ? NEWS_PROJECT_FEEDS.filter(f => industries.includes(f.industry))
    : NEWS_PROJECT_FEEDS;

  const results = { discovered: 0, quoted: 0, emailed: 0, skipped: 0, errors: [], leads: [] };
  const seenKeys = new Set();

  for (const feed of feeds) {
    console.log(`[NewsProjects] Fetching ${feed.label} feed…`);
    const articles = await parseNewsFeed(feed.url);
    console.log(`[NewsProjects] ${articles.length} articles for ${feed.label}`);

    for (const article of articles) {
      try {
        const extracted = await extractProjectDetails(article.title, article.description, feed.industry);

        if (!extracted?.companyName || extracted.confidence < minConfidence) {
          results.skipped++;
          continue;
        }

        // Dedup
        const key = newsLeadKey(extracted.companyName, article.title);
        if (seenKeys.has(key)) { results.skipped++; continue; }
        seenKeys.add(key);

        const location = [extracted.city, extracted.state].filter(Boolean).join(', ') || 'United States';
        const vertical = NEWS_INDUSTRY_TO_VERTICAL[feed.industry] || 'hotel';
        const peakKW   = NEWS_INDUSTRY_PEAK_KW[feed.industry] || 500;
        const hooks    = NEWS_INDUSTRY_EMAIL_HOOKS[feed.industry] || NEWS_INDUSTRY_EMAIL_HOOKS.hotel;

        // Upsert into smb_leads as a news-sourced lead
        const { data: leadRow, error: leadErr } = await getSupabase()
          .from('smb_leads')
          .upsert({
            name: extracted.companyName,
            address: location,
            vertical,
            industry: feed.industry,
            source: 'news_scraper',
            status: 'discovered',
            notes: `From: ${article.title}\n${article.link}\n\nExtracted: conf=${extracted.confidence}, sizeMW=${extracted.projectSizeMW}, sizeKWh=${extracted.projectSizeKWh}`,
            website: extracted.contactDomain ? `https://${extracted.contactDomain}` : null,
          }, { onConflict: 'name,address', ignoreDuplicates: false })
          .select('id,name,status')
          .single();

        if (leadErr || !leadRow) {
          results.errors.push(`DB upsert failed for ${extracted.companyName}: ${leadErr?.message}`);
          continue;
        }

        results.discovered++;
        const leadResult = {
          id: leadRow.id,
          name: extracted.companyName,
          industry: feed.industry,
          location,
          confidence: extracted.confidence,
          articleTitle: article.title,
          articleUrl: article.link,
          source: article.source,
          status: 'discovered',
        };

        // Auto-quote
        if (autoQuote) {
          const quoteData = await generateQuote(
            vertical === 'hotel' ? feed.industry : vertical,
            location,
            peakKW,
            extracted.projectSizeMW ? { manualBessKW: Math.round(extracted.projectSizeMW * 200) } : {}
          );

          if (quoteData) {
            const quoteUrl = await storeSharedQuote(leadRow.id, quoteData, extracted.companyName, feed.industry);
            if (quoteUrl) {
              await getSupabase().from('smb_leads')
                .update({ quote_url: quoteUrl, quote_data: quoteData, status: 'quoted' })
                .eq('id', leadRow.id);
              leadResult.quoteUrl = quoteUrl;
              leadResult.highlights = extractQuoteHighlights(quoteData);
              leadResult.status = 'quoted';
              results.quoted++;
            }

            // Email pipeline (human review gate)
            if (autoEmail && leadResult.quoteUrl && extracted.contactDomain) {
              const toList = resolveOutreachEmails(extracted.contactDomain, []);
              const emailResult = await sendIntroEmail({
                recipients: toList,
                businessName: extracted.companyName,
                vertical,
                quoteUrl: leadResult.quoteUrl,
                location,
                customSubject: hooks.subject.replace('{{name}}', extracted.companyName),
                customBody: hooks.body,
                quoteData,
              });
              if (emailResult.success) {
                await getSupabase().from('smb_leads')
                  .update({ email_sent_at: new Date().toISOString(), status: 'emailed', contact_email: toList.join(', ') })
                  .eq('id', leadRow.id);
                leadResult.status = 'emailed';
                leadResult.emailedTo = toList;
                results.emailed++;
              }
            } else if (autoEmail && !extracted.contactDomain) {
              results.errors.push(`${extracted.companyName}: no domain extracted — email skipped`);
            }
          }
        }

        results.leads.push(leadResult);

      } catch (err) {
        console.error(`[NewsProjects] Error on article "${article.title}":`, err.message);
        results.errors.push(err.message);
      }

      await new Promise(r => setTimeout(r, 150));
    }
  }

  res.json({ ok: true, ...results });
});

export default router;
