/**
 * EPC / INSTALLER LOCALIZATION ENGINE
 * =====================================
 * Curated seed database of ~25 named commercial solar + BESS EPC/CI firms,
 * plus a Google Places fallback for dynamic local discovery.
 *
 * GET  /api/epc/find?state=NV&vertical=car_wash   → best match for a state + vertical
 * GET  /api/epc/list                               → all seed partners
 * POST /api/epc/outreach/:id                       → send partnership intro email via Resend
 *
 * Created: May 2026
 */

import express from 'express';
import { Resend } from 'resend';

const router = express.Router();

// ── Lazy Resend init ──────────────────────────────────────────────────────────
let _resend = null;
function getResend() {
  if (!_resend) {
    const key = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
    _resend = new Resend(key || 'placeholder');
  }
  return _resend;
}

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://merlin2.fly.dev';

// ============================================================================
// SEED DATABASE — Commercial Solar + BESS EPC / Integrators
// ============================================================================
// Each record includes:
//   id           unique slug
//   name         company name
//   tier         'national' | 'regional' | 'local'
//   states       array of 2-letter state codes; ['*'] = nationwide
//   verticals    array of verticals this firm is strong in; ['*'] = all C&I
//   focus        brief descriptor for quote display
//   website      company URL
//   contact_email primary contact / BD email
//   phone        main phone
//   hq_city      HQ location label
//   relationship_status   'target' | 'contacted' | 'partner'
//   notes        internal notes
// ============================================================================

