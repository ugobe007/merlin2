#!/usr/bin/env node
/**
 * MERLIN AUTONOMOUS GROWTH LOOP
 * -----------------------------------------------------------------------------
 * Runs daily at 3am PT via node-cron in server/index.js.
 * Also triggerable via POST /api/admin/run-growth-loop.
 *
 * Pipeline:
 *  1. Site health     - tests critical routes, scores 0-100
 *  2. Funnel metrics  - users / quotes / leads + friction signals
 *  3. Market pulse    - energy RSS headlines (Greentech, Electrek, Politico)
 *  4. GPT-4o decision - returns structured JSON of copy changes to make
 *  5. Executor        - writes changes to site_copy table, logs to growth_actions
 *  6. Digest          - sends weekly email summary every Friday
 *
 * React reads from site_copy via useSiteCopy() hook - zero deploys needed.
 * Every change logs previous_value so rollback is a single DB update.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const BASE_URL    = process.env.MERLIN_BASE_URL  ?? 'https://merlin2.fly.dev';
const SITE_URL    = process.env.MERLIN_SITE_URL  ?? 'https://merlinenergy.net';
const OPENAI_KEY  = process.env.VITE_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'robertchristopher@gmail.com';
const RESEND_KEY  = process.env.RESEND_API_KEY ?? process.env.VITE_RESEND_API_KEY ?? '';

const sb = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { persistSession: false } }
);

// Keys the AI is permitted to write. Anything outside this list is blocked.
const ALLOWED_KEYS = new Set([
  'hero_headline_prefix', 'hero_accent_lines', 'hero_subtext',
  'hero_badge_text', 'hero_proof_items', 'hero_cta_primary',
  'hero_cta_secondary', 'modal_headline', 'modal_subtext',
  'modal_cta_text', 'nav_cta_text',
]);

// ── helpers ───────────────────────────────────────────────────────────────────
async function safeFetch(url: string, opts?: RequestInit, ms = 12_000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal, ...opts });
    clearTimeout(t);
    return { ok: r.ok, status: r.status, body: await r.text().catch(() => '') };
  } catch (e: unknown) {
    clearTimeout(t);
    return { ok: false, status: 0, body: String(e) };
  }
}

// ── Module 1: Site Health ─────────────────────────────────────────────────────
async function runHealth() {
  const checks = [
    { name: 'homepage',          url: SITE_URL },
    { name: 'pricing',           url: `${SITE_URL}/pricing` },
    { name: 'quote tool',        url: `${SITE_URL}/wizard` },
    { name: 'health API',        url: `${BASE_URL}/api/health` },
    { name: 'opportunities API', url: `${BASE_URL}/api/opportunities?limit=1` },
  ];
  const results = await Promise.all(checks.map(async c => ({ ...c, ...(await safeFetch(c.url)) })));
  const failed  = results.filter(r => !r.ok);
  return {
    score: Math.round((results.filter(r => r.ok).length / results.length) * 100),
    failedRoutes: failed.map(r => ({ name: r.name, status: r.status })),
  };
}

// ── Module 2: Funnel ──────────────────────────────────────────────────────────
async function runFunnel() {
  const r = await safeFetch(`${BASE_URL}/api/admin/stats`);
  let s: Record<string, number> = {};
  try { s = JSON.parse(r.body)?.stats ?? {}; } catch (_e) { /* ignore */ }
  const totalUsers     = s.totalUsers     ?? 0;
  const totalQuotes    = s.totalQuotes    ?? 0;
  const qualifiedLeads = s.qualifiedLeads ?? 0;
  const friction: string[] = [];
  if (totalUsers === 0)                                         friction.push('CRITICAL: zero users - signup broken');
  if (totalUsers > 5 && totalQuotes / totalUsers < 0.2)        friction.push('Quote conversion below 20%');
  if (totalQuotes > 5 && qualifiedLeads / totalQuotes < 0.1)   friction.push('Lead rate below 10%');
  return { totalUsers, totalQuotes, qualifiedLeads, friction };
}

