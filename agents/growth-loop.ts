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

const ALLOWED_KEYS = new Set([
  // Hero section
  'hero_headline_prefix', 'hero_accent_lines', 'hero_subtext',
  'hero_badge_text', 'hero_proof_items', 'hero_cta_primary',
  'hero_cta_secondary',
  // Sign-up modal — ALL four keys render live in the EmailCaptureModal form
  'modal_headline', 'modal_subtext', 'modal_cta_text', 'modal_social_proof',
  // Nav
  'nav_cta_text',
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
  const totalUsers      = s.totalUsers      ?? 0;
  const totalQuotes     = s.totalQuotes     ?? 0;
  const qualifiedLeads  = s.qualifiedLeads  ?? 0;
  const signupsToday    = s.signupsToday    ?? 0;
  const signupsThisWeek = s.signupsThisWeek ?? 0;
  const signupsPrevWeek = s.signupsPrevWeek ?? 0;
  const dailyAvgThisWeek = signupsThisWeek > 0 ? (signupsThisWeek / 7).toFixed(1) : '0';
  const weekTrend = signupsPrevWeek > 0
    ? ((signupsThisWeek - signupsPrevWeek) / signupsPrevWeek * 100).toFixed(0)
    : null;
  const friction: string[] = [];
  if (totalUsers === 0)                                              friction.push('CRITICAL: zero total users — signup may be broken');
  if (signupsToday === 0 && new Date().getUTCHours() >= 14)         friction.push('ZERO signups today (past 7am PT) — modal or CTA likely broken');
  if (weekTrend !== null && Number(weekTrend) < -20)                friction.push(`Sign-up velocity DOWN ${Math.abs(Number(weekTrend))}% vs last week`);
  if (totalUsers > 5 && totalQuotes / totalUsers < 0.2)             friction.push('Quote conversion below 20% — wizard or CTA has friction');
  if (totalQuotes > 5 && qualifiedLeads / totalQuotes < 0.1)        friction.push('Lead qualification rate below 10%');
  return { totalUsers, totalQuotes, qualifiedLeads, signupsToday, signupsThisWeek, signupsPrevWeek, dailyAvgThisWeek, weekTrend, friction };
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
  const signupTrendLine = funnel.weekTrend !== null
    ? `${Number(funnel.weekTrend) >= 0 ? '▲' : '▼'} ${Math.abs(Number(funnel.weekTrend))}% vs prior week`
    : 'no prior-week baseline yet';

  const prompt = [
    '# MERLIN ENERGY — DAILY AI GROWTH ANALYST',
    '',
    'You are the growth AI for Merlin Energy, a B2B SaaS that delivers instant',
    'CFO-ready BESS/solar energy quotes in 60 seconds — free, replacing $500/hr consultants.',
    'Target buyer: CFO or Ops Director at a carwash, warehouse, hotel, or manufacturer',
    'who is furious about rising utility bills and has no fast way to evaluate storage/solar.',
    '',
    '## ★ YOUR ONE JOB: INCREASE SIGN-UPS PER DAY ★',
    'Every suggestion must answer: does this move a visitor to "signed up" faster?',
    'If it doesn\'t serve that goal, skip it.',
    '',
    '## LIVE SIGNUP METRICS (your primary KPIs)',
    `  Signups today:         ${funnel.signupsToday}`,
    `  Signups this week:     ${funnel.signupsThisWeek}  (daily avg: ${funnel.dailyAvgThisWeek}/day)`,
    `  Signups prior week:    ${funnel.signupsPrevWeek}  trend: ${signupTrendLine}`,
    `  Total users all-time:  ${funnel.totalUsers}`,
    `  Total quotes run:      ${funnel.totalQuotes}`,
    `  Qualified leads:       ${funnel.qualifiedLeads}`,
    funnel.totalQuotes > 0
      ? `  Quote→Signup rate:     ${((funnel.totalUsers / funnel.totalQuotes) * 100).toFixed(1)}%`
      : '  Quote→Signup rate:     N/A (no quotes yet)',
    '',
    '## FRICTION SIGNALS',
    funnel.friction.length ? funnel.friction.map(f => `  ⚠ ${f}`).join('\n') : '  None detected',
    '',
    '## SITE HEALTH',
    `  Score: ${health.score}/100` + (health.failedRoutes.length
      ? ' | BROKEN: ' + health.failedRoutes.map((x: { name: string }) => x.name).join(', ')
      : ' | all routes OK'),
    '',
    '## THE SIGN-UP FUNNEL (exact steps a user takes)',
    '  1. Visitor lands → reads hero headline + subtext',
    '  2. Clicks hero CTA button → business/ZIP search appears',
    '  3. Types business name or ZIP → clicks "Get My Report"',
    '  4. Completes 5-6 step quote wizard',
    '  5. Hits EmailCaptureModal → sees modal_headline at top',
    '  6. Reads modal_subtext → decides whether to fill the 3-field form',
    '  7. Clicks modal_cta_text button → BECOMES A USER',
    '  8. Reads modal_social_proof at bottom → reassured or abandons',
    '',
    '  ► Steps 5-8 are your HIGHEST leverage. The user already completed the quote.',
    '    They are warm and motivated. Modal copy is what closes or loses them.',
    '    Prioritize modal keys above all others.',
    '',
    '## ENERGY MARKET HEADLINES (tie copy to real pain happening NOW)',
    ...headlines.slice(0, 8).map(h => `  - ${h}`),
    '',
    '## CURRENT LIVE COPY (exactly what users see right now)',
    ...Object.entries(copy).map(([k, v]) => `  ${k}: ${v.slice(0, 140)}`),
    '',
    '## COPY KEY GUIDE (what each key controls)',
    '  modal_headline     → H2 title at top of sign-up form. Make it about VALUE received.',
    '    ✓ "Your Energy Savings Report Is Ready"  ✗ "Create an Account"',
    '  modal_subtext      → Line below title. Kill anxiety. Tell them what happens next.',
    '    ✓ "We\'ll email your CFO-ready report — no salesperson will call."  ✗ "Join today"',
    '  modal_cta_text     → Submit button. Feel like getting something, not giving.',
    '    ✓ "Send Me My Free Report"  ✗ "Create Account & Download"',
    '  modal_social_proof → Trust line at bottom. Kill cost/spam/commitment objections.',
    '    ✓ "Free forever · No credit card · Unsubscribe anytime"  ✗ generic',
    '  hero_cta_primary   → Big button on homepage. Must feel zero-risk and urgent.',
    '  hero_accent_lines  → JSON array of exactly 3 phrases (max 6 words) completing "Reduce Utility Risk ___"',
    '  hero_proof_items   → JSON array of exactly 3 short social-proof signals',
    `  All allowed keys: ${allowedCopyKeys}`,
    '',
    '## YOUR OUTPUT TASKS',
    '',
    '### 1. COPY SUGGESTIONS (3-5 items, modal keys first)',
    '',
    '### 2. CODE IMPROVEMENTS (1-2 items)',
    '  Only bugs or missing features that directly block sign-ups.',
    '  Be precise: name the file and component. Example: "EmailCaptureModal.tsx — the',
    '  3-field requirement (name+email+company) adds friction; suggest email-only first,',
    '  collect name/company post-signup in onboarding step."',
    '',
    '### 3. DESIGN & UI CHANGES (1-2 items)',
    '  Visual changes that reduce friction at the modal or hero.',
    '  Examples: trust badge icons, progress bar in wizard, modal button color,',
    '  social proof logos, urgency indicator (X people got a report today).',
    '',
    '### 4. WORKFLOW CHANGES (1-2 items)',
    '  User-journey changes that increase conversion.',
    '  Examples: show modal earlier, guest/preview mode before requiring email,',
    '  pre-fill company field from business search, add "save & continue later" option.',
    '',
    '### 5. OPTIMIZATIONS (1 item)',
    '  One specific SEO, page speed, or follow-up email action.',
    '',
    'Priority:',
    '  high   = will directly increase sign-ups this week',
    '  medium = meaningful improvement, implement soon',
    '  low    = nice to have, do when time permits',
    '',
    'Return ONLY valid JSON:',
    '{',
    '  "brief": "3-4 sentences: current signup metric status, biggest friction, your #1 recommendation today",',
    '  "copy_suggestions": [',
    '    {"key": "modal_headline", "value": "...", "rationale": "...", "priority": "high"}',
    '  ],',
    '  "other_suggestions": [',
    '    {"type": "code",         "title": "...", "description": "...", "rationale": "...", "priority": "high"},',
    '    {"type": "design",       "title": "...", "description": "...", "rationale": "...", "priority": "medium"},',
    '    {"type": "ui",           "title": "...", "description": "...", "rationale": "...", "priority": "medium"},',
    '    {"type": "workflow",     "title": "...", "description": "...", "rationale": "...", "priority": "high"},',
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
