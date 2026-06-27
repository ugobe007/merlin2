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
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'ugobe07@gmail.com';
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

// ── Module 5: GPT-4o suggestion engine ───────────────────────────────────────
// Nothing is applied automatically. Everything goes into growth_suggestions
// for human review. Admin approves → changes are applied. Admin rejects → logged.

interface CopySuggestion {
  key: string;        // must be in ALLOWED_KEYS
  value: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

interface GeneralSuggestion {
  type: 'code' | 'design' | 'workflow' | 'ui' | 'optimization';
  title: string;
  description: string;   // specific, actionable, ready to implement
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

interface Decision {
  brief:             string;
  copy_suggestions:  CopySuggestion[];
  other_suggestions: GeneralSuggestion[];
}

async function decide(
  health:    Awaited<ReturnType<typeof runHealth>>,
  funnel:    Awaited<ReturnType<typeof runFunnel>>,
  headlines: string[],
  copy:      Record<string, string>,
): Promise<Decision | null> {
  if (!OPENAI_KEY) { console.warn('[growth] No OPENAI_KEY — skipping'); return null; }

  const allowedCopyKeys = [...ALLOWED_KEYS].join(', ');
  const prompt = [
    'You are the AI growth analyst for Merlin Energy.',
    'Merlin is a B2B SaaS: instant CFO-ready BESS/solar quotes in 60 seconds, free, replacing $500/hr energy consultants.',
    'Target buyers: CFOs and Ops Directors at carwashes, warehouses, hotels, manufacturers feeling utility cost pain.',
    '',
    '## Live System Data',
    `Site health: ${health.score}/100` + (health.failedRoutes.length ? ' | BROKEN: ' + health.failedRoutes.map((x: { name: string }) => x.name).join(', ') : ' | all routes OK'),
    `Signup funnel: ${funnel.totalUsers} users | ${funnel.totalQuotes} quotes | ${funnel.qualifiedLeads} leads routed`,
    `Friction: ${funnel.friction.join('; ') || 'none detected'}`,
    '',
    '## Energy market headlines today',
    ...headlines.slice(0, 10).map(h => `- ${h}`),
    '',
    '## Current live copy on site',
    ...Object.entries(copy).map(([k, v]) => `  ${k}: ${v.slice(0, 120)}`),
    '',
    '## Your job: Generate suggestions across 5 categories',
    '',
    '### 1. COPY SUGGESTIONS (2-4 items)',
    'Rewrite copy keys to maximize signups from buyers feeling utility cost pain RIGHT NOW.',
    '- Tie language directly to the market headlines above',
    '- Every CTA must feel zero-risk (free, instant, no commitment, no credit card)',
    '- hero_accent_lines = JSON array of exactly 3 phrases (max 6 words) completing "Reduce Utility Risk ___"',
    '- hero_proof_items  = JSON array of exactly 3 short trust/social-proof signals',
    `- Allowed copy keys: ${allowedCopyKeys}`,
    '',
    '### 2. CODE SUGGESTIONS (1-2 items)',
    'Specific bugs, performance issues, or missing features that hurt conversion.',
    'Be technically precise: name the file, function, or component. No vague suggestions.',
    '',
    '### 3. DESIGN/UI SUGGESTIONS (1-2 items)',
    'Specific page layout, visual hierarchy, or UX flow changes.',
    'Reference which page/component and what exactly to change.',
    '',
    '### 4. WORKFLOW SUGGESTIONS (1-2 items)',
    'Changes to how users move through the product (onboarding, quote flow, signup modal, etc).',
    'Focus on removing friction from the path to getting a quote.',
    '',
    '### 5. OPTIMIZATION SUGGESTIONS (1-2 items)',
    'SEO, page speed, email sequences, follow-up automation, etc.',
    '',
    'Priority guidance:',
    '- high = directly blocks or severely hurts signups/revenue',
    '- medium = meaningful improvement, do this week',
    '- low = nice to have, do when time permits',
    '',
    'Return ONLY valid JSON matching this EXACT shape:',
    '{',
    '  "brief": "3-4 sentence summary of what Merlin most needs to fix today",',
    '  "copy_suggestions": [',
    '    {"key": "hero_headline_prefix", "value": "...", "rationale": "...", "priority": "high"}',
    '  ],',
    '  "other_suggestions": [',
    '    {"type": "code", "title": "Short title", "description": "Specific actionable description", "rationale": "why this matters", "priority": "high"},',
    '    {"type": "design", "title": "...", "description": "...", "rationale": "...", "priority": "medium"},',
    '    {"type": "ui", "title": "...", "description": "...", "rationale": "...", "priority": "medium"},',
    '    {"type": "workflow", "title": "...", "description": "...", "rationale": "...", "priority": "high"},',
    '    {"type": "optimization", "title": "...", "description": "...", "rationale": "...", "priority": "low"}',
    '  ]',
    '}',
  ].join('\n');

  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 60_000);
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000, temperature: 0.7,
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

// ── Module 6: Save suggestions to DB (NO auto-apply) ────────────────────────
async function saveSuggestions(decision: Decision, reportId: string | null): Promise<number> {
  const rows: object[] = [];

  for (const s of decision.copy_suggestions ?? []) {
    if (!ALLOWED_KEYS.has(s.key) || !s.value?.trim()) {
      console.warn(`[growth] blocked copy key: ${s.key}`);
      continue;
    }
    rows.push({
      report_id:   reportId,
      type:        'copy',
      title:       `Update ${s.key}`,
      description: s.value,
      rationale:   s.rationale,
      priority:    s.priority ?? 'medium',
      status:      'pending',
      copy_key:    s.key,
      copy_value:  s.value,
    });
  }

  for (const s of decision.other_suggestions ?? []) {
    rows.push({
      report_id:   reportId,
      type:        s.type,
      title:       s.title,
      description: s.description,
      rationale:   s.rationale,
      priority:    s.priority ?? 'medium',
      status:      'pending',
      copy_key:    null,
      copy_value:  null,
    });
  }

  if (!rows.length) { console.log('[growth] no suggestions to save'); return 0; }
  const { error } = await sb.from('growth_suggestions').insert(rows);
  if (error) { console.error('[growth] saveSuggestions error:', error.message); return 0; }
  console.log(`[growth] saved ${rows.length} suggestions (pending review)`);
  return rows.length;
}

// ── Module 7: Daily email (every run) ─────────────────────────────────────────
async function sendDailyEmail(
  decision:      Decision,
  suggestCount:  number,
  funnel:        Awaited<ReturnType<typeof runFunnel>>,
  health:        Awaited<ReturnType<typeof runHealth>>,
) {
  if (!RESEND_KEY) { console.warn('[growth] No RESEND_KEY — skipping email'); return; }

  const priorityLabel = (p: string) =>
    p === 'high' ? '🔴 HIGH' : p === 'medium' ? '🟡 MED' : '⚪ LOW';

  const sectionHtml = (title: string, items: Array<{ title?: string; key?: string; value?: string; description: string; rationale: string; priority: string }>) => {
    if (!items.length) return '';
    return [
      `<h3 style="margin:18px 0 8px;color:#1e293b;border-bottom:1px solid #e2e8f0;padding-bottom:4px">${title}</h3>`,
      '<ul style="margin:0;padding:0 0 0 16px">',
      ...items.map(i => [
        `<li style="margin-bottom:10px">`,
        `<span style="font-size:11px;font-weight:700;color:#64748b">${priorityLabel(i.priority)}</span> `,
        `<b>${i.title ?? i.key}</b>`,
        i.key ? `<br><code style="font-size:12px;background:#f1f5f9;padding:2px 4px">${i.key}: ${String(i.value ?? '').slice(0, 120)}</code>` : '',
        `<br><span style="color:#475569">${i.description?.slice(0, 200) ?? ''}</span>`,
        `<br><small style="color:#94a3b8">Rationale: ${i.rationale?.slice(0, 160) ?? ''}</small>`,
        `</li>`,
      ].join('')),
      '</ul>',
    ].join('');
  };

  const copyItems = (decision.copy_suggestions ?? []).map(s => ({
    title: `Update ${s.key}`, key: s.key, value: s.value,
    description: s.value.slice(0, 200), rationale: s.rationale, priority: s.priority,
  }));
  const codeItems    = (decision.other_suggestions ?? []).filter(s => s.type === 'code');
  const designItems  = (decision.other_suggestions ?? []).filter(s => s.type === 'design' || s.type === 'ui');
  const workflowItems= (decision.other_suggestions ?? []).filter(s => s.type === 'workflow');
  const optItems     = (decision.other_suggestions ?? []).filter(s => s.type === 'optimization');

  const adminUrl = `${SITE_URL}/admin?tab=suggestions`;
  const dateStr  = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const html = [
    '<div style="font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;color:#1e293b">',
    `<div style="background:#0f172a;color:#fff;padding:24px 28px;border-radius:8px 8px 0 0">`,
    `<h1 style="margin:0 0 4px;font-size:22px">🧠 Merlin Growth Suggestions</h1>`,
    `<p style="margin:0;opacity:.7;font-size:14px">${dateStr}</p>`,
    `</div>`,
    `<div style="background:#f8fafc;padding:20px 28px;border:1px solid #e2e8f0">`,
    `<p style="margin:0 0 8px;font-size:15px;color:#334155">${decision.brief}</p>`,
    `<div style="display:flex;gap:12px;margin-top:12px">`,
    `<span style="background:#eff6ff;color:#1d4ed8;padding:4px 10px;border-radius:20px;font-size:12px">👥 ${funnel.totalUsers} users</span>`,
    `<span style="background:#eff6ff;color:#1d4ed8;padding:4px 10px;border-radius:20px;font-size:12px">📋 ${funnel.totalQuotes} quotes</span>`,
    `<span style="background:${health.score >= 80 ? '#f0fdf4;color:#166534' : '#fef2f2;color:#991b1b'};padding:4px 10px;border-radius:20px;font-size:12px">🏥 Health: ${health.score}/100</span>`,
    `<span style="background:#faf5ff;color:#6b21a8;padding:4px 10px;border-radius:20px;font-size:12px">💡 ${suggestCount} suggestions</span>`,
    `</div></div>`,
    `<div style="padding:20px 28px;border:1px solid #e2e8f0;border-top:none">`,
    sectionHtml('✍️ Copy Changes', copyItems),
    sectionHtml('💻 Code Improvements', codeItems),
    sectionHtml('🎨 Design & UI', designItems),
    sectionHtml('🔄 Workflow Changes', workflowItems),
    sectionHtml('⚡ Optimizations', optItems),
    `<div style="margin-top:24px;text-align:center">`,
    `<a href="${adminUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px">`,
    `Review &amp; Approve Suggestions →`,
    `</a>`,
    `<p style="margin:12px 0 0;font-size:12px;color:#94a3b8">None of these changes have been applied yet. You approve each one.</p>`,
    `</div></div></div>`,
  ].join('');

  await safeFetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: 'Merlin Growth <growth@merlinenergy.net>',
      to: [ADMIN_EMAIL],
      subject: `🧠 ${suggestCount} Merlin Growth Suggestions — ${dateStr}`,
      html,
    }),
  }, 15_000).then(r => console.log(r.ok ? `[growth] email sent to ${ADMIN_EMAIL}` : `[growth] email failed: ${r.status}`));
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
  let reportId:    string | null = null;
  let savedCount:  number        = 0;

  if (decision) {
    console.log(`\nBrief: ${decision.brief}`);
    const { data: rr } = await sb.from('growth_reports').insert({
      ran_at: startedAt, site_health_score: health.score,
      failed_routes: health.failedRoutes, total_users: funnel.totalUsers,
      total_quotes: funnel.totalQuotes, friction_signals: funnel.friction,
      market_headlines: headlines, growth_brief: decision.brief,
      raw: { health, funnel, decision },
    }).select('id').maybeSingle();
    reportId   = rr?.id ?? null;
    savedCount = await saveSuggestions(decision, reportId);
    await sendDailyEmail(decision, savedCount, funnel, health);
  }

  console.log(`\nGrowth loop complete — ${savedCount} suggestions saved for review\n`);
  return { savedCount, reportId, brief: decision?.brief ?? null };
}

// Allow direct execution: node agents/growth-loop.mjs
if (process.argv[1]?.match(/growth-loop\.(mjs|ts)$/)) {
  runGrowthLoop().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