// ── Module 3: Market Headlines ────────────────────────────────────────────────
async function runMarket() {
  const feeds = [
    'https://www.greentechmedia.com/rss/all',
    'https://electrek.co/feed',
    'https://rss.politico.com/energy.xml',
  ];
  const headlines: string[] = [];
  await Promise.all(feeds.map(async feed => {
    const r = await safeFetch(feed, {}, 8_000);
    if (!r.ok) return;
    for (const m of r.body.matchAll(/<title>(?:<!\[CDATA\[)?([^\]<]{20,120})(?:\]\]>)?<\/title>/g)) {
      if (headlines.length < 15) headlines.push((m[1] ?? '').trim());
    }
  }));
  return headlines;
}

// ── Module 4: Read current site copy from DB ──────────────────────────────────
async function readCopy(): Promise<Record<string, string>> {
  const { data } = await sb.from('site_copy').select('key, value');
  const m: Record<string, string> = {};
  for (const row of data ?? []) m[row.key] = row.value;
  return m;
}

// ── Module 5: GPT-4o decision engine ─────────────────────────────────────────
interface CopyChange { key: string; value: string; rationale: string; }
interface Decision   { brief: string; insights: string[]; changes: CopyChange[]; }

async function decide(
  health:    Awaited<ReturnType<typeof runHealth>>,
  funnel:    Awaited<ReturnType<typeof runFunnel>>,
  headlines: string[],
  copy:      Record<string, string>,
): Promise<Decision | null> {
  if (!OPENAI_KEY) { console.warn('[growth] No OPENAI_KEY — skipping AI decisions'); return null; }

  const allowedList = [...ALLOWED_KEYS].join(', ');
  const lines = [
    'You are the autonomous growth engine for Merlin Energy.',
    'Merlin is a B2B SaaS: instant CFO-ready BESS/solar quotes in 60 seconds, free, replacing $500/hr consultants.',
    'Target buyers: CFOs and Ops Directors at carwashes, warehouses, hotels, manufacturers feeling utility cost pain.',
    '',
    '## Live Data',
    `Site health: ${health.score}/100` + (health.failedRoutes.length ? ' BROKEN: ' + health.failedRoutes.map((x: { name: string }) => x.name).join(', ') : ''),
    `Users: ${funnel.totalUsers} | Quotes: ${funnel.totalQuotes} | Leads: ${funnel.qualifiedLeads}`,
    `Friction: ${funnel.friction.join('; ') || 'none'}`,
    '',
    '## Energy headlines today',
    ...headlines.slice(0, 8).map(h => `- ${h}`),
    '',
    '## Current live copy',
    ...Object.entries(copy).map(([k, v]) => `${k}: ${v.slice(0, 100)}`),
    '',
    '## Instructions',
    'Rewrite 2-5 copy keys to maximize signups. Rules:',
    '- Tie copy to real market pain from the headlines above',
    '- Every CTA must feel zero-risk (free, instant, no commitment)',
    '- hero_accent_lines: JSON array of exactly 3 phrases (max 6 words) completing "Reduce Utility Risk ___"',
    '- hero_proof_items: JSON array of exactly 3 short trust signals',
    '- Only change keys where you have HIGH confidence it lifts conversions',
    '',
    `Allowed keys: ${allowedList}`,
    '',
    'Return ONLY valid JSON:',
    '{ "brief": "2-3 sentences on what you changed and why",',
    '  "insights": ["insight 1", "insight 2"],',
    '  "changes": [{"key": "hero_headline_prefix", "value": "...", "rationale": "..."}] }',
  ];

  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 45_000);
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: lines.join('\n') }],
        max_tokens: 1200, temperature: 0.75,
        response_format: { type: 'json_object' },
      }),
      signal: c.signal,
    });
    clearTimeout(t);
    if (!r.ok) { console.error('[gpt] HTTP', r.status); return null; }
    const j = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
    return JSON.parse(j.choices?.[0]?.message?.content ?? 'null') as Decision;
  } catch (e) { clearTimeout(t); console.error('[gpt]', e); return null; }
}

