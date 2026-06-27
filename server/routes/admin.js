/**
 * Admin Stats Route
 * GET /api/admin/stats
 *
 * Uses the service-role key so it bypasses RLS and can count across all users,
 * quotes, and subscriptions. Never expose the service-role key to the browser.
 */
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service-role credentials');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Tier → monthly revenue estimate
const TIER_MRR = {
  free: 0,
  FREE: 0,
  starter: 49,
  pro: 99,
  advanced: 149,
  business: 199,
  // legacy aliases from earlier code
  semi_premium: 49,
  premium: 199,
};

router.get('/admin/stats', async (req, res) => {
  try {
    const sb = getServiceClient();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Signups are split across two tables (legacy `users` + new `user_profiles`).
    // We union them by email to deduplicate, using user_profiles as authoritative
    // for tier, falling back to `users` for any email not yet in user_profiles.
    const [profilesRes, legacyUsersRes, quotesTodayRes, totalQuotesRes, totalLeadsRes] = await Promise.all([
      sb.from('user_profiles').select('email, tier'),
      sb.from('users').select('email, tier'),
      sb
        .from('saved_quotes')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
      sb.from('saved_quotes').select('id', { count: 'exact', head: true }),
      sb
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'qualified'),
    ]);

    // Merge: user_profiles wins on duplicates (keyed by email)
    const emailMap = new Map();
    for (const u of (legacyUsersRes.data ?? [])) {
      emailMap.set((u.email ?? '').toLowerCase(), u);
    }
    for (const u of (profilesRes.data ?? [])) {
      emailMap.set((u.email ?? '').toLowerCase(), u); // overwrite with authoritative row
    }
    const allUsers = [...emailMap.values()];
    const totalUsers = allUsers.length;

    // Count by tier (handle both 'FREE'/'free' and new tiers)
    const freeUsers = allUsers.filter(
      (u) => !u.tier || u.tier.toLowerCase() === 'free'
    ).length;
    const paidUsers = allUsers.filter(
      (u) => u.tier && u.tier.toLowerCase() !== 'free'
    );

    const tierBreakdown = {};
    for (const u of allUsers) {
      const t = (u.tier || 'free').toLowerCase();
      tierBreakdown[t] = (tierBreakdown[t] ?? 0) + 1;
    }

    // MRR = sum of tier price for each paid user
    const monthlyRevenue = paidUsers.reduce((sum, u) => {
      const t = (u.tier || 'free').toLowerCase();
      return sum + (TIER_MRR[t] ?? 0);
    }, 0);

    res.json({
      success: true,
      stats: {
        totalUsers,
        freeUsers,
        paidUsers: paidUsers.length,
        tierBreakdown,
        quotesGeneratedToday: quotesTodayRes.count ?? 0,
        totalQuotes: totalQuotesRes.count ?? 0,
        qualifiedLeads: totalLeadsRes.count ?? 0,
        monthlyRevenue,
        activePaidSubs: paidUsers.length,
      },
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── In-memory growth loop job state (same fire-and-forget pattern as lead-matcher)
let _growthJob = {
  running: false, startedAt: null, finishedAt: null, success: null, error: null,
};

// POST /api/admin/run-growth-loop  — kick off the growth loop agent
router.post('/admin/run-growth-loop', async (req, res) => {
  if (_growthJob.running) {
    return res.status(409).json({ success: false, message: 'Growth loop already running', startedAt: _growthJob.startedAt });
  }

  const { spawn } = await import('child_process');
  const { fileURLToPath } = await import('url');
  const { dirname, resolve } = await import('path');
  const __dirname = dirname(fileURLToPath(import.meta.url));

  _growthJob = { running: true, startedAt: new Date().toISOString(), finishedAt: null, success: null, error: null };

  res.status(202).json({
    success: true,
    message: 'Growth loop started — poll GET /api/admin/growth-loop-status',
    startedAt: _growthJob.startedAt,
    machineId: process.env.FLY_MACHINE_ID ?? null,
  });

  let stderr = '';
  const child = spawn('node', ['agents/growth-loop.mjs'], {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env },
  });

  child.stdout.on('data', (c) => process.stdout.write(c));
  child.stderr.on('data', (c) => { stderr += c.toString(); process.stderr.write(c); });
  child.on('close', (code) => {
    _growthJob = { running: false, startedAt: _growthJob.startedAt,
                   finishedAt: new Date().toISOString(), success: code === 0,
                   error: code !== 0 ? stderr.slice(-300) : null };
    console.log(`[growth-loop] finished code=${code}`);
  });
  child.on('error', (e) => {
    _growthJob = { ..._growthJob, running: false, finishedAt: new Date().toISOString(), success: false, error: e.message };
  });
});

// GET /api/admin/growth-loop-status
router.get('/admin/growth-loop-status', (_req, res) => res.json(_growthJob));

// GET /api/admin/growth-reports  — last N reports from DB
router.get('/admin/growth-reports', async (req, res) => {
  try {
    const sb = getServiceClient();
    const limit = Math.min(Number(req.query.limit ?? 10), 50);
    const { data, error } = await sb
      .from('growth_reports')
      .select('id, ran_at, site_health_score, total_users, total_quotes, friction_signals, growth_brief')
      .order('ran_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json({ success: true, reports: data ?? [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