export const EPC_SEED = [
  // ── NATIONAL ────────────────────────────────────────────────────────────────
  {
    id: 'powerflex',
    name: 'PowerFlex',
    tier: 'national',
    states: ['*'],
    verticals: ['*'],
    focus: 'Commercial solar, BESS & EV charging — 500+ MW installed, 70K+ chargers under management',
    website: 'https://www.powerflex.com',
    contact_email: 'experts@powerflex.com',
    phone: null,
    hq_city: 'El Segundo, CA',
    relationship_status: 'target',
    notes: 'Toyota/EDF subsidiary. Full-service C&I solar + BESS + EV. Best for hotel, car wash, EV vertical.',
  },
  {
    id: 'altus-power',
    name: 'Altus Power',
    tier: 'national',
    states: ['*'],
    verticals: ['*'],
    focus: 'Largest on-site commercial solar owner-operator in the US — financed/PPAs available',
    website: 'https://www.altuspower.com',
    contact_email: 'commercial@altuspower.com',
    phone: '888-882-5887',
    hq_city: 'Stamford, CT',
    relationship_status: 'target',
    notes: 'Acquired by TPG Rise Climate 2025. Offers PPA financing — no capex for customer.',
  },
  {
    id: 'borrego',
    name: 'Borrego',
    tier: 'national',
    states: ['*'],
    verticals: ['*'],
    focus: 'Commercial & community solar EPC + development — 1 GW+ installed',
    website: 'https://www.borregoenergy.com',
    contact_email: 'info@borregoenergy.com',
    phone: '617-626-9900',
    hq_city: 'San Diego, CA',
    relationship_status: 'target',
    notes: 'Formerly Borrego Solar. Strong in C&I rooftop + ground-mount. Deep BESS experience.',
  },
  {
    id: 'swell-energy',
    name: 'Swell Energy',
    tier: 'national',
    states: ['CA', 'HI', 'TX', 'NY', 'NJ', 'MA', 'CT', 'FL', 'AZ', 'NV'],
    verticals: ['*'],
    focus: 'Distributed solar + storage + VPP integration — residential & small commercial',
    website: 'https://www.swellenergy.com',
    contact_email: 'partners@swellenergy.com',
    phone: '888-465-1784',
    hq_city: 'Los Angeles, CA',
    relationship_status: 'target',
    notes: 'Strong VPP / demand response angle. Good for smaller C&I. Partner program exists.',
  },

  // ── WEST COAST ──────────────────────────────────────────────────────────────
  {
    id: 'cal-solar',
    name: 'Cal Solar Inc.',
    tier: 'regional',
    states: ['CA'],
    verticals: ['*'],
    focus: 'Full-service commercial EPC — solar, BESS, EV — 700+ projects across California',
    website: 'https://www.calsolarinc.com',
    contact_email: 'info@calsolarinc.com',
    phone: '800-784-7612',
    hq_city: 'Los Angeles, CA',
    relationship_status: 'target',
    notes: 'Offices in LA, San Diego, Hayward. Self-perform crews. Top choice for CA C&I deals.',
  },
  {
    id: '1st-light-energy',
    name: '1st Light Energy',
    tier: 'regional',
    states: ['CA', 'NV', 'AZ', 'OR', 'WA'],
    verticals: ['car_wash', 'hotel', 'warehouse', 'retail', 'ev_charging'],
    focus: 'Commercial storage specialist — 816+ C&I BESS installs, self-storage & retail sector expert',
    website: 'https://www.1stle.com',
    contact_email: 'intake@1stle.com',
    phone: '209-824-5500',
    hq_city: 'Manteca, CA',
    relationship_status: 'target',
    notes: 'Highly recommended for storage-first deals. 816 C&I BESS installs — deep operational data.',
  },
  {
    id: 'solv-energy',
    name: 'SOLV Energy',
    tier: 'regional',
    states: ['CA', 'NV', 'AZ', 'TX', 'CO', 'OR', 'WA', 'MT', 'ID', 'UT'],
    verticals: ['truck_stop', 'warehouse', 'ev_charging'],
    focus: '#2 US solar EPC and BESS EPC — large-scale solar+storage, data center and fleet sites',
    website: 'https://www.solvenergy.com',
    contact_email: 'info@solvenergy.com',
    phone: '858-251-4888',
    hq_city: 'San Diego, CA',
    relationship_status: 'target',
    notes: 'Primarily utility-scale. Good fit for truck-stop DockChain or large EV fleet installs.',
  },
  {
    id: 'sullivan-solar',
    name: 'Sullivan Solar Power',
    tier: 'regional',
    states: ['CA'],
    verticals: ['car_wash', 'hotel', 'retail', 'restaurant'],
    focus: 'Commercial & residential solar — San Diego based, C&I rooftop expert',
    website: 'https://www.sullivansolarsystem.com',
    contact_email: 'info@sullivansolarsystem.com',
    phone: '844-282-3131',
    hq_city: 'San Diego, CA',
    relationship_status: 'target',
    notes: 'Known locally in SD. Good for mid-size C&I projects up to ~500 kW.',
  },
  {
    id: 'sunsystem-technology',
    name: 'SunSystem Technology',
    tier: 'regional',
    states: ['CA', 'NV'],
    verticals: ['*'],
    focus: 'Commercial solar + storage design/build — Central Valley and Southern Nevada coverage',
    website: 'https://sunsystemtechnology.com',
    contact_email: 'info@sunsystemtechnology.com',
    phone: '559-221-4165',
    hq_city: 'Fresno, CA',
    relationship_status: 'target',
    notes: 'Strong in Central Valley CA and NV. Good contact for car wash + ag + retail.',
  },

  // ── SOUTHWEST ───────────────────────────────────────────────────────────────
  {
    id: 'pivot-energy',
    name: 'Pivot Energy',
    tier: 'regional',
    states: ['CO', 'TX', 'AZ', 'NM', 'UT', 'NV', 'KS', 'IL', 'MN'],
    verticals: ['*'],
    focus: 'Commercial and community solar developer/EPC — Rocky Mountain and Midwest specialist',
    website: 'https://pivotenergy.net',
    contact_email: 'info@pivotenergy.net',
    phone: '720-726-4600',
    hq_city: 'Denver, CO',
    relationship_status: 'target',
    notes: 'Development + EPC + O&M. Strong in CO, TX, AZ. Offers PPA/lease structures.',
  },
  {
    id: 'signal-energy',
    name: 'Signal Energy',
    tier: 'regional',
    states: ['TX', 'OK', 'LA', 'AR', 'MS', 'TN', 'AL', 'GA', 'FL', 'NC', 'SC'],
    verticals: ['truck_stop', 'warehouse', 'ev_charging'],
    focus: 'EPC/BOP for solar + storage — Southeast and Gulf Coast specialist',
    website: 'https://signalenergy.com',
    contact_email: 'contact@signalenergy.com',
    phone: null,
    hq_city: 'Houston, TX',
    relationship_status: 'target',
    notes: 'Houston HQ + Chattanooga TN. Primarily utility-scale BOP. Good TX/Southeast contact.',
  },
  {
    id: 'sunstate-solar',
    name: 'SunState Solar',
    tier: 'regional',
    states: ['NM', 'AZ', 'CO', 'TX'],
    verticals: ['car_wash', 'hotel', 'retail', 'restaurant', 'ev_charging'],
    focus: 'Commercial & residential solar + battery backup — New Mexico and Southwest EPC',
    website: 'https://sunstatesolar.com',
    contact_email: 'getstarted@sunstatesolar.com',
    phone: '505-225-8502',
    hq_city: 'Albuquerque, NM',
    relationship_status: 'target',
    notes: 'NM License EE98/GB98. Local NM specialist. Good for car wash and retail in Albuquerque/Santa Fe.',
  },
  {
    id: 'verogy',
    name: 'Verogy',
    tier: 'regional',
    states: ['CT', 'NY', 'NJ', 'MA', 'RI', 'PA', 'MD', 'VA', 'AR', 'TX'],
    verticals: ['*'],
    focus: 'Commercial solar development, EPC and project finance — Northeast to mid-South',
    website: 'https://www.verogy.com',
    contact_email: 'info@verogy.com',
    phone: '860-288-7215',
    hq_city: 'West Hartford, CT',
    relationship_status: 'target',
    notes: 'Offices in West Hartford CT + Bentonville AR. C&I + municipal. Financing expertise.',
  },

  // ── NORTHEAST ───────────────────────────────────────────────────────────────
  {
    id: 'nexamp',
    name: 'Nexamp',
    tier: 'regional',
    states: ['MA', 'NY', 'IL', 'NH', 'VT', 'ME', 'RI', 'CT', 'NJ', 'MD', 'VA', 'NC', 'MN'],
    verticals: ['*'],
    focus: 'Community and commercial solar — own, operate and maintain solar farms across 13 states',
    website: 'https://www.nexamp.com',
    contact_email: 'commercial@nexamp.com',
    phone: '617-224-1050',
    hq_city: 'Boston, MA',
    relationship_status: 'target',
    notes: 'Offers subscription solar (no install needed). C&I direct install also available.',
  },
  {
    id: 'solar-alliance',
    name: 'Solar Alliance',
    tier: 'regional',
    states: ['TN', 'VA', 'NC', 'SC', 'GA', 'AL', 'KY', 'OH', 'IN', 'IL'],
    verticals: ['car_wash', 'hotel', 'retail', 'restaurant', 'warehouse'],
    focus: 'Commercial solar EPC — Southeastern and Midwest mid-market specialist',
    website: 'https://www.solar-alliance.com',
    contact_email: 'info@solar-alliance.com',
    phone: '865-392-4960',
    hq_city: 'Knoxville, TN',
    relationship_status: 'target',
    notes: 'Knoxville-based. Strong relationships in TN, VA, NC, GA. Good for car wash + hotel.',
  },

  // ── SOUTHEAST / FLORIDA ─────────────────────────────────────────────────────
  {
    id: 'sungate-energy',
    name: 'Sungate Energy',
    tier: 'regional',
    states: ['FL', 'GA', 'SC', 'NC'],
    verticals: ['car_wash', 'hotel', 'retail', 'restaurant'],
    focus: 'Florida commercial solar EPC — hospitality, retail, and service sector specialist',
    website: 'https://www.sungateenergy.com',
    contact_email: 'info@sungateenergy.com',
    phone: '407-641-9109',
    hq_city: 'Orlando, FL',
    relationship_status: 'target',
    notes: 'Florida-focused C&I solar. Good for hotel + car wash quotes in FL.',
  },
  {
    id: 'solarsmith-energy',
    name: 'SolarSmith Energy',
    tier: 'regional',
    states: ['FL', 'TX'],
    verticals: ['*'],
    focus: 'Commercial solar + BESS design-build — Florida and Texas C&I market',
    website: 'https://www.solarsmithenergy.com',
    contact_email: 'info@solarsmithenergy.com',
    phone: '813-930-9100',
    hq_city: 'Tampa, FL',
    relationship_status: 'target',
    notes: 'Tampa-based. Growing TX presence. BESS + EV charging integration experience.',
  },

  // ── MIDWEST ─────────────────────────────────────────────────────────────────
  {
    id: 'inovateus-solar',
    name: 'Inovateus Solar',
    tier: 'regional',
    states: ['IN', 'MI', 'OH', 'IL', 'WI', 'MN', 'MO', 'KY', 'TN'],
    verticals: ['*'],
    focus: 'Midwest commercial and utility solar EPC — 250+ MW installed in region',
    website: 'https://inovateus.com',
    contact_email: 'info@inovateus.com',
    phone: '574-400-4765',
    hq_city: 'South Bend, IN',
    relationship_status: 'target',
    notes: 'One of the strongest Midwest C&I EPCs. Hotel, manufacturing, municipal projects.',
  },
  {
    id: 'edf-renewables',
    name: 'EDF Renewables North America',
    tier: 'national',
    states: ['*'],
    verticals: ['truck_stop', 'ev_charging', 'warehouse'],
    focus: 'Large-scale C&I + utility solar/BESS/wind developer — EDF group subsidiary',
    website: 'https://www.edf-re.com',
    contact_email: 'contact@edf-re.com',
    phone: '858-521-3600',
    hq_city: 'San Diego, CA',
    relationship_status: 'target',
    notes: 'Parent company of PowerFlex. C&I + utility. Best for large multi-site programs (e.g. highway EV network).',
  },

  // ── BESS-SPECIALIST INTEGRATORS ─────────────────────────────────────────────
  {
    id: 'stem-inc',
    name: 'Stem, Inc.',
    tier: 'national',
    states: ['*'],
    verticals: ['*'],
    focus: 'AI-driven BESS optimization and integration — Athena platform, C&I + utility',
    website: 'https://www.stem.com',
    contact_email: 'info@stem.com',
    phone: '866-374-7836',
    hq_city: 'San Francisco, CA',
    relationship_status: 'target',
    notes: 'Primarily BESS software + integration, not EPC. Pairs with Fluence/Tesla/Powin hardware. Athena AI dispatch.',
  },
  {
    id: 'powin-energy',
    name: 'Powin Energy',
    tier: 'national',
    states: ['*'],
    verticals: ['truck_stop', 'ev_charging', 'warehouse', 'hotel'],
    focus: 'BESS OEM + integration — Stack140 & Stack300 systems, turnkey C&I storage',
    website: 'https://www.powin.com',
    contact_email: 'info@powin.com',
    phone: '503-372-9096',
    hq_city: 'Portland, OR',
    relationship_status: 'target',
    notes: 'BESS OEM, not pure EPC. Can bundle with third-party installer. Good Fluence alternative.',
  },
  {
    id: 'cupertino-electric',
    name: 'Cupertino Electric, Inc.',
    tier: 'national',
    states: ['CA', 'NV', 'AZ', 'TX', 'GA', 'NC', 'VA', 'MA', 'NY'],
    verticals: ['ev_charging', 'truck_stop', 'warehouse'],
    focus: 'Electrical EPC — large-scale solar, BESS and EV infrastructure contractor',
    website: 'https://www.cei.com',
    contact_email: 'business.development@cei.com',
    phone: '408-808-8000',
    hq_city: 'San Jose, CA',
    relationship_status: 'target',
    notes: 'Major national electrical contractor. Tier-1 for large commercial EV fleet and BESS installs.',
  },
  {
    id: 'rosendin-electric',
    name: 'Rosendin Electric',
    tier: 'national',
    states: ['CA', 'NV', 'AZ', 'TX', 'WA', 'OR', 'CO', 'NC', 'FL'],
    verticals: ['ev_charging', 'truck_stop', 'warehouse'],
    focus: 'National electrical contractor — solar, BESS, EV charging infrastructure at scale',
    website: 'https://www.rosendin.com',
    contact_email: 'info@rosendin.com',
    phone: '408-286-2800',
    hq_city: 'San Jose, CA',
    relationship_status: 'target',
    notes: 'Top 5 US electrical contractor. C&I solar + EV. Good for multi-site truck stop EV networks.',
  },
];