// ── Module 6: Apply approved changes to DB ────────────────────────────────────
async function applyChanges(changes: CopyChange[], reportId: string | null): Promise<CopyChange[]> {
  const applied: CopyChange[] = [];
  for (const ch of changes) {
    if (!ALLOWED_KEYS.has(ch.key) || !ch.value?.trim()) {
      console.warn(`[growth] blocked key: ${ch.key}`);
      continue;
    }
    const { data: cur } = await sb.from('site_copy').select('value').eq('key', ch.key).maybeSingle();
    const { error } = await sb.from('site_copy').upsert({
      key: ch.key, value: ch.value,
      previous_value: cur?.value ?? null,
      updated_at: new Date().toISOString(),
      updated_by: 'ai-growth-loop',
      rationale: ch.rationale,
    });
    if (error) { console.error(`[growth] write ${ch.key}:`, error.message); continue; }
    await sb.from('growth_actions').insert({
      copy_key: ch.key, old_value: cur?.value ?? null,
      new_value: ch.value, rationale: ch.rationale, report_id: reportId,
    });
    applied.push(ch);
    console.log(`  OK ${ch.key} -> ${ch.value.slice(0, 65)}`);
  }
  return applied;
}

// ── Module 7: Friday digest email ─────────────────────────────────────────────
async function sendDigest(
  brief:   string,
  applied: CopyChange[],
  funnel:  Awaited<ReturnType<typeof runFunnel>>,
  health:  Awaited<ReturnType<typeof runHealth>>,
) {
  if (!RESEND_KEY || new Date().getDay() !== 5) return; // Fridays only
  const rows = applied.length
    ? applied.map(c => `<li><b>${c.key}</b>: ${c.value.slice(0, 100)}<br><small>${c.rationale}</small></li>`).join('')
    : '<li>No changes this week.</li>';
  const html = [
    '<h2>Merlin Weekly Growth Digest</h2>',
    `<p>${brief}</p>`,
    '<h3>Stats</h3><ul>',
    `<li>Users: ${funnel.totalUsers}</li><li>Quotes: ${funnel.totalQuotes}</li>`,
    `<li>Leads: ${funnel.qualifiedLeads}</li><li>Site health: ${health.score}/100</li>`,
    `</ul><h3>Copy Changes</h3><ul>${rows}</ul>`,
    `<p><a href="${SITE_URL}/admin">View admin dashboard</a></p>`,
  ].join('');
  await safeFetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: 'Merlin Growth <growth@merlinenergy.net>',
      to: [ADMIN_EMAIL],
      subject: `Merlin Weekly Growth - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      html,
    }),
  }, 15_000).then(r => console.log(r.ok ? '[growth] digest sent' : `[growth] digest failed: ${r.status}`));
}

// ── Main (exported so server/index.js can call it via cron) ───────────────────
export async function runGrowthLoop() {
  const startedAt = new Date().toISOString();
  console.log('\n' + '='.repeat(56) + '\n MERLIN GROWTH LOOP  ' + startedAt + '\n' + '='.repeat(56));

  const [health, funnel, headlines, copy] = await Promise.all([
    runHealth(), runFunnel(), runMarket(), readCopy(),
  ]);
  console.log(`Health: ${health.score}/100 | Users: ${funnel.totalUsers} | Headlines: ${headlines.length}`);

  const decision = await decide(health, funnel, headlines, copy);
  let reportId: string | null = null;
  let applied:  CopyChange[]  = [];

  if (decision) {
    console.log(`\nBrief: ${decision.brief}`);
    const { data: rr } = await sb.from('growth_reports').insert({
      ran_at: startedAt, site_health_score: health.score,
      failed_routes: health.failedRoutes, total_users: funnel.totalUsers,
      total_quotes: funnel.totalQuotes, friction_signals: funnel.friction,
      market_headlines: headlines, growth_brief: decision.brief,
      raw: { health, funnel, decision },
    }).select('id').maybeSingle();
    reportId = rr?.id ?? null;
    applied  = await applyChanges(decision.changes, reportId);
    await sendDigest(decision.brief, applied, funnel, health);
  }

  console.log(`\nGrowth loop complete - ${applied.length} changes applied\n`);
  return { applied: applied.length, reportId, brief: decision?.brief ?? null };
}

// Allow direct execution: node agents/growth-loop.mjs
if (process.argv[1]?.match(/growth-loop\.(mjs|ts)$/)) {
  runGrowthLoop().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
