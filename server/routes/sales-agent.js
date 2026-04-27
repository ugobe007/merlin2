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
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

function getResend() {
  if (!_resend) {
    const key = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
    _resend = new Resend(key || 'placeholder');
  }
  return _resend;
}

function getGoogleMapsKey() {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
}
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://merlin2.fly.dev';
const FROM_EMAIL = 'TrueQuote by Merlin <hello@merlin.energy>';
const BOOKING_URL = 'https://cal.com/truequote';  // update when cal link is live

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
    emailSubjectHook: 'Free BESS analysis for {{name}}',
    emailBodyHook: 'EV charging demand spikes are the #1 cost driver for operators. We pre-built a savings model for your location.',
  },
  truck_stop: {
    query: 'truck stop travel center Loves Flying J Pilot',
    type: 'gas_station',
    industry: 'truck_stop',
    label: 'Truck Stop / Travel Center',
    peakLoadKW: 800,
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
async function generateQuote(industry, location, peakLoadKW) {
  const resp = await fetch(`${APP_BASE_URL}/api/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ industry, location, bessKW: Math.round(peakLoadKW * 0.4) }),
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
  };
}

// ── Send intro email via Resend ───────────────────────────────────────────────
// Build email HTML — shared by preview and send
function buildEmailHtml({ businessName, vertical, quoteUrl, location, customBody, quoteData }) {
  const cfg = VERTICAL_CONFIG[vertical] || VERTICAL_CONFIG.car_wash;
  const body = customBody || cfg.emailBodyHook;
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
    ${(hi.solarKW || hi.bessKW) ? `<p style="color:#475569;font-size:12px;margin:0 0 20px;">
      System: ${[hi.solarKW ? `${hi.solarKW} solar` : null, hi.bessKW ? `${hi.bessKW} BESS` : null].filter(Boolean).join(' · ')}
      ${hi.netInvestment ? `· ${hi.netInvestment} net investment after incentives` : ''}
    </p>` : ''}
  ` : `<p style="color:#cbd5e1;font-size:14px;margin:0 0 20px;line-height:1.5;">
    Estimated annual savings · Payback period · Solar + BESS sizing · 25-yr NPV
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
        TrueQuote™
        <span style="font-size:12px;color:#64748b;font-weight:400;margin-left:6px;">by Merlin Energy</span>
      </span>
    </div>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hi ${businessName} team,
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${body}
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 28px;">
      We built a <strong style="color:#ffffff;">free energy savings analysis</strong> for your
      ${location} facility using live utility rates, NREL solar data, and DOE-aligned battery
      sizing logic — the same framework used by major EPCs.
    </p>
    <div style="background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.25);border-radius:12px;padding:24px;margin-bottom:28px;">
      <p style="color:#EAB308;font-size:13px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.08em;">
        Your Pre-Built TrueQuote™ — ${location}
      </p>
      ${statsStrip}
      <a href="${quoteUrl}"
         style="display:inline-block;background:#EAB308;color:#000;font-size:15px;font-weight:700;
                padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
        View Full Quote →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 8px;">
      Want to walk through the numbers with a TrueQuote professional?
    </p>
    <a href="${BOOKING_URL}"
       style="color:#38bdf8;font-size:14px;text-decoration:none;font-weight:600;">
      Schedule a free 20-min call →
    </a>
    <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:40px;padding-top:20px;">
      <p style="color:#334155;font-size:12px;line-height:1.5;margin:0;">
        Merlin Energy · Las Vegas, NV
      </p>
      <p style="color:#1e293b;font-size:11px;margin:6px 0 0;">
        This analysis was generated automatically using publicly available facility data.
        Numbers are estimates based on industry benchmarks and should be verified by a licensed engineer.
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendIntroEmail({ recipients, businessName, vertical, quoteUrl, location, customSubject, customBody, quoteData }) {
  const cfg = VERTICAL_CONFIG[vertical] || VERTICAL_CONFIG.car_wash;
  const subject = customSubject || cfg.emailSubjectHook.replace('{{name}}', businessName);
  const html = buildEmailHtml({ businessName, vertical, quoteUrl, location, customBody, quoteData });

  const toList = Array.isArray(recipients) ? recipients : [recipients];
  const results = [];

  for (const to of toList) {
    try {
      const result = await getResend().emails.send({ from: FROM_EMAIL, to, subject, html });
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
async function upsertLead(place, details, vertical) {
  const cfg = VERTICAL_CONFIG[vertical];
  const record = {
    name: place.name,
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
  } = req.body;

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
          const quoteData = await generateQuote(cfg.industry, location, cfg.peakLoadKW);
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

            // 4. Auto-email (only if we have a website/contact and quote URL)
            if (autoEmail && quoteUrl && details.website) {
              // Derive a contact email from website domain as best-effort
              const domain = new URL(details.website).hostname.replace('www.', '');
              const contactEmail = `info@${domain}`;

              const emailResult = await sendIntroEmail({
                to: contactEmail,
                businessName: place.name,
                vertical,
                quoteUrl,
                location,
              });

              if (emailResult.success) {
                await getSupabase().from('smb_leads')
                  .update({ email_sent_at: new Date().toISOString(), status: 'emailed', contact_email: contactEmail })
                  .eq('id', lead.id);
                leadResult.emailSent = true;
                leadResult.status = 'emailed';
                results.emailed++;
              }
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
  const quoteData = await generateQuote(cfg.industry, lead.address || 'Las Vegas, NV', cfg.peakLoadKW);

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
  const { recipients, customSubject, customBody, previewOnly } = req.body;

  const { data: lead, error } = await getSupabase()
    .from('smb_leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) return res.status(404).json({ error: 'Lead not found' });
  if (!lead.quote_url) return res.status(400).json({ error: 'No quote URL — run /quote/:leadId first' });

  // Derive default recipients from website domain
  let toList = recipients;
  if (!toList || toList.length === 0) {
    if (lead.website) {
      try {
        const domain = new URL(lead.website).hostname.replace(/^www\./, '');
        toList = [`sales@${domain}`, `operations@${domain}`, `cfo@${domain}`];
      } catch (_) {
        toList = [];
      }
    }
    if (!toList || toList.length === 0) {
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
    const cfg = VERTICAL_CONFIG[lead.vertical] || VERTICAL_CONFIG.car_wash;
    const subject = customSubject || cfg.emailSubjectHook.replace('{{name}}', lead.name);
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

export default router;
