/**
 * Facility-owner lead capture.
 * POST /api/facility-leads
 * GET  /api/utility/resolve
 *
 * The ZIP resolver here is the car-wash estimate table only.
 * It does not replace /api/places, /api/location, or the wizard utility lookup.
 *
 * A lead is appended to a JSONL audit log before email is attempted.
 * Supabase remains the primary store. If email fails, the lead is still saved
 * and the response says notified:false rather than pretending it was sent.
 */
import express from 'express';
import { appendFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { resolveUtility, reconcileWithBill } from '../../src/services/carwashUtilityResolve.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_LOG = process.env.AUDIT_LOG || path.join(__dirname, '..', 'data', 'leads.jsonl');
const LOOKUP = JSON.parse(
  readFileSync(new URL('../../src/data/utility_zip_lookup.json', import.meta.url), 'utf8')
);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Merlin Energy <hello@merlinenergy.net>';
const SALES_EMAIL = process.env.LEAD_INBOX || 'sales@merlinenergy.net';
const hits = new Map();

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getResend() {
  const key = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function clean(value, max = 240) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function limited(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const recent = (hits.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (recent.length >= 10) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

async function audit(record) {
  await mkdir(path.dirname(AUDIT_LOG), { recursive: true });
  await appendFile(AUDIT_LOG, JSON.stringify({ ts: new Date().toISOString(), ...record }) + '\n', 'utf8');
}

function tallySites(text) {
  const addresses = String(text || '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 500);
  const sites = addresses.map((address) => ({ address, resolution: resolveUtility(address, LOOKUP) }));
  const tally = { strong: 0, moderate: 0, weak: 0, unresolved: 0 };
  for (const site of sites) {
    if (!site.resolution.resolved) tally.unresolved += 1;
    else if (site.resolution.region.verdict === 'strong') tally.strong += 1;
    else if (site.resolution.region.verdict === 'moderate') tally.moderate += 1;
    else if (site.resolution.region.verdict === 'weak') tally.weak += 1;
    else tally.unresolved += 1;
  }
  return { sites, tally };
}

router.get('/utility/resolve', (req, res) => {
  res.json({ ok: true, resolution: resolveUtility(String(req.query.address || ''), LOOKUP) });
});

router.post('/facility-leads', async (req, res) => {
  if (req.body?.company_website_url) return res.json({ ok: true });
  if (limited(req.ip || 'unknown')) {
    return res.status(429).json({ ok: false, error: 'Too many submissions from this address. Try again shortly.' });
  }

  const name = clean(req.body?.name, 120);
  const email = clean(req.body?.email, 180).toLowerCase();
  const phone = clean(req.body?.phone, 40);
  const company = clean(req.body?.company, 160);
  const industry = clean(req.body?.industry, 80);
  const location = clean(req.body?.location, 400);
  const zip = clean(req.body?.zip, 12);
  const system = clean(req.body?.system, 4000);
  const intent = clean(req.body?.intent, 40) || 'installers';
  const utilityOnBill = clean(req.body?.utilityOnBill, 160);
  const addressForResolve = zip ? `${location} ${zip}` : location;
  const resolution = resolveUtility(addressForResolve, LOOKUP);
  const reconciliation = reconcileWithBill(resolution, utilityOnBill, LOOKUP);
  const portfolio = intent === 'portfolio' ? tallySites(req.body?.addresses || system) : null;

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Name and a valid email are required.' });
  }
  if (req.body?.consent !== true) {
    return res.status(400).json({ ok: false, error: 'Consent to be contacted is required.' });
  }

  const leadId = randomUUID();
  await audit({
    kind: intent,
    id: leadId,
    name,
    email,
    phone,
    company,
    industry,
    location,
    zip,
    system,
    utilityOnBill,
    resolution,
    reconciliation,
    portfolio: portfolio ? { tally: portfolio.tally, count: portfolio.sites.length } : null,
    ip: req.ip,
  });

  const supabase = getSupabase();
  let storedId = leadId;
  if (supabase) {
    const source = `facility-owner:${industry || 'unknown'}:${intent}`;
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone: phone || null,
        company: company || null,
        source,
        format: 'installer-bid',
      })
      .select('id')
      .single();
    if (error) console.error('[facility-leads] insert failed:', error.message);
    else if (data?.id) storedId = data.id;
  }

  const discrepancy = reconciliation.discrepancy
    ? `ZIP resolved to ${reconciliation.discrepancy.zipResolved} but the bill says ${reconciliation.discrepancy.billSays}. Bill wins.`
    : null;
  const territoryLine = resolution.resolved
    ? `${resolution.region.shortName} · ${resolution.confidence}${resolution.requiresConfirmation ? ' · confirm on bill' : ''} · ${resolution.region.verdict}`
    : `Unresolved · ${resolution.message}`;
  const portfolioLine = portfolio
    ? `Sites ${portfolio.sites.length}: strong ${portfolio.tally.strong}, moderate ${portfolio.tally.moderate}, weak ${portfolio.tally.weak}, unresolved ${portfolio.tally.unresolved}`
    : null;

  let notified = false;
  const resend = getResend();
  if (!resend) {
    return res.status(502).json({
      ok: false,
      leadId: storedId,
      error: 'We saved your submission but could not send it. Please retry, or email sales@merlinenergy.net directly.',
    });
  }

  const lines = [
    `New facility-owner lead`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    company ? `Company: ${company}` : null,
    industry ? `Industry: ${industry}` : null,
    location ? `Location: ${location}` : null,
    zip ? `ZIP: ${zip}` : null,
    `Territory: ${territoryLine}`,
    discrepancy,
    portfolioLine,
    system ? `Detail: ${system}` : null,
    req.body?.annualSavings != null ? `Annual savings (estimate, not certified): ${req.body.annualSavings}` : null,
    req.body?.paybackYears != null ? `Payback years (estimate): ${req.body.paybackYears}` : null,
    `Intent: ${intent}`,
    `Lead ID: ${storedId}`,
    ``,
    intent === 'demand-response'
      ? `Storage payback is long. Ask a demand-response aggregator before an installer. Reply to ${email}.`
      : `Reply to ${email}. A ZIP estimate is not a certified number.`,
  ].filter(Boolean);

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [SALES_EMAIL],
      reply_to: email,
      subject: intent === 'portfolio'
        ? `[Portfolio] ${company || name} — ${portfolio?.sites.length || 0} sites`
        : `[Lead] ${company || name} — ${resolution.resolved ? resolution.region.shortName : 'utility unresolved'}`,
      text: lines.join('\n'),
    });
    notified = !result.error;
    if (result.error) console.error('[facility-leads] email failed:', result.error);
  } catch (err) {
    console.error('[facility-leads] email exception:', err.message);
  }

  if (!notified) {
    return res.status(502).json({
      ok: false,
      leadId: storedId,
      error: 'We saved your submission but could not send it. Please retry, or email sales@merlinenergy.net directly.',
    });
  }

  return res.json({
    ok: true,
    leadId: storedId,
    notified,
    resolution,
    tally: portfolio?.tally || null,
  });
});

export default router;
