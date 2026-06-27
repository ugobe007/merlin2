#!/usr/bin/env node
/**
 * MERLIN GROWTH LOOP AGENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs on a schedule (or on-demand via POST /api/admin/run-growth-loop).
 *
 * Four modules, all writing results to Supabase `growth_reports` table:
 *
 *  1. SITE HEALTH   — tests every critical user flow, flags broken pages/APIs
 *  2. FUNNEL AUDIT  — reads signup + quote metrics, scores conversion health
 *  3. MARKET PULSE  — scrapes energy-sector headlines, extracts pain points
 *                     that map to Merlin capabilities → growth angles
 *  4. GROWTH BRIEF  — feeds all of the above to GPT-4o, gets back:
 *                     • top 3 actionable fixes this week
 *                     • 3 market angles to test in copy/outreach
 *                     • one headline A/B test suggestion
 *
 * Output: JSON written to stdout + Supabase growth_reports row.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.MERLIN_BASE_URL ?? 'https://merlin2.fly.dev';
const OPENAI_KEY = process.env.VITE_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { persistSession: false } }
);

// ── helpers ───────────────────────────────────────────────────────────────────
async function get(url: string, timeoutMs = 12_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    return { ok: r.ok, status: r.status, body: await r.text().catch(() => '') };
  } catch (e: unknown) {
    clearTimeout(t);
    return { ok: false, status: 0, body: String(e) };
  }
}

async function post(url: string, body: unknown, timeoutMs = 20_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return { ok: r.ok, status: r.status, body: await r.text().catch(() => '') };
  } catch (e: unknown) {
    clearTimeout(t);
    return { ok: false, status: 0, body: String(e) };
  }
}

// ── MODULE 1: Site Health ─────────────────────────────────────────────────────
async function runSiteHealth() {
  console.log('\n🏥 MODULE 1: Site Health');
  const checks = [
    { name: 'homepage',        url: BASE_URL },
    { name: 'pricing page',    url: `${BASE_URL}/pricing` },
    { name: 'quote tool',      url: `${BASE_URL}/quote` },
    { name: 'vendor portal',   url: `${BASE_URL}/vendor-portal` },
    { name: 'health API',      url: `${BASE_URL}/api/health` },
    { name: 'opportunities API', url: `${BASE_URL}/api/opportunities?limit=1` },
  ];

  const results = await Promise.all(
    checks.map(async (c) => {
      const r = await get(c.url);
      const status = r.ok ? '✅' : '❌';
      console.log(`  ${status} ${c.name.padEnd(22)} HTTP ${r.status}`);
      return { ...c, ...r };
    })
  );

  const failed = results.filter((r) => !r.ok);
  return {
    totalChecks: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: failed.length,
    failedRoutes: failed.map((r) => ({ name: r.name, url: r.url, status: r.status })),
    score: Math.round((results.filter((r) => r.ok).length / results.length) * 100),
  };
}

// ── MODULE 2: Funnel Audit ────────────────────────────────────────────────────
async function runFunnelAudit() {
  console.log('\n📊 MODULE 2: Funnel Audit');
  const r = await get(`${BASE_URL}/api/admin/stats`);
  let stats: Record<string, unknown> = {};
  try { stats = JSON.parse(r.body)?.stats ?? {}; } catch (_e) { /* non-JSON response */ }

  const totalUsers    = (stats.totalUsers as number) ?? 0;
  const totalQuotes   = (stats.totalQuotes as number) ?? 0;
  const qualifiedLeads = (stats.qualifiedLeads as number) ?? 0;

  // Rough funnel conversion
  const quoteRate   = totalUsers > 0 ? ((totalQuotes / totalUsers) * 100).toFixed(1) : '—';
  const leadRate    = totalQuotes > 0 ? ((qualifiedLeads / totalQuotes) * 100).toFixed(1) : '—';

  console.log(`  Users:            ${totalUsers}`);
  console.log(`  Quotes generated: ${totalQuotes}  (${quoteRate}% of users)`);
  console.log(`  Qualified leads:  ${qualifiedLeads}  (${leadRate}% of quotes)`);

  // Friction signals
  const friction: string[] = [];
  if (totalUsers === 0)      friction.push('CRITICAL: zero users in DB — signup flow may be broken');
  if (totalUsers > 0 && totalQuotes === 0) friction.push('Users signing up but not generating quotes — onboarding drop-off');
  if (Number(quoteRate) < 20) friction.push('Quote conversion below 20% — consider removing friction from quote flow');
  if (Number(leadRate) < 10)  friction.push('Low quote→lead rate — scoring threshold may be too high or ICP mismatch');

  return { totalUsers, totalQuotes, qualifiedLeads, quoteRate, leadRate, frictionSignals: friction };
}

// ── MODULE 3: Market Pulse ────────────────────────────────────────────────────
const MARKET_FEEDS = [
  'https://www.greentechmedia.com/rss/all',
  'https://electrek.co/feed',
  'https://www.pv-tech.org/feed',
  'https://rss.politico.com/energy.xml',
];