// ============================================================================
// HELPER — find best EPC match for a state + vertical
// ============================================================================
/**
 * Returns the best matching EPC partner for a given US state and vertical.
 * Preference order:
 *   1. regional/local firm matching state AND vertical specifically
 *   2. regional/local firm matching state (any vertical)
 *   3. national firm matching vertical
 *   4. national generalist fallback
 *
 * @param {string} state   - 2-letter state code e.g. 'NV'
 * @param {string} vertical - vertical key e.g. 'car_wash'
 * @returns {{ firm: object, matchReason: string } | null}
 */
export function findInstallerForState(state, vertical) {
  if (!state) return null;
  const st = state.toUpperCase();
  const v  = vertical || '*';

  const stateMatch = (firm) =>
    firm.states.includes('*') || firm.states.includes(st);
  const verticalMatch = (firm) =>
    firm.verticals.includes('*') || firm.verticals.includes(v);

  // 1. regional + state-match + vertical-match
  let candidates = EPC_SEED.filter(f =>
    f.tier !== 'national' && stateMatch(f) && verticalMatch(f)
  );
  if (candidates.length) {
    return { firm: candidates[0], matchReason: `Regional specialist — ${st} / ${v}` };
  }

  // 2. regional + state-match
  candidates = EPC_SEED.filter(f => f.tier !== 'national' && stateMatch(f));
  if (candidates.length) {
    return { firm: candidates[0], matchReason: `Regional firm covering ${st}` };
  }

  // 3. national + vertical-match
  candidates = EPC_SEED.filter(f => f.tier === 'national' && verticalMatch(f));
  if (candidates.length) {
    return { firm: candidates[0], matchReason: `National EPC partner` };
  }

  // 4. national fallback
  const fallback = EPC_SEED.find(f => f.tier === 'national');
  return fallback ? { firm: fallback, matchReason: 'National EPC partner (fallback)' } : null;
}

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/epc/find?state=NV&vertical=car_wash
router.get('/find', (req, res) => {
  const { state, vertical } = req.query;
  if (!state) return res.status(400).json({ error: 'state is required' });

  const result = findInstallerForState(state, vertical);
  if (!result) return res.status(404).json({ error: 'No matching installer found' });

  return res.json({
    installer: {
      id:             result.firm.id,
      name:           result.firm.name,
      tier:           result.firm.tier,
      focus:          result.firm.focus,
      website:        result.firm.website,
      contact_email:  result.firm.contact_email,
      phone:          result.firm.phone,
      hq_city:        result.firm.hq_city,
    },
    matchReason: result.matchReason,
  });
});