async function runMarketPulse() {
  console.log('\n🌍 MODULE 3: Market Pulse');
  const headlines: string[] = [];

  await Promise.all(
    MARKET_FEEDS.map(async (feed) => {
      const r = await get(feed, 8_000);
      if (!r.ok) return;
      // Pull <title> tags from RSS (no XML parser needed)
      const matches = r.body.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]>|<title>([^<]+)<\/title>/g);
      let count = 0;
      for (const m of matches) {
        const title = (m[1] || m[2] || '').trim();
        if (title && title.length > 20 && count++ < 5) headlines.push(title);
      }
    })
  );

  console.log(`  Headlines fetched: ${headlines.length}`);
  headlines.slice(0, 8).forEach((h) => console.log(`  • ${h.slice(0, 90)}`));

  return { headlineCount: headlines.length, headlines: headlines.slice(0, 20) };
}

// ── MODULE 4: Growth Brief (GPT-4o) ─────────────────────────────────────────
async function runGrowthBrief(siteHealth: ReturnType<typeof runSiteHealth> extends Promise<infer T> ? T : never,
                               funnel: ReturnType<typeof runFunnelAudit> extends Promise<infer T> ? T : never,
                               market: ReturnType<typeof runMarketPulse> extends Promise<infer T> ? T : never) {
  console.log('\n🤖 MODULE 4: Growth Brief (GPT-4o)');

  if (!OPENAI_KEY) {
    console.log('  ⚠️  No OPENAI_API_KEY — skipping AI brief');
    return { skipped: true, reason: 'No OpenAI key' };
  }

  const prompt = `You are a growth advisor for Merlin Energy — a B2B SaaS platform that helps industrial and commercial businesses (carwashes, warehouses, food manufacturers, fleet operators) size, price, and procure Battery Energy Storage Systems (BESS) and solar.

Merlin's value prop: instant AI-powered BESS/solar quotes, vendor matching, and project workflow — replacing expensive consultants.

Here is today's system snapshot:

## Site Health (score: ${siteHealth.score}/100)
${siteHealth.failed > 0 ? `BROKEN ROUTES:\n${siteHealth.failedRoutes.map((r) => `- ${r.name}: HTTP ${r.status}`).join('\n')}` : 'All routes healthy.'}

## Signup Funnel
- Total users: ${funnel.totalUsers}
- Quotes generated: ${funnel.totalQuotes} (${funnel.quoteRate}% of users)
- Qualified leads routed to vendors: ${funnel.qualifiedLeads}
- Friction signals: ${funnel.frictionSignals.join('; ') || 'none'}

## Market Headlines (past 24h)
${market.headlines.slice(0, 10).map((h) => `- ${h}`).join('\n')}

Give me a tight growth brief:

1. TOP 3 FIXES THIS WEEK — specific, technical, ordered by user-acquisition impact
2. 3 MARKET ANGLES — pain points from the headlines above that Merlin should be messaging right now (with example copy hook)
3. ONE HEADLINE A/B TEST — current hero headline vs. a sharper alternative to test

Be direct. No fluff. Max 400 words total.`;

  const r = await post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 600,
    temperature: 0.7,
  }, 30_000);

  if (!r.ok) {
    console.log(`  ❌ OpenAI error: ${r.status}`);
    return { skipped: true, reason: `OpenAI HTTP ${r.status}` };
  }

  try {
    const json = JSON.parse(r.body);
    const brief = json.choices?.[0]?.message?.content ?? '';
    console.log('\n' + brief);
    return { brief };
  } catch {
    return { skipped: true, reason: 'Failed to parse OpenAI response' };
  }
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const startedAt = new Date().toISOString();
  console.log('═'.repeat(60));
  console.log('🚀 MERLIN GROWTH LOOP');
  console.log(`   ${startedAt}`);
  console.log('═'.repeat(60));

  const [siteHealth, funnel, market] = await Promise.all([
    runSiteHealth(),
    runFunnelAudit(),
    runMarketPulse(),
  ]);

  const growthBrief = await runGrowthBrief(siteHealth, funnel, market);

  const report = {
    ran_at: startedAt,
    site_health: siteHealth,
    funnel,
    market_pulse: { headlineCount: market.headlineCount, headlines: market.headlines },
    growth_brief: growthBrief,
  };

  // Persist to Supabase
  const { error } = await supabase.from('growth_reports').insert({
    ran_at: startedAt,
    site_health_score: siteHealth.score,
    failed_routes: siteHealth.failedRoutes,
    total_users: funnel.totalUsers,
    total_quotes: funnel.totalQuotes,
    friction_signals: funnel.frictionSignals,
    market_headlines: market.headlines,
    growth_brief: (growthBrief as { brief?: string }).brief ?? null,
    raw: report,
  });

  if (error) console.warn('[growth-loop] DB write error:', error.message);
  else console.log('\n✅ Report saved to growth_reports');

  console.log('\n' + '═'.repeat(60));
  console.log('📋 SUMMARY');
  console.log(`  Site health:    ${siteHealth.score}/100 (${siteHealth.failed} failed)`);
  console.log(`  Users:          ${funnel.totalUsers}`);
  console.log(`  Quotes:         ${funnel.totalQuotes}`);
  console.log(`  Headlines:      ${market.headlineCount}`);
  console.log('═'.repeat(60));

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