// GET /api/epc/list
router.get('/list', (_req, res) => {
  res.json({
    count: EPC_SEED.length,
    partners: EPC_SEED.map(f => ({
      id:                  f.id,
      name:                f.name,
      tier:                f.tier,
      states:              f.states,
      verticals:           f.verticals,
      focus:               f.focus,
      website:             f.website,
      contact_email:       f.contact_email,
      phone:               f.phone,
      hq_city:             f.hq_city,
      relationship_status: f.relationship_status,
      notes:               f.notes,
    })),
  });
});

// POST /api/epc/outreach/:id
// Sends a partnership introduction email to the named EPC firm via Resend
router.post('/outreach/:id', async (req, res) => {
  const { id } = req.params;
  const firm = EPC_SEED.find(f => f.id === id);
  if (!firm) return res.status(404).json({ error: `No EPC partner with id "${id}"` });
  if (!firm.contact_email) return res.status(400).json({ error: 'No contact email on file for this firm' });

  const { senderName = 'Robert Christopher', senderTitle = 'Founder, Merlin Energy' } = req.body || {};

  const subject = `Partnership Opportunity — Merlin TrueQuote Referrals for ${firm.name}`;
  const html = buildOutreachEmail({ firm, senderName, senderTitle });

  try {
    const resend = getResend();
    const sent = await resend.emails.send({
      from: `TrueQuote by Merlin <hello@merlin.energy>`,
      to:   [firm.contact_email],
      subject,
      html,
      reply_to: 'robert@merlin.energy',
    });
    console.log(`[EPC outreach] Sent to ${firm.name} <${firm.contact_email}>`, sent);
    // Update in-memory status
    firm.relationship_status = 'contacted';
    res.json({ success: true, firmId: id, to: firm.contact_email, resendId: sent?.data?.id });
  } catch (err) {
    console.error('[EPC outreach] Resend error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// OUTREACH EMAIL TEMPLATE
// ============================================================================
function buildOutreachEmail({ firm, senderName, senderTitle }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Partnership Opportunity — Merlin TrueQuote</title>
  <style>
    body { margin:0; padding:0; background:#f4f5f7; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .outer { max-width:620px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .header { background:#0f172a; padding:32px 40px; }
    .header h1 { color:#fff; margin:0; font-size:22px; font-weight:700; letter-spacing:-.3px; }
    .header p  { color:#94a3b8; margin:4px 0 0; font-size:14px; }
    .body { padding:36px 40px; color:#1e293b; }
    .body p { font-size:15px; line-height:1.7; margin:0 0 16px; }
    .highlight { background:#f0fdf4; border-left:4px solid #22c55e; padding:16px 20px; border-radius:6px; margin:24px 0; }
    .highlight p { margin:0; font-size:14px; color:#15803d; }
    .cta { display:inline-block; margin-top:8px; background:#2563eb; color:#fff; text-decoration:none; padding:12px 28px; border-radius:8px; font-size:15px; font-weight:600; }
    .footer { background:#f8fafc; padding:24px 40px; border-top:1px solid #e2e8f0; }
    .footer p { margin:0; font-size:13px; color:#64748b; line-height:1.6; }
  </style>
</head>
<body>
<div class="outer">
  <div class="header">
    <h1>TrueQuote by Merlin</h1>
    <p>AI-Powered Commercial Energy Quoting</p>
  </div>
  <div class="body">
    <p>Hi ${firm.name} team,</p>

    <p>My name is ${senderName} — I'm the ${senderTitle}. We're building <strong>TrueQuote</strong>, an AI-powered quoting engine that identifies commercial businesses (car washes, hotels, truck stops, EV charging operators) in a target market, models their solar + BESS savings opportunity, and delivers a professionally prepared energy quote — automatically.</p>

    <p>We're generating qualified, location-specific leads with pre-built quotes, system sizing, ROI projections, and Monte Carlo payback analysis — and we're building a network of trusted EPC / installation partners to execute these projects on the ground.</p>

    <div class="highlight">
      <p><strong>Why we're reaching out to ${firm.name}:</strong><br/>
      ${firm.focus}.<br/>
      Your coverage area and expertise align closely with the leads we're generating — we'd love to explore a referral or co-proposal relationship.</p>
    </div>

    <p>Here's the model we're proposing:</p>
    <ul style="font-size:15px; line-height:1.8; color:#1e293b; padding-left:20px;">
      <li>Merlin identifies the prospect, runs the quote analysis, and warms the lead.</li>
      <li>We co-brand the quote with your firm as the named installation partner.</li>
      <li>When the lead converts, you execute the project — Merlin earns a referral fee.</li>
      <li>You get warm, pre-qualified leads with full energy analysis attached.</li>
    </ul>

    <p>We'd love to hop on a 20-minute call to explore this. You can schedule directly here:</p>
    <a href="https://cal.com/truequote" class="cta">Schedule a 20-min call →</a>

    <p style="margin-top:28px;">Looking forward to connecting,<br/>
    <strong>${senderName}</strong><br/>
    ${senderTitle}<br/>
    <a href="mailto:robert@merlin.energy" style="color:#2563eb;">robert@merlin.energy</a> · <a href="${APP_BASE_URL}" style="color:#2563eb;">merlin.energy</a></p>
  </div>
  <div class="footer">
    <p>TrueQuote by Merlin · Las Vegas, NV · <a href="https://merlin.energy" style="color:#2563eb;">merlin.energy</a></p>
    <p style="margin-top:6px;">You're receiving this because we believe ${firm.name} is an excellent fit for our installer network. To opt out, reply "unsubscribe."</p>
  </div>
</div>
</body>
</html>`;
}

export default router;
